# Lane Leap

A *Frogger*-style arcade game for **SpiderBen10's Arcade**, covering math, science and ELA for
grades K–12 (North Carolina Standard Course of Study). Created by **SpiderBen10 (NZDO)**.

![Lane Leap mid-game](docs/screenshot.png)

Hop the arcade's hero (red helmet, cyan visor, blue suit, yellow diamond) up through lanes of
traffic, across a river of logs and lily pads, and into the right home at the top.

- **The rule.** Each level shows a rule such as *HOP ON NOUNS*, *HOP ON MULTIPLES OF 6* or
  *HOP ON RENEWABLE RESOURCES*. Every log and lily-pad raft carries a label. Land on one that
  follows the rule and it lights up green and scores (streaks multiply it). Land on one that breaks
  the rule and it **sinks**. The rule bar tells you why (`RUN is a verb, not a noun.`,
  `15 = 6 × 2 + 3. Not a multiple of 6.`). A shield pip saves you (you're pulled back to the middle
  sidewalk); with no shield left you lose a life. Missing the logs completely is a splash, and cars
  are a splat.
- **The homes.** The four doorways at the top hold the four answers (A–D) of a question from the
  arcade kit's `QuestionDeck`. The question is also shown above the screen. Hop up under a doorway,
  or press **A–D / 1–4** or tap an answer (on the banner or on the doorway) at any time to lock in a
  home; the hero leaps straight in as soon as he reaches the riverbank. A wrong home is crossed out,
  the right one flashes, and you head back to the start to try again (only the first pick counts
  in your report).
- **Transmission checkpoint.** After each level an incoming transmission asks a full kit question
  with its explanation. A right answer gives bonus points and an extra shield for the next level.
- Timer per crossing (the bar at the bottom), 3 lives (4 for K–2), 1 shield per level (2 for K–2).
  Levels get faster, and the rule changes every level (in *Mixed* the subject rotates each level).
- Game over shows a **mission report** grouped by NC standard (code + skill), saying whether each
  result came from logs, homes or transmissions, plus what to practice next.

## Grades, rules and standards

The grade comes from the arcade link (`?grade=K` … `?grade=12`): then the title shows the grade and a
*CHANGE GRADE IN THE ARCADE* link. Opened directly, the title screen has a K–12 picker. Pick
**Math, Science, ELA or Mixed** to start.

