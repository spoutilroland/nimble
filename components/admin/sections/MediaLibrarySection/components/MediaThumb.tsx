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
  const src = item.url;

  return (
    <div
      className={`relative aspect-square rounded-[var(--bo-radius-sm,6px)] overflow-hidden cursor-pointer border-2 transition-[border-color,box-shadow] duration-150 bg-[var(--bo-surface)] hover:border-[var(--bo-border-hover)]${selected ? ' border-[var(--bo-green)] shadow-[var(--bo-green-glow)]' : ' border-transparent'}`}
      onClick={() => onOpen(item.id)}
    >
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.altText || item.originalName}
          loading="lazy"
          className={`w-full h-full${isSvg ? ' object-contain p-4' : ' object-cover'}`}
        />
      </div>

      <div className={`absolute inset-0 flex items-start justify-start p-[0.4rem] transition-opacity duration-150 pointer-events-none${selected ? ' opacity-100' : ' opacity-0 hover:opacity-100'}`}>
        <input
          type="checkbox"
          className="w-[18px] h-[18px] accent-[var(--bo-green)] cursor-pointer pointer-events-auto"
          checked={selected}
          onChange={() => onToggleSelect(item.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-[0.4rem] py-[0.3rem] bg-gradient-to-t from-black/70 flex flex-col gap-[0.1rem] pointer-events-none">
        <span className="text-white text-[0.7rem] whitespace-nowrap overflow-hidden text-ellipsis" title={item.originalName}>
          {item.originalName}
        </span>
        {item.fileSize != null && (
          <span className="text-white/70 text-[0.65rem]">{formatSize(item.fileSize)}</span>
        )}
      </div>
    </div>
  );
}
