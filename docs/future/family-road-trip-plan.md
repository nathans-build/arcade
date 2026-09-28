# Family Road Trip: design plan

A co-op belt-scroller for SpiderBen10's Arcade (`games/family-road-trip/`, served at `/family-road-trip/`).
It borrows the *feel* of early-90s 4-player family arcade brawlers: wide stages, lanes you walk up and down in,
friends joining in. Everything else is original: the family, the stops, the enemies and the art. Nobody fights
people. The family **zaps** mischief back to harmless (a robot powers down and waves, a gremlin pops into
confetti, a storm sprite turns into a little rainbow). Each stop ends in a **boss beaten by answering questions
as a team**. Credit line: "created by SpiderBen10 (NZDO)".

Grounding facts from the repo that the plan depends on:
- No existing game has 2 players, so the co-op input and the per-player grades are new ground.
- `kit/banks/social/` is **empty** in the canonical kit. `QuestionDeck` quietly falls back to *math* when a
  written pool is empty, so a social studies stop needs its own fallback (see Risks).
- `QuestionDeck(grade, …)` is tied to one grade, and `recordAnswer`/`loadProgress` key on `gameId`. That makes
  one deck per player (each with its own grade) easy.
- `build-site.sh` builds and tests every `games/*/` automatically. Hooking into the menu takes one `site/games.js`
  entry and a screenshot.

---

## 1. Core loop and feel (320×200)

| Element | Design |
|---|---|
| Playfield | A side view with a **walkable strip about 56 px deep** (y 128–184). Each character has x, a depth y (lane) and a height z for jumps. Sprites are drawn in depth order, and the shadow stays on the ground during jumps. Scrolling runs rightward only. |
| Pacing | Each stop is about 4–5 screens wide (≈1400 px). Scrolling **locks at 4 "traffic jams"** (enemy waves), and a flashing "GO ▶" appears when a wave is cleared. There is one **toll-booth gate** halfway (a quick question, §4), then the boss arena. |
| Actions | **Move** in 8 directions. **Jump** (a short arc that hops puddles and rolling hazards and dodges low throws). **Zap** is a short-range gadget burst with a 0.3 s cooldown. Most enemies take 1–3 zaps. There's no combo string; holding Zap charges a **Super Zap** (1 s) that clears a small area. |
| Getting hit | The player gets "dizzy" (stars circle their head) and loses 1 of 3 **snack hearts**, followed by 1.5 s of blinking with no further hits. At 0 hearts they **go back to the van** (no death). They rejoin after the team's next correct answer or at the next gate. Game over only comes when every player is in the van at once. |
| Pickups | Found in crates and coolers or dropped by zapped enemies: 🍎 snack (+1 heart), ⛽ fuel can (score), 📮 **postcard** (a collectible fact card, §4), ⭐ power-up (5 s: double reach, a speed boost or a bubble shield). |
| Stage length | About **3–4 min** per stop (≈2.5 min of walking and waves, ≈1 min boss). **v1 has 4 stops, about 15 min per trip**, which suits one sitting for a kid. |
| Why replay | 1–3 **star ratings** per stop (all waves cleared / gate answered right / boss beaten without the van). A **postcard album** to fill. Four characters that play differently. Wave makeup is randomised from each stop's enemy pool. High score per grade. Try it with a sibling. |

## 2. The family (placeholders: **Nathan designs and names them**)

The title screen and README should both say that names and looks are Nathan's to change. The sprites live in one
file of character grids, so he can redraw them. Every member has a natural skin tone (no yellow cartoon skin) and
a signature color from the palette so kids can tell them apart. A small **1P/2P/3P/4P arrow** in the player's color
floats above each head.

