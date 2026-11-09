# Iron Man — MCU Armor & Technology Archive

A Next.js App Router project (TypeScript, React, Tailwind CSS, Framer Motion,
Lenis). The home page is a scroll-driven cinematic built from two local image
sequences; the rest of the site is a typed, source-cited archive of the MCU
Iron Man armors and suit technologies, limited to the feature films from
*Iron Man* (2008) through *Avengers: Endgame* (2019).

## Setup

Requires Node.js 20.9+ and npm. No environment variables, accounts, database,
or external APIs. Installing dependencies needs network access; building does
not (fonts are bundled from the `geist` package).

```sh
npm ci
npm run dev        # http://localhost:3000
```

Production:

```sh
npm run build      # runs the archive integrity check first (prebuild)
npm start
```

## Routes

| Route | What it is |
| --- | --- |
| `/` | Cinematic home page. The only route that loads `public/frames` and `public/frames2`. The "Systems" panel shows film-stated values only; the animated reactor readout is labelled as simulated. |
| `/archive` | Archive overview: every armor and technology record, specs, facts with `[n]` citation markers, and the numbered source registry. |
| `/armors` | Searchable armor list. State lives in the URL: `?q=…&film=<film-id>&sort=release\|release-desc\|name\|name-desc`. Works without JavaScript. |
| `/armors/<id>` | Armor record: overview, first appearance, design approach, capabilities, known limitations, specs, related technologies, sources cited on the page. Case/alias variants (`/armors/Mark-I`, `/armors/hulkbuster`, `/armors/mark-50`) redirect; unknown ids 404. |
| `/technology` | Six suit systems plus the **suit explorer** — an original, conceptual SVG diagram (not a blueprint) with selectable helmet, chest unit, palms, and boots; `#part-<id>` pre-selects a region. |
| `/technology/<id>` | System record: what it does, connected systems, armors that demonstrate it, known limitations, still-unknown list, sources. Shorthand (`/technology/hud`, `/technology/jarvis`) redirects. |
| `/compare` | Compare 2–3 armors: `?ids=mark-i,mark-l[&diff=1]`. Invalid, duplicate, and surplus ids are dropped with a notice. "Show differences only" diffs normalised data (tags, ids, approach kinds), not wording. |

Armor ids: `mark-i`, `mark-ii`, `mark-iii`, `mark-v`, `mark-vi`, `mark-vii`,
`mark-xliv`, `mark-l`, `mark-lxxxv`. Technology ids: `arc-reactor`,
`repulsors`, `flight-stabilization`, `helmet-hud`, `onboard-ai`,
`nanotechnology`.

`src/proxy.ts` rewrites `/armors/*` and `/technology/*` paths that cannot be
percent-decoded to a static 404 route (Next.js would otherwise answer 500).

## Project layout

- `src/app` — pages. Each archive section has `not-found.tsx` (unknown slugs)
  and `404/page.tsx` (rewrite target for undecodable paths).
- `src/components` — `sections` (home page), `ui` (navbar with mobile menu,
  badges, HUD frames, animated wrappers), `archive`, `armors`, `technology`,
  `compare`, `companion` (see "Stark companion").
- `src/data/archive` — **the content**. See "Content maintenance".
- `src/lib` — pure logic with tests: `archive-integrity.ts`, `armor-query.ts`,
  `armor-slug.ts`, `technology-slug.ts`, `suit-explorer.ts`, `compare.ts`,
  `compare-selection.ts`, `motion.ts` / `frame-loader.ts` (reduced-motion and
  lazy frame loading for the home page), `systems-readout.ts`,
  `companion.ts` (placement, idle and bubble scheduling for the companion).
- `scripts` — `check-archive.ts`, `verify-sources.ts`.
- `tests` — `node:test` suites run through `tsx`.
- `public/frames`, `public/frames2` — 169 frames each; keep both.

## Content maintenance

All archive content is typed data in `src/data/archive/`:

