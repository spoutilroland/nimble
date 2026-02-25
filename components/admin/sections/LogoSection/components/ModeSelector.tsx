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
    <div className="logo-mode-group">
      <label className="form-label">{label}</label>
      <div className="flex gap-2 flex-wrap mt-1">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`logo-mode-option${current === opt.value ? ' active' : ''}`}
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
