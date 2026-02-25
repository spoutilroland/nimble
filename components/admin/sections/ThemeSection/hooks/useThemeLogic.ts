'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import { applyThemeLive } from '@/lib/admin/constants/themes';

export function useThemeLogic() {
  const { t } = useI18n();
  const themeData = useAdminStore((s) => s.theme);
  const loadTheme = useAdminStore((s) => s.loadTheme);
  const saveTheme = useAdminStore((s) => s.saveTheme);
  const deleteCustomTheme = useAdminStore((s) => s.deleteCustomTheme);
  const { message, show } = useFlashMessage();
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  const active = themeData?.theme ?? 'alpine';
  const customThemes = themeData?.customThemes ?? {};

  const activateTheme = async (themeId: string, label: string) => {
    const ok = await saveTheme(themeId);
    if (ok) {
      const updated = useAdminStore.getState().theme;
      applyThemeLive(themeId, updated?.vars as Record<string, string> | undefined);
      show(t('theme.activated', { name: label }), 'success');
    } else {
      show(t('theme.activateError'), 'error');
    }
  };

  const deleteTheme = async (id: string) => {
    if (!confirm(t('theme.confirmDelete', { name: id }))) return;
    const ok = await deleteCustomTheme(id);
    if (!ok) alert(t('theme.deleteError'));
  };

  const handleThemeSaved = async () => {
    setShowCreator(false);
    await loadTheme();
  };

  return {
    active,
    customThemes,
    message,
    showCreator,
    setShowCreator,
    activateTheme,
    deleteTheme,
    handleThemeSaved,
    t,
  };
}
