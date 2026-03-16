export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readLayoutsConfig, writeLayoutsConfig } from '@/lib/data';

export const POST = withAuth(async (req: NextRequest) => {
  const { id, label, blocks, description } = await req.json();

  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }
  if (!label || !label.trim()) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  }
  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: 'blocks doit être un tableau' }, { status: 400 });
  }

  try {
    const data = readLayoutsConfig();
    if (data.layouts[id]) {
      return NextResponse.json({ error: 'Un layout avec cet ID existe déjà' }, { status: 409 });
    }
    const now = new Date().toISOString();
    data.layouts[id] = { id, label: label.trim(), description: description?.trim() || undefined, createdAt: now, updatedAt: now, blocks };
    await writeLayoutsConfig(data);
    return NextResponse.json({ success: true, layout: data.layouts[id] });
  } catch {
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
});
