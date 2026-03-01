'use client';

import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { MediaItemWithMeta } from '@/lib/types';

interface DeleteConfirmModalProps {
  items: MediaItemWithMeta[];
  mode: 'single' | 'bulk';
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmModal({ items, mode, onConfirm, onCancel }: DeleteConfirmModalProps) {
  const { t } = useI18n();

  const usedCount = items.filter((m) => m.usedIn.length > 0).length;

  let message: string;
  if (mode === 'single') {
    message = usedCount > 0
      ? t('mediaLibrary.confirmDeleteUsed').replace('{n}', String(items[0]?.usedIn.length ?? 0))
      : t('mediaLibrary.confirmDelete');
  } else {
    message = usedCount > 0
      ? t('mediaLibrary.confirmBulkDeleteUsed')
      : t('mediaLibrary.confirmBulkDelete').replace('{n}', String(items.length));
  }

  const modal = (
    <div className="media-delete-modal-backdrop" onClick={onCancel}>
      <div className="media-delete-modal" onClick={(e) => e.stopPropagation()}>
        {usedCount > 0 && (
          <div className="media-delete-warning">
            <AlertTriangle size={18} />
          </div>
        )}
        <p className="media-delete-message">{message}</p>
        <div className="media-delete-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
