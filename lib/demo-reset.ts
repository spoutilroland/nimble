import { existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');
const UPLOADS_DIR = join(process.cwd(), 'uploads');
const SNAPSHOT_DIR = join(process.cwd(), 'data', 'demo-snapshot');
const SNAPSHOT_DATA = join(SNAPSHOT_DIR, 'data');
const SNAPSHOT_UPLOADS = join(SNAPSHOT_DIR, 'uploads');

/** Fichiers JSON à sauvegarder/restaurer (exclut demo.json, admin.json, setup.json) */
const DATA_FILES = [
  'carousels.json',
  'content.json',
  'layouts.json',
  'media.json',
  'pages.json',
  'site.json',
  'theme.json',
];

function copyDirRecursive(src: string, dest: string) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function rmDirRecursive(dir: string) {
  if (!existsSync(dir)) return;
  const { rmSync } = require('fs');
  rmSync(dir, { recursive: true, force: true });
}

/** Crée un snapshot de l'état actuel (appelé une fois au premier démarrage demo) */
export function createDemoSnapshot() {
  if (existsSync(SNAPSHOT_DIR)) return; // Snapshot déjà existant
  mkdirSync(SNAPSHOT_DATA, { recursive: true });

  // Copier les fichiers JSON
  for (const file of DATA_FILES) {
    const src = join(DATA_DIR, file);
    if (existsSync(src)) {
      copyFileSync(src, join(SNAPSHOT_DATA, file));
    }
  }

  // Copier les uploads
  if (existsSync(UPLOADS_DIR)) {
    copyDirRecursive(UPLOADS_DIR, SNAPSHOT_UPLOADS);
  }
}

/** Restaure le snapshot (reset demo) */
export function restoreDemoSnapshot(): boolean {
  if (!existsSync(SNAPSHOT_DIR)) return false;

  // Restaurer les fichiers JSON
  for (const file of DATA_FILES) {
    const src = join(SNAPSHOT_DATA, file);
    if (existsSync(src)) {
      copyFileSync(src, join(DATA_DIR, file));
    }
  }

  // Restaurer les uploads
  if (existsSync(SNAPSHOT_UPLOADS)) {
    // Supprimer les uploads actuels puis copier le snapshot
    rmDirRecursive(UPLOADS_DIR);
    copyDirRecursive(SNAPSHOT_UPLOADS, UPLOADS_DIR);
  }

  return true;
}

// ── Tracking d'activité pour auto-reset ──

let lastActivityTimestamp = Date.now();
let resetTimer: ReturnType<typeof setTimeout> | null = null;

/** Met à jour le timestamp d'activité */
export function touchActivity() {
  lastActivityTimestamp = Date.now();
}

/** Retourne le temps écoulé depuis la dernière activité (en minutes) */
export function getInactivityMinutes(): number {
  return (Date.now() - lastActivityTimestamp) / 60_000;
}

/** Démarre le timer d'auto-reset (appelé au démarrage du serveur en mode demo) */
export function startAutoResetTimer(inactivityMinutes: number) {
  if (resetTimer) clearInterval(resetTimer);

  // Vérifier toutes les minutes
  resetTimer = setInterval(() => {
    const inactive = getInactivityMinutes();
    if (inactive >= inactivityMinutes) {
      console.log(`[Demo] Auto-reset après ${Math.round(inactive)} min d'inactivité`);
      restoreDemoSnapshot();
      lastActivityTimestamp = Date.now(); // Reset le timer
    }
  }, 60_000);
}
