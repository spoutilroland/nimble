'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@/lib/i18n/context';
import { useAdminStore } from '@/lib/admin/store';
import { useFlashMessage } from '@/lib/hooks/useFlashMessage';
import { hexToHsl, hslToHex, hexToShort, hexToRgbStr, hexToHslStr, computeVars } from '@/lib/utils/color';
import { slugifyId } from '@/lib/utils/slug';
import { HARMONY_OFFSETS, type HarmonyType } from '@/lib/admin/constants/themes';

type ColorRole = 'primary' | 'secondary' | 'accent' | 'fond';

interface ThemeCreatorModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export function ThemeCreatorModal({ onClose, onSaved }: ThemeCreatorModalProps) {
  const { t } = useI18n();
  const createCustomTheme = useAdminStore((s) => s.createCustomTheme);
  const [name, setName] = useState('');
  const [colors, setColors] = useState({
    primary: '#000000',
    secondary: '#000000',
    accent: '#000000',
    fond: '#000000',
  });
  const [anchored, setAnchored] = useState<Set<ColorRole>>(new Set());
  const [harmony, setHarmony] = useState<HarmonyType>('complementaire');
  const { message, show } = useFlashMessage();

  const updateColor = (role: ColorRole, value: string) => {
    setColors(prev => ({ ...prev, [role]: value }));
    setAnchored(prev => new Set(prev).add(role));
  };

  const applyHarmony = () => {
    const offsets = HARMONY_OFFSETS[harmony];
    const roles: ColorRole[] = ['primary', 'secondary', 'accent', 'fond'];

    let refRole: ColorRole = 'primary';
    for (const role of roles) {
      if (anchored.has(role)) { refRole = role; break; }
    }

    const refHex = colors[refRole];
    const [refH, refS, refL] = hexToHsl(refHex);
    const baseH = refH - offsets[refRole];

    const computed: Record<string, string> = {
      primary: hslToHex(baseH + offsets.primary, refS, refL),
      secondary: hslToHex(baseH + offsets.secondary, refS * 0.7, refL * 0.9),
      accent: hslToHex(baseH + offsets.accent, refS * 0.8, refL),
      fond: hslToHex(baseH + offsets.fond, refS * 0.1, 0.96),
    };

    setColors(prev => {
      const next = { ...prev };
      for (const role of roles) {
        if (!anchored.has(role)) {
          next[role] = computed[role];
        }
      }
      return next;
    });
  };

  const save = async () => {
    if (!name.trim()) {
      show(t('theme.creator.nameRequired'), 'error');
      return;
    }

    const id = slugifyId(name);
    const vars = computeVars(colors.primary, colors.secondary, colors.accent, colors.fond);

    const ok = await createCustomTheme(id, { label: name.trim(), vars });
    if (ok) {
      show(t('theme.creator.saved', { name: name.trim() }), 'success');
      setTimeout(() => onSaved(), 800);
    } else {
      show(t('theme.creator.saveError'), 'error');
    }
  };

  const colorPickers: { role: ColorRole; labelKey: string }[] = [
    { role: 'primary', labelKey: 'theme.creator.primaryLabel' },
    { role: 'secondary', labelKey: 'theme.creator.secondaryLabel' },
    { role: 'accent', labelKey: 'theme.creator.accentLabel' },
    { role: 'fond', labelKey: 'theme.creator.bgLabel' },
  ];

  const harmonyOptions: { value: HarmonyType; labelKey: string }[] = [
    { value: 'complementaire', labelKey: 'theme.creator.harmonyComplementary' },
    { value: 'analogue', labelKey: 'theme.creator.harmonyAnalogue' },
    { value: 'triadique', labelKey: 'theme.creator.harmonyTriadic' },
    { value: 'split', labelKey: 'theme.creator.harmonySplit' },
  ];

