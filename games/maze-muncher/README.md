# Maze Muncher

A maze-chase learning game for **SpiderBen10's Arcade**, covering K–12 math, science, ELA and social
studies (North Carolina Standard Course of Study). Munch every data dot in the maze while four
critters hunt you. The question banner always shows a question, and the four big corner pellets
**A–D** are its answers. Munch the right pellet and the critters get **dizzy**: munch them for points,
with more points on a streak. Munch a wrong one and the critters get **fired up** (faster for a few
seconds), and the right pellet flashes while the banner explains the answer. Then a fresh question
comes out with four new pellets, so every maze asks several questions. Clear the maze to get an
**incoming transmission** checkpoint question with its explanation, then go on to the next maze.

![Maze Muncher](docs/screenshot.png)

All the art and names are original. **Munch-Bot** is the arcade's helmeted hero turned into a round
chomping head (red helmet, cyan visor, yellow diamond). The critters are:

| Critter | Look | How it hunts |
|---|---|---|
| GLOOP | green goo drop | heads straight for you |
| FLIT | purple bat | swoops to the spot 4 tiles ahead of you (ambush) |
| PINCH | orange crab | patrols a loop round the bottom half and pinches if you come within 6 tiles |
| BOLT | cyan robot | scrambled map: mostly random turns |

Critters come out of the central pen on a timer. They switch between a scatter phase (each goes
to its home corner) and a chase phase. They move at half speed in the wrap-around tunnel. Eaten
critters float back to the pen as a puff and come out again. Bonus school supplies (book, beaker,
pencil, magnet, globe, ruler, apple, trophy: 100–5000 points) appear below the pen twice a maze.

## Answering never depends on steering

Each of the following locks in an answer straight away, and counts as munching that pellet:

- keys **1–4** or **A–D**
- tapping or clicking an answer button in the banner
- tapping or clicking a pellet or its label in the side panel
- steering onto the pellet

Letters are never movement keys. You steer with the arrow keys, the on-screen D-pad or by swiping
on the maze.

## Grades and difficulty

The title screen has a K–12 grade picker. When the game is opened from the arcade with `?grade=`, the
title screen shows that grade and a *CHANGE GRADE IN THE ARCADE* link instead. Otherwise it starts on
the last grade played in this browser, or grade 3. There is also a subject picker: **Math, Science,
ELA, Social Studies or Mixed** (mixed = math, science and ELA in turn).

Pellet questions use the kit's `quick` questions (`QuestionDeck(grade, subject, { gameId:
"maze-muncher", quickOnly: true })`: every answer is 14 characters or fewer, so it fits beside its
pellet). Transmissions use the full deck, including passages. Standards the player has missed come
up more often.

| Grade | Maze and critters | Sample NC codes (math · science · ELA · social studies) |
|---|---|---|
| K | small 19×19 maze, 2 slow critters (GLOOP, BOLT), 10 s dizzy, 4 lives, big labels | NC.K.CC.5, NC.K.CC.6, NC.K.OA.2 · PS.K.1.1, LS.K.1.1 · RF.K.3, RF.K.4 · K.G.1, K.H.1 |
| 1 | small maze, 3 slow critters (+PINCH) | NC.1.OA.6, NC.1.NBT.1 · PS.1.1, ESS.1.1 · RF.1.3, L.1.1 · 1.G.1, 1.C&G.1 |
| 2 | small maze, 3 slow critters | NC.2.OA.2, NC.2.NBT.5 · PS.2.1.1, LS.2.1 · RF.2.4, L.2.2 · 2.G.1, 2.H.1 |
| 3 | 25×24 maze, 4 critters, 8 s dizzy | NC.3.OA.7, NC.3.NBT.1 · PS.3.1.3, LS.3.1.1 · L.3.4, L.3.1 · 3.G.1, 3.H.1 |
| 4 | as grade 3 | NC.4.NBT.5, NC.4.OA.4 · PS.4.1.1, LS.4.2.2 · L.4.4, L.4.1 · 4.H.1.3 |
| 5 | as grade 3 | NC.5.NBT.7, NC.5.NF.1, NC.5.MD.5 · PS.5.1.2, PS.5.2 · L.5.4, L.5.2 · 5.G.1.1 |
| 6 | quicker critters, 7 s dizzy | NC.6.RP.3, NC.6.NS.1 · PS.6.1.2, PS.6.2.1 · L.6.1, L.6.4 · 6.H.1, 6.G.1 |
| 7 | as grade 6 | NC.7.NS.1, NC.7.RP.2 · PS.7.1, LS.7.1, ESS.7.1.1 · L.7.1, L.7.4 · 7.H.1.1, 7.E.1 |
| 8 | as grade 6 | NC.8.EE.1, NC.8.EE.2 · PS.8.1, LS.8.3 · L.8.1, L.8.4 · 8.H.1, 8.C&G.1 |
| 9 (NC Math 1 · Earth & Env. · English I) | fast critters, 6 s dizzy | NC.M1.A-REI.3, NC.M1.F-IF.2 · ESS.EES.1, ESS.EES.2 · RI.9-10.6, L.9-10.5 · WH.H.1 |
| 10 (NC Math 2 · Biology · English II) | as grade 9 | NC.M2.A-REI.4, NC.M2.N-RN.2 · LS.Bio.1, LS.Bio.2 · RI.9-10.8, L.9-10.1 · CL.C&G.1 |
| 11 (NC Math 3 · Chemistry · English III) | as grade 9 | NC.M3.A-APR.2, NC.M3.F-TF.1 · PS.Chm.1, PS.Chm.2.2 · RL.11-12.6, L.11-12.5 · AH.H.1 |
| 12 (NC Math 4 · Physics · English IV) | as grade 9 | NC.M4.AF.1.1, NC.M4.AF.2.1 · PS.Phy.1, PS.Phy.2 · RL.11-12.5, L.11-12.5 · EPF.E.1 |

**Difficulty by grade band** (speeds in tiles per second, see `src/maze/tuning.ts`):

| Band | Hero | Critters | Fired-up | Dizzy | Pen release | Lives |
|---|---|---|---|---|---|---|
| K–2 | 5.2 | 3.6 | ×1.15 for 4 s | 10 s | every 7 s | 4 |
| 3–5 | 6.0 | 4.8 | ×1.2 for 5 s | 8 s | every 4.5 s | 3 |
| 6–8 | 6.5 | 5.5 | ×1.22 for 6 s | 7 s | every 3.5 s | 3 |
| 9–12 | 7.0 | 6.1 | ×1.25 for 6 s | 6 s | every 3 s | 3 |

With every maze cleared, the critters get 4% faster (they always stay slower than the hero, and are
never faster than the hero even when fired up), the dizzy time drops by 0.5 s and critters leave the
pen sooner. K–2 play the two small mazes (PLAYGROUND, GARDEN PATHS), have bigger pellet labels (with
colour icons for the counting emoji) and bigger text, and **read-aloud is on by default**: each
question and its four choices are read aloud, and so is each explanation. The speaker button (or
**R**) reads it again. Grades 3–12 cycle through the three big mazes (CIRCUIT CITY, LAB LOOPS and
LIBRARY STACKS).

**Scoring:** dot 10 · right answer 50 × streak · dizzy critters 200/400/800/1600 × streak multiplier
(the answer streak, up to ×5) · bonus items 100–5000 · right transmission +500 × maze and an extra
life.

At game over the **mission report** lists every standard met (code, skill and subject) with results
for pellet questions and transmissions, and a *practice next* list.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Steer | ◀ ▶ ▲ ▼ (the turn is remembered until the path opens) | D-pad, or swipe on the maze |
| Answer | 1–4 or A–D | tap an answer, a pellet or its label |
| Transmission | 1–4 / A–D, then Enter | tap an answer, then *Next maze* |
| Read aloud | R | speaker button |
| Pause / mute | P or Esc / M | toolbar |

## Run it locally

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # tsc (strict) + vite build → dist/
npm test           # scripts/check-maze.ts
```

