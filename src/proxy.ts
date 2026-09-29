import { NextResponse, type NextRequest } from "next/server";

/*
 * Runs before every matched request. It only does cheap, optimistic work:
 * - tags the request with an id that flows into logs and audit entries,
 * - bounces visitors without a session cookie away from private pages.
 *
 * The session itself is validated against the database in the server layer. A cookie
 * being present here proves nothing, it just saves a render for obvious anonymous hits.
 */

const SESSION_COOKIE_NAME = "operiq_session";

const PROTECTED_PREFIXES = ["/w/", "/dashboard", "/onboarding", "/verify-email"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);

  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // Signed-in visitors are sent away from /login and /register by those pages themselves,
  // after the session is checked against the database. Doing it here on the cookie alone
  // would loop forever on a revoked session.

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("x-request-id", requestId);

  // Private pages should never end up in a search index, even if a link leaks.
  if (isProtected || pathname.startsWith("/invite")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|opengraph-image|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
