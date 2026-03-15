export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readMediaRegistry, writeMediaRegistry } from '@/lib/data';

// PATCH — renommer un dossier
export const PATCH = withAuth(async (req, ctx) => {
  const { folderId } = await ctx!.params as unknown as { folderId: string };
  const body = await req.json();
  const name = (body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  const data = readMediaRegistry();
  const folder = data.folders?.[folderId];
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  folder.name = name;
  await writeMediaRegistry(data);
  return NextResponse.json({ folder });
});

// DELETE — supprimer un dossier (les médias retournent à la racine)
export const DELETE = withAuth(async (_req, ctx) => {
  const { folderId } = await ctx!.params as unknown as { folderId: string };
  const data = readMediaRegistry();

  if (!data.folders?.[folderId]) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }

  // Retirer le folderId de tous les médias du dossier
  for (const entry of Object.values(data.media)) {
    if (entry.folderId === folderId) {
      delete entry.folderId;
    }
  }

  delete data.folders[folderId];
  await writeMediaRegistry(data);
  return NextResponse.json({ ok: true });
});
