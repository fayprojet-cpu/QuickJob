import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Host canonique (le vrai site de production). Surchargeable via
 * NEXT_PUBLIC_CANONICAL_HOST si le domaine change un jour.
 */
const CANONICAL_HOST = process.env.NEXT_PUBLIC_CANONICAL_HOST || 'quick-job.vercel.app';

export default function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';

  // Les anciennes URL de déploiement Vercel (ex. quick-xxxx-fay-tech1.vercel.app) sont
  // renvoyées vers le site canonique, pour toujours atterrir sur la dernière version.
  // La production (host === CANONICAL_HOST) et le dev local (localhost) ne sont jamais
  // redirigés : leur comportement reste identique.
  if (host.endsWith('.vercel.app') && host !== CANONICAL_HOST) {
    const target = new URL(
      request.nextUrl.pathname + request.nextUrl.search,
      `https://${CANONICAL_HOST}`,
    );
    return NextResponse.redirect(target, 307);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