`npm test` checks the following:

- **Mazes:** each maze is symmetric and walled, with 4 corner pellets. Every dot, pellet, the item
  spot and the pen exit can be reached from the start, and there are no dead ends. Each tunnel
  wraps, and the hero really runs through it in the simulation.
- **Labels:** every quick question choice for every grade (all bank questions plus 1500 generated
  math questions per grade) can be drawn by the bitmap font and fits beside every pellet at that
  grade's label size.
- **Critters:** long headless runs show the critters never get stuck, never enter walls and all
  leave the pen.
- **Difficulty:** the critters are slower than the hero at every grade and level.
- **Question cycle:** A–D can each be locked in. A right answer makes the critters dizzy and a
  wrong one reveals the answer, then a fresh question follows. Walking onto a pellet answers it.

`scripts/playtest.cjs` is an automated Playwright playtest. It needs a running preview on port 4406
and runs grades K, 3, 7 and 11, each with keyboard at 1280×800 and touch on an iPad at 1080×810,
plus a run with the grade picker and layout checks at iPad portrait and phone sizes. Add `?debug`
to the URL to expose the engine as `window.__mm`.

## Code map

| File | What it holds |
|---|---|
| `src/MazeMuncher.tsx` | React shell: toolbar, HUD, question banner, title, transmission, mission report, input |
| `src/maze/engine.ts` | Canvas loop and drawing, sounds, demo mode |
| `src/maze/sim.ts` | Game rules without the DOM: movement, critter AI, question cycle, scoring |
| `src/maze/maze.ts`, `layouts.ts` | Maze parsing and pathfinding; the five original layouts |
| `src/maze/tuning.ts` | Difficulty by grade band and level |
| `src/maze/labels.ts`, `font.ts` | Screen geometry, pellet labels, bitmap font |
| `src/maze/sprites.ts` | Pixel art |
| `src/kit/` | Shared arcade kit (identical copy, do not edit here) |

## Standards to double-check

All question content and standard codes come from the shared kit. The codes the kit authors listed as
uncertain are in `src/kit/banks/*/NOTES.md`. This game adds no codes of its own.

## Deploying

This game lives in the arcade repository at `games/maze-muncher/` and is published at
`/maze-muncher/` by the arcade's deploy. `vite.config.ts` uses `base: "./"`, so the built `dist/`
works from that subfolder.

## Credits

Created by SpiderBen10 (NZDO). Built with the SpiderBen10's Arcade kit.
