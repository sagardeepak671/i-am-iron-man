import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARCHIVE, ARMORS, TECHNOLOGIES, SOURCES, FILMS } from "@/data/archive";
import type { ArchiveData, Armor, Technology } from "@/data/archive";
import { checkArchiveIntegrity } from "@/lib/archive-integrity";

/* ---------------------------------------------------------------------------
 * Fixture helpers: deep-clone the real archive and mutate one thing.
 * ------------------------------------------------------------------------- */

const clone = (): ArchiveData => structuredClone(ARCHIVE);

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

/* ---------------------------------------------------------------------------
 * The real data set
 * ------------------------------------------------------------------------- */

describe("live archive data", () => {
  it("has no integrity errors", () => {
    const report = checkArchiveIntegrity(ARCHIVE);
    assert.deepEqual(
      report.errors,
      [],
      `Unexpected errors:\n${report.errors.map((e) => `${e.path}: ${e.message}`).join("\n")}`,
    );
  });

  it("every armor has overview, capabilities, and limitations with citations", () => {
    for (const armor of ARMORS) {
      assert.ok(armor.facts.length > 0, `${armor.id} facts`);
      assert.ok(armor.capabilities.length > 0, `${armor.id} capabilities`);
      assert.ok(armor.limitations.length > 0, `${armor.id} limitations`);
      for (const f of [...armor.facts, ...armor.capabilities, ...armor.limitations]) {
        assert.ok(f.citations.length > 0, `${armor.id}/${f.id} uncited`);
      }
      assert.equal(armor.image, null, `${armor.id}: no sourced image should be attached yet`);
    }
  });

  it("contains exactly the requested armors", () => {
    assert.deepEqual(
      ARMORS.map((a) => a.designation).sort(),
      [
        "Mark I",
        "Mark II",
        "Mark III",
        "Mark V",
        "Mark VI",
        "Mark VII",
        "Mark XLIV",
        "Mark L",
        "Mark LXXXV",
      ].sort(),
    );
    assert.equal(ARMORS.find((a) => a.id === "mark-xliv")?.alias, "Hulkbuster");
  });

  it("contains exactly the requested technology topics", () => {
    assert.deepEqual(
      TECHNOLOGIES.map((t) => t.id).sort(),
      [
        "arc-reactor",
        "flight-stabilization",
        "helmet-hud",
        "nanotechnology",
        "onboard-ai",
        "repulsors",
      ],
    );
  });

  it("stays inside MCU film continuity through Avengers: Endgame (2019)", () => {
    for (const film of FILMS) {
      assert.ok(film.releaseYear >= 2008 && film.releaseYear <= 2019, film.title);
    }
    for (const source of SOURCES) {
      assert.ok(
        source.kind === "film" || source.kind === "official-web",
        `Non-film, non-official source: ${source.id}`,
      );
    }
  });

  it("stores title, publisher, URL, and access-date field on every source", () => {
    for (const source of SOURCES) {
      assert.ok(source.title.length > 0, `${source.id} title`);
      assert.ok(source.publisher.length > 0, `${source.id} publisher`);
      assert.doesNotThrow(() => new URL(source.url), `${source.id} url`);
      assert.ok("accessDate" in source, `${source.id} accessDate`);
    }
  });

  it("never fabricates technical values: stated specs must be cited", () => {
    for (const armor of ARMORS) {
      for (const [key, spec] of Object.entries(armor.specs)) {
        if (spec.status === "stated") {
          assert.ok(spec.citations.length > 0, `${armor.id}.${key} has no citation`);
        }
      }
    }
  });

  it("only warns (not errors) about sources still awaiting verification", () => {
    const report = checkArchiveIntegrity(ARCHIVE);
    const unverified = SOURCES.filter((s) => s.verification.status === "unverified");
    const warned = report.warnings.filter((w) => w.code === "unverified-source");
    assert.equal(warned.length, unverified.length);
  });
});

/* ---------------------------------------------------------------------------
 * Detection: each check must actually catch what it claims to
 * ------------------------------------------------------------------------- */

