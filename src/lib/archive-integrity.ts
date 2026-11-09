import { CONTINUITY_CUTOFF_YEAR } from "@/data/archive/sources";
import {
  CAPABILITY_TAGS,
  DESIGN_APPROACHES,
  LIMITATION_TAGS,
  SPEC_KEYS,
  SUIT_PART_IDS,
  type ArchiveData,
} from "@/data/archive/types";

export type IssueLevel = "error" | "warning";

export type Issue = {
  level: IssueLevel;
  /** Short machine-friendly category, e.g. `duplicate-id`. */
  code:
    | "duplicate-id"
    | "invalid-id"
    | "broken-relationship"
    | "asymmetric-relationship"
    | "missing-citation"
    | "missing-source"
    | "orphan-source"
    | "invalid-source"
    | "unverified-source"
    | "out-of-scope"
    | "empty-record"
    | "invalid-image"
    | "missing-tag";
  /** Where the problem is, e.g. `armor:mark-i.facts[2]`. */
  path: string;
  message: string;
};

export type IntegrityReport = {
  errors: Issue[];
  warnings: Issue[];
  /** What was examined, for the script's summary line. */
  counts: {
    films: number;
    sources: number;
    armors: number;
    technologies: number;
    suitParts: number;
    facts: number;
    citations: number;
  };
};

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Runs every structural check against an archive data set and returns a report.
 * Pure: no I/O, no throwing. `errors` should block a build; `warnings` should
 * be reviewed but are not fatal (e.g. sources awaiting verification).
 */
