# Math 6 · Unit 3: Unit Rates and Percentages
### Outline for building kids' math video games

Use this file as the source of truth for what Unit 3 covers. Every game built from it should practice the skills listed here, use the vocabulary the way the textbook does, and avoid topics listed under "Out of scope." (Used by the dev-only special edition `games/dojo-rates`.)

---

## 1. Who the player is

- **Grade:** 6th grade, age 11–12. Accelerated track (Math 6 plus an advanced group already doing 7th-grade scale drawings).
- **Textbook:** Open Up Resources Grade 6 Math (Illustrative Mathematics), Unit 3, 17 lessons. NC standards: **NC.6.RP.2** (unit rate) and **NC.6.RP.3** (ratio tables, unit-rate problems, percent, unit conversion).
- **Already solid on (Unit 2):** equivalent ratios, double number lines, ratio tables, tape diagrams, basic unit price, constant speed.
- **Known weak spots — design games to target these:**
  1. **Stops after step one** on two-step problems (finds the discount but not the sale price; finds the unit price but not the total).
  2. **Rounding money to the cent** ($10 ÷ 3 = $3.33, not $3.30 or $3.3).
  3. **Batches with fractions** (scaling a recipe by 1½ or ⅔).
  4. **Picking the right operation** — multiply vs. divide when the numbers look similar.
- **Attention span:** play sessions of **10–15 minutes**. Short rounds with a clear finish beat endless modes.

---

## 2. Unit map (5 sections, 17 lessons)

| Section | Lessons | Big idea |
|---|---|---|
| A · The Burj Khalifa | 1 | Use a known rate to estimate something huge (height, time, cost). |
| B · Unit Conversion | 2–4 | Same length/weight/volume, different units. Smaller unit → bigger number. Convert with a ratio. |
| C · Rates | 5–9 | Every ratio has **two** unit rates. Use them to compare speeds and prices and solve rate problems. |
| D · Percentages | 10–16 | A percent is a rate per 100. Find the part, the whole, or the percent. |
| E · Let's Put It to Work | 17 | Painting a Room: multi-step project combining area, conversion, unit price, and percent. |

---

## 3. Lesson-by-lesson skills

Each lesson lists the skill, one sample problem with its answer, and the mistake to catch.

### Section A — The Burj Khalifa
**L1 · The Burj Khalifa**
- Skill: use a rate to estimate. If you know one piece, scale up.
- Sample: A window washer cleans 3 windows in 10 minutes. How long for 24,000 windows? → 80,000 min ≈ 1,333 hours.
- Watch for: dividing the wrong way (24,000 ÷ 3 = 8,000 groups, then × 10 min).

### Section B — Unit Conversion
**L2 · Anchoring Units of Measurement**
- Skill: know roughly how big common units are (inch ≈ thumb width, meter ≈ door width, kg ≈ liter of water, gallon = big milk jug).
- Sample: Which unit fits the length of a pencil: cm, m, or km? → cm.

**L3 · Measuring with Different-Sized Units**
- Skill: the smaller the unit, the more of them you need.
- Sample: A table is 2 yards long. Is it more or fewer than 2 feet? → More: 6 feet.
- Watch for: thinking a bigger number means a bigger object regardless of unit.

**L4 · Converting Units**
- Skill: convert with a ratio, table, or double number line.
- Sample: 12 kg ≈ ? lb (1 kg ≈ 2.2 lb) → 26.4 lb. 90 inches = ? feet → 7.5 ft.
- Watch for: multiplying when they should divide (going to a bigger unit means the number gets smaller).

**Conversion facts to use (US + metric, as the book uses them):**
| Length | Weight | Volume |
|---|---|---|
| 1 ft = 12 in | 1 lb = 16 oz | 1 gal = 4 qt |
| 1 yd = 3 ft | 1 kg ≈ 2.2 lb | 1 qt = 2 pt |
| 1 mi = 5,280 ft | 1 kg = 1,000 g | 1 pt = 2 cups |
| 1 in = 2.54 cm | | 1 cup = 8 fl oz |
| 1 m = 100 cm; 1 km = 1,000 m | | 1 L ≈ 1.06 qt |

### Section C — Rates
**L5 · Comparing Speeds and Prices**
- Skill: compare two deals or two speeds by finding a common rate.
- Sample: Andre rode 25 miles in 2 hours; Lin rode 30 miles in 3 hours. Who was faster? → Andre (12.5 mph vs. 10 mph).

**L6 · Interpreting Rates**
- Skill: a ratio a : b gives two unit rates, a/b and b/a. Both mean something.
- Sample: 3 lb of apples cost $4.50. → $1.50 per pound, and ⅔ lb per dollar.
- Watch for: thinking only one of the two rates is "right."

