'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

// ── Sortable state (ref-based pour perf, pas de re-render pendant le drag) ──

interface SortState {
  active: boolean;
  dragIdx: number;
  insertIdx: number;
  startY: number;
  ghostY: number;
  itemRects: { top: number; height: number; mid: number }[];
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

  // ── Sortable refs ──
  const listRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<SortState | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const [sortRender, setSortRender] = useState<{ dragIdx: number; insertIdx: number, dragHeight: number } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(page.title);
    setSlug(page.slug);
    setShowInNav(page.showInNav);
    setSeoTitle(page.seo?.title || '');
    setSeoDesc(page.seo?.description || '');
    setSeoImage(page.seo?.ogImage || '');
    setSections(page.sections || []);
  }, [page]);

  const saveWithSections = useCallback((secs: Section[]) => {
    if (!title.trim() || !slug.trim()) {
      setMessage({ text: t('pages.validationTitleSlug'), type: 'error' });
      return;
    }

    const processedSections = secs.map(s => {
      if (s.type !== 'custom-layout' || !s.layoutId) return s;
      const layout = layouts.find(l => l.id === s.layoutId);
      if (!layout) return s;
      // Générer les blockCarousels automatiquement si un carouselId (prefix) est défini
      if (!s.carouselId) return s;
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
    setMessage(null);
  }, [title, slug, showInNav, seoTitle, seoDesc, seoImage, layouts, onSave, t]);

const addSection = useCallback((type: string, layoutId?: string, label?: string) => {
  const info = SECTION_TYPES.find(st => st.type === type);
  
  // On génère les IDs ici, à l'intérieur du callback
  const carouselId = info?.needsCarousel 
    ? Math.random().toString(36).slice(2, 8) 
    : '';
  const contentId = Math.random().toString(36).slice(2, 8);
  
  const newSection: Section = { 
    type: type as Section['type'], 
    carouselId, 
    contentId 
  };

  if (layoutId) newSection.layoutId = layoutId;
  if (type === 'stats') newSection.props = { items: [] };

  if (label) {
    newSection.label = label;
  } else {
    // Note : on utilise 'sections' qui doit être dans les dépendances du useCallback
    const sameTypeCount = sections.filter(s => s.type === type).length;
    newSection.label = `#${sameTypeCount + 1}`;
  }

  const updated = [...sections, newSection];
  setSections(updated);
  setShowPicker(false);
  saveWithSections(updated);
  
  // On ajoute les dépendances nécessaires pour que la fonction soit toujours à jour
}, [sections, setSections, setShowPicker, saveWithSections]);


  const removeSection = (idx: number) => {
    setSections(prev => prev.filter((_, i) => i !== idx));
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const arr = [...sections];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSections(arr);
    saveWithSections(arr);
  };

  const updateSection = (idx: number, updates: Partial<Section>) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };
  const handleSave = () => saveWithSections(sections);

  // ── Sortable : pointer events ──

  const handleGripDown = (e: React.PointerEvent, dragIdx: number) => {
    e.preventDefault();
    const list = listRef.current;
    if (!list) return;

    const children = Array.from(list.children) as HTMLElement[];
    const listRect = list.getBoundingClientRect();
    const itemRects = children.map(child => {
      const r = child.getBoundingClientRect();
      return { top: r.top - listRect.top, height: r.height, mid: r.top - listRect.top + r.height / 2 };
    });

    const dragRect = itemRects[dragIdx];

    // Créer le ghost
    const ghost = document.createElement('div');
    const source = children[dragIdx];
    ghost.innerHTML = source.innerHTML;
    ghost.className = source.className;
    ghost.style.cssText = `
      position: fixed;
      left: ${source.getBoundingClientRect().left}px;
      top: ${source.getBoundingClientRect().top}px;
      width: ${source.getBoundingClientRect().width}px;
      z-index: 9999;
      pointer-events: none;
      opacity: 0.9;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      border: 1px solid var(--bo-accent, #6366f1);
      border-radius: 4px;
      background: var(--bo-surface, #1a1a2e);
      transition: none;
    `;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    sortRef.current = {
      active: true,
      dragIdx,
      insertIdx: dragIdx,
      startY: e.clientY,
      ghostY: source.getBoundingClientRect().top,
      itemRects,
    };

    setSortRender({ dragIdx, insertIdx: dragIdx, dragHeight: dragRect.height });

    // Capturer le pointer
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const handleMove = (ev: PointerEvent) => {
      const s = sortRef.current;
      if (!s) return;
      const deltaY = ev.clientY - s.startY;
      const ghost = ghostRef.current;
      if (ghost) ghost.style.top = `${s.ghostY + deltaY}px`;

      // Position du milieu de l'élément dragué (dans l'espace de la liste)
      const dragMid = s.itemRects[s.dragIdx].mid + deltaY;

      // Trouver l'index d'insertion
      let newInsert = 0;
      for (let i = 0; i < s.itemRects.length; i++) {
        if (dragMid > s.itemRects[i].mid) newInsert = i + 1;
      }
      // Clamp
      newInsert = Math.max(0, Math.min(newInsert, s.itemRects.length));

      if (newInsert !== s.insertIdx) {
        s.insertIdx = newInsert;
        setSortRender({ dragIdx: s.dragIdx, insertIdx: newInsert, dragHeight: dragRect.height });
      }
    };

    const handleUp = () => {
      const s = sortRef.current;
      sortRef.current = null;

      // Nettoyer le ghost
      if (ghostRef.current) {
        ghostRef.current.remove();
        ghostRef.current = null;
      }

      setSortRender(null);

      if (!s || s.dragIdx === s.insertIdx || (s.insertIdx === s.dragIdx + 1)) {
        // Pas de changement
      } else {
        // Réordonner
        setSections(prev => {
          const arr = [...prev];
          const [moved] = arr.splice(s.dragIdx, 1);
          const targetIdx = s.insertIdx > s.dragIdx ? s.insertIdx - 1 : s.insertIdx;
          arr.splice(targetIdx, 0, moved);
          // Sauvegarder via un timeout pour que le state soit à jour
          setTimeout(() => saveWithSections(arr), 0);
          return arr;
        });
      }

      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  };

  // ── Calcul des displacements pour chaque item ──

const getDisplacement = (idx: number): number => {
  if (!sortRender) return 0;
  const { dragIdx, insertIdx, dragHeight } = sortRender; // On récupère la hauteur du state
  
  if (idx === dragIdx) return 0;

  const dragH = dragHeight + 6.4; // Plus besoin de sortRef.current !

  if (insertIdx <= dragIdx) {
    if (idx >= insertIdx && idx < dragIdx) return dragH;
  } else {
    if (idx > dragIdx && idx < insertIdx) return -dragH;
  }
  return 0;
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
          <div ref={listRef} className="flex flex-col gap-[0.4rem] mb-[0.8rem] relative">
            {sections.map((section, idx) => (
              <SectionRow
                key={idx}
                section={section}
                index={idx}
                total={sections.length}
                layouts={layouts}
                isEven={idx % 2 === 0}
                isDragged={sortRender?.dragIdx === idx}
                displacement={getDisplacement(idx)}
                onRemove={() => removeSection(idx)}
                onMoveUp={() => moveSection(idx, -1)}
                onMoveDown={() => moveSection(idx, 1)}
                onUpdate={(updates) => updateSection(idx, updates)}
                onSave={handleSave}
                onGripPointerDown={(e) => handleGripDown(e, idx)}
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

          <div className="relative flex justify-between items-center mt-4">
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>{t('pages.btnCancel')}</button>
            <div className="flex items-center gap-[0.8rem]">
              {message && <span className={`page-edit-message form-message ${message.type} absolute right-[120px] top-1/2 -translate-y-1/2 !mt-0`}>{message.text}</span>}
              <button className="btn btn-success btn-sm" onClick={handleSave}>{t('pages.btnSave')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
