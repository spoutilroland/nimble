import { redirect } from 'next/navigation';
import { readSiteConfig } from '@/lib/data/site';
import { readPagesConfig } from '@/lib/data/pages';
import { readLayoutsConfig } from '@/lib/data/layouts';
import { getLogoUrl, getFaviconUrl } from '@/lib/data/helpers';
import { detectLang } from '@/lib/i18n/server';
import { isDemoMode } from '@/lib/demo';
import { translatePageTitle, translateSectionProps } from '@/lib/demo-i18n';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { SectionDivider } from '@/components/layout/SectionDivider';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { ContentEditor } from '@/components/ui/ContentEditor';
import { SidebarEditor } from '@/components/ui/SidebarEditor';
import { getAdminSlug } from '@/lib/data/setup';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const site = readSiteConfig();
  const faviconUrl = getFaviconUrl();
  return {
    title: site.seo.defaultTitle || site.business.name,
    description: site.seo.defaultDescription || '',
    ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
  };
}

export default async function HomePage() {
  const site = readSiteConfig();

  // Redirection de la page d'accueil vers une autre page si configuré
  if (site.homepageRedirect && site.homepageRedirect !== '/') {
    redirect(site.homepageRedirect);
  }

  const pagesConfig = readPagesConfig();
  const layoutsConfig = readLayoutsConfig();
  const logoUrl = getLogoUrl();
  const lang = await detectLang();
  const demo = isDemoMode();

  const page = pagesConfig.pages.find((p) => p.slug === '/');
  if (!page) {
    return <div>{lang === 'en' ? 'Page not found' : 'Page non trouvée'}</div>;
  }

  // En mode demo, traduire les titres de page pour la navigation
  const pages = demo
    ? pagesConfig.pages.map((p) => ({
        ...p,
        title: translatePageTitle(p.id, lang, p.title),
      }))
    : pagesConfig.pages;

  // En mode demo, traduire les props des sections (stats, bento, etc.)
  const sections = demo
    ? page.sections.map((s) => translateSectionProps(s, lang))
    : page.sections;

  const pageId = page.slug.replace(/^\//, '') || 'index';

  return (
    <>
      <SiteHeader
        site={site}
        pages={pages}
        currentPath="/"
        logoUrl={logoUrl}
        demoOffset={demo}
      />

      {sections.map((section, i) => (
        <div
          key={section.contentId || i}
          id={`section-${i}`}
          className={i % 2 === 0 ? 'section-slot-a' : 'section-slot-b'}
          style={i % 2 !== 0 ? { background: 'color-mix(in srgb, var(--primary) 6%, var(--bg-light))' } : undefined}
        >
          <SectionRenderer
            section={section}
            site={site}
            layouts={layoutsConfig.layouts}
            lang={lang}
          />
          <SectionDivider divider={section.dividerAfter} />
        </div>
      ))}

      <SiteFooter site={site} logoUrl={logoUrl} lang={lang} />
      <ScrollReveal />
      <SmoothScroll />
      <ContentEditor pageId={pageId} lang={lang} backPath={`/${getAdminSlug()}`} />
      <SidebarEditor pageId={pageId} lang={lang} sections={sections} />
    </>
  );
}
