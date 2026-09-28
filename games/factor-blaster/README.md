# Factor Blaster

An *Asteroids*-style math arcade game for **SpiderBen10's Arcade** (grades K–12, North Carolina
Standard Course of Study for Mathematics). Created by **SpiderBen10 (NZDO)**.

![Factor Blaster mid-game](docs/screenshot.png)

Fly a red-and-blue starship through open space and blast drifting number rocks. **The splitting is the
math:** every rock you shoot breaks into pieces that show how its number is built, so you *see*
`36 → 4 × 9 → 2 × 2 × 3 × 3` or `x²+5x+6 → (x+2)(x+3)` happen.

- **Target rule.** Each level has a rule in the HUD, like *BLAST MULTIPLES OF 3* or
  *ONLY SHOOT ROCKS WITH FACTOR (x+3)*. Shooting a rock that follows the rule scores (streaks multiply
  it); shooting one that breaks it costs a shield pip (or points) and the screen tells you why
  (`14 IS NOT A MULTIPLE OF 3`). Rocks that don't match are decoys: dodge them.
- **Gold cores** (1s, primes, linear factors) can't split. They're always safe to shoot and pop for
  a bonus. Blast every core of a rock for a **combo** that shows the whole factorization,
  e.g. `36=2×2×3×3` or `2x²+10x+12=2(x+2)(x+3)`.
- A level is clear when no target rocks or cores are left. Then an **incoming transmission** asks a
  multiple-choice math question for your grade (from the arcade kit's `QuestionDeck`), with an
  explanation. Right answers recharge the shields and give a bonus.
- 3 ships, 3 shield pips. A shield pip absorbs one rock bump; with no shield a bump costs a ship.
  You get a few seconds of invulnerability after respawning.
- Game over shows a **mission report** grouped by NC standard (code + skill), for both the
  transmissions and the target-rule shots, plus what to practice next.

## Grade rules

The grade comes from the arcade link (`?grade=K` … `?grade=12`) or the title-screen picker.

| Grades | Rocks split into | Example | Cores | Target rules | Standards |
|---|---|---|---|---|---|
| K | Number bonds (rocks up to 10) | `10 → 7 + 3` | 1 | bigger than 5 · 5 or less | NC.K.OA.3, NC.K.CC.7 |
| 1 | Number bonds, make-a-ten (to 15) | `14 → 10 + 4` | 1 | bigger than 7 · 7 or less | NC.1.OA.6, NC.1.NBT.3 |
| 2 | Number bonds (to 20) | `17 → 9 + 8` | 1 | bigger than 10 · even · odd | NC.2.OA.2, NC.2.OA.3, NC.1.NBT.3 |
| 3 | Factor pairs of multiplication facts | `36 → 4 × 9` | primes | multiples of 2, 3, 5, 4, 6 | NC.3.OA.7 |
| 4–5 | Factor pairs (to 100) | `84 → 7 × 12` | primes | multiples · even numbers | NC.4.OA.4 |
| 6–8 | Prime factorization (to 100 / 200 / 360) | `72 → 8 × 9 → 2×2×2×3×3` | primes | multiples · shares a factor with 12 · perfect squares (gr. 8) | NC.6.NS.4, NC.8.EE.2 |
| 9 (NC Math 1) | Factoring: trinomials, GCF | `x²+5x+6 → (x+2)(x+3)`, `3x+12 → 3 · (x+4)` | constants, x, linear factors | has factor (x−r) · has a GCF | NC.M1.A-SSE.3 |
| 10 (NC Math 2) | + difference of squares, perfect squares, GCF first | `2x²−32 → 2 · (x²−16) → (x+4)(x−4)` | 〃 | + equals 0 when x = r | NC.M1.A-SSE.3, NC.M1.A-APR.3 |
| 11–12 (NC Math 3–4) | + non-monic, cubic with GCF x | `2x²+7x+3 → (2x+1)(x+3)`, `x³+5x²+6x → x · (x²+5x+6)` | 〃 | 〃 | NC.M1.A-SSE.3, NC.M1.A-APR.3 |

K–2 get fewer and slower rocks, double-size digits, bigger question text, and **read-aloud on by
default** (the target rule and each transmission are read out; 🔊 replays; toggle in the toolbar).

## Controls

| | Keyboard | Touch (iPad / phone) |
|---|---|---|
| Rotate | ← → (or A / D) | ⟲ ⟳ |
| Thrust | ↑ (or W) | THRUST |
| Fire | Space, Z or X | FIRE |
| Pause | P or Esc | PAUSE (toolbar) |
| Sound | M | SOUND (toolbar) |
| Answer a transmission | 1–4 or A–D, then Enter | tap an answer, then *Next level* |

The screen wraps on every edge. The 320×200 pixel screen scales to fit any window, including iPad
and phones (on landscape phones the touch pads sit beside the screen).

## Run it locally

```sh
npm install
npm run dev        # http://localhost:8080
npm run check      # fuzz-test the splitting math and rules for every grade
npm run build      # type-check + production build into dist/
```

`src/kit` is SpiderBen10's Arcade shared kit (question decks, grades, read-aloud, chip audio,
progress). It isn't checked in here: copy the arcade's `kit/` folder to `src/kit/` before building.

Code map: `src/FactorBlaster.tsx` (screens, HUD, transmissions, report), `src/blaster/engine.ts`
(game loop), `src/blaster/splits.ts` (rocks, splits and rules for each grade),
`src/blaster/font.ts` (the 3×5 pixel font for rock labels), `src/blaster/sprites.ts`,
`scripts/check-splits.ts` (math checks), `scripts/playtest.cjs` (optional Playwright playtest).

## Deploying to Azure

Every push to `main` builds the game and publishes it to Azure Static Web Apps
(`.github/workflows/azure-static-web-apps.yml`). Pull requests get their own preview link.
The deploy step is skipped until the token below is added, so the build still runs and checks the code.

One-time setup, from any browser at https://shell.azure.com (Bash):

```sh
az group create -n rg-factor-blaster -l eastus2
az deployment group create -g rg-factor-blaster -f infra/main.bicep   # or: az staticwebapp create -n factor-blaster -g rg-factor-blaster -l eastus2 --sku Free
az staticwebapp secrets list -n factor-blaster -g rg-factor-blaster --query properties.apiKey -o tsv
```

Copy the printed token into this repository under
**Settings → Secrets and variables → Actions → New repository secret**, named
`AZURE_STATIC_WEB_APPS_API_TOKEN`. The next push to `main` publishes the game at
`https://<name>.azurestaticapps.net`.

The token can only publish to that one web app. Revoke or rotate it in the Azure portal at any time.
The Free tier covers this game (static files only, no server).
