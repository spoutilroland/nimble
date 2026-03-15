'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { SECTION_TYPES } from '@/lib/admin/constants/pages';
import { SectionRow } from './SectionRow';
import { SectionPickerModal } from './SectionPickerModal';
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
  const [showPicker, setShowPicker] = useState(false);
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

  const addSection = (type: string, layoutId?: string) => {
    const info = SECTION_TYPES.find(st => st.type === type);
    const carouselId = info?.needsCarousel ? Math.random().toString(36).slice(2, 8) : '';
    const newSection: Section = { type: type as Section['type'], carouselId };
    if (layoutId) newSection.layoutId = layoutId;
    setSections(prev => [...prev, newSection]);
    setShowPicker(false);
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
    <div className="border border-[var(--bo-border)] rounded-2xl overflow-hidden" data-page-id={page.id}>
      <div className="flex items-center justify-between py-[0.9rem] px-[1.2rem] bg-[var(--bo-surface-2,rgba(255,255,255,0.03))]">
        <div className="flex items-center gap-[0.8rem] flex-wrap">
          <span className="font-['Plus_Jakarta_Sans',sans-serif] text-base text-[var(--bo-text)]">{page.title}</span>
          <span className="text-[0.8rem] text-[var(--bo-text-dim)] font-mono">{page.slug}</span>
          {page.showInNav && <span className="text-[0.7rem] py-[0.15rem] px-2 bg-[rgba(74,124,89,0.2)] text-[var(--bo-green)] border border-[var(--bo-green)] tracking-[0.06em]">Nav</span>}
        </div>
        <div className="flex gap-2">
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
        <div className="py-4 px-[1.2rem] border-t border-[var(--bo-border)]">
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
          <label className="inline-flex items-center gap-2 cursor-pointer text-[0.85rem] text-[var(--bo-text)] mb-4">
            <input
              type="checkbox"
              checked={showInNav}
              onChange={(e) => setShowInNav(e.target.checked)}
              style={{ width: '16px', height: '16px', minWidth: '16px', padding: 0 }}
            />
            {t('pages.showInNavLabel')}
          </label>

          <details className="border border-[var(--bo-border)] p-[0.6rem_0.8rem] mb-4 [&>summary::-webkit-details-marker]:hidden">
            <summary className="text-[0.75rem] uppercase tracking-[0.1em] text-[var(--bo-green)] mb-2 cursor-pointer list-none">{t('pages.seoDetails')}</summary>
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

          <div className="text-[0.75rem] uppercase tracking-[0.1em] text-[var(--bo-green)] mb-2 mt-4">{t('pages.sectionsLabel')}</div>
          <div className="flex flex-col gap-[0.4rem] mb-[0.8rem]">
            {sections.map((section, idx) => (
              <SectionRow
                key={idx}
                section={section}
                index={idx}
                total={sections.length}
                layouts={layouts}
                isEven={idx % 2 === 0}
                onRemove={() => removeSection(idx)}
                onMoveUp={() => moveSection(idx, -1)}
                onMoveDown={() => moveSection(idx, 1)}
                onUpdate={(updates) => updateSection(idx, updates)}
                onSave={handleSave}
              />
            ))}
          </div>

          <div className="mt-3">
            <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)}>
              {t('pages.btnAddSection')}
            </button>
          </div>

          {showPicker && (
            <SectionPickerModal
              layouts={layouts}
              onSelect={addSection}
              onClose={() => setShowPicker(false)}
            />
          )}

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
