'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Images, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';

interface MediaSourcePickerProps {
  carouselId: string;
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (files: FileList) => void;
  onSuccess: () => void;
  maxSelection?: number;
}

type FilterType = 'all' | 'jpg' | 'png' | 'webp' | 'svg';

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/webp';

export function MediaSourcePicker({
  carouselId,
  isOpen,
  onClose,
  onFileUpload,
  onSuccess,
  maxSelection = 1,
}: MediaSourcePickerProps) {
  const { t, tp } = useI18n();
  const mediaItems = useAdminStore((s) => s.mediaItems);
  const loadMedia = useAdminStore((s) => s.loadMedia);

  const [screen, setScreen] = useState<'choice' | 'library'>('choice');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filtres
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterDimension, setFilterDimension] = useState('all');

  // Reset à chaque ouverture
  useEffect(() => {
    if (isOpen) {
      setScreen('choice');
      setSelected(new Set());
      setAdding(false);
      setSearch('');
      setFilterType('all');
      setFilterDimension('all');
    }
  }, [isOpen]);

  // Charger la médiathèque quand on passe à l'écran library
  useEffect(() => {
    if (isOpen && screen === 'library' && mediaItems.length === 0) {
      loadMedia();
    }
  }, [isOpen, screen, mediaItems.length, loadMedia]);

  // Focus recherche à l'ouverture de library
  useEffect(() => {
    if (isOpen && screen === 'library') {
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  }, [isOpen, screen]);

  // Items image uniquement
  const imageItems = useMemo(
    () => mediaItems.filter((m) => m.mimeType.startsWith('image/')),
    [mediaItems]
  );

  // Dimensions disponibles
  const availableDimensions = useMemo(() => {
    const dimMap = new Map<string, number>();
    for (const m of imageItems) {
      if (m.width && m.height) {
        const dim = `${m.width}x${m.height}`;
        dimMap.set(dim, (dimMap.get(dim) || 0) + 1);
      }
    }
    return Array.from(dimMap.entries())
      .map(([dim, count]) => ({ dim, count }))
      .sort((a, b) => {
        const [aw, ah] = a.dim.split('x').map(Number);
        const [bw, bh] = b.dim.split('x').map(Number);
        return bw * bh - aw * ah;
      });
  }, [imageItems]);

  // Filtrage + tri
  const filtered = useMemo(() => {
    let items = [...imageItems];

    // Recherche par nom
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((m) =>
        m.originalName.toLowerCase().includes(q) ||
        m.filename.toLowerCase().includes(q) ||
        (m.title && m.title.toLowerCase().includes(q))
      );
    }

    // Filtre type
    if (filterType === 'jpg') items = items.filter((m) => m.mimeType === 'image/jpeg');
    if (filterType === 'png') items = items.filter((m) => m.mimeType === 'image/png');
    if (filterType === 'webp') items = items.filter((m) => m.mimeType === 'image/webp');
    if (filterType === 'svg') items = items.filter((m) => m.mimeType === 'image/svg+xml');

    // Filtre dimensions
    if (filterDimension !== 'all') {
      const [w, h] = filterDimension.split('x').map(Number);
      items = items.filter((m) => m.width === w && m.height === h);
    }

    return items;
  }, [imageItems, search, filterType, filterDimension]);

  const toggleSelection = useCallback((mediaId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(mediaId)) {
        next.delete(mediaId);
      } else {
        if (maxSelection === 1) {
          return new Set([mediaId]);
        }
        if (next.size < maxSelection) {
          next.add(mediaId);
        }
      }
      return next;
    });
  }, [maxSelection]);

  const handleConfirmAdd = useCallback(async () => {
    if (selected.size === 0 || adding) return;
    setAdding(true);
    try {
      for (const mediaId of selected) {
        await fetch(`/api/admin/carousel/${encodeURIComponent(carouselId)}/add-media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaId }),
        });
      }
      onClose();
      onSuccess();
    } finally {
      setAdding(false);
    }
  }, [selected, adding, carouselId, onClose, onSuccess]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      onFileUpload(files);
      onClose();
    }
    e.target.value = '';
  }, [onFileUpload, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="media-source-modal"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="media-source-content">
        <div className="media-source-header">
          <h3>{screen === 'choice' ? t('mediaSourcePicker.title') : t('mediaSourcePicker.libraryTitle')}</h3>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="media-source-body">
          {screen === 'choice' && (
            <div className="media-source-choices">
              <div
                className="media-source-card"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload />
                <span className="media-source-card-title">{t('mediaSourcePicker.fromPc')}</span>
                <span className="media-source-card-sub">{t('mediaSourcePicker.fromPcSub')}</span>
              </div>
              <div
                className="media-source-card"
                onClick={() => {
                  setScreen('library');
                  loadMedia();
                }}
              >
                <Images />
                <span className="media-source-card-title">{t('mediaSourcePicker.fromLibrary')}</span>
                <span className="media-source-card-sub">{t('mediaSourcePicker.fromLibrarySub')}</span>
              </div>
            </div>
          )}

          {screen === 'library' && (
            <>
              <div className="media-source-library-header">
                <button className="media-source-back" onClick={() => setScreen('choice')}>
                  <ArrowLeft size={16} /> {t('mediaSourcePicker.title')}
                </button>
              </div>

              {/* Barre de filtres */}
              <div className="media-source-toolbar">
                <input
                  ref={searchRef}
                  type="text"
                  className="media-source-search"
                  placeholder={t('mediaSourcePicker.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="media-source-filter-group">
                  {(['all', 'jpg', 'png', 'webp', 'svg'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      className={`media-filter-btn${filterType === f ? ' active' : ''}`}
                      onClick={() => setFilterType(f)}
                    >
                      {t(`mediaLibrary.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as `mediaLibrary.${string}`)}
                    </button>
                  ))}
                </div>

                {availableDimensions.length > 1 && (
                  <select
                    className="media-sort-select"
                    value={filterDimension}
                    onChange={(e) => setFilterDimension(e.target.value)}
                  >
                    <option value="all">{t('mediaLibrary.filterDimAll')}</option>
                    {availableDimensions.map(({ dim, count }) => (
                      <option key={dim} value={dim}>
                        {dim.replace('x', ' × ')} ({count})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {imageItems.length === 0 ? (
                <p className="media-source-empty">{t('mediaSourcePicker.noMedia')}</p>
              ) : filtered.length === 0 ? (
                <p className="media-source-empty">{t('mediaPicker.noResults')}</p>
              ) : (
                <div className="media-source-grid">
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`media-source-thumb${selected.has(item.id) ? ' selected' : ''}`}
                      onClick={() => toggleSelection(item.id)}
                      title={item.originalName}
                    >
                      <img src={item.webpUrl || item.url} alt={item.altText || item.originalName} loading="lazy" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {screen === 'library' && imageItems.length > 0 && (
          <div className="media-source-footer">
            <span className="media-source-count">
              {selected.size > 0
                ? tp('mediaSourcePicker.selected', selected.size)
                : `${filtered.length} / ${imageItems.length}`
              }
            </span>
            <button
              className="media-source-confirm"
              disabled={selected.size === 0 || adding}
              onClick={handleConfirmAdd}
            >
              {adding ? t('mediaSourcePicker.adding') : t('mediaSourcePicker.confirmAdd')}
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple={maxSelection > 1}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>,
    document.body
  );
}
