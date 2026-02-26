'use client';

import { useEffect, useState } from 'react';

export function AdminBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/auth/check')
      .then((r) => r.json())
      .then((data) => setVisible(data.valid === true))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-xs bg-neutral-900 text-neutral-200 z-50">
      <span className="font-semibold tracking-wide uppercase opacity-60">Administration</span>
      <div className="flex items-center gap-3">
        <a
          href="/back"
          className="underline underline-offset-2 hover:text-white transition-colors"
        >
          Back office
        </a>
        <span className="opacity-30">|</span>
        <button
          onClick={handleLogout}
          className="underline underline-offset-2 hover:text-white transition-colors cursor-pointer"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );
}
