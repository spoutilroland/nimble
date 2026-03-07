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
          <img src={url} alt={t(imgAltKey)} className={previewClassName} />
          <button className="bg-[rgba(239,68,68,0.1)] text-[#fca5a5] border border-[rgba(239,68,68,0.25)] rounded-xl font-['Inter',sans-serif] text-[0.78rem] font-semibold tracking-[0.2px] py-[0.4rem] px-4 cursor-pointer transition-all duration-150 hover:bg-[rgba(229,57,53,0.3)] hover:border-[rgba(229,57,53,0.6)] hover:text-white py-[0.35rem] px-[0.8rem] text-[0.8rem] rounded-xl" onClick={onDelete}>
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