| Grade | Math rules | Science rules | ELA rules |
|---|---|---|---|
| K | numbers bigger than 5, as numerals, words or dots (NC.K.CC.7); pairs that make 10 (NC.K.OA.4); ways to make 5 (NC.K.OA.2) | living / nonliving (LS.K.1.1); animals (LS.K.1.1); hard / soft things (PS.K.1.1) | rhymes with cat, dog, sun, top (RF.K.3); starts with B, M, S, T (RF.K.4); naming words / action words (L.K.1) |
| 1 | facts that equal 10 (NC.1.OA.6); bigger than 50 (NC.1.NBT.3); numbers with 4 tens (NC.1.NBT.2) | plant parts (LS.1.1) / animal parts (LS.1.2); things in the sky (ESS.1.1) / Earth materials (ESS.1.2.1) | short a / long a words (RF.1.4); more than one / just one (L.1.1); names that need capitals (L.1.2) |
| 2 | even / odd (NC.2.OA.3); bigger than 500 (NC.2.NBT.4); facts that equal 15 (NC.2.OA.2) | solids / liquids (PS.2.1.1); baby / grown-up animals (LS.2.1) | nouns / verbs / adjectives (L.2.1); compound words (L.2.4) |
| 3 | × and ÷ facts that equal 24 (NC.3.OA.7); rounds to 50 (NC.3.NBT.1); fractions less than 1 (NC.3.NF.3) | gases / liquids (PS.3.1.2); planets (ESS.3.1.1); bones (LS.3.1.1) | adverbs, with -ly adjective traps (L.3.1); past-tense verbs (L.3.1); words with a prefix, with *uncle*/*ready* traps (L.3.4) |
| 4 | multiples of 3, 4, 6, 7, 8, 9; factors of 24, 36, 48; primes (NC.4.OA.4); fractions equal to 1/2 (NC.4.NF.1) | conductors / insulators (PS.4.2); igneous / sedimentary / metamorphic rocks (ESS.4.2.1) | adjectives / verbs (L.4.1); synonyms for *big* and *happy* (L.4.5) |
| 5 | decimals bigger than 0.5 (NC.5.NBT.3); fraction sums equal to 1 (NC.5.NF.1); powers of 10 equal to 1,000 (NC.5.NBT.2) | chemical / physical changes (PS.5.1.2); producers / consumers (LS.5.2); digestive system parts (LS.5.1) | conjunctions / interjections / prepositions (L.5.1); perfect-tense verbs (L.5.1) |
| 6 | numbers less than 0, incl. \|−8\| and −(−4) (NC.6.NS.5); ratios equal to 2:3 (NC.6.RP.3); equations x = 4 solves (NC.6.EE.5) | mechanical / electromagnetic waves (PS.6.3); biotic / abiotic factors (LS.6.2) | Greek & Latin roots: write, carry, see, hear (L.6.4); positive / negative connotation (L.6.5) |
| 7 | integer sums equal to −6 (NC.7.NS.1); products and quotients equal to −12 (NC.7.NS.2); same as 0.75 (NC.7.NS.2); x = 3 solves (NC.7.EE.4) | single-celled / multicellular (LS.7.1); heterozygous / homozygous (LS.7.2); speeds of 10 m/s (PS.7.1) | roots: water, time, life, earth (L.7.4); subordinating conjunctions (L.7.1) |
| 8 | linear functions (NC.8.F.3); irrational numbers (NC.8.NS.1); perfect cubes (NC.8.EE.2) | renewable / nonrenewable resources (PS.8.2); elements / compounds / mixtures (PS.8.1); viral / bacterial diseases (LS.8.1) | roots: star, light, self (L.8.4); infinitives vs. *to* + noun (L.8.1) |
| 9 (NC Math 1 · EES · English I) | same as x²+5x+6 (NC.M1.A-APR.1); has factor (x+2) (NC.M1.A-SSE.3); exponential growth (NC.M1.F-LE.1) | greenhouse gases (ESS.EES.4); hydrosphere (ESS.EES.3) / geosphere (ESS.EES.2); minerals / rocks (ESS.EES.2) | roots: good, bad, speak (L.9-10.4); correct spellings (L.9-10.2) |
| 10 (NC Math 2 · Biology · English II) | rational / irrational results (NC.M2.N-RN.3); rational exponents equal to 4 (NC.M2.N-RN.2); x = 4 solves the quadratic (NC.M2.A-REI.4) | matching DNA strands (LS.Bio.5); carbohydrates / proteins (LS.Bio.1) | roots: true, against, many (L.9-10.4); positive / negative connotation (L.9-10.5) |
| 11 (NC Math 3 · Chemistry · English III) | p(1) = 0 (NC.M3.A-APR.2); even functions (NC.M3.F-BF.3); logs equal to 3 (NC.M3.F-LE.4) | ionic / covalent (PS.Chm.3); acids / bases (PS.Chm.5); alkali metals / halogens / noble gases (PS.Chm.2) | correct spellings (L.11-12.2); rhetorical devices (RI.11-12.6) |
| 12 (NC Math 4 · Physics · English IV) | logs equal to 2 (NC.M4.AF.3.1); powers of i equal to −1 (NC.M4.N.1); trig values equal to 1/2 (NC.M3.F-TF.2, review) | vectors / scalars (PS.Phy.1); units of energy (PS.Phy.6); circuits with R = 4 Ω (PS.Phy.8) | roots: send, break, turn (L.11-12.4); euphemisms (L.11-12.5) |

Home questions and transmissions come from the kit (generated math; written science and ELA banks),
tagged with their own standards, and favour standards the player has missed before.

**K–2** get 2 road lanes and 3 river lanes, slower traffic and logs, 75 seconds per crossing,
4 lives, 2 shields, double-size log labels (grades 3–5 too), bigger question text, and **read-aloud
on by default** (the rule, the home question and every "why" are read out; the speaker button or
**R** replays). Grades 6–8 add a fourth road lane; grades 9–12 add a fourth river lane.

## Controls

| | Keyboard | Touch (iPad / phone) |
|---|---|---|
| Hop | ← ↑ → ↓ (hold to keep hopping) | ◀ ▶ ▼ ▲ pads |
| Pick a home | A–D or 1–4 | tap an answer on the banner, or tap a doorway |
| Pause | P or Esc | PAUSE (toolbar) |
| Sound | M | SOUND (toolbar) |
| Read aloud again | R | speaker button |
| Transmission | 1–4 or A–D, then Enter | tap an answer, then *Next level* |

A–D are never movement keys. The 320×200 pixel screen scales to fit any window (desktop, iPad in
either orientation, phones; on landscape phones the touch pads sit beside the screen). Log labels,
home answers and banners use the game's own bitmap font, so they stay crisp without web fonts.

## Run it locally

```sh
npm install
npm run dev        # http://localhost:8080
npm test           # checks every rule for every grade (see below)
npm run build      # type-check + production build into dist/
```

`npm test` (`scripts/check-rules.ts`) checks all 172 rules: every grade has at least two rule
families per subject; every rule has at least 8 matching and 8 non-matching logs; labels are at most
10 characters, drawable by the pixel font and fit a log at that grade's size; no duplicates and no
label on both sides; every log has a reason. Memberships are recomputed independently: all math with
number checks and an expression evaluator (which is itself tested), plus genotypes, DNA pairing,
speed, Ohm's law, ionic/covalent (metal + nonmetal), acids/bases, periodic groups, rhymes, first
letters, short/long vowels, plurals, compound words, Greek/Latin roots (each word contains its own
root and no other meaning's root), spelling pairs, connotation and euphemism pairs. Category rules
(nouns vs. verbs, living vs. nonliving, …) are checked to be disjoint.

`scripts/playtest.cjs` is a Playwright playtest (needs a running `npx vite preview --port 4403
--host 127.0.0.1` and a global Playwright). For grades K, 3, 7 and 11 it plays a level with the
keyboard at 1280×800 and with touch on an iPad (1080×810): crosses on rule-following logs, lands on
one rule-breaker to check sinking and shields, picks a wrong home and then the right one (keys and
taps), answers the transmission, checks the next level, the layout and the mission report. It also
checks the grade picker when the link has no `?grade=`. `?debug` exposes the engine as
`window.__ll` for these tests.

Code map: `src/LaneLeap.tsx` (screens, HUD, rule bar, home question, transmissions, report),
`src/leap/engine.ts` (game loop and drawing), `src/leap/layout.ts` (lanes and difficulty per grade
band), `src/leap/rules/` (math, science and ELA rule sets, the expression evaluator), `src/leap/font.ts`
(bitmap font), `src/leap/sprites.ts` (hero, vehicles, lily pads), `src/kit/` (the arcade's shared kit,
unchanged).

## Deploying to Azure

Every push to `main` builds the game and publishes it to Azure Static Web Apps
(`.github/workflows/azure-static-web-apps.yml`). Pull requests get their own preview link.
The deploy step is skipped until the token below is added, so the build still runs and checks the code.

One-time setup, from any browser at https://shell.azure.com (Bash):

```sh
az group create -n rg-lane-leap -l eastus2
az deployment group create -g rg-lane-leap -f infra/main.bicep   # or: az staticwebapp create -n lane-leap -g rg-lane-leap -l eastus2 --sku Free
az staticwebapp secrets list -n lane-leap -g rg-lane-leap --query properties.apiKey -o tsv
```

Copy the printed token into this repository under
**Settings → Secrets and variables → Actions → New repository secret**, named
`AZURE_STATIC_WEB_APPS_API_TOKEN`. The next push to `main` publishes the game at
`https://<name>.azurestaticapps.net`.

The token can only publish to that one web app. Revoke or rotate it in the Azure portal at any time.
The Free tier covers this game (static files only, no server).

## Standard codes to verify

The NC DPI site was not reachable while this was built, so these codes follow the kit's conventions
(see `src/kit/banks/*/NOTES.md`) and are best guesses:

- **Math:** NC.K.OA.2 for "ways to make 5" (add and subtract within 10); NC.3.NF.3 for "fractions
  less than 1" (could be NC.3.NF.4, compare); NC.5.NBT.3 (compare decimals); NC.6.NS.5 (positive and
  negative numbers); NC.M1.A-APR.1 (equivalent polynomial expressions); NC.M1.F-LE.1 (linear vs.
  exponential); NC.M2.N-RN.3 (rational and irrational sums/products); NC.M3.F-BF.3 (even functions);
  grade 12's trig rule uses the Math 3 unit-circle code NC.M3.F-TF.2 as review.
- **Science:** LS.K.1.1 for "animals"; ESS.4.2.1 for rock types; LS.5.1 for body systems;
  ESS.EES.2 / ESS.EES.3 / ESS.EES.4 (the EES topic numbering is unconfirmed); LS.Bio.1 for
  biological molecules and LS.Bio.5 for base pairing; PS.Chm.2 / PS.Chm.3 / PS.Chm.5; PS.Phy.1 /
  PS.Phy.6 / PS.Phy.8; LS.7.2 (genotypes); PS.7.1 (speed); PS.2.1.1 and LS.2.1.
- **ELA:** RF.K.4 for beginning sounds (NC numbers phonics as RF.K.4); L.2.4 (compound words);
  L.3.4 (prefixes); L.4.5 (synonyms); L.x.4 for Greek and Latin roots; L.x.5 for connotation and
  euphemisms; RI.11-12.6 for naming rhetorical devices.

---

Created by SpiderBen10 (NZDO) for SpiderBen10's Arcade.
