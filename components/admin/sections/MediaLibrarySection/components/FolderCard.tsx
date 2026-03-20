'use client';

import { useState, useRef, useEffect } from 'react';
import { Folder, Pencil, Trash2, Check, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { MediaFolder } from '@/lib/types';

interface FolderCardProps {
  folder: MediaFolder;
  mediaCount: number;
  onOpen: (folderId: string) => void;
  onRename: (folderId: string, name: string) => Promise<boolean>;
  onDelete: (folderId: string) => Promise<boolean>;
  onDropMedia?: (mediaId: string, folderId: string) => void;
}

export function FolderCard({ folder, mediaCount, onOpen, onRename, onDelete, onDropMedia }: FolderCardProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleConfirmRename = async () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== folder.name) {
      await onRename(folder.id, trimmed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmRename();
    if (e.key === 'Escape') { setEditing(false); setEditName(folder.name); }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    // Réagir seulement aux drags internes (médias de la médiathèque)
    if (!e.dataTransfer.types.includes('nimble/media-id')) return;
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDropTarget(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('nimble/media-id')) return;
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDropTarget(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('nimble/media-id')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDropTarget(false);
    const mediaId = e.dataTransfer.getData('nimble/media-id');
    if (mediaId && onDropMedia) {
      onDropMedia(mediaId, folder.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('mediaLibrary.folderConfirmDelete').replace('{name}', folder.name))) {
      await onDelete(folder.id);
    }
  };

  return (
    <div
      className={`group relative flex flex-col items-center gap-1 p-3 border rounded-[8px] cursor-pointer transition-[border-color,background-color,box-shadow] duration-150 min-h-[120px] justify-center ${
        isDropTarget
          ? 'bg-[var(--bo-accent,#6366f1)]/10 border-[var(--bo-accent,#6366f1)] shadow-[0_0_0_2px_var(--bo-accent,#6366f1)]'
          : 'bg-[var(--bo-bg)] border-[var(--bo-border)] hover:border-[var(--bo-accent,#6366f1)]'
      }`}
      onClick={() => !editing && onOpen(folder.id)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <Folder size={36} className={`mb-1 transition-colors duration-150 ${isDropTarget ? 'text-[var(--bo-accent,#6366f1)] scale-110' : 'text-[var(--bo-accent,#6366f1)]'}`} />

      {editing ? (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            className="bg-[var(--bo-surface)] border border-[var(--bo-border)] text-[var(--bo-text)] text-[0.75rem] px-1 py-[2px] rounded w-[100px] outline-none focus:border-[var(--bo-accent,#6366f1)]"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="text-[var(--bo-green)] hover:opacity-80" onClick={handleConfirmRename}>
            <Check size={14} />
          </button>
          <button className="text-[var(--bo-text-dim)] hover:opacity-80" onClick={() => { setEditing(false); setEditName(folder.name); }}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <span className="text-[0.8rem] font-medium text-[var(--bo-text)] text-center leading-tight truncate max-w-full">
          {folder.name}
        </span>
      )}

      <span className="text-[0.7rem] text-[var(--bo-text-dim)]">
        {mediaCount === 1 ? t('mediaLibrary.count_one') : t('mediaLibrary.folderImageCount').replace('{n}', String(mediaCount))}
      </span>

      {/* Actions au survol */}
      {!editing && (
        <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
          <button
            className="p-1 rounded bg-[var(--bo-surface)] border border-[var(--bo-border)] text-[var(--bo-text-dim)] hover:text-[var(--bo-text)]"
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            title={t('common.edit')}
          >
            <Pencil size={12} />
          </button>
          <button
            className="p-1 rounded bg-[var(--bo-surface)] border border-[var(--bo-border)] text-[var(--bo-text-dim)] hover:text-[#ef4444]"
            onClick={handleDelete}
            title={t('common.delete')}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
