/**
 * Quiz engine for the J.A.R.V.I.S. terminal — pure and testable.
 * Question content lives in `src/data/quiz.ts` (hand-written) and
 * `src/lib/quiz-archive.ts` (generated from the archive records).
 */

export type QuizCategory = "iron-man" | "mcu" | "archive" | "humour";

export const QUIZ_CATEGORIES: readonly QuizCategory[] = ["iron-man", "mcu", "archive", "humour"];

export const QUIZ_CATEGORY_LABELS: Record<QuizCategory, string> = {
  "iron-man": "Iron Man",
  mcu: "MCU & Avengers",
  archive: "Armor & Technology",
  humour: "Workshop humour",
};

export type QuizQuestion = {
  /** Unique across the whole bank (static + generated). */
  id: string;
  category: QuizCategory;
  prompt: string;
  /** Exactly four answer texts. */
  options: string[];
  /** Index into `options`. */
  answer: number;
  /** Shown after answering (explanation, film reference, or a joke). */
  note?: string;
  /** Optional link to an archive record for generated questions. */
  link?: { href: string; label: string };
};

export const OPTIONS_PER_QUESTION = 4;

/** Run lengths offered on the intro screen. */
export const QUIZ_RUN_LENGTHS = { quick: 10, long: 20 } as const;

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/** Returns human-readable problems with a question bank (empty = valid). */
export function validateBank(bank: readonly QuizQuestion[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const q of bank) {
    if (ids.has(q.id)) problems.push(`duplicate id: ${q.id}`);
    ids.add(q.id);
    if (!q.prompt.trim()) problems.push(`${q.id}: empty prompt`);
    if (q.options.length !== OPTIONS_PER_QUESTION)
      problems.push(`${q.id}: ${q.options.length} options (expected ${OPTIONS_PER_QUESTION})`);
    if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length)
      problems.push(`${q.id}: duplicate options`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)
      problems.push(`${q.id}: answer index ${q.answer} out of range`);
    if (!QUIZ_CATEGORIES.includes(q.category)) problems.push(`${q.id}: unknown category`);
  }
  return problems;
}

/* ------------------------------------------------------------------ */
/* Shuffling and run building                                          */
/* ------------------------------------------------------------------ */

/** Fisher–Yates shuffle into a new array; `random` is injectable for tests. */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffles a question's options while keeping `answer` pointing at the right one. */
export function shuffleOptions(q: QuizQuestion, random: () => number): QuizQuestion {
  const order = shuffle(
    q.options.map((_, i) => i),
    random,
  );
  return {
    ...q,
    options: order.map((i) => q.options[i]),
    answer: order.indexOf(q.answer),
  };
}

/**
 * Builds one quiz run: `length` distinct questions drawn from the bank,
 * balanced across categories (round-robin over a shuffled category order),
 * then shuffled again so categories do not alternate predictably. Each
 * question's options are shuffled too. If the bank is smaller than `length`
 * the whole bank is used.
 */
export function buildRun(
  bank: readonly QuizQuestion[],
  length: number,
  random: () => number,
): QuizQuestion[] {
  const byCategory = new Map<QuizCategory, QuizQuestion[]>();
  for (const q of shuffle(bank, random)) {
    const list = byCategory.get(q.category) ?? [];
    list.push(q);
    byCategory.set(q.category, list);
  }
  const order = shuffle([...byCategory.keys()], random);
  const picked: QuizQuestion[] = [];
  const target = Math.min(length, bank.length);
  let progress = true;
  while (picked.length < target && progress) {
    progress = false;
    for (const cat of order) {
      if (picked.length >= target) break;
      const next = byCategory.get(cat)?.shift();
      if (next) {
        picked.push(next);
        progress = true;
      }
    }
  }
  return shuffle(picked, random).map((q) => shuffleOptions(q, random));
}

/* ------------------------------------------------------------------ */
/* Run state                                                           */
/* ------------------------------------------------------------------ */

export type QuizStatus = "idle" | "question" | "answered" | "finished";

export type QuizAnswerRecord = { id: string; category: QuizCategory; picked: number; correct: boolean };

export type QuizState = {
  status: QuizStatus;
  questions: QuizQuestion[];
  /** Index of the current question. */
  index: number;
  score: number;
  streak: number;
  bestStreak: number;
  /** Option picked for the current question, once answered. */
  picked: number | null;
  history: QuizAnswerRecord[];
};

export const INITIAL_QUIZ_STATE: QuizState = {
  status: "idle",
  questions: [],
  index: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  picked: null,
  history: [],
};

