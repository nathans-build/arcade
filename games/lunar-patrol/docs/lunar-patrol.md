# Lunar Patrol Academy: design notes

An arcade side-scroller in the style of *Moon Patrol* (Irem, 1982) where knowing K–12 math, science and ELA
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

## Questions: K–12, NC standards

Questions come from the shared **arcade kit** in `src/kit/`, the same one every game in SpiderBen10's
Arcade uses (canonical copy: `nathans-build/arcade`, folder `kit/`).

- **Grade:** picked on the title screen (Kindergarten–12), or passed in from the arcade menu as
  `?grade=4`. It's remembered in the browser.
- **Math:** generated fresh every time, 10–14 question types per grade, tagged with NC Standard Course
  of Study for Mathematics codes (`NC.K.CC.5` … `NC.8.G.9`; high school as NC Math 1–4:
  `NC.M1.…` to `NC.M4.…`).
- **Science:** 18 written questions per grade from the 2023 NC Science standards (`PS.5.1`,
  `LS.Bio.3` …). High school: 9 Earth & Environmental, 10 Biology, 11 Chemistry, 12 Physics.
- **ELA:** 18 written questions per grade from the 2017 NC ELA standards (`RF.K.3`, `RL.4.2`,
  `RL.9-10.4` …). High school: English I–IV.
- **Checkpoints** can use any question, including reading passages. **Quiz Squadron waves** only use
  "quick" questions that fit on the banner.
- **K–2:** read-aloud is on by default (browser speech), and the run is gentler: wider gaps between
  hazards, slower fuel burn, UFOs arrive later.

Some standard codes couldn't be confirmed against the official NC documents from the build environment.
Each bank's `NOTES.md` in `src/kit/banks/` lists the codes to check against WCPSS pacing guides.

Wake County (WCPSS) teaches the state NC Standard Course of Study, so these are the standards its
classrooms use. To add or fix questions, edit the kit in `nathans-build/arcade` and copy it into each game.

## Code map

| File | Role |
|---|---|
| `src/LunarPatrol.tsx` | React shell: title screen, HUD, checkpoint dialog, wave banner, mission report, touch controls |
| `src/lunar/engine.ts` | Game loop, physics, spawning, collisions, waves, checkpoints, rendering |
| `src/lunar/sprites.ts` | Pixel-art sprite grids and palette |
| `src/lunar/audio.ts` | WebAudio chip sounds and music |
| `src/lunar/questions/index.ts` | Connects the game to the kit's decks and saved progress |
| `src/kit/` | Shared arcade kit: K–12 questions, grades, read-aloud, chip audio |
| `public/staticwebapp.config.json`, `infra/`, `.github/workflows/azure-static-web-apps.yml` | Azure hosting (see the README) |
