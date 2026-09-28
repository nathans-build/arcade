# Arcade kit

Shared code for every game in SpiderBen10's Arcade. Each game repository keeps an
identical copy in `src/kit/` (imported as `@/kit`). The canonical copy lives in
`nathans-build/arcade` under `kit/`; after changing it, copy the folder into each game.

| File | What it gives a game |
|---|---|
| `types.ts` | `Question`, `Grade`, `Subject` |
| `grades.ts` | K–12 grade list, `initialGrade()` (reads `?grade=` from the arcade link), labels, NC high-school course names, `arcadeLink()` |
| `deck.ts` | `QuestionDeck(grade, subjects, { quickOnly, gameId })` → `.draw()` a shuffled question; favours standards the player has missed |
| `math.ts` | `mathQuestion(grade)`: fresh generated K–12 math questions tagged with NC math standards |
| `banks/science/g*.ts`, `banks/ela/g*.ts`, `banks/social/g*.ts` | Written science, ELA and social studies questions per grade, tagged with NC standards (loaded automatically) |
| `progress.ts` | Per-game high score and per-standard accuracy in the browser |
| `speak.ts` | Read-aloud (on by default for K–2) |
| `audio.ts` | `ChipAudio`: chiptune sound effects and a looping bassline |

`quick` questions (prompt ≤ 100 characters, every choice ≤ 14 characters) are the ones
short enough to put on a sprite at arcade speed.
