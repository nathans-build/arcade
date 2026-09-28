# Jungle Run

A jungle-explorer arcade game for **SpiderBen10's Arcade**, created by **SpiderBen10 (NZDO)**.
The SpiderBen10 hero, dressed as an explorer, runs through a chain of flip-screen jungle scenes before
the expedition clock runs out. The twist: **treasures are questions**, and the jungle itself quizzes you
on maps and timelines. Social studies comes first (NC Standard Course of Study, grades K–12), with
science, ELA and math too.

![Jungle Run](docs/screenshot.png)

## How it plays

- **Explore:** run left and right across flip-screen scenes. Jump **rolling logs**, swing on **vines**
  over tar pits, hop across the backs of **swamp snappers** (stay off their jaws when they open), and jump
  **coil snakes** and scuttling **sting-crabs**. A **ladder** down leads to an underground **tunnel shortcut**
  that skips two scenes (and their treasures).
- **Treasures are questions.** Old maps, brass compasses, coins, flags, ballot boxes and clay artifacts
  wait in the scenes. Touch one to open a question from the kit's `QuestionDeck`. A right answer keeps it
  (+250, +50 per leg, and **+10 seconds**). A wrong answer makes it crumble, and the explanation is shown.
- **Jungle crossroads (map challenge), scenes 4 and 8 of every leg:** a compass rose (north up, as on a map)
  and four exits: the **rope ladder up (north)**, the **trapdoor down (south)**, and the trails off the
  **left (west)** and **right (east)** edges. Each exit has a sign, and the letters A–D are dealt at random.
  The prompt says, for example, *Go EAST*, *You're in the Piedmont: take the path to the COASTAL PLAIN*, or
  *Which way is the Mississippi River from NC?* Walk to the exit (▲ at the ladder, ▼ on the trapdoor),
  press A–D / 1–4, tap the sign or tap the answer in the banner. A right choice gives +300 and +15 seconds.
- **Timeline gates, scene 6 of every leg:** four stone tablets with events block the way. Open them from
  earliest to latest: walk up and press ▲, press A–D / 1–4, or tap a tablet or its banner button. Each tablet
  shows its date as it opens. All four right gives +500 and +20 seconds. A wrong pick reveals the full order
  with dates, and the gate opens anyway (no bonus).
- **Base camp (the checkpoint), scene 10 of every leg:** a radio call from base camp asks a checkpoint question
  with its explanation (+400 and +30 seconds for a right answer). Then the next leg starts, with slightly faster logs and critters.
- **Lives and clock:** falling into a pit or swamp, or being bitten or stung, costs a life. Logs only knock you
  back (−2 seconds). The game ends when the clock runs out or the lives are gone, then a **mission report** lists
  results by NC standard (code and skill), with what to **practice next**.

## Subjects and grades

The title screen offers **Social Studies** (first), **Science**, **ELA**, **Math**, or **Mixed**
(social studies, science, ELA and math treasures in rotation; passed to the kit as an array, since the kit's
`"mixed"` means math/science/ELA only). Crossroads and timeline gates are always social studies.
Opened from the arcade with `?grade=`, the game shows the grade and a "CHANGE GRADE IN THE ARCADE" link.
Opened directly, it shows a K–12 picker.

| Band | Clock / lives | Hazards | Crossroads (map challenges) | Timeline gates |
|---|---|---|---|---|
| K–2 | 7:00, 5 lives | Gentle: sleepy snakes only nudge you back, no sting-crabs, crocs' jaws rarely open, slowest vines, and the explorer jumps farther. The vine lets go for you over the far side. **Read-aloud on by default**: every question, direction, tablet set and new hazard hint is read | Cardinal directions (N up, S down, E right, W left, sunrise/sunset, opposites), map symbols with pictures (water, mountain, home, forest, school), near and far. **K.G.1.1, 1.G.1, 2.G.1** | Sequences, first to last: a school day, growing up, travel long ago to today, seasons of a school year. **K.H.1, 1.H.1, 2.H.1** |
| 3–5 | 6:00, 4 lives | Logs, vines, swamps, snakes, one sting-crab | NC's three regions (Coastal Plain, Piedmont, Mountains), NC's neighbors and the Atlantic, landmarks (Mount Mitchell, Cape Hatteras, the Smokies, Raleigh), U.S. regions and states, Great Lakes. **3.G.1, 4.G.1, 4.G.1.2, 5.G.1.1** | NC history (Lost Colony 1587 to the Greensboro sit-ins 1960) and U.S. history (1492 to the Moon landing 1969). **3.H.1, 4.H.1, 5.H.1** |
| 6–8 | 5:30, 3 lives | Faster; more logs, 3 crocs, pairs of snakes, sting-crabs past the vine pits | Continents and oceans, latitude and longitude (toward the Equator, the Prime Meridian, 80°W→90°W…), parallels and meridians, the Nile. **6.G.1, 7.G.1, 8.G.1.1** | Grade 6 ancient and medieval world (776 BCE Olympics to 1453); grade 7 modern world (1492 to 1991); grade 8 NC and U.S. history (1587 to 1964). **6.H.1, 7.H.1.1, 8.H.1** |
| 9–12 | 5:00, 3 lives | Fastest | Movement in history: Columbus, the Silk Road, Napoleon, D-Day, Berlin, Korea, the Mayflower, Lewis and Clark, the Oregon Trail, the Trail of Tears, the Underground Railroad, the Great Migration, the Dust Bowl (**WH.G.1, AH.H.1**); branches, amendments and federalism (**CL.C&G.1, CL.C&G.2, CL.C&G.3**); supply and demand, the Fed, opportunity cost, inflation (**EPF.E.1, EPF.E.1.1**) | 9 World History (1215–1994) **WH.H.1**; 10 Civic Literacy: documents and rights (Magna Carta to the 26th Amendment) **CL.C&G.1**; 11 American History (1791–1965) **AH.H.1**; 12 economic history (1776–2008) **EPF.E.1** |

