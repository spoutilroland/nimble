'use client';

import { useState, useEffect, useCallback } from 'react';
import { Github } from 'lucide-react';
import { I18nProvider, useI18n } from '@/lib/i18n/context';
import { useAdminStore, type TabId } from '@/lib/admin/store';
import { getSectionsForTab, getSideNavForTab } from '@/lib/admin/registry';
import { LoginScreen } from './LoginScreen';

interface AdminShellProps {
  locale: Record<string, unknown>;
  adminSlug?: string;
}

interface TabDef {
  id: TabId;
  labelKey: string;
}

const TABS: TabDef[] = [
  { id: 'tab-design', labelKey: 'tabs.design' },
  { id: 'tab-content', labelKey: 'tabs.content' },
  { id: 'tab-media', labelKey: 'tabs.media' },
  { id: 'tab-identity', labelKey: 'tabs.identity' },
  { id: 'tab-config', labelKey: 'tabs.config' },
  { id: 'tab-security', labelKey: 'tabs.security' },
];

export function AdminShell({ locale, adminSlug }: AdminShellProps) {
  return (
    <I18nProvider locale={locale}>
      <AdminShellInner adminSlug={adminSlug} />
    </I18nProvider>
  );
}

function AdminShellInner({ adminSlug }: { adminSlug?: string }) {
  const { t } = useI18n();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const activeTab = useAdminStore((s) => s.activeTab);
  const setActiveTab = useAdminStore((s) => s.setActiveTab);
  const isDark = useAdminStore((s) => s.isDark);
  const toggleTheme = useAdminStore((s) => s.toggleTheme);
  const initTheme = useAdminStore((s) => s.initTheme);

  // Vérification session au chargement
  useEffect(() => {
    checkSession();
  }, []);

  // Init dark theme state
  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAuthenticated(data.valid);
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return null;
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Dashboard — rendu via registry
  const sideNavItems = getSideNavForTab(activeTab);
  const sections = getSectionsForTab(activeTab);

  return (
    <div id="admin-dashboard" className="flex flex-col h-screen overflow-hidden">
      <header className="admin-header">
        <div className="container">
          <h1>{t('admin.title')}</h1>
          <div className="flex items-center gap-[0.6rem]">
            <button
              className="btn btn-secondary btn-icon-sm"
              title={isDark ? t('auth.toggleLight') : t('auth.toggleDark')}
              onClick={toggleTheme}
            >
              {isDark ? '◑' : '●'}
            </button>
            <a href="/" className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
              {t('admin.viewSite')}
            </a>
            <button className="btn btn-secondary" onClick={handleLogout}>
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Corps principal — CSS Grid 2 colonnes × 2 lignes : vide | tabs / sidebar | sections */}
      <div id="backoffice-body">
        <div className="bo-layout-grid" id={activeTab}>
          {/* Logo — cellule vide (col 1, row 1) */}
          <div className="bo-logo-cell">
            <img src="/brand/logo.svg" alt="Nimble" className="bo-logo-img" />
          </div>
          <nav id="main-tabs">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`main-tab${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>
          <nav className="side-nav">
            {/* Label de l'onglet actif */}
            <span className="side-nav-label">
              {t(TABS.find((tab) => tab.id === activeTab)?.labelKey ?? '').replace(/\p{Emoji_Presentation}\s*/gu, '').trim()}
            </span>
            <div className="side-nav-sep" />
            {/* Liens de navigation */}
            {sideNavItems.map((item) => (
              <a key={item.anchor} className="side-nav-link" href={`#${item.anchor}`}>
                {t(item.labelKey)}
              </a>
            ))}
            {/* Spacer pour pousser le pied en bas */}
            <div className="side-nav-spacer" />
            {/* Pied de sidebar */}
            <div className="side-nav-footer">
              <div className="side-nav-sep" />
              <a href="/" target="_blank" rel="noopener noreferrer" className="side-nav-footer-link">
                {t('admin.viewSite')}
              </a>
            </div>
          </nav>
          <div className="bo-sections-container" id={`container-${activeTab.replace('tab-', '')}`}>
            {sections.map((s) => {
              const Comp = s.component;
              const sectionId = s.wrapper ?? s.anchor;
              return (
                <div id={sectionId} key={s.id} className="bo-section-slot">
                  <Comp />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="admin-footer">
        <div className="admin-footer-inner">
          <div className="admin-footer-left">
            <img src="/brand/head-logo.svg" alt="" className="admin-footer-bird" aria-hidden="true" />
            <span className="admin-footer-brand">Nimble</span>
            <span className="admin-footer-version">v1</span>
            <span className="admin-footer-sep">·</span>
            <span>Licence MIT</span>
            <span className="admin-footer-sep">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="admin-footer-contribute">
            <span>{t('admin.footerContribute')}</span>
            <a
              href="https://github.com/spoutilroland/nimble"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-footer-contribute-link"
            >
              <Github size={13} />
              spoutilroland/nimble
            </a>
          </div>
          <span className="admin-footer-tagline">CMS léger — zéro base de données</span>
        </div>
      </footer>
    </div>
  );
}
