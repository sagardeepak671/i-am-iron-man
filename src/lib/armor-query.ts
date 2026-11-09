import type { Armor, Film } from "@/data/archive";

/**
 * Search / filter / sort state for `/armors`, kept entirely in the URL.
 *
 *   /armors?q=hulk&film=avengers-age-of-ultron-2015&sort=name
 *
 * Everything here is pure so it can run on the server (page render), in the
 * client controls, and in tests. Invalid values degrade to defaults rather
 * than throwing, so a hand-edited or stale URL can never break the page.
 */

export const SORT_OPTIONS = [
  { value: "release", label: "Release order" },
  { value: "release-desc", label: "Release order, newest first" },
  { value: "name", label: "Name, A–Z" },
  { value: "name-desc", label: "Name, Z–A" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const DEFAULT_SORT: SortKey = "release";
export const MAX_QUERY_LENGTH = 80;

export type ArmorQuery = {
  /** Trimmed search text; empty string means "no search". */
  q: string;
  /** First-appearance film id, or `null` for all films. */
  film: string | null;
  sort: SortKey;
};

export const DEFAULT_QUERY: ArmorQuery = { q: "", film: null, sort: DEFAULT_SORT };

/** Shape Next.js hands to a page's `searchParams`. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

const isSortKey = (value: string): value is SortKey =>
  SORT_OPTIONS.some((o) => o.value === value);

const first = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

/**
 * Parse raw URL params into a valid query. Unknown keys are ignored, bad
 * values fall back to defaults, and the film id is only accepted if it names
 * a film in the archive.
 */
export function parseArmorQuery(
  raw: RawSearchParams | URLSearchParams,
  films: Pick<Film, "id">[],
): ArmorQuery {
  const get = (key: string) =>
    raw instanceof URLSearchParams ? (raw.get(key) ?? undefined) : first(raw[key]);

  const q = (get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);

  const filmRaw = get("film");
  const film =
    filmRaw && films.some((f) => f.id === filmRaw) ? filmRaw : null;

  const sortRaw = get("sort");
  const sort = sortRaw && isSortKey(sortRaw) ? sortRaw : DEFAULT_SORT;

  return { q, film, sort };
}

/**
 * Serialize a query to a search string ("" or "?q=…&film=…&sort=…").
 * Defaults are omitted so the canonical URL for "no filters" is just `/armors`.
 * Key order is fixed so equal states always produce equal URLs.
 */
export function serializeArmorQuery(query: Partial<ArmorQuery>): string {
  const params = new URLSearchParams();
  const q = (query.q ?? "").trim();
  if (q) params.set("q", q);
  if (query.film) params.set("film", query.film);
  if (query.sort && query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export const isDefaultQuery = (query: ArmorQuery): boolean =>
  query.q === "" && query.film === null && query.sort === DEFAULT_SORT;

/** Case-insensitive, accent-insensitive "contains" on a few searchable fields. */
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function armorMatchesSearch(
  armor: Armor,
  q: string,
  filmsById: Map<string, Film>,
): boolean {
  const needle = normalize(q);
  if (!needle) return true;
  const haystack = [
    armor.designation,
    armor.alias ?? "",
    String(armor.markNumber),
    armor.summary,
    filmsById.get(armor.firstAppearanceFilmId)?.title ?? "",
  ]
    .map(normalize)
    .join(" \u0000 ");
  return haystack.includes(needle);
}

const releaseKey = (armor: Armor, filmsById: Map<string, Film>) =>
  filmsById.get(armor.firstAppearanceFilmId)?.releaseYear ?? Number.MAX_SAFE_INTEGER;

export function sortArmors(
  armors: Armor[],
  sort: SortKey,
  filmsById: Map<string, Film>,
): Armor[] {
  const byRelease = (a: Armor, b: Armor) =>
    releaseKey(a, filmsById) - releaseKey(b, filmsById) || a.markNumber - b.markNumber;
  const byName = (a: Armor, b: Armor) =>
    a.designation.localeCompare(b.designation, "en", { sensitivity: "base" }) ||
    a.markNumber - b.markNumber;

  const sorted = [...armors];
  switch (sort) {
    case "release":
      return sorted.sort(byRelease);
    case "release-desc":
      return sorted.sort((a, b) => byRelease(b, a));
    case "name":
      return sorted.sort(byName);
    case "name-desc":
      return sorted.sort((a, b) => byName(b, a));
  }
}

/** Search, filter, and sort together. */
export function applyArmorQuery(
  armors: Armor[],
  query: ArmorQuery,
  films: Film[],
): Armor[] {
  const filmsById = new Map(films.map((f) => [f.id, f]));
  const filtered = armors.filter(
    (a) =>
      (query.film === null || a.firstAppearanceFilmId === query.film) &&
      armorMatchesSearch(a, query.q, filmsById),
  );
  return sortArmors(filtered, query.sort, filmsById);
}

/** Films that are the first appearance of at least one armor, in release order. */
export function filmFilterOptions(armors: Armor[], films: Film[]): Film[] {
  const used = new Set(armors.map((a) => a.firstAppearanceFilmId));
  return [...films]
    .filter((f) => used.has(f.id))
    .sort((a, b) => a.releaseYear - b.releaseYear);
}
