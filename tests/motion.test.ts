import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { frameForProgress, frameIndicesToLoad } from "@/lib/motion";

describe("reduced-motion frame policy", () => {
  it("loads every frame normally and only the last frame under reduced motion", () => {
    assert.equal(frameIndicesToLoad(169, false).length, 169);
    assert.deepEqual(frameIndicesToLoad(169, true), [168]);
    assert.deepEqual(frameIndicesToLoad(0, false), []);
  });

  it("maps scroll progress to frames, clamped, and pins under reduced motion", () => {
    assert.equal(frameForProgress(0, 169, false), 0);
    assert.equal(frameForProgress(0.5, 169, false), 84);
    assert.equal(frameForProgress(1, 169, false), 168);
    assert.equal(frameForProgress(-3, 169, false), 0);
    assert.equal(frameForProgress(9, 169, false), 168);
    for (const p of [0, 0.3, 1]) assert.equal(frameForProgress(p, 169, true), 168);
  });
});
