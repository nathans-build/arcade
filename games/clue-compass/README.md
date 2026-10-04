# Clue Compass

A geography detective chase for **SpiderBen10's Arcade**, grades **K–5**, created by **SpiderBen10 (NZDO)**.

**Pocket**, a cheeky runaway robot with a very big pocket, keeps *borrowing* things (a fire station bell,
a lighthouse lamp, a torch keychain…) and leaving IOU notes. The arcade hero follows the trail with **Pip**,
a homing pigeon who carries transmissions. At each stop you ask witnesses for clues about where Pocket went
next, then pick one of four destinations (the multiple-choice question). A wrong trip costs time, and a
friendly local explains why Pocket isn't there: that explanation is the lesson. Pocket's IOU notes fill a
notebook that describes the hideout, and the last choice is the hideout itself. Pocket always gives the
thing back.

The chase mechanic is inspired by *Where in the World Is Carmen Sandiego?* (1985). Everything else is
original: no red coat or fedora, no ACME or V.I.L.E., no detective ranks, no look-alike screens or music.

![Clue Compass map](docs/screenshot.png)

## How a case plays

1. **Brief:** what Pocket borrowed (read aloud for K–2).
2. **Stop:** up to 3 witnesses (each costs 1 hour for grades 3–5) give clues about the *next* place:
   community helpers, sounds and things (K); map directions, continents, oceans, animals and NC map
   symbols (1–2); NC regions, climate, landforms and neighbor states (3); NC rivers, landmarks, state
   symbols, people and history places (4); U.S. regions, capitals, landforms, landmarks and a few world
   capitals (5). K–2 clues are pictures with read-aloud; 3–5 clues are short reading-inference sentences.
3. **Travel:** pick A–D on the panel, press 1–4 / A–D, or tap a lettered pin on the pixel map (V shows
   the map with a compass rose). Pip flies the dotted route.
4. **Wrong trip:** 4 hours lost; a local says what is true there and what the clue pointed to.
5. **Hideout:** at the last stop the notebook (one IOU note per stop) is the clue set.
6. **Between cases:** a transmission question from the kit social studies deck at the player's grade.
7. **Mission report** (2 cases for K–2, 3 for 3–5): results by NC standard, practice next, and what the
   locals taught you.

Grades 3–5 have a clock (compass charges in hours); if it runs out, Pocket zips away but leaves the item
with a sorry note. K–2 have no clock. **Grades 6–12** see a friendly note pointing them to **Thread
Chasers** (the world-history time chase) and can still play the grade 5 cases. In `site/games.js` list
this game for grades `K`–`5`.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Pick a witness / talk | ← → then Enter or Space | tap the witness on the screen or in the panel |
| Travel (answer) | 1–4 or A–D | tap A–D in the panel, or the lettered pin on the map |
| Map / scene | V | MAP button |
| Read aloud again | R | speaker button |
| Pause / mute | P / M | toolbar |

Read-aloud is on by default for K–2 (kit `readAloudPref`) and reads briefs, clues, IOU notes, choices,
lessons and transmissions.

## Content by grade

