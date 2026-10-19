# Robo Masters

A run-and-jump robot adventure for **SpiderBen10's Arcade** (K–12, North Carolina Standard Course of Study).
Eight **Robo Masters** got glitched. Pick any of them on the **stage select**, run and jump through its stage as
**RIVET** (a pocket-sized repair robot with a reboot beam), and then **reboot** the robot with right answers.
Glitched mini-bots short-circuit into sparks and bolts; nobody gets hurt. Each rebooted Robo Master shares its
**power**, which works in every other stage. Reboot all eight to open the **Static Citadel** and its final boss,
**Lord Static**, who mixes every subject.

Inspired by the *mechanics* of 1980s robot-boss stage-select platformers. All names, characters and art are
original pixel art drawn in code; no external requests.

## The Robo Masters (`src/robo/robots.ts`)

| Robo Master | MIXED subject (topic) | Stage | Power earned | Weak spot |
|---|---|---|---|---|
| SPLITZ (pie robot) | Math (fractions, grades 3–7; K–1 and 8–12 geometry, grade 2 numbers) | Pie Factory | Fraction Splitter (3-way beam) | Polarity Pulse |
| IGNEOUS REX (volcano dino) | Science (Earth: rocks, volcanoes, Earth's surface) | Magma Mines | Magma Hop (super jump) | Cloud Step |
| SYNTAXOR (book + comma) | ELA (grammar & words) | Punctuation Press | Comma Shield (shield) | Compass Dash |
| MERIDIAN (globe head) | Social studies (geography: maps, places) | Compass Cliffs | Compass Dash (dash) | Magma Hop |
| CUMULO-TRON (storm cloud) | Science (Earth: weather, water cycle) | Thunderhead Tower | Cloud Step (air jump) | Time Brake |
| POLARIX (magnet arms) | Math (numbers & operations: number lines, integers; HS algebra) | Number Line Neon | Polarity Pulse (clears the screen) | Comma Shield |
| CHLORO-PHIL (flowerpot) | Science (life: plants) | Greenhouse Grove | Leaf Glide (glide) | Fraction Splitter |
| CLOCKWORK CLIO (clock head) | Social studies (history) | Gearworks Museum | Time Brake (slows the world) | Leaf Glide |
| LORD STATIC (TV head, final boss) | Every robot's subject in turn | Static Citadel | — | any power |

Every boss has its own look, movement pattern (bounce, hop, hover, dash, zigzag, arcing orbs, sprouting vines,
pendulum, teleport) and punny intro / block / hit / reboot lines.

## How a stage plays

- A long side-scrolling run (about twice the original length: boss door at roughly 3,900–4,500 px, the Static
  Citadel about 5,300 px) in **two halves of three sections**: gaps, moving platforms, lifts, stepping blocks over
  hazards, a timed hazard per theme (pie cutters, magma geysers, ink stampers, boulders, lightning, zap gates,
  snapping vines, gear crushers) and glitched mini-bots (walkers, hoppers, flyers, zap turrets). Seven or eight
  checkpoints: one per section, a **REST stop** halfway (checkpoint + two big energy cells), and one just past
  each Quiz Bot barrier.
- **Quiz Bots** (`src/robo/levels.ts` "quiz" segments, `src/robo/sim.ts`): three per stage, all in the second half
  and before the boss door. A Quiz Bot is a gold-framed hover bot holding a purple **?** screen, plugged into a
  fizzing static **barrier** that no jump or power gets past. It never bumps you. One beam hit opens a question
  from the stage's robot (same source, focus and topic rules as the boss; 1–4 / A–D / tap). Right: +10 energy
  (K–2 +12), +8 power meter and often a power-up (always for the first right answer in a stage that has not given
  one; then 60%, K–2 75%). Wrong: the explanation, +3 energy, a 10% (K–2 15%) power-up chance, and the barrier still
  goes away: wrong answers never cost lives or energy. Quiz Bot answers count in the Citadel report and on the
  "rebooted" screen ("Quiz Bots 2/3 right").
- **Power-ups** (`src/robo/boosts.ts`; separate from the eight earned powers), shown as chips with a countdown
  bar over the bottom of the screen and icons by the meters; grabbing one you already have restarts its timer
  (no stacking); different ones can run together; they end when Rivet respawns:

  | Power-up | Effect | Time |
  |---|---|---|
  | Phase Cloak | see-through: mini-bots, robots and their zaps pass through you (pits and spikes still count) | 8 s |
  | Spring Boots | jump about 97 px instead of 50 (reaches the high "sky ledges") | 10 s |
  | Shield Bubble | blocks the next bump or zap, then pops | 20 s |
  | Turbo Treads | run 1.6x faster | 10 s |
  | Rapid Beam | beam every 4 frames instead of 8, up to 5 on screen | 10 s |
  | Bolt Magnet | pulls bolts, energy and capsules within 110 px | 12 s |

  They come from Quiz Bots, from a hidden **?** capsule on a high shelf in every stage, and now and then (5%)
  from a mini-bot. None of them touches the boss: it is still only rebooted by right answers.
- **Energy**: red-and-white capsules (+6) from mini-bots, big yellow energy cells (+10) at the REST stop and on
  the sky ledge, and Quiz Bot rewards.
- **Power spot**: a glowing cage holding a 1-up. It opens only to one power (the one the stage's boss is weak to).
- **Boss fight**: beam the Robo Master to light up its **reboot panel** (3 hits, K–2: 2; it also opens by itself
  after 10 s, K–2: 6 s). A right answer is a big reboot hit; a wrong answer is only **blocked** and shows the
  explanation. Wrong answers never cost HP, energy or lives. Using the robot's **weak-spot power** during the
  fight makes the next right answer a double reboot. Boss HP: K–2 3, 3–5 4, 6–12 5 (Lord Static +3).
- Lives are only lost to hazards (pits, zaps, bumps). K–2 gets 5 lives, softer bumps, narrower gaps, fewer
  mini-bots, slower hazards, and pits that cost energy instead of a life. Out of lives: try again from stage select;
  rebooted robots and powers stay saved.
- Save (password-free, this device): `arcade.robo-masters.save.v1`; subject/topic: `arcade.robo-masters.subject`
  and `.topic`.

## Questions and topics

Math is generated by the kit (`mathQuestion`, adaptive level when on); science, ELA and social studies come
from the kit banks (`bankFor`), sorted into the arcade's topic ids by NC code (`src/robo/focus.ts`, adapted from
Dojo Tower). A small extra bank (`src/robo/extras.ts`, 75 items) fills thin spots for the volcano, weather,
plant and map robots. Each robot prefers on-theme items (a keyword "flavour") when there are at least 6.

The title has **MATH · SCIENCE · ELA · SOCIAL STUDIES · MIXED** (default MIXED: each robot asks its own
subject). Picking one subject retunes all eight robots to that subject (each robot takes its own topic of it,
e.g. MATH: Splitz fractions, Igneous geometry, Polarix numbers…); picking a topic makes all eight ask that topic.
`?topic=<id>` and `?subject=<id>` deep-link like the other arcade games (ignored with a note if the grade
lacks the topic). Read-aloud is on by default for K–2.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → | ◀ ▶ |
| Jump | ↑ or Space | JUMP |
| Reboot beam (hold to keep firing) | Z | BEAM |
| Use power / switch power | X / C | POWER / SWAP |
| Answer | 1–4 or A–D | tap an answer |
| Continue after an answer | Enter or Space | the yellow button |
| Pause / mute / read aloud | Esc or P / M / R | toolbar buttons |

A–D are only ever answer keys, never movement.

## Develop

```sh
npm ci
npm test        # tsx scripts/check-rules.ts (about 95 s: roster, questions for every robot x grade x mode,
                # boss rules, a headless bot clearing all 9 longer stages in all 4 grade bands and answering
                # every Quiz Bot, powers, stage length/checkpoints/Quiz Bot placement, Quiz Bot rewards,
                # every power-up's effect and timer, save, topics) + scripts/check-music.ts
npm run build   # tsc --noEmit && vite build
node scripts/playtest.cjs   # Chromium playtest; see the comment at its top for serving (port 8843, or BASE=...;
                            # ONLY="quiz bots" runs one scenario)
```

`src/kit/` is an identical copy of the arcade's `kit/`. `?debug` exposes `window.__rm` (warp to the boss,
open the reboot panel, `giveBoost(id)`) for the playtest.

Music (`src/music.ts`): stage themes, the boss and Citadel songs, and jingles, including **Quiz Bot Rebooted**
(a right Quiz Bot answer) and **Power-Up!** (any power-up).
