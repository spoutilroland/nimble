export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readThemeFile, writeThemeFile } from '@/lib/data';

const VALID_THEMES = ['alpine', 'pro', 'craft', 'industrial', 'provence'];

export const POST = withAuth(async (req: NextRequest) => {
  const { id, label, vars } = await req.json();

  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid theme id' }, { status: 400 });
  }
  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json({ error: 'Label is required' }, { status: 400 });
  }
  if (!vars || typeof vars !== 'object') {
    return NextResponse.json({ error: 'vars object is required' }, { status: 400 });
  }
  if (VALID_THEMES.includes(id)) {
    return NextResponse.json({ error: 'Cannot override a native theme' }, { status: 400 });
  }

  try {
    const data = await readThemeFile();
    if (!data.customThemes) data.customThemes = {};
    data.customThemes[id] = { label: label.trim(), vars };
    await writeThemeFile(data);
    return NextResponse.json({ success: true, id, label: label.trim() });
  } catch {
    return NextResponse.json({ error: 'Failed to save custom theme' }, { status: 500 });
  }
});
