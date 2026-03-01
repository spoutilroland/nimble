'use client';

import type { MediaItemWithMeta } from '@/lib/types';

interface MediaThumbProps {
  item: MediaItemWithMeta;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MediaThumb({ item, selected, onToggleSelect, onOpen }: MediaThumbProps) {
  const isSvg = item.mimeType === 'image/svg+xml';
  const src = item.webpUrl ?? item.url;

  return (
    <div
      className={`media-thumb${selected ? ' selected' : ''}`}
      onClick={() => onOpen(item.id)}
    >
      <div className="media-thumb-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.altText || item.originalName}
          loading="lazy"
          className={isSvg ? 'media-thumb-svg' : ''}
        />
      </div>

      <div className="media-thumb-overlay">
        <input
          type="checkbox"
          className="media-thumb-checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="media-thumb-info">
        <span className="media-thumb-name" title={item.originalName}>
          {item.originalName}
        </span>
        {item.fileSize != null && (
          <span className="media-thumb-size">{formatSize(item.fileSize)}</span>
        )}
      </div>
    </div>
  );
}
