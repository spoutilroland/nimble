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
          <h2 className="carousel-section-title">{t('snapshots.sectionTitle')}</h2>
          <p className="carousel-section-info">{t('snapshots.sectionInfo')}</p>
        </div>
        <button
          className="btn btn-success"
          onClick={() => setShowForm((v) => !v)}
        >
          {t('snapshots.btnCreate')}
        </button>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="mt-4 p-4 border border-[var(--bo-border)] rounded">
          {snapshots.length >= MAX_SNAPSHOTS && (
            <p className="text-[var(--bo-text-dim)] text-[0.85rem] mb-3">
              {t('snapshots.maxReached')}
            </p>
          )}
          <div className="flex items-center gap-[0.8rem]">
            <input
              className="site-input flex-1"
              type="text"
              placeholder={t('snapshots.namePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              maxLength={100}
              autoFocus
            />
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
            >
              {creating ? '...' : t('snapshots.btnCreate')}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowForm(false); setNewName(''); }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Liste des snapshots */}
      <div className="mt-4">
        {loading ? (
          <p className="text-[var(--bo-text-dim)] p-4 text-center">{t('snapshots.loading')}</p>
        ) : snapshots.length === 0 ? (
          <p className="text-[var(--bo-text-dim)] p-4 text-center">{t('snapshots.empty')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {snapshots.map((snapshot) => (
              <SnapshotCard
                key={snapshot.id}
                snapshot={snapshot}
                onRestore={handleRestore}
                onDelete={handleDelete}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Flash message */}
      {message && (
        <div className={`form-message form-message--${message.type} mt-4`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
