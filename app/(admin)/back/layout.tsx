import type { Metadata } from 'next';
import '../../globals.css';
import './admin.css';
import { readSiteConfig } from '@/lib/data/site';
import { getFaviconUrl } from '@/lib/data/helpers';

export async function generateMetadata(): Promise<Metadata> {
  const site = readSiteConfig();
  return {
    title: `Back Office — ${site.business.name}`,
    ...(getFaviconUrl() ? { icons: { icon: getFaviconUrl()! } } : {}),
  };
}

export default async function BackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = readSiteConfig();
  const borderStyle = site.design?.borderStyle || 'angular';

  return (
    <html lang="fr" data-border={borderStyle} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('back-theme');if(t==='dark')document.documentElement.setAttribute('data-back-theme','dark');})();`,
          }}
        />
      </head>
      <body className="backoffice-body is-backoffice">
        {children}
      </body>
    </html>
  );
}
