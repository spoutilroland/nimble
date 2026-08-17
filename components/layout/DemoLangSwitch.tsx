'use client';

import { useState, useEffect } from 'react';

// Inline SVG flags (16×12) — lightweight, no external deps
function FlagFR({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" className={className} width="16" height="12" aria-hidden="true">
      <rect width="5.33" height="12" fill="#002395" />
      <rect x="5.33" width="5.34" height="12" fill="#fff" />
      <rect x="10.67" width="5.33" height="12" fill="#ED2939" />
    </svg>
  );
}

function FlagEN({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 12" className={className} width="16" height="12" aria-hidden="true">
      <rect width="16" height="12" fill="#012169" />
      <path d="M0 0L16 12M16 0L0 12" stroke="#fff" strokeWidth="2" />
      <path d="M0 0L16 12M16 0L0 12" stroke="#C8102E" strokeWidth="1" />
      <path d="M8 0V12M0 6H16" stroke="#fff" strokeWidth="3.5" />
      <path d="M8 0V12M0 6H16" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}

export function DemoLangSwitch() {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    const cookie = document.cookie.match(/(?:^|;\s*)lang=(\w+)/);
    if (cookie) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(cookie[1]);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(document.documentElement.lang || 'fr');
    }
  }, []);

  const handleSwitch = (newLang: string) => {
    if (newLang === lang) return;
    document.cookie = `lang=${newLang}; path=/; max-age=${365 * 24 * 3600}; SameSite=Lax`;
    window.location.reload();
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={() => handleSwitch('fr')}
        className={`rounded-sm overflow-hidden border transition-all duration-200 cursor-pointer ${
          lang === 'fr'
            ? 'border-white/30 opacity-100 shadow-[0_0_6px_rgba(255,255,255,0.15)]'
            : 'border-transparent opacity-40 hover:opacity-70'
        }`}
        title="Français"
      >
        <FlagFR />
      </button>
      <button
        onClick={() => handleSwitch('en')}
        className={`rounded-sm overflow-hidden border transition-all duration-200 cursor-pointer ${
          lang === 'en'
            ? 'border-white/30 opacity-100 shadow-[0_0_6px_rgba(255,255,255,0.15)]'
            : 'border-transparent opacity-40 hover:opacity-70'
        }`}
        title="English"
      >
        <FlagEN />
      </button>
    </div>
  );
}
