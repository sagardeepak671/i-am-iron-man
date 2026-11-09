import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BUBBLE,
  COMPANION_MESSAGES,
  DROP_LINES,
  FOOTER_GAP,
  IDLE_ACTIONS,
  NAV_CLEARANCE,
  REST_ACTIONS,
  ROAM,
  bankAngle,
  boxesOverlap,
  bubblePlacement,
  canShowBubble,
  cinematicCoversBottom,
  clampToViewport,
  companionLift,
  dodgeLift,
  flightDuration,
  isSmallControl,
  isTypingContext,
  nextBubbleDelay,
  pickIdleAction,
  pickMessageIndex,
  pickRoamTarget,
  randomBetween,
} from "@/lib/companion";

/** Deterministic PRNG (mulberry32). */
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

const base = { viewportHeight: 900, footerTop: null, trayHeight: 0, baseBottom: 24, spriteHeight: 79 };

describe("companion placement", () => {
  it("sits at the base offset when nothing is in the way", () => {
    assert.equal(companionLift(base), 0);
    // Footer still below the fold: no lift.
    assert.equal(companionLift({ ...base, footerTop: 1200 }), 0);
  });

  it("lifts above a fixed bottom tray", () => {
    assert.equal(companionLift({ ...base, trayHeight: 64 }), 64);
  });

  it("perches on the footer as it scrolls into view", () => {
    // Footer top 300px above the viewport bottom → sprite bottom = 300 + gap.
    const lift = companionLift({ ...base, footerTop: 600 });
    assert.equal(lift, 300 + FOOTER_GAP - base.baseBottom);
    // Whichever is higher wins: tray vs footer.
    assert.equal(companionLift({ ...base, footerTop: 880, trayHeight: 64 }), 64);
  });

  it("never pushes the sprite up under the navbar", () => {
    const lift = companionLift({ ...base, viewportHeight: 500, footerTop: 0 });
    const maxLift = 500 - NAV_CLEARANCE - base.spriteHeight - base.baseBottom;
    assert.equal(lift, maxLift);
    // Tiny viewports fall back to the base offset rather than a negative cap.
    assert.equal(companionLift({ ...base, viewportHeight: 150, footerTop: 0 }), 0);
  });

  it("detects a pinned cinematic section by the viewport's bottom edge", () => {
    const vh = 900;
    assert.equal(cinematicCoversBottom([], vh), false);
    // Pinned (section starts above and ends below the viewport).
    assert.equal(cinematicCoversBottom([{ top: -500, bottom: 3100 }], vh), true);
    // Scrolled past: its bottom is above the viewport bottom.
    assert.equal(cinematicCoversBottom([{ top: -3500, bottom: 850 }], vh), false);
    // Hand-over between two stacked sections has no gap.
    assert.equal(
      cinematicCoversBottom(
        [
          { top: -3500, bottom: 850 },
          { top: 850, bottom: 4450 },
        ],
        vh,
      ),
      true,
    );
    // Not yet reached.
    assert.equal(cinematicCoversBottom([{ top: 1200, bottom: 4800 }], vh), false);
  });
});

describe("companion idle behaviour", () => {
  it("randomBetween is inclusive and respects the random source", () => {
    assert.equal(randomBetween([10, 20], () => 0), 10);
    assert.equal(randomBetween([10, 20], () => 0.999), 20);
  });

  it("never repeats the same idle action twice in a row", () => {
    for (const prev of IDLE_ACTIONS) {
      for (const r of [0, 0.33, 0.66, 0.999]) {
        assert.notEqual(pickIdleAction(prev, () => r), prev);
      }
    }
  });

  it("only uses quiet actions while resting", () => {
    for (let i = 0; i < 40; i++) {
      const a = pickIdleAction(null, seeded(i), REST_ACTIONS);
      assert.ok(REST_ACTIONS.includes(a), a);
    }
    // A one-item pool still returns something.
    assert.equal(pickIdleAction("blink", () => 0.5, ["blink"]), "blink");
  });
});

