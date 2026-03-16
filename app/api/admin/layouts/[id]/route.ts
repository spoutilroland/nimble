export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import { readLayoutsConfig, writeLayoutsConfig, readPagesConfig } from '@/lib/data';

export const PUT = withAuth(async (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { id } = await ctx!.params;
  const { label, blocks, description } = await req.json();

  try {
    const data = readLayoutsConfig();
    if (!data.layouts[id]) {
      return NextResponse.json({ error: 'Layout introuvable' }, { status: 404 });
    }
    if (label) data.layouts[id].label = label.trim();
    if (description !== undefined) data.layouts[id].description = description?.trim() || undefined;
    if (Array.isArray(blocks)) data.layouts[id].blocks = blocks;
    data.layouts[id].updatedAt = new Date().toISOString();
    await writeLayoutsConfig(data);
    return NextResponse.json({ success: true, layout: data.layouts[id] });
  } catch {
    return NextResponse.json({ error: 'Erreur sauvegarde' }, { status: 500 });
  }
});

export const DELETE = withAuth(async (
  _req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => {
  const { id } = await ctx!.params;

  try {
    const data = readLayoutsConfig();
    if (!data.layouts[id]) {
      return NextResponse.json({ error: 'Layout introuvable' }, { status: 404 });
    }

    const pagesData = readPagesConfig();
    const usedIn: string[] = [];
    for (const page of pagesData.pages || []) {
      for (const section of page.sections || []) {
        if (section.type === 'custom-layout' && section.layoutId === id) {
          usedIn.push(page.title);
        }
      }
    }

    if (usedIn.length > 0) {
      return NextResponse.json(
        { error: `Ce layout est utilisé dans : ${usedIn.join(', ')}`, usedIn },
        { status: 409 }
      );
    }

    delete data.layouts[id];
    await writeLayoutsConfig(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  }
});
