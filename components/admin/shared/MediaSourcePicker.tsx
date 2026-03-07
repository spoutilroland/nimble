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

  const filterBtnClass = (active: boolean) =>
    `bg-transparent border border-[var(--bo-border)] text-[var(--bo-text-dim)] px-[0.6rem] py-[0.25rem] rounded-[var(--bo-radius-sm,4px)] cursor-pointer text-[0.8rem] transition-all duration-150 hover:border-[var(--bo-border-hover)] hover:text-[var(--bo-text)]${active ? ' media-filter-btn-active bg-[var(--bo-green)] !border-[var(--bo-green)] !text-[#0e1018] font-semibold' : ''}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-xl w-[90%] max-w-[780px] max-h-[85vh] flex flex-col overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bo-border)]">
          <h3 className="m-0 text-[1rem] font-semibold text-[var(--bo-text)]">
            {screen === 'choice' ? t('mediaSourcePicker.title') : t('mediaSourcePicker.libraryTitle')}
          </h3>
          <button className="help-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="px-5 py-5 overflow-y-auto flex-1">
          {screen === 'choice' && (
            <div className="grid grid-cols-2 gap-4">
              <div
                className="flex flex-col items-center gap-3 px-4 py-6 bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] cursor-pointer transition-[border-color] duration-150 text-center hover:border-[var(--bo-accent,#6366f1)]"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-[var(--bo-accent,#6366f1)]" />
                <span className="text-[0.9rem] font-semibold text-[var(--bo-text)]">{t('mediaSourcePicker.fromPc')}</span>
                <span className="text-[0.75rem] text-[var(--bo-text-dim)] leading-[1.3]">{t('mediaSourcePicker.fromPcSub')}</span>
              </div>
              <div
                className="flex flex-col items-center gap-3 px-4 py-6 bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] cursor-pointer transition-[border-color] duration-150 text-center hover:border-[var(--bo-accent,#6366f1)]"
                onClick={() => { setScreen('library'); loadMedia(); }}
              >
                <Images className="w-8 h-8 text-[var(--bo-accent,#6366f1)]" />
                <span className="text-[0.9rem] font-semibold text-[var(--bo-text)]">{t('mediaSourcePicker.fromLibrary')}</span>
                <span className="text-[0.75rem] text-[var(--bo-text-dim)] leading-[1.3]">{t('mediaSourcePicker.fromLibrarySub')}</span>
              </div>
            </div>
          )}

          {screen === 'library' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  className="flex items-center gap-[0.3rem] bg-transparent border-none text-[var(--bo-accent,#6366f1)] cursor-pointer text-[0.85rem] p-0 hover:underline"
                  onClick={() => setScreen('choice')}
                >
                  <ArrowLeft size={16} /> {t('mediaSourcePicker.title')}
                </button>
              </div>

              {/* Barre de filtres */}
              <div className="flex flex-wrap items-center gap-[0.4rem] mb-3">
                <input
                  ref={searchRef}
                  type="text"
                  className="flex-1 min-w-[120px] px-[0.6rem] py-[0.3rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[var(--bo-radius-sm,4px)] text-[var(--bo-text)] text-[0.8rem] outline-none focus:border-[var(--bo-accent,#6366f1)] placeholder:text-[var(--bo-text-dim)]"
                  placeholder={t('mediaSourcePicker.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <div className="flex gap-[0.25rem] items-center">
                  {(['all', 'jpg', 'png', 'webp', 'svg'] as FilterType[]).map((f) => (
                    <button
                      key={f}
                      className={filterBtnClass(filterType === f)}
                      onClick={() => setFilterType(f)}
                    >
                      {t(`mediaLibrary.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as `mediaLibrary.${string}`)}
                    </button>
                  ))}
                </div>

                {availableDimensions.length > 1 && (
                  <select
                    className="bg-[var(--bo-surface)] border border-[var(--bo-border)] text-[var(--bo-text)] px-2 py-[0.25rem] rounded-[var(--bo-radius-sm,4px)] text-[0.8rem] cursor-pointer"
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
                <p className="px-8 py-8 text-center text-[var(--bo-text-dim)] text-[0.85rem]">{t('mediaSourcePicker.noMedia')}</p>
              ) : filtered.length === 0 ? (
                <p className="px-8 py-8 text-center text-[var(--bo-text-dim)] text-[0.85rem]">{t('mediaPicker.noResults')}</p>
              ) : (
                <div className="grid gap-2 max-h-[50vh] overflow-y-auto p-[2px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
                  {filtered.map((item) => (
                    <div
                      key={item.id}
                      className={`media-source-thumb relative aspect-square rounded-[6px] overflow-hidden border-2 cursor-pointer transition-[border-color] duration-150${selected.has(item.id) ? ' selected border-[var(--bo-accent,#6366f1)]' : ' border-transparent'}`}
                      onClick={() => toggleSelection(item.id)}
                      title={item.originalName}
                    >
                      <img src={item.webpUrl || item.url} alt={item.altText || item.originalName} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {screen === 'library' && imageItems.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--bo-border)]">
            <span className="text-[0.8rem] text-[var(--bo-text-dim)]">
              {selected.size > 0
                ? tp('mediaSourcePicker.selected', selected.size)
                : `${filtered.length} / ${imageItems.length}`
              }
            </span>
            <button
              className="px-5 py-2 border-none rounded-[6px] bg-[var(--bo-accent,#6366f1)] text-white text-[0.85rem] font-medium cursor-pointer transition-opacity duration-150 disabled:opacity-40 disabled:cursor-default hover:enabled:opacity-85"
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
