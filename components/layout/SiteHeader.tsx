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
// Seuil à partir duquel le mode centré s'active (logo centré + liens à droite)
const SPLIT_AT = 5;
// Nombre de liens visibles directement en mode centré (le reste va dans le burger)
const SPLIT_VISIBLE = 2;

function NavLink({ page, currentPath }: { page: PageData; currentPath: string }) {
  const isActive =
    (page.slug === '/' && currentPath === '/') ||
    (page.slug !== '/' && currentPath === page.slug);
  return (
    <a href={page.slug} className={`nav-link${isActive ? ' active' : ''}`}>
      {page.title}
    </a>
  );
}

export function SiteHeader({ site, pages, currentPath, logoUrl }: Props) {
  const logoMode = site.logoMode || 'logo-only';
  const logoPos = site.logoPosition || 'left';

  const navPages = pages.filter((p) => p.showInNav).sort((a, b) => a.navOrder - b.navOrder);

  const homePage = pages.find((p) => p.slug === '/');
  const hasContact = homePage?.sections.some((s) => s.type === 'contact') ?? false;
  const contactLink = hasContact ? (
    <a href={currentPath === '/' ? '#contact' : '/#contact'} className="nav-link">
      Contact
    </a>
  ) : null;

  const totalLinks = navPages.length + (hasContact ? 1 : 0);
  // En mode centré, on réduit à SPLIT_VISIBLE liens visibles dès SPLIT_AT liens
  const limitLinks = logoPos === 'center' && totalLinks >= SPLIT_AT;
  const visibleLinks = limitLinks ? navPages.slice(0, SPLIT_VISIBLE) : navPages.slice(0, MAX_NAV);
  const overflowLinks = limitLinks ? navPages.slice(SPLIT_VISIBLE) : navPages.slice(MAX_NAV);

  // Logo JSX — partagé entre les deux modes
  const logoJsx = (
    <div className="logo">
      <a href="/" className="flex items-center gap-5 no-underline">
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
  );

  return (
    <header className="header">
      <div className="container">
        {logoPos === 'center' ? (
          /* ── Mode centré : un seul bloc logo+nav, centré dans le header ── */
          <div className="nav-center-layout">
            {logoJsx}
            <nav className="nav" id="main-nav">
              {visibleLinks.map((p) => (
                <NavLink key={p.id} page={p} currentPath={currentPath} />
              ))}
              <NavDropdown pages={overflowLinks} currentPath={currentPath} />
              {contactLink}
            </nav>
            <NavBurger />
          </div>
        ) : (
          /* ── Mode gauche / droite : flex [logo] [nav] ── */
          <div className={`flex justify-between items-center gap-6 flex-nowrap logo-pos-${logoPos}`}>
            {logoJsx}
            <NavBurger />
            <nav className="nav" id="main-nav">
              {visibleLinks.map((p) => (
                <NavLink key={p.id} page={p} currentPath={currentPath} />
              ))}
              <NavDropdown pages={overflowLinks} currentPath={currentPath} />
              {contactLink}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