High school follows the kit's course mapping: 9 World History, 10 Civic Literacy, 11 American History,
12 Economics and Personal Finance. Treasure and checkpoint questions come from the kit's banks for the chosen
subject (`src/kit`, imported as `@/kit`); the social studies bank has 234 questions (18 per grade).

### Game data and tests

Map challenges (90) live in `src/jungle/data/maps.ts` and timeline sets (13 sets, 112 events) in
`src/jungle/data/timelines.ts`. `npm test` (`scripts/check-data.ts`) checks:
- **Compass:** every exit lies on its own side of the compass rose (N above, S below, E right, W left), signs sit
  by their exits without overlapping, and random A–D deals are permutations that resolve to the right exit.
- **Geography facts:** every answer matches a separate truth table in the test. For the 50 "from here to there"
  questions, the test also computes the real compass bearing from coordinates (e.g. Raleigh → Mount Mitchell,
  Greensboro → Roanoke, Paris → Moscow) and requires it to be within 35° of the answer's direction.
- **Timelines:** every event has an exact integer year (BCE as negative) that matches a separate truth table;
  no two events in a set share a year (so every 4-tablet deal has one order); K–2 sequences match their expected order;
  gates are never dealt already in order; BCE/CE labels.
- **Labels fit:** every sign (2 lines × 46 px) and tablet (3 lines × 56 px) label wraps within the bitmap font, and every character can be drawn.
- **Every scene is traversable:** 24,000 generated scenes (150 seeds × 40 scenes × 4 bands) are checked against the
  physics constants in `src/jungle/physics.ts`: holes narrower than a jump, vines that reach past both edges with a
  tip the explorer can grab at the top of a jump, a full jump from each croc landing on the next croc's safe back
  (past the jaws), jaws shut longer than a jump takes, room to land between logs, snakes and sting-crabs jumpable and
  clear of pits, treasures on clear ground, tunnels that never skip a crossroads, gate or camp. No NaN values.
- Every grade K–12 has at least 8 map challenges and a timeline set; well-formed NC codes; sprites are rectangular.

### Codes to verify
The NC DPI site was blocked while this was built. Codes follow the kit's social studies bank (see
`src/kit/banks/social/NOTES.md`): full objective codes where they were confirmed, standard-level codes elsewhere.
Unconfirmed guesses:
- **1.G.1, 2.G.1, 3.G.1, 4.G.1, 6.G.1, 7.G.1** (maps, regions, continents), and the placement of latitude/longitude
  under grade 6–8 geography.
- **K.H.1, 1.H.1, 2.H.1, 3.H.1, 4.H.1, 5.H.1, 6.H.1, 8.H.1** for timelines and sequences (the objective numbers were not confirmed).
- **4.G.1.2** is used for NC landmarks (the kit confirmed 4.G.1.2 but its exact wording was not seen).
- **WH.G.1** and **AH.H.1** for movement in history (there may be a geography strand for American History);
  **CL.C&G.1 / CL.C&G.2 / CL.C&G.3** and **EPF.E.1 / EPF.E.1.1** are placed by topic.

## Controls

| Keyboard | Touch | Action |
|---|---|---|
| ← / → | ◀ ▶ | Run |
| Space / Z / X | JUMP | Jump; let go of a vine |
| ↑ / ↓ | ▲ ▼ | Climb (north ladder, tunnel exit), go down (tunnel ladder, south trapdoor), open a tablet |
| A–D or 1–4 | tap a banner answer, a sign or a tablet | Answer / choose an exit / open a tablet |
| Enter / Space | the continue button | Continue after an answer |
| R | speaker button | Read the question or direction aloud again |
| P / Esc, M | toolbar | Pause, mute |

A–D are never movement keys. The toolbar has **◀ ARCADE** (keeps the grade), pause, sound and read-aloud toggles.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:8080
npm test           # validate map challenges, timelines, labels and scene physics, K–12
npm run build      # type-check + production build into dist/
```

Playtest (Playwright, optional): run `npm run build && npx vite preview --port 4409 --host 127.0.0.1`, then
`node scripts/playtest.cjs`. Add `?debug` to the URL to expose the engine as `window.__jungleRun`.

## Deploying

Jungle Run lives in SpiderBen10's Arcade repository (`games/jungle-run/`). The arcade's deploy
workflow builds and tests it and publishes it at `/jungle-run/` on the arcade's Azure app, so it
needs no Azure app or token of its own. See the arcade README.

## Credits

Game design and characters: **created by SpiderBen10 (NZDO)**. The explorer, swamp snappers, sting-crabs,
coil snakes, treasures and jungle scenes are original pixel art.