| Placeholder | Look (1 sentence) | Ability | Gadget |
|---|---|---|---|
| **Dad "Hank"** | Tall, with a red flannel shirt, a big beard and a travel mug on his belt. | **Shield**: hold Jump on the ground to raise a picnic-cooler lid that blocks throws. Slowest walker. | Zap knocks enemies back far. |
| **Mom "Rosa"** | Blue road-trip jacket, curly hair in a scarf, sunglasses up on her head. | **Reach**: her zap wand has the longest range (48 px vs 28). | Super Zap hits the whole lane. |
| **Big sis "Juno"** | Yellow hoodie, headphones, roller skates. | **Speed**: fastest mover. Double-tap a direction to dash through enemies. | Dash-zap. |
| **Little bro "Pip"** | Small, with a cyan cap and a backpack bigger than he is. | **Jump**: double jump and a stomp-zap on landing. Small hitbox. | Hops over hazards. |

**Cameo:** the arcade's hero (the `HERO` sprite from `site/app.js`: red helmet, cyan visor, blue suit, yellow
diamond) turns up on a billboard in stop 2 and waves from the ballpark stands in v2. He could become an
unlockable 5th player later.

## 3. Road-trip stops (NC geography, fictional names)

The route runs west to east across NC. The places are real regions, but every business, character and sign is
invented.

| # | Stop | Subject (deck) | Mischief-makers | Boss |
|---|---|---|---|---|
| 1 | **Blue Ridge Overlook**: mountains, fog, a winding road | Science | *Drizzlets* (rain sprites that float and drip), *Gust Puffs* (push players across lanes) | **Thunder Cloud "Grumblenimbus"**: drops rain lanes to dodge |
| 2 | **Piedmont City Market**: food trucks, a downtown skyline | Math | *Bolt-Bots* (runaway vending robots rolling in lanes), *Coin Beetles* | **Cash-Register Robo** throws price tags |
| 3 | **Tall Pines Library**: bookshelves, a reading nook | ELA | *Page Gremlins* (steal bookmarks and flutter), *Ink Blobs* (slow puddles) | **The Bookworm Blimp** fires letter tiles |
| 4 | **Outer Banks Lighthouse**: dunes, boardwalk, a ferry | Social studies (fallback §8) | *Snickerlings* (sunglasses-wearing gremlins that steal snacks), *Gull Gang* (dive-bombing pranksters) | **Captain Kite-Tangle**, a giant runaway kite |
| v2 | Science museum, ballpark, Smoky Mountains campground, a state-capitol civics stop | Science / Math / Social | | |

**How grade changes a stop.** Enemy speed, count and HP scale by band. Questions always come from the
player's own grade.

| Band | Waves | Enemies on screen | Enemy HP | Boss HP segments | Boss throws |
|---|---|---|---|---|---|
| K–2 | 3 | ≤ 3, slow, big tells | 1 | 6 | slow, 1 at a time |
| 3–5 | 4 | ≤ 4 | 1–2 | 8 | 2 at a time |
| 6–8 | 4 | ≤ 5 | 2 | 8 | faster, aimed |
| 9–12 | 4 | ≤ 6 | 2–3 | 10 | fastest, mixed patterns |

2 players add +1 enemy per wave (and +2 boss segments). 3–4 players add +1 more each.

**Boss loop (the "Pit Stop" quiz):**
1. **Action phase (about 10 s):** the boss moves and throws silly things. Zapping it fills a **DIZZY meter**.
2. **Pit Stop (the action freezes):** a question card slides in. **Players take turns**, each getting a question
   at their own grade. A 1P/2P badge on the card and a speech line ("Rosa's turn!") show whose it is.
   Right = the boss loses 2 segments, plus a "Family Combo" flash. Wrong = the explanation shows and read-aloud
   plays it for K–2, the boss loses only 1 segment from zap damage, and the deck already re-weights that standard.
   There are **no timers** on questions.
3. Repeat until the boss is down to 2 segments. Then comes the **Team Finale**: *every* player answers one
   question (one after another, each at their own grade). If all are right, the boss pops in a confetti finisher.
   If anyone misses, it's back to one short action phase and the finale runs again with new questions.
