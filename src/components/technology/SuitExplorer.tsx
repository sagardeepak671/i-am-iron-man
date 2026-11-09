"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight } from "@phosphor-icons/react";
import type { FactBasis, SuitPartId } from "@/data/archive/types";
import { BasisTag } from "@/components/archive/BasisTag";
import {
  DEFAULT_PART,
  PART_ORDER,
  isActivationKey,
  nextPartForKey,
  partFromHash,
  tabIndexFor,
} from "@/lib/suit-explorer";

/* ---------------------------------------------------------------------------
 * Props: everything is pre-resolved on the server so the client bundle does
 * not need the archive data set.
 * ------------------------------------------------------------------------- */

export type ExplorerMark = { n: number; locator: string };

export type ExplorerFact = {
  id: string;
  text: string;
  basis: FactBasis;
  marks: ExplorerMark[];
};

export type ExplorerTechnology = { id: string; name: string; summary: string };

export type ExplorerPart = {
  id: SuitPartId;
  name: string;
  summary: string;
  technologies: ExplorerTechnology[];
  facts: ExplorerFact[];
};

type Props = {
  parts: ExplorerPart[];
  /** Base path of technology detail pages. */
  technologyHref?: (id: string) => string;
  /** Base path of the source list for `[n]` markers. */
  sourceHref?: (n: number) => string;
};

/* ---------------------------------------------------------------------------
 * Geometry of the schematic (viewBox 0 0 320 560). Front view, symmetric
 * about x = 160. Purely illustrative.
 * ------------------------------------------------------------------------- */

const BASE_FILL = "rgba(255,255,255,0.03)";
const BASE_STROKE = "rgba(255,255,255,0.16)";

function Silhouette() {
  const limb = { fill: BASE_FILL, stroke: BASE_STROKE, strokeWidth: 1.25 };
  return (
    <g aria-hidden="true">
      {/* neck */}
      <rect x={148} y={98} width={24} height={20} rx={6} {...limb} />
      {/* torso */}
      <path
        d="M108 118 H212 L226 226 L204 298 H116 L94 226 Z"
        {...limb}
      />
      {/* belt line */}
      <line x1={118} y1={262} x2={202} y2={262} stroke={BASE_STROKE} strokeWidth={1} />
      {/* upper arms */}
      <rect x={62} y={124} width={36} height={118} rx={16} {...limb} />
      <rect x={222} y={124} width={36} height={118} rx={16} {...limb} />
      {/* forearms */}
      <rect x={56} y={238} width={34} height={96} rx={14} {...limb} />
      <rect x={230} y={238} width={34} height={96} rx={14} {...limb} />
      {/* thighs */}
      <rect x={116} y={296} width={40} height={150} rx={16} {...limb} />
      <rect x={164} y={296} width={40} height={150} rx={16} {...limb} />
      {/* hud ticks along the side, decorative */}
      {[140, 180, 220].map((y) => (
        <line key={y} x1={24} y1={y} x2={34} y2={y} stroke={BASE_STROKE} strokeWidth={1} />
      ))}
    </g>
  );
}

/** Shapes for each selectable region plus its label anchor. */
const REGION: Record<
  SuitPartId,
  { shapes: React.ReactNode; label: { x: number; y: number; anchor: "start" | "middle" | "end"; lead: [number, number, number, number] } }
