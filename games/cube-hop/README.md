# Cube Hop

An isometric cube-hopping arcade game for **SpiderBen10's Arcade**, created by **SpiderBen10 (NZDO)**.
Players in grades K–12 build sentences and true equations and sort words, numbers and science terms
into categories by hopping across a pyramid of cubes. It follows the NC Standard Course of Study:
ELA grammar and conventions first, then math and science.

![Cube Hop](docs/screenshot.png)

## How it plays

- A **pyramid of cubes** floats in space: 5 rows for K–2 (big cubes, big labels), 6 rows for grades 3–5,
  7 rows from grade 6 up. The arcade's hero (red helmet, cyan visor, blue suit, yellow diamond) hops
  **diagonally** from cube to cube. Every cube he lands on changes its top color, and lighting blank
  cubes scores points. Light up every blank cube in a round for a **FULL COLOR** bonus.
- **Cubes carry labels.** There are two kinds of rounds, and they alternate:
  1. **Build it.** Hop onto the cubes in order to build a correct sentence or a true equation. ELA
     rounds fix capitals and end marks, verb forms, pronouns, commas, semicolons and so on
     (*Fix it: the dogs runs.* → **The · dogs · run.**) or combine sentences with the right
     conjunction. Math rounds build a true equation (**3 × 4 = 12**, **√49 + 2 = 9**,
     **(x+2) (x+3) = x²+5x+6**) or the answer to an equation (*Solve 2x + 1 = 7* → **x = 3**).
     Science rounds fill in a fact (*Plants make food from ___.*). The tray in the banner and at the
     top of the screen fills in as you go.
  2. **Color the category.** Color every cube that fits the rule: nouns, verbs, adjectives, adverbs,
     prepositions, pronouns, conjunctions…; primes, multiples, fractions equal to ½, perfect squares,
     irrational numbers…; living things, conductors, elements, producers, igneous rocks, vectors…
- **Wrong cubes:** landing on a wrong label (a distractor such as *runs.* when the subject is plural,
  or a non-matching label in a color round) costs a **shield** and the banner says why, e.g. *"✘ was:
  With neither … nor, the verb agrees with the nearer subject: friends were."* Landing on a sentence
  word that comes later just says *Not yet*. After two misses on the same step, the right cube flashes.
- **Always completable.** Under the prompt there are up to **four answer buttons**: the labels still
  on the pyramid, always including one that counts right now. Press **A–D** or **1–4**, tap a button,
  or **tap a cube**, and the hero **auto-hops** there along a safe path (over blank cubes, never onto
  another label), untouchable while he dashes. Answers never depend on diagonal-hop skill. Every
  layout is generated so that every labelled cube touches the open region around the top cube.
- **Hazards:** red **zap-balls** drop onto the second row and bounce down to the bottom. From level 1
  (level 2 for K–2) **the Glitch**, a boxy green static-gremlin, appears and hops toward the hero one
  cube at a time. A hit takes a shield; with no shield left it takes one of 3 lives. **Escape pads**
  float beside the pyramid: hop onto one (off the side of the row just below it) to ride back to the top.
  If the Glitch is within two hops when you leave, it is fooled and zaps itself (+500).
- **Hopping off the edge** (anywhere without a pad) costs a life. For K–2 the edges are padded
  instead: the hero wobbles and stays on his cube, and read-aloud says to hop onto a cube.
- A level is two rounds (one of each kind). Between levels an **incoming transmission** asks a question
  from the shared kit bank (`QuestionDeck(grade, mode, { gameId: "cube-hop" })`) in the chosen subject:
  a right answer refills the shields and scores a bonus; a wrong one still gives +1 shield and shows
  the explanation.
- At game over, a **mission report** lists results by NC standard (code and skill) from cube rounds and
  transmissions, plus *practice next* and the rounds to review. Rounds finished with a mistake come
  back two rounds later.

## Controls

