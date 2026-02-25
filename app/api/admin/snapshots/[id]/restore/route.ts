export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { restoreSnapshot } from '@/lib/data';

export const POST = withAuth(async (_req: NextRequest, context?: { params: Promise<Record<string, string>> }) => {
  const { id } = await context!.params;
  const ok = await restoreSnapshot(id);
  if (!ok) {
    return NextResponse.json({ error: 'Snapshot introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});
