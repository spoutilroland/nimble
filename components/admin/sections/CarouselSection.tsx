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
  const carousels = useAdminStore((s) => s.carousels);
  const carouselsLoading = useAdminStore((s) => s.carouselsLoading);
  const loadCarousels = useAdminStore((s) => s.loadCarousels);

  useEffect(() => {
    loadCarousels();
  }, [loadCarousels]);

  if (carouselsLoading && Object.keys(carousels).length === 0) return null;

  // Séparer les carousels standalone vs ceux appartenant à un layout groupé
  const standalone: [string, CarouselApiEntry][] = [];
  const groups = new Map<string, [string, CarouselApiEntry][]>();

  for (const [id, data] of Object.entries(carousels)) {
    if (data.groupKey) {
      const key = data.groupKey;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push([id, data]);
    } else {
      standalone.push([id, data]);
    }
  }

  return (
    <>
      {/* Un seul panneau par layout personnalisé */}
      {[...groups.entries()].map(([groupKey, entries]) => (
        <GroupedCarouselPanel
          key={groupKey}
          groupLabel={entries[0][1].groupLabel || groupKey}
          entries={entries}
          onReload={loadCarousels}
        />
      ))}

      {/* Carousels standalone (non liés à un layout) */}
      {standalone.map(([id, data]) => (
        <SingleCarousel key={id} carouselId={id} data={data} onReload={loadCarousels} />
      ))}
    </>
  );
}

// ============================================================
//  PANNEAU GROUPÉ — un panel pour tout un layout personnalisé
// ============================================================

interface GroupedCarouselPanelProps {
  groupLabel: string;
  entries: [string, CarouselApiEntry][];
  onReload: () => Promise<void>;
}

function GroupedCarouselPanel({ groupLabel, entries, onReload }: GroupedCarouselPanelProps) {
  const [collapsed, setCollapsed] = useState(true);

  const totalImages = entries.reduce((sum, [, data]) => sum + data.images.length, 0);
  const totalMax = entries.reduce((sum, [, data]) => sum + data.carousel.maxImages, 0);

  return (
    <div className="carousel-section">
      <div className="carousel-section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button
            className="btn-collapse"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
          <div>
            <h2>{groupLabel}</h2>
            <div className="carousel-info">{totalImages} / {totalMax} images</div>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="grouped-carousel-slots">
          {entries.map(([carouselId, data]) => (
            <GroupedImageSlot
              key={carouselId}
              carouselId={carouselId}
              data={data}
              onReload={onReload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  SLOT IMAGE — un bloc image dans un layout groupé
// ============================================================

interface GroupedImageSlotProps {
  carouselId: string;
  data: CarouselApiEntry;
  onReload: () => Promise<void>;
}

function GroupedImageSlot({ carouselId, data, onReload }: GroupedImageSlotProps) {
  const { t } = useI18n();
  const storeDeleteImage = useAdminStore((s) => s.deleteImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { images, blockLabel } = data;

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      await fetch(`/api/admin/upload/${encodeURIComponent(carouselId)}`, { method: 'POST', body: formData });
      setTimeout(onReload, 500);
    } finally {
      setUploading(false);
    }
  }, [carouselId, onReload]);

  const deleteImage = useCallback(async (filename: string) => {
    if (!confirm(t('deleteImage.confirm', { filename }))) return;
    await storeDeleteImage(carouselId, filename);
  }, [carouselId, t, storeDeleteImage]);

  return (
    <div className="grouped-image-slot">
      <div className="grouped-slot-label">{blockLabel || data.carousel.title}</div>
      <div className="grouped-slot-content">
        {images.map((img) => (
          <div key={img.filename} className="grouped-slot-thumb">
            <img src={img.webpUrl || img.url} alt="" />
            <button
              className="grouped-slot-delete"
              onClick={() => deleteImage(img.filename)}
              title={t('deleteImage.confirm', { filename: img.filename })}
            >
              &times;
            </button>
          </div>
        ))}
        {images.length < data.carousel.maxImages && (
          <>
            <button
              className="grouped-slot-add"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title={t('carousel.uploadFromPcTitle')}
            >
              {uploading ? '...' : '+'}
            </button>
            <button
              className="grouped-slot-add grouped-slot-add--pick"
              onClick={() => setPickerOpen(true)}
              title={t('carousel.pickFromSiteTitle')}
            >
              📂
            </button>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadFile(file);
          e.target.value = '';
        }}
      />
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
//  CAROUSEL INDIVIDUEL (standalone)
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
  }, [carouselId, t, tp, showMessage, onReload]);

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
              </>
            )}
          </div>

          {/* Footer : message + actions */}
          <div className="section-footer">
            {message.text && (
              <div className={`section-upload-msg ${message.type}`}>{message.text}</div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm btn-pick-media"
                title={t('carousel.pickFromSiteTitle')}
                onClick={() => setPickerOpen(true)}
              >
                {t('carousel.pickFromSiteLabel')}
              </button>
              {images.length > 0 && (
                <button className="btn-delete-all" onClick={deleteAll}>
                  {t('carousel.deleteAllBtn')}
                </button>
              )}
            </div>
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
