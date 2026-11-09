import { ARMORS } from "./armors";
import { FILMS, SOURCES } from "./sources";
import { SUIT_PARTS } from "./suit-parts";
import { TECHNOLOGIES } from "./technologies";
import type {
  ArchiveData,
  Armor,
  Fact,
  Film,
  Source,
  SuitPart,
  Technology,
} from "./types";

export * from "./types";
export { ARMORS, FILMS, SOURCES, SUIT_PARTS, TECHNOLOGIES };

export const ARCHIVE: ArchiveData = {
  scope:
    "Marvel Cinematic Universe feature films only, from Iron Man (2008) through Avengers: Endgame (2019). Comics, games, television, and tie-in media are out of scope. Values the films never state are recorded as unknown.",
  lastReviewed: "2026-10-28",
  films: FILMS,
  sources: SOURCES,
  armors: ARMORS,
  technologies: TECHNOLOGIES,
  suitParts: SUIT_PARTS,
};

/* ---------------------------------------------------------------------------
 * Lookup helpers (pure; safe to use in server components).
 * ------------------------------------------------------------------------- */

const byId = <T extends { id: string }>(items: T[]) =>
  new Map(items.map((item) => [item.id, item] as const));

const filmIndex = byId(FILMS);
const sourceIndex = byId(SOURCES);
const armorIndex = byId(ARMORS);
const technologyIndex = byId(TECHNOLOGIES);
const suitPartIndex = byId(SUIT_PARTS);

export const getFilm = (id: string): Film | undefined => filmIndex.get(id);
export const getSource = (id: string): Source | undefined =>
  sourceIndex.get(id);
export const getArmor = (id: string): Armor | undefined => armorIndex.get(id);
export const getTechnology = (id: string): Technology | undefined =>
  technologyIndex.get(id);
export const getSuitPart = (id: string): SuitPart | undefined =>
  suitPartIndex.get(id);

/** Armors sorted by Mark number. */
export const armorsByMark = (): Armor[] =>
  [...ARMORS].sort((a, b) => a.markNumber - b.markNumber);

/**
 * Stable citation numbering for display: a source's number is its position in
 * the registry (1-based), so `[3]` means the same thing everywhere on the page.
 */
export const sourceNumber = (sourceId: string): number =>
  SOURCES.findIndex((s) => s.id === sourceId) + 1;

/** All fact groups on an armor, in display order. */
export const armorFactGroups = (
  armor: Armor,
): { key: "facts" | "capabilities" | "limitations"; label: string; facts: Fact[] }[] => [
  { key: "facts", label: "Overview", facts: armor.facts },
  { key: "capabilities", label: "Capabilities", facts: armor.capabilities },
  { key: "limitations", label: "Known limitations", facts: armor.limitations },
];

/** Every fact in the archive, with the record it belongs to. */
export const allFacts = (): { owner: string; fact: Fact }[] => [
  ...ARMORS.flatMap((a) => [
    ...armorFactGroups(a).flatMap(({ facts }) =>
      facts.map((fact) => ({ owner: a.id, fact })),
    ),
    { owner: a.id, fact: a.design as Fact },
  ]),
  ...TECHNOLOGIES.flatMap((t) =>
    technologyFactGroups(t).flatMap(({ facts }) =>
      facts.map((fact) => ({ owner: t.id, fact })),
    ),
  ),
];

/** All fact groups on a technology, in display order. */
export const technologyFactGroups = (
  technology: Technology,
): { key: "facts" | "connections" | "limitations"; label: string; facts: Fact[] }[] => [
  { key: "facts", label: "What it does", facts: technology.facts },
  { key: "connections", label: "Connected systems", facts: technology.connections },
  { key: "limitations", label: "Known limitations", facts: technology.limitations },
];

/** Source ids cited anywhere on a technology record, in registry order. */
export const technologySourceIds = (technology: Technology): string[] => {
  const ids = new Set<string>();
  for (const { facts } of technologyFactGroups(technology)) {
    for (const fact of facts) for (const c of fact.citations) ids.add(c.sourceId);
  }
  return SOURCES.map((s) => s.id).filter((id) => ids.has(id));
};

/** Look up a fact anywhere in the archive by id. */
export const getFact = (id: string): Fact | undefined =>
  allFacts().find(({ fact }) => fact.id === id)?.fact;

/** Suit-diagram parts that expose a given technology. */
export const suitPartsForTechnology = (technologyId: string): SuitPart[] =>
  SUIT_PARTS.filter((p) => p.technologyIds.includes(technologyId));

/** Source ids cited anywhere on an armor record (facts, groups, specs, films). */
export const armorSourceIds = (armor: Armor): string[] => {
  const ids = new Set<string>();
  for (const { facts } of armorFactGroups(armor)) {
    for (const fact of facts) for (const c of fact.citations) ids.add(c.sourceId);
  }
  for (const c of armor.design.citations) ids.add(c.sourceId);
  for (const spec of Object.values(armor.specs)) {
    if (spec.status === "stated") for (const c of spec.citations) ids.add(c.sourceId);
  }
  for (const filmId of armor.appearanceFilmIds) {
    const film = getFilm(filmId);
    if (film) ids.add(film.sourceId);
  }
  return SOURCES.map((s) => s.id).filter((id) => ids.has(id));
};

/** Summary counts shown on the archive page. */
export const archiveStats = () => {
  const facts = allFacts();
  const unverified = SOURCES.filter(
    (s) => s.verification.status === "unverified",
  ).length;
  return {
    armors: ARMORS.length,
    technologies: TECHNOLOGIES.length,
    films: FILMS.length,
    sources: SOURCES.length,
    facts: facts.length,
    unverifiedSources: unverified,
  };
};
