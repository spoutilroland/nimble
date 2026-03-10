import { cookies, headers } from 'next/headers';
import { readSiteConfig } from '@/lib/data/site';

export async function detectLang(): Promise<string> {
  const site = readSiteConfig();
  const available = site.languages?.available || ['fr'];
  const defaultLang = site.languages?.default || 'fr';

  // Cookie lang
  const cookieStore = await cookies();
  const langCookie = cookieStore.get('lang')?.value;
  if (langCookie && available.includes(langCookie)) {
    return langCookie;
  }

  // Accept-Language header
  const headersList = await headers();
  const accept = headersList.get('accept-language') || '';
  const preferred = accept.split(',')[0].split('-')[0].trim();
  if (preferred && available.includes(preferred)) {
    return preferred;
  }

  return defaultLang;
}