describe("checkArchiveIntegrity detects", () => {
  it("duplicate armor ids", () => {
    const data = clone();
    data.armors.push({ ...data.armors[0] });
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("duplicate-id"));
  });

  it("duplicate fact ids across records", () => {
    const data = clone();
    // Copy a fact from an armor onto a technology.
    data.technologies[0].facts.push(structuredClone(data.armors[0].facts[0]));
    const report = checkArchiveIntegrity(data);
    const dup = report.errors.filter((e) => e.code === "duplicate-id");
    assert.equal(dup.length, 1);
    assert.match(dup[0].path, /^technology:/);
  });

  it("malformed ids", () => {
    const data = clone();
    data.armors[0].id = "Mark I";
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("invalid-id"));
  });

  it("broken armor → technology relationships", () => {
    const data = clone();
    data.armors[0].technologyIds.push("warp-drive");
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("broken-relationship"));
  });

  it("asymmetric relationships (technology not linking back)", () => {
    const data = clone();
    const tech = data.technologies.find((t) => t.id === "nanotechnology") as Technology;
    tech.armorIds = tech.armorIds.filter((id) => id !== "mark-l");
    const report = checkArchiveIntegrity(data);
    const issues = report.errors.filter((e) => e.code === "asymmetric-relationship");
    assert.equal(issues.length, 1);
    assert.equal(issues[0].path, "armor:mark-l.technologyIds");
  });

  it("broken film relationships", () => {
    const data = clone();
    data.armors[0].firstAppearanceFilmId = "iron-man-4-2099";
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("broken-relationship"));
  });

  it("facts with no citations", () => {
    const data = clone();
    data.armors[0].facts[0].citations = [];
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("missing-citation"));
  });

  it("citations to sources that do not exist", () => {
    const data = clone();
    data.armors[0].facts[0].citations[0].sourceId = "wiki-fan-page";
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("missing-source"));
  });

  it("uncited or empty capability / limitation groups", () => {
    const data = clone();
    data.armors[0].capabilities[0].citations = [];
    data.armors[1].limitations = [];
    const report = checkArchiveIntegrity(data);
    assert.ok(
      report.errors.some(
        (e) => e.code === "missing-citation" && e.path === `armor:${data.armors[0].id}.capabilities[0]`,
      ),
    );
    assert.ok(
      report.errors.some(
        (e) => e.code === "empty-record" && e.path === `armor:${data.armors[1].id}.limitations`,
      ),
    );
  });

  it("duplicate fact ids across fact groups of one armor", () => {
    const data = clone();
    data.armors[0].limitations.push({
      ...structuredClone(data.armors[0].limitations[0]),
      id: data.armors[0].capabilities[0].id,
    });
    const report = checkArchiveIntegrity(data);
    assert.ok(report.errors.some((e) => e.code === "duplicate-id" && /limitations/.test(e.path)));
  });

  it("malformed armor images", () => {
    const data = clone();
    data.armors[0].image = {
      src: "ftp://example.com/x.jpg",
      alt: "",
      kind: "fan-art",
      credit: "",
      width: 0,
      height: 10,
    };
    const report = checkArchiveIntegrity(data);
    const img = report.errors.filter((e) => e.code === "invalid-image");
    assert.equal(img.length, 4);
    // A well-formed local image is accepted.
    data.armors[0].image = {
      src: "/images/mark-i.jpg",
      alt: "Mark I",
      kind: "fan-art",
      credit: "Site render",
      width: 1200,
      height: 900,
    };
    assert.equal(checkArchiveIntegrity(data).errors.length, 0);
  });

  it("stated specs without citations", () => {
    const data = clone();
    const armor = data.armors.find((a) => a.id === "mark-iii") as Armor;
    armor.specs.topSpeed = {
      status: "stated",
      value: "Mach 3",
      basis: "on-screen",
      citations: [],
    };
    const report = checkArchiveIntegrity(data);
    assert.ok(
      report.errors.some(
        (e) => e.code === "missing-citation" && e.path === "armor:mark-iii.specs.topSpeed",
      ),
    );
  });

  it("films outside the continuity window", () => {
    const data = clone();
    data.films.push({
      id: "future-film-2099",
      title: "Future Film",
      releaseYear: 2099,
      sourceId: data.sources[0].id,
    });
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.errors).includes("out-of-scope"));
  });

  it("sources that are never cited (warning)", () => {
    const data = clone();
    data.sources.push({
      id: "unused-source",
      title: "Unused",
      publisher: "Nobody",
      url: "https://example.com/",
      accessDate: "2026-01-01",
      kind: "official-web",
      verification: { status: "verified" },
    });
    const report = checkArchiveIntegrity(data);
    assert.ok(codes(report.warnings).includes("orphan-source"));
    assert.equal(report.errors.length, 0);
  });

  it("malformed source records", () => {
    const data = clone();
    // 1. unparsable URL
    data.sources[0].url = "not a url";
    // 2. verified but with a non-ISO access date
    data.sources[1] = {
      ...data.sources[1],
      accessDate: "28/10/2026",
      verification: { status: "verified" },
    };
    // 3. unverified yet claiming an access date
    data.sources[2] = {
      ...data.sources[2],
      accessDate: "2026-10-28",
      verification: { status: "unverified", note: "x" },
    };
    // 4. verified without any access date
    data.sources[3] = {
      ...data.sources[3],
      accessDate: null,
      verification: { status: "verified" },
    };
    const report = checkArchiveIntegrity(data);
    const invalid = report.errors.filter((e) => e.code === "invalid-source");
    assert.equal(invalid.length, 4);
    assert.deepEqual(
      invalid.map((e) => e.path),
      data.sources.slice(0, 4).map((s) => `source:${s.id}`),
    );
  });
});
