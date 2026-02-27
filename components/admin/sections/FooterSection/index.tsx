'use client';

import { useFooterLogic } from './hooks/useFooterLogic';
import { FooterBlockRow } from './components/FooterBlockRow';
import { BlockDropdown } from './components/BlockDropdown';
import { BusinessForm } from './components/BusinessForm';

export function FooterSection() {
  const {
    collapsed,
    setCollapsed,
    cols,
    setCols,
    blocks,
    formData,
    updateField,
    saving,
    message,
    showDropdown,
    setShowDropdown,
    hasOverlap,
    addBlock,
    removeBlock,
    updateBlock,
    save,
    t,
  } = useFooterLogic();

  return (
    <div className="carousel-section" id="footer-section">
      <div className="carousel-section-header">
        <div className="flex items-center gap-[0.8rem]">
          <button
            className="btn-collapse"
            title={t('common.collapseTitle')}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '\u25B6' : '\u25BC'}
          </button>
          <div>
            <h2>{t('footerSection.sectionTitle')}</h2>
            <div className="carousel-info">{t('footerSection.sectionInfo')}</div>
          </div>
        </div>
        <div className="flex items-center gap-[0.8rem]">
          {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
          <button className="btn btn-success" disabled={saving || hasOverlap} onClick={save}>
            {t('common.save')}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          {/* Layout grille */}
          <div className="site-form-group mt-4">
            <h3 className="site-form-category mt-0">{t('footerSection.layoutTitle')}</h3>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 font-semibold">
                {t('footerSection.colsLabel')}
                <select className="w-[70px]" value={cols} onChange={(e) => setCols(parseInt(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
              <BlockDropdown
                show={showDropdown}
                onToggle={() => setShowDropdown(!showDropdown)}
                onAdd={addBlock}
              />
            </div>

            <div>
              {blocks.map((block) => (
                <FooterBlockRow
                  key={block.blockId}
                  block={block}
                  onUpdate={(updates) => updateBlock(block.blockId, updates)}
                  onRemove={() => removeBlock(block.blockId)}
                />
              ))}
              {hasOverlap && (
                <div className="layout-overlap-warning">
                  {t('footerSection.overlapWarning')}
                </div>
              )}
            </div>
          </div>

          <BusinessForm formData={formData} onFieldChange={updateField} />

          <div className="flex justify-end items-center gap-[0.8rem] mt-4">
            {message && <div className={`form-message ${message.type}`}>{message.text}</div>}
            <button className="btn btn-success" disabled={saving || hasOverlap} onClick={save}>
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