describe("companion roaming", () => {
  const viewport = { w: 1440, h: 900 };
  const sprite = { w: 46, h: 83 };

  it("waypoints stay inside the usable viewport (below the navbar, above a tray)", () => {
    for (let seed = 0; seed < 200; seed++) {
      const { point } = pickRoamTarget({ viewport, sprite, trayHeight: 64, allowMiddle: true, random: seeded(seed) });
      assert.ok(point.x >= ROAM.margin && point.x + sprite.w <= viewport.w - ROAM.margin, `x ${point.x}`);
      assert.ok(point.y >= ROAM.topClearance, `y ${point.y}`);
      assert.ok(point.y + sprite.h <= viewport.h - 64 - ROAM.margin, `y ${point.y}`);
    }
  });

  it("mostly picks edges, sometimes the middle, and never the middle when disallowed", () => {
    const zones = new Map<string, number>();
    for (let seed = 0; seed < 400; seed++) {
      const { zone } = pickRoamTarget({ viewport, sprite, allowMiddle: true, random: seeded(seed) });
      zones.set(zone, (zones.get(zone) ?? 0) + 1);
    }
    const middle = zones.get("middle") ?? 0;
    assert.ok(middle > 40 && middle < 160, `middle share ${middle}/400`);
    for (const z of ["left", "right", "top", "bottom"]) assert.ok((zones.get(z) ?? 0) > 30, z);

    for (let seed = 0; seed < 100; seed++) {
      const { zone, point } = pickRoamTarget({ viewport, sprite, allowMiddle: false, random: seeded(seed) });
      assert.notEqual(zone, "middle");
      const onEdge =
        point.x === ROAM.margin ||
        point.x === viewport.w - sprite.w - ROAM.margin ||
        point.y === ROAM.topClearance ||
        point.y === viewport.h - sprite.h - ROAM.margin;
      assert.ok(onEdge, `${zone} ${point.x},${point.y}`);
    }
  });

  it("clamps dragged positions to the viewport", () => {
    assert.deepEqual(clampToViewport({ x: -50, y: -50 }, viewport, sprite), { x: ROAM.margin, y: ROAM.topClearance });
    assert.deepEqual(clampToViewport({ x: 9999, y: 9999 }, viewport, sprite, 64), {
      x: viewport.w - sprite.w - ROAM.margin,
      y: viewport.h - 64 - sprite.h - ROAM.margin,
    });
    assert.deepEqual(clampToViewport({ x: 300.4, y: 400.6 }, viewport, sprite), { x: 300, y: 401 });
  });

  it("flight time scales with distance within bounds", () => {
    assert.equal(flightDuration(0), ROAM.minFlightMs);
    assert.equal(flightDuration(10_000), ROAM.maxFlightMs);
    const mid = flightDuration(480);
    assert.ok(mid > ROAM.minFlightMs && mid < ROAM.maxFlightMs);
    assert.equal(mid, 2000);
  });

  it("banks toward the direction of travel, capped", () => {
    assert.equal(bankAngle(0), 0);
    assert.ok(bankAngle(-400) === -16 && bankAngle(400) === 16);
    assert.ok(bankAngle(90) > 0 && bankAngle(90) < 16);
  });

  it("flips the bubble so it stays on screen near the left/top edges", () => {
    assert.deepEqual(bubblePlacement({ x: 12, y: 500 }, viewport, sprite), { side: "left", vertical: "above" });
    assert.deepEqual(bubblePlacement({ x: 1380, y: 90 }, viewport, sprite), { side: "right", vertical: "below" });
    assert.deepEqual(bubblePlacement({ x: 1380, y: 800 }, viewport, sprite), { side: "right", vertical: "above" });
  });

  it("drop remarks are short and figure-free", () => {
    for (const m of DROP_LINES) {
      assert.ok(m.length <= 60, m);
      assert.doesNotMatch(m, /\d/, m);
    }
  });
});

