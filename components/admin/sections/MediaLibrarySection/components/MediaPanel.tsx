'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Trash2, RotateCw, FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { MediaItemWithMeta } from '@/lib/types';

interface MediaPanelProps {
  media: MediaItemWithMeta;
  onClose: () => void;
  onSave: (id: string, data: { altText?: string; title?: string; tags?: string[] }) => Promise<boolean>;
  onDelete: (id: string) => void;
  onTransform?: (id: string, operation: string) => Promise<boolean>;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MediaPanel({ media, onClose, onSave, onDelete, onTransform }: MediaPanelProps) {
  const { t } = useI18n();
  const [altText, setAltText] = useState(media.altText ?? '');
  const [title, setTitle] = useState(media.title ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(media.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transforming, setTransforming] = useState(false);

  // Sync quand le média change
  useEffect(() => {
    setAltText(media.altText ?? '');
    setTitle(media.title ?? '');
    setTags(media.tags ?? []);
    setTagInput('');
  }, [media.id, media.altText, media.title, media.tags]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await onSave(media.id, { altText, title, tags });
    setSaving(false);
    if (ok) onClose();
  }, [media.id, altText, title, tags, onSave, onClose]);

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput('');
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleCopyUrl = useCallback(async () => {
    const url = window.location.origin + media.url;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback pour HTTP ou navigateurs sans clipboard API
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [media.url]);

  const handleTransform = useCallback(async (operation: string) => {
    if (!onTransform || transforming) return;
    setTransforming(true);
    await onTransform(media.id, operation);
    setTransforming(false);
  }, [media.id, onTransform, transforming]);

  const isSvg = media.mimeType === 'image/svg+xml';
  const src = media.webpUrl ?? media.url;

  const inputClass = 'bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] text-[var(--bo-text)] px-[0.6rem] py-[0.45rem] text-[0.85rem] transition-[border-color] duration-150 focus:outline-none focus:border-[var(--bo-green)]';

  const panel = (
    <>
      <div className="fixed inset-0 bg-black/50 z-[200] animate-[media-backdrop-in_0.2s_ease]" onClick={onClose} />
      <aside className="fixed top-0 right-0 bottom-0 w-[min(420px,90vw)] bg-[var(--bo-surface)] border-l border-[var(--bo-border)] z-[201] flex flex-col animate-[media-panel-in_0.25s_ease] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--bo-border)]">
          <h3 className="text-[1rem] m-0">{t('mediaLibrary.panelTitle')}</h3>
          <button
            className="bg-transparent border-none text-[var(--bo-text-dim)] cursor-pointer p-[0.3rem] rounded-[6px] transition-colors duration-150 hover:bg-[var(--bo-border)] hover:text-[var(--bo-text)]"
            onClick={onClose}
            title={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          {/* Preview */}
          <div className="bg-[var(--bo-bg)] rounded-[var(--bo-radius-sm,6px)] p-2 flex items-center justify-center min-h-[180px] max-h-[280px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={altText || media.originalName}
              className={`max-w-full max-h-[260px] object-contain rounded-[6px]${isSvg ? ' p-4' : ''}`}
              onError={(e) => {
                const img = e.currentTarget;
                if (media.webpUrl && img.src.includes('.webp')) {
                  img.src = media.url;
                }
              }}
            />
          </div>

          {/* Transformation image (rotation/flip) — pas pour les SVG */}
          {!isSvg && onTransform && (
            <div className="flex items-center gap-2">
              <span className="text-[0.75rem] text-[var(--bo-text-dim)] shrink-0">{t('mediaLibrary.transformLabel')}</span>
              <div className="flex gap-1">
                {([
                  { op: 'rotate-90', icon: <RotateCw size={15} />, label: t('mediaLibrary.rotate90') },
                  { op: 'rotate-180', icon: <RotateCw size={15} className="rotate-90" />, label: t('mediaLibrary.rotate180') },
                  { op: 'rotate-270', icon: <RotateCw size={15} className="-scale-x-100" />, label: t('mediaLibrary.rotate270') },
                  { op: 'flip-h', icon: <FlipHorizontal2 size={15} />, label: t('mediaLibrary.flipH') },
                  { op: 'flip-v', icon: <FlipVertical2 size={15} />, label: t('mediaLibrary.flipV') },
                ] as const).map(({ op, icon, label }) => (
                  <button
                    key={op}
                    title={label}
                    disabled={transforming}
                    onClick={() => handleTransform(op)}
                    className="p-[0.4rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[6px] text-[var(--bo-text-dim)] cursor-pointer transition-colors hover:text-[var(--bo-text)] hover:border-[var(--bo-accent)] disabled:opacity-40 disabled:cursor-wait"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Métadonnées */}
          <div className="flex flex-col gap-[0.4rem] text-[0.82rem]">
            <div className="flex gap-2">
              <span className="text-[var(--bo-text-dim)] min-w-[80px] shrink-0">{t('mediaLibrary.panelInfoFilename')}</span>
              <span className="text-[var(--bo-text)] break-all" title={media.originalName}>{media.originalName}</span>
            </div>
            {media.fileSize != null && (
              <div className="flex gap-2">
                <span className="text-[var(--bo-text-dim)] min-w-[80px] shrink-0">{t('mediaLibrary.panelInfoSize')}</span>
                <span className="text-[var(--bo-text)] break-all">{formatSize(media.fileSize)}</span>
              </div>
            )}
            {media.width != null && media.height != null && media.width > 0 && (
              <div className="flex gap-2">
                <span className="text-[var(--bo-text-dim)] min-w-[80px] shrink-0">{t('mediaLibrary.panelInfoDimensions')}</span>
                <span className="text-[var(--bo-text)] break-all">{media.width} x {media.height}</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-[var(--bo-text-dim)] min-w-[80px] shrink-0">{t('mediaLibrary.panelInfoUploaded')}</span>
              <span className="text-[var(--bo-text)] break-all">{formatDate(media.uploadedAt)}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[var(--bo-text-dim)] min-w-[80px] shrink-0">{t('mediaLibrary.panelInfoUsedIn')}</span>
              <span className="text-[var(--bo-text)] break-all">
                {media.usedIn.length > 0
                  ? media.usedIn.map((u) => u.title).join(', ')
                  : t('mediaLibrary.panelNotUsed')
                }
              </span>
            </div>
          </div>

          {/* Formulaire édition */}
          <div className="flex flex-col gap-[0.8rem]">
            <label className="flex flex-col gap-[0.3rem] text-[0.82rem] text-[var(--bo-text-dim)]">
              {t('mediaLibrary.panelAltLabel')}
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={t('mediaLibrary.panelAltPlaceholder')}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-[0.3rem] text-[0.82rem] text-[var(--bo-text-dim)]">
              {t('mediaLibrary.panelTitleLabel')}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('mediaLibrary.panelTitlePlaceholder')}
                className={inputClass}
              />
            </label>

            <div className="flex flex-col gap-[0.3rem] text-[0.82rem] text-[var(--bo-text-dim)]">
              {t('mediaLibrary.panelTagsLabel')}
              <div className="flex flex-wrap gap-[0.3rem] bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[8px] px-2 py-[0.35rem] min-h-[36px] items-center">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-[0.2rem] bg-[var(--bo-card)] border border-[var(--bo-border)] rounded-[6px] px-[0.4rem] py-[0.15rem] text-[0.78rem] text-[var(--bo-text)]">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="bg-transparent border-none text-[var(--bo-text-dim)] cursor-pointer text-[0.75rem] px-[0.15rem] leading-[1] hover:text-[#ef4444]">x</button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }
                  }}
                  placeholder={t('mediaLibrary.panelTagsPlaceholder')}
                  className="flex-1 min-w-[80px] border-none bg-transparent text-[var(--bo-text)] text-[0.82rem] outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[var(--bo-border)] flex gap-2">
          <button className="btn btn-success shrink-0 text-[0.82rem] py-[0.4rem] px-[0.8rem]" onClick={handleSave} disabled={saving}>
            {saving ? t('mediaLibrary.loading') : t('mediaLibrary.panelBtnSave')}
          </button>
          <button className="btn btn-secondary flex-1 min-w-0 inline-flex items-center justify-center gap-[0.3rem] text-[0.82rem] py-[0.4rem] px-[0.6rem]" onClick={handleCopyUrl}>
            <Copy size={13} className="shrink-0" />
            <span className="text-center leading-tight">{copied ? t('mediaLibrary.panelUrlCopied') : t('mediaLibrary.panelBtnCopyUrl')}</span>
          </button>
          <button className="btn btn-danger shrink-0 inline-flex items-center gap-[0.3rem] text-[0.82rem] py-[0.4rem] px-[0.6rem]" onClick={() => onDelete(media.id)}>
            <Trash2 size={13} className="shrink-0" />
            <span className="whitespace-nowrap">{t('common.delete')}</span>
          </button>
        </div>
      </aside>
    </>
  );

  return createPortal(panel, document.body);
}