| Action | Keyboard | Touch / mouse |
|---|---|---|
| Hop up-right ↗ | **↑** | ↗ on the right-hand pad, or tap that cube |
| Hop down-right ↘ | **→** | ↘ on the right-hand pad, or tap that cube |
| Hop down-left ↙ | **↓** | ↙ on the left-hand pad, or tap that cube |
| Hop up-left ↖ | **←** | ↖ on the left-hand pad, or tap that cube |
| Auto-hop to an answer | **A–D** or **1–4** | tap an answer button, or tap a cube farther away |
| Transmission answer | **A–D** or **1–4**, then **Enter** | tap an answer, then *Next level* |
| Read aloud again | **R** | speaker button |
| Pause / mute | **P** or **Esc** / **M** | toolbar buttons |

The arrow keys are the four diagonals; a small legend in the top-left of the screen shows
`← = ↖  ↑ = ↗  ↓ = ↙  → = ↘`. The letters A–D are never movement keys. On touch screens (coarse pointers) two diagonal pads
appear: ↖ ↙ for the left thumb and ↗ ↘ for the right (beside the screen on phones in landscape).

## Grades, content and NC standards

The title screen has a K–12 grade picker and a subject picker: **ELA** (default), **Math**, **Science**
or **Mixed** (ELA, math and science rounds in turn). When the game is opened from the arcade with
`?grade=`, it shows that grade and a *CHANGE GRADE IN THE ARCADE* link instead of the grade picker.
Otherwise it starts on the last grade played in this browser, or grade 3.

