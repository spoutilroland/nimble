export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import fsp from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { readSetupConfig, writeSetupConfig } from '@/lib/data/setup';
import { readSiteConfig, writeSiteConfig } from '@/lib/data/site';
import { writeAdminHash } from '@/lib/data/admin';
import { hashPassword } from '@/lib/auth/password';

const SetupPayloadSchema = z.object({
  password: z.string().min(8),
  siteName: z.string().min(1),
  tagline: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  contactEnabled: z.boolean().optional(),
  mail: z
    .object({
      host: z.string(),
      port: z.number(),
      secure: z.boolean(),
      user: z.string(),
      pass: z.string(),
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  captchaProvider: z.enum(['none', 'turnstile', 'recaptcha', 'hcaptcha']).optional(),
  captchaSiteKey: z.string().optional(),
  captchaSecretKey: z.string().optional(),
});

export async function GET() {
  const setup = readSetupConfig();
  return NextResponse.json({ setupDone: setup.setupDone });
}

export async function POST(req: NextRequest) {
  // Exécution unique : refuser si déjà fait
  const existing = readSetupConfig();
  if (existing.setupDone) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = SetupPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    // S'assurer que data/ existe (premier déploiement sur Hostinger)
    const dataDir = path.join(process.cwd(), 'data');
    await fsp.mkdir(dataDir, { recursive: true });

    // Hash du mot de passe admin
    const passwordHash = await hashPassword(data.password);
    await writeAdminHash(passwordHash);

    // Mise à jour site.json
    const siteConfig = readSiteConfig();
    siteConfig.business.name = data.siteName;
    siteConfig.business.tagline = data.tagline ?? '';
    siteConfig.business.email = data.email ?? '';
    siteConfig.business.phone = data.phone ?? '';

    if (data.captchaProvider && data.captchaProvider !== 'none') {
      siteConfig.captcha = {
        provider: data.captchaProvider,
        siteKey: data.captchaSiteKey ?? '',
        secretKey: data.captchaSecretKey ?? '',
      };
    }

    if (data.contactEnabled && data.mail) {
      siteConfig.mail = {
        enabled: true,
        host: data.mail.host,
        port: data.mail.port,
        secure: data.mail.secure,
        user: data.mail.user,
        pass: data.mail.pass,
        from: data.mail.from,
        to: data.mail.to,
      };
    }

    await writeSiteConfig(siteConfig);

    // Génération du slug admin aléatoire (6 chars)
    const randomSlug = Math.random().toString(36).slice(2, 8);
    const adminSlug = `back-${randomSlug}`;

    // Écriture dans data/setup.json
    await writeSetupConfig({ setupDone: true, adminSlug });

    // Écriture de ADMIN_SLUG dans .env.local
    const envFile = path.join(process.cwd(), '.env.local');
    let envContent = '';
    try {
      envContent = await fsp.readFile(envFile, 'utf8');
    } catch {
      // fichier inexistant, on part d'un contenu vide
    }

    if (/^ADMIN_SLUG=/m.test(envContent)) {
      envContent = envContent.replace(/^ADMIN_SLUG=.*/m, `ADMIN_SLUG=${adminSlug}`);
    } else {
      envContent = envContent.trimEnd() + (envContent ? '\n' : '') + `ADMIN_SLUG=${adminSlug}\n`;
    }
    await fsp.writeFile(envFile, envContent, 'utf8').catch(() => {
      // .env.local non critique : adminSlug est déjà dans data/setup.json
    });

    return NextResponse.json({ adminUrl: `/${adminSlug}` });
  } catch (err) {
    console.error('[setup] POST error:', err);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la configuration. Vérifiez les permissions du dossier data/.' },
      { status: 500 }
    );
  }
}
