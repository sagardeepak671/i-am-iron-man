import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARMORS, FILMS, TECHNOLOGIES, getArmor } from "@/data/archive";
import {
  MAX_COMPARE,
  MIN_COMPARE,
  addToSelection,
  canCompare,
  canonicalArmorId,
  compareHref,
  compareReadiness,
  isFull,
  parseCompareQuery,
  removeFromSelection,
  serializeCompareQuery,
  toggleSelection,
} from "@/lib/compare-selection";
import {
  buildComparison,
  cellsEqual,
  differencesOnly,
  rowDiffers,
  sharedKeys,
  type CompareCell,
} from "@/lib/compare";

const ctx = { films: FILMS, technologies: TECHNOLOGIES };
const armors = (...ids: string[]) => ids.map((id) => getArmor(id)!);

/* ---------------------------------------------------------------------------
 * Selection limits, duplicates, invalid ids, removal
 * ------------------------------------------------------------------------- */

describe("compare selection", () => {
  it("allows 2 to 3 armors", () => {
    assert.equal(MIN_COMPARE, 2);
    assert.equal(MAX_COMPARE, 3);
    let sel: string[] = [];
    for (const id of ["mark-i", "mark-ii", "mark-iii"]) {
      const r = addToSelection(sel, id);
      assert.equal(r.rejected, undefined, id);
      sel = r.ids;
    }
    assert.deepEqual(sel, ["mark-i", "mark-ii", "mark-iii"]);
    assert.ok(isFull(sel));
    assert.ok(canCompare(sel));
  });

  it("refuses a fourth armor and reports why", () => {
    const r = addToSelection(["mark-i", "mark-ii", "mark-iii"], "mark-l");
    assert.equal(r.rejected, "limit");
    assert.deepEqual(r.ids, ["mark-i", "mark-ii", "mark-iii"]);
  });

  it("refuses duplicates, including differently-spelled ones", () => {
    assert.equal(addToSelection(["mark-i"], "mark-i").rejected, "duplicate");
    assert.equal(addToSelection(["mark-i"], "Mark-I").rejected, "duplicate");
    assert.equal(addToSelection(["mark-xliv"], "hulkbuster").rejected, "duplicate");
    assert.equal(addToSelection(["mark-l"], "mark-50").rejected, "duplicate");
  });

  it("refuses ids that are not archived armors", () => {
    for (const bad of ["mark-iv", "iron-monger", "", "   ", "<script>"]) {
      const r = addToSelection(["mark-i"], bad);
      assert.equal(r.rejected, "invalid", JSON.stringify(bad));
      assert.deepEqual(r.ids, ["mark-i"]);
    }
  });

  it("canonicalises alternate spellings on add", () => {
    assert.deepEqual(addToSelection([], "Hulkbuster").ids, ["mark-xliv"]);
    assert.equal(canonicalArmorId("MK-85"), "mark-lxxxv");
    assert.equal(canonicalArmorId("nope"), null);
  });

  it("removes by canonical id and is a no-op for unknown ids", () => {
    assert.deepEqual(removeFromSelection(["mark-i", "mark-l"], "mark-l"), ["mark-i"]);
    assert.deepEqual(removeFromSelection(["mark-i", "mark-xliv"], "hulkbuster"), ["mark-i"]);
    assert.deepEqual(removeFromSelection(["mark-i"], "mark-iv"), ["mark-i"]);
    assert.deepEqual(removeFromSelection([], "mark-i"), []);
  });

  it("toggle adds then removes", () => {
    const added = toggleSelection(["mark-i"], "mark-l");
    assert.deepEqual(added.ids, ["mark-i", "mark-l"]);
    const removed = toggleSelection(added.ids, "mark-l");
    assert.deepEqual(removed.ids, ["mark-i"]);
    assert.equal(toggleSelection(["mark-i"], "nope").rejected, "invalid");
  });

  it("does not mutate the input array", () => {
    const sel = ["mark-i"];
    addToSelection(sel, "mark-ii");
    removeFromSelection(sel, "mark-i");
    toggleSelection(sel, "mark-iii");
    assert.deepEqual(sel, ["mark-i"]);
  });

  it("readiness guidance counts how many more are needed", () => {
    assert.deepEqual(compareReadiness([]), { status: "needs-more", ids: [], missing: 2 });
    assert.deepEqual(compareReadiness(["mark-i"]), { status: "needs-more", ids: ["mark-i"], missing: 1 });
    assert.equal(compareReadiness(["mark-i", "mark-ii"]).status, "ready");
  });
});

