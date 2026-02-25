import fs from 'fs';
import path from 'path';

const cache: Record<string, Record<string, unknown>> = {};

export function loadLocale(lang: string): Record<string, unknown> {
  if (cache[lang]) return cache[lang];
  try {
    const file = path.join(process.cwd(), 'locales', `${lang}.json`);
    cache[lang] = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    cache[lang] = {};
  }
  return cache[lang];
}

export function t(lang: string, key: string, fallback?: string): string {
  const locale = loadLocale(lang);
  const value = key.split('.').reduce<unknown>((obj, k) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
    return undefined;
  }, locale);
  return (typeof value === 'string' ? value : undefined) ?? fallback ?? key;
}
