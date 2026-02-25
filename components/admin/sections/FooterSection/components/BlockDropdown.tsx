'use client';

import { useI18n } from '@/lib/i18n/context';
import { FOOTER_BLOCK_TYPES } from '@/lib/admin/constants/blocks';
import type { FooterBlockType } from '@/lib/types';

interface BlockDropdownProps {
  show: boolean;
  onToggle: () => void;
  onAdd: (type: FooterBlockType) => void;
}

export function BlockDropdown({ show, onToggle, onAdd }: BlockDropdownProps) {
  const { t } = useI18n();

  return (
    <div className="relative">
      <button
        className="btn btn-secondary btn-sm"
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
      >
        {t('footerSection.btnAddBlock')}
      </button>
      {show && (
        <div className="footer-block-dropdown" onClick={(e) => e.stopPropagation()}>
          {FOOTER_BLOCK_TYPES.map((bt) => (
            <div
              key={bt.type}
              className="footer-block-option"
              onClick={() => onAdd(bt.type)}
            >
              {bt.icon} {t(bt.labelKey)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
