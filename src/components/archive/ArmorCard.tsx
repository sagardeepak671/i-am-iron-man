import type { Armor } from "@/data/archive";
import { getFilm, getTechnology } from "@/data/archive";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import { HudFrame } from "@/components/ui/HudFrame";
import { Chip } from "./Chip";
import { FactList } from "./FactList";
import { SpecTable } from "./SpecTable";

const filmLabel = (filmId: string) => {
  const film = getFilm(filmId);
  return film ? `${film.title} — ${film.releaseYear}` : filmId;
};

export function ArmorCard({ armor }: { armor: Armor }) {
  const firstFilm = getFilm(armor.firstAppearanceFilmId);

  return (
    <article
      id={`armor-${armor.id}`}
      className="card-surface relative scroll-mt-28 p-6 md:p-8"
    >
      <span className="pointer-events-none absolute left-3 top-3 text-accent/70">
        <HudFrame corner="tl" size={18} />
      </span>
      <span className="pointer-events-none absolute bottom-3 right-3 text-accent/70">
        <HudFrame corner="br" size={18} />
      </span>

      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.28em]">
          <span className="text-accent">
            {armor.designation}
            {armor.alias ? ` // ${armor.alias}` : ""}
          </span>
          <span className="text-zinc-500">
            {firstFilm ? `${firstFilm.title} — ${firstFilm.releaseYear}` : "—"}
          </span>
        </div>
        <h3 className="font-sans text-3xl font-semibold leading-[0.98] tracking-tighter text-foreground md:text-4xl">
          <Link
            href={`/armors/${armor.id}`}
            className="group/title inline-flex items-baseline gap-2 transition-colors hover:text-accent"
          >
            {armor.designation}
            <ArrowUpRight
              size={18}
              weight="bold"
              className="opacity-0 transition-opacity group-hover/title:opacity-100 group-focus-visible/title:opacity-100"
            />
          </Link>
          {armor.alias && (
            <span className="block text-xl font-medium tracking-tight text-zinc-400 md:text-2xl">
              {armor.alias}
            </span>
          )}
        </h3>
        <p className="max-w-[60ch] font-sans text-[15px] leading-relaxed text-zinc-400">
          {armor.summary}
        </p>
      </header>

      {/* Meta row */}
      <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-white/6 pt-5 font-mono text-[11px] sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">
            Appears in
          </dt>
          <dd className="text-zinc-300">
            {armor.appearanceFilmIds.map(filmLabel).join(" · ")}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[9px] uppercase tracking-[0.28em] text-zinc-500">
            Designation basis
          </dt>
          <dd className="text-zinc-300">
            {armor.designationBasis === "dialogue"
              ? "Spoken on-screen"
              : "Marvel official materials (not spoken in the film)"}
          </dd>
        </div>
      </dl>

      {/* Specs */}
      <section className="mt-6">
        <h4 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
          Specifications — only what the films state
        </h4>
        <SpecTable specs={armor.specs} />
      </section>

      {/* Facts */}
      <section className="mt-6">
        <h4 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
          On record
        </h4>
        <FactList facts={armor.facts} />
      </section>

      {/* Technology links */}
      <section className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
          Systems
        </span>
        {armor.technologyIds.map((id) => (
          <Chip key={id} href={`/technology/${id}`}>
            {getTechnology(id)?.name ?? id}
          </Chip>
        ))}
      </section>
    </article>
  );
}
