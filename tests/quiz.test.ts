import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BEST_RUN_KEY,
  INITIAL_QUIZ_STATE,
  OPTIONS_PER_QUESTION,
  QUIZ_CATEGORIES,
  buildRun,
  isBetterRun,
  moveSelection,
  parseBestRun,
  categoryBreakdown,
  currentQuestion,
  quizReducer,
  scorePercent,
  shuffle,
  shuffleOptions,
  validateBank,
  verdict,
  type BestRun,
  type QuizQuestion,
  type QuizState,
} from "@/lib/quiz";
import { archiveQuestions } from "@/lib/quiz-archive";
import { quizBank } from "@/lib/quiz-bank";
import { STATIC_QUESTIONS } from "@/data/quiz";
import { ARMORS, TECHNOLOGIES } from "@/data/archive";

/** Deterministic PRNG (mulberry32) so shuffles are reproducible in tests. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const q = (id: string, category: QuizQuestion["category"] = "iron-man"): QuizQuestion => ({
  id,
  category,
  prompt: `Prompt ${id}`,
  options: ["A", "B", "C", "D"],
  answer: 2,
});

/** Runs a whole quiz through the reducer, answering with `pick(question)`. */
function play(questions: QuizQuestion[], pick: (q: QuizQuestion, i: number) => number): QuizState {
  let s = quizReducer(INITIAL_QUIZ_STATE, { type: "start", questions });
  let i = 0;
  while (s.status === "question") {
    s = quizReducer(s, { type: "answer", option: pick(currentQuestion(s)!, i++) });
    s = quizReducer(s, { type: "next" });
  }
  return s;
}

describe("quiz bank content", () => {
  it("static and generated questions are well-formed and ids are unique across the bank", () => {
    assert.deepEqual(validateBank(STATIC_QUESTIONS), []);
    assert.deepEqual(validateBank(archiveQuestions()), []);
    assert.deepEqual(validateBank(quizBank()), []);
    assert.ok(quizBank().length >= 30, "bank has at least 30 questions");
  });

  it("covers every category with several questions", () => {
    const bank = quizBank();
    for (const c of QUIZ_CATEGORIES) {
      assert.ok(bank.filter((x) => x.category === c).length >= 5, `category ${c}`);
    }
  });

  it("validateBank reports problems", () => {
    const bad: QuizQuestion[] = [
      { ...q("dup"), options: ["A", "B", "C"] },
      { ...q("dup"), answer: 9 },
      { ...q("same"), options: ["x", "X", "y", "z"] },
    ];
    const problems = validateBank(bad);
    assert.ok(problems.some((p) => p.includes("duplicate id")));
    assert.ok(problems.some((p) => p.includes("3 options")));
    assert.ok(problems.some((p) => p.includes("out of range")));
    assert.ok(problems.some((p) => p.includes("duplicate options")));
  });
});

describe("archive-generated questions", () => {
  it("asks a first-appearance question for every armor, with the right film and a record link", () => {
    const generated = archiveQuestions();
    for (const a of ARMORS) {
      const item = generated.find((x) => x.id === `archive:first-film:${a.id}`);
      assert.ok(item, `question for ${a.id}`);
      assert.equal(item.category, "archive");
      assert.equal(item.link?.href, `/armors/${a.id}`);
      assert.ok(item.prompt.includes(a.designation));
      // Correct option names the first-appearance film, and it is unique.
      assert.equal(item.options.filter((o) => o === item.options[item.answer]).length, 1);
    }
  });

  it("technology questions only name armors that really are (or are not) linked", () => {
    const generated = archiveQuestions();
    for (const t of TECHNOLOGIES) {
      const has = generated.find((x) => x.id === `archive:tech-has:${t.id}`);
      if (has) {
        const correct = ARMORS.find((a) => a.designation === has.options[has.answer])!;
        assert.ok(t.armorIds.includes(correct.id));
        for (const [i, o] of has.options.entries()) {
          if (i === has.answer) continue;
          const wrong = ARMORS.find((a) => a.designation === o)!;
          assert.ok(!t.armorIds.includes(wrong.id), `${o} wrongly offered for ${t.id}`);
        }
      }
      const lacks = generated.find((x) => x.id === `archive:tech-lacks:${t.id}`);
      if (lacks) {
        const correct = ARMORS.find((a) => a.designation === lacks.options[lacks.answer])!;
        assert.ok(!t.armorIds.includes(correct.id));
      }
    }
    // Nanotechnology has only two armors, so it can have a "has" question but no "lacks" one.
    assert.ok(generated.some((x) => x.id === "archive:tech-has:nanotechnology"));
    assert.ok(!generated.some((x) => x.id === "archive:tech-lacks:nanotechnology"));
  });

  it("is deterministic (same output on every call)", () => {
    assert.deepEqual(archiveQuestions(), archiveQuestions());
  });
});

