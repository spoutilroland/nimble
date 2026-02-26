export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { buildStaticExport } from '@/lib/services/export';

export const POST = withAuth(async () => {
  const zipBuffer = await buildStaticExport();

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="site-export.zip"',
    },
  });
});
