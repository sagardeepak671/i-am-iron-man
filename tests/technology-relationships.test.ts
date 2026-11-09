import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ARCHIVE,
  ARMORS,
  SUIT_PARTS,
  TECHNOLOGIES,
  getFact,
  getTechnology,
  suitPartsForTechnology,
  technologySourceIds,
} from "@/data/archive";
import { checkArchiveIntegrity } from "@/lib/archive-integrity";
import { buildExplorerParts } from "@/lib/explorer-data";
import { TECHNOLOGY_SLUGS, resolveTechnologySlug } from "@/lib/technology-slug";

const techIds = new Set(TECHNOLOGIES.map((t) => t.id));
const armorIds = new Set(ARMORS.map((a) => a.id));

describe("technology records", () => {
  it("covers exactly the six requested topics", () => {
    assert.deepEqual(
      [...techIds].sort(),
      ["arc-reactor", "flight-stabilization", "helmet-hud", "nanotechnology", "onboard-ai", "repulsors"],
    );
  });

  it("each has cited facts, connections, limitations, armors, and unknowns", () => {
    for (const t of TECHNOLOGIES) {
      assert.ok(t.facts.length > 0, `${t.id} facts`);
      assert.ok(t.connections.length > 0, `${t.id} connections`);
      assert.ok(t.limitations.length > 0, `${t.id} limitations`);
      assert.ok(t.armorIds.length > 0, `${t.id} armors`);
      assert.ok(t.knownUnknowns.length > 0, `${t.id} unknowns`);
      for (const f of [...t.facts, ...t.connections, ...t.limitations]) {
        assert.ok(f.citations.length > 0, `${t.id}/${f.id} uncited`);
      }
      assert.ok(technologySourceIds(t).length > 0, `${t.id} cites no sources`);
    }
  });

  it("connections point at other existing technologies, never itself", () => {
    for (const t of TECHNOLOGIES) {
      for (const c of t.connections) {
        assert.ok(techIds.has(c.technologyId), `${t.id} -> ${c.technologyId}`);
        assert.notEqual(c.technologyId, t.id, `${t.id} connects to itself`);
      }
    }
  });

  it("connections are reciprocated (if A cites B, B cites A)", () => {
    for (const t of TECHNOLOGIES) {
      for (const c of t.connections) {
        const other = getTechnology(c.technologyId)!;
        assert.ok(
          other.connections.some((back) => back.technologyId === t.id),
          `${t.id} -> ${c.technologyId} is not reciprocated`,
        );
      }
    }
  });
});

describe("armor ↔ technology links", () => {
  it("are reciprocal in both directions", () => {
    for (const a of ARMORS) {
      assert.ok(a.technologyIds.length > 0, `${a.id} lists no technologies`);
      for (const tid of a.technologyIds) {
        assert.ok(techIds.has(tid), `${a.id} -> ${tid}`);
        assert.ok(getTechnology(tid)!.armorIds.includes(a.id), `${tid} does not list ${a.id}`);
      }
    }
    for (const t of TECHNOLOGIES) {
      for (const aid of t.armorIds) {
        assert.ok(armorIds.has(aid), `${t.id} -> ${aid}`);
      }
    }
  });

  it("the integrity checker flags a broken back-link", () => {
    const data = structuredClone(ARCHIVE);
    data.technologies[0].connections[0].technologyId = "warp-drive";
    data.technologies[1].connections.push({
      ...structuredClone(data.technologies[1].connections[0]),
      id: "self-link",
      technologyId: data.technologies[1].id,
    });
    const report = checkArchiveIntegrity(data);
    const broken = report.errors.filter((e) => e.code === "broken-relationship");
    assert.ok(broken.some((e) => e.path === `technology:${data.technologies[0].id}.connections[0]`));
    assert.ok(broken.some((e) => /self/.test(e.message) || e.path.endsWith(`connections[${data.technologies[1].connections.length - 1}]`)));
  });
});

