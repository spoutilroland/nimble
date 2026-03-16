'use client';

import type { SnapshotMeta } from '@/lib/schemas';

interface Props {
  snapshot: SnapshotMeta;
  onRestore: (snapshot: SnapshotMeta) => void;
  onDelete: (snapshot: SnapshotMeta) => void;
  t: (key: string) => string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SnapshotCard({ snapshot, onRestore, onDelete, t }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white border border-[var(--bo-border)] rounded-xl hover:border-[var(--bo-border-hover)] transition-colors">
      <div className="flex flex-col gap-[0.2rem] min-w-0">
        <span className="text-[#1a1a2e] font-semibold text-[0.9rem] truncate">{snapshot.name}</span>
        <span className="text-[#666] text-[0.75rem]">
          {formatDate(snapshot.createdAt)} &mdash; {snapshot.fileCount} {t('snapshots.fileCount')}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="btn btn-secondary text-[0.8rem] py-[0.35rem] px-[0.85rem]"
          onClick={() => onRestore(snapshot)}
        >
          {t('snapshots.btnRestore')}
        </button>
        <button
          className="btn-danger text-[0.8rem] py-[0.35rem] px-[0.85rem]"
          onClick={() => onDelete(snapshot)}
        >
          {t('snapshots.btnDelete')}
        </button>
      </div>
    </div>
  );
}