| File | Holds |
| --- | --- |
| `sources.ts` | Source registry (title, publisher, URL, access date, verification state) and the film list. |
| `armors.ts` | Armor records: facts, `design` (one normalised approach + cited text), `capabilities` and `limitations` (cited facts with normalised `tags`), specs, technology links, image (or `null`). |
| `technologies.ts` | Technology records: facts, `connections` (cited, reciprocal), `limitations`, armor links, `knownUnknowns`. |
| `suit-parts.ts` | The four diagram regions, each backed by existing fact ids. |
| `types.ts` | Types, tag vocabularies, label maps. |

Rules (enforced by `npm run check:archive` and the tests):

- MCU feature films through *Avengers: Endgame* only. No comics, games, TV,
  or tie-ins. Sources are the films (linked via Marvel's official film pages)
  or official Marvel pages.
- Every fact, connection, limitation, design note, and stated spec cites at
  least one source with a scene/section locator. Facts are tagged `dialogue`
  (spoken), `on-screen` (shown), or `official-materials`.
- **Never estimate technical values.** If a film does not state it, a spec is
  `{ status: "unknown" }`. The content-audit test fails on any number in
  archive prose that is not on its allow-list of film-stated figures.
- Armor ↔ technology links and technology ↔ technology connections must be
  reciprocal. Capability/limitation facts need at least one known tag.
- Images: only attach an `image` with known provenance, `kind`, and `credit`.
  Currently all records are `null` and render a labelled placeholder.

### Adding an armor or technology

1. Add the record to `armors.ts` / `technologies.ts` (kebab-case id; it is
   also the URL slug). Add reciprocal links on the other side.
2. Cite every statement. Add a new `Source` in `sources.ts` if needed.
3. Run `npm run check:archive` and `npm test`. Detail pages, list filters,
   the explorer, and the comparison pick the record up automatically.

### Verifying sources

The source registry was written **without web access**. Every entry is
`verification: { status: "unverified" }` with `accessDate: null`, and the
archive page shows "Awaiting verification" on each. From a networked machine:

```sh
npm run verify:sources   # GETs each URL and prints the status
```

Reachability is not content verification. Open each page, confirm it
supports the facts citing it, then set `accessDate` (`YYYY-MM-DD`) and
`verification: { status: "verified" }`. Two entries deserve extra care: the
Marvel film-page slug for *The Avengers* (`marvel-s-the-avengers`), and
whether the Marvel "On Screen" bio actually lists the Mark numbers cited to it
(I, III, V, VI, XLIV, L, LXXXV). If not, replace that source with an official
Marvel page that does.

## Stark companion & J.A.R.V.I.S. quiz

A retro pixel-art Iron Man hovers near the bottom-right corner of every page
(mounted once in `src/app/layout.tsx`). Click him — or press **`J`** — to open
the J.A.R.V.I.S. terminal, an 8-bit game screen with the **Stark Training
Grounds** quiz.

**The companion** (`src/components/companion/StarkCompanion.tsx`,
logic in `src/lib/companion.ts`)

- Hovers at home; every 25–55 s flies a short trip (mostly along the screen
  edges), rests with thrusters off, comes back. Drag him with mouse or finger;
  a tap/click still opens the terminal.
- Never blocks controls: he lifts above the compare tray, perches on the
  footer, parks small in the HUD bracket during the home cinematics, and
  steps onto any row-like control (button, field, prev/next link) he would
  otherwise cover.
- Thought bubbles only after 6 s of no input, never mid-flight or near the
  terminal, first after 20–35 s, then every 2–4 min, max 4 per session.
  Dismissing two in a row — or the status-bar **Remarks** toggle — mutes them
  (`localStorage`).
- Reduced motion: static sprite, no trips; drag and the terminal still work.

**The quiz** (`JarvisWindow.tsx`, `JarvisQuiz.tsx`, `QuizWorld.tsx`,
`QuizHud.tsx`; engine in `src/lib/quiz.ts`, path/HUD maths in
`src/lib/quiz-track.ts`)

- Bank: hand-written Iron Man / MCU / humour questions in `src/data/quiz.ts`
  plus Armor & Technology questions **generated from the archive records**
  (`src/lib/quiz-archive.ts`) — add an armor to the archive and the quiz
  grows with it. Every question links back to its record.
- Runs of 10 or 20: category-balanced, shuffled, no repeats; one question at
  a time, four options; score (100 per correct + streak bonus), streak and
  stage in a cabinet HUD; the pixel runner advances one checkpoint per answer
  (hop on correct, shake + red edge on a miss) along a pixel-city path; result
  card with rank and category breakdown; "Run again" reshuffles.
- Keyboard only: `J` → Enter starts → `1–4` or arrows + Enter answer → Enter
  continues → Esc closes (focus returns to the sprite). Closing mid-run and
  reopening resumes; reload starts fresh. The best run persists in
  `localStorage` (`stark-quiz:best`).
- Typeface: Geist Pixel, bundled in the existing `geist` dependency.

**Testing it**

```sh
npm test            # includes tests/companion.test.ts, tests/quiz.test.ts,
                    # tests/quiz-track.test.ts (engine, shuffling/no-repeat,
                    # scoring/streak, restart, best run, path geometry, manners)
```

Manually: load any page and wait a minute (trip + rest), drag him, scroll to
the bottom of an armor record (he steps onto the "Next" link, then the footer),
press `J`, play a run with the keyboard, close mid-run and reopen, finish a run
and reload (best score on the title card), try it at a phone width and with
OS reduced motion.

## Checks and tests

```sh
npm run lint             # eslint
npm run typecheck        # tsc --noEmit
npm test                 # node:test suites in tests/
npm run check:archive    # data integrity (duplicate ids, broken/asymmetric links,
                         # missing citations/sources, malformed sources, bad tags,
                         # out-of-scope films); also runs before every build
npm run build
```

Test suites: archive integrity (including negative cases), content audit,
home page readout, armor search/filter/sort and URL state, armor and
technology slugs, technology/diagram relationships, suit explorer keyboard
model and rendered ARIA structure, comparison (limits, duplicates, invalid
ids, URL round trips, removal, unknown-vs-absent, differences-only), reduced-
motion frame policy.

## Manual review checklist

Things the automated checks cannot fully cover:

- **Flows** — home → Archive → an armor → Armors list (search "hulk") → record;
  Technology → click a diagram region → system page → a related armor → back
  to the system; select 2–3 armors on the list and a detail page → tray →
  Compare → toggle "differences only" → reload and open the URL in another
  browser.
- **Bad input** — `/armors/mark-iv` (404), `/armors/Mark-I` (redirect),
  `/armors/%E0%A4%A` (404 via proxy), `/armors?sort=x&film=nope` (200,
  defaults), `/compare?ids=mark-i,mark-i,mark-iv` (notices).
- **Keyboard** — Tab reaches every control with a visible gold ring; the suit
  diagram: Arrow keys move between regions, Home/End, Enter/Space, Tab leaves;
  mobile menu: button toggles, Escape closes and returns focus.
- **Screen reader** — the diagram's tabs (`role="tab"` on SVG groups) and its
  text-list fallback; compare table headings on mobile (stacked cells repeat
  the armor name).
- **Reduced motion** (OS setting) — no stagger/slide reveals, native
  scrolling, the home page shows a single static frame per sequence.
- **Performance** — DevTools Network: `/frames*` requests only on `/`, and
  `frames2` only after scrolling toward the second sequence.
- **Companion & quiz** — see "Testing it" above.
- **Content** — spot-check a few scene locators against the films; confirm
  sources as above.

The character names and narrative text on the home page are fictional
fan-art content; interface readouts that are not film-stated are labelled
simulated. The existing non-commercial fan-art notice is retained.
