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
        <button className="btn btn-success" onClick={save}>
          {t('captcha.btnSave')}
        </button>
      </div>

      <div className="site-form max-w-[520px]">
        <div className="site-form-group">
          <h3 className="site-form-category">{t('captcha.providerGroupTitle')}</h3>

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
              <div className="captcha-guide">
                <div className="captcha-guide-title">
                  {t('captcha.howToConfigure', { name: info.label })}
                </div>
                <ol className="captcha-guide-steps">
                  {info.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
                {info.link && (
                  <a href={info.link} target="_blank" rel="noopener noreferrer" className="captcha-guide-link">
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
