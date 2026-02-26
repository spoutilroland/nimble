'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n/context';

interface PickerImage {
  filename: string;
  url: string;
  webpUrl?: string | null;
  carouselId: string;
  carouselTitle: string;
}

interface MediaPickerProps {
  targetCarouselId: string;
  isOpen: boolean;
  onClose: () => void;
  onCopySuccess: () => void;
}

export function MediaPicker({ targetCarouselId, isOpen, onClose, onCopySuccess }: MediaPickerProps) {
  const { t, tp } = useI18n();
  const [allImages, setAllImages] = useState<PickerImage[]>([]);
  const [filter, setFilter] = useState('');
  const [status, setStatus] = useState<{ text: string; type: '' | 'success' | 'error' }>({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Charger toutes les images au premier ouverture
  useEffect(() => {
    if (!isOpen) return;
    setFilter('');
    setStatus({ text: '', type: '' });
    setLoading(true);

    fetch('/api/admin/images')
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Record<string, { carousel: { title: string }; images: { filename: string; url: string; webpUrl?: string | null }[] }>) => {
        const images: PickerImage[] = [];
        for (const [cid, cdata] of Object.entries(data)) {
          if (cid === targetCarouselId) continue;
          for (const img of cdata.images || []) {
            images.push({
              ...img,
              carouselId: cid,
              carouselTitle: cdata.carousel.title,
            });
          }
        }
        setAllImages(images);
      })
      .catch(() => {
        setAllImages([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, targetCarouselId]);

  // Focus le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen && !loading) {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen, loading]);

  const filtered = filter
    ? allImages.filter(img =>
        img.filename.toLowerCase().includes(filter) ||
        img.carouselTitle.toLowerCase().includes(filter) ||
        img.carouselId.toLowerCase().includes(filter)
      )
    : allImages;

  // Grouper par carousel
  const groups: Record<string, { title: string; images: PickerImage[] }> = {};
  filtered.forEach(img => {
    if (!groups[img.carouselId]) {
      groups[img.carouselId] = { title: img.carouselTitle, images: [] };
    }
    groups[img.carouselId].images.push(img);
  });

  const copyImage = useCallback(async (img: PickerImage) => {
    setStatus({ text: t('mediaPicker.copying'), type: '' });
    try {
      const r = await fetch(`/api/admin/carousel/${encodeURIComponent(targetCarouselId)}/copy-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCarouselId: img.carouselId, filename: img.filename }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Erreur');

      setStatus({ text: t('mediaPicker.copySuccess'), type: 'success' });
      setTimeout(() => {
        onClose();
        onCopySuccess();
      }, 800);
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Erreur', type: 'error' });
    }
  }, [targetCarouselId, t, onClose, onCopySuccess]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal media-picker-modal" style={{ display: 'flex' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content media-picker-content">
        <div className="media-picker-header">
          <h3>{t('mediaPicker.title')}</h3>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Chargement…</p>
        ) : (
          <>
            <div className="media-picker-toolbar">
              <input
                ref={searchRef}
                type="text"
                className="media-picker-search"
                placeholder={t('mediaPicker.searchPlaceholder')}
                value={filter}
                onChange={(e) => setFilter(e.target.value.toLowerCase().trim())}
              />
              <span className="media-picker-count">{tp('mediaPicker.count', filtered.length)}</span>
            </div>

            {allImages.length === 0 ? (
              <p className="media-picker-empty">{t('mediaPicker.noImages')}</p>
            ) : filtered.length === 0 ? (
              <p className="media-picker-empty">{t('mediaPicker.noResults')}</p>
            ) : (
              <div className="media-picker-grid">
                {Object.entries(groups).map(([cid, group]) => (
                  <div key={cid} className="picker-group">
                    <div className="picker-group-title">{group.title}</div>
                    <div className="picker-img-grid">
                      {group.images.map(img => (
                        <div
                          key={`${cid}-${img.filename}`}
                          className="picker-thumb"
                          title={img.filename}
                          onClick={() => copyImage(img)}
                        >
                          <img src={img.webpUrl || img.url} alt={img.filename} loading="lazy" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {status.text && (
          <div className={`media-picker-status ${status.type}`}>{status.text}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
