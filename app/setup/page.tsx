import { redirect } from 'next/navigation';
import { readSetupConfig } from '@/lib/data/setup';
import { SetupWizard } from '@/components/setup/SetupWizard';

export default function SetupPage() {
  const setup = readSetupConfig();

  // Déjà configuré → redirige vers le backoffice
  if (setup.setupDone) {
    redirect('/back');
  }

  return <SetupWizard />;
}