| Grade | ELA (build + color) | Math (build + color) | Science (build + color) |
|---|---|---|---|
| K | Capitals, end marks, capital I (RF.K.1); questions, plural -s, naming and action words (L.K.1) | Add/subtract within 5 (NC.K.OA.5); ways to make 5 (NC.K.OA.3); teen numbers (NC.K.NBT.1) | Living things (LS.K.1.1); properties (PS.K.1.1); weather (ESS.K.1.1); plant needs (LS.1.1); gravity (PS.1.1) |
| 1 | Subject-verb agreement, pronouns, past tense, describing and question words (L.1.1); capitalize names (L.1.2); sentence features (RF.1.1) | Within 20 (NC.1.OA.6); make 10; compare two-digit numbers (NC.1.NBT.3) | Sun and stars, sky objects (ESS.1.1); plant parts (LS.1.1); animal parts (LS.1.2); gravity (PS.1.1) |
| 2 | Irregular plurals and verbs, reflexive pronouns, adverbs, collective nouns, past tense (L.2.1); contractions, capitalize days (L.2.2) | Within 100 (NC.2.NBT.5); even numbers (NC.2.OA.3); equals 15 (NC.2.OA.2) | Melting and freezing, solids (PS.2.1.1/.1.2); life cycles, hatching (LS.2.1); traits (LS.2.2); weather (ESS.2.1) |
| 3 | Agreement, comparatives/superlatives, tenses, conjunctions, abstract nouns, adjectives, verbs (L.3.1); possessives, quotation marks (L.3.2) | Multiply/divide within 100, multiples of 4, product 24 (NC.3.OA.7); fractions equal to ½ (NC.3.NF.3) | Boiling (PS.3.1.3); bones and muscles (LS.3.1.1); Earth's orbit, planets (ESS.3.1.1); shadows (ESS.3.1.2); seeds (LS.3.2.2) |
| 4 | Relative pronouns, progressive tenses, adjective order, modals, to/too/two, their/there/they're, prepositions (L.4.1); comma before a conjunction (L.4.2) | Multi-digit × and ÷ (NC.4.NBT.5); primes, factors of 36 (NC.4.OA.4) | Conductors (PS.4.2); magnets (PS.4.1.1); erosion (ESS.4.2.3); sedimentary rocks (ESS.4.2.1); fossils (LS.4.2.2); mirrors (PS.4.3.1) |
| 5 | Perfect tenses, correlative conjunctions, tense shifts, conjunctions, interjections (L.5.1); commas after introductions, yes/no, direct address (L.5.2) | Parentheses (NC.5.OA.1); decimal × whole (NC.5.NBT.7); compare decimals (NC.5.NBT.3); primes | Friction (PS.5.2); producers (LS.5.2); decomposers (LS.5.2.1); the heart (LS.5.1.1); conservation of mass, physical changes (PS.5.1.1/.1.2) |
| 6 | Pronoun case, intensive pronouns, pronoun shifts, possessive pronouns, pronouns and prepositions (L.6.1); commas with nonrestrictive elements (L.6.2) | Exponents (NC.6.EE.1); one-step equations (NC.6.EE.7); inequalities (NC.6.EE.8); common multiples (NC.6.NS.4) | Heat flow, convection (PS.6.2.1); insulators (PS.6.2.3); seasons (ESS.6.1); plates (ESS.6.2); photosynthesis (LS.6.1); abiotic factors (LS.6.2) |
| 7 | Complex and compound-complex sentences, dangling modifiers, fragments, subordinating conjunctions (L.7.1); coordinate adjectives (L.7.2) | Adding integers, negative values (NC.7.NS.1); multiplying integers (NC.7.NS.2); two-step equations (NC.7.EE.4) | Speed (PS.7.1); kinetic energy (PS.7.2); air pressure (ESS.7.1); cells and cell parts (LS.7.1); heredity (LS.7.2) |
| 8 | Subjunctive, active/passive voice, gerunds, infinitives, mood shifts (L.8.1) | Square roots, perfect squares (NC.8.EE.2); exponent rules (NC.8.EE.1); multi-step equations (NC.8.EE.7); irrational numbers (NC.8.NS.1) | Compounds, conservation of mass, elements (PS.8.1); energy resources (PS.8.2); rock layers (ESS.8.1); vaccines (LS.8.1) |
| 9–10 (English I–II, NC Math 1–2) | Parallel structure, agreement, fewer/less, conjunctive adverbs, relative pronouns (L.9-10.1); semicolons, colons (L.9-10.2) | Solve linear equations and inequalities (NC.M1.A-REI.3); distributive identities (NC.M1.A-SSE.1); factoring (NC.M1.A-SSE.3); exponents = ¼ (NC.M1.N-RN.2); rational exponents (NC.M2.N-RN.2); where x² − 4 < 0 (NC.M2.F-IF.4) | 9 (EES): tides, fusion (ESS.EES.1); subduction, igneous rocks (ESS.EES.2); greenhouse gases (ESS.EES.4). 10 (Biology): ribosomes, eukaryotes, proteins (LS.Bio.1); osmosis (LS.Bio.2); DNA (LS.Bio.5); natural selection (LS.Bio.6) |
| 11–12 (English III–IV, NC Math 3–4) | Agreement, who/whom, neither/nor, not only … but also, lie/lay, affect/effect, Latin plurals, indefinite pronouns (L.11-12.1); hyphens (L.11-12.2) | Logarithms (NC.M3.F-LE.4); unit-circle values (NC.M3.F-TF.2); rational exponents (NC.M2.N-RN.2) | 11 (Chemistry): isotopes (PS.Chm.1); metals (PS.Chm.2.2); ions, ionic compounds (PS.Chm.3); pH (PS.Chm.5). 12 (Physics): vectors (PS.Phy.1); Newton's first law (PS.Phy.2); momentum (PS.Phy.3); energy and its units (PS.Phy.6) |

**Content:** 79 ELA sentences and 28 ELA color rules; 59 science sentences and 26 science color rules;
21 math equation templates (generated fresh every round) and 26 math color rules. Per grade band:
K–2 has 23 ELA / 14 science sentences, 3–5 has 25 / 15, 6–8 has 16 / 15 and 9–12 has 15 / 15, with
4–9 color rules per band and subject. Every rule has at least 8 matching and 8 non-matching labels.
It all lives in `src/content/` (`ela.ts`, `math.ts`, `science.ts`), with the math parser in `expr.ts`.

