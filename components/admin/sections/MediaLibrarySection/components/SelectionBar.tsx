'use client';

import { Trash2, XCircle, FolderInput } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface SelectionBarProps {
  count: number;
  onDeselect: () => void;
  onMove: () => void;
  onDelete?: () => void;
  onDemoBlock?: () => void;
  disableMove?: boolean;
}

const demoStyle = { cursor: 'not-allowed', opacity: 0.4 } as const;

export function SelectionBar({ count, onDeselect, onMove, onDelete, onDemoBlock, disableMove }: SelectionBarProps) {
  const { t } = useI18n();

  if (count === 0) return null;

  const label = count === 1
    ? t('mediaLibrary.selected_one')
    : t('mediaLibrary.selected_other').replace('{n}', String(count));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-nowrap items-center gap-3 bg-[var(--bo-card)] border border-[var(--bo-border)] rounded-[var(--bo-radius,12px)] px-4 py-[0.55rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[100] animate-[media-selection-bar-in_0.2s_ease]">
      <span className="font-semibold text-[var(--bo-text)] whitespace-nowrap shrink-0">{label}</span>
      <div className="flex flex-nowrap gap-2 shrink-0">
        <button className="btn btn-secondary text-[0.8rem] px-[0.7rem] py-[0.3rem] inline-flex items-center gap-[0.3rem] whitespace-nowrap" onClick={onDeselect}>
          <XCircle size={14} />
          {t('mediaLibrary.btnDeselect')}
        </button>
        <button
          className="btn btn-secondary text-[0.8rem] px-[0.7rem] py-[0.3rem] inline-flex items-center gap-[0.3rem] whitespace-nowrap"
          style={disableMove ? demoStyle : undefined}
          onClick={disableMove ? onDemoBlock : onMove}
          title={disableMove ? 'Not available in demo / Non disponible en démo' : undefined}
        >
          <FolderInput size={14} />
          {t('mediaLibrary.btnMove')}
        </button>
        <button
          className="btn btn-danger text-[0.8rem] px-[0.7rem] py-[0.3rem] inline-flex items-center gap-[0.3rem] whitespace-nowrap"
          style={!onDelete ? demoStyle : undefined}
          onClick={onDelete ?? onDemoBlock}
          title={!onDelete ? 'Not available in demo / Non disponible en démo' : undefined}
        >
          <Trash2 size={14} />
          {t('mediaLibrary.btnDeleteSelected')}
        </button>
      </div>
    </div>
  );
}
