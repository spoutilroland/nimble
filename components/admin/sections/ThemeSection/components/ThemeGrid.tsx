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
      <div className="theme-grid" id="theme-grid-native">
        {NATIVE_THEMES.map((th) => (
          <button
            key={th.id}
            className={`theme-card${active === th.id ? ' active' : ''}`}
            onClick={() => onActivate(th.id, th.label)}
          >
            <div className="theme-swatches">
              {th.colors.map((c, i) => (
                <span key={i} className="swatch" style={{ background: c }} />
              ))}
            </div>
            <span className="theme-label">{th.label}</span>
            {active === th.id && <span className="theme-badge">{t('theme.activeBadge')}</span>}
          </button>
        ))}
      </div>

      {/* Thèmes personnalisés */}
      {customEntries.length > 0 && (
        <>
          <div className="theme-custom-label">{t('theme.customLabel')}</div>
          <div className="theme-grid theme-grid-custom" id="theme-grid-custom">
            {customEntries.map(([id, th]) => {
              const swatches = th.vars
                ? [th.vars['--primary'], th.vars['--secondary'], th.vars['--accent'], th.vars['--bg']].filter(Boolean)
                : [];
              return (
                <div key={id} className="theme-card-wrapper">
                  <button
                    className={`theme-card${active === id ? ' active' : ''}`}
                    onClick={() => onActivate(id, th.label)}
                  >
                    <div className="theme-swatches">
                      {swatches.map((c, i) => (
                        <span key={i} className="swatch" style={{ background: c }} />
                      ))}
                    </div>
                    <span className="theme-label">{th.label}</span>
                    {active === id && <span className="theme-badge">{t('theme.activeBadge')}</span>}
                  </button>
                  <button
                    className="btn-delete-theme"
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
