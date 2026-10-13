# Dojo Tower

A side-scrolling martial-arts climb for **SpiderBen10's Arcade** (K–12, North Carolina Standard Course of Study).
A student in a white gi climbs a 10-floor tower. On each floor they punch, kick, jump and duck past cartoon
**Ink Ninjas**, who poof into confetti and ink splats (no blood, nobody gets hurt). At the end of each floor a
**floor master** fights with questions: every right answer lands a combo hit, and a wrong answer is only *blocked*
and shows a kid-friendly explanation. You can never lose a boss fight by answering wrong; it just takes longer.
Three right answers in a row charge the **Thunder Kick** (a double hit on a boss, or T on the floors to clear the screen).

Inspired by the *mechanics* of 1980s tower-climbing kung-fu arcade games. All names, characters and art are
original pixel art drawn in code.

### Floors and scenery (`src/dojo/floors.ts`)

| Floor | Scenery | Belt | MIXED topic | MIXED floor master (hall) |
|---|---|---|---|---|
| 1 | Crimson Hall | white | ELA (kit ELA bank) | Madame Wordwhirl (Word Dojo) |
| 2 | Sapphire Hall | yellow | Math (kit generated math, adaptive; 3–5 leans on multiplication/division, 6–8 on integers, K–2 on shapes and number facts) | Abacus Ox (Number Dojo) |
| 3 | Jade Hall | orange | Civics: this game's bank (`src/dojo/civics.ts`) + the kit's Civics & Government items | Judge Gavel-Fist (Civics Dojo) |
| 4 | Violet Hall | green | Forces and motion: this game's set (`src/dojo/forces.ts`) + the kit's force and motion items | Doctor Momentum (Motion Dojo) |
| 5 | Moonlit Roof (night) | blue | Mixed | The Grand Inkmaster (Ink Moon Terrace) |
| 6 | Bamboo Garden (sunny day) | purple | ELA | Sir Spellsalot (Spelling Castle) |
| 7 | Lantern Hall (evening) | red | Math | Professor Protractor (Angle Hall) |
| 8 | Waterfall Bridge (rope bridge over a river) | brown | Civics | Senator Scroll (Senate Steps) |
| 9 | Snowy Temple (dusk, falling snow) | black | Forces and motion | Major Magnet (Magnet Mill) |
| 10 | Cloud Peak (sky dojo above the clouds) | gold | Mixed | Grandmaster Skybrush (Sky Dojo) |

Floors 1–5 play exactly as before. Floors 6–10 get a little longer, quicker and busier each floor and send a few more
star-throwers; K–2 gets a much gentler rise (no extra ninjas on screen, smaller speed-up, longer gaps). Boss HP: floors 1–4
4 (K–2: 3), floors 5–9 one more, floor 10 two more. A game over on floor 6 or higher offers **Continue from floor 6**
(same subject and masters, 3 new lives, the score starts over); the report lists the masters beaten so far.

### Floor masters (`src/dojo/bosses.ts`)

Each subject has its own roster of ten masters (nine plus a grand master on floor 10), so a run never meets the same
master twice and every master matches what the run asks. Picking one topic puts the masters who know that topic first
(e.g. Math → Ratios & rates opens with Ranger Ratio). The floor name (hall) follows the master. Every master has a look
(body, head, hat, prop, colours and size; the original five keep their hand-drawn sprites), an intro line and
block / hit / defeat lines.

| Subject | Floors 1–10 |
|---|---|
| Math | Abacus Ox, Count Tallyho, The Fraction Fox, Professor Protractor, Madam Multiply, Ranger Ratio, The Prime Panda, The Algebra Owl, Baron Decimal, **Empress Infinity** |
| Science | Doctor Momentum, Professor Petri, Captain Magma, The Weather Witch, Major Magnet, Granny Greenleaf, Commander Comet, Baron Bubbles, Doctor Dina Bones, **Professor Quark** |
| ELA | Madame Wordwhirl, Sir Spellsalot, The Grammar Goblin, Captain Comma, Lady Rhymesworth, The Plot Twister, Baron Vocabulon, Professor Paragraph, Sumo Syllable, **The Grand Lexicon** |
| Social Studies | Judge Gavel-Fist, The Map Monk, Professor Timeline, Madam Market, Captain Compass, Senator Scroll, Barter Bear, Grandpa Chronicle, Mayor Ballot, **Chancellor Globe** |
| MIXED | the table above |

Civics by grade band: K–2 rules, community helpers, leaders and voting; 3–5 the three branches, state and local
government; 6–8 the Constitution, Bill of Rights and amendments; 9–12 how a bill becomes law, rights and responsibilities.
Codes are standard-level (`K.C&G.1`, `3.C&G.1`, `5.C&G.1`, `8.C&G.1`, `CL.C&G.2`, `CL.C&G.3`; science `PS.K.2`, `PS.1.1`,
`PS.3.2`, `PS.5.2`, `PS.7.1`, `PS.Phy.1–3`).

## Subjects and topics

