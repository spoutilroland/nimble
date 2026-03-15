'use client';

import { useExportLogic } from './hooks/useExportLogic';

export function ExportSection() {
  const { t, exporting, message, handleExport } = useExportLogic();

  return (
    <div className="flex flex-col gap-6" id="export-section">
      <div className="carousel-section">
        <div className="carousel-section-header">
          <div>
            <h2 className="carousel-section-title">{t('export.sectionTitle')}</h2>
            <p className="carousel-section-info">{t('export.sectionInfo')}</p>
          </div>
        </div>

        <div className="mt-4 p-4 border border-[var(--bo-border)] rounded text-[var(--bo-text-dim)] text-[0.85rem]">
          {t('export.contactWarning')}
        </div>

        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="flex justify-end mt-3">
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? t('export.exporting') : t('export.btnExport')}
          </button>
        </div>
      </div>
    </div>
  );
}
