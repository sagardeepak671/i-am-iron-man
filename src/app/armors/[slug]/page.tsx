import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { ArmorImage } from "@/components/armors/ArmorImage";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { CompareTray } from "@/components/compare/CompareTray";
import { armorLabels } from "@/lib/compare-labels";
import { compareHref } from "@/lib/compare-selection";
import { DESIGN_APPROACH_LABELS } from "@/data/archive/types";
import { FactList } from "@/components/archive/FactList";
import { SpecTable } from "@/components/archive/SpecTable";
import { SourceList } from "@/components/archive/SourceList";
import { CitationMarks } from "@/components/archive/CitationMarks";
import {
  SOURCES,
  armorSourceIds,
  armorsByMark,
  getFilm,
  getTechnology,
} from "@/data/archive";
import { ARMOR_SLUGS, resolveArmorSlug } from "@/lib/armor-slug";

type Props = { params: Promise<{ slug: string }> };

/** Known slugs are prerendered; anything else is resolved on demand. */
export function generateStaticParams() {
  return ARMOR_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = resolveArmorSlug(slug);
  if (r.status === "not-found") return { title: "Armor not found — Stark Industries Archive" };
  const film = getFilm(r.armor.firstAppearanceFilmId);
  return {
    title: `${r.armor.designation}${r.armor.alias ? ` (${r.armor.alias})` : ""} — Armor Archive`,
    description: `${r.armor.summary} First appearance: ${film ? `${film.title} (${film.releaseYear})` : "unknown"}.`,
  };
}

const sectionHeading =
  "font-sans text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl";
const sectionLabel = "font-mono text-[10px] uppercase tracking-[0.28em] text-accent";

