'use client';

import { useI18n } from '@/lib/i18n/context';

interface BlockOptionsRowProps {
  block: {
    row: number;
    col: number;
    colSpan: number;
    // social-links
    shape?: string;
    direction?: string;
    size?: string;
    // map
    provider?: string;
    address?: string;
    embedUrl?: string;
    height?: string;
  };
  type: string;
  maxCols?: number;
  context?: 'footer' | 'layout';
  onUpdate: (updates: Record<string, unknown>) => void;
}

export function BlockOptionsRow({ block, type, maxCols = 3, context, onUpdate }: BlockOptionsRowProps) {
  const { t } = useI18n();
  const colOptions = Array.from({ length: maxCols }, (_, i) => i + 1);

  return (
    <>
      {/* Row / Col / ColSpan */}
      <label className="canvas-block-opt">
        {t('block.rowLabel')}
        <select value={block.row} onChange={(e) => onUpdate({ row: parseInt(e.target.value) })}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <label className="canvas-block-opt">
        {t('block.colLabel')}
        <select value={block.col} onChange={(e) => onUpdate({ col: parseInt(e.target.value) })}>
          {colOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>
      <label className="canvas-block-opt">
        {t('block.widthLabel')}
        <select value={block.colSpan} onChange={(e) => onUpdate({ colSpan: parseInt(e.target.value) })}>
          {colOptions.map(c => (
            <option key={c} value={c}>{t('block.colUnit', { n: String(c) })}</option>
          ))}
        </select>
      </label>

      {/* Social links options */}
      {type === 'social-links' && context !== 'footer' && (
        <>
          <label className="canvas-block-opt">
            {t('block.directionLabel')}
            <select value={block.direction || 'horizontal'} onChange={(e) => onUpdate({ direction: e.target.value })}>
              <option value="horizontal">{t('block.directionHorizontal')}</option>
              <option value="vertical">{t('block.directionVertical')}</option>
            </select>
          </label>
          <label className="canvas-block-opt">
            {t('block.sizeLabel')}
            <select value={block.size || 'md'} onChange={(e) => onUpdate({ size: e.target.value })}>
              <option value="sm">{t('block.sizeSm')}</option>
              <option value="md">{t('block.sizeMd')}</option>
              <option value="lg">{t('block.sizeLg')}</option>
            </select>
          </label>
        </>
      )}

      {/* Map options */}
      {type === 'map' && (
        <>
          <label className="canvas-block-opt">
            {t('block.mapProviderLabel')}
            <select value={block.provider || 'leaflet'} onChange={(e) => onUpdate({ provider: e.target.value })}>
              <option value="leaflet">{t('block.mapOpenStreetMap')}</option>
              <option value="google-embed">{t('block.mapGoogleMaps')}</option>
            </select>
          </label>
          {(block.provider || 'leaflet') !== 'google-embed' && (
            <label className="canvas-block-opt">
              {t('block.mapAddressLabel')}
              <input
                type="text"
                value={block.address || ''}
                placeholder={t('block.mapAddressPlaceholder')}
                onChange={(e) => onUpdate({ address: e.target.value })}
              />
            </label>
          )}
          {block.provider === 'google-embed' && (
            <label className="canvas-block-opt">
              {t('block.mapEmbedLabel')}
              <input
                type="text"
                value={block.embedUrl || ''}
                placeholder={t('block.mapEmbedPlaceholder')}
                onChange={(e) => onUpdate({ embedUrl: e.target.value })}
              />
            </label>
          )}
          <label className="canvas-block-opt">
            {t('block.mapHeightLabel')}
            <select value={block.height || '300'} onChange={(e) => onUpdate({ height: e.target.value })}>
              <option value="200">200px</option>
              <option value="300">300px</option>
              <option value="400">400px</option>
            </select>
          </label>
        </>
      )}
    </>
  );
}
