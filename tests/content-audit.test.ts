import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ARCHIVE, FILMS, SOURCES, allFacts } from "@/data/archive";
import { BEATS } from "@/lib/cinematic";
import { DIALOGUES } from "@/lib/hero";
import { SYSTEMS_READOUT } from "@/lib/systems-readout";

/**
 * Content audit: the archive must stay inside MCU film continuity, must not
 * carry numbers the films never state, and must cite only film / official
 * Marvel sources.
 */

const prose: { where: string; text: string }[] = [];
for (const { owner, fact } of allFacts()) prose.push({ where: `${owner}/${fact.id}`, text: fact.text });
for (const a of ARCHIVE.armors) {
  prose.push({ where: `${a.id}/summary`, text: a.summary });
  for (const [k, s] of Object.entries(a.specs)) if (s.status === "stated") prose.push({ where: `${a.id}/spec:${k}`, text: s.value });
}
for (const t of ARCHIVE.technologies) {
  prose.push({ where: `${t.id}/summary`, text: t.summary });
  t.knownUnknowns.forEach((u, i) => prose.push({ where: `${t.id}/unknown[${i}]`, text: u }));
}
for (const p of ARCHIVE.suitParts) prose.push({ where: `part:${p.id}`, text: p.summary });

/** Numbers that the films state on-screen (or are names/titles), nothing else. */
const ALLOWED_NUMBERS = [
  /\bF-22\b/, // aircraft designation
  /\bIron Man [23]\b/, // film titles
  /\b85,000 (feet|ft)\b/, // J.A.R.V.I.S.'s altitude-record line, Iron Man (2008)
  /\b400%/, // "Power at 400% capacity", The Avengers (2012)
];

describe("content audit", () => {
  it("carries no numeric claims beyond film-stated figures", () => {
    for (const { where, text } of prose) {
      const stripped = ALLOWED_NUMBERS.reduce((t, re) => t.replace(re, ""), text);
      const leftover = stripped.match(/\d+(?:[.,]\d+)?\s*(?:%|km|m\b|ft|feet|mph|km\/h|kg|lb|GJ|MW|kW|s\b|sec|ms|hp|g\b)?/g);
      assert.equal(leftover, null, `${where}: unexpected number(s) ${JSON.stringify(leftover)} in "${text}"`);
    }
  });

  it("does not reference comics, games, or fan sources", () => {
    const banned = /\bcomics?\b|\bvideo ?games?\b|\b616\b|\bextremis\b|\bmodel prime\b|\bbleeding edge\b|\bwiki(pedia)?\b|\bfandom\b/i;
    for (const { where, text } of prose) {
      assert.ok(!banned.test(text), `${where}: "${text}"`);
    }
  });

  it("cites only feature films or official Marvel pages, all within 2008–2019", () => {
    for (const s of SOURCES) {
      assert.ok(["film", "official-web"].includes(s.kind), s.id);
      assert.match(s.url, /^https:\/\/www\.marvel\.com\//, s.id);
    }
    for (const f of FILMS) assert.ok(f.releaseYear >= 2008 && f.releaseYear <= 2019, f.title);
  });

  it("every fact has a recognised basis and at least one citation", () => {
    for (const { owner, fact } of allFacts()) {
      assert.ok(["dialogue", "on-screen", "official-materials"].includes(fact.basis), `${owner}/${fact.id}`);
      assert.ok(fact.citations.length > 0, `${owner}/${fact.id}`);
    }
  });

  it("home page quotes are attributed to films inside the continuity window", () => {
    const years = new Set(FILMS.map((f) => String(f.releaseYear)));
    for (const q of [...DIALOGUES, ...BEATS]) {
      const year = q.film.match(/(\d{4})$/)?.[1];
      assert.ok(year && years.has(year), `${q.quote} -> ${q.film}`);
      assert.equal(q.speaker, "Tony Stark");
    }
  });

  it("home page readouts never reintroduce invented telemetry", () => {
    const text = JSON.stringify(SYSTEMS_READOUT);
    for (const invented of ["99.2", "3.4 GJ", "72.8", "0.018", "Vibranium", "Cold-fused", "J.A.R.V.I.S.", "neural"]) {
      assert.ok(!text.includes(invented), invented);
    }
  });
});
