import { NextResponse, type NextRequest } from "next/server";

/**
 * Request guard for `/armors/*` and `/technology/*`.
 *
 * Next.js decodes dynamic segments with `decodeURIComponent` before a page
 * runs, so a malformed escape sequence such as `/armors/%E0%A4%A` would
 * otherwise surface as a 500. Those requests are rewritten to the static
 * `/armors/404` route, which renders the armors not-found page with a 404.
 *
 * Everything else passes straight through; slug normalisation, redirects, and
 * unknown-slug 404s are handled by `resolveArmorSlug` in the page itself.
 */
export function proxy(request: NextRequest) {
  const rawPath = request.url.replace(/^[a-z]+:\/\/[^/]+/i, "").split("?")[0];
  try {
    decodeURIComponent(rawPath);
  } catch {
    const section = rawPath.startsWith("/technology") ? "technology" : "armors";
    return NextResponse.rewrite(new URL(`/${section}/404`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/armors/:slug*", "/technology/:slug*"],
};
