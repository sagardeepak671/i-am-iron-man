/**
 * Pure logic for the Stark companion (the retro pixel Iron Man that hovers
 * in the bottom-right corner) — positioning, idle behaviour, and the
 * thought-bubble schedule. Rendering lives in `src/components/companion`.
 */

/* ------------------------------------------------------------------ */
/* Placement                                                           */
/* ------------------------------------------------------------------ */

/** Distance from the viewport edges at the two breakpoints (px). */
export const COMPANION_BASE = {
  mobile: { right: 16, bottom: 16 },
  desktop: { right: 24, bottom: 24 },
} as const;

/**
 * Offset applied while a scroll-scrubbed cinematic section is pinned on the
 * home page, so the sprite sits inside the bottom-right HUD bracket instead
 * of on top of the "Scroll ↓" strip. Matches `.companion-root[data-tucked]`
 * in globals.css.
 */
export const COMPANION_TUCK = {
  mobile: { x: -8, y: -32, scale: 0.62 },
  desktop: { x: -20, y: -44, scale: 0.72 },
} as const;

/** Gap kept between the sprite and a footer it is "perched" on (px). */
export const FOOTER_GAP = 8;
/** Keep the sprite's top at least this far below the viewport top (px). */
export const NAV_CLEARANCE = 96;

export type LiftInput = {
  viewportHeight: number;
  /** Footer's top edge in viewport coordinates, or null when there is none. */
  footerTop: number | null;
  /** Height of a fixed bottom tray (compare tray), 0 when absent. */
  trayHeight: number;
  /** Base bottom offset at the current breakpoint. */
  baseBottom: number;
  /** Rendered sprite height, used to cap the lift. */
  spriteHeight: number;
};

/**
 * Extra distance (px) to add to the base bottom offset so the sprite never
 * covers a fixed bottom tray and rides up on the footer when the page end
 * scrolls into view (so the footer's links and notices stay readable).
 */
export function companionLift(i: LiftInput): number {
  let lift = Math.max(0, i.trayHeight);
  if (i.footerTop !== null) {
    const perch = i.viewportHeight - i.footerTop + FOOTER_GAP - i.baseBottom;
    lift = Math.max(lift, perch);
  }
  // Cap so the sprite's top stays below the navbar; on a viewport too short
  // for that, stay put at the base offset rather than flying off the top.
  const maxLift = Math.max(0, i.viewportHeight - NAV_CLEARANCE - i.spriteHeight - i.baseBottom);
  lift = Math.min(lift, maxLift);
  return Math.max(0, Math.round(lift));
}

export type Rect = { top: number; bottom: number };

/**
 * True when any cinematic section (a `.scroll-animation` wrapper around a
 * full-viewport sticky canvas) is covering the bottom edge of the viewport.
 * That is exactly when its sticky bottom strip is on screen.
 */
export function cinematicCoversBottom(sections: readonly Rect[], viewportHeight: number): boolean {
  return sections.some((r) => r.top < viewportHeight && r.bottom >= viewportHeight);
}

/* ------------------------------------------------------------------ */
/* Idle behaviour                                                      */
/* ------------------------------------------------------------------ */

/** Random idle actions while hovering at home or at a waypoint. */
export const IDLE_ACTIONS = ["boost", "sway", "blink", "scan", "spin", "peek"] as const;
export type IdleAction = (typeof IDLE_ACTIONS)[number];
/** One-off actions triggered by events (landing, being dropped, quiz result). */
export type EventAction = "land" | "shake";
export type CompanionAction = IdleAction | EventAction;

/** How long each action's CSS animation runs (ms); the attribute is cleared after. */
export const ACTION_MS: Record<CompanionAction, number> = {
  boost: 900,
  sway: 1200,
  blink: 360,
  scan: 1100,
  spin: 900,
  peek: 1400,
  land: 520,
  shake: 700,
};

/** While resting (thrusters off) only the quiet actions make sense. */
export const REST_ACTIONS: readonly IdleAction[] = ["blink", "scan"];

/** Pause between idle actions (ms). */
export const IDLE_GAP_MS: readonly [number, number] = [9_000, 16_000];

export function randomBetween(range: readonly [number, number], random: () => number): number {
  const [min, max] = range;
  return min + Math.floor(random() * (max - min + 1));
}