**Difficulty by grade band.** K–2: 5-row pyramid, 3–5-word sentences with 1–2 wrong cubes, big labels,
slow and rare zap-balls, no Glitch until level 2, padded edges, and **read-aloud on by default**: the
target sentence or rule is read at the start of each round with the answer choices (*"1: The. 2:
cat…"*), every label is read as the hero lands on it, and wrong cubes are explained aloud. Grades 3–5
(6 rows), 6–8 and 9–12 (7 rows) get longer sentences (up to 9 words: compound, complex and
compound-complex sentences, clauses, verb tenses, pronoun–antecedent agreement, parallel structure), three
wrong cubes, more labels in color rounds, and faster, more frequent hazards. Every level is a little faster.

## Run it

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # type-check (strict) + production build into dist/
npm test           # content checks for every grade (about a minute)
```

`npm test` (`scripts/check-content.ts`) checks, for every grade: enough sentences and rules per band and
grade; every sentence reconstructs exactly from its tokens (capital first, end mark last) and distractors
never equal a token; every math equation is true in every accepted order (all orders are computed), no
distractor swapped in for any token can make a true equation, and there is no NaN in any text; build
paths exist on 25 random layouts per sentence and grade (every label reachable from the top over blank
cubes; the answer buttons always include a right cube); color memberships (math re-computed
independently, element / metal / ionic lists checked against a periodic table); every label is ≤ 10
characters, has glyphs in the bitmap font and fits a cube top at its grade's size (K–1 at double size);
no duplicate ids, sentences or labels; and standards codes match their grades.

`scripts/playtest.cjs` drives the built game in Chromium with Playwright (keyboard at 1280×800 and touch
at iPad 1080×810, grades K, 3, 7 and 11, plus a run with the grade and subject pickers). `?debug` exposes
the engine as `window.__ch` for it.

## Deploying

Cube Hop lives in the arcade repository (`nathans-build/arcade`) at `games/cube-hop/` and is published
at `/cube-hop/` by the arcade's deploy. Vite's `base: "./"` makes the built `dist/` work from that
subfolder. The shared kit is copied into `src/kit/` (identical to the arcade's `kit/`).

## Standards codes to verify

The NC DPI site is blocked in this sandbox, so codes follow the kit's own notes
(`src/kit/banks/ela/NOTES.md`, `src/kit/banks/science/NOTES.md`) and Common Core placement:

- **RF.K.1 and RF.1.1 for capitals and end marks.** Common Core puts "recognize the distinguishing
  features of a sentence (first word, capitalization, ending punctuation)" at RF.1.1a; kindergarten
  capitalization and end punctuation are L.K.2 in Common Core. RF.K.1 is used for K sentence features.
- **L.x.1 / L.x.2 split.** NC's 2017 ELA standards organise grammar and conventions with a Language
  continuum; the kit uses both L.x.1 and L.x.2 codes, so grammar is coded L.x.1 and capitalization and
  punctuation L.x.2. Some skills (for example the pronoun shift at grade 6, the grade 7 fragment item)
  follow Common Core's grade placement.
- **Math:** NC.M1.A-SSE.1 (distributive identities), NC.M1.A-SSE.3 (factoring quadratics),
  NC.M1.N-RN.2 and NC.M2.N-RN.2 (integer and rational exponents), NC.M2.F-IF.4 (where a quadratic is
  negative), NC.M3.F-LE.4 (logarithms) and NC.M3.F-TF.2 (unit-circle values, used for grade 12 too)
  are best guesses at the NC Math 1–4 numbering. NC.K.OA.3 is used for "ways to make 5".
- **Science:** the same uncertain codes as the kit's notes (PS.1.1, LS.1.1/LS.1.2, ESS.2.1, LS.2.1,
  LS.2.2, LS.Bio.2–6, PS.Chm.3–5, PS.Phy.2–6). LS.Bio.1 is also used for biomolecules (proteins) and
  PS.Chm.2.2 for metals vs. nonmetals.

Credit: created by SpiderBen10 (NZDO) for SpiderBen10's Arcade. All sentences, rules, sprites and the
bassline are original.
