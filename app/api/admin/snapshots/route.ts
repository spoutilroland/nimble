export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { listSnapshots, createSnapshot } from '@/lib/data';
import { CreateSnapshotBodySchema } from '@/lib/schemas';

export const GET = withAuth(async () => {
  const snapshots = await listSnapshots();
  return NextResponse.json({ snapshots });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = await req.json();
  const parsed = CreateSnapshotBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const snapshot = await createSnapshot(parsed.data.name);
  return NextResponse.json({ snapshot }, { status: 201 });
});
