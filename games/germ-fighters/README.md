# Germ Fighters

A run-and-jump adventure inside the human body for **SpiderBen10's Arcade** (K–12, North Carolina Standard Course of
Study). Germs have snuck into eight **body zones**. Pick any zone on the **body map**, run and jump through it as
**CYTO** (a cute killer T cell with a *receptor zapper*), and **identify** the zone's stage germ with right answers.
Zapped germs poof into harmless sparkles and bubbles, and macrophage pals gobble them up: nothing gross, nothing
scary. Each identified stage germ shares an **immune skill** that works in every other zone. Identify all eight to
open the **Lymph Node** and face the **Major Virus rush**: six real viruses, cartoon-styled, each with kid-friendly,
fact-checked cards.

Built on the arcade's stage-select platformer engine (inspired by 1980s boss stage-select platformers); every name,
character, line, picture and note here is original pixel art and chiptune made in code. No external requests.

Default subject: **SCIENCE · Life science & health**. MIXED and MATH / ELA / SOCIAL STUDIES are still available.

## The cast (`src/germs/roster.ts`)

- **Cyto** (hero): a killer (cytotoxic, CD8) T cell. **Hana** (helper T cell): runs the REST stops and asks the
  Antigen Clues. **Macrophage pals** gobble poofed germs. **B cells** power Antibody Burst (Y-shaped antibody zaps).
  **Platelet friends** are the bridges in Skin & Cut and the Platelet Patch shield. **Friendly gut bacteria** give
  energy in the Gut Garden.

| Zone | Stage germ (boss) | Accurate type | Hazards | Skill earned | Weak spot |
|---|---|---|---|---|---|
| Nose & Airways | ADENO-BOUNCE | adenovirus (20-sided, long fibers) | sneeze gusts, sticky mucus, bubble lifts | Sneeze Blast (screen blast) | Cough Dash |
| Throat & Tonsils | STREP-TACULAR | Streptococcus (chain of round cells) | cough blasts | Cough Dash (dash) | Saliva Slow-Mo |
| Lung Bubbles | PNEUMO-PAIR | Streptococcus pneumoniae (pairs) | breathing puffs, breathing lifts | Breath Bounce (air jump) | Sneeze Blast |
| Bloodstream | SPIRO-SWIRL | spirochete (spiral) | heartbeat waves, red-blood-cell rafts | Plasma Float (float) | Platelet Patch |
| Stomach | HELI-COPTER | Helicobacter pylori (curvy, whip tails) | acid splashes, acid puddles | Acid Spray (3-way zap) | Villi Vault |
| Gut Garden | SALLY MONELLA | Salmonella (rod; undercooked food) | squeeze waves | Villi Vault (super jump) | Acid Spray |
| Skin & Cut | STAPH-A-LOT | Staphylococcus (grape-like bunch) | itchy scratches, splinters, platelet bridges | Platelet Patch (shield) | Plasma Float |
| Mouth & Teeth | MUTANS MUNCH | Streptococcus mutans (sugar → acid) | chomping teeth, sugar crumbs | Saliva Slow-Mo (slow germs) | Breath Bounce |

**Little germs**: rod bacteria (crawl; left alone for 8 s, K–2 12 s, they **split in two**, binary fission, once),
round cocci pairs (hop), floating virus particles (drift toward you) and coiled spiral bacteria (puff toxin bubbles).
Each zone has a glowing **infected cell** with viruses stuck on it: use the right immune skill near it to heal it,
and the thankful cell gives a 1-up heart.

### Major Virus rush (Lymph Node)

A short Lymph Node run (3 Antigen Clues) and then six Major Viruses in a row in one arena, each with its own look and
pattern. Energy refills between viruses, a lost life keeps the current virus, and game over offers **Retry from
<virus>**. Each virus shows a three-line fact card on its intro; identified viruses are saved as **virus cards**.

