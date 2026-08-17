import { NextResponse } from 'next/server';
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { isDemoMode } from '@/lib/demo';
import { getDataDir, getUploadsDir } from '@/lib/paths';

export const runtime = 'nodejs';

// Route TEMPORAIRE de diagnostic du filesystem en mode démo (à supprimer)
export async function GET() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  const cwd = process.cwd();
  const dataDir = getDataDir();
  const uploadsDir = getUploadsDir();
  const safeList = (dir: string) =>
    existsSync(dir) ? readdirSync(dir).slice(0, 30) : null;
  const preview = (file: string) => {
    try {
      return readFileSync(file, 'utf-8').slice(0, 120);
    } catch {
      return null;
    }
  };

  return NextResponse.json({
    cwd,
    dataDir,
    uploadsDir,
    cwdList: safeList(cwd),
    cwdDataList: safeList(path.join(cwd, 'data')),
    cwdSnapshotDataList: safeList(path.join(cwd, 'data', 'demo-snapshot', 'data')),
    tmpDataList: safeList(dataDir),
    tmpUploadsList: safeList(uploadsDir),
    siteJsonExists: existsSync(path.join(dataDir, 'site.json')),
    cwdSiteJsonPreview: preview(path.join(cwd, 'data', 'site.json')),
    tmpSiteJsonPreview: preview(path.join(dataDir, 'site.json')),
    env: {
      VERCEL: process.env.VERCEL ?? null,
      NEXT_RUNTIME: process.env.NEXT_RUNTIME ?? null,
    },
  });
}