> = {
  helmet: {
    shapes: (
      <>
        <rect x={126} y={22} width={68} height={80} rx={30} />
        {/* eye slits */}
        <rect x={140} y={54} width={14} height={5} rx={2} className="suit-part__detail" />
        <rect x={166} y={54} width={14} height={5} rx={2} className="suit-part__detail" />
        {/* faceplate line */}
        <path d="M138 46 Q160 40 182 46" fill="none" className="suit-part__detail" />
      </>
    ),
    label: { x: 236, y: 48, anchor: "start", lead: [196, 52, 230, 52] },
  },
  chest: {
    shapes: (
      <>
        <circle cx={160} cy={170} r={34} />
        <circle cx={160} cy={170} r={20} className="suit-part__detail" />
        <circle cx={160} cy={170} r={7} className="suit-part__detail" />
      </>
    ),
    label: { x: 236, y: 166, anchor: "start", lead: [196, 170, 230, 170] },
  },
  palms: {
    shapes: (
      <>
        <circle cx={73} cy={356} r={24} />
        <circle cx={73} cy={356} r={10} className="suit-part__detail" />
        <circle cx={247} cy={356} r={24} />
        <circle cx={247} cy={356} r={10} className="suit-part__detail" />
      </>
    ),
    label: { x: 73, y: 412, anchor: "middle", lead: [73, 382, 73, 398] },
  },
  boots: {
    shapes: (
      <>
        <rect x={108} y={448} width={52} height={72} rx={14} />
        <rect x={160} y={448} width={52} height={72} rx={14} />
        {/* thruster ports */}
        <rect x={122} y={528} width={24} height={8} rx={3} className="suit-part__detail" />
        <rect x={174} y={528} width={24} height={8} rx={3} className="suit-part__detail" />
      </>
    ),
    label: { x: 236, y: 488, anchor: "start", lead: [214, 484, 230, 484] },
  },
};

/* ------------------------------------------------------------------------- */