describe("shuffling", () => {
  it("shuffle keeps every item exactly once and is reproducible by seed", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const a = shuffle(items, seeded(1));
    const b = shuffle(items, seeded(1));
    const c = shuffle(items, seeded(2));
    assert.deepEqual([...a].sort((x, y) => x - y), items);
    assert.deepEqual(a, b);
    assert.notDeepEqual(a, c);
    assert.notDeepEqual(a, items);
    assert.deepEqual(items, Array.from({ length: 20 }, (_, i) => i), "input untouched");
  });

  it("shuffleOptions keeps the answer pointing at the correct text", () => {
    const base = q("x");
    for (let seed = 0; seed < 25; seed++) {
      const s = shuffleOptions(base, seeded(seed));
      assert.equal(s.options[s.answer], base.options[base.answer]);
      assert.deepEqual([...s.options].sort(), [...base.options].sort());
    }
  });
});

describe("buildRun", () => {
  const bank: QuizQuestion[] = [
    ...Array.from({ length: 12 }, (_, i) => q(`im-${i}`, "iron-man")),
    ...Array.from({ length: 12 }, (_, i) => q(`mcu-${i}`, "mcu")),
    ...Array.from({ length: 30 }, (_, i) => q(`ar-${i}`, "archive")),
    ...Array.from({ length: 6 }, (_, i) => q(`fun-${i}`, "humour")),
  ];

  it("returns the requested number of distinct questions", () => {
    const run = buildRun(bank, 10, seeded(7));
    assert.equal(run.length, 10);
    assert.equal(new Set(run.map((x) => x.id)).size, 10);
  });

  it("never repeats a question inside one run (many seeds, real bank)", () => {
    const real = quizBank();
    for (let seed = 0; seed < 50; seed++) {
      const run = buildRun(real, 20, seeded(seed));
      assert.equal(run.length, 20);
      assert.equal(new Set(run.map((x) => x.id)).size, run.length, `seed ${seed}`);
    }
  });

  it("balances categories instead of letting the biggest one dominate", () => {
    const run = buildRun(bank, 12, seeded(3));
    const counts = new Map<string, number>();
    for (const x of run) counts.set(x.category, (counts.get(x.category) ?? 0) + 1);
    for (const c of QUIZ_CATEGORIES) assert.equal(counts.get(c), 3, `category ${c}`);
  });

  it("shuffles order and options, differently for different seeds", () => {
    const a = buildRun(bank, 10, seeded(1)).map((x) => x.id);
    const b = buildRun(bank, 10, seeded(2)).map((x) => x.id);
    assert.notDeepEqual(a, b);
    const run = buildRun(bank, 10, seeded(5));
    assert.ok(run.some((x) => x.answer !== 2), "options were shuffled");
    for (const x of run) assert.equal(x.options[x.answer], "C");
  });

  it("caps at the bank size and tolerates an empty bank", () => {
    assert.equal(buildRun(bank.slice(0, 4), 10, seeded(1)).length, 4);
    assert.deepEqual(buildRun([], 10, seeded(1)), []);
  });
});

describe("quiz reducer", () => {
  const three = [q("a"), q("b"), q("c")];

  it("starts at question 1 with a clean scoreboard", () => {
    const s = quizReducer(INITIAL_QUIZ_STATE, { type: "start", questions: three });
    assert.equal(s.status, "question");
    assert.equal(s.index, 0);
    assert.equal(s.score, 0);
    assert.equal(s.streak, 0);
    assert.equal(s.picked, null);
    assert.equal(currentQuestion(s)?.id, "a");
    assert.equal(quizReducer(INITIAL_QUIZ_STATE, { type: "start", questions: [] }).status, "idle");
  });

  it("scores correct answers, resets the streak on a miss, and tracks the best streak", () => {
    // right, right, wrong, right → score 3, streak 1, best 2
    const s = play([q("1"), q("2"), q("3"), q("4")], (_, i) => (i === 2 ? 0 : 2));
    assert.equal(s.status, "finished");
    assert.equal(s.score, 3);
    assert.equal(s.streak, 1);
    assert.equal(s.bestStreak, 2);
    assert.deepEqual(
      s.history.map((h) => h.correct),
      [true, true, false, true],
    );
  });

  it("records which option was picked and moves on only after an answer", () => {
    let s = quizReducer(INITIAL_QUIZ_STATE, { type: "start", questions: three });
    assert.equal(quizReducer(s, { type: "next" }), s, "next before answering is ignored");
    s = quizReducer(s, { type: "answer", option: 0 });
    assert.equal(s.status, "answered");
    assert.equal(s.picked, 0);
    assert.equal(s.score, 0);
    s = quizReducer(s, { type: "next" });
    assert.equal(s.status, "question");
    assert.equal(s.index, 1);
    assert.equal(s.picked, null);
  });

  it("counts only the first answer to a question", () => {
    let s = quizReducer(INITIAL_QUIZ_STATE, { type: "start", questions: three });
    s = quizReducer(s, { type: "answer", option: 0 }); // wrong
    const again = quizReducer(s, { type: "answer", option: 2 }); // would be right
    assert.equal(again, s);
    assert.equal(again.score, 0);
    assert.equal(again.history.length, 1);
  });

  it("ignores out-of-range options", () => {
    const s = quizReducer(INITIAL_QUIZ_STATE, { type: "start", questions: three });
    assert.equal(quizReducer(s, { type: "answer", option: 4 }), s);
    assert.equal(quizReducer(s, { type: "answer", option: -1 }), s);
  });

  it("finishes after the last question and then ignores further answers", () => {
    const s = play(three, () => 2);
    assert.equal(s.status, "finished");
    assert.equal(s.score, 3);
    assert.equal(s.index, 2);
    assert.equal(quizReducer(s, { type: "answer", option: 2 }), s);
    assert.equal(quizReducer(s, { type: "next" }), s);
  });

  it("restarting gives a fresh run: scores cleared, new question order, no carry-over", () => {
    const finished = play(three, () => 2);
    const reset = quizReducer(finished, { type: "reset" });
    assert.deepEqual(reset, INITIAL_QUIZ_STATE);

    const bank = quizBank();
    const first = buildRun(bank, 10, seeded(11));
    const second = buildRun(bank, 10, seeded(12));
    const s2 = quizReducer(finished, { type: "start", questions: second });
    assert.equal(s2.score, 0);
    assert.equal(s2.streak, 0);
    assert.equal(s2.bestStreak, 0);
    assert.equal(s2.index, 0);
    assert.deepEqual(s2.history, []);
    assert.notDeepEqual(
      first.map((x) => x.id),
      second.map((x) => x.id),
    );
  });
});

