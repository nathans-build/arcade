# Lunar Patrol Academy: design notes

An arcade side-scroller in the style of *Moon Patrol* (Irem, 1982) where knowing grade 6 math, science and ELA
keeps your rover moving.

## Core loop

| Arcade mechanic | Learning twist |
|---|---|
| Drive right across the Moon, jump craters, shoot boulders and UFOs | Same as the original. This part carries the fun and the pacing. |
| Checkpoints A → Z | Each checkpoint is an **Incoming Transmission** from Moon Base. The game pauses for one question (reading passages allowed), and the explanation is shown after every answer. |
| Fuel (new) | The rover burns fuel as it drives. A right answer at a checkpoint refuels +55; a wrong one still gives a +25 ration. Running dry ends the run, so learning is what keeps you playing. |
| UFO attack waves | Mid-sector a **Quiz Squadron** arrives: four green UFOs labelled A–D, with the question in a banner. Shoot the UFO carrying the right answer (+fuel, bonus). Shoot the wrong one and the right one flashes. The rover is slowed during the wave so there's time to read. |
| Score multiplier | Consecutive right answers build a **streak** (×2 to ×5 on answer bonuses). |
| Mission report | On game over, results are grouped by subject and by NC standard, with a "practice next" list. |

Why the questions come in two forms: checkpoint transmissions pause the game, so they can hold longer items and reading
passages without the player being rushed. The Quiz Squadron keeps questions *inside* the action, but only for short items
(flagged `quick`) that can be read at arcade speed.

**Adaptive practice:** the deck weights standards the player has missed (and ones they haven't seen) more heavily. Accuracy per
standard is saved in the browser (`localStorage`), so this carries over between sessions on the same device.

Difficulty goes up with each sector: obstacles come closer together, craters get wider, big boulders (2 hits) appear from
sector C, and enemy UFOs drop bombs that blast new craters in the road ahead, as they do in the original.

## Controls

| Keyboard | Touch (phones/tablets) | Action |
|---|---|---|
| ← / → (or A / D) | ◀ ▶ | Slow down / speed up (the rover shifts on screen like the arcade) |
| ↑ / Space / W | JUMP | Jump |
| Z / X / F | FIRE | Fires forward **and** straight up at the same time |
| 1–4 or A–D, Enter | tap | Answer / continue at checkpoints |
| 1–4 or A–D | tap an answer in the banner | Quiz Squadron: fire a homing answer missile at that UFO (one pick per wave) |
| P / Esc, M | toolbar | Pause, mute |

## Graphics & sound direction

- **Logical resolution 320×200**, drawn on a `<canvas>` and scaled up with nearest-neighbour (`image-rendering: pixelated`)
  plus a CRT scanline overlay, so every sprite shows chunky pixels at any screen size.
- **Arcade palette**: black sky with twinkling stars and a pixel Earth, blue mountain range (far layer, slowest parallax),
  green hills with lit moon-base domes (middle layer), tan/brown speckled road (front layer). There are three parallax
  layers, as in *Moon Patrol*.
- **Sprites are defined in code** as character grids (`src/lunar/sprites.ts`), so there are no image files to manage: the
  six-wheel buggy with bouncing wheels (a random paint job each run, never the same twice in a row), red enemy UFOs, green answer UFOs, and shaded boulders.
- **Type**: *Press Start 2P* for HUD and headings (arcade marquee) and *VT323* for question text, which keeps the retro
  terminal look but is still easy to read for passages.
- **Sound**: all synthesized with WebAudio (`src/lunar/audio.ts`): square-wave shots, noise explosions, a rising "correct"
  arpeggio, a buzz for wrong answers, and an original looping bassline. `M` mutes and the setting is remembered.

## Question bank

`src/lunar/questions/` has **116 items across 51 standards**: math 45, science 41, ELA 30. 85 of them are short enough
for UFO waves.

- **Math**: NC Standard Course of Study for Mathematics (2017), grade 6: `NC.6.RP.1–4`, `NC.6.NS.1–8`, `NC.6.EE.1–9`,
  `NC.6.G.1–4`, `NC.6.SP.1–5`.
- **ELA**: NC ELA Standard Course of Study (2017), grade 6: `RL.6.x`, `RI.6.x`, `L.6.1/2/4/5`, `W.6.1`.
- **Science**: NC Science Standard Course of Study (adopted 2023): `PS.6.1` (matter and phase change), `PS.6.2` (thermal
  energy transfer), `ESS.6.1` (Earth–Moon–Sun), `ESS.6.2` (Earth's structure, plate tectonics, rocks), `ESS.6.3`
  (lithosphere and humans), `LS.6.1` (plants), `LS.6.2` (ecosystems and biomes).
  **Check these codes against the current WCPSS grade 6 science pacing guide.** The 2023 objective numbering couldn't
  be fully confirmed from public sources, so `PS.6.2` in particular may need to be relabelled.

Wake County (WCPSS) teaches the state NC Standard Course of Study, so these are the standards its classrooms use.

### Adding questions

Add an object to `math6.ts`, `science6.ts` or `ela6.ts`:

```ts
{
  id: "m-rp-9",                 // unique
  subject: "math",
  standard: "NC.6.RP.3",
  skill: "Rate & ratio problems", // groups results in the mission report
  prompt: "…",
  choices: ["correct", "wrong", "wrong", "wrong"],
  answer: 0,                     // choices are shuffled at runtime, so 0 is fine
  explanation: "Shown after every answer. Teach, don't just grade.",
  quick: true,                   // optional: short enough for a UFO wave
  passage: "…",                  // optional: checkpoint-only reading passage
}
```

Adding grade 7 or 8 later means adding new bank files and a grade picker on the title screen.

## Code map

| File | Role |
|---|---|
| `src/LunarPatrol.tsx` | React shell: title screen, HUD, checkpoint dialog, wave banner, mission report, touch controls |
| `src/lunar/engine.ts` | Game loop, physics, spawning, collisions, waves, checkpoints, rendering |
| `src/lunar/sprites.ts` | Pixel-art sprite grids and palette |
| `src/lunar/audio.ts` | WebAudio chip sounds and music |
| `src/lunar/questions/*` | Question banks, adaptive deck, saved progress |
| `public/staticwebapp.config.json`, `infra/`, `.github/workflows/azure-static-web-apps.yml` | Azure hosting (see the README) |
