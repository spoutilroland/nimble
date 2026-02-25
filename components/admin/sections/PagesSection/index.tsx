'use client';

import { usePagesLogic } from './hooks/usePagesLogic';
import { PageCard } from './components/PageCard';

export function PagesSection() {
  const {
    pages,
    layouts,
    showNewForm,
    setShowNewForm,
    newTitle,
    newSlug,
    setNewSlug,
    newNav,
    setNewNav,
    newMessage,
    globalMessage,
    createNewPage,
    deletePage,
    savePage,
    handleTitleChange,
    t,
    tp,
  } = usePagesLogic();

  return (
    <div className="carousel-section" id="pages-section">
      <div className="carousel-section-header">
        <div>
          <h2>{t('pages.sectionTitle')}</h2>
          <div className="carousel-info">{tp('pages.count', pages.length)}</div>
        </div>
        <button className="btn btn-success" onClick={() => setShowNewForm(!showNewForm)}>
          {t('pages.btnNew')}
        </button>
      </div>

      <div>
        {pages.map(page => (
          <PageCard
            key={page.id}
            page={page}
            canDelete={pages.length > 1}
            layouts={layouts}
            onDelete={() => deletePage(page.id)}
            onSave={(updated) => savePage(page.id, updated)}
          />
        ))}
      </div>

      {showNewForm && (
        <div className="mt-4 p-4 border border-[var(--bo-border)] rounded">
          <h3 className="site-form-category mt-[1.2rem]">{t('pages.newPageTitle')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>{t('pages.titleLabel')}</label>
              <input
                type="text"
                value={newTitle}
                placeholder={t('pages.titlePlaceholder')}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('pages.slugLabel')}</label>
              <input
                type="text"
                value={newSlug}
                placeholder={t('pages.slugPlaceholder')}
                onChange={(e) => setNewSlug(e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="checkbox-label checkbox-inline">
              {t('pages.showInNavLabel')}
              <input type="checkbox" checked={newNav} onChange={(e) => setNewNav(e.target.checked)} />
            </label>
          </div>
          <div className="flex justify-between items-center mt-4">
            <button className="btn btn-secondary" onClick={() => setShowNewForm(false)}>{t('pages.btnCancel')}</button>
            <button className="btn btn-success" onClick={createNewPage}>{t('pages.btnCreate')}</button>
          </div>
          {newMessage && <div className={`form-message ${newMessage.type}`}>{newMessage.text}</div>}
        </div>
      )}

      {globalMessage && <div className={`form-message ${globalMessage.type}`}>{globalMessage.text}</div>}
    </div>
  );
}
