import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Technology } from "@/data/archive";
import { getArmor } from "@/data/archive";
import { Chip } from "./Chip";
import { FactList } from "./FactList";

export function TechnologyCard({ technology }: { technology: Technology }) {
  return (
    <article
      id={`tech-${technology.id}`}
      className="card-surface scroll-mt-28 p-6 md:p-8"
    >
      <header className="flex flex-col gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
          System // {technology.id.replace(/-/g, " ")}
        </span>
        <h3 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
          <Link
            href={`/technology/${technology.id}`}
            className="group/title inline-flex items-baseline gap-2 transition-colors hover:text-accent"
          >
            {technology.name}
            <ArrowUpRight
              size={16}
              weight="bold"
              className="opacity-0 transition-opacity group-hover/title:opacity-100 group-focus-visible/title:opacity-100"
            />
          </Link>
        </h3>
        <p className="max-w-[60ch] font-sans text-[15px] leading-relaxed text-zinc-400">
          {technology.summary}
        </p>
      </header>

      <section className="mt-6">
        <h4 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
          On record
        </h4>
        <FactList facts={technology.facts} />
      </section>

      {technology.knownUnknowns.length > 0 && (
        <section className="mt-6 rounded-2xl border border-dashed border-white/10 p-4">
          <h4 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
            Not stated in the films — left unknown
          </h4>
          <ul className="flex flex-col gap-1.5">
            {technology.knownUnknowns.map((item) => (
              <li
                key={item}
                className="font-sans text-[13px] leading-relaxed text-zinc-500"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
          Armors
        </span>
        {technology.armorIds.map((id) => {
          const armor = getArmor(id);
          return (
            <Chip key={id} href={`/armors/${id}`}>
              {armor ? armor.designation : id}
            </Chip>
          );
        })}
      </section>
    </article>
  );
}
