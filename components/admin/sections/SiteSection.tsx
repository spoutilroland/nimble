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
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
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
      const s = site.seo || {} as Record<string, string>;
      setSeoTitle(s.defaultTitle || '');
      setSeoDescription(s.defaultDescription || '');
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
      seo: {
        ...site!.seo,
        defaultTitle: seoTitle.trim(),
        defaultDescription: seoDescription.trim(),
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
            className="bg-none border-none text-[var(--bo-text-dim)] text-[0.9rem] cursor-pointer py-[0.2rem] px-[0.4rem] transition-colors duration-200 leading-none hover:text-[var(--bo-green)]"
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
          <button className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]" disabled={saving} onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div className="flex flex-col gap-[0.9rem] mt-[0.9rem]">
            <div className="border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]">
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('site.identityGroupTitle')}</h3>
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

            <div className="border border-[var(--bo-border)] py-[1.2rem] px-[1.4rem]">
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] tracking-[0.12em] uppercase text-[var(--bo-green)] m-0 mb-4">{t('site.seoGroupTitle')}</h3>
              <div className="form-group">
                <label>{t('site.seoTitleLabel')}</label>
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('site.seoDescriptionLabel')}</label>
                <input type="text" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-[0.8rem] mt-4">
            {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
            <button className="bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.875rem] font-bold tracking-[0.2px] py-[0.65rem] px-6 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]" disabled={saving} onClick={save}>
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
