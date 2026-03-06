export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth } from '@/lib/auth';
import { processImageWithSharp, MIME_TO_EXT, ALLOWED_TYPES, MAX_FILE_SIZE } from '@/lib/data';
import { uploadToBlob, deleteFromBlobByPrefix } from '@/lib/storage';

const NETWORKS = ['linkedin', 'facebook', 'instagram', 'x', 'tiktok', 'youtube', 'pinterest', 'github'];
const socialDir = path.join(process.cwd(), 'uploads', 'social');

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const network = searchParams.get('network');
    if (!network || !NETWORKS.includes(network)) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('icon') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Créer le dossier si nécessaire
    await fsp.mkdir(socialDir, { recursive: true });

    // Supprimer l'ancienne icône de ce réseau
    try {
      const files = await fsp.readdir(socialDir);
      for (const f of files) {
        if (f.startsWith(network + '.') && /\.(jpg|jpeg|png|webp)$/i.test(f)) {
          await fsp.unlink(path.join(socialDir, f)).catch(() => {});
        }
      }
    } catch {}

    const ext = MIME_TO_EXT[file.type] || '.jpg';
    const filename = network + ext;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(socialDir, filename);
    await fsp.writeFile(filePath, buffer);
    await deleteFromBlobByPrefix(`uploads/social/${network}.`).catch(() => {});
    await uploadToBlob(`uploads/social/${filename}`, buffer, file.type).catch(() => {});
    processImageWithSharp(filePath).catch(() => {});

    return NextResponse.json({ success: true, url: `/uploads/social/${filename}` });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const network = searchParams.get('network');
    if (!network || !NETWORKS.includes(network)) {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const files = await fsp.readdir(socialDir);
    for (const f of files) {
      if (f.startsWith(network + '.') && /\.(jpg|jpeg|png|webp)$/i.test(f)) {
        await fsp.unlink(path.join(socialDir, f)).catch(() => {});
      }
    }
    await deleteFromBlobByPrefix(`uploads/social/${network}.`).catch(() => {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
});
