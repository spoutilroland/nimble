export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readThemeFile } from '@/lib/data';

export async function GET() {
  const data = await readThemeFile();
  const response: Record<string, unknown> = {
    theme: data.theme,
    customThemes: data.customThemes || {},
  };
  if (data.customThemes?.[data.theme]) {
    response.vars = data.customThemes[data.theme].vars;
  }
  return NextResponse.json(response);
}