export type QuizAction =
  | { type: "start"; questions: QuizQuestion[] }
  | { type: "answer"; option: number }
  | { type: "next" }
  | { type: "reset" };

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "start": {
      if (action.questions.length === 0) return INITIAL_QUIZ_STATE;
      return { ...INITIAL_QUIZ_STATE, status: "question", questions: action.questions };
    }
    case "answer": {
      // Only the first answer counts; ignore stray clicks and out-of-range picks.
      if (state.status !== "question") return state;
      const q = state.questions[state.index];
      if (!q || action.option < 0 || action.option >= q.options.length) return state;
      const correct = action.option === q.answer;
      const streak = correct ? state.streak + 1 : 0;
      return {
        ...state,
        status: "answered",
        picked: action.option,
        score: state.score + (correct ? 1 : 0),
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        history: [
          ...state.history,
          { id: q.id, category: q.category, picked: action.option, correct },
        ],
      };
    }
    case "next": {
      if (state.status !== "answered") return state;
      const last = state.index >= state.questions.length - 1;
      if (last) return { ...state, status: "finished", picked: null };
      return { ...state, status: "question", index: state.index + 1, picked: null };
    }
    case "reset":
      return INITIAL_QUIZ_STATE;
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export const currentQuestion = (s: QuizState): QuizQuestion | undefined => s.questions[s.index];

export const scorePercent = (score: number, total: number): number =>
  total <= 0 ? 0 : Math.round((score / total) * 100);

/** J.A.R.V.I.S.'s one-line assessment of a run. */
export function verdict(score: number, total: number): string {
  const pct = scorePercent(score, total);
  if (total === 0) return "No data, sir.";
  if (pct === 100) return "Flawless. I'll tell Pepper you did your homework.";
  if (pct >= 80) return "Stark-level. Systems impressed, sir.";
  if (pct >= 60) return "Rhodey-level. Solid, slightly by-the-book.";
  if (pct >= 40) return "Happy-level. Enthusiastic. Occasionally accurate.";
  if (pct >= 20) return "Hammer-level. The prototype is, uh, a work in progress.";
  return "Dum-E-level. Sir, that's not even a good bad score.";
}

/** Correct/total per category for the result screen, in category order. */
export function categoryBreakdown(
  history: readonly QuizAnswerRecord[],
): { category: QuizCategory; label: string; correct: number; total: number }[] {
  return QUIZ_CATEGORIES.map((category) => {
    const rows = history.filter((h) => h.category === category);
    return {
      category,
      label: QUIZ_CATEGORY_LABELS[category],
      correct: rows.filter((h) => h.correct).length,
      total: rows.length,
    };
  }).filter((r) => r.total > 0);
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

/**
 * Roving focus inside the answer menu. Returns the option index to focus for
 * a navigation key, or null when the key is not a navigation key.
 */
export function moveSelection(current: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  const wrap = (n: number) => ((n % count) + count) % count;
  switch (key) {
    case "ArrowDown":
    case "ArrowRight":
      return wrap(current + 1);
    case "ArrowUp":
    case "ArrowLeft":
      return wrap(current - 1);
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Best run (persisted locally)                                        */
/* ------------------------------------------------------------------ */

export type BestRun = {
  /** Arcade points (see quiz-track displayScore). */
  points: number;
  correct: number;
  total: number;
  /** ISO timestamp. */
  at: string;
};

export const BEST_RUN_KEY = "stark-quiz:best";

/** Higher points win; on a tie the higher accuracy wins; an exact tie keeps the older run. */
export function isBetterRun(prev: BestRun | null, next: BestRun): boolean {
  if (!prev) return true;
  if (next.points !== prev.points) return next.points > prev.points;
  const pct = (r: BestRun) => (r.total > 0 ? r.correct / r.total : 0);
  return pct(next) > pct(prev);
}

/** Parses a stored best run; anything malformed reads as "no best yet". */
export function parseBestRun(raw: string | null | undefined): BestRun | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<BestRun> | null;
    if (
      !v ||
      typeof v.points !== "number" ||
      typeof v.correct !== "number" ||
      typeof v.total !== "number" ||
      typeof v.at !== "string" ||
      !Number.isFinite(v.points) ||
      v.total <= 0 ||
      v.correct < 0 ||
      v.correct > v.total
    ) {
      return null;
    }
    return { points: v.points, correct: v.correct, total: v.total, at: v.at };
  } catch {
    return null;
  }
}
