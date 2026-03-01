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
    <div className="block-image-editor">
      <span className="block-image-label">{label}</span>
      <div
        className={`block-image-zone${imageUrl ? ' has-image' : ''}`}
        onClick={() => setPickerOpen(true)}
        title={t('blockImage.clickToChange')}
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="block-image-thumb" />
        ) : (
          <span className="block-image-placeholder">
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
