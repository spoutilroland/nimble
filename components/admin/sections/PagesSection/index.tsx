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
    homepageRedirect,
    saveRedirect,
    redirectMessage,
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

      {/* Redirection de la page d'accueil */}
      <div className="page-card">
        <div className="page-card-header">
          <div className="page-card-info">
            <span className="page-card-title">{t('pages.redirectTitle')}</span>
          </div>
        </div>
        <div className="page-card-edit">
          <div className="form-group mb-0">
            <label>{t('pages.redirectLabel')}</label>
            <select
              value={homepageRedirect}
              onChange={(e) => saveRedirect(e.target.value)}
            >
              <option value="">{t('pages.redirectNone')}</option>
              {pages.filter(p => p.slug !== '/').map(p => (
                <option key={p.id} value={p.slug}>{p.title} ({p.slug})</option>
              ))}
            </select>
          </div>
          {redirectMessage && <div className={`form-message ${redirectMessage.type}`}>{redirectMessage.text}</div>}
        </div>
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
