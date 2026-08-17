export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth, demoBlock } from '@/lib/auth';
import {
  readMediaRegistry, writeMediaRegistry, generateMediaId, getMediaUrls,
  processImageWithSharp, generateThumb, MIME_TO_EXT, ALLOWED_TYPES, MAX_FILE_SIZE,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { uploadToBlob, appendMediaToBlob } from '@/lib/storage';
import { getDataDir, getUploadsDir } from '@/lib/paths';

const mediaDir = path.join(getUploadsDir(), 'media');
const dataDir = getDataDir();

export const POST = demoBlock(withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    const folderId = formData.get('folderId') as string | null;

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Valider tous les fichiers avant de commencer
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Type non autorisé : ${file.name}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Fichier trop volumineux : ${file.name}` },
          { status: 400 }
        );
      }
    }

    pushUndo('Upload media', {
      'media.json': path.join(dataDir, 'media.json'),
    });

    await fsp.mkdir(mediaDir, { recursive: true });

    const mediaData = readMediaRegistry();
    const uploaded: Array<{ id: string; filename: string; url: string }> = [];

    for (const file of files) {
      const ext = MIME_TO_EXT[file.type] || '.jpg';
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + ext;
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(mediaDir, filename);
      await fsp.writeFile(filePath, buffer);

      const isRaster = /\.(jpg|jpeg|png)$/i.test(filename);
      let hasWebp = false;
      let finalBuffer: Buffer = buffer;

      let hasThumb = false;

      if (isRaster) {
        try {
          // Redimensionner l'original si trop grand (max 1920px)
          const sharp = (await import('sharp')).default;
          const input = new Uint8Array(buffer);
          const meta = await sharp(input).metadata();
          if (meta.width && meta.height && (meta.width > 1920 || meta.height > 1920)) {
            finalBuffer = await sharp(input)
              .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
              .toBuffer();
            await fsp.writeFile(filePath, finalBuffer);
          }

          // Conversion WebP
          await processImageWithSharp(filePath);
          hasWebp = true;
          const webpName = filename.replace(/\.(jpg|jpeg|png)$/i, '.webp');
          const webpPath = path.join(mediaDir, webpName);
          const webpBuffer = await fsp.readFile(webpPath);
          await uploadToBlob(`uploads/media/${webpName}`, webpBuffer, 'image/webp').catch(() => {});
        } catch {
          hasWebp = false;
        }
      }

      // Thumbnail admin (200px WebP) — fonctionne aussi pour les .webp natifs
      if (/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        hasThumb = await generateThumb(filePath);
        if (hasThumb) {
          const thumbName = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '') + '-thumb.webp';
          const thumbPath = path.join(mediaDir, thumbName);
          const thumbBuffer = await fsp.readFile(thumbPath);
          await uploadToBlob(`uploads/media/${thumbName}`, thumbBuffer, 'image/webp').catch(() => {});
        }
      }

      // Sync l'original (potentiellement redimensionné) vers Blob
      await uploadToBlob(`uploads/media/${filename}`, finalBuffer, file.type).catch(() => {});

      const mediaId = generateMediaId();
      mediaData.media[mediaId] = {
        id: mediaId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        hasWebp,
        hasThumb,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        ...(folderId ? { folderId } : {}),
      };

      // Append atomique vers Blob (ne remplace jamais le fichier entier)
      await appendMediaToBlob(mediaId, mediaData.media[mediaId]).catch(() => {});

      const urls = getMediaUrls(mediaData.media[mediaId]);
      uploaded.push({ id: mediaId, filename: urls.filename, url: urls.url });
    }

    await writeMediaRegistry(mediaData);

    return NextResponse.json({ success: true, uploaded });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}));
