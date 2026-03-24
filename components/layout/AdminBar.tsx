import { getSession } from '@/lib/auth/session';
import { getAdminSlug } from '@/lib/data/setup';
import { isDemoMode, readDemoConfig } from '@/lib/demo';
import { LogoutButton } from './LogoutButton';

export async function AdminBar() {
  const demo = isDemoMode();

  if (!demo) {
    const session = await getSession();
    if (!session.isLoggedIn) return null;
  }

  if (demo) {
    const config = readDemoConfig();
    return (
      <div className="relative overflow-hidden z-50">
        {/* Fond gradient animé */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(270deg, #0a0c10, #0e1018, #111827, #0e1018)',
            backgroundSize: '400% 100%',
            animation: 'site-banner-bg 10s ease infinite',
          }}
        />

        {/* Ligne accent animée en bas */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, #34d399, #818cf8, #34d399, transparent)',
            backgroundSize: '200% 100%',
            animation: 'site-banner-line 4s linear infinite',
          }}
        />

        {/* Glow subtil */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #34d399 0%, transparent 70%)',
          }}
        />

        {/* Contenu */}
        <div className="relative flex items-center justify-center gap-3 px-4 py-2">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-[1.5px]"
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(99,102,241,0.08))',
              border: '1px solid rgba(52,211,153,0.2)',
              color: '#34d399',
              boxShadow: '0 0 8px rgba(52,211,153,0.1)',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" style={{ animation: 'site-dot-pulse 1.5s ease-in-out infinite' }}>
              <circle cx="4" cy="4" r="3" fill="currentColor" opacity="0.4" />
              <circle cx="4" cy="4" r="1.5" fill="currentColor" />
            </svg>
            Demo
          </span>

          <span className="text-[0.72rem] text-[#6b7280] font-medium">
            {config.bannerText}
          </span>

          <span className="w-px h-3 bg-white/[0.06]" />

          <a
            href={`/${getAdminSlug()}`}
            className="inline-flex items-center gap-1 text-[0.72rem] font-semibold no-underline transition-colors duration-200"
            data-tour="back-office-link"
            style={{ color: 'rgba(52,211,153,0.8)' }}
          >
            Back office
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M7 17L17 7M17 7H7M17 7v10" />
            </svg>
          </a>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes site-banner-bg {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes site-banner-line {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          @keyframes site-dot-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.4); opacity: 0.5; }
          }
        ` }} />
      </div>
    );
  }

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
