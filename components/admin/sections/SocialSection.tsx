'use client';

import { useState, useEffect } from 'react';
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
  const [collapsed, setCollapsed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      setSocial(site.social || {});
    }
  }, [site]);

  const updateField = (key: string, value: string) => {
    setSocial(prev => ({ ...prev, [key]: value }));
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
            className="btn-collapse"
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
          <button className="btn btn-success" disabled={saving} onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="site-form">
            <div className="site-form-group">
              <div className="social-inputs-grid">
                {SOCIAL_NETWORKS.map(n => (
                  <div key={n.key} className="form-group">
                    <label>{n.label}</label>
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
