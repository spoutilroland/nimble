export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readThemeFile, writeThemeFile } from '@/lib/data';

export const DELETE = withAuth(async (
  _req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { id } = await ctx!.params;
  try {
    const data = readThemeFile();
    if (!data.customThemes?.[id]) {
      return NextResponse.json({ error: 'Custom theme not found' }, { status: 404 });
    }
    delete data.customThemes[id];
    if (data.theme === id) data.theme = 'alpine';
    await writeThemeFile(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete custom theme' }, { status: 500 });
  }
});
