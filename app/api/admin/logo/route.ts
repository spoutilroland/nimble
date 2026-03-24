export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth, demoBlock } from '@/lib/auth';
import { processImageWithSharp, MIME_TO_EXT, ALLOWED_TYPES, MAX_FILE_SIZE } from '@/lib/data';
import { uploadToBlob, deleteFromBlobByPrefix } from '@/lib/storage';

const logoDir = path.join(process.cwd(), 'uploads', 'logo');

export const POST = demoBlock(withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('logo') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    const ext = MIME_TO_EXT[file.type] || '.jpg';
    const filename = 'logo' + ext;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Supprimer les anciens logos
    try {
      const files = await fsp.readdir(logoDir);
      for (const f of files) {
        if (f !== filename && /\.(jpg|jpeg|png|webp|svg)$/i.test(f)) {
          await fsp.unlink(path.join(logoDir, f)).catch(() => {});
        }
      }
    } catch {}

    await fsp.mkdir(logoDir, { recursive: true });
    const filePath = path.join(logoDir, filename);
    await fsp.writeFile(filePath, buffer);
    await deleteFromBlobByPrefix('uploads/logo/').catch(() => {});
    await uploadToBlob(`uploads/logo/${filename}`, buffer, file.type).catch(() => {});
    // Sharp ne gère pas le SVG — on skip l'optimisation
    if (file.type !== 'image/svg+xml') {
      processImageWithSharp(filePath).catch(() => {});
    }

    return NextResponse.json({ success: true, url: `/uploads/logo/${filename}` });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}));

export const DELETE = demoBlock(withAuth(async () => {
  try {
    const files = await fsp.readdir(logoDir);
    for (const f of files) {
      if (/\.(jpg|jpeg|png|webp|svg)$/i.test(f)) {
        await fsp.unlink(path.join(logoDir, f));
      }
    }
    await deleteFromBlobByPrefix('uploads/logo/').catch(() => {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}));
