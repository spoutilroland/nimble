'use client';

import { useState, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { MediaSourcePicker } from '@/components/admin/shared/MediaSourcePicker';

interface BlockImageEditorProps {
  carouselId: string;
  label: string;
}

export function BlockImageEditor({ carouselId, label }: BlockImageEditorProps) {
  const { t } = useI18n();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const loadImage = () => {
    if (!carouselId) return;
    fetch(`/api/carousel/${carouselId}/images`)
      .then(r => r.json())
      .then(data => {
        const images = data.images || [];
        if (images.length > 0) setImageUrl(images[0].url);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadImage();
  }, [carouselId]);

  const handleUpload = async (file: File) => {
    if (!carouselId || uploading) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`/api/admin/upload/${carouselId}`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.url) setImageUrl(data.url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[0.72rem] text-[var(--bo-text-dim)] min-w-[50px] shrink-0">{label}</span>
      <div
        className={`block-image-zone w-16 h-16 bg-[var(--bo-bg)] border border-dashed border-[var(--bo-border)] rounded cursor-pointer flex items-center justify-center overflow-hidden shrink-0 transition-[border-color] duration-150 hover:border-[var(--bo-green)]${imageUrl ? ' !border-solid' : ''}`}
        onClick={() => setPickerOpen(true)}
        title={t('blockImage.clickToChange')}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[0.72rem] text-[var(--bo-text-dim)]">
            {uploading ? t('blockImage.uploading') : t('blockImage.upload')}
          </span>
        )}
      </div>
      <MediaSourcePicker
        carouselId={carouselId}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onFileUpload={(files) => {
          const file = files[0];
          if (file) handleUpload(file);
        }}
        onSuccess={() => loadImage()}
        maxSelection={1}
      />
    </div>
  );
}
