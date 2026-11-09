/**
 * MCU Armor & Technology Archive — data model.
 *
 * Scope rules (enforced by the integrity check in `src/lib/archive-integrity.ts`):
 *  - Marvel Cinematic Universe feature films only, Iron Man (2008) through
 *    Avengers: Endgame (2019). No comics, games, tie-in novels, or TV.
 *  - Every fact and every stated specification must cite at least one source.
 *  - Technical values that the films never state are recorded as `unknown`,
 *    never estimated.
 */

/** Where a source sits on the reliability scale. */
export type SourceKind =
  /** The feature film itself — the primary production source. */
  | "film"
  /** A page published by Marvel (marvel.com). */
  | "official-web";

export type SourceVerification =
  | {
      /** URL was opened and the cited content confirmed on `accessDate`. */
      status: "verified";
    }
  | {
      /**
       * URL recorded from editorial knowledge but not opened during data entry
       * (for example, because the authoring environment had no web access).
       * `accessDate` must be `null` while a source is unverified.
       */
      status: "unverified";
      note: string;
    };

export type Source = {
  /** Stable kebab-case id, e.g. `film-iron-man-2008`. */
  id: string;
  title: string;
  publisher: string;
  url: string;
  /** ISO date (YYYY-MM-DD) the URL was last opened, or `null` if never opened. */
  accessDate: string | null;
  kind: SourceKind;
  verification: SourceVerification;
  /** Free-text note, e.g. distribution details or what the page is used for. */
  note?: string;
};

/** A pointer from a fact to the part of a source that supports it. */
export type Citation = {
  sourceId: string;
  /** Scene, section, or quoted line that supports the fact. */
  locator: string;
};

/** How a fact is grounded. */
export type FactBasis =
  /** Spoken in the film's dialogue. */
  | "dialogue"
  /** Shown on-screen (action, props, displays) but not spoken. */
  | "on-screen"
  /** Stated in Marvel's official published materials rather than in the film. */
  | "official-materials";

export type Fact = {
  /** Globally unique kebab-case id. */
  id: string;
  text: string;
  basis: FactBasis;
  citations: Citation[];
};

/**
 * Normalised categories for capability facts. Comparison features diff these
 * sets rather than the prose, so two armors that describe the same ability in
 * different words still compare as equal.
 */
export const CAPABILITY_TAGS = [
  "flight",
  "rocket-flight",
  "high-altitude",
  "ranged-weapons",
  "flame-projectors",
  "countermeasures",
  "armor-protection",
  "hud-ai",
  "portable",
  "remote-deployment",
  "instant-deployment",
  "modular-repair",
  "heavy-lift",
  "strength",
  "melee",
  "combat",
  "reconfiguration",
  "space-operation",
  "underwater-operation",
  "energy-absorption",
  "stone-handling",
] as const;
export type CapabilityTag = (typeof CAPABILITY_TAGS)[number];

export const CAPABILITY_TAG_LABELS: Record<CapabilityTag, string> = {
  flight: "Controlled flight",
  "rocket-flight": "Rocket-assisted flight (uncontrolled)",
  "high-altitude": "High-altitude operation",
  "ranged-weapons": "Ranged weapons",
  "flame-projectors": "Flame projectors",
  countermeasures: "Countermeasures",
  "armor-protection": "Small-arms protection",
  "hud-ai": "HUD with onboard AI",
  portable: "Portable (carried case)",
  "remote-deployment": "Remote deployment",
  "instant-deployment": "Instant deployment from housing",
  "modular-repair": "Modular field repair",
  "heavy-lift": "Heavy lift",
  strength: "Enhanced strength",
  melee: "Melee systems",
  combat: "Sustained combat",
  reconfiguration: "On-demand reconfiguration",
  "space-operation": "Operation outside the atmosphere",
  "underwater-operation": "Underwater operation",
  "energy-absorption": "Energy absorption",
  "stone-handling": "Infinity Stone handling",
};

/** Normalised categories for limitation facts. */
export const LIMITATION_TAGS = [
  "icing",
  "power-loss",
  "untested",
  "unarmed",
  "single-use",
  "reactor-dependency",
  "combat-damage",
  "material-depletion",
  "deployment-dependency",
  "limited-runtime",
  "crash",
  "slow-boot",
  "no-flight",
  "fatal-energy",
] as const;
export type LimitationTag = (typeof LIMITATION_TAGS)[number];

export const LIMITATION_TAG_LABELS: Record<LimitationTag, string> = {
  icing: "Icing at altitude",
  "power-loss": "Power loss",
  untested: "Deployed before ready",
  unarmed: "No weapons",
  "single-use": "Single-use system",
  "reactor-dependency": "Dependent on chest reactor",
  "combat-damage": "Damaged in combat",
  "material-depletion": "Finite material reserve",
  "deployment-dependency": "Needs external delivery",
  "limited-runtime": "Limited runtime",
  crash: "Uncontrolled landing",
  "slow-boot": "Slow boot sequence",
  "no-flight": "No flight shown",
  "fatal-energy": "Did not protect wearer from Stone energy",
};

/** A fact carrying normalised tags for comparison. */
export type TaggedFact<T extends string> = Fact & { tags: T[] };

