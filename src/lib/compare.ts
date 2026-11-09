import type { Armor, Citation, FactBasis, Film, Technology } from "@/data/archive";
import {
  CAPABILITY_TAG_LABELS,
  DESIGN_APPROACH_LABELS,
  LIMITATION_TAG_LABELS,
  SPEC_KEYS,
  SPEC_LABELS,
} from "@/data/archive/types";

/**
 * Armor comparison model.
 *
 * Every row compares a *normalised* value per armor (film id, tag set,
 * technology id set, spec value, …) so "differences" reflect the data, not
 * the wording. Cells distinguish three non-value states:
 *
 *  - `value`   — something on record, with citations
 *  - `unknown` — the archive explicitly records that the films do not say
 *                (only specs can be in this state)
 *  - `absent`  — the archive simply has nothing in this category for the armor
 *                (e.g. no alias, no other appearances)
 *
 * `unknown` and `absent` are never treated as equal to each other or to a value.
 */

export type CellFact = {
  text: string;
  basis: FactBasis;
  citations: Citation[];
};

export type CellItem = {
  /** Normalised key used for equality (tag, technology id, film id, …). */
  key: string;
  label: string;
  /** Optional link target (e.g. a technology page). */
  href?: string;
  facts: CellFact[];
};

export type CompareCell =
  | { status: "value"; items: CellItem[] }
  | { status: "unknown" }
  | { status: "absent" };

export type RowKind = "text" | "list" | "spec";

export type CompareRow = {
  id: string;
  label: string;
  kind: RowKind;
  /** Section the row belongs to, for grouping in the UI. */
  section: "identity" | "design" | "capabilities" | "technologies" | "limitations" | "specs";
  cells: CompareCell[];
  /** True when normalised values are not all equal across the compared armors. */
  differs: boolean;
};

export type CompareContext = {
  films: Film[];
  technologies: Technology[];
};

/* ---------------------------------------------------------------------------
 * Normalised equality
 * ------------------------------------------------------------------------- */

export function cellKeys(cell: CompareCell): string[] | null {
  return cell.status === "value" ? [...new Set(cell.items.map((i) => i.key))].sort() : null;
}

export function cellsEqual(a: CompareCell, b: CompareCell): boolean {
  if (a.status !== b.status) return false;
  if (a.status !== "value" || b.status !== "value") return true; // both unknown or both absent
  const ka = cellKeys(a)!;
  const kb = cellKeys(b)!;
  return ka.length === kb.length && ka.every((k, i) => k === kb[i]);
}

export function rowDiffers(cells: CompareCell[]): boolean {
  return cells.some((c) => !cellsEqual(c, cells[0]));
}

/** Keys present in every value cell (used to trim shared items in diff mode). */
export function sharedKeys(cells: CompareCell[]): Set<string> {
  const sets = cells.map((c) => new Set(cellKeys(c) ?? []));
  if (sets.length === 0 || cells.some((c) => c.status !== "value")) return new Set();
  return new Set([...sets[0]].filter((k) => sets.every((s) => s.has(k))));
}

/* ---------------------------------------------------------------------------
 * Row builders
 * ------------------------------------------------------------------------- */

const factOf = (f: { text: string; basis: FactBasis; citations: Citation[] }): CellFact => ({
  text: f.text,
  basis: f.basis,
  citations: f.citations,
});

function firstAppearanceRow(armors: Armor[], ctx: CompareContext): CompareRow {
  const filmsById = new Map(ctx.films.map((f) => [f.id, f]));
  const cells: CompareCell[] = armors.map((a) => {
    const film = filmsById.get(a.firstAppearanceFilmId);
    if (!film) return { status: "absent" };
    return {
      status: "value",
      items: [
        {
          key: film.id,
          label: `${film.title} (${film.releaseYear})`,
          facts: [
            {
              text: `First appears in ${film.title} (${film.releaseYear}).`,
              basis: "on-screen",
              citations: [{ sourceId: film.sourceId, locator: "Feature film." }],
            },
          ],
        },
      ],
    };
  });
  return { id: "first-appearance", label: "First appearance", kind: "text", section: "identity", cells, differs: rowDiffers(cells) };
}

function otherAppearancesRow(armors: Armor[], ctx: CompareContext): CompareRow {
  const filmsById = new Map(ctx.films.map((f) => [f.id, f]));
  const cells: CompareCell[] = armors.map((a) => {
    const others = a.appearanceFilmIds
      .filter((id) => id !== a.firstAppearanceFilmId)
      .map((id) => filmsById.get(id))
      .filter((f): f is Film => Boolean(f));
    if (others.length === 0) return { status: "absent" };
    return {
      status: "value",
      items: others.map((f) => ({
        key: f.id,
        label: `${f.title} (${f.releaseYear})`,
        facts: [
          {
            text: `Also used on-screen in ${f.title} (${f.releaseYear}).`,
            basis: "on-screen",
            citations: [{ sourceId: f.sourceId, locator: "Feature film." }],
          },
        ],
      })),
    };
  });
  return { id: "other-appearances", label: "Also appears in", kind: "list", section: "identity", cells, differs: rowDiffers(cells) };
}

function aliasRow(armors: Armor[]): CompareRow {
  const cells: CompareCell[] = armors.map((a) => {
    if (!a.alias) return { status: "absent" };
    const fact = a.facts.find((f) => f.id.endsWith("-designation-source")) ?? a.facts[0];
    return {
      status: "value",
      items: [
        {
          key: a.alias.toLowerCase(),
          label: a.alias,
          facts: fact
            ? [{ text: `Known as the ${a.alias} in the film and Marvel's official materials.`, basis: fact.basis, citations: fact.citations }]
            : [],
        },
      ],
    };
  });
  return { id: "alias", label: "Alias", kind: "text", section: "identity", cells, differs: rowDiffers(cells) };
}