export function SuitExplorer({
  parts,
  technologyHref = (id) => `/technology/${id}`,
  sourceHref = (n) => `/archive#source-${n}`,
}: Props) {
  const uid = useId();
  const panelId = `${uid}-panel`;
  const tabId = (id: SuitPartId) => `${uid}-tab-${id}`;
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  const [selected, setSelected] = useState<SuitPartId>(DEFAULT_PART);
  const tabRefs = useRef<Partial<Record<SuitPartId, SVGGElement | null>>>({});

  // Deep link: /technology#part-helmet
  useEffect(() => {
    const apply = () => {
      const fromHash = partFromHash(window.location.hash);
      if (fromHash) setSelected(fromHash);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const select = (id: SuitPartId, { focus = false, hash = true } = {}) => {
    setSelected(id);
    if (focus) tabRefs.current[id]?.focus();
    if (hash && typeof window !== "undefined") {
      const url = `${window.location.pathname}${window.location.search}#part-${id}`;
      window.history.replaceState(window.history.state, "", url);
    }
  };

  const onTabKeyDown = (e: React.KeyboardEvent<SVGGElement>, id: SuitPartId) => {
    const next = nextPartForKey(id, e.key);
    if (next) {
      e.preventDefault();
      select(next, { focus: true });
      return;
    }
    if (isActivationKey(e.key)) {
      e.preventDefault();
      select(id);
    }
  };

  const byId = new Map(parts.map((p) => [p.id, p]));
  const ordered = PART_ORDER.map((id) => byId.get(id)).filter(
    (p): p is ExplorerPart => Boolean(p),
  );
  const current = byId.get(selected) ?? ordered[0];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
      {/* ---------------- Diagram ---------------- */}
      <figure className="card-surface relative flex flex-col gap-4 p-5 md:p-6">
        <figcaption className="flex flex-col gap-1">
          <span id={titleId} className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
            Suit diagram // conceptual
          </span>
          <span id={descId} className="font-sans text-[12.5px] leading-relaxed text-zinc-500">
            An original schematic, not an engineering blueprint. Regions are
            illustrative and imply no dimensions or layout. Use arrow keys to
            move between regions, Enter or Space to select.
          </span>
        </figcaption>

        <svg
          viewBox="0 0 320 560"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="mx-auto h-auto w-full max-w-[360px] select-none"
          style={{ touchAction: "manipulation" }}
        >
          <title>Conceptual suit diagram with selectable helmet, chest unit, palms, and boots</title>
          <Silhouette />

          <g role="tablist" aria-label="Suit regions" aria-orientation="vertical">
            {ordered.map((part) => {
              const region = REGION[part.id];
              const isSelected = part.id === selected;
              const { lead, x, y, anchor } = region.label;
              return (
                <g
                  key={part.id}
                  ref={(el) => {
                    tabRefs.current[part.id] = el;
                  }}
                  id={tabId(part.id)}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={panelId}
                  aria-label={part.name}
                  tabIndex={tabIndexFor(part.id, selected)}
                  data-part={part.id}
                  data-selected={isSelected ? "true" : "false"}
                  className="suit-part"
                  onClick={() => select(part.id)}
                  onKeyDown={(e) => onTabKeyDown(e, part.id)}
                >
                  {region.shapes}
                  <line
                    x1={lead[0]} y1={lead[1]} x2={lead[2]} y2={lead[3]}
                    className="suit-part__lead"
                  />
                  <text x={x} y={y} textAnchor={anchor} className="suit-part__label">
                    {part.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        <p className="font-mono text-[9px] uppercase tracking-[0.24em] text-zinc-600">
          Selected: <span className="text-zinc-300">{current?.name}</span>
        </p>
      </figure>

      {/* ---------------- Panel + text list ---------------- */}
      <div className="flex flex-col gap-8">
        {current && (
          <section
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId(current.id)}
            className="card-surface flex flex-col gap-5 p-6 md:p-8"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent">
              Region // {current.id}
            </span>
            <h3 className="font-sans text-3xl font-semibold leading-tight tracking-tighter text-foreground md:text-4xl">
              {current.name}
            </h3>
            <p className="max-w-[56ch] font-sans text-[15px] leading-relaxed text-zinc-400">
              {current.summary}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
                Technology
              </span>
              {current.technologies.map((t) => (
                <Link
                  key={t.id}
                  href={technologyHref(t.id)}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-foreground transition-all duration-200 hover:border-accent/50 hover:text-accent"
                >
                  {t.name}
                  <ArrowUpRight
                    size={12}
                    weight="bold"
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              ))}
            </div>

            <div>
              <h4 className="mb-2 font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
                Supporting facts
              </h4>
              <ul className="flex flex-col divide-y divide-white/6 border-t border-white/6">
                {current.facts.map((fact) => (
                  <li key={fact.id} className="flex items-start gap-3 py-3">
                    <span aria-hidden className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                    <p className="flex-1 font-sans text-[13.5px] leading-relaxed text-zinc-300">
                      {fact.text}
                      <sup className="ml-1 inline-flex gap-0.5 font-mono text-[9px] leading-none">
                        {fact.marks.map((m, i) => (
                          <a
                            key={`${m.n}-${i}`}
                            href={sourceHref(m.n)}
                            title={m.locator}
                            className="text-accent transition-colors hover:text-foreground"
                          >
                            [{m.n}]
                          </a>
                        ))}
                      </sup>
                    </p>
                    <BasisTag basis={fact.basis} />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* Equivalent text list: complete without the diagram. */}
        <nav aria-label="Suit regions, text list" className="flex flex-col gap-3">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.28em] text-zinc-500">
            All regions
          </h3>
          <ul className="flex flex-col divide-y divide-white/6 border-y border-white/6">
            {ordered.map((part) => {
              const isSelected = part.id === selected;
              return (
                <li key={part.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-6">
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => select(part.id)}
                    className={`inline-flex shrink-0 items-center gap-2 self-start rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] transition-colors ${
                      isSelected
                        ? "border-accent/60 bg-accent-soft text-accent"
                        : "border-white/12 text-zinc-300 hover:border-white/25 hover:text-foreground"
                    }`}
                  >
                    <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-full ${isSelected ? "bg-accent" : "bg-zinc-600"}`} />
                    {part.name}
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <p className="font-sans text-[13px] leading-relaxed text-zinc-400">{part.summary}</p>
                    <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.2em]">
                      {part.technologies.map((t) => (
                        <Link
                          key={t.id}
                          href={technologyHref(t.id)}
                          className="inline-block py-1 text-zinc-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-accent"
                        >
                          {t.name}
                        </Link>
                      ))}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
