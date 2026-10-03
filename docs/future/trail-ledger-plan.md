# Trail Ledger: US history journey game (plan, not built)

Status (October 2026): planned. Decisions are in a GitHub issue. Grades **5–12 only**: K–4 see a
friendly "for grades 5 and up" screen, and `site/games.js` gets `grades: ["5", …, "12"]`.

## Concept

Pick an **expedition**: a real journey at a turning point in US history. Each one works the same way:

1. Pack within a budget.
2. Travel a map, rationing food and paying your way.
3. Decide what to do when historically grounded events come up.
4. Stop at landmarks to read primary sources.

Everything you do goes into your **Ledger**, a field journal that becomes the mission report.
It borrows the *mechanic* of 1980s journey sims.

- **Title:** Trail Ledger is recommended (no game found by that name); "Many Roads Home" is the
  alternative. Rejected because taken: Liberty Roads, Roads of Time, Lantern Road, Waypoint(s),
  Wayfarer's Ledger.
- **Stay clear of the trademark:**
  - "Oregon Trail" never appears in the title or UI. The real route can be named inside reading
    passages.
  - None of these: tombstones, "You have died of…", a ford/caulk/ferry menu, a hunting mini-game,
    or a profession picker.
  - Screens are original.

## Expeditions (8 designed; v1 = 1, 3, 4)

| # | Expedition | Route | Player's role | Grades |
|---|---|---|---|---|
| 1 | **Wagon Road South, 1753** | Bethlehem, PA to Wachovia (Moravian NC), about 455 miles | settler party | 5–8 |
| 2 | **Race to the Dan, 1781** | Greene's retreat, about 250 miles in 26 days | quartermaster's aide; **no combat**, the pursuit is the clock | 5–12 |
| 3 | **Westward Trail, 1846** | Independence, MO to the Willamette Valley, about 2,000 miles | emigrant family | 5–12 |
| 4 | **Northbound, 1917** (Great Migration) | Durham to Washington, then Philadelphia or New York by rail | a young person writing letters home | 5–12 |
| 5 | **Route 66, 1936** (Dust Bowl) | Oklahoma to the Central Valley | migrant family with a truck | 6–12 |
| 6 | **On the Bus, 1960–61** (Civil Rights) | Greensboro sit-ins, then the Freedom Ride route | student reporter | 8–12 |
| 7 | **Archive mission: Freedom Seekers** (Underground Railroad) | a present-day researcher visits NC Network to Freedom sites | historian / museum intern | 5–12 |
| 8 | **Archive mission: Removal and Return** (Cherokee) | Qualla Boundary, the Museum of the Cherokee People, New Echota | intern working *with* a Cherokee museum educator | 8–12 |

**Why 7 and 8 are archive missions.** Mission US: *Flight to Freedom* (2015), which made students
play an enslaved teenager escaping, drew national criticism and was halted by districts.

- A freedom-seeker or a removed family is never an avatar who can "fail".
- The resource is research time, and there is no fail state.
- People speak through their own documented words: Harriet Jacobs, William Still, Cherokee
  petitions and the Ross letters, and Abraham Galloway.

## Core loop (expeditions 1–6)

1. **Outfit.** Buy within a budget. This is where the money math sits:
   - grade 5: totals and change
   - grades 6–8: unit rates and percent
   - grades 9–12: budgets with constraints
