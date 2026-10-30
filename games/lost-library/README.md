# Quest of the Lost Library

A top-down adventure for **SpiderBen10's Arcade** (K–12, North Carolina Standard Course of Study). You are
**Pip Lampwick**, junior page-keeper, with a feather duster and a lantern. Explore a hub and its wings, push crates,
light torches, find a magic item in each wing, open **Question Doors** with right answers and answer each wing's
**guardian** to restore it. Wrong answers never cost a heart and never lose a guardian talk: they explain and ask
another question. All names, characters, art and music are original and drawn / written in code.

The title screen is **Choose your quest**: five quests, each with a live preview of its hub, progress (wings
restored), CONTINUE / NEW (or START), keyboard (arrow keys between cards, Enter starts or continues) and touch.
Each quest has its own save; Quest 1 keeps the original save key, so existing players keep their progress.

## The quests

| # | Quest (`src/library/…`) | Hub | Wings: subject (MIXED) · item · guardian | Final room · guardian | Pests | Music |
|---|---|---|---|---|---|---|
| 1 | **The Lost Library** (`world.ts`) | Bramblebury Town | Math · Bookmark Boomerang · Sir Tallyshell; Science · Grappling Quill · Professor Petri; Story (ELA) · Magnifier · Inkwhisker; History & Maps · Echo Bell · Kitewing | Reading Room · the Ink Smudge | dust bunnies / ink sprites | Bramblebury Square, Hushed Stacks, The Reading Room |
| 2 | **The Sunken Lighthouse** (`quests/lighthouse.ts`) | Saltwhistle Cove (guide: Dot the whale shark) | Coral Gardens: science · **Bubble Shield** · Professor Pufferton; Tide Halls: math · Anchor Hook · Octavia Eightfold; Shipwreck Archive: ELA · Conch Boomerang · Captain Quillfin | The Lamp Room · Old Murkle the sea fog | crabs / jellyfish (poof into bubbles) | Saltwhistle Shanty (6/8), Under the Waves |
| 3 | **The Clockwork Castle** (`quests/clockwork.ts`) | Tickhollow Courtyard (Tinpenny the tin caretaker) | Gear Works: math · **Wind-up Key** · Baron Sprocket; Pendulum Hall: social studies · Magnet Glove · Lady Chimewell; Toy Workshop: science · Spring Yo-yo · Professor Windleby | The Clock Tower · Old Tock | wind-up mice / toy soldiers (pop into springs) | Tickhollow March, Gears and Springs |
| 4 | **The Volcano Observatory** (`quests/volcano.ts`) | Ashfall Trail (Dr. Basalta) | Magma Labs: science · **Heat-proof Lantern** · Professor Cindersnout; Steam Tunnels: math · Echo Horn · Kettleby; Star Dome: social studies · Star Lens · Astra | The Great Telescope · Old Rumble | smoke puffs / ember sprites (poof into sparks) | Emberpeak Trail, Rumbling Deep |
| 5 | **The Haunted Museum** (`quests/museum.ts`), silly, never scary | Mossbrook Museum Plaza (Curator Mopsy) | Dinosaur Hall: science · **Ghost Lantern** · Tickletooth; Armor Gallery: social studies · Banner Hook · Sir Rattleby; Ancient Wing: ELA · Scarab Boomerang · Naphotep | The Grand Gallery · Lady Gigglewhisp | dust bunnies / ghost wisps (giggle away) | Mossbrook Stroll, Tiptoe Through the Exhibits |

Room counts: 34 (the Lost Library), 23, 23, 25 and 24. Each wing has a small key from a puzzle, a Question Door, a
locked door, a map, an item chest, a bonus treasure chest and a 2 × 2 guardian; its own item is needed to reach its
guardian. Each wing's guardian gives back a treasure (books, pearls, golden gears, star shards, medals) with a true
fun fact; the final guardian (4 right answers) asks all four subjects. Each quest has a story intro (its helper) and
outro (ending screen), its own palette, walls, floors, decorations, crates, landmark on the sealed gate, helper,
pests and guardians (`render.ts`, `art.ts`), and its own songs (`src/music.ts`, one hub theme and a wing theme with
a variation per wing and for the final room).

