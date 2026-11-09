"use client";

import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import { useCompareSelection } from "@/components/compare/compare-store";
import {
  ACTION_MS,
  BUBBLE,
  COMPANION_BASE,
  COMPANION_MESSAGES,
  DROP_LINES,
  IDLE_GAP_MS,
  QUIZ_LINES,
  REST_ACTIONS,
  ROAM,
  TERMINAL_HOTKEY,
  bankAngle,
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
  type BubblePlacement,
  type CompanionAction,
  type IdleAction,
  type Point,
} from "@/lib/companion";
import { INITIAL_QUIZ_STATE, quizReducer } from "@/lib/quiz";
import { PixelIronMan } from "./PixelIronMan";
import { JarvisWindow } from "./JarvisWindow";

const SESSION_LAST_BUBBLE = "stark-companion:last-bubble";
const SESSION_BUBBLE_COUNT = "stark-companion:bubble-count";
const LOCAL_MUTED = "stark-companion:remarks-off";
const CONTROL_SELECTOR = 'a[href], button, input, select, textarea, summary, [role="button"], [role="tab"]';
const DRAG_THRESHOLD_PX = 5;
const FLIGHT_EASING = "cubic-bezier(0.45, 0.05, 0.35, 1)";

/** home = hovering at the anchor · fly = travelling · rest = landed somewhere · drag = in the user's hand */
type Mode = "home" | "fly" | "rest" | "drag";

function readSession(key: string): number | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: number) {
  try {
    window.sessionStorage.setItem(key, String(value));
  } catch {
    /* storage unavailable — bubbles are simply per-page-load */
  }
}

/**
 * The desktop-pet style companion: a pixel Iron Man anchored near the
 * bottom-right corner who, every so often, flies off on a short trip
 * (mostly along the screen edges, sometimes through the middle), rests at
 * each stop with thrusters off, and comes home. He can be dragged anywhere
 * with the mouse or a finger; a plain click/tap opens the J.A.R.V.I.S.
 * terminal (the quiz).
 *
 * Layers: `.companion-root` (fixed anchor; lift above tray/footer)
 * → `.companion-roam` (offset from home while away; CSS transition = flight)
 * → `.companion-tuck` (parks in the HUD bracket during home cinematics)
 * → `.companion-hover` (bob) → `.companion-action` (one-off animations)
 * → `.companion-bank` (tilt while flying) → bubble + button.
 */
