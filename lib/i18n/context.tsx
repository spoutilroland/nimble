'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface I18nContextValue {
  locale: Record<string, unknown>;
  t: (key: string, vars?: Record<string, string>) => string;
  tp: (key: string, count: number, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolveKey(locale: Record<string, unknown>, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((obj, k) => {
    if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[k];
    return undefined;
  }, locale);
  return typeof value === 'string' ? value : undefined;
}

function interpolate(str: string, vars?: Record<string, string>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? `{${name}}`);
}

export function I18nProvider({
  locale,
  children,
}: {
  locale: Record<string, unknown>;
  children: ReactNode;
}) {
  const t = (key: string, vars?: Record<string, string>): string => {
    const value = resolveKey(locale, key);
    return interpolate(value ?? key, vars);
  };

  const tp = (key: string, count: number, vars?: Record<string, string>): string => {
    const suffix = count === 1 ? '_one' : '_other';
    const value = resolveKey(locale, key + suffix) ?? resolveKey(locale, key);
    return interpolate(value ?? key, { ...vars, n: String(count), count: String(count) });
  };

  return (
    <I18nContext.Provider value={{ locale, t, tp }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