export function checkArchiveIntegrity(data: ArchiveData): IntegrityReport {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];
  const error = (code: Issue["code"], path: string, message: string) =>
    errors.push({ level: "error", code, path, message });
  const warn = (code: Issue["code"], path: string, message: string) =>
    warnings.push({ level: "warning", code, path, message });

  let citationCount = 0;
  let factCount = 0;

  /* ---- 1. Duplicate and malformed ids ---------------------------------- */

  const checkIds = (kind: string, items: { id: string }[]) => {
    const seen = new Set<string>();
    for (const item of items) {
      const path = `${kind}:${item.id}`;
      if (!ID_PATTERN.test(item.id)) {
        error("invalid-id", path, `Id must be kebab-case; got "${item.id}".`);
      }
      if (seen.has(item.id)) {
        error("duplicate-id", path, `Duplicate ${kind} id "${item.id}".`);
      }
      seen.add(item.id);
    }
    return seen;
  };

  const filmIds = checkIds("film", data.films);
  const sourceIds = checkIds("source", data.sources);
  const armorIds = checkIds("armor", data.armors);
  const technologyIds = checkIds("technology", data.technologies);

  // Fact ids are unique across the whole archive so `[n]` markers and anchors
  // can never collide.
  const factIds = new Set<string>();
  const ARMOR_FACT_GROUPS = ["facts", "capabilities", "limitations"] as const;
  const TECH_FACT_GROUPS = ["facts", "connections", "limitations"] as const;
  const allFacts = [
    ...data.armors.flatMap((a) => [
      ...ARMOR_FACT_GROUPS.flatMap((group) =>
        a[group].map((fact, i) => ({
          path: `armor:${a.id}.${group}[${i}]`,
          fact,
        })),
      ),
      { path: `armor:${a.id}.design`, fact: a.design },
    ]),
    ...data.technologies.flatMap((t) =>
      TECH_FACT_GROUPS.flatMap((group) =>
        t[group].map((fact, i) => ({
          path: `technology:${t.id}.${group}[${i}]`,
          fact,
        })),
      ),
    ),
  ];
  for (const { path, fact } of allFacts) {
    factCount++;
    if (!ID_PATTERN.test(fact.id)) {
      error("invalid-id", path, `Fact id must be kebab-case; got "${fact.id}".`);
    }
    if (factIds.has(fact.id)) {
      error("duplicate-id", path, `Duplicate fact id "${fact.id}".`);
    }
    factIds.add(fact.id);
  }

  /* ---- 2. Sources: required fields, URL shape, verification state ------- */

  const referencedSources = new Set<string>();

  for (const source of data.sources) {
    const path = `source:${source.id}`;
    if (!source.title.trim()) error("invalid-source", path, "Missing title.");
    if (!source.publisher.trim())
      error("invalid-source", path, "Missing publisher.");

    let urlOk = false;
    try {
      const u = new URL(source.url);
      urlOk = u.protocol === "https:" || u.protocol === "http:";
    } catch {
      urlOk = false;
    }
    if (!urlOk) {
      error("invalid-source", path, `URL is not a valid http(s) URL: "${source.url}".`);
    }

    if (source.accessDate !== null && !ISO_DATE.test(source.accessDate)) {
      error(
        "invalid-source",
        path,
        `accessDate must be YYYY-MM-DD or null; got "${source.accessDate}".`,
      );
    }

    if (source.verification.status === "verified" && source.accessDate === null) {
      error("invalid-source", path, "Verified sources must have an accessDate.");
    }
    if (source.verification.status === "unverified") {
      if (source.accessDate !== null) {
        error(
          "invalid-source",
          path,
          "Unverified sources must not carry an accessDate (nothing was accessed).",
        );
      }
      warn(
        "unverified-source",
        path,
        `Source has not been opened and confirmed yet: ${source.url}`,
      );
    }
  }

  /* ---- 3. Films: registry links and continuity window ------------------ */

  for (const film of data.films) {
    const path = `film:${film.id}`;
    if (!sourceIds.has(film.sourceId)) {
      error("broken-relationship", path, `sourceId "${film.sourceId}" does not exist.`);
    } else {
      referencedSources.add(film.sourceId);
    }
    if (film.releaseYear > CONTINUITY_CUTOFF_YEAR) {
      error(
        "out-of-scope",
        path,
        `Film released in ${film.releaseYear}, after the ${CONTINUITY_CUTOFF_YEAR} continuity cutoff.`,
      );
    }
  }

  /* ---- 4. Citations on facts and stated specs -------------------------- */

  const checkCitations = (
    path: string,
    citations: { sourceId: string; locator: string }[],
  ) => {
    if (citations.length === 0) {
      error("missing-citation", path, "No citations; every fact and stated value must cite a source.");
      return;
    }
    citations.forEach((c, i) => {
      citationCount++;
      const cpath = `${path}.citations[${i}]`;
      if (!sourceIds.has(c.sourceId)) {
        error("missing-source", cpath, `Cites unknown source "${c.sourceId}".`);
      } else {
        referencedSources.add(c.sourceId);
      }
      if (!c.locator.trim()) {
        error("missing-citation", cpath, "Citation has an empty locator.");
      }
    });
  };

  for (const { path, fact } of allFacts) {
    if (!fact.text.trim()) error("empty-record", path, "Fact has empty text.");
    checkCitations(path, fact.citations);
  }

  /* ---- 5. Armors --------------------------------------------------------- */

  const technologyArmorLinks = new Map<string, Set<string>>();
  for (const t of data.technologies) {
    technologyArmorLinks.set(t.id, new Set(t.armorIds));
  }

  for (const armor of data.armors) {
    const path = `armor:${armor.id}`;

    if (armor.facts.length === 0) {
      error("empty-record", path, "Armor has no facts.");
    }
    if (armor.capabilities.length === 0) {
      error("empty-record", `${path}.capabilities`, "Armor has no capabilities on record.");
    }
    if (armor.limitations.length === 0) {
      error("empty-record", `${path}.limitations`, "Armor has no limitations on record.");
    }

    // Normalised comparison data: every capability/limitation carries known
    // tags, and the design approach is one of the enumerated kinds.
    const checkTags = (group: "capabilities" | "limitations", allowed: readonly string[]) => {
      armor[group].forEach((fact, i) => {
        const fpath = `${path}.${group}[${i}]`;
        if (fact.tags.length === 0) {
          error("missing-tag", fpath, "Fact has no normalised tags; comparison cannot classify it.");
        }
        for (const tag of fact.tags) {
          if (!allowed.includes(tag)) error("missing-tag", fpath, `Unknown tag "${tag}".`);
        }
        if (new Set(fact.tags).size !== fact.tags.length) {
          error("missing-tag", fpath, "Duplicate tags on one fact.");
        }
      });
    };
    checkTags("capabilities", CAPABILITY_TAGS);
    checkTags("limitations", LIMITATION_TAGS);
    if (!DESIGN_APPROACHES.includes(armor.design.approach)) {
      error("missing-tag", `${path}.design`, `Unknown design approach "${armor.design.approach}".`);
    }

    if (armor.image !== null) {
      const ipath = `${path}.image`;
      const img = armor.image;
      const localOk = img.src.startsWith("/") && !img.src.startsWith("//");
      let remoteOk = false;
      try {
        remoteOk = new URL(img.src).protocol === "https:";
      } catch {
        remoteOk = false;
      }
      if (!localOk && !remoteOk) {
        error("invalid-image", ipath, `Image src must be site-relative or https: "${img.src}".`);
      }
      if (!img.alt.trim()) error("invalid-image", ipath, "Image alt text is empty.");
      if (!img.credit.trim()) error("invalid-image", ipath, "Image credit is empty.");
      if (!(img.width > 0 && img.height > 0)) {
        error("invalid-image", ipath, "Image width and height must be positive.");
      }
    }

    if (!filmIds.has(armor.firstAppearanceFilmId)) {
      error(
        "broken-relationship",
        `${path}.firstAppearanceFilmId`,
        `Film "${armor.firstAppearanceFilmId}" does not exist.`,
      );
    }
    if (!armor.appearanceFilmIds.includes(armor.firstAppearanceFilmId)) {
      error(
        "broken-relationship",
        `${path}.appearanceFilmIds`,
        "firstAppearanceFilmId is not listed in appearanceFilmIds.",
      );
    }
    for (const filmId of armor.appearanceFilmIds) {
      if (!filmIds.has(filmId)) {
        error(
          "broken-relationship",
          `${path}.appearanceFilmIds`,
          `Film "${filmId}" does not exist.`,
        );
      }
    }

    // Armor -> technology, and the reverse link must exist too.
    for (const techId of armor.technologyIds) {
      if (!technologyIds.has(techId)) {
        error(
          "broken-relationship",
          `${path}.technologyIds`,
          `Technology "${techId}" does not exist.`,
        );
      } else if (!technologyArmorLinks.get(techId)?.has(armor.id)) {
        error(
          "asymmetric-relationship",
          `${path}.technologyIds`,
          `Armor lists technology "${techId}" but that technology does not list armor "${armor.id}".`,
        );
      }
    }

    // Specs: all keys present; stated values must be cited.
    for (const key of SPEC_KEYS) {
      const spec = armor.specs[key];
      const spath = `${path}.specs.${key}`;
      if (!spec) {
        error("empty-record", spath, `Spec "${key}" is missing (use { status: "unknown" }).`);
        continue;
      }
      if (spec.status === "stated") {
        if (!spec.value.trim()) error("empty-record", spath, "Stated spec has an empty value.");
        checkCitations(spath, spec.citations);
      }
    }
  }

  /* ---- 6. Technologies --------------------------------------------------- */

  const armorTechnologyLinks = new Map<string, Set<string>>();
  for (const a of data.armors) {
    armorTechnologyLinks.set(a.id, new Set(a.technologyIds));
  }

  for (const tech of data.technologies) {
    const path = `technology:${tech.id}`;
    if (tech.facts.length === 0) {
      error("empty-record", path, "Technology has no facts.");
    }
    if (tech.connections.length === 0) {
      error("empty-record", `${path}.connections`, "Technology has no connected systems on record.");
    }
    if (tech.limitations.length === 0) {
      error("empty-record", `${path}.limitations`, "Technology has no limitations on record.");
    }
    if (tech.armorIds.length === 0) {
      error("empty-record", `${path}.armorIds`, "Technology is not linked to any armor.");
    }
    tech.connections.forEach((conn, i) => {
      const cpath = `${path}.connections[${i}]`;
      if (conn.technologyId === tech.id) {
        error("broken-relationship", cpath, "Connection points at its own technology.");
      } else if (!technologyIds.has(conn.technologyId)) {
        error("broken-relationship", cpath, `Connected technology "${conn.technologyId}" does not exist.`);
      }
    });
    for (const armorId of tech.armorIds) {
      if (!armorIds.has(armorId)) {
        error(
          "broken-relationship",
          `${path}.armorIds`,
          `Armor "${armorId}" does not exist.`,
        );
      } else if (!armorTechnologyLinks.get(armorId)?.has(tech.id)) {
        error(
          "asymmetric-relationship",
          `${path}.armorIds`,
          `Technology lists armor "${armorId}" but that armor does not list technology "${tech.id}".`,
        );
      }
    }
  }

  /* ---- 7. Suit diagram parts -------------------------------------------- */

  const partIds = checkIds("suit-part", data.suitParts);
  for (const expected of SUIT_PART_IDS) {
    if (!partIds.has(expected)) {
      error("empty-record", `suit-part:${expected}`, `Diagram part "${expected}" is missing.`);
    }
  }
  for (const part of data.suitParts) {
    const path = `suit-part:${part.id}`;
    if (!part.summary.trim()) error("empty-record", path, "Part has an empty summary.");
    if (part.technologyIds.length === 0) {
      error("broken-relationship", `${path}.technologyIds`, "Part links to no technology.");
    }
    for (const techId of part.technologyIds) {
      if (!technologyIds.has(techId)) {
        error("broken-relationship", `${path}.technologyIds`, `Technology "${techId}" does not exist.`);
      }
    }
    if (part.relatedFactIds.length === 0) {
      error("missing-citation", `${path}.relatedFactIds`, "Part summary is not backed by any archive fact.");
    }
    for (const factId of part.relatedFactIds) {
      if (!factIds.has(factId)) {
        error("broken-relationship", `${path}.relatedFactIds`, `Fact "${factId}" does not exist.`);
      }
    }
  }
  // Every technology should be reachable from the diagram.
  const coveredTech = new Set(data.suitParts.flatMap((p) => p.technologyIds));
  for (const tech of data.technologies) {
    if (!coveredTech.has(tech.id)) {
      warn("orphan-source", `technology:${tech.id}`, "Technology is not exposed by any diagram part.");
    }
  }

  /* ---- 8. Orphan sources ------------------------------------------------- */

  for (const source of data.sources) {
    if (!referencedSources.has(source.id)) {
      warn(
        "orphan-source",
        `source:${source.id}`,
        "Source is never cited by any fact, spec, or film.",
      );
    }
  }

  return {
    errors,
    warnings,
    counts: {
      films: data.films.length,
      sources: data.sources.length,
      armors: data.armors.length,
      technologies: data.technologies.length,
      suitParts: data.suitParts.length,
      facts: factCount,
      citations: citationCount,
    },
  };
}

/** Convenience for build-time use: throws if there are any errors. */
export function assertArchiveIntegrity(data: ArchiveData): IntegrityReport {
  const report = checkArchiveIntegrity(data);
  if (report.errors.length > 0) {
    const lines = report.errors.map((e) => `  [${e.code}] ${e.path}: ${e.message}`);
    throw new Error(
      `Archive integrity check failed with ${report.errors.length} error(s):\n${lines.join("\n")}`,
    );
  }
  return report;
}
