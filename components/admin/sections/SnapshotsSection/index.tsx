'use client';

import { useSnapshotsLogic } from './hooks/useSnapshotsLogic';
import { SnapshotCard } from './components/SnapshotCard';

const MAX_SNAPSHOTS = 5;

export function SnapshotsSection() {
  const {
    t,
    snapshots,
    loading,
    creating,
    newName,
    setNewName,
    showForm,
    setShowForm,
    message,
    handleCreate,
    handleRestore,
    handleDelete,
  } = useSnapshotsLogic();

  return (
    <div className="carousel-section" id="snapshots-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('snapshots.sectionTitle')}</h2>
          <p className="text-[var(--bo-text-dim)] text-[0.82rem] mt-[0.2rem] m-0">{t('snapshots.sectionInfo')}</p>
        </div>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="mt-3 p-4 bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl flex flex-col gap-3">
          {snapshots.length >= MAX_SNAPSHOTS && (
            <p className="text-[var(--bo-text-dim)] text-[0.82rem] m-0">
              {t('snapshots.maxReached')}
            </p>
          )}
          <div className="flex items-center gap-3">
            <input
              type="text"
              style={{ maxWidth: 'none' }}
              className="flex-1 min-w-0"
              placeholder={t('snapshots.namePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={100}
              autoFocus
            />
            <button
              className="btn btn-primary shrink-0"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              {creating ? '...' : t('snapshots.btnCreate')}
            </button>
            <button
              className="btn btn-secondary shrink-0"
              onClick={() => { setShowForm(false); setNewName(''); }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Liste des snapshots */}
      <div className="mt-4 flex flex-col gap-2">
        {loading ? (
          <p className="text-[var(--bo-text-dim)] text-[0.85rem] text-center py-4 m-0">{t('snapshots.loading')}</p>
        ) : snapshots.length === 0 ? (
          <p className="text-[var(--bo-text-dim)] text-[0.85rem] text-center py-4 m-0">{t('snapshots.empty')}</p>
        ) : (
          snapshots.map((snapshot) => (
            <SnapshotCard
              key={snapshot.id}
              snapshot={snapshot}
              onRestore={handleRestore}
              onDelete={handleDelete}
              t={t}
            />
          ))
        )}
      </div>

      {/* Flash message */}
      {message && (
        <div className={`form-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-end mt-3">
        <button className="btn-success" onClick={() => setShowForm((v) => !v)}>
          {t('snapshots.btnCreate')}
        </button>
      </div>
    </div>
  );
}
