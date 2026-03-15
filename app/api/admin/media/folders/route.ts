export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readMediaRegistry, writeMediaRegistry } from '@/lib/data';

// GET — liste des dossiers
export const GET = withAuth(async () => {
  const data = readMediaRegistry();
  const folders = Object.values(data.folders ?? {});
  return NextResponse.json({ folders });
});

// POST — créer un dossier
export const POST = withAuth(async (req) => {
  const body = await req.json();
  const name = (body.name ?? '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  const id = 'f_' + Date.now() + '_' + Math.round(Math.random() * 1e9);
  const data = readMediaRegistry();
  if (!data.folders) data.folders = {};
  data.folders[id] = { id, name, createdAt: new Date().toISOString() };
  await writeMediaRegistry(data);

  return NextResponse.json({ folder: data.folders[id] });
});
