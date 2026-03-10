import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import type { SnapshotMeta, SnapshotsIndex } from '@/lib/schemas';
import { isBlobEnabled, readJsonFromBlob, syncJsonToBlob, deleteFromBlobByPrefix } from '@/lib/storage';

// Fichiers JSON inclus dans un snapshot (admin.json et media.json exclus)
const SNAPSHOT_FILES = ['site', 'pages', 'carousels', 'layouts', 'theme', 'content'] as const;

const DATA_DIR = path.join(process.cwd(), 'data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');
const INDEX_FILE = path.join(SNAPSHOTS_DIR, 'snapshots.json');

const MAX_SNAPSHOTS = 5;

async function readSnapshotsIndex(): Promise<SnapshotsIndex> {
  if (isBlobEnabled()) {
    return readJsonFromBlob<SnapshotsIndex>('snapshots/snapshots.json', { snapshots: [] });
  }
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch {
    return { snapshots: [] };
  }
}

async function writeSnapshotsIndex(data: SnapshotsIndex): Promise<void> {
  await fsp.writeFile(INDEX_FILE, JSON.stringify(data, null, 2));
  await syncJsonToBlob('snapshots/snapshots.json', data).catch(() => {});
}

async function ensureSnapshotsDir(): Promise<void> {
  await fsp.mkdir(SNAPSHOTS_DIR, { recursive: true });
}

export async function listSnapshots(): Promise<SnapshotMeta[]> {
  const index = await readSnapshotsIndex();
  // Du plus récent au plus ancien
  return [...index.snapshots].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createSnapshot(name: string): Promise<SnapshotMeta> {
  await ensureSnapshotsDir();

  const index = await readSnapshotsIndex();

  // Rotation : supprimer le plus ancien si on atteint le maximum
  if (index.snapshots.length >= MAX_SNAPSHOTS) {
    const sorted = [...index.snapshots].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const oldest = sorted[0];
    const oldDir = path.join(SNAPSHOTS_DIR, oldest.id);
    await fsp.rm(oldDir, { recursive: true, force: true });
    await deleteFromBlobByPrefix(`data/snapshots/${oldest.id}/`).catch(() => {});
    index.snapshots = index.snapshots.filter((s) => s.id !== oldest.id);
  }

  // Créer le répertoire du nouveau snapshot
  const id = crypto.randomUUID();
  const snapshotDir = path.join(SNAPSHOTS_DIR, id);
  await fsp.mkdir(snapshotDir, { recursive: true });

  // Copier les fichiers JSON
  let fileCount = 0;
  for (const name_ of SNAPSHOT_FILES) {
    const src = path.join(DATA_DIR, `${name_}.json`);
    const dest = path.join(snapshotDir, `${name_}.json`);
    try {
      await fsp.copyFile(src, dest);
      const content = await fsp.readFile(dest, 'utf8');
      await syncJsonToBlob(`snapshots/${id}/${name_}.json`, JSON.parse(content)).catch(() => {});
      fileCount++;
    } catch {
      // Fichier absent → on ignore
    }
  }

  const meta: SnapshotMeta = {
    id,
    name,
    createdAt: new Date().toISOString(),
    fileCount,
  };

  index.snapshots.push(meta);
  await writeSnapshotsIndex(index);

  return meta;
}

export async function restoreSnapshot(id: string): Promise<boolean> {
  const index = await readSnapshotsIndex();
  const exists = index.snapshots.find((s) => s.id === id);
  if (!exists) return false;

  const snapshotDir = path.join(SNAPSHOTS_DIR, id);
  for (const name_ of SNAPSHOT_FILES) {
    const src = path.join(snapshotDir, `${name_}.json`);
    const dest = path.join(DATA_DIR, `${name_}.json`);
    try {
      await fsp.copyFile(src, dest);
      const content = await fsp.readFile(dest, 'utf8');
      await syncJsonToBlob(`${name_}.json`, JSON.parse(content)).catch(() => {});
    } catch {
      // Fichier manquant dans le snapshot → on ignore
    }
  }

  return true;
}

export async function deleteSnapshot(id: string): Promise<boolean> {
  const index = await readSnapshotsIndex();
  const exists = index.snapshots.find((s) => s.id === id);
  if (!exists) return false;

  const snapshotDir = path.join(SNAPSHOTS_DIR, id);
  await fsp.rm(snapshotDir, { recursive: true, force: true });
  await deleteFromBlobByPrefix(`data/snapshots/${id}/`).catch(() => {});

  index.snapshots = index.snapshots.filter((s) => s.id !== id);
  await writeSnapshotsIndex(index);

  return true;
}
