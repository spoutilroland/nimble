'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Github } from 'lucide-react';
import { I18nProvider, useI18n } from '@/lib/i18n/context';
import { useAdminStore, type TabId } from '@/lib/admin/store';
import { getSectionsForTab, getSideNavForTab, getDemoFilteredSections, getDemoFilteredSideNav } from '@/lib/admin/registry';
import { useDemoMode } from '@/lib/hooks/useDemoMode';
import { LoginScreen } from './LoginScreen';
import { DemoBanner } from './DemoBanner';
import { GuidedTour } from './shared/GuidedTour';

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
  { id: 'tab-backup', labelKey: 'tabs.backup' },
  { id: 'tab-security', labelKey: 'tabs.security' },
];

export function AdminShell({ locale, adminSlug }: AdminShellProps) {
  return (
    <I18nProvider locale={locale}>
      <AdminShellInner adminSlug={adminSlug} />
    </I18nProvider>
  );
}

/** Onglets masqués en mode demo */
const DEMO_HIDDEN_TABS: TabId[] = ['tab-security'];

function AdminShellInner({ adminSlug }: { adminSlug?: string }) {
  const { t } = useI18n();
  const { isDemo, bannerText } = useDemoMode();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const activeTab = useAdminStore((s) => s.activeTab);
  const setActiveTab = useAdminStore((s) => s.setActiveTab);
  const isDark = useAdminStore((s) => s.isDark);
  const toggleTheme = useAdminStore((s) => s.toggleTheme);
  const initTheme = useAdminStore((s) => s.initTheme);

  // Tabs filtrés en mode demo (masquer Security)
  const visibleTabs = useMemo(
    () => isDemo ? TABS.filter((tab) => !DEMO_HIDDEN_TABS.includes(tab.id)) : TABS,
    [isDemo]
  );

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      setIsAuthenticated(data.valid);
    } catch {
      setIsAuthenticated(false);
    }
  };

  // Vérification session au chargement (bypass en demo)
  useEffect(() => {
    if (isDemo) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSession();
  }, [isDemo]);

  // Init dark theme state
  useEffect(() => {
    initTheme();
  }, [initTheme]);

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

  // Dashboard — rendu via registry (filtré en demo)
  const sideNavItems = isDemo ? getDemoFilteredSideNav(activeTab) : getSideNavForTab(activeTab);
  const sections = isDemo ? getDemoFilteredSections(activeTab) : getSectionsForTab(activeTab);

  return (
    <div id="admin-dashboard" className="flex flex-col h-screen overflow-hidden">
      {isDemo && <DemoBanner text={bannerText} />}
      {isDemo && <GuidedTour />}
      <header className="admin-header">
        <div className="flex justify-between items-center py-4 px-6 max-w-[1440px] mx-auto w-full">
          <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[1.05rem] font-extrabold uppercase tracking-[3px] text-[var(--bo-text)] flex items-center gap-[0.7rem]">{t('admin.title')}</h1>
          <div className="flex items-center gap-[0.6rem]">
            <button
              className="bg-transparent border border-[var(--bo-border)] rounded-xl text-[var(--bo-text-dim)] py-[0.45rem] px-4 font-['Inter',sans-serif] text-[0.8rem] font-semibold tracking-[0.3px] cursor-pointer transition-all duration-150 hover:border-[var(--bo-border-hover)] hover:text-[var(--bo-text)] hover:bg-[rgba(255,255,255,0.04)]"
              title={isDark ? t('auth.toggleLight') : t('auth.toggleDark')}
              onClick={toggleTheme}
            >
              {isDark ? '🌙' : '☀️'}
            </button>
            <a href="/" className="bg-transparent border border-[var(--bo-border)] rounded-xl text-[var(--bo-text-dim)] py-[0.45rem] px-4 font-['Inter',sans-serif] text-[0.8rem] font-semibold tracking-[0.3px] cursor-pointer transition-all duration-150 hover:border-[var(--bo-border-hover)] hover:text-[var(--bo-text)] hover:bg-[rgba(255,255,255,0.04)]" target="_blank" rel="noopener noreferrer">
              {t('admin.viewSite')}
            </a>
            {!isDemo && (
              <button className="bg-transparent border border-[var(--bo-border)] rounded-xl text-[var(--bo-text-dim)] py-[0.45rem] px-4 font-['Inter',sans-serif] text-[0.8rem] font-semibold tracking-[0.3px] cursor-pointer transition-all duration-150 hover:border-[var(--bo-border-hover)] hover:text-[var(--bo-text)] hover:bg-[rgba(255,255,255,0.04)]" onClick={handleLogout}>
                {t('admin.logout')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Corps principal — CSS Grid 2 colonnes × 2 lignes : vide | tabs / sidebar | sections */}
      <div className="flex flex-1 overflow-hidden min-h-0 bg-[var(--bo-bg)]">
        <div className="bo-layout-grid" id={activeTab}>
          {/* Logo — cellule vide (col 1, row 1) */}
          <div className="col-start-1 row-start-1 h-[4.75rem] flex items-center pt-4 pr-3 pb-0 pl-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Nimble" className="max-w-full max-h-[4.25rem] w-auto h-auto block opacity-[0.92]" />
          </div>
          <nav id="main-tabs">
            {visibleTabs.map((tab) => (
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
            <span className="block px-[14px] pt-[10px] pb-2 font-['Inter',sans-serif] text-[0.65rem] font-bold uppercase tracking-[2px] text-[var(--bo-green)] leading-none">
              {t(visibleTabs.find((tab) => tab.id === activeTab)?.labelKey ?? '').replace(/\p{Emoji_Presentation}\s*/gu, '').trim()}
            </span>
            <div className="h-px bg-[var(--bo-border)] mx-[2px] mt-1 mb-[14px] shrink-0" />
            {sideNavItems.map((item) => (
              <a key={item.anchor} className="side-nav-link" href={`#${item.anchor}`}>
                {t(item.labelKey)}
              </a>
            ))}
            <div className="flex-1" />
            <div className="flex flex-col gap-[3px] shrink-0">
              <div className="h-px bg-[var(--bo-border)] mx-[2px] mt-1 mb-[14px] shrink-0" />
              <a href="/" target="_blank" rel="noopener noreferrer" className="block px-[14px] py-2 rounded-[10px] text-[var(--bo-text-dim)] no-underline font-['Inter',sans-serif] text-[0.8rem] font-medium transition-colors duration-[120ms] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--bo-text)] after:content-['_↗'] after:opacity-50">
                {t('admin.viewSite')}
              </a>
            </div>
          </nav>
          <div className="bo-sections-container" id={`container-${activeTab.replace('tab-', '')}`}>
            {sections.map((s) => {
              const Comp = s.component;
              const sectionId = s.wrapper ?? s.anchor;
              return (
                <div id={sectionId} key={s.id} className="flex flex-col relative">
                  <Comp />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="admin-footer">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center py-[0.96rem] px-6 font-['Inter',sans-serif] text-[0.68rem] font-semibold tracking-[0.8px] uppercase text-[var(--bo-text-dim)]">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/head-logo.svg" alt="" className="h-[1.1rem] w-auto block opacity-75" aria-hidden="true" />
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-[0.72rem] tracking-[3px] text-[var(--bo-text)]">Nimble</span>
            <span className="text-[0.62rem] text-[var(--bo-green)] tracking-[1px]">v1</span>
            <span className="text-[var(--bo-border-hover)] font-normal">·</span>
            <span>Licence MIT</span>
            <span className="text-[var(--bo-border-hover)] font-normal">·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="justify-self-center flex items-center gap-[0.6rem] text-[0.68rem] font-semibold tracking-[0.8px] text-[var(--bo-text-dim)]">
            <span>{t('admin.footerContribute')}</span>
            <a
              href="https://github.com/spoutilroland/nimble"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[0.3rem] text-[var(--bo-green)] no-underline opacity-75 transition-opacity duration-150 hover:opacity-100"
            >
              <Github size={13} />
              spoutilroland/nimble
            </a>
          </div>
          <span className="justify-self-end text-[0.62rem] tracking-[1.5px] text-[var(--bo-text-dim)] opacity-60">CMS léger — zéro base de données</span>
        </div>
      </footer>
    </div>
  );
}
