export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getSocialIconUrl } from '@/lib/data';

const NETWORKS = ['linkedin', 'facebook', 'instagram', 'x', 'tiktok', 'youtube', 'pinterest', 'github'];

export async function GET() {
  const icons: Record<string, string> = {};
  for (const network of NETWORKS) {
    const url = getSocialIconUrl(network);
    if (url) icons[network] = url;
  }
  return NextResponse.json(icons);
}
