export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readPagesConfig } from '@/lib/data';

export async function GET() {
  return NextResponse.json(readPagesConfig());
}
