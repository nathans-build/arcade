# Sidewalk Stand

A money-math business game for **SpiderBen10's Arcade** (K–12, North Carolina Standard Course of Study).
The arcade's hero runs a juice-and-snack cart in the park for a week. Each day has three parts:

1. **Morning: plan.** Read the forecast (sunny, cloudy or rain, and the temperature) and the demand hint,
   buy supplies (cups, juice, ice, fruit, snacks) with the cash you have, and set the juice price.
   From grade 3 on, a quick planning check asks about the supplies you just bought.
2. **Midday: the serving rush.** Customers (kids, joggers, a dog walker with her dog, a mail carrier,
   a grandpa, a robot, a painter, a skater) walk up 3 lanes (4 with the second counter). Move to a
   lane, pick the item they want, and slide it down the serving rail. When an order is complete,
   the customer pays and **you make change** (or count coins, or work out a coupon or tax) by picking
   one of 4 answers. A wrong answer is never punished: the customer kindly corrects you and the
   explanation shows. Customers who wait too long say "Maybe later!" and leave.
3. **Evening: the ledger.** A pixel ledger book shows money in (revenue) and money out (costs), and
   profit = revenue − costs, the customers you served or missed, and leftover stock (ice melts and
   fruit spoils overnight without the cooler). Answer a reflection question, then choose a small
   upgrade: a bright sign, a big umbrella, a second counter or a cooler.

Between days comes a **transmission** from the arcade (kit `QuestionDeck(grade, ["math", "social"])`,
with explanations). After the last day (3 days for K–2, 4 days from grade 3) the **mission report**
shows the week day by day, results by standard (code + skill) and what to practice next.

All prices are fictional **game numbers**, scaled by grade band (K counts single coins; grade 1 stays
under 50¢ an order; grade 2 near a dollar; older grades use dollars).

Original art and setting: a park juice cart (no bar, no bartender), the arcade hero sprite, and
original pixel customers. Inspired only by the *mechanics* of Lemonade Stand (MECC, 1979: plan, weather,
price) and Tapper (1983: lanes and sliding orders).

## Controls

| Action | Keyboard | Touch / mouse |
|---|---|---|
| Plan: pick a row / change it | ↑ ↓ / ← → (or − +) | the − and + buttons |
| Plan: a suggested plan / open | H / Enter | HELP ME PLAN / OPEN THE STAND |
| Rush: change lane | ↑ ↓ | tap a lane (moves there and serves), or ▲ ▼ |
| Rush: pick the item | ← → | JUICE / FRUIT CUP / SNACK buttons, or the strip at the top of the screen |
| Rush: serve | Space or Enter | tap the lane, or SERVE |
| Answer (change, checks, transmissions) | 1–4 or A–D | tap an answer |
| Continue after an answer | Enter or Space | the yellow button |
| Upgrades | 1–4, Enter for the next day | tap a card, then NEXT DAY |
| Pause / mute / read aloud | P or Esc / M / R | toolbar buttons and the speaker button |

A–D are only ever answer keys, never movement keys. K–2 get bigger text, slower customers with
more patience, read-aloud on by default, and a helper that picks the item the lane's customer wants.

## Money math and economics by grade

Codes are the NC forms used by the kit (`kit/math/*.ts`, `kit/banks/social/`, `kit/banks/social/NOTES.md`).
Rush (pay) and planning questions follow the kit's adaptive math level (`mathGradeFor` + `markAdaptive`,
recorded with `recordAnswer`), so a player can see the neighbouring grades' skills.

| Grade | At the counter (rush) | Morning check | Evening reflection |
|---|---|---|---|
| K | Know your coins by picture: penny, nickel, dime, quarter (K.E.1); count pennies (NC.K.CC.5) | – | Needs and wants for the cart (K.E.1.1) |
| 1 | Coin values; count mixed coins to 50¢ (NC.1.MD.5) | – | Goods and services (1.E.1) |
| 2 | Count bills and coins; change from a dollar; $ and ¢ symbols (NC.2.MD.8) | – | Money word problems (NC.2.MD.8); producers and consumers (2.E.1) |
| 3 | Make change to $10 by counting up (NC.3.NBT.2); price × quantity (NC.3.OA.3) | Multiply to find a cost (NC.3.OA.3) | Profit = revenue − costs in cents within 1000 (NC.3.NBT.2); opportunity cost (3.E.1) |
| 4 | Multi-step orders with decimals: total, then change (NC.4.MD.2) | Two purchases, then change (NC.4.MD.2) | Revenue from items sold (NC.4.MD.2); factors of production (4.E.1.3) |
| 5 | Decimal money operations (NC.5.NBT.7) | Budget: cash left after supplies (NC.5.NBT.7) | Profit or loss with decimals (NC.5.NBT.7); budgeting (5.E.2.2) |
| 6 | Coupons: percent off (NC.6.RP.3) | Unit rate per serving, best buy, recipe ratio (jugs for N juices), sale price (NC.6.RP.3) | Profit as a percent of revenue (NC.6.RP.3); ratio of juices to snacks (NC.6.RP.1) |
| 7 | Sales tax, tips (NC.7.RP.3); discount then tax (NC.7.EE.3) | Simple interest on a family loan, markup, percent change (NC.7.RP.3) | Percent increase/decrease of revenue (NC.7.RP.3); market economies (7.E.1) |
| 8 | Reverse change: solve for how many cups (NC.8.EE.7) | Slope of P(n) = profit per cup (NC.8.F.4); break-even (NC.8.EE.7) | Slope from two points on the profit graph (NC.8.F.4); break-even on the graph (NC.8.EE.7) |
| 9 (Math 1) | Two orders → a system for the menu prices (NC.M1.A-REI.6) | Break-even R = C (NC.M1.A-REI.6); evaluate P(n) (NC.M1.F-IF.2) | same family |
| 10 (Math 2) | review of grades 7–9 (tax, tips, equations, systems) | Linear demand q = a − bp; the price that maximizes revenue R = p(a − bp) is the vertex (NC.M2.F-IF.8) | same family |
| 11 (Math 3) | review of grades 7–9 | Maximum revenue as a key feature of R(p) (NC.M3.F-IF.4) | same family |
| 12 (EPF) | review of grades 7–9 | Net pay after FICA 7.65% (EPF.IE.1.1); loan interest from APR (EPF.MCM.2.2); budgeting (EPF.MCM.1.1) | Law of demand (EPF.E.1.3); opportunity cost of wages (EPF.E.1) |

