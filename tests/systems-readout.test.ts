import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { allFacts } from "@/data/archive";
import { SYSTEMS_READOUT, resolveReadout } from "@/lib/systems-readout";

describe("home page systems readout", () => {
  it("only shows values that are tied to a cited archive fact, or Unknown", () => {
    const factIds = new Set(allFacts().map(({ fact }) => fact.id));
    for (const row of SYSTEMS_READOUT) {
      if (row.status === "stated") {
        assert.ok(factIds.has(row.factId), `${row.label} references missing fact "${row.factId}"`);
      }
    }
  });

  it("resolves source numbers for every stated row", () => {
    for (const row of resolveReadout()) {
      if (row.status === "stated") {
        assert.ok(row.fact, `${row.label}: fact not resolved`);
        assert.ok(row.sourceNumbers.length > 0, `${row.label}: no source numbers`);
        assert.ok(row.sourceNumbers.every((n) => n >= 1), `${row.label}: bad source number`);
      } else {
        assert.deepEqual(row.sourceNumbers, []);
      }
    }
  });

  it("no longer contains the previously invented telemetry values", () => {
    const text = JSON.stringify(SYSTEMS_READOUT);
    for (const invented of ["99.2%", "3.4 GJ/s", "72.8 km", "0.018 s", "Vibranium", "Cold-fused"]) {
      assert.ok(!text.includes(invented), `invented value still present: ${invented}`);
    }
  });
});
