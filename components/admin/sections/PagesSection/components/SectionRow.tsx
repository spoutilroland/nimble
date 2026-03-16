'use client';

import { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { SECTION_TYPES } from '@/lib/admin/constants/pages';
import { DividerRow } from './DividerRow';
import { SectionPropsEditor } from './SectionPropsEditor';
import { BlockImageEditor } from './BlockImageEditor';
import { InlineCarouselEditor } from './InlineCarouselEditor';
import { BentoGridEditor } from './BentoGridEditor';
import type { Section, DividerConfig } from '@/lib/types';
import type { Layout } from '@/lib/schemas/layouts';

interface SectionRowProps {
  section: Section;
  index: number;
  total: number;
  layouts: Layout[];
  isEven?: boolean;
  displacement?: number;
  isDragged?: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<Section>) => void;
  onSave?: () => void;
  onGripPointerDown?: (e: React.PointerEvent) => void;
}

export function SectionRow({ section, index, total, layouts, isEven = false, displacement = 0, isDragged, onRemove, onMoveUp, onMoveDown, onUpdate, onSave, onGripPointerDown }: SectionRowProps) {
  const { t } = useI18n();
  const info = SECTION_TYPES.find(st => st.type === section.type);
  const isCustomLayout = section.type === 'custom-layout';
  const [collapsed, setCollapsed] = useState(true);

  // Auto-génère un carouselId si la section en a besoin mais n'en a pas
  const ensureCarouselId = () => {
    if (info?.needsCarousel && !section.carouselId) {
      const newId = Math.random().toString(36).slice(2, 8);
      onUpdate({ carouselId: newId });
    }
  };

  return (
    <div
      className={`flex flex-col py-2 px-[0.8rem] border rounded transition-transform duration-200 ease-out ${
        isDragged ? 'opacity-0' :
        `border-[var(--bo-border)] ${isEven ? 'bg-[rgba(255,255,255,0.04)]' : 'bg-[rgba(99,102,241,0.08)]'}`
      }`}
      data-type={section.type}
      style={{ transform: displacement ? `translateY(${displacement}px)` : undefined }}
    >
      <div className="flex items-center gap-2">
        <div
          onPointerDown={onGripPointerDown}
          className="cursor-grab active:cursor-grabbing text-[var(--bo-text-dim)] hover:text-[var(--bo-text)] transition-colors shrink-0 touch-none select-none"
        >
          <GripVertical size={16} />
        </div>
        <button
          className="btn-collapse"
          onClick={() => {
            if (collapsed) ensureCarouselId();
            setCollapsed(!collapsed);
          }}
          title={t('common.collapseTitle')}
        >
          {collapsed ? '▶' : '▼'}
        </button>

        <span className="min-w-[180px] shrink-0 text-[0.85rem] text-[var(--bo-text)] truncate">
          {isCustomLayout && section.layoutId ? (
            <>
              {section.label || layouts.find(l => l.id === section.layoutId)?.label || section.layoutId}
              <span className="text-[0.75rem] text-[var(--bo-text-dim)] ml-1">({t(`sectionType.${section.type}`)})</span>
            </>
          ) : (
            <>
              {t(`sectionType.${section.type}`)}
              {section.label && <span className="text-[0.75rem] text-[var(--bo-text-dim)] ml-1">— {section.label}</span>}
            </>
          )}
        </span>

        <div className="section-row-btns flex gap-[0.25rem] shrink-0 ml-auto">
          <button className="btn-section-up w-[26px] h-[26px] p-0 bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] text-[var(--bo-text)] cursor-pointer text-[0.8rem] leading-none transition-colors duration-200" disabled={index === 0} title={t('common.moveUp')} onClick={onMoveUp}>↑</button>
          <button className="btn-section-down w-[26px] h-[26px] p-0 bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] text-[var(--bo-text)] cursor-pointer text-[0.8rem] leading-none transition-colors duration-200" disabled={index === total - 1} title={t('common.moveDown')} onClick={onMoveDown}>↓</button>
          <button className="btn-section-remove w-[26px] h-[26px] p-0 bg-[rgba(255,255,255,0.05)] border border-[var(--bo-border)] !text-[#e55a2a] cursor-pointer text-[0.8rem] leading-none transition-colors duration-200" title={t('common.delete')} onClick={() => { if (confirm(t('section.deleteConfirm'))) onRemove(); }}>×</button>
        </div>
      </div>

      {!collapsed && (
        <>
          {isCustomLayout ? (
            <div className="flex flex-col gap-[0.3rem] mt-2">
              <span className="text-[0.72rem] uppercase tracking-[0.04em] text-[var(--back-text-muted,var(--bo-text-dim))] mt-2">{t('section.layoutLabel')}</span>
              <select
                className="section-layout-id"
                value={section.layoutId || ''}
                onChange={(e) => {
                  const updates: Partial<Section> = { layoutId: e.target.value };
                  if (!section.carouselId && e.target.value) {
                    updates.carouselId = Math.random().toString(36).slice(2, 8);
                  }
                  onUpdate(updates);
                }}
              >
                <option value="">-- Choisir un layout --</option>
                {layouts.map(l => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              {section.layoutId && section.carouselId && (() => {
                const selectedLayout = layouts.find(l => l.id === section.layoutId);
                const imageBlocks = selectedLayout?.blocks.filter(b => b.type === 'image') ?? [];
                return imageBlocks.length > 0 ? (
                  <>
                    <span className="text-[0.72rem] uppercase tracking-[0.04em] text-[var(--back-text-muted,var(--bo-text-dim))] mt-2">{t('section.imagesLabel')}</span>
                    <div className="flex flex-col gap-[0.3rem] mt-[0.1rem]">
                      {imageBlocks.map((b, i) => (
                        <BlockImageEditor
                          key={b.blockId}
                          carouselId={`${section.carouselId}-${b.blockId}`}
                          label={`${t('block.image')} ${imageBlocks.length > 1 ? i + 1 : ''}`}
                        />
                      ))}
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          ) : section.type === 'bento-grid' ? (
            <BentoGridEditor section={section} onUpdate={onUpdate} onSave={onSave} />
          ) : info?.needsCarousel && section.carouselId && section.type !== 'polaroids' && section.type !== 'cinematic-split' ? (
            <>
              <span className="text-[0.72rem] uppercase tracking-[0.04em] text-[var(--back-text-muted,var(--bo-text-dim))] mt-2">{t('section.imagesLabel')}</span>
              <InlineCarouselEditor carouselId={section.carouselId} maxImages={info?.maxImages} imageHint={info?.imageHint} />
            </>
          ) : null}

          {(section.type === 'stats' || section.type === 'polaroids' || section.type === 'cinematic-split') && (
            <>
              <span className="text-[0.72rem] uppercase tracking-[0.04em] text-[var(--back-text-muted,var(--bo-text-dim))] mt-2">{t('section.configLabel')}</span>
              <SectionPropsEditor section={section} onUpdate={onUpdate} />
            </>
          )}

          {section.type === 'contact' && (
            <label className="inline-flex items-center gap-2 cursor-pointer text-[0.85rem] text-[var(--bo-text)] mt-2 w-fit">
              <input
                type="checkbox"
                checked={section.showInNav ?? true}
                onChange={(e) => onUpdate({ showInNav: e.target.checked })}
                className="w-4 h-4 shrink-0 mt-0"
              />
              {t('section.showContactInNav')}
            </label>
          )}

          <span className="text-[0.72rem] uppercase tracking-[0.04em] text-[var(--back-text-muted,var(--bo-text-dim))] mt-2">{t('section.dividerLabel')}</span>
          <DividerRow
            divider={section.dividerAfter as DividerConfig | undefined}
            onChange={(d) => onUpdate({ dividerAfter: d as Section['dividerAfter'] })}
          />
        </>
      )}
    </div>
  );
}
