import { ARMORS, getArmor } from "@/data/archive";
import type { Armor } from "@/data/archive";

/**
 * Resolve a `/armors/[slug]` path segment.
 *
 * - exact id             → ok
 * - case/whitespace diff → redirect to the canonical lowercase id
 * - roman-numeral alias  → redirect (e.g. "mark-50" → "mark-l", "mark-xliv" ← "hulkbuster")
 * - anything else        → not-found
 */
export type SlugResolution =
  | { status: "ok"; armor: Armor }
  | { status: "redirect"; canonical: string; armor: Armor }
  | { status: "not-found"; slug: string };

/** Canonical slugs for static generation. */
export const ARMOR_SLUGS: string[] = ARMORS.map((a) => a.id);

const MAX_SLUG_LENGTH = 64;

/** Lowercase, trim, collapse separators ("Mark_I " → "mark-i"). */
export function normalizeSlug(raw: string): string {
  let s: string;
  try {
    s = decodeURIComponent(raw);
  } catch {
    s = raw;
  }
  return s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

/** Alternate spellings that should land on a canonical record. */
function aliasLookup(normalized: string): Armor | undefined {
  // "mark-50" / "mark50" / "mk-50" / "mk-l" → by Mark number or numeral
  const m = normalized.match(/^(?:mark|mk)-?([a-z0-9]+)$/);
  if (m) {
    const token = m[1];
    const byNumber = Number.parseInt(token, 10);
    if (!Number.isNaN(byNumber) && String(byNumber) === token) {
      const hit = ARMORS.find((a) => a.markNumber === byNumber);
      if (hit) return hit;
    }
    const hit = ARMORS.find((a) => a.id === `mark-${token}`);
    if (hit) return hit;
  }
  // alias words, e.g. "hulkbuster"
  return ARMORS.find(
    (a) => a.alias !== null && normalizeSlug(a.alias) === normalized,
  );
}

export function resolveArmorSlug(raw: string | undefined): SlugResolution {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) {
    return { status: "not-found", slug: String(raw ?? "") };
  }

  const exact = getArmor(raw);
  if (exact) return { status: "ok", armor: exact };

  const normalized = normalizeSlug(raw);
  if (!normalized) return { status: "not-found", slug: raw };

  const canonical = getArmor(normalized) ?? aliasLookup(normalized);
  if (canonical) {
    return { status: "redirect", canonical: canonical.id, armor: canonical };
  }
  return { status: "not-found", slug: raw };
}
