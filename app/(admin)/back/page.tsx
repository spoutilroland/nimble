import { detectLang } from '@/lib/i18n/server';
import { loadLocale } from '@/lib/i18n';
import { readSetupConfig } from '@/lib/data/setup';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function BackPage() {
  const setup = await readSetupConfig();
  const lang = await detectLang();
  const locale = loadLocale(lang);

  return <AdminShell locale={locale} adminSlug={setup.adminSlug} />;
}