function designationBasisRow(armors: Armor[]): CompareRow {
  const cells: CompareCell[] = armors.map((a) => {
    const fact = a.facts.find((f) => f.id.endsWith("-designation-source")) ?? a.facts.find((f) => f.basis === "dialogue");
    const spoken = a.designationBasis === "dialogue";
    return {
      status: "value",
      items: [
        {
          key: a.designationBasis,
          label: spoken ? "Spoken on-screen" : "Marvel official materials",
          facts: fact
            ? [
                {
                  text: spoken
                    ? `"${a.designation}" is spoken in the film.`
                    : `"${a.designation}" comes from Marvel's official materials; it is not spoken in the film.`,
                  basis: fact.basis,
                  citations: fact.citations,
                },
              ]
            : [],
        },
      ],
    };
  });
  return { id: "designation-basis", label: "Designation basis", kind: "text", section: "identity", cells, differs: rowDiffers(cells) };
}

function designRow(armors: Armor[]): CompareRow {
  const cells: CompareCell[] = armors.map((a) => ({
    status: "value",
    items: [
      {
        key: a.design.approach,
        label: DESIGN_APPROACH_LABELS[a.design.approach],
        facts: [factOf(a.design)],
      },
    ],
  }));
  return { id: "design-approach", label: "Design approach", kind: "text", section: "design", cells, differs: rowDiffers(cells) };
}

function taggedRow<T extends string>(
  id: string,
  label: string,
  section: CompareRow["section"],
  armors: Armor[],
  pick: (a: Armor) => { text: string; basis: FactBasis; citations: Citation[]; tags: T[] }[],
  labels: Record<T, string>,
): CompareRow {
  const cells: CompareCell[] = armors.map((a) => {
    const facts = pick(a);
    if (facts.length === 0) return { status: "absent" };
    const byTag = new Map<T, CellFact[]>();
    for (const f of facts) {
      for (const tag of f.tags) {
        const list = byTag.get(tag) ?? [];
        list.push(factOf(f));
        byTag.set(tag, list);
      }
    }
    const items: CellItem[] = [...byTag.entries()]
      .sort((x, y) => labels[x[0]].localeCompare(labels[y[0]]))
      .map(([tag, fs]) => ({ key: tag, label: labels[tag], facts: fs }));
    return { status: "value", items };
  });
  return { id, label, kind: "list", section, cells, differs: rowDiffers(cells) };
}

function technologiesRow(armors: Armor[], ctx: CompareContext): CompareRow {
  const techById = new Map(ctx.technologies.map((t) => [t.id, t]));
  const cells: CompareCell[] = armors.map((a) => {
    const techs = a.technologyIds.map((id) => techById.get(id)).filter((t): t is Technology => Boolean(t));
    if (techs.length === 0) return { status: "absent" };
    return {
      status: "value",
      items: techs.map((t) => ({
        key: t.id,
        label: t.name,
        href: `/technology/${t.id}`,
        facts: [],
      })),
    };
  });
  return { id: "technologies", label: "Related technologies", kind: "list", section: "technologies", cells, differs: rowDiffers(cells) };
}

function specRows(armors: Armor[]): CompareRow[] {
  return SPEC_KEYS.map((key) => {
    const cells: CompareCell[] = armors.map((a) => {
      const spec = a.specs[key];
      if (spec.status === "unknown") return { status: "unknown" };
      return {
        status: "value",
        items: [
          {
            key: spec.value.trim().toLowerCase(),
            label: spec.value,
            facts: [{ text: spec.value, basis: spec.basis, citations: spec.citations }],
          },
        ],
      };
    });
    return {
      id: `spec-${key}`,
      label: SPEC_LABELS[key],
      kind: "spec" as const,
      section: "specs" as const,
      cells,
      differs: rowDiffers(cells),
    };
  });
}

/** All comparison rows for the given armors, in display order. */
export function buildComparison(armors: Armor[], ctx: CompareContext): CompareRow[] {
  if (armors.length === 0) return [];
  return [
    firstAppearanceRow(armors, ctx),
    otherAppearancesRow(armors, ctx),
    aliasRow(armors),
    designationBasisRow(armors),
    designRow(armors),
    taggedRow("capabilities", "Capabilities", "capabilities", armors, (a) => a.capabilities, CAPABILITY_TAG_LABELS),
    technologiesRow(armors, ctx),
    taggedRow("limitations", "Known limitations", "limitations", armors, (a) => a.limitations, LIMITATION_TAG_LABELS),
    ...specRows(armors),
  ];
}

/**
 * "Show differences only": drop rows whose normalised values all match, and
 * within list rows drop the items shared by every armor.
 */
export function differencesOnly(rows: CompareRow[]): CompareRow[] {
  return rows
    .filter((row) => row.differs)
    .map((row) => {
      if (row.kind !== "list") return row;
      const shared = sharedKeys(row.cells);
      if (shared.size === 0) return row;
      return {
        ...row,
        cells: row.cells.map((cell) =>
          cell.status === "value"
            ? { status: "value", items: cell.items.filter((i) => !shared.has(i.key)) }
            : cell,
        ),
      };
    });
}

export const SECTION_LABELS: Record<CompareRow["section"], string> = {
  identity: "Identity & appearances",
  design: "Design approach",
  capabilities: "Capabilities",
  technologies: "Related technologies",
  limitations: "Known limitations",
  specs: "Specifications (film-stated only)",
};
