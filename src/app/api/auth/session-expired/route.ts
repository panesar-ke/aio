import { type NextRequest, NextResponse } from 'next/server';

/**
 * Clears a session cookie that no longer maps to a live session row, then
 * sends the user to sign in again.
 *
 * The proxy authenticates on the signed JWT alone — it has no database access,
 * and the Next.js docs are explicit that proxy "should not be used as a full
 * session management or authorization solution". A revoked cookie therefore
 * still reads as a session there, so the proxy bounces /login back to
 * /dashboard, which fails authentication and redirects to /login again.
 * Dropping the cookie here breaks that loop.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.nextUrl));

  response.cookies.delete('session');

  return response;
}
