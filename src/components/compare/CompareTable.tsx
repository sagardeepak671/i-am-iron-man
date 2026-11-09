import Link from "next/link";
import { X } from "@phosphor-icons/react/dist/ssr";
import type { Armor } from "@/data/archive";
import { BasisTag } from "@/components/archive/BasisTag";
import { CitationMarks } from "@/components/archive/CitationMarks";
import { SECTION_LABELS, type CompareCell, type CompareRow } from "@/lib/compare";
import { compareHref } from "@/lib/compare-selection";

type Props = {
  armors: Armor[];
  rows: CompareRow[];
  diff: boolean;
};

function Cell({ cell, rowId }: { cell: CompareCell; rowId: string }) {
  if (cell.status === "unknown") {
    return (
      <p className="font-mono text-[12px] text-zinc-500">
        <span className="text-zinc-400">Unknown</span>
        <span className="block font-sans text-[11.5px] text-zinc-600">Not stated in the films</span>
      </p>
    );
  }
  if (cell.status === "absent") {
    return (
      <p className="font-mono text-[12px] text-zinc-600">
        <span aria-hidden>—</span>
        <span className="block font-sans text-[11.5px]">None on record</span>
      </p>
    );
  }
  if (cell.items.length === 0) {
    return (
      <p className="font-sans text-[12px] italic text-zinc-600">Nothing unique here</p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {cell.items.map((item) => (
        <li key={`${rowId}-${item.key}`} className="flex flex-col gap-1.5">
          {item.href ? (
            <Link
              href={item.href}
              className="self-start font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-100 underline decoration-white/20 underline-offset-4 transition-colors hover:text-accent"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-sans text-[14px] font-medium leading-snug text-foreground">
              {item.label}
            </span>
          )}
          {item.facts.map((f, i) => (
            <p key={i} className="flex items-start gap-2 font-sans text-[12.5px] leading-relaxed text-zinc-400">
              <span className="flex-1">
                {f.text}
                <CitationMarks citations={f.citations} />
              </span>
              <BasisTag basis={f.basis} />
            </p>
          ))}
        </li>
      ))}
    </ul>
  );
}

/**
 * Comparison table. On `md+` it is a real table with one column per armor and
 * a sticky header row; below `md` each row becomes a stacked block with the
 * armor name repeated inside every cell so nothing depends on column position.
 */
export function CompareTable({ armors, rows, diff }: Props) {
  const ids = armors.map((a) => a.id);
  const sections = [...new Set(rows.map((r) => r.section))];
  const colClass = armors.length === 3 ? "md:w-[27%]" : "md:w-[38%]";

  // No overflow wrapper: it would become the sticky header's scroll container
  // and push the header row into the first section. Mobile stacks rows, and
  // on md+ the columns always fit, so horizontal scrolling is never needed.
  return (
    <div>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Comparison of {armors.map((a) => a.designation).join(", ")}
          {diff ? " — differences only" : ""}
        </caption>
        <thead className="hidden md:table-header-group">
          <tr className="sticky top-[76px] z-10 bg-background/95 backdrop-blur-xl">
            <th scope="col" className="w-[19%] border-b border-white/10 py-4 pr-4 text-left font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
              Category
            </th>
            {armors.map((a) => (
              <th key={a.id} scope="col" className={`${colClass} border-b border-white/10 px-4 py-4 text-left align-top`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex flex-col gap-0.5">
                    <Link href={`/armors/${a.id}`} className="font-sans text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-accent">
                      {a.designation}
                    </Link>
                    {a.alias && <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">{a.alias}</span>}
                  </span>
                  {armors.length > 2 && (
                    <Link
                      href={compareHref(ids.filter((id) => id !== a.id), diff)}
                      aria-label={`Remove ${a.designation} from comparison`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition-colors hover:border-accent/50 hover:text-accent"
                    >
                      <X size={11} weight="bold" aria-hidden />
                    </Link>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {sections.map((section) => {
          const sectionRows = rows.filter((r) => r.section === section);
          return (
            <tbody key={section} className="block md:table-row-group">
              <tr className="block md:table-row">
                <th
                  scope="rowgroup"
                  colSpan={armors.length + 1}
                  className="block border-b border-white/6 pb-2 pt-8 text-left font-mono text-[10px] uppercase tracking-[0.28em] text-accent md:table-cell md:pt-10"
                >
                  {SECTION_LABELS[section]}
                </th>
              </tr>
              {sectionRows.map((row) => (
                <tr key={row.id} className="block border-b border-white/6 py-4 md:table-row md:py-0">
                  <th
                    scope="row"
                    className="block pb-2 pr-4 text-left align-top font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-400 md:table-cell md:py-5"
                  >
                    {row.label}
                    {row.differs && (
                      <span className="ml-2 inline-block rounded-full border border-accent/40 px-1.5 py-0.5 text-[8px] tracking-[0.18em] text-accent">
                        differs
                      </span>
                    )}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td
                      key={armors[i].id}
                      className="block border-t border-white/4 py-3 align-top md:table-cell md:border-t-0 md:border-l md:border-white/6 md:px-4 md:py-5"
                    >
                      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-500 md:hidden">
                        {armors[i].designation}
                      </span>
                      <Cell cell={cell} rowId={row.id} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
