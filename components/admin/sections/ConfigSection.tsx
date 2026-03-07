'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';

const LANG_NAMES: Record<string, string> = {
  fr: 'Français', en: 'English', de: 'Deutsch', es: 'Español',
  it: 'Italiano', pt: 'Português', nl: 'Nederlands', pl: 'Polski',
  ru: 'Русский', zh: '中文', ja: '日本語', ar: 'العربية',
};

export function ConfigSection() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [localeFiles, setLocaleFiles] = useState<string[]>(['fr']);
  const [available, setAvailable] = useState<string[]>(['fr']);
  const [defaultLang, setDefaultLang] = useState('fr');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Locale files list is not in the site store — fetch separately
  const loadLocales = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/locales');
      const data = await res.json();
      setLocaleFiles(data.locales || ['fr']);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!site) loadSite();
    loadLocales();
  }, [site, loadSite, loadLocales]);

  useEffect(() => {
    if (site) {
      setAvailable(site.languages?.available || ['fr']);
      setDefaultLang(site.languages?.default || 'fr');
    }
  }, [site]);

  const toggleLang = (code: string) => {
    setAvailable(prev => {
      const next = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code];
      if (next.length === 0) return prev;
      if (!next.includes(defaultLang)) {
        setDefaultLang(next[0]);
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const ok = await saveSite({
      languages: {
        available: available.length > 0 ? available : ['fr'],
        default: defaultLang,
      },
    });
    if (ok) {
      setMessage({ text: t('config.saved'), type: 'success' });
      setTimeout(() => location.reload(), 800);
    } else {
      setMessage({ text: t('config.saveError'), type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(false);
  };

  const defaultOptions = localeFiles.filter(code => available.includes(code));

  return (
    <div className="carousel-section" id="config-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('config.sectionTitle')}</h2>
          <div className="carousel-info">{t('config.sectionInfo')}</div>
        </div>
        <div className="flex items-center gap-[0.8rem]">
          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
          <button className="btn btn-success" disabled={saving} onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-[0.9rem] mt-0">
        <div className="border border-[var(--bo-border)] p-[1.2rem_1.4rem]">
          <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('config.langsGroupTitle')}</h3>

          <label className="text-[0.75rem] text-[var(--bo-text-dim)] uppercase tracking-[0.05em] mb-2 block">{t('config.availableLabel')}</label>
          <div className="flex flex-wrap gap-2 mb-5">
            {localeFiles.map(code => {
              const active = available.includes(code);
              const isDefault = code === defaultLang;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleLang(code)}
                  className={`flex items-center gap-2 py-[0.45rem] px-3 rounded-lg border text-[0.85rem] cursor-pointer transition-all duration-150 ${
                    active
                      ? 'bg-[var(--bo-green)]/15 border-[var(--bo-green)] text-[var(--bo-green)]'
                      : 'bg-transparent border-[var(--bo-border)] text-[var(--bo-text-dim)] hover:border-[var(--bo-text-dim)]'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[0.7rem] font-bold uppercase ${
                    active ? 'bg-[var(--bo-green)] text-white' : 'bg-[var(--bo-border)] text-[var(--bo-text-dim)]'
                  }`}>{code}</span>
                  <span>{LANG_NAMES[code] || code.toUpperCase()}</span>
                  {isDefault && <span className="text-[0.65rem] bg-[var(--bo-green)]/25 text-[var(--bo-green)] px-1.5 py-px rounded-full font-semibold">{t('config.defaultBadge')}</span>}
                </button>
              );
            })}
          </div>

          {available.length > 1 && (
            <>
              <label className="text-[0.75rem] text-[var(--bo-text-dim)] uppercase tracking-[0.05em] mb-2 block">{t('config.defaultLabel')}</label>
              <div className="flex gap-2">
                {defaultOptions.map(code => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setDefaultLang(code)}
                    className={`flex items-center gap-2 py-[0.4rem] px-3 rounded-lg border text-[0.82rem] cursor-pointer transition-all duration-150 ${
                      code === defaultLang
                        ? 'bg-[var(--bo-green)] border-[var(--bo-green)] text-white'
                        : 'bg-transparent border-[var(--bo-border)] text-[var(--bo-text-dim)] hover:border-[var(--bo-text-dim)]'
                    }`}
                  >
                    <span className="font-bold uppercase text-[0.7rem]">{code}</span>
                    <span>{LANG_NAMES[code] || code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
