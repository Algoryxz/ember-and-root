import { describe, it, expect } from 'vitest';

/**
 * Route Protection Rules Specification Test
 *
 * Verifies that all protected routes are correctly identified and guarded
 * against unauthenticated access.
 */

const PROTECTED_ROUTES = [
  '/hearth',
  '/root',
  '/satchel',
  '/chronicle',
  '/settings',
  '/onboard',
];

const PUBLIC_AUTH_ROUTES = [
  '/',
  '/login',
  '/signup',
];

function isRouteProtected(pathname: string): boolean {
  return (
    pathname.startsWith('/hearth') ||
    pathname.startsWith('/root') ||
    pathname.startsWith('/satchel') ||
    pathname.startsWith('/chronicle') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboard')
  );
}

function isAuthEntryRoute(pathname: string): boolean {
  return pathname.startsWith('/login') || pathname.startsWith('/signup');
}

function resolveRedirectForUnauthenticated(pathname: string): string {
  if (isRouteProtected(pathname)) {
    if (pathname === '/hearth') {
      return '/login';
    }
    return `/login?next=${encodeURIComponent(pathname)}`;
  }
  return pathname;
}

describe('App Shell & Route Protection Boundaries', () => {
  it('protects all 5 game routes plus onboarding from unauthenticated access', () => {
    PROTECTED_ROUTES.forEach((route) => {
      expect(isRouteProtected(route)).toBe(true);
    });
  });

  it('allows public access to landing, login, and signup routes', () => {
    PUBLIC_AUTH_ROUTES.forEach((route) => {
      expect(isRouteProtected(route)).toBe(false);
    });
  });

  it('generates correct redirect URL with next parameter for deep links', () => {
    expect(resolveRedirectForUnauthenticated('/hearth')).toBe('/login');
    expect(resolveRedirectForUnauthenticated('/root')).toBe('/login?next=%2Froot');
    expect(resolveRedirectForUnauthenticated('/satchel')).toBe('/login?next=%2Fsatchel');
    expect(resolveRedirectForUnauthenticated('/chronicle')).toBe('/login?next=%2Fchronicle');
    expect(resolveRedirectForUnauthenticated('/settings')).toBe('/login?next=%2Fsettings');
    expect(resolveRedirectForUnauthenticated('/onboard')).toBe('/login?next=%2Fonboard');
  });

  it('identifies auth routes for authenticated redirect handling', () => {
    expect(isAuthEntryRoute('/login')).toBe(true);
    expect(isAuthEntryRoute('/signup')).toBe(true);
    expect(isAuthEntryRoute('/hearth')).toBe(false);
    expect(isAuthEntryRoute('/')).toBe(false);
  });
});
