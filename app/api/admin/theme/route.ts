export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { withAuth } from '@/lib/auth';
import { readThemeFile, writeThemeFile } from '@/lib/data';
import { pushUndo } from '@/lib/undoManager';

const VALID_THEMES = ['alpine', 'pro', 'craft', 'industrial', 'provence'];

export const POST = withAuth(async (req: NextRequest) => {
  const { theme } = await req.json();
  const data = readThemeFile();
  const isNative = VALID_THEMES.includes(theme);
  const isCustom = data.customThemes?.[theme];

  if (!isNative && !isCustom) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
  }

  try {
    pushUndo('Thème actif', { 'theme.json': path.join(process.cwd(), 'data', 'theme.json') });
    data.theme = theme;
    await writeThemeFile(data);
    return NextResponse.json({ success: true, theme });
  } catch {
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 });
  }
});
