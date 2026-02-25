'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';

export function SiteSection() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      const b = site.business || {} as Record<string, string>;
      setName(b.name || '');
      setTagline(b.tagline || '');
      setDescription(b.description || '');
    }
  }, [site]);

  const save = async () => {
    setSaving(true);
    const ok = await saveSite({
      business: {
        ...site!.business,
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
      },
    });
    if (ok) {
      setMessage({ text: t('site.saved'), type: 'success' });
    } else {
      setMessage({ text: t('site.saveError'), type: 'error' });
    }
    setSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="carousel-section" id="site-section">
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
            <h2>{t('site.sectionTitle')}</h2>
            <div className="carousel-info">{t('site.sectionInfo')}</div>
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
              <h3 className="site-form-category">{t('site.identityGroupTitle')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label>{t('site.nameLabel')}</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>{t('site.taglineLabel')}</label>
                  <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('site.descriptionLabel')}</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-[0.8rem] mt-4">
            {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
            <button className="btn btn-success" disabled={saving} onClick={save}>
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
