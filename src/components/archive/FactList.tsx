import type { Fact } from "@/data/archive";
import { BasisTag } from "./BasisTag";
import { CitationMarks } from "./CitationMarks";

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <ul className="flex flex-col divide-y divide-white/6 border-t border-white/6">
      {facts.map((fact) => (
        <li key={fact.id} id={`fact-${fact.id}`} className="flex items-start gap-3 py-3">
          <span
            aria-hidden
            className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-accent/70"
          />
          <p className="flex-1 font-sans text-[13.5px] leading-relaxed text-zinc-300">
            {fact.text}
            <CitationMarks citations={fact.citations} />
          </p>
          <BasisTag basis={fact.basis} />
        </li>
      ))}
    </ul>
  );
}