**L7 · Equivalent Ratios Have the Same Unit Rates**
- Skill: if two ratios are equivalent, their unit rates match. Use that to test "same rate?"
- Sample: Is 6 cups flour : 4 cups sugar the same recipe as 9 : 6? → Yes, both 1.5 cups flour per cup sugar.

**L8 · More About Constant Speed**
- Skill: speed (miles per hour) vs. **pace** (minutes per mile). Faster = higher speed, **lower** pace.
- Sample: Runner A: 8 min per mile. Runner B: 10 mph. Who is faster? → B (60 ÷ 10 = 6 min per mile, less than 8). Trick-tie version: 7.5 mph = 8 min per mile.
- Watch for: thinking a bigger pace number means faster.

**L9 · Solving Rate Problems**
- Skill: pick the useful unit rate and finish the problem.
- Sample: Soap is $2.40 for 16 oz or $3.30 for 24 oz. Which is cheaper per ounce? → 16 oz: $0.15/oz; 24 oz: $0.1375/oz → 24 oz is cheaper.
- Watch for: stopping at the unit rate without answering the question asked.

### Section D — Percentages
**L10 · What Are Percentages?**
- Skill: percent = "per 100." 100% is the whole; more than 100% is more than the whole.
- Sample: A ticket costs $20 (100%). What is 50%? → $10. What is 150%? → $30.

**L11 · Percentages and Double Number Lines**
- Skill: line up 0%–100% against 0–whole, then count by benchmarks.
- Sample: 100% = 60 m. Find 25%, 50%, 75%, 125%. → 15, 30, 45, 75 m.

**L12 · Percentages and Tape Diagrams**
- Skill: split a bar into equal parts (5 parts = 20% each, 4 parts = 25% each).
- Sample: 40% of a tank is 18 gallons. How much is the full tank? → 20% = 9 gal, so 100% = 45 gal.

**L13 · Benchmark Percentages**
- Skill: 10% = ⅒, 25% = ¼, 50% = ½, 75% = ¾, 1% = 1/100. Do them in your head.
- Sample: 75% of 80 → 60. 10% of 350 → 35.

**L14 · Solving Percentage Problems**
- Skill: use a table, tape diagram, or double number line to solve real problems.
- Sample: A $40 jacket is 15% off. What do you pay? → Discount $6, **pay $34**.
- Watch for: answering $6 (stopping after step one).

**L15 · Finding This Percent of That**
- Skill: find the part: P% of W = P/100 × W.
- Sample: 30% of 80 → 24. 6% of $45 → $2.70.

**L16 · Finding the Percentage**
- Skill: find what percent one number is of another.
- Sample: 12 out of 48 → 25%. 9 out of 12 → 75%.
- Also: find the whole: 9 is 75% of ? → 12.

**The three percent question types (games should mix all three):**
| Find the… | Example | Answer |
|---|---|---|
| Part | 30% of 80 = ? | 24 |
| Whole | 9 is 75% of ? | 12 |
| Percent | 12 is ?% of 48 | 25% |

### Section E — Let's Put It to Work
**L17 · Painting a Room**
- Skill: chain everything — wall area, subtract doors/windows, coats, gallons needed, unit price, tax.
- Sample: Room 12 ft × 10 ft, walls 8 ft tall. Perimeter 44 ft × 8 = 352 sq ft. Minus a 3 × 7 door (21) and a 3 × 4 window (12) = 319 sq ft. Two coats = 638 sq ft. One gallon covers 350 sq ft → 1.82 → **buy 2 gallons** (round up).
- Watch for: rounding gallons down; buying the cheaper-per-gallon bucket when it doesn't hold enough.

---

## 4. Vocabulary (kid-friendly definitions)

| Word | Meaning |
|---|---|
| unit of measurement | The "size" you measure with: inch, meter, pound, liter |
| convert | Change a measurement to a different unit without changing the actual amount |
| rate | A ratio comparing two different kinds of things (miles per hour, dollars per pound) |
| unit rate | How much for **one** (per 1 hour, per 1 pound) |
| speed | Distance per unit of time (miles per hour) |
| pace | Time per unit of distance (minutes per mile) |
| percent / percentage | A rate per 100. 35% means 35 for every 100 |
| benchmark percentage | Easy percents to use as anchors: 10%, 25%, 50%, 75%, 100% |

---

## 5. Skill tags (use these names for scoring and progress)

Track results by these skills so progress lines up with the quiz log:

1. Estimating with rates
2. Choosing sensible units
3. Converting units
4. Comparing speeds and prices
5. Two unit rates from one ratio
6. Same rate? (equivalent ratios)
7. Speed vs. pace
8. Multi-step rate problems
9. Percent as a rate per 100
10. Percents on double number lines
11. Percents with tape diagrams
12. Benchmark percents
13. Percent of a number (find the part)
14. Find the whole
15. Find the percent
16. Discounts, tax, and tips (two-step)
17. Multi-step project (Painting a Room)
18. *Bridge:* scale factors (see Section 8)

