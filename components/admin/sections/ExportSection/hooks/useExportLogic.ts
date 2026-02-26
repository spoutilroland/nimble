'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';

export function useExportLogic() {
  const { t } = useI18n();
  const { message, show } = useFlashMessage();
  const [exporting, setExporting] = useState(false);

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

  return { t, exporting, message, handleExport };
}
