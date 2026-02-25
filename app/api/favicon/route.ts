export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getFaviconUrl } from '@/lib/data';

export async function GET() {
  return NextResponse.json({ url: getFaviconUrl() });
}
