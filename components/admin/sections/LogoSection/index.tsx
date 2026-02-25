'use client';

import { useLogoLogic } from './hooks/useLogoLogic';
import { MediaUploader } from './components/MediaUploader';
import { ModeSelector } from './components/ModeSelector';

export function LogoSection() {
  const {
    logoUrl,
    faviconUrl,
    logoMode,
    logoPosition,
    logoMsg,
    faviconMsg,
    modeMsg,
    posMsg,
    modes,
    positions,
    handleModeChange,
    handlePositionChange,
    handleLogoUpload,
    handleDeleteLogo,
    handleFaviconUpload,
    handleDeleteFavicon,
    t,
  } = useLogoLogic();

  return (
    <div className="carousel-section" id="logo-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('logo.sectionTitle')}</h2>
          <div className="carousel-info">{t('logo.sectionInfo')}</div>
        </div>
      </div>

      <div className="logo-upload-area">
        <ModeSelector
          label={t('logo.modeLabel')}
          name="logo-mode"
          current={logoMode}
          options={modes}
          message={modeMsg}
          onChange={handleModeChange}
        />

        <ModeSelector
          label={t('logo.positionLabel')}
          name="logo-position"
          current={logoPosition}
          options={positions}
          message={posMsg}
          onChange={handlePositionChange}
        />

        <MediaUploader
          url={logoUrl}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          imgAltKey="logo.imgAlt"
          noMediaKey="logo.noLogo"
          uploadLabelKey="logo.btnUpload"
          replaceLabelKey="logo.btnReplace"
          deleteLabelKey="logo.btnDelete"
          hintKey="logo.hint"
          message={logoMsg}
          onUpload={handleLogoUpload}
          onDelete={handleDeleteLogo}
        />

        <hr className="logo-separator" />

        <div className="mt-4">
          <div className="favicon-header">
            <h3>{t('logo.faviconTitle')}</h3>
            <div className="carousel-info">{t('logo.faviconInfo')}</div>
          </div>

          <MediaUploader
            url={faviconUrl}
            accept="image/x-icon,image/png,image/svg+xml,image/jpeg,image/webp,.ico"
            imgAltKey="logo.faviconAlt"
            noMediaKey="logo.noFavicon"
            uploadLabelKey="logo.btnUploadFavicon"
            replaceLabelKey="logo.btnReplaceFavicon"
            deleteLabelKey="logo.btnDelete"
            hintKey="logo.faviconHint"
            message={faviconMsg}
            onUpload={handleFaviconUpload}
            onDelete={handleDeleteFavicon}
            previewClassName="favicon-preview-img"
          />
        </div>
      </div>
    </div>
  );
}
