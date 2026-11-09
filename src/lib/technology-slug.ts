import { TECHNOLOGIES, getTechnology } from "@/data/archive";
import type { Technology } from "@/data/archive";
import { normalizeSlug } from "./armor-slug";

export type TechnologySlugResolution =
  | { status: "ok"; technology: Technology }
  | { status: "redirect"; canonical: string; technology: Technology }
  | { status: "not-found"; slug: string };

export const TECHNOLOGY_SLUGS: string[] = TECHNOLOGIES.map((t) => t.id);

/** Common shorthand → canonical id. */
const ALIASES: Record<string, string> = {
  arc: "arc-reactor",
  reactor: "arc-reactor",
  "arc-reactors": "arc-reactor",
  repulsor: "repulsors",
  flight: "flight-stabilization",
  stabilization: "flight-stabilization",
  "flight-and-stabilization": "flight-stabilization",
  "flight-stabilisation": "flight-stabilization",
  helmet: "helmet-hud",
  hud: "helmet-hud",
  "helmet-and-hud": "helmet-hud",
  ai: "onboard-ai",
  jarvis: "onboard-ai",
  friday: "onboard-ai",
  "j-a-r-v-i-s": "onboard-ai",
  "f-r-i-d-a-y": "onboard-ai",
  nano: "nanotechnology",
  nanotech: "nanotechnology",
};

export function resolveTechnologySlug(raw: string | undefined): TechnologySlugResolution {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 512) {
    return { status: "not-found", slug: String(raw ?? "") };
  }
  const exact = getTechnology(raw);
  if (exact) return { status: "ok", technology: exact };

  const normalized = normalizeSlug(raw)
    .replace(/\./g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!normalized) return { status: "not-found", slug: raw };

  const canonical = getTechnology(normalized) ?? getTechnology(ALIASES[normalized] ?? "");
  if (canonical) return { status: "redirect", canonical: canonical.id, technology: canonical };
  return { status: "not-found", slug: raw };
}
