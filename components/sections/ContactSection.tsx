'use client';

import { useEffect, useRef, useState } from 'react';
import type { Section } from '@/lib/types';
import { ck } from '@/lib/content-key';

interface Props {
  section: Section;
  captchaProvider?: string;
  captchaSiteKey?: string;
  lang?: string;
}

// Textes par langue (fallback côté client si pas de prop lang)
const TEXTS: Record<string, Record<string, string>> = {
  fr: {
    namePlaceholder: 'Votre nom',
    emailPlaceholder: 'Votre email',
    phonePlaceholder: 'Votre telephone',
    locationPlaceholder: 'Votre ville',
    messagePlaceholder: 'Decrivez votre projet...',
    submit: 'Envoyer la demande',
    sending: 'Envoi en cours...',
    success: 'Votre demande a bien été envoyée ! Nous vous répondrons rapidement.',
    captchaError: 'Veuillez valider le captcha.',
  },
  en: {
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Your email',
    phonePlaceholder: 'Your phone',
    locationPlaceholder: 'Your city',
    messagePlaceholder: 'Describe your project...',
    submit: 'Send request',
    sending: 'Sending...',
    success: 'Your request has been sent! We\'ll get back to you shortly.',
    captchaError: 'Please complete the captcha.',
  },
};

export function ContactSection({ section, captchaProvider, captchaSiteKey, lang: langProp }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const lang = langProp || 'fr';
  const txt = TEXTS[lang] || TEXTS.fr;

  // Charger le script captcha
  useEffect(() => {
    if (!captchaProvider || !captchaSiteKey) return;
    const scripts: Record<string, string> = {
      turnstile: 'https://challenges.cloudflare.com/turnstile/v0/api.js',
      recaptcha: 'https://www.google.com/recaptcha/api.js',
      hcaptcha: 'https://js.hcaptcha.com/1/api.js',
    };
    const src = scripts[captchaProvider];
    if (!src) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, [captchaProvider, captchaSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;

    // Vérifier le captcha
    const tokenFields: Record<string, string> = {
      turnstile: 'cf-turnstile-response',
      recaptcha: 'g-recaptcha-response',
      hcaptcha: 'h-captcha-response',
    };

    let token: string | undefined;
    if (captchaProvider && captchaSiteKey && tokenFields[captchaProvider]) {
      const field = form.querySelector<HTMLInputElement>(
        `[name="${tokenFields[captchaProvider]}"]`
      );
      token = field?.value;
      if (!token) {
        setStatus('error');
        setErrorMsg(txt.captchaError);
        return;
      }
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const formData = new FormData(form);
      const body: Record<string, string> = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        message: formData.get('message') as string,
        website: formData.get('website') as string || '',
      };

      if (token && captchaProvider && tokenFields[captchaProvider]) {
        body[tokenFields[captchaProvider]] = token;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('success');
      } else {
        throw new Error(data.error || txt.captchaError);
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
      // Reset captcha
      const w = window as unknown as Record<string, { reset: () => void }>;
      if (w.turnstile) w.turnstile.reset();
      if (w.grecaptcha) w.grecaptcha.reset();
      if (w.hcaptcha) w.hcaptcha.reset();
    }
  };

  return (
    <section className="section section-contact" id="contact">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="section-title" data-content-key={ck(section.contentId, 'contact-title')}>
          {lang === 'en' ? 'Get in touch' : 'Demandez votre devis gratuit'}
        </h2>
        <form className="contact-form max-w-[750px] mx-auto" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-row grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
            <div className="form-group mb-8">
              <input type="text" name="name" placeholder={txt.namePlaceholder} required />
            </div>
            <div className="form-group mb-8">
              <input type="email" name="email" placeholder={txt.emailPlaceholder} required />
            </div>
          </div>
          <div className="form-row grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
            <div className="form-group mb-8">
              <input type="tel" name="phone" placeholder={txt.phonePlaceholder} />
            </div>
            <div className="form-group mb-8">
              <input type="text" name="location" placeholder={txt.locationPlaceholder} />
            </div>
          </div>
          <div className="form-group mb-8">
            <textarea name="message" placeholder={txt.messagePlaceholder} rows={5} required />
          </div>

          {/* Honeypot anti-bot */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {captchaProvider === 'turnstile' && captchaSiteKey && (
            <div className="form-group text-center">
              <div className="cf-turnstile" data-sitekey={captchaSiteKey} data-theme="light" />
            </div>
          )}
          {captchaProvider === 'recaptcha' && captchaSiteKey && (
            <div className="form-group text-center">
              <div className="g-recaptcha" data-sitekey={captchaSiteKey} />
            </div>
          )}
          {captchaProvider === 'hcaptcha' && captchaSiteKey && (
            <div className="form-group text-center">
              <div className="h-captcha" data-sitekey={captchaSiteKey} />
            </div>
          )}

          {status === 'error' && errorMsg && (
            <div className="contact-msg contact-msg--error">{errorMsg}</div>
          )}

          {status === 'success' ? (
            <div className="contact-msg contact-msg--success text-center">
              {txt.success}
            </div>
          ) : (
            <div className="text-center">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={status === 'sending'}
                style={{ pointerEvents: status === 'sending' ? 'none' : undefined }}
              >
                {status === 'sending' ? txt.sending : txt.submit}
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
