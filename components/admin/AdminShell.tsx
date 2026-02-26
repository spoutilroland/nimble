'use client';

import { useState, useEffect, useCallback } from 'react';
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

      {/* Barre d'onglets horizontaux */}
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

      {/* Corps principal : sidebar verticale + zone de contenu */}
      <div id="backoffice-body">
        <div className="flex flex-1 overflow-hidden min-w-0" id={activeTab}>
          <nav className="side-nav">
            {sideNavItems.map((item) => (
              <a key={item.anchor} className="side-nav-link" href={`#${item.anchor}`}>
                {t(item.labelKey)}
              </a>
            ))}
          </nav>
          <div className="flex-1 overflow-y-auto p-6 min-w-0" id={`container-${activeTab.replace('tab-', '')}`}>
            {sections.map((s) => {
              const Comp = s.component;
              const el = <Comp key={s.id} />;
              return s.wrapper ? <div id={s.wrapper} key={s.id}>{el}</div> : el;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
