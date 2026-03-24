import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { isDemoMode } from '@/lib/demo';

type RouteHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    // Mode demo : bypass l'auth (tout le monde est "connecté")
    if (isDemoMode()) {
      return handler(req, ctx);
    }

    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Rafraîchit le cookie à chaque requête pour éviter l'expiration en cours de session
    await session.save();
    return handler(req, ctx);
  };
}

/** Bloque une route en mode demo (retourne 403) */
export function demoBlock(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    if (isDemoMode()) {
      return NextResponse.json(
        { error: 'Désactivé en mode demo' },
        { status: 403 }
      );
    }
    return handler(req, ctx);
  };
}
