'use client';

import { useI18n } from '@/lib/i18n/context';
import { BlockOptionsRow } from '@/components/admin/shared/BlockOptionsRow';
import { LAYOUT_BLOCK_TYPES } from '@/lib/admin/constants/blocks';
import type { LayoutBlock } from '@/lib/schemas/layouts';

interface CanvasBlockProps {
  block: LayoutBlock;
  onUpdate: (updates: Partial<LayoutBlock>) => void;
  onRemove: () => void;
}

export function CanvasBlock({ block, onUpdate, onRemove }: CanvasBlockProps) {
  const { t } = useI18n();
  const info = LAYOUT_BLOCK_TYPES.find(bt => bt.type === block.type);

  return (
    <div className="canvas-block" data-block-id={block.blockId} data-type={block.type}>
      <div className="canvas-block-header">
        <span className="canvas-block-icon">{info?.icon || '?'}</span>
        <span className="canvas-block-label">{info ? t(info.labelKey) : block.type}</span>
        <span className="canvas-block-id">{block.blockId}</span>
        <button className="btn-section-remove canvas-block-remove" title={t('block.deleteTitle')} onClick={onRemove}>×</button>
      </div>

      <div className="flex flex-wrap gap-[0.8rem] px-[0.6rem] pb-[0.45rem]">
        <BlockOptionsRow
          block={block}
          type={block.type}
          maxCols={3}
          onUpdate={(updates) => onUpdate(updates as Partial<LayoutBlock>)}
        />

        {/* Title options */}
        {block.type === 'title' && (
          <label className="canvas-block-opt">
            {t('block.tagLabel')}
            <select value={block.tag || 'h2'} onChange={(e) => onUpdate({ tag: e.target.value })}>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
          </label>
        )}

        {/* Image options */}
        {block.type === 'image' && (
          <label className="canvas-block-opt">
            {t('block.displayLabel')}
            <select value={block.display || 'column'} onChange={(e) => onUpdate({ display: e.target.value })}>
              <option value="column">{t('block.displayColumn')}</option>
              <option value="float">{t('block.displayFloat')}</option>
            </select>
          </label>
        )}
      </div>

      {/* Style options */}
      <div className="flex flex-wrap gap-[0.6rem] pt-[0.4rem] px-[0.6rem] pb-[0.45rem] border-t border-[rgba(255,255,255,0.07)] mt-[0.1rem]">
        <label className="canvas-block-opt" title={t('block.bgLabel')}>
          {t('block.bgLabel')}
          <input
            type="color"
            value={block.bg || '#1e2c3a'}
            disabled={!block.bg}
            onChange={(e) => onUpdate({ bg: e.target.value })}
          />
          <input
            type="checkbox"
            title={t('common.activate')}
            checked={!!block.bg}
            onChange={(e) => onUpdate({ bg: e.target.checked ? (block.bg || '#1e2c3a') : undefined })}
          />
        </label>
        <label className="canvas-block-opt" title={t('block.colorLabel')}>
          {t('block.colorLabel')}
          <input
            type="color"
            value={block.color || '#c9d1d9'}
            disabled={!block.color}
            onChange={(e) => onUpdate({ color: e.target.value })}
          />
          <input
            type="checkbox"
            title={t('common.activate')}
            checked={!!block.color}
            onChange={(e) => onUpdate({ color: e.target.checked ? (block.color || '#c9d1d9') : undefined })}
          />
        </label>
        <label className="canvas-block-opt">
          {t('block.borderLabel')}
          <select value={block.borderWidth || 'none'} onChange={(e) => onUpdate({ borderWidth: e.target.value === 'none' ? undefined : e.target.value })}>
            <option value="none">{t('block.borderNone')}</option>
            <option value="thin">{t('block.borderThin')}</option>
            <option value="normal">{t('block.borderNormal')}</option>
            <option value="thick">{t('block.borderThick')}</option>
          </select>
        </label>
        {block.borderWidth && (
          <label className="canvas-block-opt">
            {t('block.borderColorLabel')}
            <input type="color" value={block.borderColor || '#4a7c59'} onChange={(e) => onUpdate({ borderColor: e.target.value })} />
          </label>
        )}
        <label className="canvas-block-opt">
          {t('block.cornersLabel')}
          <select value={block.borderRadius || 'none'} onChange={(e) => onUpdate({ borderRadius: e.target.value === 'none' ? undefined : e.target.value })}>
            <option value="none">{t('block.cornerSquare')}</option>
            <option value="sm">{t('block.cornerSmall')}</option>
            <option value="md">{t('block.cornerMedium')}</option>
            <option value="lg">{t('block.cornerLarge')}</option>
            <option value="pill">{t('block.cornerPill')}</option>
          </select>
        </label>
      </div>

      {/* Note upload pour image/carousel */}
      {(block.type === 'image' || block.type === 'carousel') && (
        <div className="canvas-block-note">{t('block.uploadNote')}</div>
      )}
    </div>
  );
}
