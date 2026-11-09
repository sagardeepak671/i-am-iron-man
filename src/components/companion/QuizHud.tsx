import { padCounter, streakTier } from "@/lib/quiz-track";

type Props = {
  /** Arcade points (see `displayScore`). */
  points: number;
  streak: number;
  /** 1-based question number and total. */
  stage: number;
  total: number;
  /** Shown instead of the stage counter on the result card. */
  rank?: string;
};

/** Tiny pixel flame; hotter tiers are taller and brighter. */
function Flame({ tier }: { tier: 0 | 1 | 2 | 3 }) {
  return (
    <svg
      viewBox="0 0 6 8"
      className="qh-flame"
      data-tier={tier}
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
    >
      <path className="qh-flame__outer" d="M2 0h2v1h1v2h1v3h-1v1h-1v1h-2v-1h-1v-1h-1v-3h1v-2h1z" />
      <path className="qh-flame__core" d="M2 4h2v2h-1v1h-1v-1h-1v-1h1z" />
    </svg>
  );
}

/**
 * Arcade-cabinet scoreboard for the quiz: SCORE · STREAK · STAGE in the pixel
 * face, with a flame that grows with the streak.
 */
export function QuizHud({ points, streak, stage, total, rank }: Props) {
  const tier = streakTier(streak);
  const summary = rank
    ? `Score ${points} points, best streak ${streak}, rank ${rank}`
    : `Score ${points} points, streak ${streak}, question ${stage} of ${total}`;
  return (
    <div className="qh" role="group" aria-label={summary}>
      <div className="qh-cell">
        <span className="qh-label">Score</span>
        <span className="qh-value">{padCounter(points, 5)}</span>
      </div>
      <div className="qh-cell qh-cell--center">
        <span className="qh-label">{rank ? "Best streak" : "Streak"}</span>
        <span className="qh-value qh-value--streak" data-hot={tier >= 2 ? "true" : "false"}>
          <Flame tier={tier} />
          x{padCounter(streak, 2)}
        </span>
      </div>
      <div className="qh-cell qh-cell--end">
        <span className="qh-label">{rank ? "Rank" : "Stage"}</span>
        <span className="qh-value">
          {rank ?? (
            <>
              {padCounter(stage, 2)}
              <span className="qh-dim">/{padCounter(total, 2)}</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
