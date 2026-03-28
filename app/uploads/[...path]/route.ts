export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { proxyBlobFile } from '@/lib/storage';
import { getUploadsDir } from '@/lib/paths';

const uploadsDir = getUploadsDir();

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  // Sécurité : vérifier que le chemin reste dans uploads/
  const filePath = path.resolve(uploadsDir, ...segments);
  if (!filePath.startsWith(uploadsDir + path.sep) && filePath !== uploadsDir) {
    return new NextResponse(null, { status: 403 });
  }

  // 1. Essayer le fichier local
  try {
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    // Fichier local absent — fallback Blob
  }

  // 2. Fallback : proxy depuis Vercel Blob (store privé)
  const blobPathname = `uploads/${segments.join('/')}`;
  const result = await proxyBlobFile(blobPathname);

  if (result) {
    return new NextResponse(result.buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return new NextResponse(null, { status: 404 });
}
