'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore, type CarouselApiEntry } from '@/lib/admin/store';
import { ImageCard, type ImageData } from '../shared/ImageCard';
import { useDragDrop } from '../shared/DragDrop';
import { MediaPicker } from '../shared/MediaPicker';

// ============================================================
//  COMPOSANT PRINCIPAL — liste tous les carousels
// ============================================================

export function CarouselSection() {
  const { t } = useI18n();
  const carousels = useAdminStore((s) => s.carousels);
  const carouselsLoading = useAdminStore((s) => s.carouselsLoading);
  const loadCarousels = useAdminStore((s) => s.loadCarousels);

  useEffect(() => {
    loadCarousels();
  }, [loadCarousels]);

  if (carouselsLoading && Object.keys(carousels).length === 0) return null;

  return (
    <>
      {Object.entries(carousels).map(([carouselId, data]) => (
        <SingleCarousel
          key={carouselId}
          carouselId={carouselId}
          data={data}
          onReload={loadCarousels}
        />
      ))}
    </>
  );
}

// ============================================================
//  CAROUSEL INDIVIDUEL
// ============================================================

interface SingleCarouselProps {
  carouselId: string;
  data: CarouselApiEntry;
  onReload: () => Promise<void>;
}

function SingleCarousel({ carouselId, data, onReload }: SingleCarouselProps) {
  const { t, tp } = useI18n();
  const storeReorder = useAdminStore((s) => s.reorderImages);
  const storeDeleteImage = useAdminStore((s) => s.deleteImage);
  const [collapsed, setCollapsed] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { carousel, images } = data;

  const showMessage = useCallback((text: string, type: 'success' | 'error' | '') => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: '', type: '' }), 2000);
  }, []);

  // Drag & Drop reorder
  const handleReorder = useCallback(async (newOrder: string[]) => {
    await storeReorder(carouselId, newOrder);
  }, [carouselId, storeReorder]);

  const { handleDragStart, handleDragEnd, handleGridDragOver, handleGridDragLeave, handleGridDrop } =
    useDragDrop(carouselId, handleReorder);

  // Upload fichiers
  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    let success = 0;
    let lastError: string | null = null;

    for (let i = 0; i < fileArr.length; i++) {
      showMessage(t('carousel.uploadProgress', { current: String(i + 1), total: String(fileArr.length) }), '');

      const formData = new FormData();
      formData.append('image', fileArr[i]);

      try {
        const res = await fetch(`/api/admin/upload/${encodeURIComponent(carouselId)}`, { method: 'POST', body: formData });
        const body = await res.json();
        if (res.ok) { success++; } else { lastError = body.error || t('carousel.uploadErrorUnknown'); }
      } catch { lastError = t('carousel.uploadErrorNetwork'); }
    }

    const errors = fileArr.length - success;
    if (errors === 0) {
      showMessage(tp('carousel.uploadSuccess', success), 'success');
    } else if (success === 0) {
      showMessage(lastError || t('carousel.uploadErrorUnknown'), 'error');
    } else {
      showMessage(t('carousel.uploadPartial', { success: String(success), s: success > 1 ? 's' : '', error: lastError || '' }), 'error');
    }

    setTimeout(() => onReload(), 1500);
  }, [carouselId, t, tp, showMessage, onReload]);  // upload reste local (FormData + progress)

  // Supprimer une image
  const deleteImage = useCallback(async (filename: string) => {
    if (!confirm(t('deleteImage.confirm', { filename }))) return;

    const result = await storeDeleteImage(carouselId, filename);
    if (!result.ok) {
      alert(result.error || t('deleteImage.failed'));
    }
  }, [carouselId, t, storeDeleteImage]);

  // Supprimer toutes les images
  const deleteAll = useCallback(async () => {
    if (!confirm(tp('carousel.confirmDeleteAll', images.length, { n: String(images.length) }))) return;

    let success = 0;
    let errors = 0;

    for (let i = 0; i < images.length; i++) {
      showMessage(t('carousel.deleteProgress', { current: String(i + 1), total: String(images.length) }), '');
      const result = await storeDeleteImage(carouselId, images[i].filename);
      if (result.ok) { success++; } else { errors++; }
    }

    if (errors === 0) {
      showMessage(tp('carousel.deleteSuccess', success), 'success');
    } else {
      showMessage(t('carousel.deletePartial', {
        success: String(success), s: success > 1 ? 's' : '',
        errors: String(errors), e: errors > 1 ? 's' : '',
      }), 'error');
    }
  }, [carouselId, images, t, tp, showMessage, storeDeleteImage]);

  // Drop de fichiers depuis l'OS
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('dragover');
    if (e.dataTransfer.types.includes('Files')) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  return (
    <div className="carousel-section">
      <div className="carousel-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            className="btn-collapse"
            title={t('carousel.collapseTitle')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
          <div>
            <h2>{carousel.title}</h2>
            <div className="carousel-info">{images.length} / {carousel.maxImages} images</div>
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm btn-pick-media"
          title={t('carousel.pickFromSiteTitle')}
          onClick={() => setPickerOpen(true)}
        >
          {t('carousel.pickFromSiteLabel')}
        </button>
      </div>

      {!collapsed && (
        <div>
          {/* Grille d'images */}
          <div
            className="images-grid"
            onDragOver={(e) => {
              handleGridDragOver(e);
              if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
                (e.currentTarget as HTMLElement).classList.add('dragover');
              }
            }}
            onDragLeave={handleGridDragLeave}
            onDrop={(e) => {
              handleGridDrop(e);
              handleFileDrop(e);
            }}
          >
            {images.length === 0 ? (
              <EmptyGrid
                carouselId={carouselId}
                onUploadClick={() => fileInputRef.current?.click()}
                onPickClick={() => setPickerOpen(true)}
              />
            ) : (
              <>
                {images.map(image => (
                  <ImageCard
                    key={image.filename}
                    image={image as ImageData}
                    onDelete={() => deleteImage(image.filename)}
                    onDragStart={(e) => handleDragStart(image.filename, e)}
                    onDragEnd={handleDragEnd}
                  />
                ))}

                <label
                  className="grid-add-btn"
                  title={t('carousel.uploadFromPcTitle')}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span>+</span>
                </label>

                <button
                  className="grid-add-btn grid-add-btn--pick"
                  type="button"
                  title={t('carousel.pickFromSiteBtn')}
                  onClick={() => setPickerOpen(true)}
                >
                  <span>📂</span>
                </button>
              </>
            )}
          </div>

          {/* Footer : message + bouton tout supprimer */}
          <div className="section-footer">
            {message.text && (
              <div className={`section-upload-msg ${message.type}`}>{message.text}</div>
            )}
            {images.length > 0 && (
              <button className="btn-delete-all" onClick={deleteAll}>
                {t('carousel.deleteAllBtn')}
              </button>
            )}
          </div>

          {/* Input fichier caché */}
          <input
            ref={fileInputRef}
            type="file"
            className="section-file-input"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>
      )}

      {/* Modale Media Picker */}
      <MediaPicker
        targetCarouselId={carouselId}
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onCopySuccess={onReload}
      />
    </div>
  );
}

// ============================================================
//  ÉTAT VIDE — deux zones côte à côte
// ============================================================

interface EmptyGridProps {
  carouselId: string;
  onUploadClick: () => void;
  onPickClick: () => void;
}

function EmptyGrid({ onUploadClick, onPickClick }: EmptyGridProps) {
  const { t } = useI18n();

  return (
    <div className="grid-empty-wrapper">
      <div className="grid-empty-state" onClick={onUploadClick} style={{ cursor: 'pointer' }}>
        <span className="empty-icon">⬆</span>
        <span className="empty-text">{t('carousel.emptyFromPcLabel')}</span>
        <span className="empty-hint">{t('carousel.emptyFromPcHint')}</span>
      </div>
      <button
        className="grid-empty-state grid-empty-state--secondary"
        type="button"
        onClick={onPickClick}
      >
        <span className="empty-icon">📂</span>
        <span className="empty-text">{t('carousel.emptyFromSiteLabel')}</span>
        <span className="empty-hint">{t('carousel.emptyFromSiteHint')}</span>
      </button>
    </div>
  );
}