  const modal = (
    <div className="modal show" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content max-w-[580px]">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>{t('theme.creator.title')}</h2>

        <div className="form-group">
          <label htmlFor="tc-name">{t('theme.creator.nameLabel')}</label>
          <input
            type="text"
            id="tc-name"
            placeholder={t('theme.creator.namePlaceholder')}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.7rem] font-bold tracking-[2px] uppercase text-[var(--bo-text-dim)] mt-[1.4rem] mb-[0.7rem]">{t('theme.creator.baseColorsLabel')}</div>
        <div className="grid grid-cols-4 gap-[0.6rem] mb-[0.8rem]">
          {colorPickers.map(({ role, labelKey }) => {
            const hex = colors[role];
            const short = hexToShort(hex);
            return (
              <div key={role} className={`flex flex-col items-center gap-[0.4rem] p-[0.5rem_0.3rem] border border-[var(--bo-border)] transition-[border-color] duration-200${anchored.has(role) ? ' border-[var(--bo-green)] shadow-[0_0_8px_rgba(74,124,89,0.3)]' : ''}`} data-role={role}>
                <input
                  type="color"
                  className="w-11 h-11 border-none rounded-sm p-0 cursor-pointer bg-none"
                  value={hex}
                  onChange={(e) => updateColor(role, e.target.value)}
                />
                <label>{t(labelKey)}</label>
                <div className="flex flex-col items-center gap-[0.15rem] w-full mt-[0.3rem]">
                  <span className="font-mono text-[0.55rem] text-[var(--bo-text)] bg-[rgba(255,255,255,0.04)] border border-[var(--bo-border)] py-[0.1rem] px-[0.3rem] w-full text-center whitespace-nowrap overflow-hidden text-ellipsis cursor-default select-all">{hex}</span>
                  {short && <span className="font-mono text-[0.55rem] text-[var(--bo-text)] bg-[rgba(255,255,255,0.04)] border border-[var(--bo-border)] py-[0.1rem] px-[0.3rem] w-full text-center whitespace-nowrap overflow-hidden text-ellipsis cursor-default select-all">{short}</span>}
                  <span className="font-mono text-[0.55rem] text-[var(--bo-text)] bg-[rgba(255,255,255,0.04)] border border-[var(--bo-border)] py-[0.1rem] px-[0.3rem] w-full text-center whitespace-nowrap overflow-hidden text-ellipsis cursor-default select-all">{hexToRgbStr(hex)}</span>
                  <span className="font-mono text-[0.55rem] text-[var(--bo-text)] bg-[rgba(255,255,255,0.04)] border border-[var(--bo-border)] py-[0.1rem] px-[0.3rem] w-full text-center whitespace-nowrap overflow-hidden text-ellipsis cursor-default select-all">{hexToHslStr(hex)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.7rem] font-bold tracking-[2px] uppercase text-[var(--bo-text-dim)] mt-[1.4rem] mb-[0.7rem]">{t('theme.creator.harmonyLabel')}</div>
        <div className="harmony-radio-group">
          {harmonyOptions.map(({ value, labelKey }) => (
            <label key={value}>
              <input
                type="radio"
                name="tc-harmony"
                value={value}
                checked={harmony === value}
                onChange={() => setHarmony(value)}
              />
              {' '}{t(labelKey)}
            </label>
          ))}
        </div>
        <button className="bg-[rgba(52,211,153,0.08)] text-[var(--bo-green)] border border-[rgba(52,211,153,0.25)] rounded-xl font-['Plus_Jakarta_Sans',sans-serif] text-[0.8rem] font-bold tracking-[1.5px] uppercase py-[0.6rem] px-[1.2rem] cursor-pointer w-full transition-all duration-150 mb-[1.4rem] hover:bg-[rgba(74,124,89,0.3)] hover:border-[var(--bo-green)]" onClick={applyHarmony}>
          {t('theme.creator.applyHarmony')}
        </button>

        <div className="flex justify-end gap-3 mt-6">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('theme.creator.cancel')}
          </button>
          <button className="btn btn-success" onClick={save}>
            {t('theme.creator.save')}
          </button>
        </div>

        {message && (
          <div className={`form-message ${message.type}`}>{message.text}</div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
