import type { Metadata } from "next";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { AnimatedItem, AnimatedSection } from "@/components/ui/AnimatedSection";
import { ArmorCard } from "@/components/archive/ArmorCard";
import { TechnologyCard } from "@/components/archive/TechnologyCard";
import { SourceList } from "@/components/archive/SourceList";
import { ARCHIVE, archiveStats, armorsByMark } from "@/data/archive";
import { assertArchiveIntegrity } from "@/lib/archive-integrity";

export const metadata: Metadata = {
  title: "Armor & Technology Archive — Stark Industries",
  description:
    "MCU Iron Man armors and technologies, Iron Man (2008) through Avengers: Endgame (2019), with every fact tied to its source.",
};

export default function ArchivePage() {
  // The page is statically generated, so a data problem fails the build
  // instead of shipping a broken archive.
  const report = assertArchiveIntegrity(ARCHIVE);
  const stats = archiveStats();
  const armors = armorsByMark();

  const statRows: [string, string][] = [
    ["Armors", String(stats.armors)],
    ["Technologies", String(stats.technologies)],
    ["Films in scope", String(stats.films)],
    ["Facts on record", String(stats.facts)],
    ["Sources", String(stats.sources)],
    ["Awaiting verification", String(stats.unverifiedSources)],
    ["Integrity errors", String(report.errors.length)],
    ["Last reviewed", ARCHIVE.lastReviewed],
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-background px-6 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
          <div className="pointer-events-none absolute left-6 top-24 text-accent md:left-10 md:top-28">
            <HudFrame corner="tl" size={26} />
          </div>
          <div className="pointer-events-none absolute right-6 top-24 text-accent md:right-10 md:top-28">
            <HudFrame corner="tr" size={26} />
          </div>

          <div className="mx-auto flex max-w-[1400px] flex-col gap-16 md:grid md:grid-cols-[5fr_4fr] md:gap-20">
            <AnimatedSection className="flex flex-col gap-7">
              <AnimatedItem>
                <EyebrowBadge>ARCHIVE // FILMS 2008–2019</EyebrowBadge>
              </AnimatedItem>
              <AnimatedItem>
                <h1 className="max-w-[14ch] font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
                  Armor &amp;
                  <br />
                  <span className="text-accent">Technology</span> Archive
                </h1>
              </AnimatedItem>
              <AnimatedItem>
                <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
                  {ARCHIVE.scope}
                </p>
              </AnimatedItem>
              <AnimatedItem>
                <p className="max-w-[52ch] font-sans text-sm leading-relaxed text-zinc-500">
                  Bracketed markers like{" "}
                  <span className="font-mono text-accent">[1]</span>{" "}
                  point to the numbered source list at the foot of this page. Each fact
                  is tagged with how it is grounded: spoken dialogue, something
                  shown on-screen, or Marvel&rsquo;s official materials.
                </p>
              </AnimatedItem>
              <AnimatedItem>
                <nav className="flex flex-wrap gap-6 font-mono text-[11px] uppercase tracking-[0.24em] text-zinc-400">
                  <a href="#armors" className="inline-block py-1.5 transition-colors hover:text-foreground">
                    Armors
                  </a>
                  <a href="#technologies" className="inline-block py-1.5 transition-colors hover:text-foreground">
                    Technologies
                  </a>
                  <a href="#sources" className="inline-block py-1.5 transition-colors hover:text-foreground">
                    Sources
                  </a>
                </nav>
              </AnimatedItem>
            </AnimatedSection>

            <AnimatedSection className="flex flex-col divide-y divide-white/8 border-t border-white/8 font-mono md:mt-3">
              {statRows.map(([label, value]) => (
                <AnimatedItem key={label}>
                  <div className="flex items-baseline justify-between gap-6 py-4">
                    <span className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                      {label}
                    </span>
                    <span className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {value}
                    </span>
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedSection>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section
          id="armors"
          className="scroll-mt-20 border-t border-white/5 bg-background px-6 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
            <AnimatedSection className="flex flex-col gap-5">
              <AnimatedItem>
                <EyebrowBadge>HALL OF ARMOR // {armors.length} RECORDS</EyebrowBadge>
              </AnimatedItem>
              <AnimatedItem>
                <h2 className="font-sans text-4xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-5xl">
                  Armors
                </h2>
              </AnimatedItem>
              <AnimatedItem>
                <p className="max-w-[56ch] font-sans text-base leading-relaxed text-zinc-400">
                  Nine armors, in Mark order. Specification rows read{" "}
                  <span className="font-mono text-zinc-500">Unknown</span>{" "}
                  wherever the films give no figure &mdash; nothing here is
                  estimated.
                </p>
              </AnimatedItem>
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {armors.map((armor) => (
                <AnimatedSection key={armor.id}>
                  <AnimatedItem>
                    <ArmorCard armor={armor} />
                  </AnimatedItem>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section
          id="technologies"
          className="scroll-mt-20 border-t border-white/5 bg-background px-6 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
            <AnimatedSection className="flex flex-col gap-5">
              <AnimatedItem>
                <EyebrowBadge>
                  SYSTEMS // {ARCHIVE.technologies.length} TOPICS
                </EyebrowBadge>
              </AnimatedItem>
              <AnimatedItem>
                <h2 className="font-sans text-4xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-5xl">
                  Technologies
                </h2>
              </AnimatedItem>
              <AnimatedItem>
                <p className="max-w-[56ch] font-sans text-base leading-relaxed text-zinc-400">
                  Each topic lists what the films establish and, just as
                  deliberately, what they leave unsaid.
                </p>
              </AnimatedItem>
            </AnimatedSection>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {ARCHIVE.technologies.map((technology) => (
                <AnimatedSection key={technology.id}>
                  <AnimatedItem>
                    <TechnologyCard technology={technology} />
                  </AnimatedItem>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section
          id="sources"
          className="scroll-mt-20 border-t border-white/5 bg-background px-6 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
            <AnimatedSection className="flex flex-col gap-5">
              <AnimatedItem>
                <EyebrowBadge>SOURCES // {ARCHIVE.sources.length} ENTRIES</EyebrowBadge>
              </AnimatedItem>
              <AnimatedItem>
                <h2 className="font-sans text-4xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-5xl">
                  Sources
                </h2>
              </AnimatedItem>
              <AnimatedItem>
                <p className="max-w-[60ch] font-sans text-base leading-relaxed text-zinc-400">
                  The films are the primary sources; the URLs point to
                  Marvel&rsquo;s official pages for each. Entries marked{" "}
                  <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-accent">
                    awaiting verification
                  </span>{" "}
                  were recorded without web access and have no access date
                  until someone opens the page and confirms it.
                </p>
              </AnimatedItem>
            </AnimatedSection>

            <AnimatedSection>
              <AnimatedItem>
                <SourceList sources={ARCHIVE.sources} />
              </AnimatedItem>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
