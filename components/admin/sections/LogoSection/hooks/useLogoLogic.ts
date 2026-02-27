'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';

type LogoMode = 'logo-only' | 'name-only' | 'logo-name';
type LogoPosition = 'left' | 'center' | 'right';

export function useLogoLogic() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [logoMode, setLogoMode] = useState<LogoMode>('logo-only');
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('left');
  const { message: logoMsg, show: showLogoMsg } = useFlashMessage(2000);
  const { message: faviconMsg, show: showFaviconMsg } = useFlashMessage(2000);
  const { message: modeMsg, show: showModeMsg } = useFlashMessage(2000);
  const { message: posMsg, show: showPosMsg } = useFlashMessage(2000);

  const loadMedia = useCallback(async () => {
    try { const r = await fetch('/api/logo'); setLogoUrl((await r.json()).url); } catch { /* ignore */ }
    try { const r = await fetch('/api/favicon'); setFaviconUrl((await r.json()).url); } catch { /* ignore */ }
  }, []);

  // Charge le site si pas encore en store
  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  // Charge logo + favicon une seule fois au mount
  useEffect(() => {
    loadMedia();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (site) {
      setLogoMode(site.logoMode || 'logo-only');
      setLogoPosition(site.logoPosition || 'left');
    }
  }, [site]);

  const handleModeChange = async (mode: LogoMode) => {
    setLogoMode(mode);
    const ok = await saveSite({ logoMode: mode });
    if (ok) {
      showModeMsg(t('logo.modeUpdated'), 'success');
    } else {
      showModeMsg(t('logo.saveError'), 'error');
    }
  };

  const handlePositionChange = async (position: LogoPosition) => {
    setLogoPosition(position);
    const ok = await saveSite({ logoPosition: position });
    if (ok) {
      showPosMsg(t('logo.positionUpdated'), 'success');
    } else {
      showPosMsg(t('logo.saveError'), 'error');
    }
  };

  const uploadMedia = async (endpoint: string, fieldName: string, file: File, showMsg: (text: string, type: 'success' | 'error') => void, successKey: string) => {
    const formData = new FormData();
    formData.append(fieldName, file);
    try {
      const r = await fetch(endpoint, { method: 'POST', body: formData });
      if (!r.ok) throw new Error((await r.json()).error || 'Erreur');
      showMsg(t(successKey), 'success');
      setTimeout(() => loadMedia(), 800);
    } catch (err) {
      showMsg((err as Error).message, 'error');
    }
  };

  const deleteMedia = async (endpoint: string, showMsg: (text: string, type: 'success' | 'error') => void, confirmKey: string, successKey: string, errorKey: string) => {
    if (!confirm(t(confirmKey))) return;
    try {
      const r = await fetch(endpoint, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      showMsg(t(successKey), 'success');
      setTimeout(() => loadMedia(), 800);
    } catch {
      showMsg(t(errorKey), 'error');
    }
  };

  const handleLogoUpload = (file: File) => uploadMedia('/api/admin/logo', 'logo', file, showLogoMsg, 'logo.logoUpdated');
  const handleDeleteLogo = () => deleteMedia('/api/admin/logo', showLogoMsg, 'logo.confirmDelete', 'logo.logoDeleted', 'logo.deleteError');
  const handleFaviconUpload = (file: File) => uploadMedia('/api/admin/favicon', 'favicon', file, showFaviconMsg, 'logo.faviconUpdated');
  const handleDeleteFavicon = () => deleteMedia('/api/admin/favicon', showFaviconMsg, 'logo.confirmDeleteFavicon', 'logo.faviconDeleted', 'logo.deleteError');

  const modes: { value: LogoMode; labelKey: string }[] = [
    { value: 'logo-only', labelKey: 'logo.modeLogoOnly' },
    { value: 'name-only', labelKey: 'logo.modeNameOnly' },
    { value: 'logo-name', labelKey: 'logo.modeLogoName' },
  ];

  const positions: { value: LogoPosition; labelKey: string }[] = [
    { value: 'left', labelKey: 'logo.positionLeft' },
    { value: 'center', labelKey: 'logo.positionCenter' },
    { value: 'right', labelKey: 'logo.positionRight' },
  ];

  return {
    logoUrl,
    faviconUrl,
    logoMode,
    logoPosition,
    logoMsg,
    faviconMsg,
    modeMsg,
    posMsg,
    modes,
    positions,
    handleModeChange,
    handlePositionChange,
    handleLogoUpload,
    handleDeleteLogo,
    handleFaviconUpload,
    handleDeleteFavicon,
    t,
  };
}
