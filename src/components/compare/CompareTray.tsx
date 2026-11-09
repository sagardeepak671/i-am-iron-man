"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "@phosphor-icons/react";
import { MAX_COMPARE, MIN_COMPARE, canCompare, compareHref } from "@/lib/compare-selection";
import { useCompareSelection } from "./compare-store";

/**
 * Fixed bottom tray showing the current compare selection. Hidden until at
 * least one armor is selected. All controls are real buttons/links.
 */
export function CompareTray({ labels }: { labels: Record<string, string> }) {
  const { ids, remove, clear } = useCompareSelection();
  if (ids.length === 0) return null;

  const ready = canCompare(ids);
  const names = ids.map((id) => ({ id, name: labels[id] ?? id }));

  return (
    <>
    {/* Keeps the page footer reachable above the fixed tray. */}
    <div aria-hidden className="h-28 sm:h-20" />
    <section
      aria-label="Compare selection"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/80 px-4 py-3 backdrop-blur-2xl backdrop-saturate-150 md:px-8"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <p role="status" aria-live="polite" className="mr-1 font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-400">
            Compare <span className="text-foreground">{ids.length}</span> of {MAX_COMPARE}
            {!ready && <span className="text-zinc-600"> · pick {MIN_COMPARE - ids.length} more</span>}
          </p>
          <ul className="flex flex-wrap gap-2" aria-label="Selected armors">
            {names.map(({ id, name }) => (
              <li key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft pl-3 pr-1 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                {name}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  aria-label={`Remove ${name} from comparison`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-accent/20 hover:text-foreground"
                >
                  <X size={11} weight="bold" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-full border border-white/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:border-white/25 hover:text-foreground"
          >
            Clear
          </button>
          {ready ? (
            <Link
              href={compareHref(ids)}
              className="group inline-flex items-center gap-1.5 rounded-full border border-accent/60 bg-accent-soft px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent/20"
            >
              Compare {ids.length}
              <ArrowUpRight size={12} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600"
            >
              Compare
            </span>
          )}
        </div>
      </div>
    </section>
    </>
  );
}
