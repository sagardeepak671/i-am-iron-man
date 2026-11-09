import { notFound } from "next/navigation";

/**
 * Static 404 target. `src/proxy.ts` rewrites requests whose path cannot be
 * percent-decoded here, because rewriting them to the dynamic `[slug]` route
 * would make Next.js try (and fail) to decode the original path as a param.
 * Visiting `/armors/404` directly simply shows the armors not-found page.
 */
export default function InvalidArmorPath() {
  notFound();
}
