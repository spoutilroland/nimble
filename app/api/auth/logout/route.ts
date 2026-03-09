export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function POST() {
  const session = await getSession();
  session.destroy();
  const res = NextResponse.json({ success: true });
  // Supprimer le cookie indicateur admin
  res.cookies.set('is_admin', '', { maxAge: 0, path: '/' });
  return res;
}
