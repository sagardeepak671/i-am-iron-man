import type { Film, Source } from "./types";

/**
 * Source registry.
 *
 * Every source below was recorded from editorial knowledge in an authoring
 * environment WITHOUT web access, so each one is marked `unverified` and has no
 * access date yet. Run `npm run verify:sources` from a networked machine to
 * confirm each URL resolves, open the page to confirm it supports the cited
 * facts, then set `accessDate` and flip `verification.status` to `verified`.
 */

const UNVERIFIED_NOTE =
  "URL recorded without web access during initial data entry; open the page, confirm it supports the cited facts, then set accessDate and mark verified.";

const unverified = { status: "unverified", note: UNVERIFIED_NOTE } as const;

export const SOURCES: Source[] = [
  // ---------------------------------------------------------------------------
  // Primary production sources: the films. The URL points at Marvel's official
  // film page, which is the stable, browsable landing page for each title.
  // ---------------------------------------------------------------------------
  {
    id: "film-iron-man-2008",
    title: "Iron Man (2008) — feature film",
    publisher: "Marvel Studios; distributed by Paramount Pictures",
    url: "https://www.marvel.com/movies/iron-man",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page.",
  },
  {
    id: "film-iron-man-2-2010",
    title: "Iron Man 2 (2010) — feature film",
    publisher: "Marvel Studios; distributed by Paramount Pictures",
    url: "https://www.marvel.com/movies/iron-man-2",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page.",
  },
  {
    id: "film-the-avengers-2012",
    title: "Marvel's The Avengers (2012) — feature film",
    publisher: "Marvel Studios; distributed by Walt Disney Studios Motion Pictures",
    url: "https://www.marvel.com/movies/marvel-s-the-avengers",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page (slug needs confirming).",
  },
  {
    id: "film-iron-man-3-2013",
    title: "Iron Man 3 (2013) — feature film",
    publisher: "Marvel Studios; distributed by Walt Disney Studios Motion Pictures",
    url: "https://www.marvel.com/movies/iron-man-3",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page.",
  },
  {
    id: "film-avengers-age-of-ultron-2015",
    title: "Avengers: Age of Ultron (2015) — feature film",
    publisher: "Marvel Studios; distributed by Walt Disney Studios Motion Pictures",
    url: "https://www.marvel.com/movies/avengers-age-of-ultron",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page.",
  },
  {
    id: "film-avengers-infinity-war-2018",
    title: "Avengers: Infinity War (2018) — feature film",
    publisher: "Marvel Studios; distributed by Walt Disney Studios Motion Pictures",
    url: "https://www.marvel.com/movies/avengers-infinity-war",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page.",
  },
  {
    id: "film-avengers-endgame-2019",
    title: "Avengers: Endgame (2019) — feature film",
    publisher: "Marvel Studios; distributed by Walt Disney Studios Motion Pictures",
    url: "https://www.marvel.com/movies/avengers-endgame",
    accessDate: null,
    kind: "film",
    verification: unverified,
    note: "Primary source is the film itself. URL is Marvel's official film page.",
  },

  // ---------------------------------------------------------------------------
  // Official Marvel web pages.
  // ---------------------------------------------------------------------------
  {
    id: "marvel-iron-man-on-screen-bio",
    title: "Iron Man (Tony Stark) — On Screen character profile",
    publisher: "Marvel (marvel.com)",
    url: "https://www.marvel.com/characters/iron-man-tony-stark/on-screen",
    accessDate: null,
    kind: "official-web",
    verification: unverified,
    note: "Used for armor designations (Mark numbers) that are not spoken in the films. Confirm the page lists each cited designation; if it does not, replace with another official Marvel page that does.",
  },
];

export const FILMS: Film[] = [
  {
    id: "iron-man-2008",
    title: "Iron Man",
    releaseYear: 2008,
    sourceId: "film-iron-man-2008",
  },
  {
    id: "iron-man-2-2010",
    title: "Iron Man 2",
    releaseYear: 2010,
    sourceId: "film-iron-man-2-2010",
  },
  {
    id: "the-avengers-2012",
    title: "Marvel's The Avengers",
    releaseYear: 2012,
    sourceId: "film-the-avengers-2012",
  },
  {
    id: "iron-man-3-2013",
    title: "Iron Man 3",
    releaseYear: 2013,
    sourceId: "film-iron-man-3-2013",
  },
  {
    id: "avengers-age-of-ultron-2015",
    title: "Avengers: Age of Ultron",
    releaseYear: 2015,
    sourceId: "film-avengers-age-of-ultron-2015",
  },
  {
    id: "avengers-infinity-war-2018",
    title: "Avengers: Infinity War",
    releaseYear: 2018,
    sourceId: "film-avengers-infinity-war-2018",
  },
  {
    id: "avengers-endgame-2019",
    title: "Avengers: Endgame",
    releaseYear: 2019,
    sourceId: "film-avengers-endgame-2019",
  },
];

/** Convenience: the last film inside the archive's continuity window. */
export const CONTINUITY_CUTOFF_YEAR = 2019;
