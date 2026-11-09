import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARMORS } from "@/data/archive";
import { ARMOR_SLUGS, normalizeSlug, resolveArmorSlug } from "@/lib/armor-slug";

describe("armor slugs", () => {
  it("every archive armor has a canonical slug that resolves to itself", () => {
    assert.deepEqual(ARMOR_SLUGS, ARMORS.map((a) => a.id));
    for (const slug of ARMOR_SLUGS) {
      const r = resolveArmorSlug(slug);
      assert.equal(r.status, "ok");
      if (r.status === "ok") assert.equal(r.armor.id, slug);
    }
  });

  it("redirects case and separator variants to the canonical slug", () => {
    for (const raw of ["Mark-I", "MARK-I", " mark-i ", "mark_i", "Mark%20I", "mark--i"]) {
      const r = resolveArmorSlug(raw);
      assert.equal(r.status, "redirect", raw);
      if (r.status === "redirect") assert.equal(r.canonical, "mark-i");
    }
  });

  it("redirects Mark-number and alias spellings", () => {
    const cases: [string, string][] = [
      ["mark-50", "mark-l"],
      ["mark-85", "mark-lxxxv"],
      ["mk-44", "mark-xliv"],
      ["mk-xliv", "mark-xliv"],
      ["mark44", "mark-xliv"],
      ["hulkbuster", "mark-xliv"],
      ["Hulkbuster", "mark-xliv"],
    ];
    for (const [raw, expected] of cases) {
      const r = resolveArmorSlug(raw);
      assert.equal(r.status, "redirect", raw);
      if (r.status === "redirect") assert.equal(r.canonical, expected, raw);
    }
  });

  it("returns not-found for unknown, empty, malformed, or hostile slugs", () => {
    const bad = [
      "mark-iv",          // exists in the films, not in this archive
      "mark-4",
      "mark-999",
      "iron-monger",
      "",
      "   ",
      "../../etc/passwd",
      "%E0%A4%A",         // malformed percent-encoding must not throw
      "<script>alert(1)</script>",
      "x".repeat(600),
    ];
    for (const raw of bad) {
      const r = resolveArmorSlug(raw);
      assert.equal(r.status, "not-found", JSON.stringify(raw));
    }
    assert.equal(resolveArmorSlug(undefined).status, "not-found");
  });

  it("normalizeSlug is idempotent and bounded", () => {
    for (const raw of ["Mark I", "  MARK__L  ", "mark-lxxxv", "a".repeat(200)]) {
      const once = normalizeSlug(raw);
      assert.equal(normalizeSlug(once), once);
      assert.ok(once.length <= 64);
    }
  });
});
