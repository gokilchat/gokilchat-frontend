import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('supabase_jwt')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika di halaman login (/) dan sudah login
  if (pathname === '/') {
    if (token) {
      const redirect = request.nextUrl.searchParams.get('redirect') || '/chat';
      return NextResponse.redirect(new URL(redirect, request.url));
    }
  }

  // 2. Jika di halaman chat (/chat) dan belum login, redirect ke / (login)
  if (pathname.startsWith('/chat')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 3. Jika di halaman join (/join/xxx) dan belum login, lempar ke login beserta param redirect
  // KECUALI untuk /join/moderator karena halaman ini punya form login mandiri (khusus invite staff)
  if (pathname.startsWith('/join/') && !pathname.startsWith('/join/moderator')) {
    if (!token) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', request.url.replace(request.nextUrl.origin, '')); // preserve full url including ?token=
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Jika di halaman admin (/admin) dan belum login, redirect ke login
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/chat/:path*', '/join/:path*', '/admin/:path*'],
};
