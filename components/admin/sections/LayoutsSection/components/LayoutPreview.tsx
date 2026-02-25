'use client';

import { useI18n } from '@/lib/i18n/context';
import { LAYOUT_BLOCK_TYPES } from '@/lib/admin/constants/blocks';
import type { LayoutBlock } from '@/lib/schemas/layouts';

interface LayoutPreviewProps {
  blocks: LayoutBlock[];
}

export function LayoutPreview({ blocks }: LayoutPreviewProps) {
  const { t } = useI18n();

  return (
    <div className="layout-preview-panel">
      <div className="layout-preview-title">{t('layouts.previewTitle')}</div>
      <div className="layout-preview-grid">
        {blocks.length === 0 ? (
          <div className="text-[var(--text-muted)] p-4 text-center">
            {t('layouts.previewEmpty')}
          </div>
        ) : (
          blocks.map(block => {
            const info = LAYOUT_BLOCK_TYPES.find(bt => bt.type === block.type);
            return (
              <div
                key={block.blockId}
                className={`preview-block preview-block-${block.type}`}
                style={{
                  gridRow: block.row,
                  gridColumn: `${block.col} / span ${block.colSpan}`,
                }}
              >
                {block.type === 'title' && <div className={`preview-title ${block.tag || 'h2'}`}>{t('block.title')}</div>}
                {block.type === 'richtext' && (
                  <div className="preview-richtext">
                    <div className="preview-line" /><div className="preview-line w-[80%]" /><div className="preview-line w-[60%]" />
                  </div>
                )}
                {block.type === 'image' && <div className="preview-image">{info?.icon}</div>}
                {block.type === 'carousel' && <div className="preview-carousel"><span /><span /><span /></div>}
                {block.type === 'social-links' && (
                  <div className="preview-social">
                    <span className="preview-social-dot" /><span className="preview-social-dot" /><span className="preview-social-dot" />
                  </div>
                )}
                {block.type === 'map' && <div className="preview-map">{'\uD83D\uDDFA'}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
