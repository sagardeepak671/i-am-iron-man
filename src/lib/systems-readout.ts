import { allFacts, getSource, sourceNumber } from "@/data/archive";
import type { Fact } from "@/data/archive";

/**
 * Rows for the home page "Systems" panel.
 *
 * The previous panel showed invented figures (99.2% integrity, 3.4 GJ/s,
 * 72.8 km ceiling, 0.018 s response time). Each row here is either tied to a
 * fact in the archive (by `factId`) or explicitly `unknown`. A test asserts
 * every referenced fact exists.
 */
export type ReadoutRow =
  | {
      status: "stated";
      label: string;
      value: string;
      note: string;
      factId: string;
    }
  | {
      status: "unknown";
      label: string;
      note: string;
    };

export const SYSTEMS_READOUT: ReadoutRow[] = [
  {
    status: "stated",
    label: "Arc Output",
    value: "3 GJ/s",
    note: "Stark's own figure for the cave-built reactor — Iron Man (2008)",
    factId: "arc-reactor-three-gigajoules",
  },
  {
    status: "stated",
    label: "Shell Alloy",
    value: "Gold-titanium",
    note: "Mark III — Iron Man (2008)",
    factId: "mark-iii-alloy",
  },
  {
    status: "unknown",
    label: "Flight Ceiling",
    note: "Never stated for any armor",
  },
  {
    status: "stated",
    label: "Onboard AI",
    value: "F.R.I.D.A.Y.",
    note: "Stark's AI from Age of Ultron through Endgame",
    factId: "ai-friday-through-endgame",
  },
];

export type ResolvedReadout = ReadoutRow & {
  fact?: Fact;
  /** `[n]` numbers matching the archive page's source list. */
  sourceNumbers: number[];
  sourceTitles: string[];
};

export function resolveReadout(rows: ReadoutRow[] = SYSTEMS_READOUT): ResolvedReadout[] {
  const facts = new Map(allFacts().map(({ fact }) => [fact.id, fact]));
  return rows.map((row) => {
    if (row.status === "unknown") return { ...row, sourceNumbers: [], sourceTitles: [] };
    const fact = facts.get(row.factId);
    const ids = [...new Set((fact?.citations ?? []).map((c) => c.sourceId))];
    return {
      ...row,
      fact,
      sourceNumbers: ids.map(sourceNumber),
      sourceTitles: ids.map((id) => getSource(id)?.title ?? id),
    };
  });
}
