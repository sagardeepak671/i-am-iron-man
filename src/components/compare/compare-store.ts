"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  MAX_COMPARE,
  addToSelection,
  canonicalArmorId,
  removeFromSelection,
  toggleSelection,
  type SelectionResult,
} from "@/lib/compare-selection";

/**
 * Cross-page compare selection, persisted in localStorage so a user can pick
 * armors on the list page and on detail pages before opening /compare.
 * The /compare page itself treats the URL as the source of truth and writes
 * it back here so the tray stays in sync.
 */

const KEY = "stark-archive:compare";
const EVENT = "stark-archive:compare-change";
const EMPTY: readonly string[] = Object.freeze([]);

let cache: readonly string[] = EMPTY;
let cacheRaw: string | null | undefined;

function sanitize(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out: string[] = [];
  for (const item of list) {
    if (typeof item !== "string") continue;
    const id = canonicalArmorId(item);
    if (id && !out.includes(id) && out.length < MAX_COMPARE) out.push(id);
  }
  return out;
}

function read(): readonly string[] {
  if (typeof window === "undefined") return EMPTY;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    cache = raw ? sanitize(JSON.parse(raw)) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(ids: readonly string[]) {
  if (typeof window === "undefined") return;
  try {
    if (ids.length === 0) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* storage unavailable (private mode, quota) — selection is per-render only */
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

const getServerSnapshot = () => EMPTY;

export function useCompareSelection() {
  const ids = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const add = useCallback((id: string): SelectionResult => {
    const r = addToSelection(read(), id);
    if (!r.rejected) write(r.ids);
    return r;
  }, []);
  const remove = useCallback((id: string) => write(removeFromSelection(read(), id)), []);
  const toggle = useCallback((id: string): SelectionResult => {
    const r = toggleSelection(read(), id);
    if (!r.rejected) write(r.ids);
    return r;
  }, []);
  const clear = useCallback(() => write([]), []);
  const replace = useCallback((next: readonly string[]) => write(sanitize([...next])), []);

  return { ids, add, remove, toggle, clear, replace };
}
