import { getSession } from '@/lib/auth/session';
import { getAdminSlug } from '@/lib/data/setup';
import { LogoutButton } from './LogoutButton';

export async function AdminBar() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-neutral-900 text-neutral-200 z-50">
      <span className="font-semibold tracking-wide uppercase opacity-60">Administration</span>
      <div className="flex items-center gap-3">
        <a
          href={`/${getAdminSlug()}`}
          className="text-neutral-200 underline underline-offset-2 hover:text-white transition-colors"
        >
          Back office
        </a>
        <span className="opacity-30">|</span>
        <LogoutButton />
      </div>
    </div>
  );
}
