export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async () => {
  try {
    const files = fs.readdirSync(path.join(process.cwd(), 'locales'));
    const codes = files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort();
    return NextResponse.json({ locales: codes });
  } catch {
    return NextResponse.json({ locales: ['fr'] });
  }
});
