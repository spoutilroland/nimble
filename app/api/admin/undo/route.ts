export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { undo, redo, getHistory } from '@/lib/undoManager';

export const GET = withAuth(async () => {
  return NextResponse.json(getHistory());
});

export const POST = withAuth(async (req: NextRequest) => {
  const { action } = await req.json();
  if (action === 'undo') {
    return NextResponse.json(undo());
  }
  if (action === 'redo') {
    return NextResponse.json(redo());
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
});
