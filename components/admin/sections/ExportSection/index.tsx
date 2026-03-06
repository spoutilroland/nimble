'use client';

import { useExportLogic } from './hooks/useExportLogic';

export function ExportSection() {
  const { t, exporting, syncing, syncSummary, message, handleExport, handleSyncToBlob } = useExportLogic();

  return (
    <div className="flex flex-col gap-6" id="export-section">

      {/* Export statique */}
      <div className="carousel-section">
        <div className="carousel-section-header">
          <div>
            <h2 className="carousel-section-title">{t('export.sectionTitle')}</h2>
            <p className="carousel-section-info">{t('export.sectionInfo')}</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? t('export.exporting') : t('export.btnExport')}
          </button>
        </div>
        <div className="mt-4 p-4 border border-[var(--bo-border)] rounded text-[var(--bo-text-dim)] text-[0.85rem]">
          {t('export.contactWarning')}
        </div>
      </div>

      {/* Sync Vercel Blob */}
      <div className="carousel-section">
        <div className="carousel-section-header">
          <div>
            <h2 className="carousel-section-title">{t('syncBlob.sectionTitle')}</h2>
            <p className="carousel-section-info">{t('syncBlob.sectionInfo')}</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleSyncToBlob}
            disabled={syncing}
          >
            {syncing ? t('syncBlob.syncing') : t('syncBlob.btnSync')}
          </button>
        </div>

        {/* Résumé après sync */}
        {syncSummary && (
          <div className="mt-4 p-4 border border-[var(--bo-border)] rounded flex gap-6 text-[0.85rem]">
            <span className="text-green-500">{syncSummary.ok} envoyés</span>
            <span className="text-[var(--bo-text-dim)]">{syncSummary.skipped} ignorés</span>
            {syncSummary.errors > 0 && (
              <span className="text-red-500">{syncSummary.errors} erreurs</span>
            )}
            <span className="text-[var(--bo-text-dim)]">/ {syncSummary.total} total</span>
          </div>
        )}
      </div>

      {/* Flash message */}
      {message && (
        <div className={`form-message form-message--${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
