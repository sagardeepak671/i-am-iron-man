import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Technology } from "@/data/archive";
import { getArmor, suitPartsForTechnology } from "@/data/archive";

const INDEX: Record<string, string> = {
  "arc-reactor": "01",
  repulsors: "02",
  "flight-stabilization": "03",
  "helmet-hud": "04",
  "onboard-ai": "05",
  nanotechnology: "06",
};

export function TechnologyListCard({ technology }: { technology: Technology }) {
  const armors = technology.armorIds
    .map(getArmor)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const parts = suitPartsForTechnology(technology.id);
  return (
    <li className="list-none">
      <Link
        href={`/technology/${technology.id}`}
        className="card-surface group flex h-full flex-col gap-4 p-6 transition-[border-color,transform] duration-200 hover:border-accent/40 focus-visible:border-accent/60 active:translate-y-[1px]"
      >
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em]">
          <span className="text-accent">{`${INDEX[technology.id] ?? "—"} // System`}</span>
          <span className="text-zinc-500">
            {parts.map((p) => p.name).join(" · ") || "—"}
          </span>
        </div>
        <h3 className="font-sans text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
          {technology.name}
        </h3>
        <p className="font-sans text-[14px] leading-relaxed text-zinc-400">{technology.summary}</p>
        <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-white/6 pt-4 font-mono">
          {[
            ["Facts", technology.facts.length],
            ["Limits", technology.limitations.length],
            ["Armors", armors.length],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-[9px] uppercase tracking-[0.26em] text-zinc-500">{label}</dt>
              <dd className="text-lg font-semibold text-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <span className="inline-flex items-center gap-1 self-end font-mono text-[10px] uppercase tracking-[0.22em] text-foreground transition-colors group-hover:text-accent">
          Open
          <ArrowUpRight size={12} weight="bold" className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </Link>
    </li>
  );
}
