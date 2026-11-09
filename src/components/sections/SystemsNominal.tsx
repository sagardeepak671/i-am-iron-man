import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { resolveReadout } from "@/lib/systems-readout";

export function SystemsNominal() {
  const readout = resolveReadout();

  return (
    <section
      id="systems"
      className="relative border-t border-white/5 bg-background px-6 pb-28 pt-24 md:px-10 md:pb-40 md:pt-32"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-16 md:grid md:grid-cols-[5fr_4fr] md:gap-20">
        <AnimatedSection className="flex flex-col gap-8">
          <AnimatedItem>
            <EyebrowBadge>F.R.I.D.A.Y. // SYSTEMS NOMINAL</EyebrowBadge>
          </AnimatedItem>
          <AnimatedItem>
            <h2 className="max-w-[16ch] font-sans text-4xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-6xl">
              &ldquo;And I&hellip; am&hellip;{" "}
              <span className="text-accent">Iron Man.</span>&rdquo;
            </h2>
          </AnimatedItem>
          <AnimatedItem>
            <p className="max-w-[48ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              A snap heard around the universe. The Mark LXXXV is the last
              armor Tony Stark wore, and the one that carried the Infinity
              Stones. The readouts here are limited to what the films actually
              state &mdash; everything else reads Unknown, and the full record
              lives in the archive.
            </p>
          </AnimatedItem>
          <AnimatedItem>
            <Link
              href="/archive"
              className="group inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/[0.08] active:translate-y-[1px]"
            >
              Open Armor Archive
              <ArrowUpRight
                size={14}
                weight="bold"
                className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </AnimatedItem>
        </AnimatedSection>

        <AnimatedSection className="flex flex-col divide-y divide-white/8 border-t border-white/8 font-mono md:mt-3">
          {readout.map((row) => (
            <AnimatedItem key={row.label}>
              <div className="flex items-baseline justify-between gap-6 py-5">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                    {row.label}
                  </span>
                  <span className="font-sans text-[13px] text-zinc-400">
                    {row.note}
                    {row.sourceNumbers.length > 0 && (
                      <sup className="ml-1 font-mono text-[9px] text-accent">
                        {row.sourceNumbers.map((n, i) => (
                          <a
                            key={n}
                            href={`/archive#source-${n}`}
                            title={row.sourceTitles[i]}
                            className="transition-colors hover:text-foreground"
                          >
                            [{n}]
                          </a>
                        ))}
                      </sup>
                    )}
                  </span>
                </div>
                {row.status === "stated" ? (
                  <span className="text-right text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    {row.value}
                  </span>
                ) : (
                  <span className="text-right text-2xl font-semibold tracking-tight text-zinc-600 md:text-3xl">
                    Unknown
                  </span>
                )}
              </div>
            </AnimatedItem>
          ))}
          <AnimatedItem>
            <p className="pt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-zinc-600">
              Film-stated values only &nbsp;&middot;&nbsp; [n] = archive source
            </p>
          </AnimatedItem>
        </AnimatedSection>
      </div>
    </section>
  );
}
