import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Armor, Film } from "@/data/archive";
import { getTechnology } from "@/data/archive";
import { CompareToggle } from "@/components/compare/CompareToggle";
import { ArmorImage } from "./ArmorImage";

type Props = { armor: Armor; film: Film | undefined };

/**
 * List tile. The title link is "stretched" over the whole card (pseudo-element)
 * so the tile is one click target, while the compare button sits above it
 * (`relative z-10`) and stays an independent control.
 */
export function ArmorListCard({ armor, film }: Props) {
  return (
    <li className="card-surface group relative flex h-full flex-col gap-5 p-5 transition-[border-color] duration-200 focus-within:border-accent/60 hover:border-accent/40 md:p-6">
      <ArmorImage armor={armor} />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.26em]">
          <span className="text-accent">{armor.designation}</span>
          <span className="truncate text-zinc-500">
            {film ? `${film.title} — ${film.releaseYear}` : "—"}
          </span>
        </div>
        <h3 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-foreground">
          <Link
            href={`/armors/${armor.id}`}
            aria-label={`${armor.designation}${armor.alias ? `, ${armor.alias}` : ""} — open record`}
            className="after:absolute after:inset-0 after:rounded-[20px] after:content-[''] focus-visible:outline-none"
          >
            {armor.designation}
          </Link>
          {armor.alias && (
            <span className="block text-base font-medium tracking-tight text-zinc-400">
              {armor.alias}
            </span>
          )}
        </h3>
        <p className="line-clamp-3 font-sans text-[14px] leading-relaxed text-zinc-400">
          {armor.summary}
        </p>
      </div>

      <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/6 pt-4">
        <ul className="flex flex-wrap gap-1.5" aria-label="Systems">
          {armor.technologyIds.slice(0, 3).map((id) => (
            <li
              key={id}
              className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400"
            >
              {getTechnology(id)?.name ?? id}
            </li>
          ))}
          {armor.technologyIds.length > 3 && (
            <li className="px-1 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
              +{armor.technologyIds.length - 3}
            </li>
          )}
        </ul>
        <span aria-hidden className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground transition-colors group-hover:text-accent">
          Record
          <ArrowUpRight
            size={12}
            weight="bold"
            className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>

      <div className="relative z-10 self-start">
        <CompareToggle armorId={armor.id} designation={armor.designation} />
      </div>
    </li>
  );
}
