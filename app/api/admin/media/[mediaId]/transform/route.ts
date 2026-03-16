export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth } from '@/lib/auth';
import { readMediaRegistry, writeMediaRegistry } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { processImageWithSharp, generateThumb } from '@/lib/data/helpers';

const mediaDir = path.join(process.cwd(), 'uploads', 'media');
const dataDir = path.join(process.cwd(), 'data');

type TransformOp = 'rotate-90' | 'rotate-180' | 'rotate-270' | 'flip-h' | 'flip-v';
const VALID_OPS: TransformOp[] = ['rotate-90', 'rotate-180', 'rotate-270', 'flip-h', 'flip-v'];

export const POST = withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { mediaId } = await ctx!.params;
  const mediaData = readMediaRegistry();
  const entry = mediaData.media[mediaId];

  if (!entry) {
    return NextResponse.json({ error: 'Media introuvable' }, { status: 404 });
  }

  if (entry.mimeType === 'image/svg+xml') {
    return NextResponse.json({ error: 'Transformation non supportée pour les SVG' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const op = body.operation as TransformOp;

    if (!VALID_OPS.includes(op)) {
      return NextResponse.json({ error: `Opération invalide. Valeurs acceptées : ${VALID_OPS.join(', ')}` }, { status: 400 });
    }

    pushUndo('Transformation media', {
      'media.json': path.join(dataDir, 'media.json'),
    });

    const sharp = (await import('sharp')).default;
    const filePath = path.join(mediaDir, entry.filename);
    const buffer = await fsp.readFile(filePath);

    let pipeline = sharp(buffer);
    switch (op) {
      case 'rotate-90':  pipeline = pipeline.rotate(90); break;
      case 'rotate-180': pipeline = pipeline.rotate(180); break;
      case 'rotate-270': pipeline = pipeline.rotate(270); break;
      case 'flip-h':     pipeline = pipeline.flop(); break;
      case 'flip-v':     pipeline = pipeline.flip(); break;
    }

    const transformed = await pipeline.toBuffer();
    await fsp.writeFile(filePath, transformed);

    const meta = await sharp(transformed).metadata();
    if (meta.width && meta.height) {
      entry.width = meta.width;
      entry.height = meta.height;
      entry.fileSize = transformed.length;
    }

    if (entry.hasWebp) {
      await processImageWithSharp(filePath);
    }
    if (entry.hasThumb) {
      await generateThumb(filePath);
    }

    await writeMediaRegistry(mediaData);

    return NextResponse.json({
      success: true,
      entry: { width: entry.width, height: entry.height, fileSize: entry.fileSize },
    });
  } catch (err) {
    console.error('Transform error:', err);
    return NextResponse.json({ error: 'Transformation échouée' }, { status: 500 });
  }
});
