/**
 * Pure predicate for whether a request path can be served without a session.
 *
 * Static assets (favicons, images, the PWA manifest, etc.) are excluded from
 * the middleware matcher in `src/middleware.ts`, so this function only needs to
 * speak for the dynamic routes that reach middleware.
 */
export function isPublicRoute(pathname: string): boolean {
  if (pathname === "/login" || pathname.startsWith("/login/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}