"use client";

import { useState } from "react";
import { Check, Plus } from "@phosphor-icons/react";
import { MAX_COMPARE, isFull } from "@/lib/compare-selection";
import { useCompareSelection } from "./compare-store";

type Props = {
  armorId: string;
  designation: string;
  /** `chip` for list cards, `button` for the detail page header. */
  variant?: "chip" | "button";
  className?: string;
};

/** Adds / removes one armor from the cross-page compare selection. */
export function CompareToggle({ armorId, designation, variant = "chip", className = "" }: Props) {
  const { ids, toggle } = useCompareSelection();
  const selected = ids.includes(armorId);
  const full = !selected && isFull(ids);
  const [note, setNote] = useState<string | null>(null);

  const onClick = () => {
    const r = toggle(armorId);
    setNote(r.rejected === "limit" ? `Limit of ${MAX_COMPARE} armors — remove one first.` : null);
  };

  const base =
    variant === "button"
      ? "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] transition-all duration-200 active:translate-y-[1px]"
      : "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors";
  const tone = selected
    ? "border-accent/60 bg-accent-soft text-accent hover:border-accent"
    : full
      ? "border-white/10 text-zinc-500 hover:border-white/15"
      : "border-white/15 bg-white/[0.04] text-foreground hover:border-accent/50 hover:text-accent";

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className}`}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={selected ? `Remove ${designation} from comparison` : `Add ${designation} to comparison`}
        aria-describedby={note ? `${armorId}-compare-note` : undefined}
        onClick={onClick}
        className={`${base} ${tone}`}
      >
        {selected ? <Check size={12} weight="bold" aria-hidden /> : <Plus size={12} weight="bold" aria-hidden />}
        {selected ? "In comparison" : "Compare"}
      </button>
      {note && (
        <span id={`${armorId}-compare-note`} role="status" className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">
          {note}
        </span>
      )}
    </span>
  );
}
