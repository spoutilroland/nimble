'use client';

import { Trash2, XCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface SelectionBarProps {
  count: number;
  onDeselect: () => void;
  onDelete: () => void;
}

export function SelectionBar({ count, onDeselect, onDelete }: SelectionBarProps) {
  const { t } = useI18n();

  if (count === 0) return null;

  const label = count === 1
    ? t('mediaLibrary.selected_one')
    : t('mediaLibrary.selected_other').replace('{n}', String(count));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[var(--bo-card)] border border-[var(--bo-border)] rounded-[var(--bo-radius,12px)] px-5 py-[0.6rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[100] animate-[media-selection-bar-in_0.2s_ease]">
      <span className="font-semibold text-[var(--bo-text)] whitespace-nowrap">{label}</span>
      <div className="flex gap-2">
        <button className="btn btn-secondary text-[0.8rem] px-[0.7rem] py-[0.3rem] inline-flex items-center gap-[0.3rem]" onClick={onDeselect}>
          <XCircle size={14} />
          {t('mediaLibrary.btnDeselect')}
        </button>
        <button className="btn btn-danger text-[0.8rem] px-[0.7rem] py-[0.3rem] inline-flex items-center gap-[0.3rem]" onClick={onDelete}>
          <Trash2 size={14} />
          {t('mediaLibrary.btnDeleteSelected')}
        </button>
      </div>
    </div>
  );
}
