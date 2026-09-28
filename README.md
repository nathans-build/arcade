# Stack Chef

A platform arcade game for **SpiderBen10's Arcade**, created by **SpiderBen10 (NZDO)**.
Every level is an order to build *in sequence*: a butterfly's life cycle, the events of a short
story, the steps to solve an equation, fractions from least to greatest. Players in grades K–12
practise sequencing across math, science and ELA (NC Standard Course of Study).

![Stack Chef](docs/screenshot.png)

- The SpiderBen10 hero, in a chef's hat and apron, runs along steel **girders** and climbs
  **ladders** in a night-time kitchen. Labelled **slabs** (bun, lettuce, tomato, patty, cheese
  colours) lie on the girders.
- **Walk all the way across a slab** and it drops one girder. If it lands on another slab, that one
  is knocked down a girder too. A slab that falls off the lowest girder lands on the **counter**
  and slides onto the **plate** at the right.
- **The stack must be built in order, bottom first.** The goal is at the top of the screen and in the
  banner: *Stack: BUTTERFLY LIFE CYCLE · bottom = first, top = last*. The plate shows ghost slots
  for the slabs still needed. A slab that arrives **out of order bounces back up** to the lowest free
  girder in its column, and the banner says why (*"Not yet! CHRYSALIS comes before BUTTERFLY."*,
  *"2/4 is greater than 2/8, so 2/8 goes on first."*, *"Not yet! 3x=15 comes before x=5. Subtract 5
  from both sides."*).
- **Always completable.** The pick strip under the goal shows up to four slabs still on the girders
  (always including the one that is needed next when more than four are left). Press **A–D** or
  **1–4**, tap a strip button, or **tap a slab on the screen**, and that slab drops straight to the
  plate. Ordering never depends on platform skill; walking slabs down just scores more.
- **Food critters** (original: Rascal Radish, Bruiser Broc and Shifty Shroom) chase the chef along
  the girders and up the ladders, using the shortest ladder route. A falling slab **squashes** any
  critter under it (500, 1000, 2000… points for several in one fall); a squashed critter comes back
  a few seconds later. **Spice** (Space / Z / X, or the SPICE button) stuns critters in front of the
  chef for a few seconds, but the shaker holds only 4–5 shakes a level.
- A critter touching the chef costs one of 3 lives. After each finished stack an **incoming
  transmission** asks a question from the shared kit bank for the chosen subject (with its
  explanation): a right answer scores a bonus and adds 2 spice.
- At game over, a **mission report** lists results by NC standard (code and skill), from stacks
  (clean = no bounces) and transmissions, plus *practice next* and the orders to review. A stack
  built with bounces comes back two levels later.

## Subjects and grades

The title screen has a **Math / Science / ELA / Mixed** picker (Mixed rotates the three) and a
K–12 grade picker. When the game is opened from the arcade with `?grade=`, it shows that grade and a
*CHANGE GRADE IN THE ARCADE* link instead. Otherwise it starts on the last grade played in this
browser, or grade 3.

**Stack size and difficulty.** K–2: 3 slabs, 3 girders, big (double-size) slab labels, one slow
critter (two from level 3), 5 spice, critters start after 5 seconds, **read-aloud on by default**
(the goal, the story and every slab label: *"Build the stack: butterfly life cycle. The bottom is
first… The slabs are: A: chrysalis. B: larva. C: butterfly."*; right slabs and bounce reasons are
spoken too). 3–5: 4 slabs, 4 girders, 2–3 critters. 6–8: 4–5 slabs, 2–4 faster critters.
9–12: 4–5 slabs, 3–4 of the fastest critters. From level 2 (grades 3–12) a girder can have a gap
that critters and chef must go round. Every level is a little faster.

| Grade | Math (generated fresh, orders computed) | Science | ELA |
|---|---|---|---|
| K | Count up (NC.K.CC.2), numbers to 10 (NC.K.CC.7), teen numbers as 10+n (NC.K.NBT.1), sums within 5 (NC.K.OA.5) | Seasons (ESS.K.1.2), rainy day (ESS.K.1.1), a plant grows, people grow up (LS.K.1.1), kick a ball (PS.K.2.2) | Story events (RL.K.3), build a sentence (L.K.1), ABC order of letters (RF.K.1) |
| 1 | Two-digit numbers (NC.1.NBT.3), tens and ones (NC.1.NBT.2), sums (NC.1.OA.6) | Sun in the sky, day to night (ESS.1.1), bean sprouts (LS.1.1), bird family (LS.1.2) | Story events (RL.1.3), how to brush your teeth (RI.1.3), sentence (L.1.1), order words FIRST/NEXT/LAST (W.1.3), ABC order by first letter (RF.1.1) |
| 2 | Three-digit numbers (NC.2.NBT.4), skip-count (NC.2.NBT.2), sums and differences (NC.2.OA.2), times of day a.m./p.m. (NC.2.MD.7), coins (NC.2.MD.8) | Frog, butterfly, chicken life cycles (LS.2.1), heating water, making an ice pop (PS.2.1.1, PS.2.1.2), thunderstorm (ESS.2.1) | Beginning-middle-end (RL.2.5), plant a seed (RI.2.3), writing steps (W.2.5), sentence (L.2.1), ABC order by second letter (L.2.2) |
| 3 | Products (NC.3.OA.7), unit fractions and same-denominator/numerator fractions (NC.3.NF.3) | Seed-plant life cycle, flower to seeds (LS.3.2.2), heating ice (PS.3.1.3), inner and outer planets (ESS.3.1.1), how an arm bends (LS.3.1.1) | Story events (RL.3.3), make lemonade, maple syrup (RI.3.3), writing process (W.3.5), parts of a letter (W.3.4) |
| 4 | Multi-digit numbers (NC.4.NBT.2), unlike fractions (NC.4.NF.2), decimals (NC.4.NF.7), place value (NC.4.NBT.1), feet/inches/yards and m/cm/mm (NC.4.MD.1) | Moon phases, one turn of Earth (ESS.4.1), weathering (ESS.4.2.3), how a fossil forms (LS.4.2.2), energy in a flashlight (PS.4.2) | Story events (RL.4.3), how chocolate is made (RI.4.3), draft to publish (W.4.5) |
| 5 | Decimals to thousandths (NC.5.NBT.3), order-of-operations steps with brackets (NC.5.OA.1) + review of 3–4 | A water drop's trip (ESS.5.1.4), food chains (LS.5.2, LS.5.2.1), body organization (LS.5.1.1), path of food (LS.5.1), how a cloud forms (ESS.5.1) | Story events (RL.5.3), how an NC bill becomes law (RI.5.3), research steps (W.5.7) |
| 6 | Integers, rationals, absolute value (NC.6.NS.7), powers (NC.6.EE.1), order of operations with exponents (NC.6.EE.2), fractions/decimals/percents (NC.6.RP.3) | Adding heat to ice (PS.6.1.2), a year of seasons (ESS.6.1), EM waves by wavelength (PS.6.3), weathering to new rock (ESS.6.2), after a forest fire (LS.6.2), scientific investigation (SEP.3) | Plot unfolding (RL.6.3), plot structure (RL.6.5), writing process (W.6.5), how paper is recycled (RI.6.3) |
| 7 | Two-step equation steps with a check (NC.7.EE.4), rational numbers (NC.7.NS.2), fractions/decimals/percents | Atmosphere layers, thunderstorm (ESS.7.1), levels of organization, path of blood (LS.7.1) | Story events (RL.7.3), research project (W.7.7), how a news story is made (RI.7.3) |
| 8 | Scientific notation (NC.8.EE.3), irrational numbers (NC.8.NS.2), variables on both sides (NC.8.EE.7) | Quark to molecule (PS.8.1), rock layers with a dike (ESS.8.1), first appearances in fossils (LS.8.3), how a vaccine protects (LS.8.1) | Flashback: what happened first (RL.8.5), the hero's journey (RL.8.9), MLA book citation (W.8.8), how a U.S. bill becomes law (RI.8.3) |
| 9 (NC Math 1 / EES / English I) | Multi-step equations (NC.M1.A-REI.1), rational exponents (NC.M1.N-RN.2), function values (NC.M1.F-IF.2) | Rock cycle path (ESS.EES.2.2), life of a sun-like star, sizes in space (ESS.EES.1), Earth's layers, seafloor spreading (ESS.EES.2) | In medias res: what happened first (RL.9-10.5), Freytag's pyramid (RL.9-10.5), writing process (W.9-10.5) |
| 10 (Math 2 / Biology / English II) | Completing the square (NC.M2.A-REI.4), rational exponents (NC.M2.N-RN.2), + Math 1 kinds | Cell cycle (LS.Bio.1), DNA to protein (LS.Bio.5), levels of ecology (LS.Bio.4), cellular respiration (LS.Bio.3), classification (LS.Bio.6) | The polio vaccine (RI.9-10.3), essay structure (W.9-10.2), character development (RL.9-10.3) |
| 11 (Math 3 / Chemistry / English III) | Exponential equations, logarithms (NC.M3.F-LE.4), radical equations (NC.M3.A-REI.2), trig values (NC.M3.F-TF.2), radians (NC.M3.F-TF.1) | Atomic models, electron filling order (PS.Chm.1), grams to grams (PS.Chm.4), atomic radius in period 3 (PS.Chm.2.2) | American literary periods (RL.11-12.9), amending the Constitution (RI.11-12.3), the Shakespearean sonnet (RL.11-12.5), revising a paper (W.11-12.5) |
| 12 (Math 3–4 / Physics / English IV) | As grade 11 | EM spectrum by frequency, colours by wavelength (PS.Phy.7), energy at a dam (PS.Phy.6), ball thrown straight up (PS.Phy.1) | British literary periods (RL.11-12.9), five-act tragedy (RL.11-12.5), "The Last Shift" (RL.11-12.3), revising a paper (W.11-12.5) |

There are 65 written science sequences and 51 written ELA sequences (every story is original), plus
39 math generators and 3 ABC-order generators. Per band: K–2 has 16 science, 17 ELA (incl. 3
generators) and 12 math generators; 3–5 has 17 / 13 / 10; 6–8 has 14 / 11 / 10; 9–12 has 18 / 13 / 9.
A grade with fewer than four written sequences of its own also draws from the nearest grades in its
band; math grades also review the earlier grades of their band. The data lives in `src/seq/`.

### Standards codes to verify

The official NC DPI site is blocked in this sandbox. Codes follow the kit's notes
(`src/kit/banks/*/NOTES.md`) and the Common Core numbering NC uses for ELA and math.

- **SEP.3** (the scientific investigation stack) is a label for NC's Science and Engineering
  Practices (planning and carrying out investigations), not an official objective code.
- **LS.K.1.1** for "a plant grows" and "people grow up" (assumed: living things grow and change) and
  **PS.K.2.2** for "kick a ball".
- **LS.6.2** (succession after a fire), **LS.7.1** for the path of blood (body systems in grade 7),
  **LS.Bio.1** for the cell cycle and **LS.Bio.5 / LS.Bio.6** (protein synthesis, classification):
  the strand numbers are the kit's best guesses.
- **ESS.EES.1** for stars and scale of the universe; **ESS.EES.2** for Earth's layers and seafloor spreading.
- **RF.K.1 / RF.1.1 / L.2.2** for ABC order (alphabet knowledge and reference skills), **W.3.4**
  (parts of a friendly letter), **W.1.3** (temporal words), **RL.8.9** (the hero's journey as an
  archetypal pattern), **RL.11-12.9** (American and British literary periods), **W.9-10.2** (essay organization).
- **NC.5.NBT.3** (decimals to thousandths), **NC.8.NS.2** (irrational numbers) and **NC.7.NS.2**
  are not used by the kit's generators; they are assumed to match the Common Core numbering.
- **NC.6.RP.3** for ordering fractions, decimals and percents (percent is in 6.RP.3; ordering mixed
  forms could also be coded 6.NS.7).
- **NC.M2.A-REI.4** for completing the square (the kit uses this code), **NC.M3.F-LE.4** for
  exponential equations solved with a common base (the standard is about logarithms).

## Controls

| Keyboard | Touch (phones/tablets) | Action |
|---|---|---|
| ← → | ◀ ▶ | Walk along a girder (walk across a slab to drop it) |
| ↑ ↓ | ▲ ▼ | Climb (the chef steps over to a ladder within reach) |
| Space / Z / X | SPICE | Spray spice to stun critters in front of you |
| A–D or 1–4 | tap a strip button or a slab | Drop that slab straight to the plate |
| A–D or 1–4, then Enter | tap | Answer a transmission, then continue |
| R | speaker button | Read the goal (and story) aloud again |
| P / Esc, M | toolbar | Pause, mute |

Letters A–D are never movement keys (movement is the arrow keys only). The toolbar also has
**◀ ARCADE**, which goes back to the arcade menu and keeps the grade, plus sound and read-aloud toggles.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:8080
npm run build      # type-check + production build into dist/
npm test           # checks every sequence, generator and layout (scripts/check-sequences.ts)
```

`npm test` checks: every written sequence has a unique id, grades in one band, the band's slab count
and no duplicate labels (so exactly one order is correct); labels are ≤ 12 characters, have glyphs
in the game's bitmap font and fit a slab at the band's label size (double size for K–2) and a plate
slab; standards codes match the grades; each band has at least 8 sequences per subject. Math and
ABC generators run about 24,000 times: every label's value is recomputed from the label text alone
(fractions, decimals, percents, powers, roots, π, scientific notation, logs, trig, clock times,
coins, lengths, place value) and must match, values must strictly increase (or decrease) with a
clear gap where estimation is needed, order-of-operations steps must each be right and use the
previous result, and every equation step must hold at the solution. It also builds 12,000 level
layouts (every band, levels 1–8, 250 seeds) and checks that every girder segment and every slab
is reachable from the chef's start by ladders, that slabs sit fully on girders, and that ladders
never sit under a slab. No NaN anywhere.

`scripts/playtest.cjs` is an automated Playwright playtest (needs `npx vite preview --port 4407`):
at grades K, 3, 7 and 11, with the keyboard at 1280×800 and touch at 1080×810, it picks a subject,
walks the chef across a slab, climbs a ladder, sprays spice, drops a slab out of order (checks the
bounce and reason), finishes the stack with keys, strip taps and slab taps, answers the transmission
with a key or a tap, checks the layout fits, and checks the mission report. One run without `?grade=`
checks the grade picker. `?debug` exposes the engine as `window.__sc`.

`src/kit` is the shared arcade kit. Copy the canonical `kit/` folder there before building.

## Deploying

Stack Chef lives in SpiderBen10's Arcade repository (`games/stack-chef/`). The arcade's deploy
workflow builds and tests it and publishes it at `/stack-chef/` on the arcade's Azure app, so it
needs no Azure app or token of its own. See the arcade README.

## Credits

Game design and characters: **created by SpiderBen10 (NZDO)**. The chef hero and the food critters
are original characters.
