# Thread Chasers

A world-history time-and-place detective chase for **SpiderBen10's Arcade**, created by
**SpiderBen10 (NZDO)**, for **grades 5–12** (NC Standard Course of Study for Social Studies).

Outside time stands the **Long Archive**, where the Great Loom weaves the story of how the world got
connected. **Knot**, a silly yarn-ball gremlin (never evil, never hurt), has tugged its threads loose
and scattered their *beads*: moments in time and place. The arcade HERO, with an archivist's satchel,
and **Wick**, a lantern-moth whose lantern is the case clock, chase each thread bead by bead and
re-weave it. You steer with **geography** (where next?), **chronology** (when?), **cause and effect**
(why did it move?) and **sourcing** (which witness can you trust?).

80s look: a 320×200 canvas scaled with nearest-neighbour, CRT scanlines, a pixel world map drawn from
Natural Earth coastlines with rivers and zoomed insets, eleven bead tile sets, pixel witnesses in
respectful dress with natural skin tones, the arcade's bitmap font, and an original chiptune bassline.
Text (fact cards, clues, questions) sits in a panel beside the screen (wide screens) or below it
(iPad, phones), like Page Quest.

![Thread Chasers](docs/screenshot.png)

## How it plays

1. **Case brief.** Wick reads the loose-thread card.
2. **Bead scene.** A fact card (what happened here), up to three **witnesses** and an artifact
   **plaque**. Witnesses glimpse where the thread goes next: each interview costs **1 lantern hour**;
   the plaque is free. Choosing whom to ask is a reading-strategy decision.
3. **Chrono-map jump.** Four lettered pins (place + era). Distractors are the right place in the wrong
   era, the right era in the wrong place, or a plausible neighbour. Grades 9–12 use the **split dial**:
   pick the place on an unlabelled map, then the era. Pins that would overlap fan out, and the map zooms
   into an inset (Mediterranean, Indian Ocean, Sahara, Silk Road, Britain…) so pins stay tappable.
4. **Dead end.** A wrong jump takes you to the wrong place, where a polite local explains *why it can't
   be here* ("In 600 there is no Baghdad yet"). That explanation is the lesson. It costs 2 lantern hours
   and you return to the last bead. A miss never ends the case.
5. **Source checks** (grades 6–12): a primary-source excerpt with a sourcing or corroboration question.
   Debates are taught as debates (the Talas prisoners story; how much Mansa Musa's gold changed Cairo; de'
   Mussi's Caffa story; Ibn Majid as da Gama's pilot).
6. **Re-weave finale.** Repeated "what came next?" questions put the beads in order, then "why did it
   move?" (trade, pilgrimage, empire, learning, forced labor…). Knot is caught (gently) and wound back
   onto the Loom.
7. **Lantern refuels**: once per bead, an optional kit social-studies question at the player's own
   grade, +1 hour if right. **Lantern out**: "the thread slips", restart at the last bead with points kept.
8. **Transmission** between cases (a kit question with its explanation), then the **mission report**:
   results by standard (code + skill) for the chase and for refuels/transmissions, *practice next*, the
   dead ends you hit with their explanations, and a **Loom** picture of the threads you have re-woven.
