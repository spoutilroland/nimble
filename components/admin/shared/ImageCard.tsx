'use client';

import { useI18n } from '@/lib/i18n/context';

export interface ImageData {
  filename: string;
  url: string;
  webpUrl?: string | null;
}

interface ImageCardProps {
  image: ImageData;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function ImageCard({ image, onDelete, onDragStart, onDragEnd }: ImageCardProps) {
  const { t } = useI18n();

  return (
    <div
      className="image-card"
      draggable
      data-filename={image.filename}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="drag-handle" title={t('imageCard.dragHandle')}>⠿</div>
      <img src={image.url} alt={image.filename} draggable={false} />
      <div className="image-card-actions">
        <button className="btn btn-danger" onClick={onDelete}>
          {t('imageCard.deleteBtn')}
        </button>
      </div>
    </div>
  );
}
