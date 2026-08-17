export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth, demoBlock } from '@/lib/auth';
import {
  readCarouselsConfig, writeCarouselsConfig, ensureCarouselExists,
  readMediaRegistry, writeMediaRegistry, generateMediaId, getMediaUrls,
  processImageWithSharp, generateThumb, MIME_TO_EXT, ALLOWED_TYPES, MAX_FILE_SIZE,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { uploadToBlob, appendMediaToBlob } from '@/lib/storage';
import { getDataDir, getUploadsDir } from '@/lib/paths';

const mediaDir = path.join(getUploadsDir(), 'media');
const dataDir = getDataDir();

export const POST = demoBlock(withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  try {
    const { carouselId } = await ctx!.params;
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    ensureCarouselExists(carouselId);
    const carouselsData = readCarouselsConfig();
    const carousel = carouselsData.carousels[carouselId];

    if ((carousel.images || []).length >= carousel.maxImages) {
      return NextResponse.json(
        { error: `Maximum ${carousel.maxImages} images allowed` },
        { status: 400 }
      );
    }

    pushUndo('Upload image', {
      'carousels.json': path.join(dataDir, 'carousels.json'),
      'media.json': path.join(dataDir, 'media.json'),
    });

    // Créer le dossier uploads/media/ s'il n'existe pas encore (premier déploiement)
    await fsp.mkdir(mediaDir, { recursive: true });

    const ext = MIME_TO_EXT[file.type] || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const filename = uniqueSuffix + ext;
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(mediaDir, filename);
    await fsp.writeFile(filePath, buffer);
    await uploadToBlob(`uploads/media/${filename}`, buffer, file.type).catch(() => {});

    const hasWebp = /\.(jpg|jpeg|png)$/i.test(filename);
    if (hasWebp) processImageWithSharp(filePath).catch(() => {});

    // Thumbnail admin (200px WebP)
    let hasThumb = false;
    if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      hasThumb = await generateThumb(filePath);
      if (hasThumb) {
        const thumbName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '') + '-thumb.webp';
        const thumbPath = path.join(mediaDir, thumbName);
        const thumbBuffer = await fsp.readFile(thumbPath);
        await uploadToBlob(`uploads/media/${thumbName}`, thumbBuffer, 'image/webp').catch(() => {});
      }
    }

    const mediaId = generateMediaId();
    const mediaData = readMediaRegistry();
    mediaData.media[mediaId] = {
      id: mediaId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      hasWebp,
      hasThumb,
      uploadedAt: new Date().toISOString(),
    };
    await writeMediaRegistry(mediaData);
    await appendMediaToBlob(mediaId, mediaData.media[mediaId]).catch(() => {});

    if (!carousel.images) carousel.images = [];
    carousel.images.push(mediaId);
    await writeCarouselsConfig(carouselsData);

    const urls = getMediaUrls(mediaData.media[mediaId]);
    return NextResponse.json({ success: true, filename: urls.filename, url: urls.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}));
