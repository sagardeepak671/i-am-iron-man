import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { FactList } from "@/components/archive/FactList";
import { SourceList } from "@/components/archive/SourceList";
import { CitationMarks } from "@/components/archive/CitationMarks";
import { BasisTag } from "@/components/archive/BasisTag";
import {
  SOURCES,
  TECHNOLOGIES,
  getArmor,
  getFilm,
  getTechnology,
  suitPartsForTechnology,
  technologySourceIds,
} from "@/data/archive";
import { TECHNOLOGY_SLUGS, resolveTechnologySlug } from "@/lib/technology-slug";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TECHNOLOGY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = resolveTechnologySlug(slug);
  if (r.status === "not-found") return { title: "Technology not found — Stark Industries Archive" };
  return {
    title: `${r.technology.name} — Technology Archive`,
    description: r.technology.summary,
  };
}

const sectionHeading =
  "font-sans text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl";
const sectionLabel = "font-mono text-[10px] uppercase tracking-[0.28em] text-accent";

export default async function TechnologyDetailPage({ params }: Props) {
  const { slug } = await params;
  const resolution = resolveTechnologySlug(slug);
  if (resolution.status === "not-found") notFound();
  if (resolution.status === "redirect") permanentRedirect(`/technology/${resolution.canonical}`);

  const tech = resolution.technology;
  const armors = tech.armorIds
    .map(getArmor)
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .sort((a, b) => a.markNumber - b.markNumber);
  const parts = suitPartsForTechnology(tech.id);
  const citedSources = technologySourceIds(tech)
    .map((id) => SOURCES.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const index = TECHNOLOGIES.findIndex((t) => t.id === tech.id);
  const prev = index > 0 ? TECHNOLOGIES[index - 1] : null;
  const next = index < TECHNOLOGIES.length - 1 ? TECHNOLOGIES[index + 1] : null;

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
                <li><Link href="/" className="inline-block py-1.5 transition-colors hover:text-foreground">Home</Link></li>
                <li aria-hidden>/</li>
                <li><Link href="/technology" className="inline-block py-1.5 transition-colors hover:text-foreground">Technology</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-zinc-300">{tech.name}</li>
              </ol>
            </nav>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
              <div className="flex flex-col gap-6">
                <EyebrowBadge className="self-start">
                  SYSTEM // {String(index + 1).padStart(2, "0")} OF {TECHNOLOGIES.length}
                </EyebrowBadge>
                <h1 className="font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
                  {tech.name}
                </h1>
                <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
                  {tech.summary}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-5 self-start border-t border-white/8 pt-5 font-mono sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">On the suit</dt>
                  <dd className="flex flex-wrap gap-2">
                    {parts.length > 0 ? parts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/technology#part-${p.id}`}
                        className="rounded-full border border-white/12 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {p.name}
                      </Link>
                    )) : <span className="text-[12px] text-zinc-500">Not shown on the diagram</span>}
                  </dd>
                </div>
                <div className="flex flex-col gap-1.5">
                  <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">Connected systems</dt>
                  <dd className="flex flex-wrap gap-2">
                    {[...new Set(tech.connections.map((c) => c.technologyId))].map((id) => (
                      <Link
                        key={id}
                        href={`/technology/${id}`}
                        className="rounded-full border border-white/12 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-zinc-300 transition-colors hover:border-accent/50 hover:text-accent"
                      >
                        {getTechnology(id)?.name ?? id}
                      </Link>
                    ))}
                  </dd>
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">Armors in this archive</dt>
                  <dd className="text-[13px] text-zinc-300">
                    {armors.map((a) => a.designation).join(" · ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <section className="border-t border-white/5 bg-background px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 lg:grid-cols-[1fr_minmax(0,1.4fr)] lg:gap-20">
            <aside className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
              <nav aria-label="On this page" className="flex flex-col gap-2 font-mono text-[11px] uppercase tracking-[0.24em]">
                {[
                  ["what-it-does", "What it does"],
                  ["connections", "Connected systems"],
                  ["armors", "Armors"],
                  ["limitations", "Known limitations"],
                  ["unknown", "Still unknown"],
                  ["sources", "Citations"],
                ].map(([id, label]) => (
                  <a key={id} href={`#${id}`} className="inline-block py-1 text-zinc-400 transition-colors hover:text-foreground">
                    {label}
                  </a>
                ))}
              </nav>
              <div className="rounded-2xl border border-dashed border-white/10 p-4">
                <h2 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
                  Citation rules
                </h2>
                <p className="font-sans text-[12.5px] leading-relaxed text-zinc-500">
                  Every statement is tagged dialogue, on-screen, or official
                  materials and carries a <span className="font-mono text-accent">[n]</span>{" "}
                  marker. No figures are estimated; what the films leave unsaid
                  stays in the &ldquo;Still unknown&rdquo; list.
                </p>
              </div>
            </aside>

            <div className="flex flex-col gap-16">
              <section id="what-it-does" aria-labelledby="what-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>01 // What it does</span>
                <h2 id="what-h" className={sectionHeading}>In the films</h2>
                <FactList facts={tech.facts} />
              </section>

              <section id="connections" aria-labelledby="conn-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>02 // Connected systems</span>
                <h2 id="conn-h" className={sectionHeading}>How it ties into the rest of the suit</h2>
                <ul className="flex flex-col divide-y divide-white/6 border-t border-white/6">
                  {tech.connections.map((conn) => {
                    const other = getTechnology(conn.technologyId);
                    return (
                      <li key={conn.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:gap-4">
                        <Link
                          href={`/technology/${conn.technologyId}`}
                          className="inline-flex w-full shrink-0 items-center justify-between gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-200 transition-colors hover:border-accent/50 hover:text-accent sm:w-44"
                        >
                          {other?.name ?? conn.technologyId}
                          <ArrowUpRight size={11} weight="bold" />
                        </Link>
                        <p className="flex-1 font-sans text-[13.5px] leading-relaxed text-zinc-300">
                          {conn.text}
                          <CitationMarks citations={conn.citations} />
                        </p>
                        <BasisTag basis={conn.basis} />
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section id="armors" aria-labelledby="armors-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>03 // Armors</span>
                <h2 id="armors-h" className={sectionHeading}>Armors that demonstrate it</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {armors.map((a) => {
                    const film = getFilm(a.firstAppearanceFilmId);
                    return (
                      <li key={a.id} className="list-none">
                        <Link
                          href={`/armors/${a.id}`}
                          className="card-surface group flex items-center justify-between gap-4 p-4 transition-[border-color] hover:border-accent/40"
                        >
                          <span className="flex flex-col gap-0.5">
                            <span className="font-sans text-[15px] font-medium text-foreground">
                              {a.designation}
                              {a.alias ? <span className="text-zinc-400"> · {a.alias}</span> : null}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500">
                              {film ? `${film.title} — ${film.releaseYear}` : ""}
                            </span>
                          </span>
                          <ArrowUpRight size={14} weight="bold" className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section id="limitations" aria-labelledby="lim-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>04 // Known limitations</span>
                <h2 id="lim-h" className={sectionHeading}>Where it failed or fell short</h2>
                <FactList facts={tech.limitations} />
              </section>

              <section id="unknown" aria-labelledby="unk-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>05 // Still unknown</span>
                <h2 id="unk-h" className={sectionHeading}>Not stated in the films</h2>
                <ul className="flex flex-col gap-2 rounded-2xl border border-dashed border-white/10 p-5">
                  {tech.knownUnknowns.map((item) => (
                    <li key={item} className="flex items-start gap-3 font-sans text-[13.5px] leading-relaxed text-zinc-500">
                      <span aria-hidden className="mt-[8px] inline-block h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section id="sources" aria-labelledby="src-h" className="scroll-mt-28 flex flex-col gap-4">
                <span className={sectionLabel}>06 // Citations</span>
                <h2 id="src-h" className={sectionHeading}>Sources cited on this page</h2>
                <p className="max-w-[60ch] font-sans text-[14px] leading-relaxed text-zinc-500">
                  Numbers match the full registry on the{" "}
                  <Link href="/archive#sources" className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-accent">
                    archive page
                  </Link>
                  .
                </p>
                <SourceList sources={citedSources} />
              </section>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        <nav aria-label="Previous and next technology" className="border-t border-white/5 bg-background px-6 py-10 md:px-10 md:py-14">
          <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 sm:grid-cols-2">
            {prev ? (
              <Link href={`/technology/${prev.id}`} rel="prev" className="card-surface group flex items-center gap-4 p-5 transition-[border-color] hover:border-accent/40">
                <ArrowLeft size={16} weight="bold" className="shrink-0 text-accent transition-transform group-hover:-translate-x-0.5" />
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">Previous</span>
                  <span className="font-sans text-base font-medium text-foreground">{prev.name}</span>
                </span>
              </Link>
            ) : <span aria-hidden />}
            {next && (
              <Link href={`/technology/${next.id}`} rel="next" className="card-surface group flex items-center justify-end gap-4 p-5 text-right transition-[border-color] hover:border-accent/40">
                <span className="flex flex-col gap-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">Next</span>
                  <span className="font-sans text-base font-medium text-foreground">{next.name}</span>
                </span>
                <ArrowRight size={16} weight="bold" className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </nav>
      </main>
      <Footer />
    </>
  );
}
