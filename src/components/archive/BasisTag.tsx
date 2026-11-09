import type { FactBasis } from "@/data/archive";

const LABELS: Record<FactBasis, string> = {
  dialogue: "Dialogue",
  "on-screen": "On-screen",
  "official-materials": "Official materials",
};

const STYLES: Record<FactBasis, string> = {
  dialogue: "border-accent/40 text-accent",
  "on-screen": "border-white/15 text-zinc-300",
  "official-materials": "border-white/10 text-zinc-500",
};

export function BasisTag({ basis }: { basis: FactBasis }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] ${STYLES[basis]}`}
    >
      {LABELS[basis]}
    </span>
  );
}
