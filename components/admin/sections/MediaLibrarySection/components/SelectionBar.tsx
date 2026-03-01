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
    <div className="media-selection-bar">
      <span className="media-selection-count">{label}</span>
      <div className="media-selection-actions">
        <button className="btn btn-secondary btn-sm" onClick={onDeselect}>
          <XCircle size={14} />
          {t('mediaLibrary.btnDeselect')}
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          <Trash2 size={14} />
          {t('mediaLibrary.btnDeleteSelected')}
        </button>
      </div>
    </div>
  );
}