9. **Ranks** (saved per browser and grade): Page → Archivist (1 case) → Curator (half the grade's cases)
   → Keeper of the Loom (all of them).

## Cases (v1)

| # | Case | Beads (date order) | Grades |
|---|---|---|---|
| 1 | **Paper's Road** | Luoyang, Cai Lun (105 CE) → Samarkand (750s) → Baghdad mill (c. 794) → Xàtiva (c. 1150) → Mainz, Gutenberg (c. 1455) | 5 (light), 6, 7, 8, 9–12 |
| 2 | **Gold and Salt** | Koumbi Saleh (1068) → Niani (c. 1235) → Cairo, Mansa Musa (1324) → Timbuktu (1327) → Taghaza (1352) → Catalan Atlas, Majorca (1375) | 5 (light), 6, 8, 9–12 |
| 3 | **Zero's Journey** | Bhinmal, Brahmagupta (628) → Baghdad, al-Khwarizmi (c. 825) → Albelda, Codex Vigilanus (976) → Béjaïa (c. 1192) → Pisa, Liber Abaci (1202). A Maya pin is a dead end that teaches independent invention. | 6, 8, 9–12 |
| 4 | **Silk and Steppe** | Chang'an, Zhang Qian (138 BCE) → Samarkand, Sogdian court (c. 660) → Karakorum relay posts (1254) → Florence, Pegolotti (c. 1340) → Caffa (1346) | 6, 8, 9–12 |
| 5 | **Monsoon Sea** | Kilwa (1331) → Calicut (c. 1342) → Malacca (c. 1400) → Nanjing, Zheng He (1405) → Calicut, da Gama (1498) | 6, 7, 8, 9–12 |
| 6 | **The Great Exchange** | Andes potato (1540s) → Seville (1573) → maize in Kongo (1580s) → horses on the Southern Plains (c. 1700) → Ireland (1845) | 5 (light), 7, 8, 9–12 |
| 7 | **Steam and Cotton** | Glasgow, Watt (1769) → Manchester (1782) → the cotton South (1820s) → Liverpool–Manchester railway (1830) → Bombay cotton boom (1860s) → Tomioka mill (1872) | 7, 8, 9–12 |
| 8 | **Rights on the Move** | Runnymede (1215) → London, Locke (1689) → Versailles, the Rights of Man (1789) → Saint-Domingue (1791) → Angostura, Bolívar (1819) → Paris, the UDHR (1948) → Pretoria (1994) | 7, 8, 9–12 |

**44 beads**, about 300 clue lines, 180 authored dead-end explanations (plus templated extra eras on the
9–12 dial), 16 source checks and 19 "why" items. Every bead's fact card cites ≥ 2 sources in
[`docs/sources.md`](docs/sources.md).

## Grade by grade

| | Grade 5 | Grades 6–8 | Grades 9–12 |
|---|---|---|---|
| Cases | light cases 1, 2, 6 | grade 6: 1–5 · grade 7: 1, 5–8 · grade 8: all 8 (review) | all 8, as World History |
| Beads per case | 4 | 5 | 5–7 |
| Witnesses | 2 + plaque, every clue helps | 3 + plaque, one red herring | 3 + plaque, one unreliable / contradicting witness |
| Map | named pins with era labels | named pins, era shown on the first tap, then JUMP | split dial: place on an unlabelled map, then era |
| Clue length | ≤ 60 characters | ≤ 100 characters | ≤ 140 characters; excerpts about 80 words |
| Source checks | none | 1 per case | 2 per case |
| Re-weave | dates shown | centuries shown | dates hidden + a multi-causal "why" |
| Lantern | 14 hours | 12 hours | 10 hours |
| Refuels / transmissions | kit social deck, grade 5 | kit social deck, own grade | kit social deck, own grade (10 Civic Literacy, 11 American History, 12 EPF) |

Grades **K–4** see a friendly "Thread Chasers is for grades 5 and up" screen with **◀ ARCADE**.

### NC standard codes recorded

| Skill (report) | Grade 5 | Grade 6 (and 8 on cases 2–4) | Grade 7 (and 8 on cases 1, 5–8) | Grades 9–12 |
|---|---|---|---|---|
| Chronology: what came next | 5.G.1.3 (paper) / 5.G.1.2 (gold, exchange) | 6.H.1 | 7.H.1.1 | WH.H.1.1 |
| Diffusion: where and when it moved | same | 6.G.1.2 | 7.G.1 | WH.G.1.2 |
| Cause and effect: why it moved | same | 6.E.1.1 | 7.E.1.2 (rights: 7.C&G.1.1; exchange: 7.G.1.1) | WH.E.1.2 (rights: WH.C&G.1.1; exchange, steam: WH.G.1.1) |
| Sourcing and corroboration | — | 6.H.1.3 | 7.H.1.1 | WH.H.1.1 |

Refuels and transmissions carry the kit bank's own codes. Everything is recorded with `recordAnswer`
under the game id `thread-chasers` (jumps count on the first try of each leg).

### Codes to verify

The NC DPI site is blocked in the build sandbox; these come from search excerpts of the 2021 standards
and the plan:

- **5.G.1.2 / 5.G.1.3** were decided in the plan for grade 5, but they are US-focused objectives
  (migration; technological innovation in the US). A teacher may prefer another tag for world content.
- **6.G.1.2** (movement and settlement), **6.E.1.1**, **6.H.1.3** (multiple perspectives using primary
  and secondary sources): seen in excerpts, worth confirming.
- **7.E.1.2** (interdependency) and **7.G.1.1** (push-pull, forced and voluntary migration) seen in
  excerpts; **7.G.1** is used at the standard level because the excerpt for **7.G.1.2** described
  demographic trends, not diffusion. **7.H.1.1** ("use historical thinking") covers chronology and sourcing.
- **WH.G.1.2** (movement, technology, innovation, cultural diffusion), **WH.E.1.2** (economic
  interdependence), **WH.H.1.1**, **WH.G.1.1**, **WH.C&G.1.1**: seen in excerpts.

## Sensitive history

- Agency and multiple perspectives, with non-European viewpoints in every case; "reached", never
  "discovered"; numbers as estimates with ranges (SlaveVoyages: about 12.5 million embarked, about
  10.7 million survived the crossing; the Irish famine: about 1 million deaths, 1.5–2 million emigrants).
- Colonialism with its harms and resistance (Afonso I of Kongo's 1526 letters; Calicut's merchants; the
  Haitian Revolution; Pétion's condition to Bolívar; resistance to apartheid).
- **Never playable:** trading or transporting enslaved people, conquest, picking a side in a war or
  genocide, any Holocaust stop, gore, caricature. The chase follows goods and ideas, never people as cargo.
- **Quiet beads** (`sensitive: true`: Taghaza, Caffa, da Gama, the Andes after the conquest, Kongo,
  Ireland 1845, the cotton South, Saint-Domingue, the UDHR, 1994): **no Knot, no lantern clock (actions
  cost nothing), no music**. `npm test` checks this.
- **Holocaust:** v1 states, as a fact at the UDHR bead, that the Declaration followed the Second World War
  and the Holocaust. There is no Archive of Remembrance in v1.
- Quotes only from public-domain texts (Pegolotti in Yule 1866, Cieza de León in Markham 1864, Ibn Battuta
  in Gibb 1929 (US public domain since 2025), Locke 1690, the 1789 Declaration, the UDHR); all other
  excerpts are labelled "Retold from …".
- A content lint in `npm test` bans "discovered", "savage", "primitive", "natives", "slaves" (say
  "enslaved people"), "tribe" without a nation name, and gore terms.

**Report a fact:** if you find a mistake, open an issue in the arcade repository (or tell SpiderBen10)
with the case, the bead and a source. A social-studies teacher review, ideally with regional reviewers,
is still needed before wide use.

### Facts corrected from the plan while fact-checking

- **Taghaza** is first named around 1275 and its famous description is Ibn Battuta's (1352), so it moved
  after Timbuktu (date order); Niani (c. 1235) comes second.
- The **1789 Declaration** was adopted at **Versailles** (the Assembly moved to Paris in October 1789).
- **Maize in China** is recorded by 1551–1555, before Seville's 1573 potato record, so the "maize in Africa
  and China" bead is **Kongo (1580s, Duarte Lopes)** and China is mentioned on its fact card.
- **Cai Lun** improved and promoted paper (older paper has been found); he did not invent it.
- **Gutenberg** was not first with movable type (Bi Sheng c. 1040; Korea's Jikji 1377).
- **Tomioka** (1872) is a silk-reeling mill, not cotton.
- **Ibn Majid** as da Gama's pilot is a story first written c. 1560; Portuguese sources name a Gujarati pilot.
- **Caffa:** de' Mussi was not there; his story of how plague entered the city is doubted.
- **Mansa Musa's** effect on Cairo's gold price is supported (al-Umari; Schultz) but its size is debated.

## Controls

| Action | Keyboard | Touch / mouse |
|---|---|---|
| Pick a witness / the plaque / the map gate | **←** **→** | tap them on the screen, or the panel buttons |
| Talk / read / open | **Enter** or **Space** | tap |
| Open the chrono-map | **G** | the MAP gate or "Open the chrono-map" |
| Pick a pin, a dial place or a dial era | **A–D** or **1–4** (6–8: same letter again or **Enter** to jump) | tap the pin on the map, or the A–D buttons |
| Back from the map | **Esc** / **Backspace** | "Back to the bead" |
| Answer a question | **A–D** or **1–4**, then **Enter** | tap an answer, then Continue |
| Refuel the lantern | **F** | "Refuel the lantern" |
| Read aloud again / pause / mute | **R** / **P** / **M** | speaker button / toolbar |

The letters A–D only ever answer questions or pick pins; movement is on the arrow keys.

## Run it

```bash
npm install
npm run dev          # http://localhost:4642/?grade=7
npm run build        # tsc (strict) + vite build
npm test             # scripts/check-cases.ts: content and engine checks for every grade band
npm run world        # rebuild src/chase/worldData.ts from Natural Earth (scripts/data/land-50m.json)
```

`npm test` checks: beads strictly in date order and bead counts per band; clue lengths per band; every
dead end explained and no distractor accidentally correct (not the target, not any bead of the case at
that place within 25 years, built pins and dials well formed); "near" pins within 3,500 km; every place
on land (or on the coast for ports); NC codes from the allowed set for every grade; every case solvable
within the lantern with 3 mistakes; the content lint; quiet beads without Knot, clock or music; ≥ 2
sources per bead, all present in `docs/sources.md`; every generated question has 4 unique choices.

Playtest (Chromium via a global Playwright): `npx vite preview --port 4642 --host 127.0.0.1 &` then
`node scripts/playtest.cjs` (add `SHOT=docs/screenshot.png` to save the screenshot). It covers the grade 3
gate, the picker without `?grade=`, and grades 5, 7 and 11 on 1280×800 keyboard plus iPad 1080×810 and
810×1080 touch, each played through a whole case to the report. `?debug` exposes `window.__tc`.

## Code map (and what Clue Compass can share)

- **`src/chase/` — the shareable chase engine** (no history in it):
  - `geo.ts`: Natural Earth land rings, map views, `fitView()` (world or a zoomed inset so pins stay
    tappable), `onLand()` / `nearCoast()`; `worldData.ts` is generated by `scripts/make-world.cjs`.
  - `places.ts`: the gazetteer (lon/lat, modern country, port flag). `rivers.ts`: major rivers.
  - `mapview.ts`: pixel map rendering (crisp coastlines, rivers, yarn path, lettered pins with
    collision-free labels). `pins.ts`: pin fan-out layout and tap hit-testing.
  - `clues.ts`: the witness / plaque / leg model with text per reading level, `buildPins()` (right pin +
    wrong era + wrong place + neighbour) and `buildDial()` (place, then era).
  - `gfx.ts`, `font.ts`: pixel drawing and the bitmap font (from Page Quest).
  Clue Compass (K–5 present-day geography) can feed `clues.ts` legs with present-day places, use
  `mapview.ts` with its own views and ignore eras (pins with an empty era).
- `src/game/`: Thread Chasers rules (bands, standards, questions, the engine, scenes, sprites, renderer).
- `src/cases/`: the eight cases (content). `docs/sources.md`: the bibliography.
- `src/kit/`: the shared arcade kit (unchanged copy).

## Known issues / v2

- Witnesses at a bead talk about the *next* bead, so a Saharan bead can show a "sailor"; the framing is
  that Wick's lantern lets them glimpse along the thread.
- The 9–12 Rights case has 7 beads (the plan's table lists 7; the band rule says 5–6).
- The lantern is tight by design at 9–12: one witness per leg plus 3 dead ends uses all 10 hours on the
  longest cases (`npm test` prints the budget per case and band); refuels add slack.
- v2 ideas from the plan: Market stops, Twin Archivists co-op, the Archive of Remembrance (grades 7+,
  after educator review), more cases (river-valley writing, faith on the roads, printing and the
  Reformation, Freedom Wave, Cold War walls, The Box).

## Deploying

Thread Chasers lives in the arcade repository at `games/thread-chasers/` and is published at
`/thread-chasers/` by the arcade's deploy. Vite's `base: "./"` keeps asset paths relative, so `dist/`
works from that subfolder. No separate workflow or hosting config is needed.

## Credits

Created by **SpiderBen10 (NZDO)**. Map data: Natural Earth (public domain) via `world-atlas` (ISC).
Fonts: Press Start 2P and VT323 (Google Fonts), with an in-canvas bitmap font fallback.
