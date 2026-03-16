'use client';

import { createPortal } from 'react-dom';
import { Folder, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { MediaFolder } from '@/lib/types';

interface MoveToFolderModalProps {
  folders: MediaFolder[];
  currentFolderId: string | null;
  selectedCount: number;
  onMove: (folderId: string | null) => void;
  onClose: () => void;
}

export function MoveToFolderModal({ folders, currentFolderId, selectedCount, onMove, onClose }: MoveToFolderModalProps) {
  const { t } = useI18n();

  // Exclure le dossier courant des choix
  const availableFolders = folders.filter((f) => f.id !== currentFolderId);

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl w-[90%] max-w-[420px] max-h-[70vh] flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bo-border)]">
          <h3 className="m-0 text-[1rem] font-semibold text-[var(--bo-text)]">
            {t('mediaLibrary.moveTitle')}
          </h3>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <p className="text-[0.85rem] text-[var(--bo-text-dim)] mb-3">
            {t('mediaLibrary.moveDescription').replace('{n}', String(selectedCount))}
          </p>

          <div className="flex flex-col gap-2">
            {/* Option racine (seulement si on est dans un dossier) */}
            {currentFolderId && (
              <button
                className="flex items-center gap-3 px-3 py-[0.6rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] cursor-pointer transition-[border-color] duration-150 hover:border-[var(--bo-accent,#6366f1)] text-left"
                onClick={() => onMove(null)}
              >
                <ArrowLeft size={20} className="text-[var(--bo-text-dim)] shrink-0" />
                <span className="text-[0.85rem] font-medium text-[var(--bo-text)]">
                  {t('mediaLibrary.moveToRoot')}
                </span>
              </button>
            )}

            {availableFolders.map((folder) => (
              <button
                key={folder.id}
                className="flex items-center gap-3 px-3 py-[0.6rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] cursor-pointer transition-[border-color] duration-150 hover:border-[var(--bo-accent,#6366f1)] text-left"
                onClick={() => onMove(folder.id)}
              >
                <Folder size={20} className="text-[var(--bo-accent,#6366f1)] shrink-0" />
                <span className="text-[0.85rem] font-medium text-[var(--bo-text)]">
                  {folder.name}
                </span>
              </button>
            ))}

            {availableFolders.length === 0 && !currentFolderId && (
              <p className="text-[0.85rem] text-[var(--bo-text-dim)] text-center py-4">
                {t('mediaLibrary.noFolders')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
