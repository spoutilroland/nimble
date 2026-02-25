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

      <div className="site-form mt-0">
        <div className="site-form-group">
          <h3 className="site-form-category">{t('config.langsGroupTitle')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>{t('config.availableLabel')}</label>
              <select
                multiple
                size={Math.min(localeFiles.length, 6)}
                value={available}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, o => o.value);
                  if (selected.length === 0) return;
                  setAvailable(selected);
                  if (!selected.includes(defaultLang)) {
                    setDefaultLang(selected[0]);
                  }
                }}
              >
                {localeFiles.map(code => (
                  <option key={code} value={code}>
                    {code} — {LANG_NAMES[code] || code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('config.defaultLabel')}</label>
              <select
                value={defaultLang}
                onChange={(e) => setDefaultLang(e.target.value)}
              >
                {defaultOptions.map(code => (
                  <option key={code} value={code}>
                    {code} — {LANG_NAMES[code] || code.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
