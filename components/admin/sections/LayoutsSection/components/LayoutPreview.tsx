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
    <div className="mt-4 mb-4 p-4 bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-lg">
      <div className="text-[0.8rem] font-semibold text-[var(--bo-text-dim)] uppercase tracking-[0.05em] mb-[0.6rem]">{t('layouts.previewTitle')}</div>
      <div className="grid grid-cols-3 gap-[0.8rem]">
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
                className={`rounded-md p-[0.8rem] bg-[var(--bo-card)] border-2 border-[var(--bo-border)] min-h-[50px]`}
                style={{
                  gridRow: block.row,
                  gridColumn: `${block.col} / span ${block.colSpan}`,
                }}
              >
                {block.type === 'title' && <div className={`font-bold text-[var(--bo-text)] ${(block.tag || 'h2') === 'h2' ? 'text-[1.2rem]' : 'text-base'}`}>{t('block.title')}</div>}
                {block.type === 'richtext' && (
                  <div className="flex flex-col gap-[0.4rem]">
                    <div className="h-2 bg-[var(--bo-border-hover)] rounded w-full" /><div className="h-2 bg-[var(--bo-border-hover)] rounded w-[80%]" /><div className="h-2 bg-[var(--bo-border-hover)] rounded w-[60%]" />
                  </div>
                )}
                {block.type === 'image' && <div className="flex items-center justify-center min-h-[80px] bg-[var(--bo-bg)] border border-dashed border-[var(--bo-border-hover)] rounded text-[1.5rem]">{info?.icon}</div>}
                {block.type === 'carousel' && <div className="flex gap-[0.4rem]"><span className="flex-1 h-[50px] bg-[var(--bo-card)] border border-[var(--bo-border)] rounded" /><span className="flex-1 h-[50px] bg-[var(--bo-card)] border border-[var(--bo-border)] rounded" /><span className="flex-1 h-[50px] bg-[var(--bo-card)] border border-[var(--bo-border)] rounded" /></div>}
                {block.type === 'social-links' && (
                  <div className="flex gap-[0.4rem] items-center">
                    <span className="w-7 h-7 rounded-full bg-[var(--primary)] opacity-70" /><span className="w-7 h-7 rounded-full bg-[var(--primary)] opacity-70" /><span className="w-7 h-7 rounded-full bg-[var(--primary)] opacity-70" />
                  </div>
                )}
                {block.type === 'map' && <div className="flex items-center justify-center min-h-[60px] bg-[var(--bo-card)] rounded text-[1.6rem]">{'\uD83D\uDDFA'}</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
