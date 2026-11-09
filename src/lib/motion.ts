/** True when the user has asked the OS/browser for reduced motion. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Which frame indices (0-based) a scroll-scrubbed sequence should load.
 * With reduced motion only the final frame is loaded and shown, so the
 * section still looks finished but never flips frames under the user.
 */
export function frameIndicesToLoad(count: number, reduced: boolean): number[] {
  if (count <= 0) return [];
  if (reduced) return [count - 1];
  return Array.from({ length: count }, (_, i) => i);
}

/** Frame to draw for a given scroll progress (0..1). */
export function frameForProgress(progress: number, count: number, reduced: boolean): number {
  if (count <= 0) return 0;
  if (reduced) return count - 1;
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(count - 1, Math.floor(p * count));
}
