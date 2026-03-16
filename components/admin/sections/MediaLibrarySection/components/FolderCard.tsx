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
}

export function FolderCard({ folder, mediaCount, onOpen, onRename, onDelete }: FolderCardProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('mediaLibrary.folderConfirmDelete').replace('{name}', folder.name))) {
      await onDelete(folder.id);
    }
  };

  return (
    <div
      className="group relative flex flex-col items-center gap-1 p-3 bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] cursor-pointer transition-[border-color] duration-150 hover:border-[var(--bo-accent,#6366f1)] min-h-[120px] justify-center"
      onClick={() => !editing && onOpen(folder.id)}
    >
      <Folder size={36} className="text-[var(--bo-accent,#6366f1)] mb-1" />

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
