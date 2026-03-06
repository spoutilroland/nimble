'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';

export function useExportLogic() {
  const { t } = useI18n();
  const { message, show } = useFlashMessage();
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{ ok: number; skipped: number; errors: number; total: number } | null>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export', { method: 'POST' });

      if (!res.ok) {
        show(t('export.error'), 'error');
        return;
      }

      // Convertit la réponse en blob et déclenche le téléchargement
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'site-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      show(t('export.success'), 'success');
    } catch {
      show(t('export.error'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSyncToBlob = async () => {
    setSyncing(true);
    setSyncSummary(null);
    try {
      const res = await fetch('/api/admin/sync-to-blob', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        show(data.error || t('syncBlob.error'), 'error');
        return;
      }
      setSyncSummary(data.summary);
      show(t('syncBlob.success'), 'success');
    } catch {
      show(t('syncBlob.error'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  return { t, exporting, syncing, syncSummary, message, handleExport, handleSyncToBlob };
}
