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
    <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center" onClick={onCancel}>
      <div className="bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-[var(--bo-radius,12px)] p-6 max-w-[400px] w-[90%] text-center" onClick={(e) => e.stopPropagation()}>
        {usedCount > 0 && (
          <div className="text-[#f59e0b] mb-[0.6rem]">
            <AlertTriangle size={18} />
          </div>
        )}
        <p className="text-[var(--bo-text)] mb-5 text-[0.9rem]">{message}</p>
        <div className="flex justify-center gap-[0.6rem]">
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
