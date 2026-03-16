export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { withAuth } from '@/lib/auth';

function formatSmtpError(raw: string): string {
  // Identifiants incorrects (Gmail, Outlook, etc.)
  if (/BadCredentials|Username and Password not accepted|Invalid login|535/i.test(raw)) {
    const supportUrl = raw.match(/https?:\/\/\S+/)?.[0];
    return supportUrl
      ? `Identifiants incorrects.\n${supportUrl}`
      : 'Identifiants incorrects — vérifiez votre email et mot de passe / app token.';
  }
  // Connexion refusée (mauvais host/port)
  if (/ECONNREFUSED|ENOTFOUND|connect ETIMEDOUT/i.test(raw)) {
    return 'Impossible de joindre le serveur SMTP — vérifiez le host et le port.';
  }
  // Certificat SSL
  if (/CERT|SSL|TLS/i.test(raw)) {
    return 'Erreur SSL/TLS — essayez de changer le port ou l\'option SSL.';
  }
  // Timeout
  if (/timeout/i.test(raw)) {
    return 'Délai dépassé — le serveur SMTP ne répond pas.';
  }
  return raw;
}

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { host, port, secure, user, pass: rawPass, from, to } = await req.json();

    if (!host || !user || !to) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    }

    // Si le front renvoie la valeur sentinelle, utiliser le vrai mot de passe stocké
    let pass = rawPass;
    if (rawPass === '••set••') {
      const { readSiteConfig } = await import('@/lib/data');
      const config = readSiteConfig();
      pass = config.mail?.pass ?? '';
    }

    if (!pass) {
      return NextResponse.json({ error: 'Mot de passe non configuré' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      auth: { user, pass },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    await transporter.sendMail({
      from: from || user,
      to,
      subject: 'Nimble — Test SMTP',
      html: `<p>Ce mail confirme que la configuration SMTP fonctionne correctement.</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: formatSmtpError(raw) }, { status: 500 });
  }
});
