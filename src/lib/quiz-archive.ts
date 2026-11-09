/**
 * "Armor & Technology" quiz questions generated from the archive records in
 * `src/data/archive`, so the quiz can never drift from the archive. Nothing
 * here restates a fact: prompts are built from structured fields
 * (first-appearance film, design approach, alias, technology links, stated
 * specs, unique capability tags) and link back to the record they came from.
 *
 * Output is deterministic; `buildRun` in `quiz.ts` shuffles options later.
 */

import {
  ARMORS,
  CAPABILITY_TAG_LABELS,
  DESIGN_APPROACHES,
  DESIGN_APPROACH_LABELS,
  FILMS,
  SPEC_LABELS,
  TECHNOLOGIES,
  getFilm,
  type Armor,
  type CapabilityTag,
  type SpecKey,
} from "@/data/archive";
import { OPTIONS_PER_QUESTION, type QuizQuestion } from "./quiz";

const armorName = (a: Armor) => (a.alias ? `${a.designation} (${a.alias})` : a.designation);
const filmTitle = (id: string) => {
  const f = getFilm(id);
  return f ? `${f.title} (${f.releaseYear})` : id;
};
const armorLink = (a: Armor) => ({ href: `/armors/${a.id}`, label: `${a.designation} record` });

/**
 * Picks `n` distractors from `pool`, starting at a rotating offset so
 * neighbouring questions do not all share the same wrong answers.
 */
function distractors<T>(pool: readonly T[], n: number, seed: number): T[] {
  if (pool.length < n) return [];
  const start = seed % pool.length;
  const out: T[] = [];
  for (let i = 0; out.length < n && i < pool.length; i++) {
    out.push(pool[(start + i) % pool.length]);
  }
  return out;
}

/** Capability tags that exactly one armor in the archive is recorded with. */
const UNIQUE_CAPABILITY_TAGS: readonly CapabilityTag[] = [
  "portable",
  "remote-deployment",
  "strength",
  "instant-deployment",
  "stone-handling",
  "underwater-operation",
  "countermeasures",
  "energy-absorption",
];

/** Specs short enough to read as an answer option. */
const SPEC_QUESTION_KEYS: readonly SpecKey[] = ["shellMaterial", "powerSource"];

export function archiveQuestions(): QuizQuestion[] {
  const out: QuizQuestion[] = [];
  const distractorCount = OPTIONS_PER_QUESTION - 1;
  const armors = [...ARMORS].sort((a, b) => a.markNumber - b.markNumber);

  /* First appearance: armor → film. */
  armors.forEach((a, i) => {
    const correct = filmTitle(a.firstAppearanceFilmId);
    const others = FILMS.filter((f) => f.id !== a.firstAppearanceFilmId).map((f) =>
      filmTitle(f.id),
    );
    const wrong = distractors(others, distractorCount, i);
    if (wrong.length < distractorCount) return;
    out.push({
      id: `archive:first-film:${a.id}`,
      category: "archive",
      prompt: `In which film does the ${armorName(a)} first appear?`,
      options: [correct, ...wrong],
      answer: 0,
      note: `${a.summary}`,
      link: armorLink(a),
    });
  });

  /* Design approach: how the armor is built and put on. */
  armors.forEach((a, i) => {
    const correct = DESIGN_APPROACH_LABELS[a.design.approach];
    const others = DESIGN_APPROACHES.filter((d) => d !== a.design.approach).map(
      (d) => DESIGN_APPROACH_LABELS[d],
    );
    const wrong = distractors(others, distractorCount, i * 2 + 1);
    if (wrong.length < distractorCount) return;
    out.push({
      id: `archive:design:${a.id}`,
      category: "archive",
      prompt: `How is the ${armorName(a)} built and put on, according to the archive?`,
      options: [correct, ...wrong],
      answer: 0,
      note: a.design.text,
      link: armorLink(a),
    });
  });

  /* Alias: which armor is known as … */
  armors
    .filter((a) => a.alias)
    .forEach((a, i) => {
      const others = armors.filter((o) => o.id !== a.id).map((o) => o.designation);
      const wrong = distractors(others, distractorCount, i + 3);
      if (wrong.length < distractorCount) return;
      out.push({
        id: `archive:alias:${a.id}`,
        category: "archive",
        prompt: `Which armor is known as the "${a.alias}"?`,
        options: [a.designation, ...wrong],
        answer: 0,
        note: a.summary,
        link: armorLink(a),
      });
    });

  /* Technology ↔ armor links (both directions, where enough options exist). */
  TECHNOLOGIES.forEach((t, i) => {
    const withTech = armors.filter((a) => t.armorIds.includes(a.id));
    const without = armors.filter((a) => !t.armorIds.includes(a.id));
    const link = { href: `/technology/${t.id}`, label: `${t.name} record` };

    if (withTech.length >= 1 && without.length >= distractorCount) {
      const correct = withTech[i % withTech.length];
      out.push({
        id: `archive:tech-has:${t.id}`,
        category: "archive",
        prompt: `Which of these armors demonstrates "${t.name}" on-screen, per the archive?`,
        options: [
          correct.designation,
          ...distractors(
            without.map((a) => a.designation),
            distractorCount,
            i,
          ),
        ],
        answer: 0,
        note: t.summary,
        link,
      });
    }
    if (without.length >= 1 && withTech.length >= distractorCount) {
      const correct = without[i % without.length];
      out.push({
        id: `archive:tech-lacks:${t.id}`,
        category: "archive",
        prompt: `Which armor is NOT linked to "${t.name}" in the archive?`,
        options: [
          correct.designation,
          ...distractors(
            withTech.map((a) => a.designation),
            distractorCount,
            i + 1,
          ),
        ],
        answer: 0,
        note: t.summary,
        link,
      });
    }
  });

  /* Stated specs: the films give very few figures; ask about the ones they do. */
  armors.forEach((a, i) => {
    for (const key of SPEC_QUESTION_KEYS) {
      const spec = a.specs[key];
      if (spec.status !== "stated") continue;
      const others = armors.filter((o) => o.id !== a.id).map((o) => o.designation);
      const wrong = distractors(others, distractorCount, i + 5);
      if (wrong.length < distractorCount) continue;
      out.push({
        id: `archive:spec:${a.id}:${key}`,
        category: "archive",
        prompt: `Which armor's record states its ${SPEC_LABELS[key].toLowerCase()} as "${spec.value}"?`,
        options: [a.designation, ...wrong],
        answer: 0,
        note: "Film-stated values only — every other armor reads Unknown for this spec.",
        link: armorLink(a),
      });
    }
  });

  /* Capabilities unique to one armor. */
  UNIQUE_CAPABILITY_TAGS.forEach((tag, i) => {
    const holders = armors.filter((a) => a.capabilities.some((c) => c.tags.includes(tag)));
    if (holders.length !== 1) return; // data changed: no longer unique, skip
    const a = holders[0];
    const others = armors.filter((o) => o.id !== a.id).map((o) => o.designation);
    const wrong = distractors(others, distractorCount, i * 3);
    if (wrong.length < distractorCount) return;
    out.push({
      id: `archive:capability:${tag}`,
      category: "archive",
      prompt: `Which armor is the only one in the archive recorded with "${CAPABILITY_TAG_LABELS[tag]}"?`,
      options: [a.designation, ...wrong],
      answer: 0,
      note: a.capabilities.find((c) => c.tags.includes(tag))?.text,
      link: armorLink(a),
    });
  });

  return out;
}