| Grade | Cases (stops) | Map and places | Clue skills | NC codes |
|---|---|---|---|---|
| K | 6 (4 each) | Compass Corners, a made-up town: 10 places | community helpers, their things and sounds (pictures) | K.E.1, K.G.1.1 |
| 1–2 | 6 (4–5) | town (directions), world (7 continents, 5 oceans), NC map symbols | N/S/E/W, continents and oceans, animals, landmarks, map symbols | 1.C&G.1.1, 1.G.1, 1.G.1.2, RI.1.1 / 2.G.1, 2.G.1.1, RI.2.1 |
| 3 | 6 (4–5) | NC (regions shaded) and the U.S. (NC's neighbors) | regions, climate, landforms, capitals, neighbor states | 3.G.1.1, 3.G.1.2, RI.3.1, L.3.4 |
| 4 | 6 (4–5) | NC: 23 places | regions, rivers, landmarks, state symbols, American Indian nations, history places | 4.G.1, 4.G.1.1, 4.G.1.2, 4.E.1, 4.H.1, 4.H.1.1, RI.4.1, L.4.4 |
| 5 | 6 (4–6) | U.S. (23 places) and world capitals (7) | five U.S. regions, capitals, landforms, landmarks, continents | 5.G.1.1, RI.5.1, L.5.4 |

30 cases, 75 places, 228 facts (each with a source). Transmissions use the kit social bank
(`QuestionDeck(grade, "social")`), so their codes come from the kit.

### Codes to verify

Forms follow the kit social bank (`kit/banks/social/NOTES.md`). The NC DPI site is blocked here, so:
- **Standard-level codes** (objective unknown): `K.E.1` (helpers' jobs), `1.G.1` (directions, maps and
  globes), `2.G.1` (continents and oceans), `4.G.1` (landmarks), `4.E.1` (NC resources and state
  symbols), `4.H.1` (history places).
- **Objective guesses to confirm:** `1.C&G.1.1` for community helpers (the kit bank uses it), `2.G.1.1`
  for directions and community places, `3.G.1.2` for landforms/climate, `4.G.1.2` for rivers as
  movement, `4.H.1.1` for the Eastern Band of Cherokee and the Lumbee, and `5.G.1.1` for state
  capitals and **world** capitals (grade 5 is U.S.-focused; world stops are a light extension).
- ELA: `RI.x.1` for reading clues (grades 1–5) and `L.x.4` when a clue uses a geography word such as
  *barrier island*, *sound*, *spire*, *dune*, *peak*, *port* or *canyon* (grades 3–5).

Facts and sources: see [docs/sources.md](docs/sources.md) (what was checked by web search and what is
general knowledge cited to an overview source).

## Code layout

```
src/chase/      shareable chase engine (no Clue Compass story, no DOM)
  types.ts      Place, Fact, CaseDef, Leg, Tag
  geo.ts        lat/long → pixel projection per map (+ inverse), point-in-polygon, compass directions,
                NC region lookup
  outlines.ts   NC (sounds, Blue Ridge front, Fall Line, rivers), lower-48 U.S. (lakes, rivers), world
  logic.ts      clue resolution, "does this clue fit that place", dead-end lessons, validateCase()
  session.ts    CaseRun: one case in play (stops, witnesses, notebook, charges, tried options)
src/data/       Clue Compass content: places-town/nc/us/world.ts, cases.ts, sources.ts, bands.ts (codes)
src/gfx/        bitmap font, pixel helpers, icons (picture clues), sprites, render.ts (scenes, maps, travel)
src/game.ts     missions, travel animation, transmissions, scoring, recording by standard
src/ClueCompass.tsx, src/ui/cc.css   toolbar, screen + text panel layout, panels, report
src/kit/        the arcade kit (unchanged copy)
```

**Shareable with Thread Chasers:** `src/chase/*` is data-driven. A time chase can reuse `CaseRun`,
`validateCase` (solvable cases, no accidental right answers, every dead end explained), the projection,
pin and direction math and the world outline, adding an era field to `Fact`/`Tag` and its own map frames.
`gfx/render.ts` map drawing and the label spreading are generic over `MapId`.

## Run, test, playtest

```
npm install
npm run dev            # local dev server
npm run build          # tsc (strict) + vite build
npm test               # tsx scripts/check-game.ts
npm run build && npx vite preview --port 4643 --host 127.0.0.1 &
node scripts/playtest.cjs          # SHOT=1 also writes docs/screenshot.png
```

`npm test` checks: every case solvable (played by the real `CaseRun`, with and without mistakes and
within the clock), no wrong destination fits all clues (K–2: no wrong destination fits *any* picture
clue), every dead end has an explanation, clue length per band (60 / 90 / 110 / 120), no clue names its
answer, K–2 picture icons and read-aloud text, the facts table (sources, required keys, unique town
facts), standards codes, and map pins (inside the map, state bounding boxes, NC outline and the region the
pin falls in, U.S. outline and not in a lake, the right continent or open ocean, choices never stacked on
one spot), plus the kit social bank for every grade.

The playtest plays whole missions at grades K, 2, 4, 5 and 7 on keyboard 1280×800 and iPad touch
1080×810 and 810×1080: brief, witnesses (including a tap on the canvas sprite), a wrong trip and its
lesson, a map-pin tap, the hideout, transmissions by key and by tap, and the report, checking for page
errors, page scroll and that the screen fits. `?debug` exposes the game as `window.__cc`; `&fast` makes
travel instant.

## Deploying

Clue Compass lives in the arcade repository at `games/clue-compass/` and is published at
`/clue-compass/` by the arcade's deploy. Vite's `base: "./"` keeps asset paths relative.

## Kit suggestions

- `QuestionDeck` could accept a list of skills/standards to prefer (e.g. geography items for
  transmissions in a geography game).
- A shared `Icon`/bitmap-font module would save every game re-copying `font.ts` and `gfx.ts`.

## Credits

Created by SpiderBen10 (NZDO). Pixel art, characters (Pocket, Pip), music and maps are original.
