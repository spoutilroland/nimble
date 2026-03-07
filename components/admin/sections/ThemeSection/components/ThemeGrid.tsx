'use client';

import { useI18n } from '@/lib/i18n/context';
import { NATIVE_THEMES } from '@/lib/admin/constants/themes';
import type { CustomTheme } from '@/lib/types';

interface ThemeGridProps {
  active: string;
  customThemes: Record<string, CustomTheme>;
  onActivate: (themeId: string, label: string) => void;
  onDelete: (id: string) => void;
}

export function ThemeGrid({ active, customThemes, onActivate, onDelete }: ThemeGridProps) {
  const { t } = useI18n();
  const customEntries = Object.entries(customThemes);

  return (
    <>
      {/* Grille thèmes natifs */}
      <div className="flex flex-wrap gap-[0.8rem]" id="theme-grid-native">
        {NATIVE_THEMES.map((th) => (
          <button
            key={th.id}
            className={`group bg-[var(--bo-bg)] border rounded-2xl p-0 cursor-pointer transition-all duration-200 flex flex-col min-w-[120px] relative overflow-hidden hover:border-[var(--bo-border-hover)] hover:-translate-y-1 hover:shadow-[var(--bo-green-glow)] ${active === th.id ? 'border-[var(--bo-green)] shadow-[var(--bo-green-glow)]' : 'border-[var(--bo-border)]'}`}
            onClick={() => onActivate(th.id, th.label)}
          >
            <div className="flex h-10">
              {th.colors.map((c, i) => (
                <span key={i} className="flex-1 block h-full" style={{ background: c }} />
              ))}
            </div>
            <span className={`font-['Plus_Jakarta_Sans',sans-serif] text-[0.75rem] font-bold uppercase tracking-[2px] py-[0.6rem] px-[0.8rem] pb-[0.5rem] block transition-colors duration-200 group-hover:text-[var(--bo-text)] ${active === th.id ? 'text-[var(--bo-green)]' : 'text-[var(--bo-text-dim)]'}`}>{th.label}</span>
            {active === th.id && <span className="absolute top-[5px] right-[5px] bg-[var(--bo-green)] text-white text-[0.55rem] font-bold tracking-[1px] uppercase py-[0.2rem] px-2 shadow-[0_0_8px_rgba(74,124,89,0.5)]">{t('theme.activeBadge')}</span>}
          </button>
        ))}
      </div>

      {/* Thèmes personnalisés */}
      {customEntries.length > 0 && (
        <>
          <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[0.65rem] font-bold tracking-[3px] uppercase text-[var(--bo-text-dim)] mt-[1.2rem] mb-[0.6rem] opacity-70">{t('theme.customLabel')}</div>
          <div className="flex flex-wrap gap-[0.8rem]" id="theme-grid-custom">
            {customEntries.map(([id, th]) => {
              const swatches = th.vars
                ? [th.vars['--primary'], th.vars['--secondary'], th.vars['--accent'], th.vars['--bg']].filter(Boolean)
                : [];
              return (
                <div key={id} className="group relative inline-block">
                  <button
                    className={`group bg-[var(--bo-bg)] border rounded-2xl p-0 cursor-pointer transition-all duration-200 flex flex-col min-w-[120px] relative overflow-hidden hover:border-[var(--bo-border-hover)] hover:-translate-y-1 hover:shadow-[var(--bo-green-glow)] ${active === id ? 'border-[var(--bo-green)] shadow-[var(--bo-green-glow)]' : 'border-[var(--bo-border)]'}`}
                    onClick={() => onActivate(id, th.label)}
                  >
                    <div className="flex h-10">
                      {swatches.map((c, i) => (
                        <span key={i} className="flex-1 block h-full" style={{ background: c }} />
                      ))}
                    </div>
                    <span className={`font-['Plus_Jakarta_Sans',sans-serif] text-[0.75rem] font-bold uppercase tracking-[2px] py-[0.6rem] px-[0.8rem] pb-[0.5rem] block transition-colors duration-200 group-hover:text-[var(--bo-text)] ${active === id ? 'text-[var(--bo-green)]' : 'text-[var(--bo-text-dim)]'}`}>{th.label}</span>
                    {active === id && <span className="absolute top-[5px] right-[5px] bg-[var(--bo-green)] text-white text-[0.55rem] font-bold tracking-[1px] uppercase py-[0.2rem] px-2 shadow-[0_0_8px_rgba(74,124,89,0.5)]">{t('theme.activeBadge')}</span>}
                  </button>
                  <button
                    className="absolute -top-[6px] -right-[6px] bg-[rgba(229,57,53,0.8)] border-none rounded-full w-[22px] h-[22px] text-[0.7rem] cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 leading-none"
                    title={t('theme.deleteTitle')}
                    onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
