'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import type { CustomRadius } from '@/lib/types';

type BorderStyle = 'angular' | 'flat' | 'rounded' | 'pill' | 'custom';

export interface StyleDef {
  id: BorderStyle;
  labelKey: string;
  radius: string | null;
  clip: string;
}

export const STYLES: StyleDef[] = [
  { id: 'angular', labelKey: 'border.angular', radius: '0', clip: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' },
  { id: 'flat', labelKey: 'border.flat', radius: '0', clip: 'none' },
  { id: 'rounded', labelKey: 'border.rounded', radius: '8px', clip: 'none' },
  { id: 'pill', labelKey: 'border.pill', radius: '24px', clip: 'none' },
  { id: 'custom', labelKey: 'border.custom', radius: null, clip: 'none' },
];

export const CORNERS = ['tl', 'tr', 'br', 'bl'] as const;

export function useBorderLogic() {
  const { t } = useI18n();
  const site = useAdminStore((s) => s.site);
  const loadSite = useAdminStore((s) => s.loadSite);
  const saveSite = useAdminStore((s) => s.saveSite);
  const [current, setCurrent] = useState<BorderStyle>('angular');
  const [corners, setCorners] = useState<CustomRadius>({ tl: 8, tr: 8, br: 8, bl: 8 });
  const [locked, setLocked] = useState(false);
  const { message, show } = useFlashMessage();

  useEffect(() => {
    if (!site) loadSite();
  }, [site, loadSite]);

  useEffect(() => {
    if (site) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrent((site.design?.borderStyle as BorderStyle) || 'angular');
      if (site.design?.customRadius) {
        setCorners(site.design.customRadius);
      }
    }
  }, [site]);

  const saveStyle = async (style: BorderStyle, customRadius?: CustomRadius) => {
    const design = { ...site?.design, borderStyle: style } as { borderStyle: string; customRadius?: CustomRadius };
    if (customRadius) design.customRadius = customRadius;
    const ok = await saveSite({ design });
    if (ok) {
      show(t('border.saved'), 'success');
    } else {
      show(t('border.saveError'), 'error');
    }
  };

  const handlePresetClick = async (style: BorderStyle) => {
    setCurrent(style);
    document.documentElement.setAttribute('data-border', style);
    if (style !== 'custom') {
      document.documentElement.style.removeProperty('--radius');
      await saveStyle(style);
    } else {
      const val = `${corners.tl}px ${corners.tr}px ${corners.br}px ${corners.bl}px`;
      document.documentElement.style.setProperty('--radius', val);
    }
  };

  const handleCornerChange = (corner: typeof CORNERS[number], value: number) => {
    if (locked) {
      const newCorners = { tl: value, tr: value, br: value, bl: value };
      setCorners(newCorners);
      const val = `${value}px ${value}px ${value}px ${value}px`;
      document.documentElement.style.setProperty('--radius', val);
    } else {
      setCorners(prev => {
        const next = { ...prev, [corner]: value };
        const val = `${next.tl}px ${next.tr}px ${next.br}px ${next.bl}px`;
        document.documentElement.style.setProperty('--radius', val);
        return next;
      });
    }
  };

  const handleSaveCustom = () => {
    saveStyle('custom', corners);
  };

  return {
    current,
    corners,
    locked,
    setLocked,
    message,
    handlePresetClick,
    handleCornerChange,
    handleSaveCustom,
    t,
  };
}
