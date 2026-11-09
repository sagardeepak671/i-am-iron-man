import { SUIT_PART_IDS, type SuitPartId } from "@/data/archive/types";

/**
 * Keyboard model for the suit diagram (WAI-ARIA "tabs" pattern with automatic
 * activation): one part is selected at a time, arrow keys move selection and
 * focus together, Home/End jump to the ends, Enter/Space re-activate, Escape
 * is left to the caller. Pure so it can be unit-tested without a DOM.
 */

export const PART_ORDER: readonly SuitPartId[] = SUIT_PART_IDS;

export const DEFAULT_PART: SuitPartId = "chest";

export const isSuitPartId = (value: unknown): value is SuitPartId =>
  typeof value === "string" && (PART_ORDER as readonly string[]).includes(value);

/**
 * Given the currently focused part and a key, return the part that should
 * receive focus + selection, or `null` if the key is not a navigation key.
 * `Tab` is deliberately not handled so focus can leave the widget.
 */
export function nextPartForKey(
  current: SuitPartId,
  key: string,
  order: readonly SuitPartId[] = PART_ORDER,
): SuitPartId | null {
  const index = order.indexOf(current);
  if (index === -1) return order[0] ?? null;
  const last = order.length - 1;
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return order[index === last ? 0 : index + 1];
    case "ArrowLeft":
    case "ArrowUp":
      return order[index === 0 ? last : index - 1];
    case "Home":
      return order[0];
    case "End":
      return order[last];
    default:
      return null;
  }
}

/** Keys that activate the focused part (for click-equivalent behaviour). */
export const isActivationKey = (key: string): boolean =>
  key === "Enter" || key === " " || key === "Spacebar";

/**
 * Parse a `#part-<id>` hash (as written by technology pages linking into the
 * diagram). Anything else yields `null`.
 */
export function partFromHash(hash: string | null | undefined): SuitPartId | null {
  if (!hash) return null;
  const m = hash.replace(/^#/, "").match(/^part-([a-z]+)$/);
  return m && isSuitPartId(m[1]) ? m[1] : null;
}

/** Roving tabindex: only the selected part is in the Tab sequence. */
export const tabIndexFor = (part: SuitPartId, selected: SuitPartId): 0 | -1 =>
  part === selected ? 0 : -1;
