"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MAX_COMPARE, compareHref } from "@/lib/compare-selection";

type Option = { id: string; label: string };

type Props = {
  ids: string[];
  diff: boolean;
  /** Armors not yet selected, for the "add" picker. */
  options: Option[];
};

/**
 * "Show differences only" and "Add armor" controls for /compare. Both write
 * to the URL (push, so Back undoes them) so the view is shareable; without JavaScript the same
 * controls submit as a plain GET form.
 */
export function CompareControls({ ids, diff, options }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const go = (href: string) => startTransition(() => router.push(href, { scroll: false }));
  const canAdd = ids.length < MAX_COMPARE && options.length > 0;

  // Optimistic checkbox: flip immediately, then resync when the URL-derived
  // prop changes (React's "adjust state on prop change" pattern, no effect).
  const [checked, setChecked] = useState(diff);
  const [prevDiff, setPrevDiff] = useState(diff);
  if (diff !== prevDiff) {
    setPrevDiff(diff);
    setChecked(diff);
  }

  return (
    <form
      method="get"
      action="/compare"
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label="Comparison options"
    >
      <input type="hidden" name="ids" value={ids.join(",")} />

      <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-200 transition-colors hover:border-white/25">
        <input
          type="checkbox"
          name="diff"
          value="1"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            go(compareHref(ids, e.target.checked));
          }}
          className="h-4 w-4 accent-[#d4a22f]"
        />
        Show differences only
      </label>

      {canAdd && (
        <div className="flex flex-col gap-2">
          <label htmlFor="compare-add" className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
            Add armor ({ids.length} of {MAX_COMPARE})
          </label>
          <div className="flex gap-2">
            <select
              id="compare-add"
              name="add"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) go(compareHref([...ids, e.target.value], diff));
              }}
              className="hud-select h-11 min-w-[220px] rounded-full border border-white/12 bg-white/[0.04] pl-4 pr-9 font-mono text-[12px] tracking-[0.08em] text-foreground transition-colors hover:border-white/20 focus:border-accent/60 focus:outline-none"
            >
              <option value="">Choose an armor…</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <noscript>
              <button type="submit" className="h-11 rounded-full border border-white/15 px-4 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
                Apply
              </button>
            </noscript>
          </div>
        </div>
      )}

      {isPending && (
        <span role="status" className="font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-600">
          Updating…
        </span>
      )}
    </form>
  );
}
