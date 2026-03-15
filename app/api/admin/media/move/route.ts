export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readMediaRegistry, writeMediaRegistry } from '@/lib/data';

// POST — déplacer des médias dans un dossier (ou à la racine si folderId = null)
export const POST = withAuth(async (req) => {
  const body = await req.json();
  const { mediaIds, folderId } = body as { mediaIds: string[]; folderId: string | null };

  if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
    return NextResponse.json({ error: 'mediaIds required' }, { status: 400 });
  }

  const data = readMediaRegistry();

  // Valider le dossier cible (sauf si racine)
  if (folderId && !data.folders?.[folderId]) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  let moved = 0;
  for (const id of mediaIds) {
    const entry = data.media[id];
    if (!entry) continue;
    if (folderId) {
      entry.folderId = folderId;
    } else {
      delete entry.folderId;
    }
    moved++;
  }

  await writeMediaRegistry(data);
  return NextResponse.json({ ok: true, moved });
});