/** Picks an idle action from `pool`, never the same one twice in a row. */
export function pickIdleAction(
  previous: IdleAction | null,
  random: () => number,
  pool: readonly IdleAction[] = IDLE_ACTIONS,
): IdleAction {
  const candidates = pool.filter((a) => a !== previous);
  const list = candidates.length > 0 ? candidates : pool;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

/* ------------------------------------------------------------------ */
/* Roaming                                                             */
/* ------------------------------------------------------------------ */

export type Point = { x: number; y: number };
export type Size = { w: number; h: number };
export type RoamZone = "left" | "right" | "top" | "bottom" | "middle";

export const ROAM = {
  /** Gap kept from the viewport edges (px). */
  margin: 12,
  /** Stay below the fixed navbar (px from the top). */
  topClearance: 88,
  /** Cruise speed (px/s) and flight-time bounds (ms). */
  speed: 240,
  minFlightMs: 650,
  maxFlightMs: 3200,
  /** Time spent hovering at home before the next trip (ms). */
  tripDelayMs: [25_000, 55_000] as const,
  /** Rest at a waypoint (ms). */
  restMs: [7_000, 18_000] as const,
  /** Rest where the user dropped him before moving on (ms). */
  dropRestMs: [15_000, 40_000] as const,
  /** Waypoints per trip (inclusive range). */
  legs: [1, 3] as const,
  /** Share of waypoints allowed in the middle of the screen (rest are edges). */
  middleChance: 0.25,
  /** Chance of a remark after being dropped. */
  dropLineChance: 0.6,
} as const;

/** Keeps a sprite's top-left point fully inside the usable viewport. */
export function clampToViewport(p: Point, viewport: Size, sprite: Size, trayHeight = 0): Point {
  const maxX = Math.max(ROAM.margin, viewport.w - sprite.w - ROAM.margin);
  const maxY = Math.max(ROAM.topClearance, viewport.h - trayHeight - sprite.h - ROAM.margin);
  return {
    x: Math.min(maxX, Math.max(ROAM.margin, Math.round(p.x))),
    y: Math.min(maxY, Math.max(ROAM.topClearance, Math.round(p.y))),
  };
}

export type RoamTargetInput = {
  viewport: Size;
  sprite: Size;
  trayHeight?: number;
  /** False while a cinematic is pinned or on small screens: edges only. */
  allowMiddle: boolean;
  random: () => number;
};

/**
 * Picks the next waypoint: mostly along the four edges (so content stays
 * readable), occasionally somewhere in the middle third of the screen.
 */
export function pickRoamTarget(i: RoamTargetInput): { point: Point; zone: RoamZone } {
  const { viewport, sprite, random } = i;
  const tray = i.trayHeight ?? 0;
  const zones: RoamZone[] = ["left", "right", "top", "bottom"];
  const zone: RoamZone =
    i.allowMiddle && random() < ROAM.middleChance
      ? "middle"
      : zones[Math.min(zones.length - 1, Math.floor(random() * zones.length))];
  const xMin = ROAM.margin;
  const xMax = viewport.w - sprite.w - ROAM.margin;
  const yMin = ROAM.topClearance;
  const yMax = viewport.h - tray - sprite.h - ROAM.margin;
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let point: Point;
  switch (zone) {
    case "left":
      point = { x: xMin, y: lerp(yMin, yMax, random()) };
      break;
    case "right":
      point = { x: xMax, y: lerp(yMin, yMax, random()) };
      break;
    case "top":
      point = { x: lerp(xMin, xMax, random()), y: yMin };
      break;
    case "bottom":
      point = { x: lerp(xMin, xMax, random()), y: yMax };
      break;
    default:
      point = {
        x: lerp(viewport.w * 0.2, viewport.w * 0.8 - sprite.w, random()),
        y: lerp(viewport.h * 0.25, viewport.h * 0.75 - sprite.h, random()),
      };
  }
  return { point: clampToViewport(point, viewport, sprite, tray), zone };
}

/** Flight time for a straight-line distance, clamped so short hops still read as motion. */
export function flightDuration(distance: number): number {
  const ms = (Math.max(0, distance) / ROAM.speed) * 1000;
  return Math.round(Math.min(ROAM.maxFlightMs, Math.max(ROAM.minFlightMs, ms)));
}

/** Banking angle (deg) for a horizontal velocity or displacement. */
export function bankAngle(dx: number, max = 16): number {
  const a = dx / 18;
  return Math.round(Math.max(-max, Math.min(max, a)));
}

export type BubblePlacement = { side: "left" | "right"; vertical: "above" | "below" };

/** Where the bubble should open so it stays on screen wherever the sprite is. */
export function bubblePlacement(pos: Point, viewport: Size, sprite: Size): BubblePlacement {
  return {
    side: pos.x + sprite.w < 250 ? "left" : "right",
    vertical: pos.y < 110 ? "below" : "above",
  };
}

/** Remarks after being picked up and put down somewhere. */
export const DROP_LINES: readonly string[] = [
  "Fine. I'll wait here.",
  "New spot. Acceptable.",
  "Relocated. Again.",
  "Was that a rescue or a kidnapping?",
  "Noted: you prefer me here.",
  "Thrusters off. Don't tell F.R.I.D.A.Y.",
];

/** Remarks after a quiz run, keyed by a rough tier. */
export const QUIZ_LINES = {
  great: "Nice run, sir.",
  ok: "Not bad. Archive's open if you want a refresher.",
  poor: "We'll call that a calibration run.",
} as const;

/* ------------------------------------------------------------------ */
/* Thought bubbles                                                     */
/* ------------------------------------------------------------------ */

/**
 * Short, site-accurate lines. No invented technical figures — the archive's
 * "film-stated values only" rule applies to the mascot too.
 */
export const COMPANION_MESSAGES: readonly string[] = [
  "Systems nominal, sir.",
  "Click me — or press J — to open J.A.R.V.I.S.",
  "Hall of Armor: Mark I through Mark LXXXV.",
  "Tip: compare two or three armors side by side.",
  "Reactor output: nominal. (Simulated.)",
  "Hovering. Still hovering. Very efficient.",
  "Quiz protocol online. Click me to start a run.",
  "You can drag me somewhere else. I don't mind.",
  "Try the suit explorer on the Technology page.",
  "Unknown means the films never said it.",
  "I'd ask F.R.I.D.A.Y., but she's busy.",
];

export const BUBBLE = {
  /** Delay before the very first bubble of a session (ms). */
  firstDelayMs: [20_000, 35_000] as const,
  /** Delay between subsequent bubbles (ms). */
  intervalMs: [120_000, 240_000] as const,
  /** Never show two bubbles closer together than this, even after a reload (ms). */
  minGapMs: 45_000,
  /** How long a bubble stays on screen (ms). */
  visibleMs: 6_500,
  /** Hard cap per browser session so it can never become a nag. */
  maxPerSession: 4,
  /** Only speak up when the user has not scrolled/moved/typed for this long (ms). */
  idleMs: 6_000,
  /** Stay quiet for a while after the terminal closes (ms). */
  afterTerminalMs: 30_000,
  /** Dismissing this many bubbles in a row mutes the rest of the session. */
  dismissToMute: 2,
} as const;

export type BubbleGate = {
  terminalOpen: boolean;
  mode: "home" | "fly" | "rest" | "drag";
  muted: boolean;
  hidden: boolean;
  /** ms since the last user input (scroll, pointer, key). */
  idleMs: number;
  /** ms since the terminal last closed (Infinity if never). */
  sinceTerminalMs: number;
  shownThisSession: number;
};

/** Whether a scheduled bubble may appear right now (never mid-flight, never over the user's attention). */
export function canShowBubble(g: BubbleGate): boolean {
  if (g.muted || g.hidden || g.terminalOpen) return false;
  if (g.mode === "fly" || g.mode === "drag") return false;
  if (g.shownThisSession >= BUBBLE.maxPerSession) return false;
  if (g.idleMs < BUBBLE.idleMs) return false;
  if (g.sinceTerminalMs < BUBBLE.afterTerminalMs) return false;
  return true;
}

/**
 * Milliseconds until the next bubble. `lastShownAt` is the timestamp of the
 * previous bubble in this session (null for the first). A bubble shown just
 * before a reload does not immediately reappear: the interval is measured
 * from the previous bubble, with a short floor.
 */
export function nextBubbleDelay(
  lastShownAt: number | null,
  now: number,
  random: () => number,
): number {
  if (lastShownAt === null) return randomBetween(BUBBLE.firstDelayMs, random);
  const interval = randomBetween(BUBBLE.intervalMs, random);
  return Math.max(BUBBLE.minGapMs, lastShownAt + interval - now);
}

/** Index of the next message, never repeating the previous one. */
export function pickMessageIndex(
  count: number,
  previous: number | null,
  random: () => number,
): number {
  if (count <= 1) return 0;
  const candidates: number[] = [];
  for (let i = 0; i < count; i++) if (i !== previous) candidates.push(i);
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}

/* ------------------------------------------------------------------ */
/* Stepping aside for controls                                         */
/* ------------------------------------------------------------------ */

export type Box = { left: number; top: number; right: number; bottom: number };

/**
 * Anything up to this height is a row-like control (button, field, prev/next
 * link) however wide it is; wider-and-taller things are cards/panels, and
 * covering a corner of those is harmless.
 */
export const DODGE_MAX_CONTROL = { rowHeight: 120, w: 380, h: 170 } as const;

/** True for the kind of control the sprite should hop over. */
export function isSmallControl(size: { w: number; h: number }): boolean {
  if (size.w <= 0 || size.h <= 0) return false;
  if (size.h <= DODGE_MAX_CONTROL.rowHeight) return true;
  return size.w <= DODGE_MAX_CONTROL.w && size.h <= DODGE_MAX_CONTROL.h;
}

/** Axis-aligned overlap test. */
export function boxesOverlap(a: Box, b: Box): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Extra lift (px) so the sprite clears a control it would otherwise cover:
 * stand on top of it, like the footer perch. 0 when there is no overlap.
 */
export function dodgeLift(sprite: Box, control: Box, viewportHeight: number, baseBottom: number): number {
  if (!boxesOverlap(sprite, control)) return 0;
  return Math.max(0, Math.round(viewportHeight - control.top + FOOTER_GAP - baseBottom));
}

/** Keyboard shortcuts must not fire while the user is typing somewhere. */
export function isTypingContext(t: { tagName: string; isContentEditable?: boolean }): boolean {
  const tag = t.tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(t.isContentEditable);
}

/** Single-key shortcut that toggles the terminal (ignored while typing). */
export const TERMINAL_HOTKEY = "j";
