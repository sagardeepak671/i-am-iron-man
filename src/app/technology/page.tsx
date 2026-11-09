import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { SuitExplorer } from "@/components/technology/SuitExplorer";
import { TechnologyListCard } from "@/components/technology/TechnologyListCard";
import { TECHNOLOGIES } from "@/data/archive";
import { buildExplorerParts } from "@/lib/explorer-data";

export const metadata: Metadata = {
  title: "Technology — Stark Industries Archive",
  description:
    "The six suit systems of the MCU Iron Man armors — arc reactor, repulsors, flight, helmet and HUD, onboard AI, nanotechnology — with a conceptual suit diagram.",
};

export default function TechnologyPage() {
  const parts = buildExplorerParts();
  return (
    <>
      <Navbar />
      <main id="main">
        <section className="relative overflow-hidden bg-background px-6 pb-12 pt-36 md:px-10 md:pb-16 md:pt-44">
          <div className="pointer-events-none absolute left-6 top-24 text-accent md:left-10 md:top-28">
            <HudFrame corner="tl" size={26} />
          </div>
          <div className="pointer-events-none absolute right-6 top-24 text-accent md:right-10 md:top-28">
            <HudFrame corner="tr" size={26} />
          </div>
          <div className="mx-auto flex max-w-[1400px] flex-col gap-7">
            <nav aria-label="Breadcrumb" className="font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-500">
              <ol className="flex flex-wrap items-center gap-2">
                <li><Link href="/" className="inline-block py-1.5 transition-colors hover:text-foreground">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/archive" className="inline-block py-1.5 transition-colors hover:text-foreground">Archive</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-zinc-300">Technology</li>
              </ol>
            </nav>
            <EyebrowBadge className="self-start">SYSTEMS // {TECHNOLOGIES.length} TOPICS</EyebrowBadge>
            <h1 className="max-w-[14ch] font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
              Suit <span className="text-accent">Technology</span>
            </h1>
            <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              Six systems, as the films show them. Pick a region of the suit to
              see what lives there, or go straight to a system below. Every
              statement carries a <span className="font-mono text-accent">[n]</span>{" "}
              marker to its source; anything the films never specify is listed
              as unknown.
            </p>
          </div>
        </section>

        <section
          id="explorer"
          aria-labelledby="explorer-h"
          className="scroll-mt-24 bg-background px-6 pb-20 md:px-10 md:pb-28"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
            <h2 id="explorer-h" className="font-sans text-3xl font-semibold leading-tight tracking-tighter text-foreground md:text-4xl">
              Suit explorer
            </h2>
            <SuitExplorer parts={parts} />
          </div>
        </section>

        <section
          id="topics"
          aria-labelledby="topics-h"
          className="scroll-mt-24 border-t border-white/5 bg-background px-6 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
            <div className="flex flex-col gap-4">
              <EyebrowBadge className="self-start">INDEX // ALL SYSTEMS</EyebrowBadge>
              <h2 id="topics-h" className="font-sans text-4xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-5xl">
                Systems
              </h2>
            </div>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {TECHNOLOGIES.map((t) => (
                <TechnologyListCard key={t.id} technology={t} />
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
