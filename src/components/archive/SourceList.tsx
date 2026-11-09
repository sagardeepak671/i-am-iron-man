import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Source } from "@/data/archive";
import { sourceNumber } from "@/data/archive";

const KIND_LABEL: Record<Source["kind"], string> = {
  film: "Feature film — primary source",
  "official-web": "Marvel.com — official",
};

export function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ol className="flex flex-col divide-y divide-white/6 border-y border-white/6">
      {sources.map((source) => {
        // Global registry number, so [n] means the same thing on every page.
        const n = sourceNumber(source.id);
        const unverified = source.verification.status === "unverified";
        return (
          <li
            key={source.id}
            id={`source-${n}`}
            className="grid scroll-mt-28 grid-cols-[3rem_1fr] gap-x-4 py-5 md:grid-cols-[3rem_1fr_auto]"
          >
            <span className="font-mono text-[12px] text-accent">[{n}]</span>
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-[15px] font-medium text-foreground">
                {source.title}
              </span>
              <span className="font-sans text-[13px] text-zinc-400">
                {source.publisher}
              </span>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1 break-all font-mono text-[11px] text-zinc-400 transition-colors hover:text-accent"
              >
                {source.url}
                <ArrowUpRight size={11} weight="bold" className="shrink-0" />
              </a>
              {source.note && (
                <span className="font-sans text-[12px] leading-relaxed text-zinc-500">
                  {source.note}
                </span>
              )}
            </div>
            <div className="col-start-2 mt-3 flex flex-col items-start gap-1 font-mono text-[10px] uppercase tracking-[0.22em] md:col-start-3 md:mt-0 md:items-end md:text-right">
              <span className="text-zinc-500">{KIND_LABEL[source.kind]}</span>
              {unverified ? (
                <span className="rounded-full border border-accent/40 px-2 py-0.5 text-accent">
                  Awaiting verification
                </span>
              ) : (
                <span className="text-zinc-400">
                  Accessed {source.accessDate}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
