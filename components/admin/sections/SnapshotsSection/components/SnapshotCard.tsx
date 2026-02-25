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
    <div className="page-card">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-[0.3rem]">
          <strong className="text-[var(--bo-text)]">{snapshot.name}</strong>
          <span className="text-[var(--bo-text-dim)] text-[0.8rem]">
            {formatDate(snapshot.createdAt)} &mdash; {snapshot.fileCount} {t('snapshots.fileCount').replace('{n}', String(snapshot.fileCount))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary text-[0.82rem] py-[0.4rem] px-[0.9rem]"
            onClick={() => onRestore(snapshot)}
          >
            {t('snapshots.btnRestore')}
          </button>
          <button
            className="btn btn-danger text-[0.82rem] py-[0.4rem] px-[0.9rem]"
            onClick={() => onDelete(snapshot)}
          >
            {t('snapshots.btnDelete')}
          </button>
        </div>
      </div>
    </div>
  );
}