4. **Revive:** a correct answer at any Pit Stop brings back a teammate who is waiting in the van.

Taking turns works better than buzz-in here. Buzz-in favors the older or faster sibling and makes key conflicts
likely. Turns also let everyone answer with the same 1–4/A–D/tap keys.

## 4. Learning design

| Where | What | Deck call |
|---|---|---|
| **Toll-booth gate** (1 per stop) | The road is blocked by a gate robot, with 4 lettered lanes A–D. Each player gets one **quick** question (the booth takes turns in 2P). Right = the gate opens with a ⭐ power-up. Wrong = the explanation shows, then the gate opens anyway with a snack only. Progress is never blocked. | `QuestionDeck(grade, stopSubjects, { quickOnly: true, gameId })` |
| **Boss Pit Stops** | 4–6 full questions per boss, as above. Passages are allowed (the card grows to fill the screen). | same deck, not quickOnly |
| **Between stops: "Postcard"** | The standard checkpoint "transmission": one mixed-subject question per player, with its explanation. Right = +1 heart and a star. | `["math","science","ela", …social if non-empty]` |
| **Postcards** (pickups) | A one-line fact about the stop's place, e.g. "The Blue Ridge is part of the Appalachian Mountains." Postcards are **not questions**. They are hand-written, checked data in `stops/*.ts` and tested for length. They seed social-studies flavor while the bank is empty. | none |

- **Wrong answers teach.** The explanation always shows, and the card keeps the right choice highlighted until the
  player presses Next. In the report, missed standards appear under "Practice next".
- **K–2:** read-aloud is on by default. The game uses `speakQuestion` on every card and `speak` for stop intros and
  "Pip's turn!". It adds a speaker button / **R** to repeat, 2× card text, and slow bosses.
- **Fair for two kids of different grades: yes, each player has their own grade.** P1 uses the arcade's `?grade=`
  (a badge plus "CHANGE GRADE IN THE ARCADE"). When P2 joins, a small grade picker appears on the join card,
  defaulting to P1's grade and remembered under `arcade.family-road-trip.p2grade`. Each seat owns a
  `QuestionDeck` with a **separate gameId** (`family-road-trip` / `family-road-trip-p2`), so one kid's misses don't
  steer the other's questions and each gets their own report column.
- **Streaks and co-op:** each player's answer streak raises their score multiplier up to ×5. **Team streak**: when
  every player gets their Pit Stop right in a row, the next Zap does double damage. Scores are shared as a family
  score, with each player's answers still counted separately.
- The **Mission report** shows one column per player (grade, standard code + skill, right/seen) and "practice
  next" for each.

## 5. Two-player controls

Rule from the brief: **A–D and 1–4 are never movement keys.** Answers are always **1–4 / A–D / tap**, and only one
player answers at a time (the card shows whose turn it is), so the answer keys are never contested.

