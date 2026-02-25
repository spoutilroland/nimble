'use client';

import { useBorderLogic, STYLES, CORNERS } from './hooks/useBorderLogic';

export function BorderSection() {
  const {
    current,
    corners,
    locked,
    setLocked,
    message,
    handlePresetClick,
    handleCornerChange,
    handleSaveCustom,
    t,
  } = useBorderLogic();

  const cornerRadius = `${corners.tl}px ${corners.tr}px ${corners.br}px ${corners.bl}px`;

  const cornerLabels: Record<typeof CORNERS[number], string> = {
    tl: t('border.topLeft'),
    tr: t('border.topRight'),
    bl: t('border.bottomLeft'),
    br: t('border.bottomRight'),
  };

  return (
    <div className="carousel-section" id="border-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('border.sectionTitle')}</h2>
          <p className="carousel-subtitle">{t('border.sectionSubtitle')}</p>
        </div>
      </div>

      <div className="border-preview-grid">
        {STYLES.map((s) => {
          const r = s.radius !== null ? s.radius : cornerRadius;
          return (
            <div
              key={s.id}
              className={`border-preview-card${current === s.id ? ' active' : ''}`}
              title={t(s.labelKey)}
              onClick={() => handlePresetClick(s.id)}
            >
              <div
                className="border-preview-demo"
                style={{ borderRadius: r, clipPath: s.clip }}
              >
                Aa
              </div>
              <div className="border-preview-label">{t(s.labelKey)}</div>
            </div>
          );
        })}
      </div>

      {current === 'custom' && (
        <div className="border-custom-editor">
          <div className="border-custom-preview-wrap">
            <div className="border-custom-preview" style={{ borderRadius: cornerRadius }}>
              {t('border.preview')}
            </div>
          </div>

          <div className="border-lock-row">
            <input
              type="checkbox"
              id="border-lock"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
            />
            <label htmlFor="border-lock">{t('border.lockLabel')}</label>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-3">
            {CORNERS.map((corner) => (
              <div key={corner} className="border-corner">
                <label>{cornerLabels[corner]}</label>
                <div className="border-corner-input-row">
                  <input
                    type="range"
                    min={0}
                    max={48}
                    value={corners[corner]}
                    onChange={(e) => handleCornerChange(corner, parseInt(e.target.value))}
                  />
                  <span className="border-corner-val">{corners[corner]}px</span>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary text-[0.85rem] py-[0.6rem] px-[1.5rem]"
            onClick={handleSaveCustom}
          >
            {t('border.btnSave')}
          </button>
        </div>
      )}

      {message && (
        <div className={`form-message ${message.type}`}>{message.text}</div>
      )}
    </div>
  );
}