/* ---------------------------------------------------------------------------
 * URL round trips
 * ------------------------------------------------------------------------- */

describe("compare URL state", () => {
  it("parses comma-separated, repeated, and space-separated ids", () => {
    assert.deepEqual(parseCompareQuery({ ids: "mark-i,mark-l" }).ids, ["mark-i", "mark-l"]);
    assert.deepEqual(parseCompareQuery({ ids: ["mark-i", "mark-l"] }).ids, ["mark-i", "mark-l"]);
    assert.deepEqual(parseCompareQuery(new URLSearchParams("ids=mark-i&ids=mark-l")).ids, ["mark-i", "mark-l"]);
    assert.deepEqual(parseCompareQuery(new URLSearchParams("ids=mark-i+mark-l")).ids, ["mark-i", "mark-l"]);
  });

  it("appends the no-JS form's `add` parameter", () => {
    const q = parseCompareQuery({ ids: "mark-i,mark-l", add: "mark-xliv" });
    assert.deepEqual(q.ids, ["mark-i", "mark-l", "mark-xliv"]);
    assert.deepEqual(parseCompareQuery({ ids: "mark-i", add: "mark-i" }).duplicates, ["mark-i"]);
  });

  it("drops duplicates and invalid ids, reporting each", () => {
    const q = parseCompareQuery({ ids: "mark-i,Mark-I,mark-iv,mark-l,hulkbuster,warp" });
    assert.deepEqual(q.ids, ["mark-i", "mark-l", "mark-xliv"]);
    assert.deepEqual(q.duplicates, ["mark-i"]);
    assert.deepEqual(q.invalid, ["mark-iv", "warp"]);
  });

  it("keeps only the first three valid ids and reports the overflow", () => {
    const q = parseCompareQuery({ ids: "mark-i,mark-ii,mark-iii,mark-v,mark-vi" });
    assert.deepEqual(q.ids, ["mark-i", "mark-ii", "mark-iii"]);
    assert.deepEqual(q.overflow, ["mark-v", "mark-vi"]);
  });

  it("reads the diff flag leniently", () => {
    assert.equal(parseCompareQuery({ ids: "mark-i,mark-ii", diff: "1" }).diff, true);
    assert.equal(parseCompareQuery({ ids: "mark-i,mark-ii", diff: "true" }).diff, true);
    assert.equal(parseCompareQuery({ ids: "mark-i,mark-ii", diff: "0" }).diff, false);
    assert.equal(parseCompareQuery({ ids: "mark-i,mark-ii", diff: "banana" }).diff, false);
    assert.equal(parseCompareQuery({ ids: "mark-i,mark-ii" }).diff, false);
  });

  it("never throws on hostile input", () => {
    for (const raw of [
      {},
      { ids: "" },
      { ids: ",,,, , " },
      { ids: "%E0%A4%A" },
      { ids: "x".repeat(10_000) },
      { ids: Array.from({ length: 500 }, () => "mark-i") },
      { ids: [], diff: [] },
    ]) {
      const q = parseCompareQuery(raw as never);
      assert.ok(Array.isArray(q.ids));
      assert.ok(q.ids.length <= MAX_COMPARE);
    }
  });

  it("serialises canonically and round-trips", () => {
    assert.equal(serializeCompareQuery({ ids: [] }), "");
    assert.equal(serializeCompareQuery({ ids: ["mark-i", "mark-l"] }), "?ids=mark-i,mark-l");
    assert.equal(serializeCompareQuery({ ids: ["mark-i", "mark-l"], diff: true }), "?ids=mark-i,mark-l&diff=1");
    assert.equal(serializeCompareQuery({ ids: ["mark-i", "mark-i", "mark-ii", "mark-iii", "mark-v"] }), "?ids=mark-i,mark-ii,mark-iii");
    for (const state of [
      { ids: ["mark-i", "mark-l"], diff: false },
      { ids: ["mark-xliv", "mark-lxxxv", "mark-v"], diff: true },
      { ids: [], diff: false },
    ]) {
      const back = parseCompareQuery(new URLSearchParams(serializeCompareQuery(state)));
      assert.deepEqual(back.ids, state.ids);
      assert.equal(back.diff, state.diff);
      assert.deepEqual(back.invalid, []);
    }
  });

  it("builds remove / clear hrefs that re-parse to the reduced selection", () => {
    const ids = ["mark-i", "mark-l", "mark-xliv"];
    const afterRemove = removeFromSelection(ids, "mark-l");
    const href = compareHref(afterRemove, true);
    assert.equal(href, "/compare?ids=mark-i,mark-xliv&diff=1");
    const q = parseCompareQuery(new URLSearchParams(href.split("?")[1]));
    assert.deepEqual(q.ids, ["mark-i", "mark-xliv"]);
    assert.equal(compareHref([]), "/compare");
  });
});

