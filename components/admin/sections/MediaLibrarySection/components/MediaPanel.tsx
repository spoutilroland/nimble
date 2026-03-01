'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';
import type { MediaItemWithMeta } from '@/lib/types';

interface MediaPanelProps {
  media: MediaItemWithMeta;
  onClose: () => void;
  onSave: (id: string, data: { altText?: string; title?: string; tags?: string[] }) => Promise<boolean>;
  onDelete: (id: string) => void;
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

export function MediaPanel({ media, onClose, onSave, onDelete }: MediaPanelProps) {
  const { t } = useI18n();
  const [altText, setAltText] = useState(media.altText ?? '');
  const [title, setTitle] = useState(media.title ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(media.tags ?? []);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync quand le média change
  useEffect(() => {
    setAltText(media.altText ?? '');
    setTitle(media.title ?? '');
    setTags(media.tags ?? []);
    setTagInput('');
  }, [media.id, media.altText, media.title, media.tags]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await onSave(media.id, { altText, title, tags });
    setSaving(false);
  }, [media.id, altText, title, tags, onSave]);

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
    try {
      await navigator.clipboard.writeText(window.location.origin + media.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [media.url]);

  const isSvg = media.mimeType === 'image/svg+xml';
  const src = media.webpUrl ?? media.url;

  const panel = (
    <>
      <div className="media-panel-backdrop" onClick={onClose} />
      <aside className="media-panel">
        <div className="media-panel-header">
          <h3>{t('mediaLibrary.panelTitle')}</h3>
          <button className="media-panel-close" onClick={onClose} title={t('common.close')}>
            <X size={18} />
          </button>
        </div>

        <div className="media-panel-body">
          {/* Preview */}
          <div className="media-panel-preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={altText || media.originalName} className={isSvg ? 'media-panel-svg' : ''} />
          </div>

          {/* Métadonnées */}
          <div className="media-panel-meta">
            <div className="media-panel-meta-row">
              <span className="media-panel-meta-label">{t('mediaLibrary.panelInfoFilename')}</span>
              <span className="media-panel-meta-value" title={media.originalName}>{media.originalName}</span>
            </div>
            {media.fileSize != null && (
              <div className="media-panel-meta-row">
                <span className="media-panel-meta-label">{t('mediaLibrary.panelInfoSize')}</span>
                <span className="media-panel-meta-value">{formatSize(media.fileSize)}</span>
              </div>
            )}
            {media.width != null && media.height != null && media.width > 0 && (
              <div className="media-panel-meta-row">
                <span className="media-panel-meta-label">{t('mediaLibrary.panelInfoDimensions')}</span>
                <span className="media-panel-meta-value">{media.width} x {media.height}</span>
              </div>
            )}
            <div className="media-panel-meta-row">
              <span className="media-panel-meta-label">{t('mediaLibrary.panelInfoUploaded')}</span>
              <span className="media-panel-meta-value">{formatDate(media.uploadedAt)}</span>
            </div>
            <div className="media-panel-meta-row">
              <span className="media-panel-meta-label">{t('mediaLibrary.panelInfoUsedIn')}</span>
              <span className="media-panel-meta-value">
                {media.usedIn.length > 0
                  ? media.usedIn.map((u) => u.title).join(', ')
                  : t('mediaLibrary.panelNotUsed')
                }
              </span>
            </div>
          </div>

          {/* Formulaire édition */}
          <div className="media-panel-form">
            <label className="media-panel-label">
              {t('mediaLibrary.panelAltLabel')}
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder={t('mediaLibrary.panelAltPlaceholder')}
                className="media-panel-input"
              />
            </label>

            <label className="media-panel-label">
              {t('mediaLibrary.panelTitleLabel')}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('mediaLibrary.panelTitlePlaceholder')}
                className="media-panel-input"
              />
            </label>

            <div className="media-panel-label">
              {t('mediaLibrary.panelTagsLabel')}
              <div className="media-panel-tags">
                {tags.map((tag) => (
                  <span key={tag} className="media-panel-tag">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="media-panel-tag-remove">x</button>
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
                  className="media-panel-tag-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="media-panel-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {t('mediaLibrary.panelBtnSave')}
          </button>
          <button className="btn btn-secondary media-panel-copy-btn" onClick={handleCopyUrl}>
            <Copy size={14} />
            {copied ? t('mediaLibrary.panelUrlCopied') : t('mediaLibrary.panelBtnCopyUrl')}
          </button>
          <button className="btn btn-danger media-panel-delete-btn" onClick={() => onDelete(media.id)}>
            <Trash2 size={14} />
            {t('mediaLibrary.panelBtnDelete')}
          </button>
        </div>
      </aside>
    </>
  );

  return createPortal(panel, document.body);
}
