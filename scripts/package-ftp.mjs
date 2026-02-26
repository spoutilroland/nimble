/**
 * Prépare un dossier dist/ prêt à uploader via FTP sur Hostinger.
 *
 * Usage : node scripts/package-ftp.mjs
 *
 * Structure produite dans dist/ :
 *   server.js          ← entry point hPanel
 *   .next/             ← build Next.js (server + static)
 *   node_modules/      ← dépendances minimales (standalone)
 *   public/            ← fichiers publics
 *   locales/           ← traductions
 *   data/              ← données JSON (si existantes localement)
 *
 * → Uploader tout le contenu de dist/ dans nodejs/ sur Hostinger
 * → hPanel : Entry point = server.js
 */

import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const root = resolve('.');

// Le standalone Next.js place tout dans un sous-dossier = nom du package
const standaloneApp = resolve('.next/standalone/nimble');

if (!existsSync(standaloneApp)) {
  console.error('❌ .next/standalone/nimble/ introuvable — lance d\'abord : npm run build');
  process.exit(1);
}

const dist = resolve('dist');

// Nettoyage
if (existsSync(dist)) {
  rmSync(dist, { recursive: true });
}
mkdirSync(dist, { recursive: true });
console.log('✓ dist/ nettoyé');

// 1. Contenu du standalone (server.js + node_modules + .next/server)
cpSync(standaloneApp, dist, { recursive: true });
console.log('✓ standalone copié (server.js, node_modules, .next/server)');

// 2. Fichiers statiques JS/CSS (doivent être dans .next/static/)
cpSync(resolve('.next/static'), resolve(dist, '.next/static'), { recursive: true });
console.log('✓ .next/static/ copié');

// 3. Dossier public/
if (existsSync(resolve(root, 'public'))) {
  cpSync(resolve(root, 'public'), resolve(dist, 'public'), { recursive: true });
  console.log('✓ public/ copié');
}

// 4. Données JSON locales (ne pas écraser sur le serveur si déjà configuré)
if (existsSync(resolve(root, 'data'))) {
  cpSync(resolve(root, 'data'), resolve(dist, 'data'), { recursive: true });
  console.log('⚠  data/ copié — NE PAS écraser sur le serveur si le setup est déjà fait');
}

// 5. Dossiers uploads vides (seront remplis sur le serveur)
for (const folder of ['uploads/logo', 'uploads/favicon', 'uploads/media', 'uploads/social']) {
  mkdirSync(resolve(dist, folder), { recursive: true });
}
console.log('✓ uploads/ (dossiers vides créés)');

console.log(`
✅ dist/ prêt (${Math.round(await folderSize(dist) / 1024 / 1024)} MB)

  Uploader tout le contenu de dist/ dans nodejs/ sur Hostinger
  hPanel → Node.js → Entry point : server.js → Restart
`);

async function folderSize(dir) {
  const { readdirSync, statSync } = await import('fs');
  let total = 0;
  for (const f of readdirSync(dir, { recursive: true })) {
    try { total += statSync(resolve(dir, f)).size; } catch {}
  }
  return total;
}
