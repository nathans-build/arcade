# Critter Quest: design plan

A creature-collecting game for SpiderBen10's Arcade (`games/critter-quest/`, served at `/critter-quest/`).
The hero explores a small pixel world, **syncs** with original critters by answering kit questions, and
raises them. Critters evolve only when the player has *mastered NC standards over several days*, so
the collection doubles as a progress report. Follows `COMMON_BRIEF.md` (grade badge or picker, toolbar,
transmissions, mission report, K–2 read-aloud, 320×200 canvas, tests, playtest).

**Originality rules (checked when names and sprites are reviewed):** no thrown capture device of any
kind, no "trainer", no type-effectiveness chart, no elemental-type badges, no gym/league structure, no
look-alikes (no yellow electric rodent, fire lizard, etc.), no "gotta …" slogans. Critters are **synced**
(they choose to join you), not captured.

---

## 1. Core loop and feel

| Step | What happens | Time |
|---|---|---|
| **Hub map** | 2×2 grid of one-screen zones, one per family: **Number Nest** (math), **Lab Wilds** (science), **Word Woods** (ELA), **Map Mesa** (social studies). The hero (arcade `HERO` sprite) walks between them. Each expedition places **6 critter shadows** (flickering silhouettes) on the map. There are no random step encounters: the kid picks which shadow to approach, which means they are also picking a subject. | 10–20 s per walk |
| **Sync encounter** | The critter faces the hero with a **Sync meter** (pips) and a **Patience** bar. A kit question appears in the DOM banner under the canvas (like Lane Leap's home question). A right answer adds a pip and makes the critter do a happy animation. A wrong answer costs 1 patience and shows the explanation (read aloud for K–2). Pips needed: common 2, uncommon 3, rare 4. Patience: 3 (4 for K–2). | 1–2 min |
| **Signal Lock** (3-second mini-game) | A pulsing ring shrinks around the critter; tap or Space when it lines up. It **cannot fail**: a good lock gives +XP and a sparkle, a perfect lock gives a "bright" (palette-swapped) variant. It is quick action fun and never decides whether the critter joins. | 3 s |
| **Joined card** | New critter card: name, family, linked strand ("Fractions"), and the standards it grows from. | 5 s |
| **Transmission** | After the 3rd and 6th encounter: a full kit question (passages allowed) with an explanation. A right answer gives a Training Snack. | 30 s |
| **Expedition report** | Results by standard (code + skill), "practice next", critters that got closer to evolving, standards now **due** for review. | 30 s |

**Session:** one expedition takes about 8–12 minutes (about 12–18 questions), which suits an iPad sitting.
The kid can quit at any shadow and the progress is kept.

**Why come back (without dark patterns):**
- The shadows change each day, and critters that are due for review glow "wants to train".
- Evolution needs mastery on **two or more different days**, so a kid can't grind it in one sitting, and each return pays off.
- The Field Guide shows empty silhouettes for critters not yet met. Rare lines appear only after the kid masters a standard in their strand.
- There are no streak penalties, no energy timers, no "come back or lose it" messages, and no shop or currency for sale.

## 2. Creatures

- **Launch roster: 24 species.** 4 families × 2 evolution lines × 3 stages. Map Mesa's 6 are designed and
  drawn but show as **"sleeping eggs"** until `bankFor("social", grade)` is available (the bank folder is
  empty today). v2 grows to 40 (a 3rd line per family plus 4 one-stage **Keepers**).
- **Rarity per line:** line A common (2 pips) and line B uncommon (3 pips). Stage 3 is never met wild; it
  only comes from evolution. v2 rare lines (4 pips) appear only once a standard in their strand is mastered.
- **Strand:** each line is tied to one strand of its family. Standard codes map to strands by prefix, e.g.
  math `OA`/`NBT` → Operations & Number, `NF`/`NS`/`RP` → Fractions & Ratios, `G`/`MD` → Shapes &
  Measure, `EE`/`F`/`A-*` → Algebra; science `LS` / `ESS` / `PS`; ELA `RL`/`RI` → Reading and
  `RF`/`L` → Words & Grammar; social studies History / Geography / Civics / Economics.
- **Grade:** the roster is the **same at every grade**, so a collection survives a grade change. Grade sets
  the questions (the kit deck at `?grade=`) and which standards count for evolution: the strand's standards
  **at the current grade**. Stages never go down. K–2 also get fewer pips and more patience.
- **Naming style:** 2–3 syllable portmanteaus of a school idea and a creature sound (≤ 10 characters so
  they fit the bitmap font). Each name must be checked by a web search to make sure it is not already used
  by a franchise.
- **Nathan co-designs:** every sprite is a character grid in `src/data/critters.ts` (the same format as
  `HERO`), so Nathan can draw or rename critters in a text file. The 8 below are placeholders for him to
  veto or rename, and the credits say "Critters designed by SpiderBen10 (NZDO)".

| Line (stages) | Family / strand | Look | Evolves when |
|---|---|---|---|
| **Tallymoth → Tallywing → Tallyon** | Math / Operations & Number | A moth whose wings carry tally marks. It gains wings (and marks) each stage; stage 3 is a lantern-winged glider. | 1 / 3 Operations standards mastered |
| **Frackle → Fractyl → Fractalon** | Math / Fractions & Ratios | A cracked-in-half egg on legs. It grows into a lizard of pie-slice scales, then a crystal wyrm of repeating triangles. | 1 / 3 Fractions standards mastered |
| **Sproutle → Stemmet → Canopex** | Science / Life (LS) | A seed with root feet, then a walking sapling with leaf ears, then a tree-backed tortoise with a bird nest. | 1 / 3 LS standards mastered |
| **Magmite → Crustock → Tectonox** | Science / Earth & Physical (ESS, PS) | A pebble mite with a glowing crack, then a layered-rock beetle (strata stripes), then a plate-shelled giant. | 1 / 3 ESS/PS standards mastered |
| **Inklet → Quillix → Scriptorn** | ELA / Words & Grammar | An ink drop with eyes (a nod to Word Worm's ink), then a porcupine of quill pens, then a scroll-winged knight. | 1 / 3 RF/L standards mastered |
| **Vowlet → Hootext → Folionyx** | ELA / Reading | A round owlet whose body is the letter O, then an owl with page feathers, then a great owl wearing a book cloak. | 1 / 3 RL/RI standards mastered |
| **Mapadillo → Compadillo → Globadillo** | Social / Geography | An armadillo with a map-grid shell, then one with a compass-rose tail, then one that curls into a globe. | 1 / 3 Geography standards mastered |
| **Coinkin → Tradeclaw → Marketitan** | Social / Economics & Civics | A coin-shaped hermit crab, then a crab carrying a market stall, then a town-hall-shelled titan. | 1 / 3 Econ/Civics standards mastered |

## 3. Learning design

- **Questions** come only from the kit: `QuestionDeck(grade, [family subject], { gameId: "critter-quest" })`,
  plus a targeted draw for spaced review. The targeted draw filters `bankFor(subject, grade)` by standard;
  for math it filters `MATH_GENERATORS[grade]` by `gen.standard`. Every answer is recorded with
  `recordAnswer` (so the kit's missed-standard weighting still works) **and** in the game's mastery log.
  **Only the first try at a question counts.**
- **Mastery per standard:** keep a rolling record of the last 10 answers, plus the days they were answered.
  - **Learning:** seen ≥ 3 times.
  - **Mastered:** ≥ 8 of the last 10 correct **and** correct on ≥ 2 different days.
  - A mastered standard that later drops below 6/10 becomes "rusty". The critter keeps its stage but shows a
    ↺ badge until the standard is reviewed.
- **Spaced review (Leitner):** each standard sits in box 1–5, due after 0 / 1 / 3 / 7 / 14 days. A right
  answer moves it up a box; a wrong answer sends it back to box 1. About 1 in 3 encounters and every
  **Train** session draw from due standards first.
- **Training:** pick a critter and answer a 5-question drill from its strand's due or weakest standards. Each
  right answer gives XP. XP only unlocks the *animation* stages. **Evolution is always gated by mastery**,
  never by grinding.
- **Wrong answers teach:** the explanation is always shown and never timed out. The missed standard comes
  back in a later encounter in the same expedition. A critter that runs out of patience "hides" but stays
  *Met* in the Field Guide and comes back later. Nothing is lost.
- **K–2:** read-aloud is on by default (`speakQuestion` for each question; `speak` for explanations and
  critter names; the speaker button or R replays). Text is bigger, there are 2 pips, patience is 4, and the
  critter's cry is played before each question.
- **Ethics:** no purchases, ads, currency, loot boxes, timers that punish absence, or streak loss. Rewards
  follow learning. Snacks come only from correct answers and mastery.

## 4. Progress and saving

The site is now one origin, so every game already writes `arcade.<gameId>.progress.v1` to the **same**
localStorage. Critter Quest can **read** these keys to turn practice in other games into rewards
**without changing any other game**.

| Key | Owner | Contents |
|---|---|---|
| `arcade.critter-quest.save.v1` | this game | `{ v:1, created, lastDay, critters:{ id:{ stage, xp, joinedDay, bright } }, met:[ids], snacks, expeditions, seenArcade:{ gameId:{ std:{seen,correct} } } }` |
| `arcade.mastery.v1` | this game in v1 (proposed kit `profile.ts` in v2) | `{ v:1, standards:{ code:{ last:"1101…", days:[…], box, due, seen, correct } } }` |

- **Arcade bonus (v1, read-only):** at the start of each expedition, the game compares other games'
  per-standard `seen/correct` with the snapshot saved in `seenArcade`. New correct answers become
  **Training Snacks** in the matching family (capped at 10 a day), and the game shows "Your practice in
  Lane Leap fed your critters!". These answers also count toward mastery as *correct on that day*.
  Recency is approximate, so they only count for the "different days" rule.
- **v2 kit profile:** move the mastery log into `kit/profile.ts` (`recordArcadeAnswer`, `mastery(code)`,
  `due(grade)`), called from the kit's `recordAnswer`. Every game then feeds exact mastery for free. This is
  a kit change that has to be copied into all 9+ games, so it is for the parent to decide.
- **Versioning:** every blob has a `v` field and goes through a chain of `migrate[v]` steps. Corrupt JSON
  starts a fresh save and the corrupt data is kept under `….bak`. A save with a **newer** `v` is treated as
  read-only (the game plays but won't overwrite it). All access is wrapped in try/catch.
- **New device / backup:** there are no accounts. **Settings → Save code:**
  - *Copy code* (a base64url JSON string with a CRC-32 check) and *Download file*
    (`critter-quest-save.json`, which works with iPad Files).
  - *Import* by pasting or choosing a file. It validates the checksum and version, previews "18 critters,
    12 mastered standards", then asks to confirm.
  - *Reset* needs a two-step confirm.
- **Privacy:** there is no personal data. No names are stored; an optional critter nickname is ≤ 10
  characters from the bitmap font, kept on the device only. The game makes no network calls, uses no
  analytics, and has no share links. The only external request is Google Fonts, the same as other games.
  Self-hosting the fonts is an open question.

## 5. Screens and controls

**Screens:**
1. Title (grade badge + "CHANGE GRADE IN THE ARCADE", or a K–12 picker)
2. Hub map
3. Sync encounter
4. Signal Lock
5. Joined card
6. Evolution cutscene
7. Field Guide (a 6×4 grid of cards; each card shows its linked standards with mastery bars and their due state)
8. Train
9. Transmission
10. Expedition report
11. Settings / Save code

| Action | Keyboard | Touch |
|---|---|---|
| Walk the map | Arrow keys only (**not WASD**: A and D are answer keys) | D-pad, or tap a spot to walk there |
| Approach / confirm | Enter / Space | Tap the shadow or button |
| Answer | **1–4 or A–D** | Tap an answer button (always 4 on screen) |
| Signal Lock | Space / Enter | Tap anywhere |
| Field Guide / Train | G / T | Toolbar buttons |
| Pause, sound, read aloud | P or Esc, M, R | Toolbar (◀ ARCADE, pause, sound, speaker) |

**Art:** the canvas is 320×200 with nearest-neighbour scaling and CRT scanlines. Fonts are Press Start 2P,
VT323 and the game's own bitmap font (copied from Lane Leap). The palette is the arcade's: navy `#0a0f2e`
night sky, red `#e3262f`, blues `#2456e8` / `#6ea0ff`, yellow `#ffd23f`, cyan visor `#7ff3ff`, plus one
accent hue per family: math yellow, science green `#3fd27a`, ELA cyan, social orange `#ff9a3f`. Critters
are 16×16 (stage 1), 24×24 (stage 2) and 32×32 (stage 3) grids of at most 5 colours. The hero is the
original `HERO` grid (red helmet, cyan visor, blue suit, yellow diamond). There is no franchise imagery.
The music is an original 16-step bassline, and each critter gets a 3-note chip cry built with `ChipAudio`.

## 6. Architecture

```
games/critter-quest/            (Vite + React + TS, copied setup from lane-leap)
  src/CritterQuest.tsx          screens, toolbar, DOM question banner, report
  src/quest/engine.ts           loop (dt clamp 0..0.05), map + encounter + lock drawing
  src/quest/map.ts              zones, shadow placement per day (seeded by date)
  src/quest/encounter.ts        pure state machine: pips, patience, first-try-only
  src/quest/lock.ts             Signal Lock timing (pure scoring fn)
  src/quest/questions.ts        deck wrapper + targeted draw by standard (banks / MATH_GENERATORS)
  src/quest/mastery.ts          pure: record, isMastered, rusty, Leitner due (clock injected)
  src/quest/save.ts             load/save/migrate/export/import (+ CRC-32)
  src/quest/arcadeBonus.ts      diff other games' progress keys → snacks
  src/data/critters.ts          roster: id, name, family, strand, stage grids, cry
  src/data/strands.ts           standard code → family/strand
  src/quest/font.ts, sprites.ts hero, UI, bitmap font
  src/kit/                      unchanged copy of arcade kit
  scripts/check-data.ts         npm test
  scripts/playtest.cjs          Playwright
```

**Tests (`npm test`, all pure, fixed clock):**
- **Roster:** ids and names are unique and ≤ 10 characters with glyphs in the font. There are 3 stages per
  line with the correct grid sizes, grids are rectangular, and colours come from the palette.
- **Strands:** `strands.ts` classifies **every** standard code found in the banks and `MATH_GENERATORS` for
  K–12. Every non-sleeping line has **≥ 3 standards in its strand at every grade**, so evolution is never
  impossible; if a gap exists, the strand falls back to the family.
- **Mastery:** 8/10 over 2 days counts, 8/10 on one day doesn't, rusty drops below 6/10, and the Leitner
  intervals are right.
- **Encounter:** only the first try counts, patience runs out as it should, and pips differ for K–2.
- **Save:** round-trips; v0 → v1 migration works; corrupt input gives a fresh save plus a backup; a
  future-`v` save is never overwritten; imports with a bad checksum or truncated code are rejected.
- **Arcade bonus:** diffs are counted once, capped per day, and malformed foreign keys are ignored.
- **Social:** the social family stays asleep when its bank is empty. Note that the deck silently falls back
  to math for an empty written pool, so the game must check this itself.

**Playtest:** the brief's matrix (K, 3, 7, 11; keyboard at 1280×800 and touch at 1080×810; a run with no
`?grade=`). It covers walking to a shadow, answering by key and by tap, a wrong answer's explanation,
Signal Lock, the Field Guide, a transmission, the report, and a reload that keeps the save. It also runs an
import/export round trip and a forced evolution via `?debug` (`window.__cq`).

**Menu:** add a `games.js` cabinet (`id: "critter-quest"`, `url: "/critter-quest/"`,
subjects `["Math","Science","ELA"]`, adding "Social Studies" when the bank ships) and `img/critter-quest.png`.
`build-site.sh` picks up the game automatically.

## 7. Scope

**v1 (one engineer-agent, one session):**
- The hub map (4 static zones, with daily seeded shadows)
- Encounter, Signal Lock, joined card and evolution flash
- 24 critters (18 active and 6 sleeping)
- Field Guide, Train, transmissions and the report
- Mastery, Leitner review and the arcade bonus (read-only)
- Save, export/import and settings
- K–2 read-aloud
- Tests, the playtest, a README with a critter table and linked NC strands, and a screenshot

**v2:**
- Nathan's redesigned and renamed critters
- 3rd line per family and 4 Keepers (→ 40)
- Friendly **Spar** mode, where your critter's moves are your answers against a Keeper; there is no type chart
- `kit/profile.ts` shared mastery that all games feed
- Social family awake
- Bright variants gallery
- Critter nicknames
- Multiple save slots for siblings
- Day/night map
- An end-of-grade "Field Guide certificate" screen to print

**Risks and open questions for the parent:**
1. **Bank size:** written banks hold about 18 questions per subject per grade, often 1–3 per standard. A
   kid could "master" a standard by memorising answers. Options: accept this for v1, require mastery across
   ≥ 2 distinct question ids, and/or grow the banks.
2. **Kit change:** keep mastery game-local in v1 (as proposed) or add `kit/profile.ts` now and copy it into
   every game?
3. **Arcade bonus** reads other games' storage keys. Is that coupling acceptable, or should it wait for the
   kit profile?
4. **Social studies:** ship its 6 critters asleep, or leave them out until the bank lands?
5. **Thresholds:** 8/10 over 2 days; pips 2/3; patience 3/4. These should be tuned after Nathan plays it.
6. **Names:** Nathan has to approve them, and a franchise-collision check is needed before launch.
   Self-hosting the Google Fonts is still open.
7. **Shared iPad:** one save per browser. Should siblings get slots (v2)?