export default async function ArmorDetailPage({ params }: Props) {
  const { slug } = await params;
  const resolution = resolveArmorSlug(slug);

  if (resolution.status === "not-found") notFound();
  if (resolution.status === "redirect") {
    permanentRedirect(`/armors/${resolution.canonical}`);
  }

  const armor = resolution.armor;
  const firstFilm = getFilm(armor.firstAppearanceFilmId);
  const firstFilmSource = firstFilm ? SOURCES.find((s) => s.id === firstFilm.sourceId) : undefined;
  const otherFilms = armor.appearanceFilmIds
    .filter((id) => id !== armor.firstAppearanceFilmId)
    .map(getFilm)
    .filter((f): f is NonNullable<typeof f> => Boolean(f));
  const technologies = armor.technologyIds
    .map(getTechnology)
    .filter((t): t is NonNullable<typeof t> => Boolean(t));
  const citedSources = armorSourceIds(armor)
    .map((id) => SOURCES.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const ordered = armorsByMark();
  const index = ordered.findIndex((a) => a.id === armor.id);
  const prev = index > 0 ? ordered[index - 1] : null;
  const next = index < ordered.length - 1 ? ordered[index + 1] : null;

  return (
    <>
      <Navbar />
      <main id="main">
        {/* ---------------------------------------------------------------- */}
        <section className="relative overflow-hidden bg-background px-6 pb-16 pt-36 md:px-10 md:pb-24 md:pt-44">
          <div className="pointer-events-none absolute left-6 top-24 text-accent md:left-10 md:top-28">
            <HudFrame corner="tl" size={26} />
          </div>
          <div className="pointer-events-none absolute right-6 top-24 text-accent md:right-10 md:top-28">
            <HudFrame corner="tr" size={26} />
          </div>

          <div className="mx-auto flex max-w-[1400px] flex-col gap-10">
            <nav aria-label="Breadcrumb" className="font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-500">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="inline-block py-1.5 transition-colors hover:text-foreground">Home</Link>
                </li>
                <li aria-hidden>/</li>
                <li>
                  <Link href="/armors" className="inline-block py-1.5 transition-colors hover:text-foreground">Armors</Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-zinc-300">{armor.designation}</li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
              <div className="flex flex-col gap-6">
                <EyebrowBadge className="self-start">
                  {armor.designation.toUpperCase()}
                  {firstFilm ? ` // ${firstFilm.title.toUpperCase()} — ${firstFilm.releaseYear}` : ""}
                </EyebrowBadge>
                <h1 className="font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
                  {armor.designation}
                  {armor.alias && (
                    <span className="block text-2xl font-medium tracking-tight text-accent md:text-4xl">
                      {armor.alias}
                    </span>
                  )}
                </h1>
                <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
                  {armor.summary}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <CompareToggle armorId={armor.id} designation={armor.designation} variant="button" />
                  <Link
                    href={compareHref([armor.id])}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:text-accent"
                  >
                    Compare with another armor
                    <ArrowUpRight size={12} weight="bold" />
                  </Link>
                </div>

                {/* First appearance */}
                <dl className="grid grid-cols-1 gap-4 border-t border-white/8 pt-5 font-mono sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">First appearance</dt>
                    <dd className="text-[13px] text-foreground">
                      {firstFilm ? `${firstFilm.title} (${firstFilm.releaseYear})` : "Unknown"}
                      {firstFilmSource && (
                        <CitationMarks
                          citations={[{ sourceId: firstFilmSource.id, locator: "Feature film." }]}
                        />
                      )}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">Also appears in</dt>
                    <dd className="text-[13px] text-zinc-300">
                      {otherFilms.length > 0
                        ? otherFilms.map((f) => `${f.title} (${f.releaseYear})`).join(" · ")
                        : "No other film in this archive"}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">Designation</dt>
                    <dd className="text-[13px] text-zinc-300">
                      Mark {armor.markNumber} &mdash;{" "}
                      {armor.designationBasis === "dialogue"
                        ? "spoken on-screen"
                        : "from Marvel's official materials"}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">Design approach</dt>
                    <dd className="text-[13px] text-zinc-300">
                      <span className="text-foreground">{DESIGN_APPROACH_LABELS[armor.design.approach]}</span>
                      <span className="block font-sans text-[12.5px] leading-relaxed text-zinc-400">
                        {armor.design.text}
                        <CitationMarks citations={armor.design.citations} />
                      </span>
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">Systems</dt>
                    <dd className="text-[13px] text-zinc-300">
                      {technologies.map((t) => t.name).join(" · ")}
                    </dd>
                  </div>
                </dl>
              </div>

              <ArmorImage armor={armor} variant="hero" priority />
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-white/5 bg-background px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(0,1.4fr)] lg:gap-20">
            {/* In-page nav + specs (sticky on large screens) */}
            <aside className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
              <nav aria-label="On this page" className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
                {[
                  ["overview", "Overview"],
                  ["capabilities", "Capabilities"],
                  ["limitations", "Known limitations"],
                  ["technologies", "Related technologies"],
                  ["sources", "Citations"],
                ].map(([id, label]) => (
                  <a key={id} href={`#${id}`} className="inline-block py-1 text-zinc-400 transition-colors hover:text-foreground">
                    {label}
                  </a>
                ))}
              </nav>
              <div>
                <h2 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
                  Specifications — only what the films state
                </h2>
                <SpecTable specs={armor.specs} />
              </div>
            </aside>

            <div className="flex flex-col gap-16">
              <section id="overview" aria-labelledby="overview-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>01 // Overview</span>
                <h2 id="overview-h" className={sectionHeading}>On record</h2>
                <FactList facts={armor.facts} />
              </section>

              <section id="capabilities" aria-labelledby="capabilities-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>02 // Capabilities</span>
                <h2 id="capabilities-h" className={sectionHeading}>What it is shown doing</h2>
                <FactList facts={armor.capabilities} />
              </section>

              <section id="limitations" aria-labelledby="limitations-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>03 // Known limitations</span>
                <h2 id="limitations-h" className={sectionHeading}>Where it failed or fell short</h2>
                <FactList facts={armor.limitations} />
              </section>

              <section id="technologies" aria-labelledby="technologies-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>04 // Related technologies</span>
                <h2 id="technologies-h" className={sectionHeading}>Systems demonstrated</h2>
                <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {technologies.map((t) => (
                    <li key={t.id} className="list-none">
                      <Link
                        href={`/technology/${t.id}`}
                        className="card-surface group flex h-full flex-col gap-2 p-5 transition-[border-color] hover:border-accent/40"
                      >
                        <span className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.26em] text-accent">
                          {t.name}
                          <ArrowUpRight
                            size={12}
                            weight="bold"
                            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </span>
                        <span className="font-sans text-[13.5px] leading-relaxed text-zinc-400">
                          {t.summary}
                        </span>
                        <span className="mt-auto pt-2 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                          {t.facts.length} facts in archive
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>

              <section id="sources" aria-labelledby="sources-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>05 // Citations</span>
                <h2 id="sources-h" className={sectionHeading}>Sources cited on this page</h2>
                <p className="max-w-[60ch] font-sans text-[14px] leading-relaxed text-zinc-500">
                  Numbers match the full registry on the{" "}
                  <Link href="/archive#sources" className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-accent">
                    archive page
                  </Link>
                  . Hover or focus a <span className="font-mono text-accent">[n]</span> marker to see which scene supports the fact.
                </p>
                <SourceList sources={citedSources} />
              </section>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <nav
          aria-label="Previous and next armor"
          className="border-t border-white/5 bg-background px-6 py-10 md:px-10 md:py-14"
        >
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 sm:grid-cols-2">
            {prev ? (
              <Link
                href={`/armors/${prev.id}`}
                rel="prev"
                className="card-surface group flex items-center gap-4 p-5 transition-[border-color] hover:border-accent/40"
              >
                <ArrowLeft size={16} weight="bold" className="shrink-0 text-accent transition-transform group-hover:-translate-x-0.5" />
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">Previous</span>
                  <span className="font-sans text-base font-medium text-foreground">
                    {prev.designation}
                    {prev.alias ? ` · ${prev.alias}` : ""}
                  </span>
                </span>
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {next && (
              <Link
                href={`/armors/${next.id}`}
                rel="next"
                className="card-surface group flex items-center justify-end gap-4 p-5 text-right transition-[border-color] hover:border-accent/40"
              >
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">Next</span>
                  <span className="font-sans text-base font-medium text-foreground">
                    {next.designation}
                    {next.alias ? ` · ${next.alias}` : ""}
                  </span>
                </span>
                <ArrowRight size={16} weight="bold" className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </nav>
      </main>
      <Footer />
      <CompareTray labels={armorLabels()} />
    </>
  );
}
