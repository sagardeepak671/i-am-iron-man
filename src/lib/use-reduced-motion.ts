"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

/**
 * Hydration-safe reduced-motion preference. The server (and the hydration
 * pass) see `false`; the client re-renders with the real value immediately
 * afterwards, so markup never mismatches and styles never get stranded.
 */
export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
