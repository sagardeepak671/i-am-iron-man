import { notFound } from "next/navigation";

/** Static 404 target for `src/proxy.ts` (see `src/app/armors/404/page.tsx`). */
export default function InvalidTechnologyPath() {
  notFound();
}
