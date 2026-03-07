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
          <p className="text-[0.72rem] text-[var(--bo-text-dim)] font-normal m-0">{t('border.sectionSubtitle')}</p>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap pt-6 pb-2">
        {STYLES.map((s) => {
          const r = s.radius !== null ? s.radius : cornerRadius;
          return (
            <div
              key={s.id}
              className={`cursor-pointer flex flex-col items-center gap-[0.6rem] py-4 px-6 border-2 border-[var(--bo-border)] rounded-lg bg-[var(--bo-card)] transition-[border-color,box-shadow] duration-200 min-w-[100px] hover:border-[var(--bo-green)]${current === s.id ? ' border-[var(--bo-green)] shadow-[0_0_0_2px_rgba(74,124,89,0.25)]' : ''}`}
              title={t(s.labelKey)}
              onClick={() => handlePresetClick(s.id)}
            >
              <div
                className="w-20 h-10 bg-[var(--bo-green)] flex items-center justify-center text-white font-['Inter',sans-serif] font-bold text-base transition-[border-radius] duration-300"
                style={{ borderRadius: r, clipPath: s.clip }}
              >
                Aa
              </div>
              <div className="text-[0.8rem] text-[var(--bo-text-dim)] font-['Inter',sans-serif] uppercase tracking-[1px]">{t(s.labelKey)}</div>
            </div>
          );
        })}
      </div>

      {current === 'custom' && (
        <div className="mt-6 p-6 border border-[var(--bo-border)] bg-[var(--bo-card)]">
          <div className="flex justify-center mb-6">
            <div className="w-40 h-[70px] bg-[var(--bo-green)] flex items-center justify-center text-white font-['Plus_Jakarta_Sans',sans-serif] text-[1.1rem] tracking-[2px] transition-[border-radius] duration-200" style={{ borderRadius: cornerRadius }}>
              {t('border.preview')}
            </div>
          </div>

          <div className="flex items-center gap-[0.6rem] mb-[1.2rem] text-[0.85rem] text-[var(--bo-text-dim)] font-['Inter',sans-serif]">
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
                <label className="block text-[0.8rem] text-[var(--bo-text-dim)] font-['Inter',sans-serif] mb-[0.3rem]">{cornerLabels[corner]}</label>
                <div className="flex items-center gap-[0.6rem]">
                  <input
                    type="range"
                    min={0}
                    max={48}
                    value={corners[corner]}
                    onChange={(e) => handleCornerChange(corner, parseInt(e.target.value))}
                  />
                  <span className="w-10 text-right text-[0.8rem] text-[var(--bo-text)] font-['Inter',sans-serif]">{corners[corner]}px</span>
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
