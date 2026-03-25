import { notFound } from 'next/navigation';
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
  const demo = isDemoMode();

  if (!page) {
    notFound();
  }

  const pages = demo
    ? pagesConfig.pages.map((p) => ({ ...p, title: translatePageTitle(p.id, lang, p.title) }))
    : pagesConfig.pages;

  const sections = demo
    ? page.sections.map((s) => translateSectionProps(s, lang))
    : page.sections;

  const pageId = page.slug.replace(/^\//, '') || 'index';

  return (
    <>
      <SiteHeader
        site={site}
        pages={pages}
        currentPath={slugPath}
        logoUrl={logoUrl}
        demoOffset={demo}
      />

      {sections.map((section, i) => (
        <div
          key={i}
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
      <SidebarEditor pageId={pageId} lang={lang} sections={page.sections} />
    </>
  );
}
