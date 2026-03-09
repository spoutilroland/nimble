export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fsp from 'fs/promises';
import { withAuth } from '@/lib/auth';
import {
  readMediaRegistry, writeMediaRegistry, generateMediaId, getMediaUrls,
  MIME_TO_EXT, ALLOWED_TYPES, MAX_FILE_SIZE,
} from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';
import { uploadToBlob } from '@/lib/storage';

const mediaDir = path.join(process.cwd(), 'uploads', 'media');
const dataDir = path.join(process.cwd(), 'data');

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];

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
      await uploadToBlob(`uploads/media/${filename}`, buffer, file.type);

      const mediaId = generateMediaId();
      mediaData.media[mediaId] = {
        id: mediaId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        hasWebp: false,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
      };

      const urls = getMediaUrls(mediaData.media[mediaId]);
      uploaded.push({ id: mediaId, filename: urls.filename, url: urls.url });
    }

    await writeMediaRegistry(mediaData);

    return NextResponse.json({ success: true, uploaded });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
});
