'use client';

import { useState, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import type { SocialLinks } from '@/lib/types';

const SOCIAL_NETWORKS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'x', label: 'X (Twitter)', placeholder: 'https://x.com/...' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/...' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/...' },
];

export function SocialSection() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [social, setSocial] = useState<Record<string, string>>({});
  const [icons, setIcons] = useState<Record<string, string>>({});
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) setSocial(site.social || {});
  }, [site]);

  useEffect(() => {
    fetch('/api/social-icons')
      .then((r) => r.json())
      .then(setIcons)
      .catch(() => {});
  }, []);

  const updateField = (key: string, value: string) => {
    setSocial(prev => ({ ...prev, [key]: value }));
  };

  const handleIconUpload = async (network: string, file: File) => {
    setUploadingFor(network);
    const formData = new FormData();
    formData.append('icon', file);
    try {
      const res = await fetch(`/api/admin/social-icon?network=${network}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setIcons(prev => ({ ...prev, [network]: data.url + '?t=' + Date.now() }));
      } else {
        setMessage({ text: t('social.iconError'), type: 'error' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage({ text: t('social.iconError'), type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
    setUploadingFor(null);
  };

  const handleIconDelete = async (network: string) => {
    await fetch(`/api/admin/social-icon?network=${network}`, { method: 'DELETE' });
    setIcons(prev => {
      const next = { ...prev };
      delete next[network];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const socialData: Record<string, string> = {};
    SOCIAL_NETWORKS.forEach(n => {
      socialData[n.key] = social[n.key]?.trim() || '';
    });
    const ok = await saveSite({ social: socialData as SocialLinks });
    if (ok) {
      setMessage({ text: t('social.saved'), type: 'success' });
    } else {
      setMessage({ text: t('social.saveError'), type: 'error' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="carousel-section" id="social-section">
      <div className="carousel-section-header">
        <div className="flex items-center gap-[0.8rem]">
          <button
            className="bg-none border-none text-[var(--bo-text-dim)] text-[0.9rem] cursor-pointer py-[0.2rem] px-[0.4rem] transition-colors duration-200 leading-none hover:text-[var(--bo-green)]"
            title={t('common.collapseTitle')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
          <div>
            <h2>{t('social.sectionTitle')}</h2>
            <div className="carousel-info">{t('social.sectionInfo')}</div>
          </div>
        </div>
        <div className="flex items-center gap-[0.8rem]">
          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
          <button className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]" disabled={saving} onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="flex flex-col gap-[0.9rem] mt-[0.9rem]">
            <div className="border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]">
              <div className="social-inputs-grid grid grid-cols-2 gap-x-[1.2rem] gap-y-[0.8rem]">
                {SOCIAL_NETWORKS.map(n => (
                  <div key={n.key} className="form-group">
                    <label>{n.label}</label>
                    <div className="flex items-center gap-[0.6rem] mb-[0.5rem]">
                      {icons[n.key] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={icons[n.key]}
                          alt={n.label}
                          style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--bo-border)' }}
                        />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: 4, border: '1px dashed var(--bo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--bo-text-muted)', flexShrink: 0 }}>
                          {n.label.charAt(0)}
                        </div>
                      )}
                      <button
                        className="btn btn-sm"
                        disabled={uploadingFor === n.key}
                        onClick={() => fileRefs.current[n.key]?.click()}
                      >
                        {uploadingFor === n.key ? t('social.uploading') : t('social.uploadIcon')}
                      </button>
                      {icons[n.key] && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleIconDelete(n.key)}
                        >
                          {t('social.deleteIcon')}
                        </button>
                      )}
                      <input
                        ref={(el) => { fileRefs.current[n.key] = el; }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIconUpload(n.key, file);
                          e.target.value = '';
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      value={social[n.key] || ''}
                      placeholder={n.placeholder}
                      onChange={(e) => updateField(n.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
