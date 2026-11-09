/**
 * Pure helpers for the quiz's retro "training path" and HUD: where the
 * sprite stands, what each checkpoint shows, and how the scoreboard reads.
 * Rendering lives in `src/components/companion/QuizTrack.tsx` / `QuizHud.tsx`.
 */

import type { QuizAnswerRecord } from "./quiz";

export type CheckpointState = "pending" | "current" | "correct" | "wrong";

/** Horizontal padding (fraction of track width) before the first and after the last checkpoint. */
export const TRACK_PAD = 0.08;

/** Points awarded per correct answer on the HUD (the reducer still counts answers). */
export const POINTS_PER_CORRECT = 100;
/** Extra points per streak step beyond the first, capped. */
export const STREAK_BONUS = 25;
export const STREAK_BONUS_CAP = 3;

/**
 * Checkpoint k (0-based) as a fraction of the track width. The start marker is
 * at `TRACK_PAD`; checkpoints are spread evenly up to `1 - TRACK_PAD`.
 */
export function checkpointPosition(index: number, total: number): number {
  if (total <= 0) return TRACK_PAD;
  const usable = 1 - TRACK_PAD * 2;
  return TRACK_PAD + ((index + 1) / total) * usable;
}

/** All checkpoint positions for a run. */
export function checkpointPositions(total: number): number[] {
  return Array.from({ length: total }, (_, i) => checkpointPosition(i, total));
}

/**
 * Where the sprite stands: at the start before any answer, then on the
 * checkpoint of the last answered question.
 */
export function spritePosition(answered: number, total: number): number {
  if (answered <= 0 || total <= 0) return TRACK_PAD;
  return checkpointPosition(Math.min(answered, total) - 1, total);
}

/**
 * State of every checkpoint given the answers so far. The checkpoint for the
 * question being asked is `current`; later ones are `pending`.
 */
export function checkpointStates(
  history: readonly QuizAnswerRecord[],
  total: number,
  finished = false,
): CheckpointState[] {
  return Array.from({ length: total }, (_, i) => {
    const h = history[i];
    if (h) return h.correct ? "correct" : "wrong";
    if (i === history.length && !finished) return "current";
    return "pending";
  });
}

/**
 * Arcade-style points: 100 per correct answer plus a small streak bonus
 * (+25 for each consecutive correct beyond the first, capped at +75).
 */
export function displayScore(history: readonly QuizAnswerRecord[]): number {
  let points = 0;
  let streak = 0;
  for (const h of history) {
    if (h.correct) {
      streak += 1;
      points += POINTS_PER_CORRECT + Math.min(STREAK_BONUS_CAP, streak - 1) * STREAK_BONUS;
    } else {
      streak = 0;
    }
  }
  return points;
}

/** Points the last answer was worth (for the "+125" popup); 0 for a miss. */
export function lastAnswerPoints(history: readonly QuizAnswerRecord[]): number {
  if (history.length === 0) return 0;
  return displayScore(history) - displayScore(history.slice(0, -1));
}

/** Zero-padded counter, like a cabinet scoreboard. */
export function padCounter(n: number, width: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(width, "0");
}

/** 0–3: how hot the streak flame burns. */
export function streakTier(streak: number): 0 | 1 | 2 | 3 {
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  if (streak >= 1) return 1;
  return 0;
}

export type Rank = "S" | "A" | "B" | "C" | "D";

/** Letter rank for the result card. */
export function rankFor(score: number, total: number): Rank {
  if (total <= 0) return "D";
  const pct = score / total;
  if (pct >= 1) return "S";
  if (pct >= 0.8) return "A";
  if (pct >= 0.6) return "B";
  if (pct >= 0.4) return "C";
  return "D";
}

/** Title-card line for the result, game-style. */
export function resultTitle(score: number, total: number): string {
  const pct = total <= 0 ? 0 : score / total;
  if (pct >= 1) return "Perfect run";
  if (pct >= 0.6) return "Stage clear";
  if (pct >= 0.4) return "Stage complete";
  return "Try again, sir";
}
