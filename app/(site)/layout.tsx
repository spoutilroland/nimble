import type { Metadata } from 'next';
import { readSiteConfig } from '@/lib/data/site';
import { detectLang } from '@/lib/i18n/server';
import { ThemeScript } from '@/components/ui/ThemeScript';
import { AdminBar } from '@/components/layout/AdminBar';
import '../globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const site = readSiteConfig();
  return {
    title: site.seo.defaultTitle || site.business.name,
    description: site.seo.defaultDescription || '',
    openGraph: {
      title: site.seo.defaultTitle || site.business.name,
      description: site.seo.defaultDescription || '',
      ...(site.seo.ogImage ? { images: [site.seo.ogImage] } : {}),
    },
  };
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const site = readSiteConfig();
  const lang = await detectLang();
  const borderStyle = site.design?.borderStyle || 'angular';

  return (
    <html lang={lang} data-border={borderStyle} data-lang={lang}>
      <head>
        {site.fonts.googleFontsUrl && (
          <link href={site.fonts.googleFontsUrl} rel="stylesheet" />
        )}
        <ThemeScript />
        {site.design?.borderStyle === 'custom' && site.design.customRadius && (
          <script
            dangerouslySetInnerHTML={{
              __html: `document.documentElement.style.setProperty('--radius','${site.design.customRadius.tl}px ${site.design.customRadius.tr}px ${site.design.customRadius.br}px ${site.design.customRadius.bl}px');`,
            }}
          />
        )}
      </head>
      <body className="site-page">
        <AdminBar />
        {children}
      </body>
    </html>
  );
}
