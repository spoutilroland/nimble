'use client';

import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBackupLogic } from './hooks/useBackupLogic';

export function BackupSection() {
  const {
    t,
    message,
    exporting,
    importing,
    importResult,
    dragOver,
    fileInputRef,
    handleExport,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  } = useBackupLogic();

  return (
    <div className="carousel-section" id="backup-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('backup.sectionTitle')}</h2>
          <p className="text-[var(--bo-text-dim)] text-[0.82rem] mt-[0.2rem] m-0">
            {t('backup.sectionInfo')}
          </p>
        </div>
      </div>

      {/* Export */}
      <div className="mt-4 p-5 bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Download size={18} className="text-[var(--bo-green)] shrink-0" />
          <h3 className="text-[0.92rem] font-semibold text-[var(--bo-text)] m-0">
            {t('backup.exportTitle')}
          </h3>
        </div>
        <p className="text-[var(--bo-text-dim)] text-[0.82rem] m-0 mb-3">
          {t('backup.exportDesc')}
        </p>
        <button
          className="btn btn-primary"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? t('backup.exporting') : t('backup.btnExport')}
        </button>
      </div>

      {/* Import */}
      <div className="mt-3 p-5 bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl">
        <div className="flex items-center gap-3 mb-2">
          <Upload size={18} className="text-[var(--bo-green)] shrink-0" />
          <h3 className="text-[0.92rem] font-semibold text-[var(--bo-text)] m-0">
            {t('backup.importTitle')}
          </h3>
        </div>
        <p className="text-[var(--bo-text-dim)] text-[0.82rem] m-0 mb-3">
          {t('backup.importDesc')}
        </p>

        {/* Zone de drop */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-150 ${
            dragOver
              ? 'border-[var(--bo-green)] bg-[rgba(var(--bo-green-rgb,74,222,128),0.08)]'
              : 'border-[var(--bo-border)] hover:border-[var(--bo-border-hover)]'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          {importing ? (
            <p className="text-[var(--bo-text)] text-[0.85rem] m-0">
              {t('backup.importing')}
            </p>
          ) : (
            <>
              <Upload size={28} className="mx-auto mb-2 text-[var(--bo-text-dim)]" />
              <p className="text-[var(--bo-text)] text-[0.85rem] m-0">
                {t('backup.dropzoneLabel')}
              </p>
              <p className="text-[var(--bo-text-dim)] text-[0.75rem] m-0 mt-1">
                {t('backup.dropzoneHint')}
              </p>
            </>
          )}
        </div>

        {/* Avertissement */}
        <div className="flex items-start gap-2 mt-3 p-3 bg-[rgba(255,180,50,0.08)] border border-[rgba(255,180,50,0.25)] rounded-lg">
          <AlertTriangle size={16} className="text-[#ffb432] shrink-0 mt-[2px]" />
          <p className="text-[var(--bo-text-dim)] text-[0.78rem] m-0">
            {t('backup.importWarning')}
          </p>
        </div>
      </div>

      {/* Résultat d'import */}
      {importResult && (
        <div className="mt-3 p-4 bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-[var(--bo-green)]" />
            <span className="text-[0.85rem] font-semibold text-[var(--bo-text)]">
              {t('backup.importResultTitle')}
            </span>
          </div>
          <ul className="text-[0.82rem] text-[var(--bo-text-dim)] list-none p-0 m-0 flex flex-col gap-1">
            <li>
              {t('backup.resultJson').replace('{n}', String(importResult.jsonRestored.length))}
              {importResult.jsonRestored.length > 0 && (
                <span className="text-[0.75rem] ml-1 opacity-70">
                  ({importResult.jsonRestored.join(', ')})
                </span>
              )}
            </li>
            <li>
              {t('backup.resultMedia').replace('{n}', String(importResult.mediaRestored))}
            </li>
          </ul>
          {importResult.warnings.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--bo-border)]">
              <p className="text-[0.78rem] text-[#ffb432] font-semibold m-0 mb-1">
                {t('backup.warnings')}
              </p>
              <ul className="text-[0.75rem] text-[var(--bo-text-dim)] list-disc pl-4 m-0 flex flex-col gap-[2px]">
                {importResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Flash message */}
      {message && (
        <div className={`form-message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
