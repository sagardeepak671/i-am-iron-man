import { frameIndicesToLoad } from "./motion";

type Options = {
  count: number;
  path: (oneBased: number) => string;
  reduced: boolean;
  onProgress: (loaded: number, total: number) => void;
  onDone: () => void;
};

/**
 * Load a scroll-scrubbed image sequence. Returns the (sparse, when reduced)
 * frame array and a cancel function that detaches handlers and stops any
 * further decoding work from reaching React after unmount.
 */
export function loadFrameSequence({ count, path, reduced, onProgress, onDone }: Options) {
  const indices = frameIndicesToLoad(count, reduced);
  const frames: HTMLImageElement[] = new Array(count);
  let loaded = 0;
  let cancelled = false;

  const settle = () => {
    if (cancelled) return;
    loaded++;
    onProgress(loaded, indices.length);
    if (loaded === indices.length) onDone();
  };

  for (const i of indices) {
    const img = new Image();
    img.decoding = "async";
    img.onload = settle;
    img.onerror = settle;
    img.src = path(i + 1);
    frames[i] = img;
  }

  return {
    frames,
    cancel: () => {
      cancelled = true;
      for (const img of frames) {
        if (!img) continue;
        img.onload = null;
        img.onerror = null;
      }
    },
  };
}
