import type { Specs } from "@/data/archive";
import { SPEC_KEYS, SPEC_LABELS } from "@/data/archive";
import { CitationMarks } from "./CitationMarks";

export function SpecTable({ specs }: { specs: Specs }) {
  return (
    <dl className="divide-y divide-white/6 border-y border-white/6 font-mono">
      {SPEC_KEYS.map((key) => {
        const spec = specs[key];
        return (
          <div key={key} className="flex items-baseline justify-between gap-6 py-2.5">
            <dt className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              {SPEC_LABELS[key]}
            </dt>
            <dd className="max-w-[70%] text-right text-[12px] leading-snug">
              {spec.status === "stated" ? (
                <span className="text-foreground">
                  {spec.value}
                  <CitationMarks citations={spec.citations} />
                </span>
              ) : (
                <span className="text-zinc-600">Unknown</span>
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
