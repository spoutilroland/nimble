'use client';

import { useI18n } from '@/lib/i18n/context';
import type { FlashMessage } from '@/lib/hooks/useFlashMessage';

interface ModeSelectorProps<T extends string> {
  label: string;
  name: string;
  current: T;
  options: { value: T; labelKey: string }[];
  message: FlashMessage | null;
  onChange: (value: T) => void;
}

export function ModeSelector<T extends string>({ label, name, current, options, message, onChange }: ModeSelectorProps<T>) {
  const { t } = useI18n();

  return (
    <div className="mb-5">
      <label className="block font-['Inter',sans-serif] text-[0.8rem] font-medium text-[var(--bo-text-dim)] mb-[0.35rem]">{label}</label>
      <div className="flex gap-2 flex-wrap mt-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`logo-mode-option flex items-center gap-[0.4rem] py-[0.4rem] px-[0.9rem] border-[1.5px] border-[var(--bo-border)] rounded-md cursor-pointer text-[0.88rem] transition-[border-color,background] duration-150${current === opt.value ? ' active' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={current === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {t(opt.labelKey)}
          </label>
        ))}
      </div>
      {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
    </div>
  );
}
