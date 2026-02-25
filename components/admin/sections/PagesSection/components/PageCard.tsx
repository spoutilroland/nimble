'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { SECTION_TYPES } from '@/lib/admin/constants/pages';
import { SectionRow } from './SectionRow';
import type { PageData, Section } from '@/lib/types';
import type { Layout } from '@/lib/schemas/layouts';

interface PageCardProps {
  page: PageData;
  canDelete: boolean;
  layouts: Layout[];
  onDelete: () => void;
  onSave: (updated: Partial<PageData>) => void;
}

export function PageCard({ page, canDelete, layouts, onDelete, onSave }: PageCardProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [showInNav, setShowInNav] = useState(page.showInNav);
  const [seoTitle, setSeoTitle] = useState(page.seo?.title || '');
  const [seoDesc, setSeoDesc] = useState(page.seo?.description || '');
  const [seoImage, setSeoImage] = useState(page.seo?.ogImage || '');
  const [sections, setSections] = useState<Section[]>(page.sections || []);
  const [addSectionType, setAddSectionType] = useState('hero');
  const [message, setMessage] = useState<{ text: string; type: string } | null>(null);

  useEffect(() => {
    setTitle(page.title);
    setSlug(page.slug);
    setShowInNav(page.showInNav);
    setSeoTitle(page.seo?.title || '');
    setSeoDesc(page.seo?.description || '');
    setSeoImage(page.seo?.ogImage || '');
    setSections(page.sections || []);
  }, [page]);

  const addSection = () => {
    setSections(prev => [...prev, { type: addSectionType as Section['type'], carouselId: '' }]);
  };

  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    setSections(prev => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const updateSection = (idx: number, updates: Partial<Section>) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim()) {
      setMessage({ text: t('pages.validationTitleSlug'), type: 'error' });
      return;
    }

    const invalidLayout = sections.find(s => s.type === 'custom-layout' && (!s.layoutId || !s.carouselId));
    if (invalidLayout) {
      setMessage({ text: t('pages.validationLayoutConfig'), type: 'error' });
      return;
    }

    const processedSections = sections.map(s => {
      if (s.type !== 'custom-layout' || !s.layoutId || !s.carouselId) return s;
      const layout = layouts.find(l => l.id === s.layoutId);
      if (!layout) return s;
      const blockCarousels: Record<string, string> = {};
      layout.blocks.forEach(b => {
        if (b.type === 'image' || (b.type as string) === 'carousel') {
          blockCarousels[b.blockId] = s.carouselId + '-' + b.blockId;
        }
      });
      return { ...s, blockCarousels };
    });

    onSave({
      title: title.trim(),
      slug: slug.trim(),
      showInNav,
      seo: { title: seoTitle.trim(), description: seoDesc.trim(), ogImage: seoImage.trim() || null },
      sections: processedSections,
    });
    setMessage({ text: t('pages.saved'), type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="page-card" data-page-id={page.id}>
      <div className="page-card-header">
        <div className="page-card-info">
          <span className="page-card-title">{page.title}</span>
          <span className="page-card-slug">{page.slug}</span>
          {page.showInNav && <span className="page-nav-badge">Nav</span>}
        </div>
        <div className="page-card-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? t('pages.btnClose') : t('pages.btnEdit')}
          </button>
          {canDelete && (
            <button className="btn btn-danger btn-sm" onClick={onDelete}>
              {t('pages.btnDelete')}
            </button>
          )}
        </div>
      </div>

      {editing && (
        <div className="page-card-edit">
          <div className="grid grid-cols-2 gap-4 my-4">
            <div className="form-group">
              <label>{t('pages.titleLabel')}</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('pages.slugLabel')}</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label checkbox-inline">
              {t('pages.showInNavLabel')}
              <input type="checkbox" checked={showInNav} onChange={(e) => setShowInNav(e.target.checked)} />
            </label>
          </div>

          <details className="seo-details">
            <summary className="page-sections-label cursor-pointer list-none">{t('pages.seoDetails')}</summary>
            <div className="mt-3 space-y-3">
              <div className="form-group">
                <label>{t('pages.seoTitleLabel')}</label>
                <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('pages.seoDescLabel')}</label>
                <input type="text" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('pages.seoImageLabel')}</label>
                <input type="text" placeholder={t('pages.seoImagePlaceholder')} value={seoImage} onChange={(e) => setSeoImage(e.target.value)} />
              </div>
            </div>
          </details>

          <div className="page-sections-label mt-4">{t('pages.sectionsLabel')}</div>
          <div className="page-sections-list">
            {sections.map((section, idx) => (
              <SectionRow
                key={idx}
                section={section}
                index={idx}
                total={sections.length}
                layouts={layouts}
                onRemove={() => removeSection(idx)}
                onMoveUp={() => moveSection(idx, -1)}
                onMoveDown={() => moveSection(idx, 1)}
                onUpdate={(updates) => updateSection(idx, updates)}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <select className="add-section-select" value={addSectionType} onChange={(e) => setAddSectionType(e.target.value)}>
              {SECTION_TYPES.map(st => (
                <option key={st.type} value={st.type}>{t(`sectionType.${st.type}`)}</option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={addSection}>{t('pages.btnAddSection')}</button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>{t('pages.btnCancel')}</button>
            <div className="flex items-center gap-[0.8rem]">
              {message && <span className={`page-edit-message form-message ${message.type}`}>{message.text}</span>}
              <button className="btn btn-success btn-sm" onClick={handleSave}>{t('pages.btnSave')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
