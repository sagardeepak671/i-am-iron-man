import type { Citation } from "@/data/archive";
import { sourceNumber } from "@/data/archive";

type Props = { citations: Citation[]; className?: string };

/**
 * Inline `[n]` markers that jump to the numbered source list at the bottom of
 * the archive page. The hover title carries the scene/section locator.
 */
export function CitationMarks({ citations, className = "" }: Props) {
  return (
    <sup className={`ml-1 inline-flex gap-0.5 font-mono text-[9px] leading-none ${className}`}>
      {citations.map((c, i) => {
        const n = sourceNumber(c.sourceId);
        return (
          <a
            key={`${c.sourceId}-${i}`}
            href={`#source-${n}`}
            title={c.locator}
            className="text-accent transition-colors hover:text-foreground"
          >
            [{n}]
          </a>
        );
      })}
    </sup>
  );
}
