import { SUIT_PARTS, getFact, getTechnology, sourceNumber } from "@/data/archive";
import type { ExplorerPart } from "@/components/technology/SuitExplorer";

/**
 * Resolve suit-part records into the plain, serialisable shape the client
 * explorer needs (facts with pre-numbered citation marks, technology names).
 */
export function buildExplorerParts(): ExplorerPart[] {
  return SUIT_PARTS.map((part) => ({
    id: part.id,
    name: part.name,
    summary: part.summary,
    technologies: part.technologyIds
      .map(getTechnology)
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => ({ id: t.id, name: t.name, summary: t.summary })),
    facts: part.relatedFactIds
      .map(getFact)
      .filter((f): f is NonNullable<typeof f> => Boolean(f))
      .map((f) => ({
        id: f.id,
        text: f.text,
        basis: f.basis,
        marks: f.citations.map((c) => ({ n: sourceNumber(c.sourceId), locator: c.locator })),
      })),
  }));
}
