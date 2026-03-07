'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import type { CaptchaProvider } from '@/lib/types';

interface InstructionDef {
  label: string;
  steps: string[];
  link: string | null;
}

export function CaptchaSection() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [provider, setProvider] = useState<CaptchaProvider>('none');
  const [siteKey, setSiteKey] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const providers: { id: CaptchaProvider; labelKey: string }[] = [
    { id: 'none', labelKey: 'captcha.providerNone' },
    { id: 'turnstile', labelKey: 'captcha.providerTurnstile' },
    { id: 'recaptcha', labelKey: 'captcha.providerRecaptcha' },
    { id: 'hcaptcha', labelKey: 'captcha.providerHcaptcha' },
  ];

  const instructions: Record<string, InstructionDef> = {
    none: { label: '', steps: [], link: null },
    turnstile: {
      label: 'Cloudflare Turnstile',
      steps: [t('captcha.turnstileStep1'), t('captcha.turnstileStep2'), t('captcha.turnstileStep3'), t('captcha.turnstileStep4')],
      link: 'https://dash.cloudflare.com/?to=/:account/turnstile',
    },
    recaptcha: {
      label: 'Google reCAPTCHA v2',
      steps: [t('captcha.recaptchaStep1'), t('captcha.recaptchaStep2'), t('captcha.recaptchaStep3'), t('captcha.recaptchaStep4')],
      link: 'https://www.google.com/recaptcha/admin',
    },
    hcaptcha: {
      label: 'hCaptcha',
      steps: [t('captcha.hcaptchaStep1'), t('captcha.hcaptchaStep2'), t('captcha.hcaptchaStep3')],
      link: 'https://dashboard.hcaptcha.com',
    },
  };

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      setProvider((site.captcha?.provider as CaptchaProvider) || 'none');
      setSiteKey(site.captcha?.siteKey || '');
    }
  }, [site]);

  const save = async () => {
    const ok = await saveSite({
      captcha: {
        provider: provider === 'none' ? '' : provider,
        siteKey: provider !== 'none' ? siteKey.trim() : '',
      },
    });
    if (ok) {
      setMessage({ text: t('captcha.saved'), type: 'success' });
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ text: t('captcha.saveError'), type: 'error' });
    }
  };

  const info = instructions[provider];

  return (
    <div className="carousel-section" id="captcha-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('captcha.sectionTitle')}</h2>
          <div className="carousel-info">{t('captcha.sectionInfo')}</div>
        </div>
        <button className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]" onClick={save}>
          {t('captcha.btnSave')}
        </button>
      </div>

      <div className="flex flex-col gap-[0.9rem] mt-[0.9rem] max-w-[520px]">
        <div className="border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('captcha.providerGroupTitle')}</h3>

          <div className="form-group">
            <label>{t('captcha.serviceLabel')}</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as CaptchaProvider)}
            >
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{t(p.labelKey)}</option>
              ))}
            </select>
          </div>

          {provider !== 'none' && (
            <div className="form-group">
              <label>{t('captcha.siteKeyLabel')}</label>
              <input
                type="text"
                value={siteKey}
                placeholder={t('captcha.siteKeyPlaceholder')}
                onChange={(e) => setSiteKey(e.target.value)}
              />
            </div>
          )}

          {info && info.steps.length > 0 && (
            <div className="captcha-instructions">
              <div className="mt-4 p-4 bg-[rgba(74,124,89,0.08)] border-l-[3px] border-l-[var(--bo-green)] text-[0.85rem]">
                <div className="font-semibold mb-2 text-[var(--bo-green)]">
                  {t('captcha.howToConfigure', { name: info.label })}
                </div>
                <ol className="pl-[1.2rem] m-0 mb-[0.8rem] leading-[1.8] text-[var(--bo-text)]">
                  {info.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                {info.link && (
                  <a href={info.link} target="_blank" rel="noopener noreferrer" className="text-[var(--bo-green)] text-[0.82rem] no-underline hover:underline">
                    {t('captcha.openDashboard')}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
