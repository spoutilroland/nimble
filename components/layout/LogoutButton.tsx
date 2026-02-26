'use client';

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      className="text-neutral-200 underline underline-offset-2 hover:text-white transition-colors cursor-pointer"
    >
      Déconnexion
    </button>
  );
}
