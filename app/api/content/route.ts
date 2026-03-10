export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { readContent, readSiteConfig } from '@/lib/data';
import { detectLang } from '@/lib/i18n/server';

export async function GET() {
  try {
    const content = await readContent();
    const lang = await detectLang();
    const site = await readSiteConfig();
    const available = site.languages?.available || ['fr'];
    const isMultilang = Object.keys(content).some(
      (k) => available.includes(k) || k.length === 2
    );
    return NextResponse.json(isMultilang ? content[lang] || {} : content);
  } catch {
    return NextResponse.json({});
  }
}
