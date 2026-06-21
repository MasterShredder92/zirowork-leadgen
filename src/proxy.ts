import { NextResponse } from 'next/server';

// Route matcher: operator paths (everything that isn't a public surface or static asset).
// Auth enforcement goes here when @supabase/ssr is added as a tracked change.
// Current: pass-through — routing structure is established, gate deferred to auth PR.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all operator SPA paths; exclude public surfaces, API routes, and Next.js internals.
    '/((?!schools|dashboard|onboard|privacy|terms|api|_next/static|_next/image|favicon\\.ico|96-public).*)',
  ],
};
