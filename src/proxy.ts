import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('supabase_jwt')?.value;
  const { pathname } = request.nextUrl;

  // 1. Jika di halaman login (/) dan sudah login, redirect ke /chat
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  }

  // 2. Jika di halaman chat (/chat) dan belum login, redirect ke / (login)
  if (pathname.startsWith('/chat')) {
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/chat/:path*'],
};
