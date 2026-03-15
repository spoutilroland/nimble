export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { restoreBackup } from '@/lib/services/backup';

const MAX_ZIP_SIZE = 200 * 1024 * 1024; // 200 Mo

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_ZIP_SIZE) {
      return NextResponse.json({ error: 'File too large (max 200 MB)' }, { status: 400 });
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'Only ZIP files accepted' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await restoreBackup(buffer);

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error('[backup/import]', err);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
});
