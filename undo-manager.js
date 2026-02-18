/**
 * Gestionnaire d'undo/redo in-memory pour le backoffice.
 * Stocke jusqu'à MAX_HISTORY snapshots JSON avant chaque mutation.
 * L'historique est perdu au redémarrage du serveur — acceptable pour un confort session.
 */

const fs = require('fs');

const MAX_HISTORY = 5;

const undoStack = [];
const redoStack = [];

/**
 * Snapshot les fichiers JSON avant une mutation.
 * @param {string} label - Description lisible ("Identité du site")
 * @param {Object} filePaths - { clé: chemin absolu } ex: { 'site.json': '/abs/data/site.json' }
 */
function pushUndo(label, filePaths) {
  const snapshots = {};
  for (const [key, filePath] of Object.entries(filePaths)) {
    try {
      snapshots[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      snapshots[key] = null;
    }
  }

  undoStack.push({ label, filePaths, snapshots });

  // Limiter la taille de la pile
  while (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }

  // Nouvelle mutation → invalide la pile redo
  redoStack.length = 0;
}

/**
 * Annule la dernière action : restaure le snapshot, pousse l'état courant sur redo.
 * @returns {{ success: boolean, label?: string, error?: string }}
 */
function undo() {
  if (undoStack.length === 0) {
    return { success: false, error: 'Rien à annuler' };
  }

  const entry = undoStack.pop();

  // Sauvegarder l'état courant pour le redo
  const currentSnapshots = {};
  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    try {
      currentSnapshots[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      currentSnapshots[key] = null;
    }
  }
  redoStack.push({ label: entry.label, filePaths: entry.filePaths, snapshots: currentSnapshots });

  // Restaurer les fichiers depuis le snapshot
  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    if (entry.snapshots[key] !== null) {
      fs.writeFileSync(filePath, entry.snapshots[key]);
    }
  }

  return { success: true, label: entry.label };
}

/**
 * Rétablit la dernière annulation.
 * @returns {{ success: boolean, label?: string, error?: string }}
 */
function redo() {
  if (redoStack.length === 0) {
    return { success: false, error: 'Rien à rétablir' };
  }

  const entry = redoStack.pop();

  // Sauvegarder l'état courant pour permettre un undo à nouveau
  const currentSnapshots = {};
  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    try {
      currentSnapshots[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      currentSnapshots[key] = null;
    }
  }
  undoStack.push({ label: entry.label, filePaths: entry.filePaths, snapshots: currentSnapshots });

  // Restaurer les fichiers depuis le snapshot redo
  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    if (entry.snapshots[key] !== null) {
      fs.writeFileSync(filePath, entry.snapshots[key]);
    }
  }

  return { success: true, label: entry.label };
}

/**
 * Retourne l'état courant des piles.
 */
function getHistory() {
  return {
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    undoLabel: undoStack.length > 0 ? undoStack[undoStack.length - 1].label : null,
    redoLabel: redoStack.length > 0 ? redoStack[redoStack.length - 1].label : null,
  };
}

module.exports = { pushUndo, undo, redo, getHistory };
