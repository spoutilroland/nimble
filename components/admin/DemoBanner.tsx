'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RotateCcw, Radio, ExternalLink } from 'lucide-react';
import { resetTourCookie } from '@/lib/tour/config';

interface DemoBannerProps {
  text: string;
}

export function DemoBanner({ text }: DemoBannerProps) {
  const [resetting, setResetting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/demo/heartbeat', { method: 'POST' }).catch(() => {});
    }, 5 * 60_000);
    fetch('/api/demo/heartbeat', { method: 'POST' }).catch(() => {});
    return () => clearInterval(interval);
  }, []);

  const handleReset = useCallback(async () => {
    if (resetting) return;
    setResetting(true);
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) {
        resetTourCookie();
        document.cookie = 'nimble-site-welcome-done=; path=/; max-age=0';
        window.location.reload();
      }
    } finally {
      setResetting(false);
    }
  }, [resetting]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden shrink-0 z-50 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0 -translate-y-2'}`}
    >
      {/* Fond gradient animé */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(270deg, #0e1018, #111827, #0e1018, #111827)',
          backgroundSize: '600% 100%',
          animation: 'demo-bg-shift 12s ease infinite',
        }}
      />

      {/* Ligne accent animée en bas */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #34d399, #818cf8, #f472b6, #34d399, transparent)',
          backgroundSize: '200% 100%',
          animation: 'demo-line-slide 4s linear infinite',
        }}
      />

      {/* Glow ambiant */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[2px] blur-[12px]"
        style={{
          background: 'linear-gradient(90deg, transparent, #34d399, transparent)',
          animation: 'demo-glow-breathe 3s ease-in-out infinite',
        }}
      />

      {/* Contenu */}
      <div className="relative flex items-center justify-center gap-3 px-4 py-2.5">
        {/* Badge DEMO */}
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-[2px]"
          style={{
            background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(99,102,241,0.1))',
            border: '1px solid rgba(52,211,153,0.25)',
            color: '#34d399',
            boxShadow: '0 0 12px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <Radio size={10} style={{ animation: 'demo-radio-pulse 1.5s ease-in-out infinite' }} />
          Demo
        </span>

        {/* Texte */}
        <span className="text-[0.78rem] text-[#9ca3af] font-medium tracking-wide">
          {text || 'Tout est réinitialisé après 30 min d\'inactivité'}
        </span>

        <span className="w-px h-3.5 bg-white/[0.06]" />

        {/* Lien site */}
        <a
          href="/"
          className="group inline-flex items-center gap-1 text-[0.72rem] text-[#9ca3af] font-medium no-underline hover:text-white transition-all duration-300"
        >
          Voir le site
          <ExternalLink size={10} className="opacity-40 group-hover:opacity-80 transition-all duration-300 group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" />
        </a>

        <span className="w-px h-3.5 bg-white/[0.06]" />

        {/* Bouton reset avec ripple */}
        <button
          className="group relative inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg text-[0.72rem] font-semibold transition-all duration-300 disabled:opacity-30 overflow-hidden bg-white/[0.04] border border-white/[0.06] text-[#9ca3af] hover:bg-white/[0.08] hover:text-white hover:border-white/[0.12] hover:shadow-[0_0_16px_rgba(255,255,255,0.04)]"
          onClick={handleReset}
          disabled={resetting}
        >
          <RotateCcw
            size={11}
            className={`transition-transform duration-500 ${resetting ? 'animate-spin' : 'group-hover:rotate-[-30deg]'}`}
          />
          {resetting ? 'Reset...' : 'Reset demo'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes demo-bg-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes demo-line-slide {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes demo-glow-breathe {
          0%, 100% { opacity: 0.3; transform: translateX(-50%) scaleX(1); }
          50% { opacity: 0.7; transform: translateX(-50%) scaleX(1.5); }
        }
        @keyframes demo-radio-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
      ` }} />
    </div>
  );
}
