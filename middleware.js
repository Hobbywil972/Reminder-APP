import { NextResponse } from 'next/server';

export function middleware(req) {
  // Middleware pour la protection des routes (authentification)
  // A compléter plus tard
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/commercial/:path*', '/api/:path*'],
};
