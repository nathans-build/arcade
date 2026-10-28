# Dojo Tower: Rates & Percents

**SpiderBen10's special edition** of Dojo Tower for **SpiderBen10's Arcade** — Math 6 · Unit 3 (Unit Rates and
Percentages). Dev only (no `prod` flag in `site/games.js`). The curriculum source of truth is
[`docs/math6-unit3.md`](../../docs/math6-unit3.md): every skill, sample, mistake to catch, conversion fact, skill tag,
generator rule and design rule there is followed, and nothing from its "Out of scope" list is used.

The climb is Dojo Tower's: a side-scrolling kung-fu tower where cartoon **Ink Ninjas** poof into confetti (no blood,
nobody gets hurt) and a **floor master** at the end of each floor fights with multiple-choice questions. A right answer
lands a hit; a wrong answer is only *blocked* and shows feedback that **names the mistake** ("That's the discount —
what does the customer pay?"). You can never lose a boss fight by answering wrong. Questions are never timed: the action
freezes while a question is open. All names, characters and art are original.

## Floors (`src/dojo/bosses.ts`) — a full climb is 7 floors, about 10–15 minutes

| Floor | Section · skills | Floor master (hall) | COMBO story problems |
|---|---|---|---|
| 1 | A · estimating with rates (window washers, tower floors, the Burj Khalifa elevator, stairs) | Captain Skyline (Skyscraper Lookout) | — |
| 2 | B · sensible units, converting both ways (fractions too), price per unit after a conversion | Madam Measure (Unit Swap Shop) | — |
| 3 | C · comparing speeds and prices, two unit rates, same rate?, unit price to the cent | Merchant Marigold (Deal or Steal Bazaar) | Deal or Steal: two stores → buy *m* at the cheaper one |
| 4 | C · speed vs pace, multi-step rate problems, recipe batches with ½ ⅓ ¼ ⅔ 1½ | Racer Quickstep (Race Day Track) | Race Day: pace → time; speed → pace → time; how much sooner |
| 5 | D · percent per 100 (incl. > 100%), double number lines, tape diagrams, benchmarks | The Per-Cent Panda (Hundred-Step Garden) | Fill the Barrel: one tape piece → whole → how much more |
| 6 | D · find the part / whole / percent (mixed), discounts, tax and tips | Madam Markdown (Mall Rush Arcade) | Supply Run: unit price → cost of *n* → % off → % tax |
| 7 | E · Paint the Room (grand master) | Grandmaster Brushstroke (Paint the Room Studio) | every question: walls → minus door/windows → coats ÷ coverage, round UP → cheapest way to get ENOUGH (the cheap-per-gallon bucket trap) → plus tax |
| ★ | Bridge (7th grade) · copier %, "enlarged BY 50%" = 150%, area × factor², going back, map scales | The Scale-Up Sensei (Copy Room) | — (floor 7's gold scrolls also ask bridge bonus items) |

Floors are shorter than Dojo Tower's (one gold-scroll ninja per floor); masters have 3 HP (the painter 4).
A game over offers **Continue** on the same floor with 3 new lives (the score is kept).

**COMBO story problems.** On floors 3–6 the master's second question is a short story (2–4 steps); on floor 7 every
question is a Paint the Room job. The player first gets the FINAL answer, whose wrong choices are the step answers
("That's only step 2 — keep going!"). Right first try = **BIG COMBO** (a double hit plus 1,000 bonus points). If not,
the problem breaks into its steps: each is its own question with its own skill tag, the story and a "work so far" list
stay on screen, every right step is a hit, and the master *hangs on* at 1 HP until the last step (which asks the final
answer again), so the story always finishes. The chain is tagged *Multi-step rate problems*, *Percents with tape
diagrams*, *Discounts, tax, and tips (two-step)* or *Multi-step project (Painting a Room)*.

## Title screen

No grade or subject picker. "SpiderBen10's special edition · Math 6 Unit 3", then **Practice**: **FULL CLIMB** (default)
or one section — A, B, C (floors 3–4), D (floors 5–6), E (floor 7) or BRIDGE (the bonus floor). The choice is saved in
`arcade.dojo-rates.practice`.

## Questions (`src/dojo/unit3.ts`, `src/dojo/u3deck.ts`)

Pure generators (52 kinds + 5 combo stories), fresh numbers every time, every answer computed in code, money in whole
cents (always 2 decimals, with round-to-the-cent items), percents mostly multiples of 5 and benchmarks plus 6/12/35 and
125/150/200%, fractions ½ ⅓ ¼ ⅔ 1½ in batch and conversion items, conversions alternating to-smaller / to-bigger units,
and four unique choices whose wrong ones come from real mistakes (the step-one answer, the flipped division, the decimal
in the wrong place, the unrounded value, rounding paint down). Each question carries its skill tag (the 18 names in
section 5 of the doc), a two-stage hint (a nudge, then a worked step — never the answer), per-choice mistake feedback,
and, for rate and percent items, a **model** drawn under the question: a double number line, a tape diagram or a ratio
table with "?" for the unknown. The deck never repeats a kind twice in a row; about half of a full climb's items need
two or more steps (the doc asks for at least 1 in 4). The four weak spots (stopping after step one, rounding money to
the cent, batches with fractions, picking multiply vs divide) each have dedicated items and named distractors.

**Hints:** HINT button or **H** — the first press shows stage 1, the second stage 2; hints used are recorded.

## Results, retry and export (`src/dojo/attempts.ts`)

The results screen lists right/total and hints used **by skill tag**. **Redo the ones I missed** starts a short
boss-only round (Sensei Second-Chance, Retry Dojo) with new numbers for the missed tags (2 questions per tag, 3–8).
Every answer is saved in `localStorage` (`arcade.dojo-rates.log.v1`, the last 500) and can be exported as **CSV** or
**JSON** (this round, or everything saved) with the fields: date, game, skill tag, question, answer given, correct answer,
correct/incorrect, hints used. High score: `arcade.dojo-rates.progress.v1` (kit progress).

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Walk / duck | ← → / ↓ | ◀ ▶ / ▼ |
| Jump | ↑ or Space | ▲ |
| Punch / kick | Z / X | PUNCH / KICK |
| Thunder Kick (meter full) | T | ⚡ |
| Throw ink stars (during a burst) | S | ★ |
| Answer | 1–4 or A–D | tap an answer |
| Hint (stage 1, then 2) | H | HINT |
| Continue after an answer | Enter or Space | the yellow button |
| Pause / mute / read aloud | P or Esc / M / R | toolbar buttons |

A–D are only ever answer keys, never movement keys. Works at 390px wide (big tap targets; the toolbar keeps
`position: relative; z-index: 10` above the overlays, which leave room for it at the top).

## Develop

```sh
npm ci
npm test        # tsx scripts/check-rules.ts (questions, combos, rules, simulation, plans, log) + scripts/check-music.ts
npm run build   # tsc --noEmit && vite build
```

`npm test` generates 1,200 questions of every kind (thousands per section) and 800 of every combo story and checks:
each answer against an independent recomputation, 4 unique choices with the answer present, a named mistake for every
wrong choice, two different hint stages that never give the answer away, money with 2 decimals, at least 25% two-step
items in a full-climb mix, conversions both directions about equally, every skill tag 1–18 produced, no negative
numbers, no out-of-scope wording, each combo's steps recomputing to the final answer (and the last step asking it
again), the final's wrong choices including each intermediate step value in the same units, Paint the Room's round-up
and bucket trap (independent exhaustive search); the boss rules (BIG COMBO, hanging on); the headless simulation from
Dojo Tower (all 7 floors, every practice choice, the retry round); the attempt log cap and export fields; and a privacy
scan of the game's own files. `scripts/playtest.cjs` drives the built game in Chromium on a desktop (keyboard) and a
390px phone (touch); see the comment at its top for how to serve it (`BASE=`); `SHOT=` saves the menu picture.
`src/kit/` is an identical copy of the arcade's `kit/`; `src/music.ts` and the climb's art come from Dojo Tower.
