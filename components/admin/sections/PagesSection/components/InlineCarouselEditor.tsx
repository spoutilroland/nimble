'use client';

import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { MediaSourcePicker } from '@/components/admin/shared/MediaSourcePicker';

interface CarouselImage {
  filename: string;
  url: string;
}

interface InlineCarouselEditorProps {
  carouselId: string;
  maxImages?: number;
  imageHint?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function InlineCarouselEditor({ carouselId, maxImages: maxImagesProp, imageHint }: InlineCarouselEditorProps) {
  const { t } = useI18n();
  const deleteImage = useAdminStore((s) => s.deleteImage);
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [serverMaxImages, setServerMaxImages] = useState(20);
  const [uploading, setUploading] = useState(false);
  const [dragover, setDragover] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  // La prop a priorité sur la valeur serveur
  const maxImages = maxImagesProp ?? serverMaxImages;
  const remaining = maxImages - images.length;
  const canAdd = remaining > 0;

  const loadImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/carousel/${carouselId}/images`);
      const data = await res.json();
      setImages(data.images || []);
      if (data.maxImages) setServerMaxImages(data.maxImages);
    } catch { /* silencieux */ }
  }, [carouselId]);

  useEffect(() => {
    if (carouselId) loadImages();
  }, [carouselId, loadImages]);

  const handleUpload = async (files: FileList | File[]) => {
    if (!carouselId || uploading) return;
    const validFiles = Array.from(files)
      .filter(f => ACCEPTED_TYPES.includes(f.type))
      .slice(0, remaining);
    if (!validFiles.length) return;
    setUploading(true);
    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append('image', file);
        await fetch(`/api/admin/upload/${carouselId}`, { method: 'POST', body: formData });
      }
      await loadImages();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(t('inlineCarousel.deleteConfirm'))) return;
    const result = await deleteImage(carouselId, filename);
    if (result.ok) {
      setImages((prev) => prev.filter((img) => img.filename !== filename));
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (!canAdd || !e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setDragover(true);
  }, [canAdd]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (!e.relatedTarget || !el.contains(e.relatedTarget as Node)) {
      setDragover(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragover(false);
    if (!canAdd) return;
    const files = e.dataTransfer.files;
    if (files.length) handleUpload(files);
  }, [canAdd, handleUpload]);

  return (
    <div
      className={`inline-carousel-editor${dragover ? ' inline-carousel-dragover' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="inline-carousel-grid">
        {images.map((img) => (
          <div key={img.filename} className="inline-carousel-thumb">
            <img src={img.url} alt="" />
            <button
              className="inline-carousel-delete"
              onClick={() => handleDelete(img.filename)}
              title={t('common.delete')}
            >
              ×
            </button>
          </div>
        ))}
        {canAdd && (
          <button
            className="inline-carousel-add"
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
            title={uploading ? '...' : '+'}
          >
            {uploading ? '…' : '+'}
          </button>
        )}
      </div>
      <div className="inline-carousel-footer">
        {imageHint && <span className="inline-carousel-hint">{t('inlineCarousel.recommended')} {imageHint}</span>}
        <span className="inline-carousel-info">
          {images.length} / {maxImages}
        </span>
      </div>
      <MediaSourcePicker
        carouselId={carouselId}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onFileUpload={(files) => handleUpload(files)}
        onSuccess={() => loadImages()}
        maxSelection={remaining}
      />
    </div>
  );
}
