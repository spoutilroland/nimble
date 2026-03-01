'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { SECTION_TYPES } from '@/lib/admin/constants/pages';
import { DividerRow } from './DividerRow';
import { SectionPropsEditor } from './SectionPropsEditor';
import { BlockImageEditor } from './BlockImageEditor';
import { InlineCarouselEditor } from './InlineCarouselEditor';
import type { Section, DividerConfig } from '@/lib/types';
import type { Layout } from '@/lib/schemas/layouts';

interface SectionRowProps {
  section: Section;
  index: number;
  total: number;
  layouts: Layout[];
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdate: (updates: Partial<Section>) => void;
}

export function SectionRow({ section, index, total, layouts, onRemove, onMoveUp, onMoveDown, onUpdate }: SectionRowProps) {
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
    <div className="section-row" data-type={section.type}>
      <div className="section-row-top">
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

        <span className="section-row-label">{t(`sectionType.${section.type}`)}</span>

        <div className="section-row-btns">
          <button className="btn-section-up" disabled={index === 0} title={t('common.moveUp')} onClick={onMoveUp}>↑</button>
          <button className="btn-section-down" disabled={index === total - 1} title={t('common.moveDown')} onClick={onMoveDown}>↓</button>
          <button className="btn-section-remove" title={t('common.delete')} onClick={onRemove}>×</button>
        </div>
      </div>

      {!collapsed && (
        <>
          {isCustomLayout ? (
            <div className="flex flex-col gap-[0.3rem] mt-2">
              <span className="section-subsection-label">{t('section.layoutLabel')}</span>
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
                    <span className="section-subsection-label">{t('section.imagesLabel')}</span>
                    <div className="block-images-list">
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
          ) : info?.needsCarousel && section.carouselId ? (
            <>
              <span className="section-subsection-label">{t('section.imagesLabel')}</span>
              <InlineCarouselEditor carouselId={section.carouselId} maxImages={info?.maxImages} imageHint={info?.imageHint} />
            </>
          ) : null}

          {(section.type === 'stats' || section.type === 'polaroids') && (
            <>
              <span className="section-subsection-label">{t('section.configLabel')}</span>
              <SectionPropsEditor section={section} onUpdate={onUpdate} />
            </>
          )}

          <span className="section-subsection-label">{t('section.dividerLabel')}</span>
          <DividerRow
            divider={section.dividerAfter as DividerConfig | undefined}
            onChange={(d) => onUpdate({ dividerAfter: d as Section['dividerAfter'] })}
          />
        </>
      )}
    </div>
  );
}
