'use client';

import { useThemeLogic } from './hooks/useThemeLogic';
import { ThemeGrid } from './components/ThemeGrid';
import { ThemeCreatorModal } from './components/ThemeCreatorModal';

export function ThemeSection() {
  const {
    active,
    customThemes,
    message,
    showCreator,
    setShowCreator,
    activateTheme,
    deleteTheme,
    handleThemeSaved,
    t,
  } = useThemeLogic();

  return (
    <div className="carousel-section theme-section" id="theme-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('theme.sectionTitle')}</h2>
          <div className="carousel-info">{t('theme.sectionInfo')}</div>
        </div>
      </div>

      <ThemeGrid
        active={active}
        customThemes={customThemes}
        onActivate={activateTheme}
        onDelete={deleteTheme}
      />

      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}

      <div className="flex justify-end mt-3">
        <button className="btn btn-success" onClick={() => setShowCreator(true)}>
          {t('theme.btnCreate')}
        </button>
      </div>

      {showCreator && (
        <ThemeCreatorModal
          onClose={() => setShowCreator(false)}
          onSaved={handleThemeSaved}
        />
      )}
    </div>
  );
}
