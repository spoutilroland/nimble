import type { Metadata } from 'next';
import { readSiteConfig } from '@/lib/data/site';
import { readThemeFile } from '@/lib/data/theme';
import { detectLang } from '@/lib/i18n/server';
import { ThemeScript } from '@/components/ui/ThemeScript';
import { AdminBar } from '@/components/layout/AdminBar';
import '../globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const site = await readSiteConfig();
  return {
    title: site.seo.defaultTitle || site.business.name,
    description: site.seo.defaultDescription || '',
    icons: {
      icon: [
        { url: '/icon.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon.ico', sizes: '48x48' },
      ],
      apple: { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    },
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
  const site = await readSiteConfig();
  const { theme } = await readThemeFile();
  const lang = await detectLang();
  const borderStyle = site.design?.borderStyle || 'angular';

  return (
    <html lang={lang} data-border={borderStyle} data-lang={lang} data-theme={theme} className="scroll-smooth" suppressHydrationWarning>
      <head>
        {site.fonts.googleFontsUrl && (
          <link href={site.fonts.googleFontsUrl} rel="stylesheet" />
        )}
        <ThemeScript />
        {site.design?.borderStyle === 'custom' && site.design.customRadius && (() => {
          const tl = Number(site.design.customRadius.tl) || 0;
          const tr = Number(site.design.customRadius.tr) || 0;
          const br = Number(site.design.customRadius.br) || 0;
          const bl = Number(site.design.customRadius.bl) || 0;
          return (
            <script
              dangerouslySetInnerHTML={{
                __html: `document.documentElement.style.setProperty('--radius','${tl}px ${tr}px ${br}px ${bl}px');`,
              }}
            />
          );
        })()}
      </head>
      <body className="site-page font-['Raleway',sans-serif] leading-[1.7] text-[var(--text)] bg-[var(--bg)] overflow-x-hidden">
        <AdminBar />
        {children}
      </body>
    </html>
  );
}
