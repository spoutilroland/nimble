/**
 * Initialise data/ si les fichiers n'existent pas encore.
 * Exécuté automatiquement avant chaque build (prebuild).
 *
 * - data/setup.json : setupDone=true + slug aléatoire unique par déploiement
 * - data/admin.json : hash du mot de passe par défaut "changeme123"
 *
 * Ces fichiers ne sont JAMAIS écrasés s'ils existent déjà.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';

const dataDir = resolve('data');
const setupFile = resolve(dataDir, 'setup.json');
const adminFile = resolve(dataDir, 'admin.json');

// Créer data/ si nécessaire
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
  console.log('[init-data] data/ créé');
}

// setup.json — générer seulement si absent
if (!existsSync(setupFile)) {
  const randomSlug = Math.random().toString(36).slice(2, 8);
  const adminSlug = `back-${randomSlug}`;
  writeFileSync(setupFile, JSON.stringify({ setupDone: true, adminSlug }, null, 2));
  console.log(`[init-data] setup.json créé — slug admin : /${adminSlug}`);
} else {
  const setup = JSON.parse(readFileSync(setupFile, 'utf8'));
  console.log(`[init-data] setup.json existant — slug admin : /${setup.adminSlug || 'back'}`);
}

// admin.json — générer seulement si absent
if (!existsSync(adminFile)) {
  const passwordHash = bcrypt.hashSync('changeme123', 10);
  writeFileSync(adminFile, JSON.stringify({ passwordHash }, null, 2));
  console.log('[init-data] admin.json créé — mot de passe par défaut : changeme123');
  console.log('[init-data] ⚠  Changez le mot de passe depuis le back-office après connexion !');
} else {
  console.log('[init-data] admin.json existant — inchangé');
}
