import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, X } from "@phosphor-icons/react/dist/ssr";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/sections/Footer";
import { EyebrowBadge } from "@/components/ui/EyebrowBadge";
import { HudFrame } from "@/components/ui/HudFrame";
import { CompareControls } from "@/components/compare/CompareControls";
import { CompareTable } from "@/components/compare/CompareTable";
import { CompareUrlSync } from "@/components/compare/CompareUrlSync";
import { FILMS, TECHNOLOGIES, armorsByMark, getArmor } from "@/data/archive";
import { buildComparison, differencesOnly } from "@/lib/compare";
import {
  MAX_COMPARE,
  compareHref,
  compareReadiness,
  parseCompareQuery,
  type RawCompareParams,
} from "@/lib/compare-selection";

export const metadata: Metadata = {
  title: "Compare armors — Stark Industries Archive",
  description:
    "Compare two or three Iron Man armors side by side on first appearance, design approach, capabilities, technologies, limitations, and film-stated specifications.",
};

type Props = { searchParams: Promise<RawCompareParams> };

const pill =
  "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-foreground transition-all duration-200 hover:bg-white/[0.08] active:translate-y-[1px]";

export default async function ComparePage({ searchParams }: Props) {
  const query = parseCompareQuery(await searchParams);
  const readiness = compareReadiness(query.ids);
  const selected = query.ids.map(getArmor).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const options = armorsByMark()
    .filter((a) => !query.ids.includes(a.id))
    .map((a) => ({ id: a.id, label: `${a.designation}${a.alias ? ` · ${a.alias}` : ""}` }));

  // Echo unknown tokens safely: printable characters only, bounded length.
  const safeToken = (t: string) => t.replace(/[^\w.-]/g, "?").slice(0, 24) || "?";
  const notices: string[] = [];
  if (query.invalid.length > 0) {
    notices.push(`Ignored ${query.invalid.length === 1 ? "an id that is" : "ids that are"} not in the archive: ${query.invalid.map((t) => `"${safeToken(t)}"`).join(", ")}.`);
  }
  if (query.duplicates.length > 0) {
    notices.push(`Removed duplicate ${query.duplicates.length === 1 ? "entry" : "entries"}: ${query.duplicates.join(", ")}.`);
  }
  if (query.overflow.length > 0) {
    notices.push(`Only ${MAX_COMPARE} armors can be compared at once; dropped ${query.overflow.join(", ")}.`);
  }

  const allRows = readiness.status === "ready" ? buildComparison(selected, { films: FILMS, technologies: TECHNOLOGIES }) : [];
  const rows = query.diff ? differencesOnly(allRows) : allRows;
  const hiddenCount = allRows.length - rows.length;

  return (
    <>
      <Navbar />
      <CompareUrlSync ids={query.ids} />
      <main id="main">
        <section className="relative overflow-hidden bg-background px-6 pb-10 pt-36 md:px-10 md:pb-12 md:pt-44">
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
                <li><Link href="/armors" className="inline-block py-1.5 transition-colors hover:text-foreground">Armors</Link></li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="text-zinc-300">Compare</li>
              </ol>
            </nav>

            <EyebrowBadge className="self-start">
              COMPARE // {selected.length} OF {MAX_COMPARE} SELECTED
            </EyebrowBadge>
            <h1 className="max-w-[14ch] font-sans text-5xl font-semibold leading-[0.95] tracking-tighter text-foreground md:text-7xl">
              Armor <span className="text-accent">comparison</span>
            </h1>
            <p className="max-w-[56ch] font-sans text-base leading-relaxed text-zinc-400 md:text-lg">
              Side by side, limited to what the archive records: first
              appearance, design approach, capabilities, related technologies,
              known limitations, and film-stated specifications. No scores,
              rankings, or estimated figures.
            </p>

            {notices.length > 0 && (
              <ul role="status" className="flex flex-col gap-1 rounded-2xl border border-accent/30 bg-accent-soft/40 p-4 font-sans text-[13px] leading-relaxed text-zinc-300">
                {notices.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}

            {/* Selected chips with remove links */}
            {selected.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">Selected</span>
                <ul className="flex flex-wrap items-center gap-2" aria-label="Selected armors">
                  {selected.map((a) => (
                    <li key={a.id} className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft pl-4 pr-1 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                      <Link href={`/armors/${a.id}`} className="py-2 transition-colors hover:text-foreground">
                        {a.designation}
                      </Link>
                      <Link
                        href={compareHref(query.ids.filter((id) => id !== a.id), query.diff)}
                        aria-label={`Remove ${a.designation} from comparison`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-accent/20 hover:text-foreground"
                      >
                        <X size={11} weight="bold" aria-hidden />
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href="/compare" className="inline-flex items-center gap-1.5 rounded-full border border-white/12 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:border-white/25 hover:text-foreground">
                      <X size={10} weight="bold" aria-hidden /> Clear all
                    </Link>
                  </li>
                </ul>
              </div>
            )}

            <CompareControls ids={query.ids} diff={query.diff} options={options} />
          </div>
        </section>

        <section className="bg-background px-6 pb-28 md:px-10 md:pb-40" aria-label="Comparison">
          <div className="mx-auto max-w-[1400px]">
            {readiness.status === "needs-more" ? (
              <div className="card-surface relative flex flex-col items-start gap-5 p-8 md:p-12">
                <span className="pointer-events-none absolute left-3 top-3 text-accent/70"><HudFrame corner="tl" size={18} /></span>
                <span className="pointer-events-none absolute bottom-3 right-3 text-accent/70"><HudFrame corner="br" size={18} /></span>
                <EyebrowBadge>SELECT {readiness.missing} MORE</EyebrowBadge>
                <h2 className="font-sans text-3xl font-semibold leading-tight tracking-tighter text-foreground md:text-4xl">
                  {selected.length === 0
                    ? "Pick at least two armors to compare."
                    : `Add ${readiness.missing} more armor to compare with ${selected[0].designation}.`}
                </h2>
                <p className="max-w-[52ch] font-sans text-base leading-relaxed text-zinc-400">
                  Use the picker above, or press <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-foreground">Compare</span> on
                  any armor card or detail page; a tray at the bottom of the
                  screen collects your picks (up to {MAX_COMPARE}). You can also
                  share a link like{" "}
                  <code className="font-mono text-[12px] text-accent">/compare?ids=mark-i,mark-l</code>.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/armors" className={pill}>
                    Browse armors
                    <ArrowUpRight size={14} weight="bold" />
                  </Link>
                  {selected.length === 0 && (
                    <Link href={compareHref(["mark-i", "mark-lxxxv"])} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition-colors hover:text-accent">
                      Try Mark I vs Mark LXXXV
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p role="status" aria-live="polite" className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-zinc-500">
                  {rows.length} of {allRows.length} categories shown
                  {query.diff && hiddenCount > 0 && (
                    <span className="text-zinc-600"> · {hiddenCount} identical hidden</span>
                  )}
                  {query.diff && rows.length === 0 && (
                    <span className="text-accent"> · these armors have no recorded differences</span>
                  )}
                </p>
                <CompareTable armors={selected} rows={rows} diff={query.diff} />
                <p className="mt-8 max-w-[64ch] font-sans text-[12.5px] leading-relaxed text-zinc-500">
                  Reading the table: <span className="text-zinc-300">Unknown</span> means the
                  films give no value; <span className="text-zinc-300">None on record</span>{" "}
                  means the archive has nothing in that category for the armor.
                  &ldquo;Differs&rdquo; is decided on normalised categories, not
                  wording. Every fact carries a <span className="font-mono text-accent">[n]</span> source marker
                  (see the <Link href="/archive#sources" className="underline decoration-white/20 underline-offset-4 hover:text-accent">source list</Link>).
                </p>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
