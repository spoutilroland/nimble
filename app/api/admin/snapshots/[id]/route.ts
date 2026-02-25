export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { deleteSnapshot } from '@/lib/data';

export const DELETE = withAuth(async (_req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
  const { id } = await context!.params;
  const ok = await deleteSnapshot(id);
  if (!ok) {
    return NextResponse.json({ error: 'Snapshot introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});
