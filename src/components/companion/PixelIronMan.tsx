/**
 * Retro pixel-art Iron Man, drawn from a character map so it can be tweaked
 * without an image editor. 14 columns × 24 rows (the last three rows are the
 * boot thrusters, drawn twice and flickered in CSS).
 *
 * Legend: K outline · R red · r red highlight · d red shade · G gold ·
 * g gold shade · y gold highlight · E eye/repulsor glow · A arc reactor ·
 * F flame core · f flame edge · . transparent
 */

export const SPRITE_COLS = 14;
export const SPRITE_ROWS = 24;

const BODY = [
  ".....KKKK.....",
  "....KRRRRK....",
  "...KRrRRRRK...",
  "...KRGGGGRK...",
  "..KRGGyyGGRK..",
  "..KRGEGGEGRK..",
  "..KRGGGGGGRK..",
  "..KRRGggGRRK..",
  "...KRGggGRK...",
  ".....KdddK....",
  ".KRRRRRRRRRRK.",
  "KRGRrRAARRRGRK",
  "KRGRRRAARRRGRK",
  "KRGRdRRRRdRGRK",
  "KGGKRRRRRRKGGK",
  ".EEKRGGGGRKEE.",
  "...KRRRRRRK...",
  "...KRRKKRRK...",
  "..KRRK..KRRK..",
  "..KGGK..KGGK..",
  "..KggK..KggK..",
] as const;

const FLAME_A = [
  "...FF....FF...",
  "...ff....ff...",
  "....f....f....",
] as const;

const FLAME_B = [
  "...FF....FF...",
  "....f....f....",
  "...f......f...",
] as const;

const PALETTE: Record<string, string> = {
  K: "#17121a",
  R: "#b8232f",
  r: "#e04452",
  d: "#7d1520",
  G: "#d4a22f",
  g: "#9a7520",
  y: "#f1cf6b",
  E: "#e8fbff",
  A: "#bff3ff",
  F: "#fff1b8",
  f: "#f2a33a",
};

/** Groups pixels by colour into one SVG path per colour (`M x y h1 v1 h-1 z`). */
function toPaths(rows: readonly string[], rowOffset: number, only?: ReadonlySet<string>) {
  const byColor = new Map<string, string[]>();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "." || !(c in PALETTE)) continue;
      if (only && !only.has(c)) continue;
      if (!only && GLOW_KEYS.has(c)) continue;
      const list = byColor.get(c) ?? [];
      list.push(`M${x} ${y + rowOffset}h1v1h-1z`);
      byColor.set(c, list);
    }
  });
  return [...byColor.entries()].map(([c, d]) => ({ color: PALETTE[c], d: d.join("") }));
}

/** Pixels that pulse/blink are drawn in their own groups. */
const GLOW_KEYS = new Set(["E", "A"]);
const EYE_KEY = new Set(["E"]);
const REACTOR_KEY = new Set(["A"]);

const BODY_PATHS = toPaths(BODY, 0);
const EYE_PATHS = toPaths(BODY, 0, EYE_KEY);
const REACTOR_PATHS = toPaths(BODY, 0, REACTOR_KEY);
const FLAME_A_PATHS = toPaths(FLAME_A, BODY.length, new Set(["F", "f"]));
const FLAME_B_PATHS = toPaths(FLAME_B, BODY.length, new Set(["F", "f"]));

type Props = { className?: string; title?: string };

export function PixelIronMan({ className = "", title }: Props) {
  return (
    <svg
      viewBox={`0 0 ${SPRITE_COLS} ${SPRITE_ROWS}`}
      className={className}
      shapeRendering="crispEdges"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      <g className="px-flames">
        <g className="px-flame-a">
          {FLAME_A_PATHS.map((p) => (
            <path key={p.color} d={p.d} fill={p.color} />
          ))}
        </g>
        <g className="px-flame-b">
          {FLAME_B_PATHS.map((p) => (
            <path key={p.color} d={p.d} fill={p.color} />
          ))}
        </g>
      </g>
      {BODY_PATHS.map((p) => (
        <path key={p.color} d={p.d} fill={p.color} />
      ))}
      <g className="px-glow px-reactor">
        {REACTOR_PATHS.map((p) => (
          <path key={p.color} d={p.d} fill={p.color} />
        ))}
      </g>
      <g className="px-glow px-eyes">
        {EYE_PATHS.map((p) => (
          <path key={p.color} d={p.d} fill={p.color} />
        ))}
      </g>
    </svg>
  );
}
