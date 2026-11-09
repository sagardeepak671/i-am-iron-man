import type { SuitPart } from "./types";

/**
 * Regions of the conceptual suit diagram on /technology.
 *
 * The diagram is an original, schematic illustration — not an engineering
 * blueprint. Each part's summary is backed by existing archive facts
 * (`relatedFactIds`), so the diagram cannot make a claim the archive does not.
 */
export const SUIT_PARTS: SuitPart[] = [
  {
    id: "helmet",
    name: "Helmet",
    summary:
      "Houses the heads-up display and is where the onboard AI speaks to the pilot. Early helmets have a hinged faceplate; the nanotech helmets form in place.",
    technologyIds: ["helmet-hud", "onboard-ai"],
    relatedFactIds: ["hud-engage", "ai-jarvis-uploaded", "hud-faceplate", "hud-nanotech-helmet"],
  },
  {
    id: "chest",
    name: "Chest unit",
    summary:
      "The armor's power and, from Infinity War, its storage: first the miniaturized arc reactor, later a housing unit for nanoparticles.",
    technologyIds: ["arc-reactor", "nanotechnology"],
    relatedFactIds: ["arc-reactor-miniaturized", "arc-reactor-removed", "nano-housing-unit"],
  },
  {
    id: "palms",
    name: "Palms",
    summary:
      "Palm-mounted repulsors: introduced as flight stabilizers, then the armor's main ranged weapon.",
    technologyIds: ["repulsors", "flight-stabilization"],
    relatedFactIds: ["repulsors-flight-stabilizer-test", "repulsors-as-weapon"],
  },
  {
    id: "boots",
    name: "Boots",
    summary:
      "Boot thrusters provide lift while the hand stabilizers steer. High-altitude icing was the first flight failure.",
    technologyIds: ["flight-stabilization"],
    relatedFactIds: ["flight-mark-ii-test", "flight-icing"],
  },
];
