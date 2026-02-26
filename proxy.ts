import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const adminSlug = process.env.ADMIN_SLUG;

  // Si ADMIN_SLUG est configuré (après redémarrage)
  if (adminSlug) {
    // /back-XXXXX → rewrite transparent vers /back
    if (pathname === `/${adminSlug}` || pathname.startsWith(`/${adminSlug}/`)) {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = pathname.replace(`/${adminSlug}`, '/back');
      return NextResponse.rewrite(rewriteUrl);
    }

    // Bloquer l'accès direct à /back si le slug est configuré
    if (pathname === '/back' || pathname.startsWith('/back/')) {
      return new NextResponse(null, { status: 404 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|uploads|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)).*)',
  ],
};
