'use client';

import { useI18n } from '@/lib/i18n/context';
import { DIVIDER_TYPES, DIVIDER_COLORS, DIVIDER_SVG_PATHS } from '@/lib/admin/constants/pages';
import type { DividerConfig } from '@/lib/types';

interface DividerRowProps {
  divider?: DividerConfig;
  onChange: (d: DividerConfig | undefined) => void;
}

function getDividerPreviewSvg(type: string, flip: boolean): string {
  if (!type || type === 'none' || !DIVIDER_SVG_PATHS[type]) return '';
  const pathEl = `<path d="${DIVIDER_SVG_PATHS[type]}" fill="currentColor"/>`;
  const inner = flip
    ? `<g transform="scale(1,-1) translate(0,-80)">${pathEl}</g>`
    : pathEl;
  return `<svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="display:block;width:100%;height:100%;">${inner}</svg>`;
}

export function DividerRow({ divider, onChange }: DividerRowProps) {
  const { t } = useI18n();
  const currentType = divider?.type || 'none';
  const currentColor = divider?.color || 'var(--primary)';
  const currentFlip = divider?.flip || false;
  const isNone = currentType === 'none';

  const handleTypeChange = (type: DividerConfig['type']) => {
    if (type === 'none') {
      onChange(undefined);
    } else {
      onChange({ type, color: currentColor, flip: currentFlip });
    }
  };

  const handleColorChange = (color: string) => {
    onChange({ type: currentType as DividerConfig['type'], color, flip: currentFlip });
  };

  const handleFlipChange = (flip: boolean) => {
    onChange({ type: currentType as DividerConfig['type'], color: currentColor, flip });
  };

  return (
    <div className="section-divider-row">
      <div className="section-divider-controls">
        <select
          className="section-divider-type"
          value={currentType}
          onChange={(e) => handleTypeChange(e.target.value as DividerConfig['type'])}
        >
          {DIVIDER_TYPES.map(dt => (
            <option key={dt} value={dt}>{t(`divider.${dt}`)}</option>
          ))}
        </select>

        {!isNone && (
          <>
            <select
              className="section-divider-color"
              value={currentColor}
              onChange={(e) => handleColorChange(e.target.value)}
            >
              {DIVIDER_COLORS.map(c => (
                <option key={c.value} value={c.value}>{t(c.key)}</option>
              ))}
            </select>
            <label className="section-divider-flip-label">
              <input
                type="checkbox"
                className="section-divider-flip"
                checked={currentFlip}
                onChange={(e) => handleFlipChange(e.target.checked)}
              />
              {' '}{t('divider.invertLabel')}
            </label>
          </>
        )}
      </div>

      {!isNone && (
        <div
          className="section-divider-preview"
          style={{ color: currentColor }}
          dangerouslySetInnerHTML={{ __html: getDividerPreviewSvg(currentType, currentFlip) }}
        />
      )}
    </div>
  );
}
