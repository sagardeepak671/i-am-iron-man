import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SuitExplorer } from "@/components/technology/SuitExplorer";
import { SUIT_PART_IDS, TECHNOLOGIES } from "@/data/archive";
import { buildExplorerParts } from "@/lib/explorer-data";
import {
  DEFAULT_PART,
  PART_ORDER,
  isActivationKey,
  isSuitPartId,
  nextPartForKey,
  partFromHash,
  tabIndexFor,
} from "@/lib/suit-explorer";

/* ---------------------------------------------------------------------------
 * Keyboard model (pure)
 * ------------------------------------------------------------------------- */

describe("suit explorer keyboard model", () => {
  it("has the four requested regions in a fixed order", () => {
    assert.deepEqual([...PART_ORDER], ["helmet", "chest", "palms", "boots"]);
    assert.deepEqual([...SUIT_PART_IDS], [...PART_ORDER]);
    assert.ok(isSuitPartId(DEFAULT_PART));
  });

  it("ArrowRight / ArrowDown move forward and wrap", () => {
    assert.equal(nextPartForKey("helmet", "ArrowRight"), "chest");
    assert.equal(nextPartForKey("chest", "ArrowDown"), "palms");
    assert.equal(nextPartForKey("boots", "ArrowRight"), "helmet");
  });

  it("ArrowLeft / ArrowUp move backward and wrap", () => {
    assert.equal(nextPartForKey("chest", "ArrowLeft"), "helmet");
    assert.equal(nextPartForKey("boots", "ArrowUp"), "palms");
    assert.equal(nextPartForKey("helmet", "ArrowLeft"), "boots");
  });

  it("Home / End jump to the ends", () => {
    assert.equal(nextPartForKey("palms", "Home"), "helmet");
    assert.equal(nextPartForKey("helmet", "End"), "boots");
  });

  it("ignores non-navigation keys so Tab can leave the widget", () => {
    for (const key of ["Tab", "Enter", " ", "Escape", "a", "PageDown"]) {
      assert.equal(nextPartForKey("chest", key), null, key);
    }
  });

  it("recovers from an unknown current part", () => {
    assert.equal(nextPartForKey("nope" as never, "ArrowRight"), "helmet");
  });

  it("Enter and Space activate", () => {
    assert.ok(isActivationKey("Enter"));
    assert.ok(isActivationKey(" "));
    assert.ok(!isActivationKey("ArrowRight"));
    assert.ok(!isActivationKey("Tab"));
  });

  it("roving tabindex: only the selected part is tabbable", () => {
    const tabbable = PART_ORDER.filter((p) => tabIndexFor(p, "palms") === 0);
    assert.deepEqual(tabbable, ["palms"]);
    assert.equal(tabIndexFor("helmet", "palms"), -1);
  });

  it("deep links: #part-<id> is parsed, anything else is ignored", () => {
    assert.equal(partFromHash("#part-helmet"), "helmet");
    assert.equal(partFromHash("part-boots"), "boots");
    assert.equal(partFromHash("#part-wings"), null);
    assert.equal(partFromHash("#sources"), null);
    assert.equal(partFromHash(""), null);
    assert.equal(partFromHash(undefined), null);
  });
});

/* ---------------------------------------------------------------------------
 * Rendered structure (server markup, no DOM needed)
 * ------------------------------------------------------------------------- */

describe("suit explorer markup", () => {
  const html = renderToStaticMarkup(
    createElement(SuitExplorer, { parts: buildExplorerParts() }),
  );
  const tabs = [...html.matchAll(/<g[^>]*role="tab"[^>]*>/g)].map((m) => m[0]);

  it("renders one tab per region inside a tablist", () => {
    assert.equal(tabs.length, 4);
    assert.match(html, /role="tablist"[^>]*aria-label="Suit regions"/);
    for (const id of PART_ORDER) {
      assert.ok(tabs.some((t) => t.includes(`data-part="${id}"`)), id);
    }
  });

  it("uses roving tabindex with exactly one selected, focusable tab", () => {
    const selected = tabs.filter((t) => /aria-selected="true"/.test(t));
    assert.equal(selected.length, 1);
    assert.ok(selected[0].includes(`data-part="${DEFAULT_PART}"`));
    assert.ok(/tabindex="0"/.test(selected[0]));
    for (const t of tabs.filter((t) => !/aria-selected="true"/.test(t))) {
      assert.ok(/tabindex="-1"/.test(t), t);
    }
  });

  it("every tab is labelled, controls the panel, and the panel points back", () => {
    const controls = new Set(tabs.map((t) => t.match(/aria-controls="([^"]+)"/)?.[1]));
    assert.equal(controls.size, 1);
    const [panelId] = [...controls];
    assert.ok(panelId);
    assert.ok(html.includes(`id="${panelId}"`));
    assert.match(html, new RegExp(`<section[^>]*id="${panelId}"[^>]*role="tabpanel"`));
    for (const t of tabs) assert.match(t, /aria-label="[^"]+"/);
    const selectedId = tabs.find((t) => /aria-selected="true"/.test(t))?.match(/ id="([^"]+)"/)?.[1];
    assert.ok(selectedId && html.includes(`aria-labelledby="${selectedId}"`));
  });

  it("labels the diagram as conceptual, not a blueprint", () => {
    assert.match(html, /<svg[^>]*role="img"[^>]*aria-labelledby=/);
    assert.match(html, /<title>Conceptual suit diagram/);
    assert.match(html, /not an engineering blueprint/i);
  });

  it("offers an equivalent text list linking every technology", () => {
    assert.match(html, /<nav[^>]*aria-label="Suit regions, text list"/);
    for (const t of TECHNOLOGIES) {
      assert.ok(html.includes(`href="/technology/${t.id}"`), `missing link to ${t.id}`);
    }
    const pressed = [...html.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1]);
    assert.equal(pressed.length, 4);
    assert.equal(pressed.filter((p) => p === "true").length, 1);
  });

  it("shows cited supporting facts for the selected part", () => {
    assert.match(html, /Supporting facts/);
    assert.match(html, /href="\/archive#source-\d+"[^>]*title="[^"]+"/);
  });
});
