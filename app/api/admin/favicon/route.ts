export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth } from '@/lib/auth';
import { MIME_TO_EXT } from '@/lib/data';
import { uploadToBlob, deleteFromBlobByPrefix } from '@/lib/storage';

const faviconDir = path.join(process.cwd(), 'uploads', 'favicon');
const FAVICON_TYPES = [
  'image/x-icon', 'image/vnd.microsoft.icon', 'image/png',
  'image/svg+xml', 'image/jpeg', 'image/jpg', 'image/webp',
];

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('favicon') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!FAVICON_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté' }, { status: 400 });
    }
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (1MB max)' }, { status: 400 });
    }

    const ext = MIME_TO_EXT[file.type] || '.png';
    const filename = 'favicon' + ext;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Supprimer l'ancien favicon
    try {
      const files = await fsp.readdir(faviconDir);
      for (const f of files) {
        if (f !== filename && /\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f)) {
          await fsp.unlink(path.join(faviconDir, f)).catch(() => {});
        }
      }
    } catch {}

    await fsp.writeFile(path.join(faviconDir, filename), buffer);
    await deleteFromBlobByPrefix('uploads/favicon/').catch(() => {});
    await uploadToBlob(`uploads/favicon/${filename}`, buffer, file.type).catch(() => {});
    return NextResponse.json({ success: true, url: `/uploads/favicon/${filename}` });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async () => {
  try {
    const files = await fsp.readdir(faviconDir);
    for (const f of files) {
      if (/\.(ico|png|svg|jpg|jpeg|webp)$/i.test(f)) {
        await fsp.unlink(path.join(faviconDir, f));
      }
    }
    await deleteFromBlobByPrefix('uploads/favicon/').catch(() => {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
});
