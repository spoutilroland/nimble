'use client';

import type { MediaItemWithMeta } from '@/lib/types';

interface MediaThumbProps {
  item: MediaItemWithMeta;
  selected: boolean;
  selectMode: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function MediaThumb({ item, selected, selectMode, onToggleSelect, onOpen }: MediaThumbProps) {
  const isSvg = item.mimeType === 'image/svg+xml';
  const src = item.thumbUrl ?? item.webpUrl ?? item.url;

  const handleClick = () => {
    if (selectMode) {
      onToggleSelect(item.id);
    } else {
      onOpen(item.id);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Marque le drag comme interne pour que le drop zone ignore cet élément
    e.dataTransfer.setData('nimble/media-id', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      className={`group relative aspect-square rounded-[var(--bo-radius-sm,6px)] overflow-hidden cursor-pointer border-2 transition-[border-color,box-shadow] duration-150 bg-[var(--bo-surface)] hover:border-[var(--bo-border-hover)]${selected ? ' border-[var(--bo-green)] shadow-[var(--bo-green-glow)]' : ' border-transparent'}`}
      onClick={handleClick}
      onDragStart={handleDragStart}
    >
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={item.altText || item.originalName}
          loading="lazy"
          draggable={false}
          className={`w-full h-full${isSvg ? ' object-contain p-4' : ' object-cover'}`}
          onError={(e) => {
            const img = e.currentTarget;
            if (item.webpUrl && img.src.includes('.webp')) {
              img.src = item.url;
            }
          }}
        />
      </div>

      {/* Overlay sélection : visible en mode sélection OU au survol */}
      {(selectMode || selected) && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Teinte verte si sélectionné */}
          {selected && <div className="absolute inset-0 bg-[var(--bo-green)]/20" />}
        </div>
      )}

      {/* Coche — grande zone, facile à cliquer */}
      <div
        className={`absolute top-[0.4rem] left-[0.4rem] transition-opacity duration-150${selectMode || selected ? ' opacity-100' : ' opacity-0 group-hover:opacity-100'}`}
        onClick={(e) => { e.stopPropagation(); onToggleSelect(item.id); }}
      >
        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors duration-150${selected ? ' bg-[var(--bo-green)] border-[var(--bo-green)]' : ' bg-black/40 border-white/70 hover:border-white'}`}>
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
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
