"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { QuizAnswerRecord } from "@/lib/quiz";
import { TRACK_PAD, checkpointPositions, checkpointStates, spritePosition } from "@/lib/quiz-track";
import { PixelIronMan } from "./PixelIronMan";

export type TrackFeedback = "correct" | "wrong" | null;

type Props = {
  total: number;
  history: readonly QuizAnswerRecord[];
  finished?: boolean;
  /** Drives the hop / shake on the runner. */
  feedback?: TrackFeedback;
  /** Points the last answer earned, for the "+100" popup. */
  points?: number;
  /** Title screen: no checkpoints, runner idles at the start. */
  preview?: boolean;
  /** Rendered at the top of the scene (the HUD). */
  hud?: ReactNode;
  /** Rendered inside the scene, above the ground (dialog boxes). */
  children?: ReactNode;
};

/** Runner footprint on the path (2 px per sprite pixel → 28×48). */
const SPRITE_W = 28;

/* Deterministic pixel skyline: [x, width, height, lit?] in a 800×140 box. */
const FAR_BUILDINGS: [number, number, number][] = [
  [0, 38, 46], [44, 26, 70], [76, 48, 38], [130, 30, 86], [166, 44, 52], [216, 22, 64],
  [244, 52, 40], [302, 34, 78], [342, 40, 56], [388, 28, 96], [422, 46, 44], [474, 30, 68],
  [510, 50, 50], [566, 26, 82], [598, 44, 58], [648, 36, 40], [690, 28, 74], [724, 48, 48],
  [778, 22, 60],
];
const NEAR_BUILDINGS: [number, number, number, boolean][] = [
  [-10, 60, 34, true], [58, 44, 58, true], [110, 70, 30, false], [190, 36, 72, true],
  [236, 64, 42, true], [310, 40, 54, false], [360, 90, 36, true], [462, 34, 64, true],
  [504, 62, 46, true], [576, 44, 38, false], [630, 70, 52, true], [712, 40, 40, true],
  [760, 60, 30, true],
];

function Skyline({ layer }: { layer: "far" | "near" }) {
  const far = layer === "far";
  return (
    <svg
      className={`qw-skyline qw-skyline--${layer}`}
      viewBox="0 0 800 140"
      preserveAspectRatio="xMidYMax slice"
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
    >
      <defs>
        <pattern id={`qw-win-${layer}`} width="10" height="12" patternUnits="userSpaceOnUse">
          <rect x="3" y="4" width="2" height="3" className="qw-window" />
        </pattern>
      </defs>
      {far
        ? FAR_BUILDINGS.map(([x, w, h], i) => (
            <rect key={i} x={x} y={140 - h} width={w} height={h} className="qw-building" />
          ))
        : NEAR_BUILDINGS.map(([x, w, h, lit], i) => (
            <g key={i}>
              <rect x={x} y={140 - h} width={w} height={h} className="qw-building" />
              {lit && (
                <rect
                  x={x + 2}
                  y={140 - h + 4}
                  width={w - 4}
                  height={h - 4}
                  fill={`url(#qw-win-${layer})`}
                />
              )}
            </g>
          ))}
      {/* Stark Tower, near layer only */}
      {!far && (
        <g className="qw-tower">
          <rect x="676" y="26" width="22" height="114" className="qw-building qw-building--tower" />
          <rect x="680" y="14" width="14" height="12" className="qw-building qw-building--tower" />
          <rect x="686" y="4" width="2" height="10" className="qw-antenna" />
          <rect x="685" y="2" width="4" height="2" className="qw-antenna qw-antenna--tip" />
          <rect x="679" y="30" width="16" height="106" fill={`url(#qw-win-${layer})`} />
          <rect x="682" y="38" width="10" height="6" className="qw-tower-sign" />
        </g>
      )}
    </svg>
  );
}

/**
 * The retro world the quiz lives in: dusk sky, drifting pixel clouds, two
 * parallax layers of pixel buildings (Stark Tower included), a tiled ground
 * and the training path — one checkpoint flag per question, and the pixel
 * Iron Man who advances a checkpoint per answer (hop when correct, shake and
 * trudge after a miss). The HUD and dialog boxes render inside the scene.
 * Positions and flag states are plain DOM state, so the strip still reads
 * correctly with animations disabled.
 */
export function QuizWorld({
  total,
  history,
  finished = false,
  feedback = null,
  points = 0,
  preview = false,
  hud,
  children,
}: Props) {
  const pathRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const answered = history.length;
  const positions = preview ? [] : checkpointPositions(total);
  const states = preview ? [] : checkpointStates(history, total, finished);
  const progress = preview || total <= 0 ? 0 : Math.min(1, answered / total);
  const spriteX = Math.round(spritePosition(preview ? 0 : answered, total) * width - SPRITE_W / 2);

  const label = preview
    ? "Training grounds: the runner waits at the start"
    : finished
      ? `Training path complete: ${history.filter((h) => h.correct).length} of ${total} checkpoints cleared`
      : `Training path: checkpoint ${Math.min(answered + 1, total)} of ${total}`;

  return (
    <div
      className="qw"
      data-feedback={feedback ?? undefined}
      data-finished={finished ? "true" : "false"}
      data-measured={width > 0 ? "true" : "false"}
      style={{ "--progress": progress } as CSSProperties}
    >
      {/* Scenery (decorative) */}
      <div className="qw-scene" aria-hidden>
        <span className="qw-stars" />
        <span className="qw-clouds qw-clouds--far" />
        <span className="qw-clouds qw-clouds--near" />
        <Skyline layer="far" />
        <Skyline layer="near" />
        <span className="qw-ground" />
      </div>

      {/* Content inside the world */}
      <div className="qw-content">
        {hud}
        <div className="qw-dialog-area">{children}</div>
      </div>

      {/* Training path on the ground */}
      <div ref={pathRef} className="qw-path" role="img" aria-label={label}>
        <span className="qt-start" style={{ left: `${TRACK_PAD * 100}%` }} aria-hidden />
        {positions.map((p, i) => (
          <span key={i} className="qt-node" data-state={states[i]} style={{ left: `${p * 100}%` }} aria-hidden />
        ))}
        <span className="qt-finish" style={{ left: `${(1 - TRACK_PAD) * 100}%` }} aria-hidden>
          <span className="qt-finish__post" />
          <span className="qt-finish__sign">S</span>
        </span>

        <div
          className="qt-sprite"
          style={{ transform: `translateX(${spriteX}px)` }}
          data-state={finished ? "finished" : preview ? "preview" : "run"}
          aria-hidden
        >
          <div className="qt-sprite__anim">
            <PixelIronMan className="qt-sprite__img" />
          </div>
          {feedback === "correct" && (
            <span key={`pop-${answered}`} className="qt-pop">
              +{points}
            </span>
          )}
          {feedback === "correct" && (
            <span key={`sparks-${answered}`} className="qt-sparks">
              <i />
              <i />
              <i />
              <i />
            </span>
          )}
          {feedback === "wrong" && (
            <span key={`warn-${answered}`} className="qt-warn">
              !
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
