'use client';

import { useState, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';

export interface ImportResult {
  jsonRestored: string[];
  mediaRestored: number;
  warnings: string[];
}

export function useBackupLogic() {
  const { t } = useI18n();
  const { message, show } = useFlashMessage();

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/backup/export', { method: 'POST' });
      if (!res.ok) {
        show(t('backup.exportError'), 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `nimble-backup-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      show(t('backup.exportSuccess'), 'success');
    } catch {
      show(t('backup.exportError'), 'error');
    } finally {
      setExporting(false);
    }
  }, [t, show]);

  const doImport = useCallback(async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      show(t('backup.invalidFile'), 'error');
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        show(data.error || t('backup.importError'), 'error');
        return;
      }
      setImportResult(data);
      show(t('backup.importSuccess'), 'success');
      // Reload après 1.5s pour vider le cache Zustand
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      show(t('backup.importError'), 'error');
    } finally {
      setImporting(false);
    }
  }, [t, show]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doImport(file);
    // Reset input pour pouvoir re-sélectionner le même fichier
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [doImport]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) doImport(file);
  }, [doImport]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  return {
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
  };
}
