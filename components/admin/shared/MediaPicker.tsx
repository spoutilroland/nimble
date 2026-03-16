'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n/context';

interface PickerImage {
  filename: string;
  url: string;
  webpUrl?: string | null;
  thumbUrl?: string | null;
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
    <div
      className="modal"
      style={{ display: 'flex', zIndex: 10020 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="modal-content flex flex-col overflow-hidden"
        style={{ maxWidth: 860, width: '95vw', maxHeight: '85vh', padding: 0 }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-[0.8rem] border-b border-[var(--bo-border)] shrink-0">
          <h3 className="m-0 text-[1.05rem] text-[var(--bo-text)]">{t('mediaPicker.title')}</h3>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>Chargement…</p>
        ) : (
          <>
            <div className="flex items-center gap-4 px-5 py-[0.8rem] shrink-0">
              <input
                ref={searchRef}
                type="text"
                className="flex-1 px-[0.7rem] py-[0.45rem] bg-white/[0.06] border border-white/[0.12] rounded-[6px] text-[var(--bo-text)] text-[0.9rem] outline-none placeholder:text-[var(--bo-text-dim)]"
                placeholder={t('mediaPicker.searchPlaceholder')}
                value={filter}
                onChange={(e) => setFilter(e.target.value.toLowerCase().trim())}
              />
              <span className="text-[0.8rem] text-[var(--bo-text-dim)] whitespace-nowrap">{tp('mediaPicker.count', filtered.length)}</span>
            </div>

            {allImages.length === 0 ? (
              <p className="text-center text-[var(--bo-text-dim)] p-8 italic">{t('mediaPicker.noImages')}</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-[var(--bo-text-dim)] p-8 italic">{t('mediaPicker.noResults')}</p>
            ) : (
              <div className="flex-1 overflow-y-auto px-5 pb-4 pt-2">
                {Object.entries(groups).map(([cid, group]) => (
                  <div key={cid} className="mb-[1.4rem]">
                    <div className="text-[0.75rem] font-bold uppercase tracking-[0.06em] text-[var(--bo-text-dim)] mb-[0.6rem] pb-[0.3rem] border-b border-white/[0.07]">{group.title}</div>
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
                      {group.images.map(img => (
                        <div
                          key={`${cid}-${img.filename}`}
                          className="aspect-square overflow-hidden rounded-[6px] cursor-pointer border-2 border-transparent transition-[border-color,transform] duration-150 bg-white/[0.05] hover:border-[var(--primary,#4a7c59)] hover:scale-[1.04]"
                          title={img.filename}
                          onClick={() => copyImage(img)}
                        >
                          <img src={img.thumbUrl || img.webpUrl || img.url} alt={img.filename} loading="lazy" className="w-full h-full object-cover block" />
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
          <div className={`px-5 py-2 text-[0.85rem] min-h-[1.8rem] shrink-0${status.type === 'success' ? ' text-[#66bb6a]' : status.type === 'error' ? ' text-[#ef9a9a]' : ''}`}>{status.text}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
