import { readSiteConfig } from '@/lib/data/site';
import { readPagesConfig } from '@/lib/data/pages';
import { readLayoutsConfig } from '@/lib/data/layouts';
import { getLogoUrl, getFaviconUrl } from '@/lib/data/helpers';
import { detectLang } from '@/lib/i18n/server';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { SectionDivider } from '@/components/layout/SectionDivider';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { ContentEditor } from '@/components/ui/ContentEditor';
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
  const pagesConfig = readPagesConfig();
  const layoutsConfig = readLayoutsConfig();
  const logoUrl = getLogoUrl();
  const lang = await detectLang();

  const page = pagesConfig.pages.find((p) => p.slug === '/');
  if (!page) {
    return <div>Page non trouvee</div>;
  }

  const pageId = page.slug.replace(/^\//, '') || 'index';

  return (
    <>
      <SiteHeader
        site={site}
        pages={pagesConfig.pages}
        currentPath="/"
        logoUrl={logoUrl}
      />

      {page.sections.map((section, i) => (
        <div key={i}>
          <SectionRenderer
            section={section}
            site={site}
            layouts={layoutsConfig.layouts}
          />
          <SectionDivider divider={section.dividerAfter} />
        </div>
      ))}

      <SiteFooter site={site} logoUrl={logoUrl} lang={lang} />
      <ScrollReveal />
      <SmoothScroll />
      <ContentEditor pageId={pageId} lang={lang} backPath={`/${getAdminSlug()}`} />
    </>
  );
}
