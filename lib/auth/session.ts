import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/types';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'your-secret-key-change-in-production-32-chars-min',
  cookieName: 'sid',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600, // 1 heure
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
