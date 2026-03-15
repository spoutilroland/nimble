/**
 * Vérifie que .env existe et contient un SESSION_SECRET valide (≥ 32 chars).
 * Si .env n'existe pas → copie .env.example.
 * Si SESSION_SECRET est absent ou trop court → en génère un automatiquement.
 *
 * Appelé automatiquement par les scripts dev, build et start.
 */

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';
import { randomBytes } from 'crypto';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const examplePath = resolve(root, '.env.example');

// 1. Créer .env à partir de .env.example si absent
if (!existsSync(envPath)) {
  if (existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
    console.log('[ensure-env] .env créé à partir de .env.example');
  } else {
    writeFileSync(envPath, '');
    console.log('[ensure-env] .env créé (vide)');
  }
}

// 2. Lire le contenu actuel
let content = readFileSync(envPath, 'utf8');

// 3. Extraire SESSION_SECRET
const match = content.match(/^SESSION_SECRET=(.*)$/m);
const currentValue = match ? match[1].trim() : '';

// 4. Générer si absent, placeholder, ou trop court
const isPlaceholder = currentValue.includes('change-this');
const isTooShort = currentValue.length < 32;

if (!match || isPlaceholder || isTooShort) {
  const secret = randomBytes(32).toString('base64url');

  if (match) {
    // Remplacer la ligne existante
    content = content.replace(/^SESSION_SECRET=.*$/m, `SESSION_SECRET=${secret}`);
  } else {
    // Ajouter à la fin
    content = content.trimEnd() + `\nSESSION_SECRET=${secret}\n`;
  }

  writeFileSync(envPath, content);
  console.log(`[ensure-env] SESSION_SECRET généré (${secret.length} caractères)`);
} else {
  console.log(`[ensure-env] SESSION_SECRET OK (${currentValue.length} caractères)`);
}