export function StarkCompanion() {
  const pathname = usePathname();
  const reduce = useReducedMotionPreference();
  const { ids: compareIds } = useCompareSelection();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const roamRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const bubbleId = useId();

  const [tucked, setTucked] = useState(false);
  const [mode, setMode] = useState<Mode>("home");
  const [action, setAction] = useState<CompanionAction | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const bubbleRef = useRef<string | null>(null);
  useEffect(() => {
    bubbleRef.current = bubble;
  }, [bubble]);
  const [placement, setPlacement] = useState<BubblePlacement>({ side: "right", vertical: "above" });
  const [open, setOpen] = useState(false);
  // Markup does not depend on this at hydration time (the toggle lives inside
  // the closed terminal), so reading the preference in the initializer is safe.
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage.getItem(LOCAL_MUTED) === "1";
    } catch {
      return false;
    }
  });
  // The quiz run lives here so closing/reopening the terminal resumes it.
  const [quiz, quizDispatch] = useReducer(quizReducer, INITIAL_QUIZ_STATE);

  // Mutable state the timers read without re-subscribing.
  const modeRef = useRef<Mode>("home");
  const openRef = useRef(false);
  const reduceRef = useRef(false);
  const tuckedRef = useRef(false);
  const posRef = useRef<Point | null>(null); // viewport top-left while away; null = home
  const trayHeightRef = useRef(0);
  const brainTimer = useRef(0);
  const actionTimer = useRef(0);
  const legsRef = useRef(0);
  const lastBubbleAt = useRef(0);
  const lastActivityAt = useRef(0);
  const terminalClosedAt = useRef(-Infinity);
  const dismissStreak = useRef(0);
  const mutedRef = useRef(false);
  const pendingReaction = useRef<{ action: CompanionAction; line: string } | null>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    reduceRef.current = reduce;
  }, [reduce]);
  useEffect(() => {
    tuckedRef.current = tucked;
  }, [tucked]);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  /* "Last user activity" clock for bubble timing. */
  useEffect(() => {
    lastActivityAt.current = Date.now();
    const touch = () => {
      lastActivityAt.current = Date.now();
    };
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", touch, opts);
    window.addEventListener("pointermove", touch, opts);
    window.addEventListener("pointerdown", touch, opts);
    window.addEventListener("keydown", touch, opts);
    window.addEventListener("touchstart", touch, opts);
    return () => {
      window.removeEventListener("scroll", touch);
      window.removeEventListener("pointermove", touch);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
      window.removeEventListener("touchstart", touch);
    };
  }, []);

  const toggleRemarks = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        if (next) window.localStorage.setItem(LOCAL_MUTED, "1");
        else window.localStorage.removeItem(LOCAL_MUTED);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const changeMode = useCallback((m: Mode) => {
    modeRef.current = m;
    setMode(m);
  }, []);

  /* ---------------- helpers: geometry ---------------- */
  const spriteSize = useCallback(() => {
    const el = roamRef.current;
    return { w: el?.offsetWidth ?? 46, h: el?.offsetHeight ?? 83 };
  }, []);

  const viewport = useCallback(() => ({ w: window.innerWidth, h: window.innerHeight }), []);

  const homeTopLeft = useCallback((): Point => {
    const r = rootRef.current?.getBoundingClientRect();
    return r ? { x: r.left, y: r.top } : { x: 0, y: 0 };
  }, []);

  /** Writes the roam transform for the current `posRef` (null = home). */
  const applyPosition = useCallback(
    (transitionMs: number) => {
      const el = roamRef.current;
      if (!el) return;
      const home = homeTopLeft();
      const pos = posRef.current;
      el.style.transition = transitionMs > 0 ? `transform ${transitionMs}ms ${FLIGHT_EASING}` : "none";
      el.style.transform = pos
        ? `translate(${Math.round(pos.x - home.x)}px, ${Math.round(pos.y - home.y)}px)`
        : "translate(0px, 0px)";
      const next = bubblePlacement(pos ?? home, viewport(), spriteSize());
      setPlacement((p) => (p.side === next.side && p.vertical === next.vertical ? p : next));
    },
    [homeTopLeft, spriteSize, viewport],
  );

  const setBank = useCallback((deg: number) => {
    rootRef.current?.style.setProperty("--bank", `${deg}deg`);
  }, []);

  /* ---------------- helpers: one-off actions & bubbles ---------------- */
  const playAction = useCallback((a: CompanionAction) => {
    window.clearTimeout(actionTimer.current);
    setAction(a);
    actionTimer.current = window.setTimeout(() => setAction(null), ACTION_MS[a]);
  }, []);

  const sayTimer = useRef(0);
  const say = useCallback((text: string, ms: number) => {
    lastBubbleAt.current = Date.now();
    setBubble(text);
    window.clearTimeout(sayTimer.current);
    sayTimer.current = window.setTimeout(() => setBubble((b) => (b === text ? null : b)), ms);
  }, []);
  useEffect(() => () => window.clearTimeout(sayTimer.current), []);

  /** Dismissing two scheduled remarks in a row mutes them for good (until re-enabled). */
  const dismissedRef = useRef(false);
  const dismissBubble = useCallback(() => {
    setBubble(null);
    dismissedRef.current = true;
    dismissStreak.current += 1;
    if (dismissStreak.current >= BUBBLE.dismissToMute && !mutedRef.current) {
      dismissStreak.current = 0;
      setMuted(true);
      try {
        window.localStorage.setItem(LOCAL_MUTED, "1");
      } catch {
        /* ignore */
      }
      window.setTimeout(() => say("Understood, sir. Going quiet.", 3_000), 250);
    }
  }, [say]);

  /* ---------------- the brain: trips, rests, homecoming ---------------- */
  const clearBrain = useCallback(() => window.clearTimeout(brainTimer.current), []);

  const paused = useCallback(
    () => openRef.current || reduceRef.current || document.visibilityState !== "visible",
    [],
  );

  // Declared as refs so the mutually recursive steps can reference each other.
  const stepsRef = useRef<{
    scheduleTrip: () => void;
    flyTo: (target: Point | null) => void;
  }>({ scheduleTrip: () => {}, flyTo: () => {} });

  useEffect(() => {
    const scheduleTrip = () => {
      clearBrain();
      brainTimer.current = window.setTimeout(
        startTrip,
        randomBetween(ROAM.tripDelayMs, Math.random),
      );
    };

    const startTrip = () => {
      if (paused() || modeRef.current !== "home") {
        scheduleTrip();
        return;
      }
      legsRef.current = randomBetween(ROAM.legs, Math.random);
      flyTo(nextTarget());
    };

    const nextTarget = (): Point => {
      const vp = viewport();
      return pickRoamTarget({
        viewport: vp,
        sprite: spriteSize(),
        trayHeight: trayHeightRef.current,
        allowMiddle: !tuckedRef.current && vp.w >= 768,
        random: Math.random,
      }).point;
    };

    /** Fly to a viewport point, or home when `target` is null. */
    const flyTo = (target: Point | null) => {
      clearBrain();
      const from = posRef.current ?? homeTopLeft();
      const to = target ?? homeTopLeft();
      const distance = Math.hypot(to.x - from.x, to.y - from.y);
      const duration = reduceRef.current ? 0 : flightDuration(distance);
      posRef.current = target;
      changeMode("fly");
      setBank(bankAngle(to.x - from.x));
      applyPosition(duration);
      brainTimer.current = window.setTimeout(arrive, duration + 60);
    };

    const arrive = () => {
      setBank(0);
      if (!reduceRef.current) playAction("land");
      if (posRef.current === null) {
        changeMode("home");
        applyPosition(0);
        scheduleTrip();
        return;
      }
      changeMode("rest");
      brainTimer.current = window.setTimeout(afterRest, randomBetween(ROAM.restMs, Math.random));
    };

    const afterRest = () => {
      legsRef.current -= 1;
      if (legsRef.current > 0 && !paused()) flyTo(nextTarget());
      else flyTo(null);
    };

    stepsRef.current = { scheduleTrip, flyTo };
    scheduleTrip();
    return clearBrain;
  }, [applyPosition, changeMode, clearBrain, homeTopLeft, paused, playAction, setBank, spriteSize, viewport]);

  /* ---------------- placement of the home anchor ---------------- */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const vh = window.innerHeight;
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const base = desktop ? COMPANION_BASE.desktop : COMPANION_BASE.mobile;
      const footer = document.querySelector("footer");
      const tray = document.querySelector<HTMLElement>('section[aria-label="Compare selection"]');
      const cinematics = Array.from(document.querySelectorAll<HTMLElement>(".scroll-animation")).map(
        (s) => s.getBoundingClientRect(),
      );
      trayHeightRef.current = tray ? tray.offsetHeight : 0;

      const lift = companionLift({
        viewportHeight: vh,
        footerTop: footer ? footer.getBoundingClientRect().top : null,
        trayHeight: trayHeightRef.current,
        baseBottom: base.bottom,
        spriteHeight: spriteSize().h,
      });
      const tuckedNow = cinematicCoversBottom(cinematics, vh);

      // Step aside for a small control (a link, button or field) the sprite
      // would otherwise sit on: stand on top of it, like the footer perch.
      let dodge = 0;
      if (!posRef.current && !openRef.current && !tuckedNow) {
        const sp = spriteSize();
        const box = {
          right: window.innerWidth - base.right,
          left: window.innerWidth - base.right - sp.w,
          bottom: vh - base.bottom - lift,
          top: vh - base.bottom - lift - sp.h,
        };
        const samples: [number, number][] = [
          [box.left + 4, box.top + 4],
          [box.right - 4, box.top + 4],
          [box.left + 4, box.bottom - 4],
          [box.right - 4, box.bottom - 4],
          [(box.left + box.right) / 2, (box.top + box.bottom) / 2],
        ];
        for (const [x, y] of samples) {
          const hit = document
            .elementsFromPoint(x, y)
            .find((n) => !n.closest(".companion-root") && !n.closest(".jarvis-overlay"));
          const control = hit?.closest<HTMLElement>(CONTROL_SELECTOR);
          if (!control) continue;
          const r = control.getBoundingClientRect();
          if (!isSmallControl({ w: r.width, h: r.height })) continue;
          dodge = Math.max(dodge, dodgeLift(box, r, vh, base.bottom));
        }
      }
      const finalLift = dodge
        ? companionLift({
            viewportHeight: vh,
            footerTop: null,
            trayHeight: Math.max(lift, dodge),
            baseBottom: base.bottom,
            spriteHeight: spriteSize().h,
          })
        : lift;
      el.style.setProperty("--companion-lift", `${finalLift}px`);
      setTucked(tuckedNow);

      // Away from home: keep the absolute spot as the anchor moves / viewport resizes.
      if (posRef.current && modeRef.current !== "fly") {
        posRef.current = clampToViewport(
          posRef.current,
          { w: window.innerWidth, h: vh },
          spriteSize(),
          trayHeightRef.current,
        );
        applyPosition(0);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // pathname / compareIds: the DOM around the sprite changed, re-measure.
  }, [pathname, compareIds, applyPosition, spriteSize]);

  /* ---------------- random idle actions ---------------- */
  useEffect(() => {
    if (reduce) return;
    let timer = 0;
    let previous: IdleAction | null = null;

    const loop = () => {
      timer = window.setTimeout(() => {
        const m = modeRef.current;
        if (!openRef.current && document.visibilityState === "visible" && (m === "home" || m === "rest")) {
          const next = pickIdleAction(previous, Math.random, m === "rest" ? REST_ACTIONS : undefined);
          previous = next;
          playAction(next);
        }
        loop();
      }, randomBetween(IDLE_GAP_MS, Math.random));
    };
    loop();
    return () => window.clearTimeout(timer);
  }, [reduce, playAction]);

  /* ---------------- scheduled thought bubbles ---------------- */
  useEffect(() => {
    let timer = 0;
    let lastIndex: number | null = null;

    const loop = (lastShownAt: number | null) => {
      const count = readSession(SESSION_BUBBLE_COUNT) ?? 0;
      if (count >= BUBBLE.maxPerSession) return;
      timer = window.setTimeout(() => {
        // Only speak when nothing else is going on and the user has been idle
        // for a moment; otherwise try again later (a short retry, not a full
        // interval, so an idle moment is not missed by much).
        const now0 = Date.now();
        const ok = canShowBubble({
          terminalOpen: openRef.current,
          mode: modeRef.current,
          muted: mutedRef.current,
          hidden: document.visibilityState !== "visible",
          idleMs: now0 - lastActivityAt.current,
          sinceTerminalMs: now0 - terminalClosedAt.current,
          shownThisSession: readSession(SESSION_BUBBLE_COUNT) ?? 0,
        });
        if (!ok) {
          if (mutedRef.current) return; // stays quiet until remarks are turned back on
          timer = window.setTimeout(() => loop(lastShownAt), 15_000);
          return;
        }
        const index = pickMessageIndex(COMPANION_MESSAGES.length, lastIndex, Math.random);
        lastIndex = index;
        const now = Date.now();
        writeSession(SESSION_LAST_BUBBLE, now);
        writeSession(SESSION_BUBBLE_COUNT, (readSession(SESSION_BUBBLE_COUNT) ?? 0) + 1);
        dismissedRef.current = false;
        say(COMPANION_MESSAGES[index], BUBBLE.visibleMs);
        // A bubble left to fade on its own resets the dismiss streak.
        window.setTimeout(() => {
          if (!dismissedRef.current) dismissStreak.current = 0;
        }, BUBBLE.visibleMs + 50);
        loop(now);
      }, nextBubbleDelay(lastShownAt, Date.now(), Math.random));
    };

    loop(readSession(SESSION_LAST_BUBBLE));
    return () => window.clearTimeout(timer);
  }, [say]);

  /* ---------------- dragging ---------------- */
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    grabX: number;
    grabY: number;
    lastX: number;
    lastT: number;
    moved: boolean;
  } | null>(null);
  // Mouse drags end with a synthetic click; touch drags do not. Suppress by
  // time window rather than a sticky flag so a later tap still opens.
  const dragEndedAt = useRef(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      grabX: e.clientX - r.left,
      grabY: e.clientY - r.top,
      lastX: e.clientX,
      lastT: performance.now(),
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD_PX) return;
      d.moved = true;
      clearBrain();
      setBubble(null);
      changeMode("drag");
    }
    const now = performance.now();
    const vx = ((e.clientX - d.lastX) / Math.max(1, now - d.lastT)) * 16; // px per frame-ish
    d.lastX = e.clientX;
    d.lastT = now;
    setBank(reduceRef.current ? 0 : bankAngle(vx * 6));
    posRef.current = clampToViewport(
      { x: e.clientX - d.grabX, y: e.clientY - d.grabY },
      viewport(),
      spriteSize(),
      trayHeightRef.current,
    );
    applyPosition(0);
  };

  const endDrag = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    if (!d.moved) return; // a click — handled by onClick
    dragEndedAt.current = Date.now();
    setBank(0);
    changeMode("rest");
    if (!reduceRef.current) playAction("land");
    if (Math.random() < ROAM.dropLineChance && Date.now() - lastBubbleAt.current > 12_000) {
      say(DROP_LINES[Math.floor(Math.random() * DROP_LINES.length)], 3_200);
    }
    // Stay put for a while, then either wander one more stop or head home.
    clearBrain();
    brainTimer.current = window.setTimeout(() => {
      legsRef.current = Math.random() < 0.5 ? 1 : 0;
      const vp = viewport();
      if (legsRef.current > 0 && !paused()) {
        stepsRef.current.flyTo(
          pickRoamTarget({
            viewport: vp,
            sprite: spriteSize(),
            trayHeight: trayHeightRef.current,
            allowMiddle: !tuckedRef.current && vp.w >= 768,
            random: Math.random,
          }).point,
        );
      } else {
        stepsRef.current.flyTo(null);
      }
    }, randomBetween(ROAM.dropRestMs, Math.random));
  };

  /* ---------------- terminal window ---------------- */
  const openWindow = useCallback(() => {
    if (Date.now() - dragEndedAt.current < 400) return; // the click that ends a mouse drag
    setBubble(null);
    if (!reduceRef.current) playAction("boost");
    setOpen(true);
  }, [playAction]);

  const closeWindow = useCallback(() => {
    setOpen(false);
    terminalClosedAt.current = Date.now();
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
    const reaction = pendingReaction.current;
    pendingReaction.current = null;
    if (reaction) {
      window.setTimeout(() => {
        if (!reduceRef.current) playAction(reaction.action);
        say(reaction.line, 3_500);
      }, 350);
    }
  }, [playAction, say]);

  /* Keyboard: J toggles the terminal from anywhere on the page (not in fields). */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing || e.key.toLowerCase() !== TERMINAL_HOTKEY || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && isTypingContext({ tagName: t.tagName, isContentEditable: t.isContentEditable })) return;
      e.preventDefault();
      if (openRef.current) closeWindow();
      else openWindow();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openWindow, closeWindow]);

  const onQuizFinished = useCallback((percent: number) => {
    pendingReaction.current =
      percent >= 70
        ? { action: "spin", line: QUIZ_LINES.great }
        : percent >= 40
          ? { action: "sway", line: QUIZ_LINES.ok }
          : { action: "shake", line: QUIZ_LINES.poor };
  }, []);

  return (
    <>
      <div
        ref={rootRef}
        className="companion-root"
        data-tucked={tucked && mode === "home" ? "true" : "false"}
        data-mode={mode}
        data-action={action ?? undefined}
        data-open={open ? "true" : "false"}
        data-bubble-side={placement.side}
        data-bubble-vertical={placement.vertical}
      >
        <div ref={roamRef} className="companion-roam">
          <div className="companion-tuck">
            <div className="companion-hover">
              <div className="companion-action">
                <div className="companion-bank relative">
                  {bubble && (
                    <button
                      type="button"
                      id={bubbleId}
                      className="companion-bubble"
                      onClick={dismissBubble}
                      aria-label={`${bubble} (dismiss)`}
                    >
                      <span role="status" aria-live="polite">
                        {bubble}
                      </span>
                    </button>
                  )}
                  <span className="companion-zzz" aria-hidden>
                    <span>z</span>
                    <span>z</span>
                    <span>z</span>
                  </span>
                  <button
                    ref={buttonRef}
                    type="button"
                    className="companion-button"
                    onClick={openWindow}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label="Open the J.A.R.V.I.S. terminal"
                    title="J.A.R.V.I.S. — click or press J to open · drag to move"
                  >
                    <PixelIronMan className="companion-sprite" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <JarvisWindow
        open={open}
        onClose={closeWindow}
        quiz={quiz}
        quizDispatch={quizDispatch}
        onQuizFinished={onQuizFinished}
        remarksOn={!muted}
        onToggleRemarks={toggleRemarks}
      />
    </>
  );
}