describe("results", () => {
  it("percent and verdict tiers", () => {
    assert.equal(scorePercent(7, 10), 70);
    assert.equal(scorePercent(0, 0), 0);
    assert.match(verdict(10, 10), /Flawless/);
    assert.match(verdict(8, 10), /Stark/);
    assert.match(verdict(6, 10), /Rhodey/);
    assert.match(verdict(4, 10), /Happy/);
    assert.match(verdict(2, 10), /Hammer/);
    assert.match(verdict(0, 10), /Dum-E/);
  });

  it("category breakdown only lists categories that were asked", () => {
    const s = play(
      [q("a", "iron-man"), q("b", "iron-man"), q("c", "humour")],
      (_, i) => (i === 1 ? 0 : 2),
    );
    assert.deepEqual(
      categoryBreakdown(s.history).map((r) => [r.category, r.correct, r.total]),
      [
        ["iron-man", 1, 2],
        ["humour", 1, 1],
      ],
    );
  });

  it("OPTIONS_PER_QUESTION is four", () => {
    assert.equal(OPTIONS_PER_QUESTION, 4);
  });
});

describe("keyboard navigation in the answer menu", () => {
  it("arrows wrap, Home/End jump, other keys are ignored", () => {
    assert.equal(moveSelection(0, "ArrowDown", 4), 1);
    assert.equal(moveSelection(3, "ArrowDown", 4), 0);
    assert.equal(moveSelection(0, "ArrowUp", 4), 3);
    assert.equal(moveSelection(2, "ArrowRight", 4), 3);
    assert.equal(moveSelection(2, "ArrowLeft", 4), 1);
    assert.equal(moveSelection(2, "Home", 4), 0);
    assert.equal(moveSelection(0, "End", 4), 3);
    assert.equal(moveSelection(0, "Enter", 4), null);
    assert.equal(moveSelection(0, "ArrowDown", 0), null);
  });
});

describe("best run (local)", () => {
  const run = (points: number, correct: number, total = 10): BestRun => ({
    points,
    correct,
    total,
    at: "2026-01-01T00:00:00.000Z",
  });

  it("first run is always a best; then higher points, then higher accuracy", () => {
    assert.equal(isBetterRun(null, run(100, 1)), true);
    assert.equal(isBetterRun(run(500, 5), run(600, 5)), true);
    assert.equal(isBetterRun(run(600, 5), run(500, 6)), false, "points beat accuracy");
    assert.equal(isBetterRun(run(500, 5, 10), run(500, 5, 8)), true, "same points, better accuracy");
    assert.equal(isBetterRun(run(500, 5), run(500, 5)), false, "exact tie keeps the older run");
  });

  it("parses stored values defensively", () => {
    const good = run(1275, 9);
    assert.deepEqual(parseBestRun(JSON.stringify(good)), good);
    assert.equal(parseBestRun(null), null);
    assert.equal(parseBestRun(""), null);
    assert.equal(parseBestRun("not json"), null);
    assert.equal(parseBestRun(JSON.stringify({ points: "9" })), null);
    assert.equal(parseBestRun(JSON.stringify({ ...good, total: 0 })), null);
    assert.equal(parseBestRun(JSON.stringify({ ...good, correct: 11 })), null);
    assert.equal(BEST_RUN_KEY, "stark-quiz:best");
  });
});
