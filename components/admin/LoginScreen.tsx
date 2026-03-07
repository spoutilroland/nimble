'use client';

import { useState, type FormEvent } from 'react';
import { useI18n } from '@/lib/i18n/context';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin();
      } else {
        setError(data.error || t('auth.loginFailed'));
      }
    } catch {
      setError(t('auth.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="login-screen flex items-center justify-center min-h-screen relative overflow-hidden">
      <div className="login-box bg-[var(--bo-surface)] border border-[var(--bo-border)] rounded-3xl px-12 pt-12 pb-10 w-full max-w-[400px] relative z-[1] shadow-[0_24px_64px_rgba(0,0,0,0.5),var(--bo-green-glow)] animate-[fadeInUp_0.5s_ease-out_forwards]">
        <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[1.6rem] font-extrabold uppercase tracking-[5px] text-[var(--bo-text)] mb-[0.4rem] text-center">{t('login.title')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="username" className="block font-bold text-[0.72rem] uppercase tracking-[2px] text-[var(--bo-text-dim)] mb-[0.6rem]">{t('login.username')}</label>
            <input
              type="text"
              id="username"
              name="username"
              required
              autoFocus
              className="w-full py-[0.85rem] px-4 bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[10px] text-[var(--bo-text)] font-['Inter',sans-serif] text-[0.95rem] transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-[var(--bo-green)] focus:shadow-[0_0_0_2px_rgba(74,124,89,0.15)] placeholder:text-[var(--bo-text-dim)]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block font-bold text-[0.72rem] uppercase tracking-[2px] text-[var(--bo-text-dim)] mb-[0.6rem]">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full py-[0.85rem] px-4 bg-[var(--bo-bg)] border border-[var(--bo-border)] rounded-[10px] text-[var(--bo-text)] font-['Inter',sans-serif] text-[0.95rem] transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-[var(--bo-green)] focus:shadow-[0_0_0_2px_rgba(74,124,89,0.15)] placeholder:text-[var(--bo-text-dim)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-block w-full mt-2 bg-[var(--bo-green)] text-[#0b0d12] font-['Plus_Jakarta_Sans',sans-serif] text-[0.9rem] font-bold tracking-[2px] uppercase py-4 border-none rounded-xl cursor-pointer transition-[background,box-shadow] duration-200 hover:bg-[var(--primary-light)] hover:shadow-[var(--bo-green-glow)]"
            disabled={loading}
          >
            {t('login.submit')}
          </button>
          {error && (
            <div className="mt-4 py-[0.7rem] px-4 bg-[rgba(229,57,53,0.1)] border-l-[3px] border-l-[#e53935] text-[#ef9a9a] text-[0.85rem] font-semibold">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
}
