'use client';

import { useRef, type ChangeEvent } from 'react';
import { useI18n } from '@/lib/i18n/context';
import type { FlashMessage } from '@/lib/hooks/useFlashMessage';

interface MediaUploaderProps {
  url: string | null;
  accept: string;
  imgAltKey: string;
  noMediaKey: string;
  uploadLabelKey: string;
  replaceLabelKey: string;
  deleteLabelKey: string;
  hintKey: string;
  message: FlashMessage | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  previewClassName?: string;
}

export function MediaUploader({
  url,
  accept,
  imgAltKey,
  noMediaKey,
  uploadLabelKey,
  replaceLabelKey,
  deleteLabelKey,
  hintKey,
  message,
  onUpload,
  onDelete,
  previewClassName = 'max-h-[70px] max-w-[240px] object-contain bg-[rgba(255,255,255,0.05)] p-2 border border-[var(--bo-border)]',
}: MediaUploaderProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <>
      {url ? (
        <div className="flex items-center gap-[1.2rem] mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={t(imgAltKey)} className={previewClassName} />
          <button className="btn btn-danger" onClick={onDelete}>
            {t(deleteLabelKey)}
          </button>
        </div>
      ) : (
        <p className="text-[var(--bo-text-dim)] text-[0.85rem] mb-4">{t(noMediaKey)}</p>
      )}

      <div className="flex items-center gap-3 mt-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleChange}
        />
        <label
          className="btn btn-secondary cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          {url ? t(replaceLabelKey) : t(uploadLabelKey)}
        </label>
        <span className="text-[0.78rem] text-[var(--bo-text-dim)]">{t(hintKey)}</span>
      </div>
      {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
    </>
  );
}
