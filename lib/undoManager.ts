import fs from 'fs';

interface UndoEntry {
  label: string;
  filePaths: Record<string, string>;
  snapshots: Record<string, string | null>;
}

interface UndoResult {
  success: boolean;
  label?: string;
  error?: string;
}

interface UndoHistory {
  undoCount: number;
  redoCount: number;
  undoLabel: string | null;
  redoLabel: string | null;
}

const MAX_HISTORY = 5;
const undoStack: UndoEntry[] = [];
const redoStack: UndoEntry[] = [];

export function pushUndo(label: string, filePaths: Record<string, string>): void {
  const snapshots: Record<string, string | null> = {};
  for (const [key, filePath] of Object.entries(filePaths)) {
    try {
      snapshots[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      snapshots[key] = null;
    }
  }

  undoStack.push({ label, filePaths, snapshots });

  while (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }

  redoStack.length = 0;
}

export function undo(): UndoResult {
  if (undoStack.length === 0) {
    return { success: false, error: 'Rien à annuler' };
  }

  const entry = undoStack.pop()!;

  const currentSnapshots: Record<string, string | null> = {};
  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    try {
      currentSnapshots[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      currentSnapshots[key] = null;
    }
  }
  redoStack.push({ label: entry.label, filePaths: entry.filePaths, snapshots: currentSnapshots });

  for (const [, filePath] of Object.entries(entry.filePaths)) {
    const key = Object.keys(entry.filePaths).find((k) => entry.filePaths[k] === filePath)!;
    if (entry.snapshots[key] !== null) {
      fs.writeFileSync(filePath, entry.snapshots[key]!);
    }
  }

  return { success: true, label: entry.label };
}

export function redo(): UndoResult {
  if (redoStack.length === 0) {
    return { success: false, error: 'Rien à rétablir' };
  }

  const entry = redoStack.pop()!;

  const currentSnapshots: Record<string, string | null> = {};
  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    try {
      currentSnapshots[key] = fs.readFileSync(filePath, 'utf8');
    } catch {
      currentSnapshots[key] = null;
    }
  }
  undoStack.push({ label: entry.label, filePaths: entry.filePaths, snapshots: currentSnapshots });

  for (const [key, filePath] of Object.entries(entry.filePaths)) {
    if (entry.snapshots[key] !== null) {
      fs.writeFileSync(filePath, entry.snapshots[key]!);
    }
  }

  return { success: true, label: entry.label };
}

export function getHistory(): UndoHistory {
  return {
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    undoLabel: undoStack.length > 0 ? undoStack[undoStack.length - 1].label : null,
    redoLabel: redoStack.length > 0 ? redoStack[redoStack.length - 1].label : null,
  };
}
