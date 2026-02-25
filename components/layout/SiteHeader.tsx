// Port de _old/views/partials/header.ejs
import type { SiteConfig, PageData } from '@/lib/types';
import { NavBurger } from './NavBurger';
import { NavDropdown } from './NavDropdown';

interface Props {
  site: SiteConfig;
  pages: PageData[];
  currentPath: string;
  logoUrl: string | null;
}

const MAX_NAV = 5;

function NavLink({ page, currentPath, extraClass }: { page: PageData; currentPath: string; extraClass?: string }) {
  const isActive =
    (page.slug === '/' && currentPath === '/') ||
    (page.slug !== '/' && currentPath === page.slug);
  return (
    <a
      href={page.slug}
      className={`nav-link${extraClass ? ' ' + extraClass : ''}${isActive ? ' active' : ''}`}
    >
      {page.title}
    </a>
  );
}

export function SiteHeader({ site, pages, currentPath, logoUrl }: Props) {
  const logoMode = site.logoMode || 'logo-only';
  const logoPos = site.logoPosition || 'left';

  const navPages = pages.filter((p) => p.showInNav).sort((a, b) => a.navOrder - b.navOrder);
  const visiblePages = navPages.slice(0, MAX_NAV);
  const overflowPages = navPages.slice(MAX_NAV);

  const homePage = pages.find((p) => p.slug === '/');
  const hasContact = homePage?.sections.some((s) => s.type === 'contact') ?? false;

  // Mode center : split en deux moitiés si > 3 liens
  const totalLinks = visiblePages.length + overflowPages.length + (hasContact ? 1 : 0);
  const shouldSplit = logoPos === 'center' && totalLinks > 3;
  const half = shouldSplit ? Math.ceil(visiblePages.length / 2) : 0;
  const leftPages = shouldSplit ? visiblePages.slice(0, half) : [];
  const rightPages = shouldSplit ? visiblePages.slice(half) : visiblePages;

  return (
    <header className="header">
      <div className="container">
        <div className={`flex justify-between items-center gap-6 flex-nowrap logo-pos-${logoPos}`}>
          {/* Nav gauche (desktop center, uniquement si > 3 liens) */}
          {leftPages.length > 0 && (
            <nav className="nav nav-center-left" aria-hidden="true">
              {leftPages.map((p) => (
                <NavLink key={p.id} page={p} currentPath={currentPath} />
              ))}
            </nav>
          )}

          {/* Logo */}
          <div className="logo">
            <a href="/" className="flex items-center gap-3 no-underline">
              {logoUrl && (logoMode === 'logo-only' || logoMode === 'logo-name') && (
                <img src={logoUrl} alt={site.business.name} className="logo-img" />
              )}
              {(logoMode === 'name-only' || logoMode === 'logo-name' || !logoUrl) && (
                <div className="flex flex-col">
                  <span className="logo-name">{site.business.name}</span>
                  <span className="logo-tagline">{site.business.tagline}</span>
                </div>
              )}
            </a>
          </div>

          {/* Burger (mobile) */}
          <NavBurger />

          {/* Nav principale */}
          <nav className="nav" id="main-nav">
            {logoPos === 'center' ? (
              <>
                {/* Liens gauche dupliqués — visibles uniquement sur mobile via burger */}
                {leftPages.map((p) => (
                  <NavLink key={`left-${p.id}`} page={p} currentPath={currentPath} extraClass="nav-link-left" />
                ))}
                {/* Liens droite */}
                {rightPages.map((p) => (
                  <NavLink key={p.id} page={p} currentPath={currentPath} />
                ))}
              </>
            ) : (
              visiblePages.map((p) => (
                <NavLink key={p.id} page={p} currentPath={currentPath} />
              ))
            )}

            <NavDropdown pages={overflowPages} currentPath={currentPath} />

            {hasContact && (
              <a
                href={currentPath === '/' ? '#contact' : '/#contact'}
                className="nav-link"
              >
                Contact
              </a>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