| Action | Solo (keyboard) | P1 in 2P (right side) | P2 in 2P (left side) |
|---|---|---|---|
| Move | Arrows (or I J K L) | Arrows | **T F G H** (T up, F left, G down, H right) |
| Zap / hold for Super | Space or Z | **.** (period) | **Z** |
| Jump / Shield | X | **/** (slash) | **X** |
| Join / continue | Enter | Enter | **Q** ("Press Q to join") |
| Answer (on your turn) | 1–4 / A–D | 1–4 / A–D | 1–4 / A–D |
| Pause, mute, read again | P/Esc, M, R | shared | shared |

- A test asserts that no key sits in two maps and that none of 1–4/A–D/R/P/M is used for movement or action.
  Game logic reads a `PlayerIntent` ({dx, dy, zap, jump}) per seat, never raw keys. Browsers can drop keys when
  many are held at once (keyboard ghosting), so v1 keeps the key sets on different rows and v2 adds **Gamepad API**
  support.
- **Touch (iPad landscape, coarse pointer):** each player's controls sit in their own screen corner, tracked by
  `pointerId` so two players (and two thumbs each) touch at the same time without interfering.
  - P1 is bottom-right and P2 bottom-left. Each gets a **floating thumb-stick** plus **ZAP** and **JUMP** buttons
    (large, 64 px CSS).
  - A "tap 2P to join" chip appears on the left.
  - An **auto-zap** option (on by default for K–2) zaps when an enemy is in reach, so a small kid only steers.
  - Answer cards use four big A–D buttons centered on the screen, which the active player taps. Portrait and phone
    screens support 1P only (the brief's small-screen overlay).

## 6. Art and sound

- **Palette:** the SpiderBen10 set (red #e3262f, blue #2456e8 / #6ea0ff, yellow #ffd23f, navy #0a0f2e, cyan
  #7ff3ff, black #05060f), plus a few skin, earth and foliage tones per stop (≤ 16 colors per stop). Player colors:
  1P red, 2P blue, 3P yellow, 4P cyan. Skies are night or dusk gradients like the marquee, with 2 parallax layers
  and one tiled ground strip per stop. CRT scanlines, fonts and the bitmap font follow the brief (copy
  `route-runner/src/route/font.ts`).
- **Sprite budget (character grids in code):**

| Set | Size | Frames |
|---|---|---|
| 4 family members | 16×24 | idle 2, walk 4, jump 1, zap 2, dizzy 2, cheer 1 = **12 each** (48) |
| Enemies (2 per stop × 4) | 16×16 | move 2–3, zapped/poof 2 = **~5 each** (40) |
| Bosses (4) | 48×40 | idle 2, attack 2, dizzy 2, pop 1 = **7 each** (28) |
| Projectiles, pickups, FX | 8×8 | ~20 single frames (price tag, raindrop, letter tile, confetti, stars, shadow) |
| Van (title, intermissions) | 64×32 | 2 wheel frames |

  About 140 frames in total. Poses are **mirrored at draw time** for left/right. Palette swaps are allowed for
  enemy variants.
- **Sound:** kit `ChipAudio` for effects (zap "pew", poof, pickup, right/wrong chimes, boss hit) and an original
  16-step "road trip" bassline with a quicker loop for boss fights. A horn honk plays on "GO ▶".

## 7. Architecture

```
games/family-road-trip/
  index.html, package.json ("test": "tsx scripts/check-trip.ts"), vite.config.ts, tsconfig.json, README.md, docs/screenshot.png
  src/main.tsx
  src/FamilyRoadTrip.tsx      screens: title/join, grade badge+P2 picker, HUD, question cards, postcard, report, toolbar, touch overlay
  src/kit/                    verbatim copy of /home/user/arcade/kit (never edited)
  src/trip/engine.ts          fixed-step loop (dt clamped 0..0.05), camera/scroll-lock, depth-sorted draw, ?debug hook
  src/trip/world.ts           belt math: lanes, x/y/z, hitboxes, reach, collision (pure, tested)
  src/trip/family.ts          character stats & abilities (data + update)
  src/trip/enemies.ts         enemy behaviours (walker, floater, diver, puddle) — small state machines
  src/trip/boss.ts            boss action patterns + DIZZY meter
  src/trip/quiz.ts            seats, per-seat QuestionDeck, turn order, Pit Stop / Finale / gate / revive state machine (pure)
  src/trip/stops/*.ts         one file per stop: subject list, palette, backdrop, waves, enemy pool, boss, postcards
  src/trip/scaling.ts         grade band → counts/speeds/HP; player-count modifiers
  src/trip/input/keyboard.ts  key maps per seat → PlayerIntent
  src/trip/input/touch.ts     pointerId → seat zone → stick/buttons → PlayerIntent
  src/trip/sprites.ts, font.ts, music.ts
  scripts/check-trip.ts, scripts/playtest.cjs
```

**Tests (`npm test`) must verify:**
1. **Key maps:** no key in two seats. A–D/1–4/R/P/M are never movement or action keys. Solo accepts P1's keys too.
2. **Quiz state machine:** turns alternate across seats. The finale needs all seats right. A wrong answer never
   blocks progress (gates open anyway). Revive works. Each seat draws from its **own grade**, checked for every
   grade K–12 × 1–2 seats.
3. **Stop data:** every stop at every grade gets a non-math question when its subject isn't math. The social
   fallback works while `banks/social` is empty. Waves are non-empty, and boss HP matches the scaling table.
   Postcards are ≤ 60 characters, fit the bitmap font and have no duplicates.
4. **Sprites:** grids are rectangular, every character is in that sprite's palette, and frame counts are complete.
5. **World math:** reach and depth-overlap rules (can't zap someone in a far lane) and scroll-lock release.
6. **Playwright:** 1280×800 keyboard 1P and **2P with both key sets held together**. iPad 1080×810 with **two
   simultaneous touch pointers** moving both players. Grades K/3/7/11 via `?grade=` (badge shown) and once with no
   grade (picker shown). A gate and a Pit Stop answered by key and by tap. The report appears. No `pageerror`,
   no scroll.

**Menu hookup:** add `games.js` entry `{ id: "family-road-trip", title: "Family Road Trip", tagline: "Pile into the
van, zap the mischief across North Carolina, and beat each stop's boss by answering together.", subjects:
["Math","Science","ELA","Social Studies"], url: "/family-road-trip/", image: "img/family-road-trip.png", year: 2026 }`.
The chip renderer prints any string, so "Social Studies" works. `build-site.sh` picks up the folder automatically.

## 8. Scope

**v1 (one engineer-agent, one session):** 1–2 players (keyboard + iPad touch), all 4 family members selectable,
**4 stops** (Blue Ridge, Piedmont City, Library, Outer Banks) with 2 enemy types and 1 boss each, one gate per stop,
Pit Stops + Team Finale + revive, per-player grades and decks, postcards, mission report per player, all the brief's
must-haves, tests and playtest above. Sizes follow Route Runner's (~700-line TSX + ~1100-line engine), split across
the modules listed in §7.

**v2:** 3–4 players (gamepads, key-map settings screen), stops 5–6 (science museum, ballpark) plus a capitol civics
stop, the hero as an unlockable 5th player, a postcard album screen, a family pet sidekick, remappable keys,
per-stop star map on the title van route, and a "boss rush" mode.

**Risks and open questions for the parent:**
1. **Social studies bank is empty** in `kit/banks/social/`. Until it lands, stop 4 should draw `["social","science"]`
   only when `bankFor("social", grade)` is non-empty, and otherwise use `["science","ela"]`. Postcards carry the
   geography flavor. Should the game wait for the bank, or ship with this fallback? (It's not a kit change; the
   game checks `bankFor` itself.)
2. **P2 progress keying:** separate gameIds keep siblings' stats apart but split high scores. Is that acceptable?
   Alternative: one gameId with seat-suffixed standards (would need a kit change, so avoid).
3. **Keyboard ghosting** on some laptops when 2 kids hold 5+ keys. Confirm T/F/G/H + Z/X vs arrows + ./ on
   Nathan's actual keyboard, or ship gamepad in v1.
4. **iPad crowding:** 4 thumbs on one landscape iPad is tight. Auto-zap for K–2 helps. Is 2P touch in landscape
   only acceptable?
5. **Menu grade vs P2 grade:** the menu sends one grade. Is an in-game P2 picker OK, or should the menu later send
   `?grade2=`?
6. **Names and looks** are placeholders until Nathan names and draws the family. Is a "rename family" screen
   wanted in v1?
7. **Originality check:** keep a README note that the family, stops and enemies are original, with no resemblance
   to any TV family (no yellow skin, no borrowed names, catchphrases or settings), and that NC places appear only
   as regions with invented businesses.
