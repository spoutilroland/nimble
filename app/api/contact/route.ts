export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { readSiteConfig, escapeHtml } from '@/lib/data';

// Rate limiting in-memory
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 min
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Vérification captcha
    const siteConfig = await readSiteConfig();
    const captchaProvider = siteConfig.captcha?.provider;
    const captchaSecret = process.env.CAPTCHA_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;

    if (captchaProvider && captchaProvider !== 'none' && captchaSecret) {
      let token: string | null = null;
      let verifyUrl: string | null = null;

      if (captchaProvider === 'turnstile') {
        token = body['cf-turnstile-response'];
        verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
      } else if (captchaProvider === 'recaptcha') {
        token = body['g-recaptcha-response'];
        verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
      } else if (captchaProvider === 'hcaptcha') {
        token = body['h-captcha-response'];
        verifyUrl = 'https://hcaptcha.com/siteverify';
      }

      if (!token) {
        return NextResponse.json({ error: 'Captcha requis' }, { status: 400 });
      }

      const verifyRes = await fetch(verifyUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: captchaSecret, response: token, remoteip: ip }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json({ error: 'Verification captcha echouee' }, { status: 400 });
      }
    }

    // Email — priorité : siteConfig.mail, fallback env vars
    const mailConfig = siteConfig.mail;

    const emailHost = mailConfig?.host || process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = mailConfig?.port || parseInt(process.env.EMAIL_PORT || '587');
    const emailSecure = mailConfig?.secure ?? (process.env.EMAIL_SECURE === 'true');
    const emailUser = mailConfig?.user || process.env.EMAIL_USER;
    const emailPass = mailConfig?.pass || process.env.EMAIL_PASS;
    const emailFrom = mailConfig?.from || process.env.EMAIL_FROM || 'noreply@nimble.com';
    const emailTo = mailConfig?.to || process.env.EMAIL_TO || 'admin@nimble.com';

    if (!emailUser || !emailPass) {
      console.log('Email not configured. Contact form data:', { name, email, phone, message });
      return NextResponse.json({
        success: true,
        message: 'Message received (email not configured in demo mode)',
      });
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: { user: emailUser, pass: emailPass },
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || '');
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: emailFrom,
      to: emailTo,
      subject: `Nouveau message de ${safeName}`,
      html: `
        <h2>Nouveau message via le formulaire de contact</h2>
        <p><strong>Nom :</strong> ${safeName}</p>
        <p><strong>Email :</strong> ${safeEmail}</p>
        <p><strong>Téléphone :</strong> ${safePhone || 'Non renseigné'}</p>
        <p><strong>Message :</strong></p>
        <p>${safeMessage}</p>
      `,
    });

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