## Tiles (`src/library/quest.ts`)

| Tile | What it is |
|---|---|
| `#` `W` | wall; building wall (a gate house in the hub) |
| `.` `,` `=` `f` `E` | floor, rug, path, flowers (all floor); `E` is where a pest appears |
| `B` `S` | pushable crate; pressure switch |
| `T` `Y` `R` | cold torch (lantern: face it, press X); lit torch; crystal switch (thrown items) |
| `_` `o` `i` | gap / chasm / lava river; hook post (grapple items pull you to it); hidden bridge / invisible floor (reveal or ghost items) |
| `^` | hazard puddle (ink, sea urchins, oil, lava, spilled paint): costs a heart from grade 3 up, harmless to walk on for K–2 |
| `K` `k` `M` `m` `C` `c` | small key, map, chest (lower case: appears when the room's puzzle is solved) |
| `N` `F` `G` `P` | sign; the quest's helper (talks, refills hearts); guardian (2 × 2); gate (a sealed one opens when every wing is restored) |
| `t` `~` `O` | tree / plant, water (or magma pool), decoration (all solid) |
| `l` `w` `u` | **tide lever** (Enter flips the room's tide); **tide pool** (deep at high tide, wet sand at low tide); **floating dock** (walkable at high tide, sunk at low tide). If the water moves under you, a gentle wave floats you back to the doorway. |
| `j` | strong current / jellyfish bloom: only a bubble shield gets you through (deep water too) |
| `z` `\|` | **clock switch**: step on it to open the room's **timed gates** for `RoomDef.timer` seconds (K–2: 1.5 ×); a gate stays open while you stand in it |
| `<` `>` `A` `V` | **conveyor** / current / updraft / moving walkway: carries you until it ends |
| `&` `$` | **wind-up post** (wind-up key: face it, press X); **clockwork bridge**: a gap until every post in the room is wound |
| `b` | **cooled-rock bridge**: a lava gap until the room's puzzle is solved |
| `h` `*` | **hot rock** (walkable while you carry a heat item); **magma crystal** (the heat item lights it) |
| `%` | **steam vent**: puffs on a rhythm (`RoomDef.vent`, default 1.2 s on / 1.6 s off, K–2 rests 1.5 ×); blocked while puffing, and a puff blows you along |
| `q` | **friendly ghost**: invisible until a ghost item reveals it, then it talks (`RoomDef.ghost`) |

Puzzles (`RoomDef.puzzle`): `blocks`, `torches`, `crystal`, `secret`, `magma`, `winders`. Doors: `open`, `locked`,
`question`, `shutter` (opened by a puzzle), `hidden` (found by an echo or ghost item).

## Items (`ItemDef.power`)

| Power | Items | What X does |
|---|---|---|
| `boomerang` | Bookmark Boomerang, Conch Boomerang, Spring Yo-yo, Scarab Boomerang | flies over gaps, hits crystal switches, tidies pests, comes back |
| `grapple` | Grappling Quill, Anchor Hook, Magnet Glove, Banner Hook | pulls you across a gap to a hook post |
| `reveal` | Magnifier, Star Lens | shows hidden bridges and secret writing |
| `echo` | Echo Bell, Echo Horn | finds hidden doors |
| `bubble` | Bubble Shield | a bubble for 10 steps (K–2: 14): deep water and currents |
| `windup` | Wind-up Key | winds wind-up posts |
| `heat` | Heat-proof Lantern | carried: hot rock is safe; X lights magma crystals |
| `ghost` | Ghost Lantern | shows invisible floors and friendly ghosts, opens secret doors |

## Subjects, grades and topics

Grade K–12 comes from the arcade (`?grade=`) or the title screen. **MIXED** (default) gives each wing its own subject
(see the table) and the final guardian all four. One subject (and optionally one topic, `focus.ts`; the arcade menu
deep-links with `?topic=`, `?subject=`) makes every Question Door and guardian of every quest ask that. Math is the
kit's generated, adaptive math; science, ELA and social studies come from the kit banks (no passages). K–2: bigger
text, read-aloud on by default, more hearts, fewer and slower pests, harmless hazard puddles, longer timers, longer
bubbles and slower steam vents. `?quest=<id>` preselects a quest.

Storage keys: `arcade.lost-library.save.v1` (Quest 1), `arcade.lost-library.save.<lighthouse|clockwork|volcano|museum>.v1`,
`arcade.lost-library.quest` (the quest picked last), `arcade.lost-library.subject` / `.topic`.

## Controls

Arrow keys walk · Z feather duster · X use item · S swap item · Enter talk / read / open / pull levers · Esc map & pause ·
1–4 or A–D answer (A–D are never movement keys) · M mute · R read aloud. Touch: d-pad, DUST, ITEM, TALK, MAP.

## Tests

`npm ci && npm test && npm run build` (strict tsc).

- `scripts/check-rules.ts`: the original Lost Library checks (unchanged), then for **every quest**
  (`scripts/quest-checks.ts`): map data (tiles, borders, every door joins grid neighbours and agrees on both sides,
  door gaps open onto floor, signs, warps, puzzles, mechanics have what they need), and the headless solver
  (`src/library/solver.ts`, the real game rules) proves for K–2 and grade 3+: every wing is solvable from its entrance
  with nothing in hand, the wing can't be finished without its item, the whole quest from a fresh save, collect
  everything (every treasure, map, chest and door), timed rooms solvable at twice the real walking time, and no
  softlock after random play (only "Reset room" allowed). Plus unit tests of every new mechanic, Question Doors
  (a wrong answer changes nothing), guardians, saving, and every Question Door and guardian of every quest drawing
  valid questions for every subject at every grade (Vite SSR, the kit's real banks).
- `scripts/check-music.ts` (identical in every game): every song and jingle.
- `scripts/playtest.cjs` (Playwright, against the built game; `BASE=http://127.0.0.1:<port>/lost-library/`): the
  original desktop / phone / topic-link playtests, then the quest picker on desktop (each new quest started from its
  card, walked into its first wing, Question Door wrong then right, back to the picker, Quest 1's save untouched) and
  on a 390 px phone (touch d-pad, tapping answers, MUSIC / SFX tappable over the picker and messages).

## How to add a quest

1. Copy a quest file in `src/library/quests/` (they are plain data: `QuestDef` in `quest.ts`). Pick a unique `id`,
   `saveKey: "arcade.lost-library.save.<id>.v1"`, a `theme`, room ids that don't clash with the Lost Library's, and
   3–4 wings, each with its own subject and item (an existing `ItemPower`).
2. Draw rooms with the tile legend (20 × 12, solid `#` border; doors are carved automatically in the middle of each
   side). Give each wing: an entrance with `exit` to its gate front in the hub, a puzzle that gives a small key, a
   Question Door, a locked door, a map, an item chest, a room only the item can finish, a bonus chest (`bonusRoom`)
   and a `GUARDIAN_HALL`. The hub needs one gate (`P` + `warp`) per wing and a `sealed` gate to the final room.
3. Add treasures (wings × 2 + 1, true fun facts), guardians (wing guardians need 3, the final one 4), helper and story
   texts, `gateColor`, `pests` and `music` keys. New guardian / helper / pest art goes in `art.ts`; a new theme needs
   its cases in `render.ts`. Songs go in `src/music.ts` (`SONGS`).
4. Add the quest to `QUESTS` in `quests/index.ts`, then run `npm test`: the checks prove it solvable and point at any
   map problem. A brand-new mechanic belongs in `game.ts` (generic tile), `solver.ts` (`usefulActs`, light state if it
   is reversible) and the legend above, with a unit test in `checkMechanics`.
