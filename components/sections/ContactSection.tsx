'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  captchaProvider?: string;
  captchaSiteKey?: string;
}

export function ContactSection({ captchaProvider, captchaSiteKey }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg('Veuillez valider le captcha.');
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
        throw new Error(data.error || "Erreur lors de l'envoi");
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

  if (status === 'success') {
    return (
      <section className="section section-contact" id="contact">
        <div className="max-w-[1200px] mx-auto px-5">
          <p className="contact-msg contact-msg--success">
            Votre demande a bien ete envoyee ! Nous vous repondrons rapidement.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="section section-contact" id="contact">
      <div className="max-w-[1200px] mx-auto px-5">
        <h2 className="section-title" data-content-key="contact-title">
          Demandez votre devis gratuit
        </h2>
        <form className="contact-form max-w-[750px] mx-auto" ref={formRef} onSubmit={handleSubmit}>
          <div className="form-row grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
            <div className="form-group mb-8">
              <input type="text" name="name" placeholder="Votre nom" required />
            </div>
            <div className="form-group mb-8">
              <input type="email" name="email" placeholder="Votre email" required />
            </div>
          </div>
          <div className="form-row grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-8">
            <div className="form-group mb-8">
              <input type="tel" name="phone" placeholder="Votre telephone" />
            </div>
            <div className="form-group mb-8">
              <input type="text" name="location" placeholder="Votre ville" />
            </div>
          </div>
          <div className="form-group mb-8">
            <textarea name="message" placeholder="Decrivez votre projet..." rows={5} required />
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

          <div className="text-center">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={status === 'sending'}
            >
              {status === 'sending' ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