Transmissions add the kit's generated math and the written social-studies bank for the grade.
Grades 7+ who run out of cash can take a **family loan** with the simple interest shown (I = P × r × t);
younger players get a **fresh start** instead. Repayment never pushes cash below zero.

## The demand model (shown on the morning screen from grade 8)

```
customers = round( BASE × weather × temperature × price × sign × luck ), at most the lane capacity
  BASE         8 (K–2) or 12 (grades 3+)
  weather      sunny 1.0 · cloudy 0.75 · rain 0.4 (0.6 with the umbrella)
  temperature  0.6 + 0.02 × (°F − 50), from 0.6 to 1.5 (×1.1 on hot sunny days with the umbrella)
  price        2 − price ÷ usual price      (a straight-line demand curve: usual price → 1, double → 0)
  sign         1.15 with the bright sign
  luck         0.90 to 1.10, fixed by the day's seed
  capacity     12 customers (3 lanes), 16 with the second counter; extra people see a long line and walk on
```

The forecast is the real weather for the day (day 1 is never rainy). The hint shows the expected
customers at the usual price without the hidden luck. Each customer's order (1 item for K, up to 2 for
grades 1–2, up to 3 from grade 3) and whether they pay with exact money are fixed by the day's seed,
so tests are deterministic. Juice uses a cup, a juice serving and an ice scoop; a fruit cup uses a cup
and fruit; a snack uses a snack. If supplies run out, the remaining customers find the stand sold out.

Money is always **integer cents** (`src/stand/money.ts`); percent questions only use rates that give
whole cents, so there is never any rounding or floating-point money.

## Run it

```
npm install
npm run dev          # http://localhost:4647
npm run build        # tsc (strict) + vite build into dist/
npm test             # scripts/check-stand.ts
```

`?grade=K` … `?grade=12` comes from the arcade menu (the grade badge shows instead of the picker);
`?debug` exposes the engine as `window.__st` and `?fast` speeds up the rush (for playtests).

### Tests

`npm test` (`scripts/check-stand.ts`, run with tsx) checks:

- money formatting ($3.25, 75¢, $1,234.56, −$1.25) per grade style, and count-up change steps;
- thousands of generated rush, planning and reflection questions at every grade and every adaptive
  level: each answer is recomputed by an independent integer-cents solver, exactly one choice has the
  right value (so "$0.85" and "85¢" can never both appear), choices are distinct, rush questions meet
  the quick limits (prompt ≤ 100 characters, choices ≤ 14), and every standard code belongs to its
  question's grade;
- the demand model is monotonic (higher price never brings more customers; sunny ≥ cloudy ≥ rain;
  warmer never brings fewer) and the forecast is deterministic;
- whole weeks played headless at every grade three ways (sensible play, "always pick A", and a
  careless player who overspends and never serves): every day completes, cash never goes below zero,
  rescues appear when needed, and the cash ledger balances to the cent.

`node scripts/playtest.cjs` (with a preview on port 4647) plays grades K, 3, 7 and 11 on keyboard
(1280×800) and iPad touch (1080×810 and 810×1080), plus one run with the grade picker.

## Deploying

Sidewalk Stand lives in SpiderBen10's Arcade repository (`games/sidewalk-stand/`). The arcade's deploy workflow
builds and tests it and publishes it at `/sidewalk-stand/` on the arcade's Azure app, so it needs no Azure
app or token of its own. See the arcade README.

## Codes to verify

Checked against the kit's code lists and NOTES.md, not the NC DPI site (blocked in this sandbox):

- **NC.1.MD.5** (identify coins and relate their values to pennies): used for coin values and for counting
  mixed coins to 50¢. Confirm that counting mixed coin collections sits here in grade 1.
- **K.E.1** (standard level) for identifying coins in kindergarten; NC kindergarten math has no money standard.
- **NC.4.MD.2** (money word problems with decimals), **NC.7.EE.3** (multi-step problems with rational numbers),
  **NC.6.RP.1** (ratio language), **NC.8.EE.7** (linear equations in one variable) are not used by the kit's
  generators; their numbering follows the 2017 NC math standards.
- **NC.M3.F-IF.4** for the maximum of a revenue function in NC Math 3 (key features in context).
- **2.E.1**, **3.E.1**, **7.E.1** are standard-level economics codes (objective numbers unknown);
  **4.E.1.3**, **5.E.2.2**, **EPF.IE.1.1**, **EPF.MCM.1.1**, **EPF.MCM.2.2**, **EPF.E.1**, **EPF.E.1.3** follow the
  kit's social bank.

Created by SpiderBen10 (NZDO).
