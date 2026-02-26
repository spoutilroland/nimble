import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Configuration initiale — Nimble',
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, background: '#f5f5f5', fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
