import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARMORS, FILMS } from "@/data/archive";
import {
  DEFAULT_QUERY,
  MAX_QUERY_LENGTH,
  applyArmorQuery,
  filmFilterOptions,
  isDefaultQuery,
  parseArmorQuery,
  serializeArmorQuery,
  sortArmors,
} from "@/lib/armor-query";

const ids = (list: { id: string }[]) => list.map((a) => a.id);
const filmsById = new Map(FILMS.map((f) => [f.id, f]));

describe("search", () => {
  it("is case-insensitive", () => {
    const lower = applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "hulkbuster" }, FILMS);
    const upper = applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "HULKBUSTER" }, FILMS);
    const mixed = applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "HuLkBuStEr" }, FILMS);
    assert.deepEqual(ids(lower), ["mark-xliv"]);
    assert.deepEqual(ids(upper), ["mark-xliv"]);
    assert.deepEqual(ids(mixed), ["mark-xliv"]);
  });

  it("matches designation, alias, mark number, summary, and first-appearance film title", () => {
    assert.deepEqual(ids(applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "mark lxxxv" }, FILMS)), ["mark-lxxxv"]);
    assert.deepEqual(ids(applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "suitcase" }, FILMS)), ["mark-v"]);
    assert.deepEqual(ids(applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "85" }, FILMS)), ["mark-lxxxv"]);
    assert.ok(ids(applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "nanotechnology" }, FILMS)).includes("mark-l"));
    assert.deepEqual(
      ids(applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "endgame" }, FILMS)),
      ["mark-lxxxv"],
    );
  });

  it("ignores surrounding and repeated whitespace", () => {
    const a = applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "   mark    vii " }, FILMS);
    assert.deepEqual(ids(a), ["mark-vii"]);
  });

  it("returns everything for an empty query and nothing for gibberish", () => {
    assert.equal(applyArmorQuery(ARMORS, DEFAULT_QUERY, FILMS).length, ARMORS.length);
    assert.equal(applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, q: "zzzz-nope" }, FILMS).length, 0);
  });
});

describe("film filter", () => {
  it("limits results to armors whose first appearance is that film", () => {
    const im1 = applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, film: "iron-man-2008" }, FILMS);
    assert.deepEqual(ids(im1), ["mark-i", "mark-ii", "mark-iii"]);
    // Mark VI also appears in The Avengers but first appeared in Iron Man 2.
    const avengers = applyArmorQuery(ARMORS, { ...DEFAULT_QUERY, film: "the-avengers-2012" }, FILMS);
    assert.deepEqual(ids(avengers), ["mark-vii"]);
  });

  it("only offers films that are a first appearance, in release order", () => {
    const options = filmFilterOptions(ARMORS, FILMS);
    assert.deepEqual(ids(options), [
      "iron-man-2008",
      "iron-man-2-2010",
      "the-avengers-2012",
      "avengers-age-of-ultron-2015",
      "avengers-infinity-war-2018",
      "avengers-endgame-2019",
    ]);
    assert.ok(!ids(options).includes("iron-man-3-2013"));
  });
});

describe("sorting", () => {
  it("release order is by first-appearance year, then Mark number", () => {
    assert.deepEqual(ids(sortArmors(ARMORS, "release", filmsById)), [
      "mark-i", "mark-ii", "mark-iii", "mark-v", "mark-vi", "mark-vii", "mark-xliv", "mark-l", "mark-lxxxv",
    ]);
  });

  it("release-desc reverses it", () => {
    const asc = ids(sortArmors(ARMORS, "release", filmsById));
    assert.deepEqual(ids(sortArmors(ARMORS, "release-desc", filmsById)), [...asc].reverse());
  });

  it("name sorts by designation A–Z and Z–A", () => {
    const asc = ids(sortArmors(ARMORS, "name", filmsById));
    assert.equal(asc[0], "mark-i");
    assert.equal(asc[asc.length - 1], "mark-xliv");
    assert.deepEqual(ids(sortArmors(ARMORS, "name-desc", filmsById)), [...asc].reverse());
  });

  it("does not mutate its input", () => {
    const before = ids(ARMORS);
    sortArmors(ARMORS, "name-desc", filmsById);
    assert.deepEqual(ids(ARMORS), before);
  });
});

