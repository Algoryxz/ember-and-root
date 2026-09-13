import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { url, anonKey, isConfigured } = getSupabaseEnv();

  const pathname = request.nextUrl.pathname;

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isProtectedRoute =
    pathname.startsWith('/hearth') ||
    pathname.startsWith('/root') ||
    pathname.startsWith('/satchel') ||
    pathname.startsWith('/chronicle') ||
    pathname.startsWith('/journal') ||
    pathname.startsWith('/calendar') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboard');

  // If Supabase is not configured (e.g., in local dev/preview before env setup):
  // Never permit unauthenticated bypass of protected routes in production!
  if (!isConfigured) {
    if (process.env.NODE_ENV === 'production' && isProtectedRoute) {
      return new NextResponse('Authentication Service Unavailable', { status: 503 });
    }
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated user trying to access protected route
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    if (pathname !== '/hearth') {
      redirectUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // Authenticated user trying to access login/signup
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/hearth', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};