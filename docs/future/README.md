# Future games: notes for later development

Games designed but not built yet. Each has a full design plan in this folder:

| Game | Plan | In one line |
|---|---|---|
| **Family Road Trip** | [family-road-trip-plan.md](family-road-trip-plan.md) | Original cartoon family road-trips across North Carolina; 1–2 player co-op side-scroller; each stop ends with a team quiz "boss". Inspired by 1990s family arcade brawlers, but no fighting people and no resemblance to any TV show. |
| **Sonar Squad** (working title) | [grid-battle-plan.md](grid-battle-plan.md) | Battleship-style grid game where calling a shot is reading a coordinate; vs the computer first, then pass-and-play and online two-player by room code. |
| **Critter Quest** | [critter-quest-plan.md](critter-quest-plan.md) | Explore four subject zones and "sync" original critters by answering questions; critters evolve only when NC standards are mastered. Creature-collecting fun, entirely original (nothing Pokémon-like). |

Status (September 2026): planned, not started. Both were meant to follow the social studies
question bank (`kit/banks/social/`), which the Outer Banks stop and the Map Mesa zone need.

Business notes (also for later):

- [freemium-plan.md](freemium-plan.md): a free arcade with a paid family plan and later a classroom
  tier; what to charge for, legal must-dos (trademarks, COPPA), and the tech it needs.
- [80s-90s-game-ideas.md](80s-90s-game-ideas.md): 12 ranked ideas for new games from 80s/90s
  classics (Clue Compass, Splash Arc, Syllable Jam, Wagon Road South…) and a suggested build order.
- [brand-and-domains.md](brand-and-domains.md): name and `.com` research for a brand that doesn't
  lean on other companies' trademarks.

Open decisions for these are GitHub issues #16 (freemium), #17 (brand and domain) and #18 (grid battle game).

## Open decisions

Recommended answers are in the right-hand column; confirm or change them before building.

### Family Road Trip

| # | Question | Recommendation |
|---|---|---|
| 1 | How does player 2 pick their grade? | Inside the game, after P2 joins (keeps the arcade menu simple). |
| 2 | Keep player 2's scores and progress separate? | Yes: separate `gameId` per player, so each kid gets their own report and practice list. |
| 3 | Two-player on iPad landscape only? | Yes; portrait still works for one player. |
| 4 | Keyboards can drop keys when two kids hold several at once. | Two-keyboard-layout plus a "test your keys" screen in v1; gamepads in v2. |
| 5 | Screen to rename the family? | Yes, a simple name screen in v1; custom drawings later. |
| 6 | Who designs the family? | Placeholders (Hank, Rosa, Juno, Pip) until Nathan renames/redraws them. |

### Critter Quest

| # | Question | Recommendation |
|---|---|---|
| 7 | May Critter Quest read other games' saved progress (`arcade.<id>.progress.v1`) for "Training Snacks"? | Yes: read-only, on-device, capped. |
| 8 | Shared `kit/profile.ts` in every game now, or mastery inside Critter Quest for v1? | Inside Critter Quest for v1; a shared profile is a separate later step. |
| 9 | Mastery rule (8 of last 10 right, on 2 different days)? | Yes, plus at least 2 different questions per standard, so memorising one answer doesn't count. |
| 10 | Critter names and designs? | **Ask Nathan first.** Ship the planner's originals only after checking no franchise uses each name; sprites live in a data file Nathan can edit. |
| 11 | Separate save slots for siblings sharing an iPad? | v2. v1: one save per device plus an export/import code. |

### Both / arcade-wide

| # | Question | Recommendation |
|---|---|---|
| 12 | Keep loading the retro fonts from Google, or bundle them? | Bundle them in the site so nothing loads from outside the arcade. |
| 13 | Written banks are small (18 per subject per grade). Grow them? | Yes, toward 40–50 per grade; matters most for Critter Quest mastery and replay. |

## Things the planners found in the code

- `QuestionDeck` silently serves math when a written bank is empty; games that depend on a subject
  (the Outer Banks stop, the Map Mesa zone) must check `bankFor(subject, grade)` themselves.
- The kit can't draw a question for a specific standard; Critter Quest would filter `bankFor(...)` and
  `MATH_GENERATORS` by standard (no kit change needed).
- A and D are answer keys in every game, so walking uses arrows / touch, never WASD.
- No two-player game exists yet, so co-op input is new ground for Family Road Trip.
