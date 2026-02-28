import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';

type RouteHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAuth(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Rafraîchit le cookie à chaque requête pour éviter l'expiration en cours de session
    await session.save();
    return handler(req, ctx);
  };
}
