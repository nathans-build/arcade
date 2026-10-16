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
| `adaptive.ts` | Adaptive math: the deck's generated math moves up after right answers and down after wrong ones (±2 grades around the chosen grade, mixing neighbouring grades in between). On by default; switched on/off on the arcade menu. `recordAnswer` feeds it automatically; games that save progress themselves call `noteAnswer(q, correct)` |
| `progress.ts` | Per-game high score and per-standard accuracy in the browser |
| `speak.ts` | Read-aloud (on by default for K–2) |
| `audio.ts` | `ChipAudio`: chiptune sound effects, a classic looping bassline, and NES-style 4-channel songs and jingles with separate Music / Sound-effects switches (see [Chiptune music](#chiptune-music)) |

`quick` questions (prompt ≤ 100 characters, every choice ≤ 14 characters) are the ones
short enough to put on a sprite at arcade speed.

## Chiptune music

`ChipAudio` can play original NES-style songs on four channels, with no audio files:

| Channel | Sound | Typical part |
|---|---|---|
| `lead` | pulse wave, duty 12.5 / 25 / 50% | the melody |
| `harmony` | second pulse | harmony, chord arpeggios, or an automatic echo of the lead |
| `bass` | triangle | the bassline |
| `drums` | noise + a pitch-dropping triangle | kick `k`, snare `s`, closed hat `h`, open hat `o`, tom `t` |

### Song format

A song is plain TypeScript data. Each section has one pattern string per channel; `order` lists
the sections, and a looping song goes back to `loopTo` (so an intro plays once):

```ts
import type { Song } from "@/kit/audio";

export const TOWN: Song = {
  title: "Town Square",
  bpm: 120,
  stepsPerBeat: 2,                 // 2 = each token is an 8th note (default 4 = 16ths)
  voices: {
    lead: { duty: 0.25, volume: 0.18, vibrato: { depth: 12, rate: 6, delay: 0.3 } },
    harmony: { duty: 0.125, volume: 0.07, echo: { steps: 3 } },   // echoes the lead 3 steps later
  },
  patterns: {
    a: "C5 . E5 G5 . E5 C5 . | D5 - - - . . . .",     // two bars
    C: "C2 . C3 . G2 . C3 .",
    G: "G2 . G3 . D3 . G3 .",
  },
  sections: {
    intro: { bass: "@C @C", drums: "k . h . s . h h" },
    A: { lead: "@a @a", bass: "@C @G @C @G", drums: "k . h . s . h h" },
    B: { lead: "@a", harmony: "C4+47 -*7 G3+47 -*7", bass: "@C @G", transpose: 5 },
  },
  order: ["intro", "A", "B", "A"],
  loopTo: "A",
};
```

Tokens (separated by spaces):

- `C4` `F#5` `Bb3`: a note (`C4` is middle C). `.` is a rest, `-` holds the note before it.
- `C4+47`: a chip-style arpeggio (C, E, G cycling fast); the digits are semitones above the root (hex, so `a` = 10).
- `k s h o t`: drum hits; letters can be combined (`kh` = kick + hat).
- `@name` uses a named pattern; `token*N` repeats a token or pattern (`@a*2`, `-*7`, `.*4`); `|` is just a bar line.
- A channel shorter than its section repeats to fill it (a 1-bar drum loop under an 8-bar tune);
  its length must divide the section's length. A missing channel rests.
- `transpose` (song or section, semitones) and `voices.<channel>.octave` shift notes.
- Voice settings: `duty`, `volume`, `attack` / `decay` / `sustain` / `release`, `gate` (1 = legato,
  0.5 = staccato), delayed `vibrato`, and for `harmony` an `echo`.

`jingle(title, bpm, { lead, harmony, bass, drums })` builds a one-section stinger.

### API

```ts
const audio = new ChipAudio();           // the old (bass?, bpm?) constructor still works
audio.unlock();                          // from a tap/click/key (browsers block autoplay)
audio.playSong(TOWN);                    // loops; same song again = no restart; waits for unlock
audio.playJingle(LEVEL_CLEAR);           // song fades out, jingle plays, song carries on
audio.playJingle(GAME_OVER, { then: "stop" });     // or { then: BOSS_SONG } to switch songs
audio.setIntensity("calm");              // lead + bass only ("normal" adds drums, "full" = all, or ["bass", "drums"])
audio.setTempoScale(1.1);                // "hurry up" (jingles ignore it)
audio.stopSong();                        // stopMusic() stops songs and the old bassline
audio.toggleMusic(); audio.toggleSfx();  // return the new musicOn / sfxOn
audio.duck(true);                        // turn music down by hand (read-aloud does it automatically)
```

- **Music and sound effects** have separate buses and switches, saved per device in
  `arcade.musicOff` / `arcade.sfxOff` (like `arcade.muted`, which still silences everything).
  Music sits a little under the effects. Jingles use the music volume, or the effects volume when
  music is off. The classic `startMusic()` bassline counts as music.
- **Read-aloud**: while `speechSynthesis` is talking the music drops to `duckLevel` (0.28; set it
  lower for K-2 games), unless `duckForSpeech = false`.
- **Scheduler**: a 25 ms timer books every note starting in the next 100 ms against the audio clock,
  so timing doesn't drift. It pauses while the tab is hidden and continues from the same spot.
  Each song uses one set of persistent oscillators (envelopes and pitch are automation), pulse
  waves and the noise buffer are cached, and everything is disconnected when a song stops.
- `audio.stats` (ticks, steps, notes, songs, jingles) and `audio.history` ("song:Title",
  "jingle:Title", "intensity:calm", ...) are there for tests. `exposeMusicDebug(audio, SONGS, JINGLES)`
  puts them on `window.__music` when the page has `?debug`.
- Pure helpers for tests and tools: `noteToMidi`, `midiToHz`, `noteHz`, `parsePattern`,
  `compileSong`, `advance`, `stepSeconds`, `songSeconds`, `songRange`, `validateSong` (returns a
  list of problems) and `scheduleSong` (renders a song onto an `OfflineAudioContext`).

### Adding a soundtrack to a game

1. Write `src/music.ts` exporting `SONGS` and `JINGLES` (records of `Song`). Compose original tunes;
   don't copy or closely imitate existing game, film or TV themes.
2. Copy `scripts/check-music.ts` from a game that has one (for example `games/dojo-tower`) and add
   `&& tsx scripts/check-music.ts` to the game's `npm test`. It checks the kit helpers and that
   every song parses, fits its sections, stays in range and loops after about 30-60 s.
3. Create `new ChipAudio()`, call `audio.playSong(...)` after `audio.unlock()` in a click/tap handler,
   and switch songs or play jingles on game events.
4. Give the game **Music** and **SFX** buttons (`toggleMusic`, `toggleSfx`) in its usual style.

Games with soundtracks: Dojo Tower, Cipher Pursuit, Robo Masters, Quest of the Lost Library,
Count Carnival and Kitchen Chemistry Café.