/* ---------------------------------------------------------------------------
 * Comparison rows, unknown vs absent, differences-only
 * ------------------------------------------------------------------------- */

describe("comparison rows", () => {
  const rows = buildComparison(armors("mark-i", "mark-xliv"), ctx);
  const row = (id: string) => rows.find((r) => r.id === id)!;

  it("only compares supported categories (no scores, speeds, or rankings)", () => {
    const ids = rows.map((r) => r.id);
    assert.deepEqual(ids, [
      "first-appearance", "other-appearances", "alias", "designation-basis", "design-approach",
      "capabilities", "technologies", "limitations",
      "spec-powerSource", "spec-powerOutput", "spec-shellMaterial", "spec-flightCeiling", "spec-topSpeed", "spec-mass",
    ]);
    for (const r of rows) assert.ok(!/score|rank|rating|battery/i.test(r.label), r.label);
  });

  it("every value cell carries citations on its facts (except pure link lists)", () => {
    for (const r of rows) {
      for (const c of r.cells) {
        if (c.status !== "value") continue;
        for (const item of c.items) {
          if (r.id === "technologies") { assert.ok(item.href); continue; }
          assert.ok(item.facts.length > 0, `${r.id}: ${item.label} has no facts`);
          for (const f of item.facts) assert.ok(f.citations.length > 0, `${r.id}: ${item.label} uncited`);
        }
      }
    }
  });

  it("distinguishes unknown (films silent) from absent (nothing in this category)", () => {
    // Mark I has no alias -> absent; Hulkbuster -> value
    assert.equal(row("alias").cells[0].status, "absent");
    assert.equal(row("alias").cells[1].status, "value");
    // Flight ceiling is unknown for both -> unknown, never absent
    assert.deepEqual(row("spec-flightCeiling").cells.map((c) => c.status), ["unknown", "unknown"]);
    // Mark I power output is stated; Hulkbuster's is unknown
    assert.deepEqual(row("spec-powerOutput").cells.map((c) => c.status), ["value", "unknown"]);
    // No absent cells in spec rows, no unknown cells outside spec rows
    for (const r of rows) {
      for (const c of r.cells) {
        if (r.kind === "spec") assert.notEqual(c.status, "absent", r.id);
        else assert.notEqual(c.status, "unknown", r.id);
      }
    }
  });

  it("equality: unknown==unknown, absent==absent, unknown!=absent, value!=either", () => {
    const unknown: CompareCell = { status: "unknown" };
    const absent: CompareCell = { status: "absent" };
    const value: CompareCell = { status: "value", items: [{ key: "x", label: "x", facts: [] }] };
    assert.ok(cellsEqual(unknown, { status: "unknown" }));
    assert.ok(cellsEqual(absent, { status: "absent" }));
    assert.ok(!cellsEqual(unknown, absent));
    assert.ok(!cellsEqual(value, unknown));
    assert.ok(!cellsEqual(value, absent));
    assert.ok(!rowDiffers([unknown, { status: "unknown" }]));
    assert.ok(rowDiffers([unknown, absent]));
  });

  it("compares normalised keys, not wording or order", () => {
    const a: CompareCell = { status: "value", items: [{ key: "flight", label: "Controlled flight", facts: [] }, { key: "ranged-weapons", label: "Ranged weapons", facts: [] }] };
    const b: CompareCell = { status: "value", items: [{ key: "ranged-weapons", label: "Guns and repulsors", facts: [] }, { key: "flight", label: "Can fly", facts: [] }] };
    assert.ok(cellsEqual(a, b));
    assert.deepEqual([...sharedKeys([a, b])].sort(), ["flight", "ranged-weapons"]);
  });

  it("same design approach (Mark II vs Mark III) is not a difference", () => {
    const r = buildComparison(armors("mark-ii", "mark-iii"), ctx);
    const design = r.find((x) => x.id === "design-approach")!;
    assert.equal(design.differs, false);
    assert.equal(design.cells[0].status, "value");
    assert.equal(design.cells[1].status, "value");
    // but the cited descriptions are different prose
    const t0 = (design.cells[0] as Extract<CompareCell, { status: "value" }>).items[0].facts[0].text;
    const t1 = (design.cells[1] as Extract<CompareCell, { status: "value" }>).items[0].facts[0].text;
    assert.notEqual(t0, t1);
  });

  it("differences-only drops equal rows and shared list items", () => {
    const all = buildComparison(armors("mark-l", "mark-lxxxv"), ctx);
    const diff = differencesOnly(all);
    const ids = diff.map((r) => r.id);
    // Both nanotech, both unknown on every spec, both "official materials" designation, both no alias
    for (const same of ["design-approach", "designation-basis", "alias", "spec-flightCeiling", "spec-mass", "spec-powerSource"]) {
      assert.ok(!ids.includes(same), `${same} should be hidden`);
    }
    assert.ok(ids.includes("first-appearance"));
    // technologies: identical sets -> hidden entirely
    assert.ok(!ids.includes("technologies"));
    // capabilities: shared "reconfiguration" removed, unique ones kept
    const caps = diff.find((r) => r.id === "capabilities")!;
    for (const cell of caps.cells) {
      assert.equal(cell.status, "value");
      const keys = (cell as Extract<CompareCell, { status: "value" }>).items.map((i) => i.key);
      assert.ok(!keys.includes("reconfiguration"));
    }
    assert.ok((caps.cells[0] as Extract<CompareCell, { status: "value" }>).items.some((i) => i.key === "instant-deployment"));
    assert.ok((caps.cells[1] as Extract<CompareCell, { status: "value" }>).items.some((i) => i.key === "stone-handling"));
  });

  it("differences-only keeps a row where one armor is unknown and another stated", () => {
    const diff = differencesOnly(buildComparison(armors("mark-i", "mark-ii"), ctx));
    const power = diff.find((r) => r.id === "spec-powerOutput")!;
    assert.ok(power);
    assert.deepEqual(power.cells.map((c) => c.status), ["value", "unknown"]);
  });

  it("works for three armors and for every armor in the archive", () => {
    const three = buildComparison(armors("mark-i", "mark-vii", "mark-l"), ctx);
    assert.ok(three.every((r) => r.cells.length === 3));
    const everything = buildComparison(ARMORS, ctx);
    assert.ok(everything.every((r) => r.cells.length === ARMORS.length));
    assert.deepEqual(buildComparison([], ctx), []);
  });
});
