'use client';

import { useI18n } from '@/lib/i18n/context';
import type { MediaItemWithMeta } from '@/lib/types';
import { MediaThumb } from './MediaThumb';

interface MediaGridProps {
  items: MediaItemWithMeta[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

export function MediaGrid({ items, selectedIds, onToggleSelect, onOpen }: MediaGridProps) {
  const { t } = useI18n();

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center text-[var(--bo-text-dim)] text-[0.9rem]">
        <p>{t('mediaLibrary.empty')}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-[0.6rem]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
      {items.map((item) => (
        <MediaThumb
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onToggleSelect={onToggleSelect}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
