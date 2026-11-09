import { resolveArmorSlug } from "./armor-slug";

/**
 * Armor comparison selection: 2–3 distinct, valid armor ids, kept in the URL
 * as `/compare?ids=mark-i,mark-l[&diff=1]`.
 *
 * Pure functions; used by the server page, the client tray, and tests.
 */

export const MIN_COMPARE = 2;
export const MAX_COMPARE = 3;

export type SelectionResult = {
  ids: string[];
  /** Why an add was refused, if it was. */
  rejected?: "duplicate" | "limit" | "invalid";
};

/** Canonical id for a raw token, or `null` if it is not an archived armor. */
export function canonicalArmorId(raw: string): string | null {
  const r = resolveArmorSlug(raw.trim());
  return r.status === "not-found" ? null : r.armor.id;
}

export function addToSelection(ids: readonly string[], raw: string): SelectionResult {
  const id = canonicalArmorId(raw);
  if (!id) return { ids: [...ids], rejected: "invalid" };
  if (ids.includes(id)) return { ids: [...ids], rejected: "duplicate" };
  if (ids.length >= MAX_COMPARE) return { ids: [...ids], rejected: "limit" };
  return { ids: [...ids, id] };
}

export function removeFromSelection(ids: readonly string[], raw: string): string[] {
  const id = canonicalArmorId(raw) ?? raw;
  return ids.filter((x) => x !== id);
}

export function toggleSelection(ids: readonly string[], raw: string): SelectionResult {
  const id = canonicalArmorId(raw);
  if (id && ids.includes(id)) return { ids: removeFromSelection(ids, id) };
  return addToSelection(ids, raw);
}

export const isFull = (ids: readonly string[]) => ids.length >= MAX_COMPARE;
export const canCompare = (ids: readonly string[]) => ids.length >= MIN_COMPARE;

/* ---------------------------------------------------------------------------
 * URL state
 * ------------------------------------------------------------------------- */

export type CompareQuery = {
  /** Valid, distinct, canonical ids in the order given (max 3). */
  ids: string[];
  /** Whether "show differences only" is on. */
  diff: boolean;
  /** Tokens that were not archived armors. */
  invalid: string[];
  /** Canonical ids that appeared more than once (reported once each). */
  duplicates: string[];
  /** Valid ids beyond the limit, dropped. */
  overflow: string[];
};

export type RawCompareParams = Record<string, string | string[] | undefined>;

const TRUTHY = new Set(["1", "true", "yes", "on"]);

/** Split `ids=a,b` / `ids=a&ids=b` / `ids=a b` into raw tokens. */
function tokens(value: string | string[] | undefined): string[] {
  const list = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return list
    .flatMap((v) => v.split(/[,\s|+]+/))
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 50); // hard cap on hostile input
}

export function parseCompareQuery(raw: RawCompareParams | URLSearchParams): CompareQuery {
  const get = (key: string): string | string[] | undefined =>
    raw instanceof URLSearchParams ? raw.getAll(key) : raw[key];

  const ids: string[] = [];
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const overflow: string[] = [];

  // `add` is what the no-JS "Add armor" form submits; it simply appends.
  for (const token of [...tokens(get("ids")), ...tokens(get("add"))]) {
    const id = canonicalArmorId(token);
    if (!id) {
      if (!invalid.includes(token)) invalid.push(token);
      continue;
    }
    if (ids.includes(id) || overflow.includes(id)) {
      if (!duplicates.includes(id)) duplicates.push(id);
      continue;
    }
    if (ids.length >= MAX_COMPARE) {
      overflow.push(id);
      continue;
    }
    ids.push(id);
  }

  const diffRaw = get("diff");
  const diffValue = Array.isArray(diffRaw) ? diffRaw[0] : diffRaw;
  const diff = typeof diffValue === "string" && TRUTHY.has(diffValue.toLowerCase());

  return { ids, diff, invalid, duplicates, overflow };
}

/** Build a canonical `/compare` search string (no `?` when empty). */
export function serializeCompareQuery(query: { ids: readonly string[]; diff?: boolean }): string {
  const params = new URLSearchParams();
  const ids = [...new Set(query.ids)].slice(0, MAX_COMPARE);
  if (ids.length > 0) params.set("ids", ids.join(","));
  if (query.diff) params.set("diff", "1");
  const s = params.toString();
  // Keep commas readable in the address bar.
  return s ? `?${s.replace(/%2C/gi, ",")}` : "";
}

export const compareHref = (ids: readonly string[], diff = false): string =>
  `/compare${serializeCompareQuery({ ids, diff })}`;

/** Guidance state for the page: what to render when not enough armors. */
export type CompareReadiness =
  | { status: "ready"; ids: string[] }
  | { status: "needs-more"; ids: string[]; missing: number };

export function compareReadiness(ids: readonly string[]): CompareReadiness {
  if (ids.length >= MIN_COMPARE) return { status: "ready", ids: [...ids] };
  return { status: "needs-more", ids: [...ids], missing: MIN_COMPARE - ids.length };
}
