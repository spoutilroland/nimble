export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getLogoUrl } from '@/lib/data';

export async function GET() {
  return NextResponse.json({ url: getLogoUrl() });
}
