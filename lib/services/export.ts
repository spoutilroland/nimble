import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { readPagesConfig } from '@/lib/data/pages';

/**
 * Construit un export statique du site sous forme de Buffer ZIP.
 * Crawl chaque page via HTTP, bundle les assets statiques et les uploads.
 */
export async function buildStaticExport(): Promise<Buffer> {
  const port = process.env.PORT ?? '3000';
  const baseUrl = `http://localhost:${port}`;

  // Récupère la liste des pages
  const { pages } = readPagesConfig();

  // Construit la liste des URLs à crawler :
  // - page d'accueil (slug vide ou "home" → /)
  // - pages dynamiques (slug → /slug)
  const pageEntries: { url: string; htmlPath: string }[] = [];

  for (const page of pages) {
    const slug = page.slug.replace(/^\/+/, '');
    const isHome = slug === '' || slug === 'home';
    const url = isHome ? `${baseUrl}/` : `${baseUrl}/${slug}`;
    const htmlPath = isHome ? 'index.html' : `${slug}/index.html`;
    pageEntries.push({ url, htmlPath });
  }

  // Si aucune page configurée, on crawle au moins l'accueil
  if (pageEntries.length === 0) {
    pageEntries.push({ url: `${baseUrl}/`, htmlPath: 'index.html' });
  }

  // Crée le ZIP en mémoire via un stream de Buffer
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 6 } });

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve());
    archive.on('error', (err: Error) => reject(err));

    // Wraps toutes les opérations async dans une IIFE pour pouvoir utiliser await
    (async () => {
      try {
        // Crawl et ajoute chaque page HTML
        for (const { url, htmlPath } of pageEntries) {
          let html: string;
          try {
            const res = await fetch(url, {
              // Timeout via AbortController (15 secondes par page)
              signal: AbortSignal.timeout(15_000),
            });
            html = await res.text();
          } catch {
            // Page inaccessible → on la saute sans bloquer l'export
            continue;
          }
          archive.append(html, { name: htmlPath });
        }

        // Bundle _next/static/ (CSS, JS)
        const nextStaticDir = path.join(process.cwd(), '.next', 'static');
        if (fs.existsSync(nextStaticDir)) {
          archive.directory(nextStaticDir, '_next/static');
        }

        // Bundle public/uploads/ (images uploadées par le client)
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (fs.existsSync(uploadsDir)) {
          archive.directory(uploadsDir, 'uploads');
        }

        archive.finalize();
      } catch (err) {
        reject(err);
      }
    })();
  });

  return Buffer.concat(chunks);
}
