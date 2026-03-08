export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { readContent, writeContent, readSiteConfig, sanitizeRichText } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

export const POST = withAuth(async (req: NextRequest) => {
  const { page, key, value, lang } = await req.json();
  try {
    const contentFile = path.join(process.cwd(), 'data', 'content.json');
    pushUndo('Texte inline', { 'content.json': contentFile });

    const content = readContent();
    const site = readSiteConfig();
    const available = site.languages?.available || ['fr'];
    const defaultLang = site.languages?.default || 'fr';
    const targetLang = lang && available.includes(lang) ? lang : defaultLang;

    if (!content[targetLang]) content[targetLang] = {};
    if (!content[targetLang][page]) content[targetLang][page] = {};
    content[targetLang][page][key] = typeof value === 'string' ? sanitizeRichText(value) : value;

    await writeContent(content);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
});