2. **Travel strip.** Set pace and rations. A forecast line does rate math ("Fort Hall in 9 days;
   food lasts 7"), and the player may be asked to compute it.
3. **Events.** A sourced event deck, with every card citing a `source`. Each event offers 2–4
   choices. Outcomes are **setbacks, never deaths**: delays, lost supplies, a broken axle, a detour,
   lower morale, or a sick traveler resting in the wagon.
4. **Landmarks** (5–8 per expedition): a scene, a short passage with a public-domain primary source,
   and 1–2 questions.
5. **Transmissions** between legs, era-flavored: a letter from home, a courier dispatch, a wire from
   the editor.
6. **Arrival**, then the mission report.

**Wrong answers and bad choices:**
- A wrong answer shows the explanation, then a small penalty (a day, or some food).
- Running out of food means stopping to work or trade, which costs days.
- Only the calendar ends an expedition early, as "wintered — retry the last leg from the
  checkpoint".
- No shooting or hunting.

## Grade adaptation

| | Grade 5 | 6–8 | 9–12 |
|---|---|---|---|
| Resources | food, money, days | + parts, morale | + era item, weight limit, trade rates |
| Decisions per leg | 1 simple event | 2 events with trade-offs | 2–3 events whose consequences come later |
| Reading | 40–70 words, read-aloud | 80–120 words, excerpt + gloss | 120–200 words, original spelling, sourcing and bias questions |
| Math | whole numbers, change, division | rates, ratios, percents | d = rt, inequalities, rates of change; grade 12 budgeting tagged EPF |
| Losing | none: hint, then the answer is shown | small penalties | penalties + a tighter calendar |

- **Labels:** recommended expeditions are flagged YOUR LEVEL; the rest stay playable.
- **Adaptive math:** embedded math uses `mathGradeFor(grade)`, and answers call `noteAnswer` or
  `recordAnswer`.
- **Questions:**
  - The game's own era bank (about 25 items per expedition per band, with NC codes).
  - The kit social deck is mixed in only where it is on topic: grades 5, 8 and 11; grade 10 during
    expedition 2; grade 12 for budgeting.

## Sensitive history

- **Principles:**
  - Accurate, non-graphic and multi-perspective.
  - Violence is stated in plain words, never shown.
  - Native nations are named nations: trading partners, guides and diplomats, never "attacks".
  - African Americans appear as watermen, soldiers, writers and organizers.
  - Segregation encounters offer only historically documented responses. The player never enforces
    segregation.
- **Never:**
  - playable enslaved or removed characters
  - capture mechanics
  - slurs, even in quotes
  - mock Native dress or speech, or "savage" framing
  - lynching
  - scores tied to suffering
  - comedy in eras 4, 6, 7 and 8
  - Lost Cause framing
- **Review:**
  - Every event and landmark cites a source, and the test fails without one.
  - A sensitivity checklist for each era.
  - Archive missions ship only after human review. Ideally invite comment from the NC African
    American Heritage Commission and the Museum of the Cherokee People.
  - Prices that can't be sourced are labeled "game numbers".

## Learning design

- **Standards** (verify the objective numbers; use standard-level codes where unsure):
  - Grade 5: 5.G.1.2, 5.G.1.3, 5.H.1.1, 5.H.1.3, 5.E.2.2
  - Grade 8: 8.H.1.1–1.5 (8.H.1.5 historical decision-making fits every event choice), 8.G.1.2,
    8.E.1.1, 8.B.1.1
  - American History: AH.G.1.1, AH.G.1.3, AH.H.1, AH.E.1, AH.C&G.1, AH.B.1
  - Math codes; EPF.MCM.1.1
- **Primary sources** (public domain):
  - Moravian records
  - Greene's letters
  - Hastings's *Emigrants' Guide* (1845)
  - Great Migration letters (Scott, 1919)
  - FSA photographs (Library of Congress)
  - Jacobs, Still, Douglass
  - Cherokee Memorials and Ross letters

  Modern copyrighted texts are paraphrased.
- **Report:**
  - results by standard
  - a Ledger summary (miles, days vs. the historical pace, food per person per day, money)
  - practice next, with the expedition that covers the weakest standard

## Look, scope, tests

- **Screens:** a side-view travel strip with the Ledger panel, a period map, a store shelf, landmark
  scenes, and a sepia archive desk for missions 7 and 8.
- **Characters and music:**
  - Original characters, which Nathan can design.
  - The arcade hero appears only as the museum guide, never as a period character.
  - Era chiptune motifs.
- **Size:** L, about 1.3× Page Quest for v1. One data-driven simulation is fed by an era file per
  expedition. v1 is about 225 bank items and about 20k words.
- **Tests:**
  - the resource simulation is checked against a reference
  - every era is finishable at every grade
  - every math answer is recomputed
  - every event cites a source
  - a banned-word lint
  - a reading-level check per band
  - a playtest at grades 4 (gate screen), 5, 8 and 11
- **Two-player** (v2): "Wagon Council" pass-and-play. Each player answers at their own grade, and
  events become a vote.

## Open decisions (recommendations in bold)

1. Title: **Trail Ledger**, after USPTO and domain checks.
2. Underground Railroad and Cherokee removal: **archive missions, only after human review**. If no
   review is possible, cover the topics through landmarks in other eras.
3. Codes for grades 6, 7 and 9, which are world-history years: **grade 8 codes labeled "preview"**.
4. v1 eras: **Wagon Road, Westward Trail and Northbound**. Alternative: swap in Race to the Dan for
   the America 250 year.
5. When food runs out: **stop to work** (costs days), not a health spiral.
6. Numbers: **real distances and dates; prices labeled "game numbers" unless sourced**.
7. Hero inside eras: **no, museum guide only**.
8. Grade 12 budgeting tagged EPF: **yes**.

Sources for this plan include NCpedia and the Encyclopedia of Greater Philadelphia (Great Wagon
Road), the Journal of the American Revolution and America 250 NC (Race to the Dan), the Oregon
Encyclopedia, the National Humanities Center (Great Migration letters), the NPS (Freedom Riders and
the Cherokee lessons), UNC (Network to Freedom), Education Week (the Flight to Freedom debate) and
NC DPI standards documents.
