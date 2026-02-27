/**
 * Initialise data/ si les fichiers n'existent pas encore.
 * Exécuté automatiquement avant chaque build (prebuild).
 *
 * - data/setup.json : setupDone=true, adminSlug=back (fixe)
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
  writeFileSync(setupFile, JSON.stringify({ setupDone: true, adminSlug: 'back' }, null, 2));
  console.log('[init-data] setup.json créé — back office : /back');
} else {
  const setup = JSON.parse(readFileSync(setupFile, 'utf8'));
  // Migrer un ancien slug aléatoire vers /back
  if (setup.adminSlug && setup.adminSlug !== 'back') {
    setup.adminSlug = 'back';
    writeFileSync(setupFile, JSON.stringify(setup, null, 2));
    console.log('[init-data] setup.json migré — adminSlug forcé à /back');
  } else {
    console.log('[init-data] setup.json existant — inchangé');
  }
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