describe("controls work together", () => {
  it("search + film + sort compose", () => {
    const r = applyArmorQuery(
      ARMORS,
      { q: "mark", film: "iron-man-2008", sort: "name-desc" },
      FILMS,
    );
    assert.deepEqual(ids(r), ["mark-iii", "mark-ii", "mark-i"]);
  });

  it("film filter still applies when search matches nothing in that film", () => {
    const r = applyArmorQuery(
      ARMORS,
      { q: "hulkbuster", film: "iron-man-2008", sort: "release" },
      FILMS,
    );
    assert.equal(r.length, 0);
  });
});

describe("URL state: parse", () => {
  it("reads q, film, and sort from Next-style searchParams", () => {
    const q = parseArmorQuery({ q: "Hulk", film: "avengers-age-of-ultron-2015", sort: "name" }, FILMS);
    assert.deepEqual(q, { q: "Hulk", film: "avengers-age-of-ultron-2015", sort: "name" });
  });

  it("reads from URLSearchParams too", () => {
    const q = parseArmorQuery(new URLSearchParams("q=mark&sort=release-desc"), FILMS);
    assert.deepEqual(q, { q: "mark", film: null, sort: "release-desc" });
  });

  it("falls back to defaults for invalid sort and unknown film", () => {
    const q = parseArmorQuery({ sort: "DROP TABLE", film: "iron-man-4-2099" }, FILMS);
    assert.deepEqual(q, DEFAULT_QUERY);
  });

  it("ignores unknown keys and uses the first value of repeated keys", () => {
    const q = parseArmorQuery({ q: ["first", "second"], utm_source: "x", page: "9" }, FILMS);
    assert.deepEqual(q, { ...DEFAULT_QUERY, q: "first" });
  });

  it("trims, collapses whitespace, and caps the search length", () => {
    const long = "a".repeat(MAX_QUERY_LENGTH + 50);
    const q = parseArmorQuery({ q: `   ${long}   ` }, FILMS);
    assert.equal(q.q.length, MAX_QUERY_LENGTH);
    assert.equal(parseArmorQuery({ q: "  mark   vii  " }, FILMS).q, "mark vii");
  });

  it("never throws on odd input", () => {
    assert.deepEqual(parseArmorQuery({}, FILMS), DEFAULT_QUERY);
    assert.deepEqual(parseArmorQuery({ q: undefined, film: undefined, sort: undefined }, FILMS), DEFAULT_QUERY);
    assert.deepEqual(parseArmorQuery({ q: [], sort: [] }, FILMS), DEFAULT_QUERY);
    assert.deepEqual(parseArmorQuery(new URLSearchParams(""), FILMS), DEFAULT_QUERY);
  });
});

describe("URL state: serialize", () => {
  it("omits defaults so the canonical empty state is the bare path", () => {
    assert.equal(serializeArmorQuery(DEFAULT_QUERY), "");
    assert.equal(serializeArmorQuery({ q: "   " }), "");
    assert.equal(serializeArmorQuery({ sort: "release" }), "");
  });

  it("uses a fixed key order", () => {
    assert.equal(
      serializeArmorQuery({ sort: "name", q: "mark", film: "iron-man-2008" }),
      "?q=mark&film=iron-man-2008&sort=name",
    );
  });

  it("round-trips through parse", () => {
    const states = [
      { q: "hulk buster", film: "avengers-age-of-ultron-2015", sort: "name-desc" as const },
      { q: "", film: "iron-man-2008", sort: "release" as const },
      { q: "Mark L", film: null, sort: "release-desc" as const },
      DEFAULT_QUERY,
    ];
    for (const state of states) {
      const url = serializeArmorQuery(state);
      const back = parseArmorQuery(new URLSearchParams(url), FILMS);
      assert.deepEqual(back, state);
    }
  });

  it("encodes unsafe characters", () => {
    const url = serializeArmorQuery({ q: "a&b=c" });
    assert.equal(url, "?q=a%26b%3Dc");
    assert.equal(parseArmorQuery(new URLSearchParams(url), FILMS).q, "a&b=c");
  });

  it("isDefaultQuery identifies the cleared state", () => {
    assert.ok(isDefaultQuery(DEFAULT_QUERY));
    assert.ok(!isDefaultQuery({ ...DEFAULT_QUERY, q: "x" }));
    assert.ok(!isDefaultQuery({ ...DEFAULT_QUERY, film: "iron-man-2008" }));
    assert.ok(!isDefaultQuery({ ...DEFAULT_QUERY, sort: "name" }));
  });
});