| Virus | Pattern | Key facts (card + questions) |
|---|---|---|
| RHINOVIRUS | hop | most common colds; "rhino" = nose; >100 types so colds come back; hands and droplets; grows best in the cooler nose; no cold vaccine; antibiotics don't help |
| INFLUENZA | zigzag | flu: fever, aches, cough, tiredness; droplets; a new vaccine every year (6 months and older); H and N spikes (H1N1); antiviral medicine; drift and shift |
| NOROVIRUS | dash | most common stomach bug; very catching (as few as ~18 particles); soap and water beat hand sanitizer (no envelope); bleach cleaners; dehydration; not the flu |
| VARICELLA | sprout | chickenpox: itchy blister-like spots; air and blisters; vaccine (live attenuated); immune memory; latent in nerves → shingles; contagious 1–2 days before the rash until blisters crust |
| MEASLES | arc | among the most contagious diseases; up to 9 in 10 unprotected contacts; lingers in a room up to 2 hours; rash starts on the face; MMR ×2 ≈ 97%; herd immunity ~95%; immune amnesia |
| CORONAVIRUS | teleport (final) | SARS-CoV-2 causes COVID-19; "corona" = crown (spike proteins); air droplets and particles; vaccines incl. mRNA (don't change DNA); spike binds ACE2; variants; some colds are other coronaviruses |

Bosses are only beaten by right answers. Zap the boss to light its **antigen panel** (3 hits, K–2 2; it also opens by
itself after 10 s, K–2 6 s). Right = a big hit; wrong = blocked + explanation, never HP, energy or lives. Using the
stage germ's weak-spot skill makes the next right answer a double hit (any skill works on a Major Virus). Stage germ
HP: K–2 3, 3–5 4, 6–12 5. Major Virus HP: K–2 2, 3–8 3, 9–12 4 (Coronavirus +1).

## How a zone plays

Two halves of three sections each (boss door at about 3,700–4,700 px), seven or eight checkpoints, Hana's **REST
stop** halfway (checkpoint + two energy cells), then three **Antigen Clues**: glowing germs with a **?** floating in
front of a sticky **biofilm wall** that no jump or skill gets past. Zap one for a question from the zone's source.
Right: +10 energy (K–2 +12), +8 skill meter and often a power-up (always for the first right answer in a zone that
has not given one; then 60%, K–2 75%). Wrong: the explanation, +3 energy, a 10% (K–2 15%) power-up chance, and the
wall still goes away. Lives are only lost to hazards; K–2 gets 5 lives, softer bumps, narrower gaps, fewer germs,
slower hazards and pits that cost energy instead of a life.

**Power-ups** (`src/germs/boosts.ts`, each with a one-line science note shown in the clue panel):

| Power-up | Effect | Time |
|---|---|---|
| Phase Through Membrane | germs, viruses and their shots pass through you (pits and hazards still count) | 8 s |
| Lymph Leap | jump about 97 px instead of 50 (reaches the high ledges) | 10 s |
| Vaccine Memory | learned immunity: blocks the next bump or shot, then it's used | 20 s |
| Fever Boost | run 1.6× faster (a fever slows many germs and speeds up immune cells) | 10 s |
| Antibody Burst | B cell help: Y-shaped antibody zaps every 4 frames, up to 5 on screen | 10 s |
| Mucus Shield | sticky coat: every germ shot that touches you gets stuck (bumps still hurt) | 12 s |

## Questions (`src/germs/health.ts`, `src/germs/viruses.ts`, `src/germs/questions.ts`)

- **Health bank**: K–2 24, 3–5 24, 6–8 22, 9–12 22 items (germs vs. healthy habits; body systems and the body's
  defenses; cells, bacteria vs. viruses, antibiotics, immune response, vaccines, spread; innate vs. adaptive immunity,
  T/B cells, antigens, MHC, lytic/lysogenic cycles, resistance, herd immunity, vaccine types). Items are tagged with
  the zones they fit; each zone asks its own first (about 2 in 3), then the rest of the band and the kit's
  life-science items that fit a health theme.
- **Virus fact questions**: 4 per virus per band (96).
- **Modes**: SCIENCE · Life & health (default) and SCIENCE · ALL (adds the rest of the kit's science); MIXED (every
  other question is the zone's partner subject: math, ELA or social studies); one subject (each zone takes its own
  topic of it); one topic. The Major Viruses ask their own facts in the health modes and MIXED, else the chosen
  subject, and always show their fact card.
- **NC codes**: K–5 habits use Healthful Living *Personal & Consumer Health* codes `K.PCH.1` … `5.PCH.1` (format from
  the 2010 Essential Standards: please verify against the current Healthful Living numbering); 3–5 science uses
  `LS.3.1.2` (skin, unconfirmed in the kit), `LS.4.1.1`, `LS.5.1.1`, `LS.5.1.2` (body systems), `LS.5.2.2`
  (decomposers / helpful microbes, a stretch for some items); 6–8 `LS.7.1.1–.3`, `LS.8.1.1` (pathogens), `LS.8.1.2`
  (epidemics, pandemics); 9–12 Biology `LS.Bio.1.4`, `LS.Bio.1.5`, `LS.Bio.3.1` (closest fit for the immune system),
  `LS.Bio.9.1` (antibiotic resistance).

## Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → | ◀ ▶ |
| Jump | ↑ or Space | JUMP |
| Receptor zapper (hold to keep zapping) | Z | ZAP |
| Use / switch immune skill | X / C | SKILL / SWAP |
| Answer | 1–4 or A–D | tap an answer |
| Continue after an answer | Enter or Space | the yellow button |
| Pause / mute / read aloud | Esc or P / M / R | toolbar buttons |

Save (this device): `arcade.germ-fighters.save.v1` (identified zones, virus cards, rush cleared); subject/topic
`arcade.germ-fighters.subject` / `.topic`. The toolbar sits above every overlay (z-index) and full-screen overlays
on phones leave room for it at the top.

## Music (`src/music.ts`)

Original 4-channel chiptunes: **Body Map** (stage select), eight zone themes on one E-minor patrol groove with their
own leads, keys and tempos (Nose & Airways, Throat & Tonsils, Lung Bubbles, Bloodstream, Stomach, Gut Garden,
Skin & Cut, Mouth & Teeth), **Lymph Node** (the rush run), **Germ Showdown** (stage germ fights), **Major Virus Rush**
(boss rush); jingles **Germ Alert**, **Antigen Identified**, **Immune Boost!**, **Germ Identified** (stage cleared),
**Virus Spotted**, **Immune System Victory** (final fanfare) and **Cyto Needs a Rest** (game over).

## Develop

```sh
npm ci
npm test        # tsx scripts/check-rules.ts (cast, fact tables, every question in every grade and mode, boss rules,
                # stages, splitting bacteria, the bot clearing all 8 zones and the 6-virus rush in all 4 bands,
                # skills, power-ups, Antigen Clues, save, topics) + scripts/check-music.ts
npm run build   # tsc --noEmit && vite build
node scripts/playtest.cjs   # Chromium playtest; serve dist at /germ-fighters/ and site/fonts at /fonts/ on port 8911
                            # (or BASE=...); ONLY="phone" runs matching scenarios; SHOT=path saves a 640x400 picture
```

`src/kit/` is an identical copy of the arcade's `kit/`. `?debug` exposes `window.__gf` (`warpToBoss(virus?)`,
`forceQuestion()`, `giveBoost(id)`, `skipToRush(n)`), `__gfQuiz`, `__gfSave`, `__gfScreen` and the kit's `__music`.