The title screen has a subject row like the other arcade games: **MATH · SCIENCE · ELA · SOCIAL STUDIES · MIXED**.
**MIXED** (the default) is the classic tower above. Picking one subject makes every floor master and every gold scroll
ask that subject (with that subject's ten masters on the title list, banners and report), and shows a topic row: **ALL <SUBJECT>** (any topic) and then that subject's topics. Topics a grade
can't fill are shown disabled with the grades that have them (e.g. "Grades 6–8"). The scenery stays the same; the masters
come from the subject's roster, and the floor banner, boss banner and question header show the topic. The choice is saved in `arcade.dojo-tower.subject`
and `arcade.dojo-tower.topic`, and re-checked when the grade changes (a topic the new grade lacks becomes ALL).

Topic ids are the arcade menu's, so the menu can deep-link: `?topic=ratios` preselects Math → Ratios & rates for that
visit (ignored, with a short note, if the grade doesn't offer it); `?subject=science` (or `mixed`) picks a subject with ALL.

| Subject | Topics (id) | Offered at |
|---|---|---|
| Math | Numbers & operations (`numbers`) | K–8 |
| | Factors, multiples, GCF & LCM (`factors`) | 4–7 |
| | Ratios & rates (`ratios`) | 6–8 |
| | Fractions & decimals (`fractions`) | 3–7 |
| | Algebra & equations (`algebra`) | 6–12 |
| | Geometry, area & volume (`geometry`) | K–1, 3–12 |
| Science | Life (`life`), Earth & space (`earth`), Physical (`physical`) | K–12 |
| ELA | Reading (`reading`), Grammar & words (`grammar`) | K–12 |
| | Phonics & spelling (`phonics`) | K–3 |
| Social Studies | Civics & government (`civics`), History (`history`), Geography (`geography`), Economics (`economics`) | K–12 |

Questions are sorted into topics by their NC code and skill (`src/dojo/focus.ts`, `classifyTopic`): math by domain
(RP ratios; NF and fraction/decimal NS/NBT skills fractions; OA/NBT/CC/NS numbers; factors, multiples, primes, GCF/LCM
factors; EE, F and high school A/F/N algebra; G, area/perimeter/volume/angle MD and high school G geometry; statistics has
no topic), science by PS/LS/ESS, ELA by RL/RI (reading), RF and spelling (phonics), L/W (grammar), social studies by
C&G/H/G/E (EPF is economics). Math topics filter fresh generated questions (bounded retries, recent prompts skipped); a
topic is offered when the grade's generators make at least 8 different questions (K–8 may use the grade just below in
the same band, e.g. grade 8 ratios use grade 7's). Written topics use the kit banks (no passages) plus this game's civics
and forces sets: the grade's own items, then the grades next to it, then its band, until there are 12; offered at 8 or more.

Ninjas carrying a **gold scroll** drop a quick bonus question (energy and points if right; nothing lost if wrong).
Ink stars come high (duck) or low (jump); little ink blobs need a ducking punch or kick. Bumps cost energy;
losing all energy costs one of 3 lives. K–2 get slower, fewer ninjas, bigger text and read-aloud on by default.

**Ink-star burst.** The teal-belted star-throwers fill a counter (HUD **★ n/5**). Poofing the fifth grants about
8 seconds of foam ink stars (a draining timer bar in both HUDs): press **S** or tap **★** to throw one along the floor
(short cooldown). They poof ninjas, blobs and incoming ink stars ahead; a poofed scroll ninja still opens its question.
The timer only runs while you are on the floor (not during questions or a boss fight), throwers don't count during a
burst, and the counter resets to 0 when it ends. Floor masters can't be hit by ink stars: stars vanish when a master
arrives and S does nothing in a boss fight, which stays answer-driven.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Walk / duck | ← → / ↓ | ◀ ▶ / ▼ |
| Jump | ↑ or Space | ▲ |
| Punch / kick | Z / X | PUNCH / KICK |
| Thunder Kick (meter full) | T | ⚡ |
| Throw ink stars (during a burst) | S | ★ |
| Answer | 1–4 or A–D | tap an answer |
| Continue after an answer | Enter or Space | the yellow button |
| Pause / mute / read aloud | P or Esc / M / R | toolbar buttons |

A–D are only ever answer keys, never movement keys. S is only the ink-star key (it does nothing while a question is open).

## Develop

```sh
npm ci
npm test        # tsx scripts/check-rules.ts: question banks, boss rules, headless simulation
npm run build   # tsc --noEmit && vite build
```

`npm test` also draws 60 questions for every grade × topic (and every ALL <SUBJECT>) and checks each one's topic, choices,
answer, explanation and variety; that topics not offered really lack questions; `?topic=` parsing; the grade-change
fallback; and (through Vite's SSR loader) that MIXED is unchanged. For the ten floors it checks: every roster, MIXED and
every topic plan gives ten different masters of the right subject, each with a name, hall, look and lines, and every two
masters look clearly different; floors 6–10 have their own scenery; floors 1–5 play as before and 6–10 get harder (gentler
for K–2); a bot walks and clears all ten floors in every band; wrong answers never lose a boss fight; the ink-star counter,
burst, cooldown, expiry, reset and poofs, and that stars never touch a master; and the floor-6 checkpoint.
`scripts/playtest.cjs` drives the built game in Chromium (global Playwright) at grades 3 and 8, with the keyboard
on a desktop and with touch on a 390px phone (the desktop run skips to floor 10 with the `?debug` hook and clears the
tower), then the floor masters (MATH at grade 5 and SCIENCE at grade 8: title list and first master, floor 10 and the
tower-cleared report; MIXED order; Continue from floor 6), the ink stars (keyboard S, and the ★ button on 390px and
360px phones; the title opens scrolled to the top), then the subject/topic picker (grade 7 Math → Ratios, `?grade=4&topic=civics`,
`?grade=2&topic=ratios`, ALL SCIENCE, 390px and 360px phones); see the comment at its top for how to serve it (`BASE=`).
`src/kit/` is an identical copy of the arcade's `kit/`.