describe("companion thought bubbles", () => {
  it("waits a short while for the first bubble and much longer between the rest", () => {
    const first = nextBubbleDelay(null, 1_000_000, () => 0.5);
    assert.ok(first >= BUBBLE.firstDelayMs[0] && first <= BUBBLE.firstDelayMs[1]);

    const now = 1_000_000;
    const next = nextBubbleDelay(now, now, () => 0);
    assert.equal(next, BUBBLE.intervalMs[0]);
  });

  it("does not re-fire right after a reload", () => {
    const now = 1_000_000;
    // A bubble was shown 5s ago (e.g. before a reload): wait at least the floor.
    assert.equal(nextBubbleDelay(now - 5_000, now, () => 0), BUBBLE.intervalMs[0] - 5_000);
    // Shown long ago: only the minimum gap applies.
    assert.equal(nextBubbleDelay(now - 10_000_000, now, () => 0), BUBBLE.minGapMs);
  });

  it("picks a different message than the previous one", () => {
    const n = COMPANION_MESSAGES.length;
    assert.ok(n >= 5);
    for (let prev = 0; prev < n; prev++) {
      for (const r of [0, 0.5, 0.999]) {
        const idx = pickMessageIndex(n, prev, () => r);
        assert.notEqual(idx, prev);
        assert.ok(idx >= 0 && idx < n);
      }
    }
    assert.equal(pickMessageIndex(1, 0, () => 0.7), 0);
  });

  it("keeps messages short and free of invented figures", () => {
    for (const m of COMPANION_MESSAGES) {
      assert.ok(m.length <= 60, `too long: ${m}`);
      // Roman numerals are fine (armor names); decimal numbers are not.
      assert.doesNotMatch(m, /\d/, `contains a number: ${m}`);
    }
  });
});

describe("companion manners", () => {
  const calm = {
    terminalOpen: false,
    mode: "home" as const,
    muted: false,
    hidden: false,
    idleMs: 10_000,
    sinceTerminalMs: Infinity,
    shownThisSession: 0,
  };

  it("speaks only when the user is idle and nothing else is going on", () => {
    assert.equal(canShowBubble(calm), true);
    assert.equal(canShowBubble({ ...calm, idleMs: 1_000 }), false, "user is active");
    assert.equal(canShowBubble({ ...calm, terminalOpen: true }), false);
    assert.equal(canShowBubble({ ...calm, hidden: true }), false);
    assert.equal(canShowBubble({ ...calm, muted: true }), false);
    assert.equal(canShowBubble({ ...calm, mode: "fly" }), false);
    assert.equal(canShowBubble({ ...calm, mode: "drag" }), false);
    assert.equal(canShowBubble({ ...calm, mode: "rest" }), true);
    assert.equal(canShowBubble({ ...calm, sinceTerminalMs: 5_000 }), false, "just closed the terminal");
    assert.equal(canShowBubble({ ...calm, shownThisSession: BUBBLE.maxPerSession }), false);
  });

  it("keeps the schedule calm", () => {
    assert.ok(BUBBLE.firstDelayMs[0] >= 15_000);
    assert.ok(BUBBLE.intervalMs[0] >= 90_000);
    assert.ok(BUBBLE.maxPerSession <= 5);
  });

  it("hops over small controls but ignores big cards", () => {
    assert.equal(isSmallControl({ w: 120, h: 40 }), true);
    assert.equal(isSmallControl({ w: 340, h: 48 }), true, "full-width mobile button");
    assert.equal(isSmallControl({ w: 672, h: 83 }), true, "wide prev/next link row");
    assert.equal(isSmallControl({ w: 420, h: 300 }), false, "card");
    assert.equal(isSmallControl({ w: 300, h: 160 }), true, "compact panel button");
    assert.equal(isSmallControl({ w: 0, h: 0 }), false);

    const sprite = { left: 1370, top: 793, right: 1416, bottom: 876 };
    const link = { left: 1300, top: 850, right: 1400, bottom: 880 };
    assert.equal(boxesOverlap(sprite, link), true);
    assert.equal(dodgeLift(sprite, link, 900, 24), 900 - 850 + FOOTER_GAP - 24);
    const far = { left: 1300, top: 400, right: 1400, bottom: 430 };
    assert.equal(dodgeLift(sprite, far, 900, 24), 0);
  });

  it("the J hotkey stays out of form fields", () => {
    assert.equal(isTypingContext({ tagName: "input" }), true);
    assert.equal(isTypingContext({ tagName: "TEXTAREA" }), true);
    assert.equal(isTypingContext({ tagName: "select" }), true);
    assert.equal(isTypingContext({ tagName: "div", isContentEditable: true }), true);
    assert.equal(isTypingContext({ tagName: "BUTTON" }), false);
    assert.equal(isTypingContext({ tagName: "body", isContentEditable: false }), false);
  });
});
