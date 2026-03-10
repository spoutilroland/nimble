export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readSiteConfig } from '@/lib/data';

export async function GET() {
  return NextResponse.json(await readSiteConfig());
}
