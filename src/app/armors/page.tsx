import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { ArmorControls } from "@/components/armors/ArmorControls";
import { ArmorListCard } from "@/components/armors/ArmorListCard";
import { CompareTray } from "@/components/compare/CompareTray";
import { armorLabels } from "@/lib/compare-labels";
import { ARMORS, FILMS, getFilm } from "@/data/archive";
import {
  applyArmorQuery,
  filmFilterOptions,
  isDefaultQuery,
  parseArmorQuery,
  type RawSearchParams,
} from "@/lib/armor-query";

export const metadata: Metadata = {
  title: "Armors — Stark Industries Archive",
  description:
    "Every Iron Man armor in the archive, Mark I through Mark LXXXV. Search, filter by first appearance, and sort.",
};

type Props = { searchParams: Promise<RawSearchParams> };

export default async function ArmorsPage({ searchParams }: Props) {
  // The URL is the source of truth: parse (tolerantly), filter, render.
  const query = parseArmorQuery(await searchParams, FILMS);
  const results = applyArmorQuery(ARMORS, query, FILMS);
  const filmOptions = filmFilterOptions(ARMORS, FILMS);
  const activeFilm = query.film ? getFilm(query.film) : undefined;

  return (
    <>
      <Navbar />
      <main id="main">
        <section className="relative overflow-hidden bg-background px-6 pb-10 pt-36 md:px-10 md:pb-14 md:pt-44">
          <div className="pointer-events-none absolute left-6 top-24 text-accent md:left-10 md:top-28">
            <HudFrame corner="tl" size={26} />
          </div>
          <div className="pointer-events-none absolute right-6 top-24 text-accent md:right-10 md:top-28">
            <HudFrame corner="tr" size={26} />
          </div>

          <div className="mx-auto flex max-w-[1400px] flex-col gap-7">
            <nav aria-label="Breadcrumb" className="font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-500">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="inline-block py-1.5 transition-colors hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/archive" className="inline-block py-1.5 transition-colors hover:text-foreground">
                    Archive
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-zinc-300">
                  Armors
                </li>
              </ol>
            </nav>

            <EyebrowBadge className="self-start">HALL OF ARMOR // {ARMORS.length} RECORDS</EyebrowBadge>
            <h1 className="max-w-[14ch] font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
              Hall of <span className="text-accent">Armor</span>
            </h1>
            <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              Every armor in the archive, Mark I through Mark LXXXV. Search by
              designation, alias, or film; filter by first appearance; sort by
              release order or name. The address bar keeps your view, so you
              can share it or come back to it.
            </p>

            <a href="#results" className="sr-only-focusable font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              Skip to results
            </a>

            <ArmorControls
              query={query}
              films={filmOptions}
              resultCount={results.length}
              totalCount={ARMORS.length}
            />
          </div>
        </section>

        <section
          id="results"
          aria-label="Armor results"
          className="scroll-mt-24 bg-background px-6 pb-28 pt-6 md:px-10 md:pb-40"
        >
          <div className="mx-auto max-w-[1400px]">
            <h2 className="sr-only">Results</h2>
            {results.length > 0 ? (
              <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {results.map((armor) => (
                  <ArmorListCard
                    key={armor.id}
                    armor={armor}
                    film={getFilm(armor.firstAppearanceFilmId)}
                  />
                ))}
              </ul>
            ) : (
              <div className="card-surface relative flex flex-col items-start gap-5 p-8 md:p-12">
                <span className="pointer-events-none absolute left-3 top-3 text-accent/70">
                  <HudFrame corner="tl" size={18} />
                </span>
                <span className="pointer-events-none absolute bottom-3 right-3 text-accent/70">
                  <HudFrame corner="br" size={18} />
                </span>
                <EyebrowBadge>NO MATCH // 0 RECORDS</EyebrowBadge>
                <h2 className="font-sans text-3xl font-semibold leading-tight tracking-tighter text-foreground md:text-4xl">
                  Nothing in the hall matches
                  {query.q && (
                    <>
                      {" "}
                      &ldquo;<span className="text-accent">{query.q}</span>&rdquo;
                    </>
                  )}
                  {activeFilm && (
                    <>
                      {" "}
                      in <span className="text-accent">{activeFilm.title}</span>
                    </>
                  )}
                  .
                </h2>
                <p className="max-w-[50ch] font-sans text-base leading-relaxed text-zinc-400">
                  The archive covers nine armors from the films. Try a
                  designation like <em>Mark L</em>, an alias like{" "}
                  <em>Hulkbuster</em>, or a film title
                  {activeFilm ? ", or widen the film filter" : ""}. Armors that
                  are not in the archive (for example the Mark IV or Mark XLII)
                  will not appear.
                </p>
                <div className="flex flex-wrap gap-3">
                  {!isDefaultQuery(query) && (
                    <Link
                      href="/armors"
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition-all duration-200 hover:bg-white/[0.1] active:translate-y-[1px]"
                    >
                      Clear filters
                    </Link>
                  )}
                  {activeFilm && query.q && (
                    <Link
                      href={`/armors?q=${encodeURIComponent(query.q)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:text-accent"
                    >
                      Search all films
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CompareTray labels={armorLabels()} />
    </>
  );
}
