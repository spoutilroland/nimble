import { redirect } from 'next/navigation';
import { detectLang } from '@/lib/i18n/server';
import { loadLocale } from '@/lib/i18n';
import { readSetupConfig } from '@/lib/data/setup';
import { AdminShell } from '@/components/admin/AdminShell';

export default async function BackPage() {
  const setup = readSetupConfig();

  // Pas encore configuré → wizard
  if (!setup.setupDone) {
    redirect('/setup');
  }

  const lang = await detectLang();
  const locale = loadLocale(lang);

  // Setup terminé mais ADMIN_SLUG pas encore en env (pas de redémarrage)
  const needsRestart = setup.setupDone && !process.env.ADMIN_SLUG;

  return <AdminShell locale={locale} needsRestart={needsRestart} adminSlug={setup.adminSlug} />;
}