describe("suit diagram parts", () => {
  it("are exactly helmet, chest, palms, boots", () => {
    assert.deepEqual(SUIT_PARTS.map((p) => p.id), ["helmet", "chest", "palms", "boots"]);
  });

  it("link only to existing technologies and existing cited facts", () => {
    for (const p of SUIT_PARTS) {
      assert.ok(p.technologyIds.length > 0, `${p.id} has no technology`);
      for (const tid of p.technologyIds) assert.ok(techIds.has(tid), `${p.id} -> ${tid}`);
      assert.ok(p.relatedFactIds.length > 0, `${p.id} has no supporting facts`);
      for (const fid of p.relatedFactIds) {
        const fact = getFact(fid);
        assert.ok(fact, `${p.id} -> missing fact ${fid}`);
        assert.ok(fact.citations.length > 0, `${p.id} -> uncited fact ${fid}`);
      }
    }
  });

  it("expose every technology at least once, and the reverse lookup agrees", () => {
    for (const t of TECHNOLOGIES) {
      const parts = suitPartsForTechnology(t.id);
      assert.ok(parts.length > 0, `${t.id} is not on the diagram`);
      for (const p of parts) assert.ok(p.technologyIds.includes(t.id));
    }
  });

  it("the explorer payload resolves everything and carries numbered citations", () => {
    const parts = buildExplorerParts();
    assert.equal(parts.length, 4);
    for (const p of parts) {
      const src = SUIT_PARTS.find((s) => s.id === p.id)!;
      assert.equal(p.technologies.length, src.technologyIds.length, `${p.id} lost a technology`);
      assert.equal(p.facts.length, src.relatedFactIds.length, `${p.id} lost a fact`);
      for (const f of p.facts) {
        assert.ok(f.marks.length > 0);
        for (const m of f.marks) assert.ok(m.n >= 1 && m.locator.length > 0);
      }
    }
  });

  it("the integrity checker flags a part pointing at a missing fact or technology", () => {
    const data = structuredClone(ARCHIVE);
    data.suitParts[0].relatedFactIds.push("no-such-fact");
    data.suitParts[1].technologyIds.push("warp-drive");
    const report = checkArchiveIntegrity(data);
    assert.ok(report.errors.some((e) => e.path === "suit-part:helmet.relatedFactIds"));
    assert.ok(report.errors.some((e) => e.path === "suit-part:chest.technologyIds"));
  });
});

describe("technology slugs", () => {
  it("every technology id resolves to itself", () => {
    assert.deepEqual(TECHNOLOGY_SLUGS, TECHNOLOGIES.map((t) => t.id));
    for (const slug of TECHNOLOGY_SLUGS) {
      const r = resolveTechnologySlug(slug);
      assert.equal(r.status, "ok", slug);
    }
  });

  it("redirects case variants and common shorthand", () => {
    const cases: [string, string][] = [
      ["Arc-Reactor", "arc-reactor"],
      ["ARC", "arc-reactor"],
      ["repulsor", "repulsors"],
      ["flight", "flight-stabilization"],
      ["hud", "helmet-hud"],
      ["helmet", "helmet-hud"],
      ["ai", "onboard-ai"],
      ["jarvis", "onboard-ai"],
      ["F.R.I.D.A.Y.", "onboard-ai"],
      ["nanotech", "nanotechnology"],
      ["Onboard AI", "onboard-ai"],
    ];
    for (const [raw, expected] of cases) {
      const r = resolveTechnologySlug(raw);
      assert.equal(r.status, "redirect", raw);
      if (r.status === "redirect") assert.equal(r.canonical, expected, raw);
    }
  });

  it("returns not-found for unknown or hostile input", () => {
    for (const raw of ["warp-drive", "mark-i", "", "  ", "%E0%A4%A", "<b>", "x".repeat(600)]) {
      assert.equal(resolveTechnologySlug(raw).status, "not-found", JSON.stringify(raw));
    }
    assert.equal(resolveTechnologySlug(undefined).status, "not-found");
  });
});
