"use client";

import { useEffect, useId, useRef, type Dispatch } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { X } from "@phosphor-icons/react";
import { useReducedMotionPreference } from "@/lib/use-reduced-motion";
import type { QuizAction, QuizState } from "@/lib/quiz";
import { JarvisQuiz } from "./JarvisQuiz";

type Props = {
  open: boolean;
  onClose: () => void;
  quiz: QuizState;
  quizDispatch: Dispatch<QuizAction>;
  /** Called when a quiz run finishes, with the percentage scored. */
  onQuizFinished?: (percent: number) => void;
  /** Thought-bubble remarks toggle shown in the status bar. */
  remarksOn: boolean;
  onToggleRemarks: () => void;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Retro J.A.R.V.I.S. terminal window styled like an 8-bit game screen:
 * pixel frame and title bar, CRT-style power-on/off, and the training-grounds
 * quiz inside (JarvisQuiz).
 *
 * Accessibility: `role="dialog"` + `aria-modal`; focus moves into the quiz's
 * primary action on open (falls back to the close button); Tab is trapped;
 * Escape / backdrop click close; the opener restores focus. Page scroll is
 * locked while open: Lenis ignores the overlay (`data-lenis-prevent`), native
 * scroll is blocked with `overflow: hidden`, and touch moves outside the
 * scrollable body are cancelled (iOS).
 */
export function JarvisWindow({
  open,
  onClose,
  quiz,
  quizDispatch,
  onQuizFinished,
  remarksOn,
  onToggleRemarks,
}: Props) {
  const reduce = useReducedMotionPreference();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // iOS: only the terminal body may scroll by touch; nothing leaks to the page.
    const onTouchMove = (e: TouchEvent) => {
      const body = bodyRef.current;
      const target = e.target as Node | null;
      if (!body || !target || !body.contains(target)) {
        if (e.cancelable) e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    // If the quiz did not claim focus (it normally does), land on the close button.
    const t = window.setTimeout(() => {
      if (!dialogRef.current?.contains(document.activeElement)) {
        closeRef.current?.focus({ preventScroll: true });
      }
    }, 60);

    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", onTouchMove);
      html.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const backdrop: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2, delay: reduce ? 0 : 0.18 } },
  };

  const panel: Variants = reduce
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        // CRT power-on: a bright horizontal line stretches, then opens up.
        hidden: { opacity: 0, scaleX: 0.55, scaleY: 0.015 },
        visible: {
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          transition: {
            opacity: { duration: 0.1 },
            scaleX: { duration: 0.2, ease: [0.2, 0.9, 0.3, 1.05] },
            scaleY: { duration: 0.32, delay: 0.14, ease: [0.16, 1, 0.3, 1] },
          },
        },
        exit: {
          opacity: 0,
          scaleX: 0.6,
          scaleY: 0.015,
          transition: {
            scaleY: { duration: 0.18, ease: [0.6, 0, 0.9, 0.4] },
            scaleX: { duration: 0.14, delay: 0.14, ease: "easeIn" },
            opacity: { duration: 0.08, delay: 0.24 },
          },
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="jarvis-overlay"
          className="jarvis-overlay fixed inset-0 z-[48] flex items-center justify-center overscroll-contain bg-black/75 p-2 backdrop-blur-sm md:p-6"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          data-lenis-prevent=""
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="jarvis-window relative flex h-[calc(100dvh-16px)] w-full flex-col md:h-[min(800px,calc(100dvh-48px))] md:w-[min(1040px,100%)]"
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "50% 50%" }}
          >
            {/* Title bar */}
            <header className="jarvis-titlebar flex items-center justify-between gap-3 py-1.5 pl-3 pr-1.5 md:pl-4 md:pr-2">
              <h2
                id={titleId}
                className="flex min-w-0 items-center gap-2.5 font-pixel text-[12px] uppercase tracking-[0.14em] text-foreground"
              >
                <span aria-hidden className="jarvis-dot inline-block h-2.5 w-2.5 shrink-0 bg-accent" />
                <span className="truncate">J.A.R.V.I.S. &middot; Training grounds</span>
              </h2>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden font-pixel text-[10px] uppercase tracking-[0.14em] text-zinc-500 sm:inline">
                  Esc closes
                </span>
                <button ref={closeRef} type="button" onClick={onClose} aria-label="Close terminal" className="px-close">
                  <X size={14} weight="bold" aria-hidden />
                </button>
              </div>
            </header>

            {/* Body = the world */}
            <div ref={bodyRef} className="jarvis-body relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <JarvisQuiz state={quiz} dispatch={quizDispatch} onClose={onClose} onFinished={onQuizFinished} />
            </div>

            {/* Status strip */}
            <footer className="jarvis-statusbar flex items-center justify-between gap-3 py-1 pl-3 pr-1.5 font-pixel text-[10px] uppercase tracking-[0.14em] text-zinc-500 md:pl-4">
              <span className="truncate">
                <span className="text-accent">&#9632;</span> Stark Industries &middot; Online
              </span>
              <button
                type="button"
                onClick={onToggleRemarks}
                aria-pressed={remarksOn}
                className="px-toggle"
                title="Thought bubbles from the companion"
              >
                Remarks <span className={remarksOn ? "text-accent" : "text-zinc-400"}>{remarksOn ? "On" : "Off"}</span>
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
