import { redirect } from 'next/navigation';

// Setup wizard désactivé — redirection directe vers le back office
export default function SetupPage() {
  redirect('/back');
}
