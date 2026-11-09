"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type KeyboardEvent } from "react";
import {
  BEST_RUN_KEY,
  QUIZ_CATEGORY_LABELS,
  QUIZ_RUN_LENGTHS,
  buildRun,
  categoryBreakdown,
  currentQuestion,
  isBetterRun,
  moveSelection,
  parseBestRun,
  quizReducer,
  scorePercent,
  verdict,
  type BestRun,
  type QuizAction,
  type QuizState,
} from "@/lib/quiz";
import { quizBank } from "@/lib/quiz-bank";
import { displayScore, lastAnswerPoints, padCounter, rankFor, resultTitle } from "@/lib/quiz-track";
import { QuizHud } from "./QuizHud";
import { QuizWorld } from "./QuizWorld";

type Props = {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
  /** Called when a run finishes, with the percentage scored. */
  onFinished?: (percent: number) => void;
  /** Closes the terminal (used by the archive record links). */
  onClose: () => void;
};

const OPTION_KEYS = ["1", "2", "3", "4"];

function readBest(): BestRun | null {
  try {
    return parseBestRun(window.localStorage.getItem(BEST_RUN_KEY));
  } catch {
    return null;
  }
}

function writeBest(run: BestRun) {
  try {
    window.localStorage.setItem(BEST_RUN_KEY, JSON.stringify(run));
  } catch {
    /* storage unavailable: best run is per page load only */
  }
}

/**
 * The Stark Training Grounds quiz, rendered entirely inside the retro world:
 * title card, per question a cabinet HUD + the path + an in-world dialog box
 * with an RPG-style answer menu, and a result card with a rank. Game logic is
 * `quizReducer` (src/lib/quiz.ts); the run state lives in the companion so
 * closing and reopening the terminal resumes where you were.
 */
