/**
 * Source URL reachability check (needs network access).
 *
 *   npm run verify:sources
 *
 * Performs a GET on every source URL and prints the HTTP status. It does NOT
 * modify data: after confirming a page actually supports the cited facts,
 * set `accessDate` and `verification.status: "verified"` by hand in
 * src/data/archive/sources.ts.
 */
import { SOURCES } from "@/data/archive";

const TIMEOUT_MS = 15_000;

async function probe(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "mcu-archive-source-check/1.0" },
    });
    return `${res.status} ${res.statusText}`.trim() + (res.url !== url ? ` → ${res.url}` : "");
  } catch (err) {
    return `UNREACHABLE (${err instanceof Error ? err.message : String(err)})`;
  } finally {
    clearTimeout(timer);
  }
}

let failures = 0;
for (const source of SOURCES) {
  const result = await probe(source.url);
  const ok = /^2\d\d/.test(result);
  if (!ok) failures++;
  const state = source.verification.status === "verified" ? "verified" : "UNVERIFIED";
  console.log(`${ok ? "✓" : "✗"} ${source.id} [${state}]\n    ${source.url}\n    ${result}`);
}

console.log(
  `\n${SOURCES.length - failures}/${SOURCES.length} URLs reachable. ` +
    "Reachability is not content verification: open each page before marking it verified.",
);
process.exit(failures > 0 ? 1 : 0);
