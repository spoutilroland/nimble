import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData } from '@/lib/types';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'your-secret-key-change-in-production-32-chars-min',
  cookieName: 'sid',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 60 * 60 * 8, // 8 heures
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