export function JarvisQuiz({ state, dispatch, onFinished, onClose }: Props) {
  const bank = useMemo(() => quizBank(), []);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLOListElement | null>(null);
  // Only ever rendered on the client (inside the open terminal), so reading
  // storage in the initializer is safe.
  const [best, setBest] = useState<BestRun | null>(() => (typeof window === "undefined" ? null : readBest()));
  const [newBest, setNewBest] = useState(false);

  const start = useCallback(
    (length: number) => {
      setNewBest(false);
      dispatch({ type: "start", questions: buildRun(bank, length, Math.random) });
    },
    [bank, dispatch],
  );

  const question = currentQuestion(state);
  const total = state.questions.length;
  const points = displayScore(state.history);

  /* Keyboard-first: the primary action of each screen takes focus. */
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [state.status, state.index]);

  /* "Next" after the last question finishes the run: notify the companion and
     record a local best. Done in the handler (not an effect) so it runs
     exactly once per run, in the same tick as the state change. */
  const next = () => {
    const after = quizReducer(state, { type: "next" });
    if (after.status === "finished" && state.status === "answered") {
      onFinished?.(scorePercent(after.score, after.questions.length));
      const run: BestRun = {
        points: displayScore(after.history),
        correct: after.score,
        total: after.questions.length,
        at: new Date().toISOString(),
      };
      if (isBetterRun(readBest(), run)) {
        writeBest(run);
        setBest(run);
        setNewBest(true);
      }
    }
    dispatch({ type: "next" });
  };

  /* Number keys 1–4 answer the current question. */
  useEffect(() => {
    if (state.status !== "question") return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      const i = OPTION_KEYS.indexOf(e.key);
      if (i === -1 || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      dispatch({ type: "answer", option: i });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [state.status, dispatch]);

  /* Arrow keys move between answers (roving focus). */
  const onMenuKey = (e: KeyboardEvent<HTMLOListElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const current = buttons.findIndex((b) => b === document.activeElement);
    const next = moveSelection(Math.max(0, current), e.key, buttons.length);
    if (next === null) return;
    e.preventDefault();
    buttons[next]?.focus();
  };

  const bestLine = best
    ? `Best ${padCounter(best.points, 5)} · ${best.correct}/${best.total} · Rank ${rankFor(best.correct, best.total)}`
    : "No run on file yet";

  /* ------------------------------ title card ------------------------------ */
  if (state.status === "idle") {
    return (
      <QuizWorld total={QUIZ_RUN_LENGTHS.quick} history={[]} preview>
        <section aria-labelledby="quiz-title" className="px-dialog px-dialog--title">
          <span className="font-pixel text-[11px] uppercase tracking-[0.16em] text-zinc-400">J.A.R.V.I.S. presents</span>
          <h3 id="quiz-title" className="px-title font-pixel text-[24px] uppercase leading-none text-accent md:text-[34px]">
            Stark Training Grounds
          </h3>
          <p className="font-pixel text-[12px] leading-[1.7] text-zinc-300 md:text-[13px]">
            {bank.length}{" "}questions on file: Iron Man, the wider MCU, the armor &amp; technology
            archive, and a little workshop humour. One checkpoint per question — clear them all to
            reach the tower.
          </p>
          <p className="font-pixel text-[11px] uppercase tracking-[0.12em] text-accent" aria-live="polite">
            {bestLine}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button ref={primaryRef} type="button" onClick={() => start(QUIZ_RUN_LENGTHS.quick)} className="px-btn px-btn--primary">
              <span className="px-cursor" aria-hidden>&#9654;</span>
              Quick run &middot; {QUIZ_RUN_LENGTHS.quick}
            </button>
            <button type="button" onClick={() => start(QUIZ_RUN_LENGTHS.long)} className="px-btn">
              Long run &middot; {QUIZ_RUN_LENGTHS.long}
            </button>
          </div>
          <p className="font-pixel text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Keys 1–4 or arrows answer &middot; Enter continues &middot; Esc closes
          </p>
        </section>
      </QuizWorld>
    );
  }

  /* ------------------------------- results -------------------------------- */
  if (state.status === "finished") {
    const rank = rankFor(state.score, total);
    const rows = categoryBreakdown(state.history);
    return (
      <QuizWorld
        total={total}
        history={state.history}
        finished
        hud={<QuizHud points={points} streak={state.bestStreak} stage={total} total={total} rank={rank} />}
      >
        <section aria-labelledby="quiz-result-title" className="px-dialog flex flex-col gap-4">
          <div className="flex items-center gap-4 md:gap-5">
            <div className="px-rank" data-rank={rank} aria-label={`Rank ${rank}`}>
              <span className="font-pixel">{rank}</span>
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 id="quiz-result-title" className="px-title font-pixel text-[20px] uppercase leading-none text-accent md:text-[26px]">
                {resultTitle(state.score, total)}
              </h3>
              <p className="font-pixel text-[11px] uppercase tracking-[0.12em] text-zinc-300" role="status">
                {state.score} / {total} checkpoints &middot; {scorePercent(state.score, total)}%
                {newBest && <span className="px-newbest"> New best!</span>}
              </p>
              <p className="font-pixel text-[12px] leading-[1.6] text-zinc-300 md:text-[13px]">{verdict(state.score, total)}</p>
            </div>
          </div>

          <ul aria-label="Score by category" className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {rows.map((r) => (
              <li
                key={r.category}
                className="flex items-baseline justify-between gap-4 border-b-2 border-dotted border-white/10 pb-1.5 font-pixel text-[11px] uppercase tracking-[0.1em]"
              >
                <span className="text-zinc-400">{r.label}</span>
                <span className={r.correct === r.total ? "text-accent" : "text-zinc-200"}>
                  {r.correct}/{r.total}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3">
            <button ref={primaryRef} type="button" onClick={() => start(total)} className="px-btn px-btn--primary">
              <span className="px-cursor" aria-hidden>&#9654;</span>
              Run again &middot; {total}
            </button>
            <button type="button" onClick={() => dispatch({ type: "reset" })} className="px-btn">
              Title screen
            </button>
            <span className="font-pixel text-[10px] uppercase tracking-[0.12em] text-zinc-500">{bestLine}</span>
          </div>
        </section>
      </QuizWorld>
    );
  }

  /* ------------------------------- question ------------------------------- */
  if (!question) return null;
  const answered = state.status === "answered";
  const correct = answered && state.picked === question.answer;
  const feedback = answered ? (correct ? "correct" : "wrong") : null;
  const last = state.index === total - 1;
  const earned = lastAnswerPoints(state.history);

  return (
    <QuizWorld
      total={total}
      history={state.history}
      feedback={feedback}
      points={earned}
      hud={<QuizHud points={points} streak={state.streak} stage={state.index + 1} total={total} />}
    >
      <div className="px-dialog flex flex-col gap-3" key={question.id}>
        <span className="font-pixel text-[10px] uppercase tracking-[0.16em] text-accent">
          {QUIZ_CATEGORY_LABELS[question.category]}
          {question.category === "archive" && <span className="text-zinc-500">{" · from the archive"}</span>}
        </span>
        <h3 className="font-pixel text-[15px] leading-[1.5] text-foreground md:text-[17px]">{question.prompt}</h3>

        <ol ref={menuRef} className="px-menu" aria-label="Answers" onKeyDown={onMenuKey}>
          {question.options.map((option, i) => {
            let tone = "px-menu__item";
            if (answered) {
              if (i === question.answer) tone += " px-menu__item--correct";
              else if (i === state.picked) tone += " px-menu__item--wrong";
              else tone += " px-menu__item--dim";
            }
            return (
              <li key={option}>
                <button
                  ref={i === 0 && !answered ? primaryRef : undefined}
                  type="button"
                  className={tone}
                  disabled={answered}
                  onClick={() => dispatch({ type: "answer", option: i })}
                  aria-pressed={answered ? i === state.picked : undefined}
                >
                  <span className="px-cursor" aria-hidden>&#9654;</span>
                  <span className="px-menu__key" aria-hidden>
                    {OPTION_KEYS[i]}
                  </span>
                  <span className="min-w-0 flex-1">{option}</span>
                  {answered && i === question.answer && (
                    <span className="px-menu__mark" aria-label="Correct answer">
                      OK
                    </span>
                  )}
                  {answered && i === state.picked && i !== question.answer && (
                    <span className="px-menu__mark" aria-label="Your answer">
                      X
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <div role="status" aria-live="polite" className="min-h-[4px]">
          {answered && (
            <div className={`px-feedback ${correct ? "px-feedback--correct" : "px-feedback--wrong"}`}>
              <p className="font-pixel text-[12px] uppercase tracking-[0.12em]">
                {correct ? (
                  <>
                    Correct! +{earned}
                    {state.streak >= 3 ? ` · streak x${state.streak}` : ""}
                  </>
                ) : (
                  <>Miss! Answer: {question.options[question.answer]}</>
                )}
              </p>
              {question.note && (
                <p className="mt-1.5 font-pixel text-[12px] leading-[1.65] text-zinc-300 md:text-[13px]">{question.note}</p>
              )}
              {question.link && (
                <Link
                  href={question.link.href}
                  onClick={onClose}
                  className="px-link mt-2 inline-flex items-center gap-1.5 font-pixel text-[11px] uppercase tracking-[0.12em] text-accent"
                >
                  {question.link.label} &#8599;
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            ref={answered ? primaryRef : undefined}
            type="button"
            onClick={next}
            disabled={!answered}
            className="px-btn px-btn--primary"
          >
            {last ? "Results" : "Next"}
            <span className="px-cursor px-cursor--trail" aria-hidden>&#9654;</span>
          </button>
          <button type="button" onClick={() => dispatch({ type: "reset" })} className="px-link font-pixel text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            Abort run
          </button>
        </div>
      </div>
    </QuizWorld>
  );
}
