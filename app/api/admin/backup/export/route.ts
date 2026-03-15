export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { buildBackupExport } from '@/lib/services/backup';

export const POST = withAuth(async () => {
  try {
    const buffer = await buildBackupExport();
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="nimble-backup-${date}.zip"`,
      },
    });
  } catch (err) {
    console.error('[backup/export]', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
});