---

## 6. Problem-generator rules

Games should generate fresh numbers each round rather than reusing a fixed list.

- **Clean answers:** pick numbers so answers are whole numbers or terminate in at most 2 decimal places, except in rounding-practice items.
- **Money:** always show 2 decimals ($3.30, not $3.3). Include some items where the answer must be rounded to the cent ($10 ÷ 3 = $3.33).
- **Percents:** mostly multiples of 5 and benchmarks; include a few like 6%, 12%, 35%. Include some percents over 100% (125%, 150%, 200%).
- **Two-step items:** at least 1 in 4 problems should need two steps (sale price, total with tax, cost of n items after finding unit price). Only accept the final answer.
- **Conversions:** go both directions (to smaller and to bigger units) in equal numbers.
- **Fractions:** include some batch/rate items with ½, ⅓, ¼, ⅔, 1½.
- **Verify in code:** compute every answer programmatically. Never hand-type answers.
- **Distractors (wrong choices):** build them from real mistakes — the step-one answer, the flipped division, the decimal in the wrong place, the unrounded value.

---

## 7. Game ideas mapped to the unit

| Game | Section | Core mechanic |
|---|---|---|
| **Tower Climber** | A | Estimate how tall/long/expensive something huge is using a small known rate. Close guesses (within 10%) earn more height. |
| **Unit Swap Shop** | B | Drag items onto the right unit shelf, then convert prices/measurements to buy the right amount. "Bigger unit → smaller number" meter fills as they get it right. |
| **Deal or Steal Grocery** | C | Two shelf tags (e.g., 16 oz for $2.40 vs. 24 oz for $3.30). Tap the better deal; must show $/oz first. Hidden "it's a tie" rounds. |
| **Race Day: Speed vs. Pace** | C | Racers listed by mph or min/mile. Predict the order of finish; the race animates to reveal it. |
| **Percent Runner** | D | Endless-runner with a 0–100% double number line as the track; collect the coin at the right spot (e.g., "find 75% of 60"). |
| **Tape Diagram Builder** | D | Cut a bar into equal pieces to solve "40% is 18, find 100%." Bar snaps into 5, 4, or 10 parts. |
| **Mall Rush** | D | Shopping with discounts, coupons, and sales tax. Checkout only accepts the **final** price; giving the discount alone triggers a "you're not done yet!" hint. |
| **Paint the Room** | E | Boss level. Measure walls, subtract door/window, choose coats, buy paint buckets (some cheap-per-gallon traps that don't hold enough). |
| **Copy Machine (bonus)** | Bridge | Enlarge/shrink a picture at 50%, 150%, 200%; predict new lengths and new area. |

---

## 8. 7th-grade bridge: scale factors

The advanced group is already working on scale drawings, so games can include a bonus layer that connects Unit 3 to scale:

- A scale like "1 inch to 6 feet" is a rate. Same units → 1 : 72.
- A copier setting is a percent scale factor: 150% = × 1.5; 80% = × 0.8.
- "Enlarged **by** 50%" means 150% of the original, not 50%.
- Lengths scale by the factor; **area scales by the factor squared** (200% enlargement → area × 4).
- Going back from a copy to the original uses the reciprocal factor (a 150% copy ÷ 1.5).

---

## 9. Design rules for every game

- **Hints in two stages:** first a nudge ("What does 1 pound cost?"), then a worked step. Never jump straight to the answer.
- **Error feedback names the mistake:** "That's the discount — what does the customer pay?" beats "Wrong."
- **Estimate first:** for computation items, optionally ask for a quick estimate before the exact answer.
- **Show the model:** use double number lines, tables, and tape diagrams on screen — the same pictures the textbook uses.
- **Short rounds:** 10–15 minutes, 10–20 problems, then a results screen by skill tag.
- **Retry missed:** offer a "redo only the ones I missed" round with new numbers.
- **Phone- and tablet-friendly:** works at ~400px wide; big tap targets; no keyboard-only controls.
- **No time pressure by default:** timers optional, off unless turned on.
- **Visual style (optional, matches existing worksheets):** navy / teal / gold palette, Georgia serif headings.
- **Save progress locally** and export results (CSV or JSON) with: date, game, skill tag, question, answer given, correct answer, correct/incorrect, hints used.

---

## 10. Out of scope (don't include)

- Negative numbers, integers (Unit 7).
- Dividing fractions by fractions as a skill on its own (Unit 4).
- Equations with variables like 0.25x = 12 (Unit 6) — solve percents with tables/diagrams instead.
- Percent increase/decrease formulas, simple interest, markup chains (7th grade).
- Proportional relationship graphs and constant of proportionality *k* (7th grade).
