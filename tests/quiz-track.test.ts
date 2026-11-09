import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  POINTS_PER_CORRECT,
  STREAK_BONUS,
  TRACK_PAD,
  checkpointPosition,
  checkpointPositions,
  checkpointStates,
  displayScore,
  lastAnswerPoints,
  padCounter,
  rankFor,
  resultTitle,
  spritePosition,
  streakTier,
} from "@/lib/quiz-track";
import type { QuizAnswerRecord } from "@/lib/quiz";

const rec = (correct: boolean, i: number): QuizAnswerRecord => ({
  id: `q${i}`,
  category: "iron-man",
  picked: 0,
  correct,
});
const hist = (...flags: boolean[]) => flags.map((c, i) => rec(c, i));

describe("training path geometry", () => {
  it("spreads checkpoints evenly between the padded ends", () => {
    const pos = checkpointPositions(10);
    assert.equal(pos.length, 10);
    assert.ok(pos[0] > TRACK_PAD);
    assert.ok(Math.abs(pos[9] - (1 - TRACK_PAD)) < 1e-9, "last checkpoint sits at the end pad");
    for (let i = 1; i < pos.length; i++) {
      assert.ok(pos[i] > pos[i - 1], "strictly increasing");
      assert.ok(Math.abs(pos[i] - pos[i - 1] - (pos[1] - pos[0])) < 1e-9, "even spacing");
    }
    assert.equal(checkpointPosition(0, 0), TRACK_PAD);
  });

  it("the sprite starts at the start marker and advances one checkpoint per answer", () => {
    assert.equal(spritePosition(0, 10), TRACK_PAD);
    assert.equal(spritePosition(1, 10), checkpointPosition(0, 10));
    assert.equal(spritePosition(4, 10), checkpointPosition(3, 10));
    assert.equal(spritePosition(10, 10), checkpointPosition(9, 10));
    // Defensive: never beyond the last checkpoint.
    assert.equal(spritePosition(12, 10), checkpointPosition(9, 10));
    // Always moves forward as answers accumulate.
    for (let n = 1; n <= 10; n++) assert.ok(spritePosition(n, 10) > spritePosition(n - 1, 10));
  });
});

describe("checkpoint states", () => {
  it("marks answered checkpoints right/wrong, the live one current, the rest pending", () => {
    assert.deepEqual(checkpointStates(hist(true, false), 5), [
      "correct",
      "wrong",
      "current",
      "pending",
      "pending",
    ]);
    assert.deepEqual(checkpointStates([], 3), ["current", "pending", "pending"]);
  });

  it("has no current checkpoint once the run is finished", () => {
    assert.deepEqual(checkpointStates(hist(true, true, false), 3, true), ["correct", "correct", "wrong"]);
    // Finished flag also suppresses a phantom "current" when history is shorter.
    assert.deepEqual(checkpointStates(hist(true), 2, true), ["correct", "pending"]);
  });
});

describe("HUD scoreboard", () => {
  it("awards 100 per correct answer and a capped streak bonus", () => {
    assert.equal(displayScore([]), 0);
    assert.equal(displayScore(hist(true)), 100);
    assert.equal(displayScore(hist(false)), 0);
    // 100, 125, 150, 175, 175 (cap), then a miss resets the bonus
    assert.equal(displayScore(hist(true, true, true, true, true)), 100 + 125 + 150 + 175 + 175);
    assert.equal(displayScore(hist(true, true, false, true)), 100 + 125 + 0 + 100);
    assert.equal(POINTS_PER_CORRECT, 100);
    assert.equal(STREAK_BONUS, 25);
  });

  it("reports what the last answer was worth", () => {
    assert.equal(lastAnswerPoints([]), 0);
    assert.equal(lastAnswerPoints(hist(true)), 100);
    assert.equal(lastAnswerPoints(hist(true, true)), 125);
    assert.equal(lastAnswerPoints(hist(true, true, false)), 0);
  });

  it("pads counters like a cabinet and never goes negative", () => {
    assert.equal(padCounter(7, 2), "07");
    assert.equal(padCounter(350, 5), "00350");
    assert.equal(padCounter(-3, 2), "00");
    assert.equal(padCounter(123456, 4), "123456");
  });

  it("streak flame tiers", () => {
    assert.equal(streakTier(0), 0);
    assert.equal(streakTier(1), 1);
    assert.equal(streakTier(2), 1);
    assert.equal(streakTier(3), 2);
    assert.equal(streakTier(5), 3);
    assert.equal(streakTier(9), 3);
  });

  it("rank letters and result titles by percentage", () => {
    assert.equal(rankFor(10, 10), "S");
    assert.equal(rankFor(8, 10), "A");
    assert.equal(rankFor(6, 10), "B");
    assert.equal(rankFor(4, 10), "C");
    assert.equal(rankFor(3, 10), "D");
    assert.equal(rankFor(0, 0), "D");
    assert.equal(resultTitle(10, 10), "Perfect run");
    assert.equal(resultTitle(7, 10), "Stage clear");
    assert.equal(resultTitle(5, 10), "Stage complete");
    assert.equal(resultTitle(2, 10), "Try again, sir");
  });
});
