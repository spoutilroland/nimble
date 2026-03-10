import { notFound } from 'next/navigation';
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

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = readSiteConfig();
  const pagesConfig = readPagesConfig();
  const faviconUrl = getFaviconUrl();
  const slugPath = '/' + slug.join('/');
  const page = pagesConfig.pages.find((p) => p.slug === slugPath);

  const seoTitle = page?.seo?.title || (page ? `${page.title} | ${site.business.name}` : site.seo.defaultTitle);
  const seoDesc = page?.seo?.description || site.seo.defaultDescription;

  return {
    title: seoTitle,
    description: seoDesc,
    ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
  };
}

export default async function DynamicPage({ params }: PageProps) {
  const { slug } = await params;
  const site = readSiteConfig();
  const pagesConfig = readPagesConfig();
  const layoutsConfig = readLayoutsConfig();
  const logoUrl = getLogoUrl();
  const lang = await detectLang();

  const slugPath = '/' + slug.join('/');
  const page = pagesConfig.pages.find((p) => p.slug === slugPath);

  if (!page) {
    notFound();
  }

  const pageId = page.slug.replace(/^\//, '') || 'index';

  return (
    <>
      <SiteHeader
        site={site}
        pages={pagesConfig.pages}
        currentPath={slugPath}
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
