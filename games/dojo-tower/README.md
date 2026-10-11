# Dojo Tower

A side-scrolling martial-arts climb for **SpiderBen10's Arcade** (K–12, North Carolina Standard Course of Study).
A student in a white gi climbs a 5-floor tower. On each floor they punch, kick, jump and duck past cartoon
**Ink Ninjas**, who poof into confetti and ink splats (no blood, nobody gets hurt). At the end of each floor a
**floor master** fights with questions: every right answer lands a combo hit, and a wrong answer is only *blocked*
and shows a kid-friendly explanation. You can never lose a boss fight by answering wrong; it just takes longer.
Three right answers in a row charge the **Thunder Kick** (a double hit on a boss, or T on the floors to clear the screen).

Inspired by the *mechanics* of 1980s tower-climbing kung-fu arcade games. All names, characters and art are
original pixel art drawn in code.

| Floor | Hall | Topic | Floor master |
|---|---|---|---|
| 1 | Word Dojo | ELA (kit ELA bank) | Madame Wordwhirl |
| 2 | Number Dojo | Math (kit generated math, adaptive; 3–5 leans on multiplication/division, 6–8 on integers, K–2 on shapes and number facts) | Abacus Ox |
| 3 | Civics Dojo | Civics: this game's bank (`src/dojo/civics.ts`) + the kit's Civics & Government items | Judge Gavel-Fist |
| 4 | Motion Dojo | Forces and motion: this game's set (`src/dojo/forces.ts`) + the kit's force and motion items | Doctor Momentum |
| 5 | Master's Roof | Mixed | The Grand Inkmaster |

Civics by grade band: K–2 rules, community helpers, leaders and voting; 3–5 the three branches, state and local
government; 6–8 the Constitution, Bill of Rights and amendments; 9–12 how a bill becomes law, rights and responsibilities.
Codes are standard-level (`K.C&G.1`, `3.C&G.1`, `5.C&G.1`, `8.C&G.1`, `CL.C&G.2`, `CL.C&G.3`; science `PS.K.2`, `PS.1.1`,
`PS.3.2`, `PS.5.2`, `PS.7.1`, `PS.Phy.1–3`).

Ninjas carrying a **gold scroll** drop a quick bonus question (energy and points if right; nothing lost if wrong).
Ink stars come high (duck) or low (jump); little ink blobs need a ducking punch or kick. Bumps cost energy;
losing all energy costs one of 3 lives. K–2 get slower, fewer ninjas, bigger text and read-aloud on by default.

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Walk / duck | ← → / ↓ | ◀ ▶ / ▼ |
| Jump | ↑ or Space | ▲ |
| Punch / kick | Z / X | PUNCH / KICK |
| Thunder Kick (meter full) | T | ⚡ |
| Answer | 1–4 or A–D | tap an answer |
| Continue after an answer | Enter or Space | the yellow button |
| Pause / mute / read aloud | P or Esc / M / R | toolbar buttons |

A–D are only ever answer keys, never movement keys.

## Develop

```sh
npm ci
npm test        # tsx scripts/check-rules.ts: question banks, boss rules, headless simulation
npm run build   # tsc --noEmit && vite build
```

`scripts/playtest.cjs` drives the built game in Chromium (global Playwright) at grades 3 and 8, with the keyboard
on a desktop and with touch on a 390px phone; see the comment at its top for how to serve it.
`src/kit/` is an identical copy of the arcade's `kit/`.
