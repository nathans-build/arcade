# Grid battle game (Battleship-style): plan for later

Status (October 2026): planned, not started. Recommended name **Sonar Squad** (checked Oct 3,
2026: no game by that name found, sonarsquad.com had no DNS record). Rejected: Grid Strike (an
existing Battleship-style game), Sub Hunt (Mattel's 1961 "Sonar Sub Hunt", domain taken),
Coordinate Clash (too close to "Coordinate Commander", an existing coordinate Battleship game).
Backup: Grid Hunters. Note the "Sonar" / "Captain Sonar" submarine board games by Matagot; the name
is different, but keep the look original. "Battleship" itself is a Hasbro trademark, so the game, ships
and art must be original (check the final name the same way as
[brand-and-domains.md](brand-and-domains.md)).

## The game

Each side hides a fleet on a grid and takes turns calling a square to fire at: hit, miss, or sunk.
Sink the whole enemy fleet to win. Same 80s look as the rest of the arcade: a 320×200 canvas with
a sonar screen, pixel subs and ships, and CRT scanlines.

## Where the learning goes

- **The grid is the lesson (math).** Calling a shot is reading a coordinate:
  - K–2: a picture-and-number grid ("blue fish row, 3"), or letters plus numbers.
  - Grades 3–4: a letter-number grid.
  - Grade 5: the first quadrant of the coordinate plane, as ordered pairs (x, y) (NC.5.G.1–2).
  - Grade 6+: all four quadrants with negative coordinates (NC.6.NS.8); later, shots can be given as
    "the reflection of (3, −2)" or "the point 4 right of A".
- **Power-ups from questions (any subject).** A right answer from the kit `QuestionDeck` earns sonar
  (reveal whether a 3×3 area has a ship), a double shot, or a repair. A wrong answer still gives a
  normal shot, so nobody is ever stuck.
- **Report** by standard at the end, like the other games. Adaptive math applies automatically.

## Single player vs the computer (build first)

Computer skill levels, chosen by grade band or in the game:

1. **Easy:** random shots that never repeat a square.
2. **Medium, "hunt and target":** random until it hits, then tries the squares next to the hit and
   follows the line until the ship sinks.
3. **Hard, "probability map":** for every square, count how many ways the remaining ships could
   still fit over it, and fire at the most likely square. Very strong; good for older kids.

The computer places its ships randomly (no touching), and the player places theirs by
drag/tap/keys or with an AUTO button.

## Two players: options

| Option | How it works | Needs | Recommendation |
|---|---|---|---|
| **A. Pass and play** | Two kids share one iPad or laptop. A "Pass to Player 2, don't peek!" screen hides boards between turns. | Nothing new; works offline. | **Build with v1.** |
| **B. Online with a room code** | Player 1 taps "Host" and gets a 4-letter code; player 2 enters it on their own device. Moves go through a small real-time server. | Azure Web PubSub (free tier: 20 connections, 20,000 messages a day) or SignalR, plus an Azure Function to create rooms and hold both boards so nobody can cheat. | **v2.** Friends and family only, by code. |
| **C. Turn-by-turn over days** | Like Words With Friends: make a move, come back later. | Accounts and stored games (ties in with the freemium plan's accounts). | Later, with accounts. |
| **D. Matchmaking with strangers** | Random opponents online. | Moderation, reporting, COPPA work. | **Don't** for a kids' arcade. |

Kid-safety rules for any online play: no free-text chat (preset emotes like "Nice shot!" only),
nicknames only, rooms expire, no personal data stored.

### Design so two-player slots in later

Write the game engine around a `Player` interface with a method like
`chooseShot(view): Promise<Coord>` plus "you were hit at X" events. v1 implements
`LocalHumanPlayer` and `ComputerPlayer(level)`. Pass-and-play is two `LocalHumanPlayer`s with the
hide screen. Online v2 adds a `RemotePlayer` that sends and receives moves over Web PubSub. The game
rules don't change.

For v2 the server must hold both fleets and decide hit or miss. If each browser reports its own
hits, one player could cheat by editing the page.

## Open decisions (GitHub issue)

1. The name.
2. Which two-player option(s), and when.
3. Board size: **10×10 for every grade** (chosen by the user). K–4 shoot at squares (K–2 picture
   rows and numbers 1–10; 3–4 letters A–J and numbers 1–10). Grade 5 shoots at grid-line crossings
   (0–9 on each axis, first quadrant). Grade 6+ adds the axes so the board runs −5 to 5 on each axis
   (11×11 crossings, the true four-quadrant plane). K–2 get extra sonar and a "hint" glow so 10×10
   doesn't drag.
4. Questions as power-ups only (recommended), or a question before every shot (slower, more
   practice)?