/**
 * How an armor is built and put on. One normalised kind per armor, plus a
 * cited description, so comparisons can say "same approach" honestly.
 */
export const DESIGN_APPROACHES = [
  "improvised",
  "workshop-built",
  "portable",
  "remote-deployed",
  "modular-exosuit",
  "nanotech",
] as const;
export type DesignApproach = (typeof DESIGN_APPROACHES)[number];

export const DESIGN_APPROACH_LABELS: Record<DesignApproach, string> = {
  improvised: "Improvised from salvage",
  "workshop-built": "Workshop-built plate armor",
  portable: "Portable case armor",
  "remote-deployed": "Remotely deployed plate armor",
  "modular-exosuit": "Modular exo-armor worn over a suit",
  nanotech: "Nanoparticle armor from a chest housing",
};

export type Design = Fact & { approach: DesignApproach };

export type Film = {
  id: string;
  title: string;
  releaseYear: number;
  /** The film's own entry in the source registry. */
  sourceId: string;
};

/**
 * A technical specification. Values are only `stated` when the film gives
 * them; otherwise they are `unknown` and rendered as such.
 */
export type Spec =
  | { status: "unknown" }
  | {
      status: "stated";
      /** Verbatim or near-verbatim value as given in the film. */
      value: string;
      basis: FactBasis;
      citations: Citation[];
    };

/** Fixed set of specification keys, so every armor shows the same rows. */
export const SPEC_KEYS = [
  "powerSource",
  "powerOutput",
  "shellMaterial",
  "flightCeiling",
  "topSpeed",
  "mass",
] as const;

export type SpecKey = (typeof SPEC_KEYS)[number];

export const SPEC_LABELS: Record<SpecKey, string> = {
  powerSource: "Power source",
  powerOutput: "Power output",
  shellMaterial: "Shell material",
  flightCeiling: "Flight ceiling",
  topSpeed: "Top speed",
  mass: "Mass",
};

export type Specs = Record<SpecKey, Spec>;

/**
 * An image for an armor record. Only attach images whose provenance is known;
 * fan renders must be labelled as such so they are never mistaken for stills.
 */
export type ArmorImage = {
  /** Site-relative path under /public or an https URL. */
  src: string;
  alt: string;
  kind: "production-still" | "promotional" | "fan-art";
  credit: string;
  width: number;
  height: number;
};

export type Armor = {
  /** e.g. `mark-i` — also the URL slug for `/armors/[slug]`. */
  id: string;
  /** e.g. `Mark I` */
  designation: string;
  /** Arabic equivalent of the Roman numeral, for sorting. */
  markNumber: number;
  /** Common name, e.g. `Hulkbuster`, or `null` if none. */
  alias: string | null;
  /**
   * Whether the Mark number is spoken in a film (`dialogue`) or only appears
   * in Marvel's official materials (`official-materials`).
   */
  designationBasis: Extract<FactBasis, "dialogue" | "official-materials">;
  /** Short neutral description. */
  summary: string;
  firstAppearanceFilmId: string;
  /** Films in which the armor is used on-screen (not display-only cameos). */
  appearanceFilmIds: string[];
  /** General record: construction, history, designation notes. */
  facts: Fact[];
  /** How it is built and put on (one normalised approach, cited). */
  design: Design;
  /** What the armor is shown doing. */
  capabilities: TaggedFact<CapabilityTag>[];
  /** Failures, constraints, and damage established on-screen. */
  limitations: TaggedFact<LimitationTag>[];
  specs: Specs;
  /** Technologies this armor demonstrates on-screen. */
  technologyIds: string[];
  /** `null` when no suitably sourced image is on file (the UI renders a fallback). */
  image: ArmorImage | null;
};

/** A cited statement about how one technology depends on or feeds another. */
export type Connection = Fact & {
  /** The other technology in the relationship. */
  technologyId: string;
};

export type Technology = {
  /** e.g. `arc-reactor` — also the URL slug for `/technology/[slug]`. */
  id: string;
  name: string;
  summary: string;
  /** What the technology does in the films. */
  facts: Fact[];
  /** How it connects to other suit systems (each one cited). */
  connections: Connection[];
  /** Failures and constraints established on-screen. */
  limitations: Fact[];
  /** Armors in this archive that demonstrate the technology on-screen. */
  armorIds: string[];
  /** Things the films never specify — listed so nobody is tempted to fill them in. */
  knownUnknowns: string[];
};

/** Selectable regions of the conceptual suit diagram. */
export const SUIT_PART_IDS = ["helmet", "chest", "palms", "boots"] as const;
export type SuitPartId = (typeof SUIT_PART_IDS)[number];

export type SuitPart = {
  id: SuitPartId;
  name: string;
  /** Short neutral description; every claim in it is backed by `relatedFactIds`. */
  summary: string;
  /** Technologies housed in or expressed through this part. */
  technologyIds: string[];
  /** Existing archive facts (by id) that support the summary. */
  relatedFactIds: string[];
};

export type ArchiveData = {
  /** Human-readable scope statement shown on the archive page. */
  scope: string;
  /** ISO date the data set was last reviewed. */
  lastReviewed: string;
  films: Film[];
  sources: Source[];
  armors: Armor[];
  technologies: Technology[];
  suitParts: SuitPart[];
};
