'use client';

import { useI18n } from '@/lib/i18n/context';
import { BlockOptionsRow } from '@/components/admin/shared/BlockOptionsRow';
import { FOOTER_BLOCK_TYPES } from '@/lib/admin/constants/blocks';
import type { FooterBlock } from '@/lib/types';

interface FooterBlockRowProps {
  block: FooterBlock;
  onUpdate: (updates: Partial<FooterBlock>) => void;
  onRemove: () => void;
}

export function FooterBlockRow({ block, onUpdate, onRemove }: FooterBlockRowProps) {
  const { t } = useI18n();
  const info = FOOTER_BLOCK_TYPES.find(bt => bt.type === block.type);

  return (
    <div className="footer-block-row">
      <div className="footer-block-row-header">
        <span className="footer-block-type-badge">
          {info ? `${info.icon} ${t(info.labelKey)}` : block.type}
        </span>

        <div className="flex flex-wrap gap-[0.8rem] px-[0.6rem] pb-[0.45rem] flex-1">
          <BlockOptionsRow
            block={block}
            type={block.type}
            maxCols={6}
            context="footer"
            onUpdate={(updates) => onUpdate(updates as Partial<FooterBlock>)}
          />
        </div>

        <button
          className="btn-section-remove fb-block-remove"
          title={t('footerSection.blockDeleteTitle')}
          onClick={onRemove}
        >
          ×
        </button>
      </div>
    </div>
  );
}
