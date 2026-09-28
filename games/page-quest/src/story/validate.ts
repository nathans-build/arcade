/*
 * `.story` validator: everything the parser can't see line by line. Used by the node check
 * (scripts/check-stories.ts), the game (books with errors are not put on the shelf) and the
 * Writer's Desk live panel.
 */
import { parseStory } from "./parse";
import { storyReadability, type Readability } from "./readability";
import {
  ANCHORS, BANDS, CHAR_IDS, ENDING_TYPES, GENRES, ID_RE, MOODS, MOOD_ALIASES, SCENES, type Mood,
} from "./roster";
import { HEADER_KEYS, type Issue, type Page, type Story } from "./types";

export const LIMITS = { blurb: 120, choice: 48, answer: 70, maxChoices: 4, maxCast: 3 };

export interface StoryStats {
  pages: number;
  reachable: number;
  endings: { win: number; lose: number; secret: number };
  gates: { mc: number; order: number };
  checkpoints: number;
  readability: Readability;
}

export interface CheckResult {
  story: Story;
  issues: Issue[];
  errors: Issue[];
  warnings: Issue[];
  stats: StoryStats;
}

/** The mood the engine shows for a written mood ("worried" → "scared"; unknown → "normal"). */
export function resolveMood(m: string): Mood {
  if ((MOODS as readonly string[]).includes(m)) return m as Mood;
  return MOOD_ALIASES[m] ?? "normal";
}

/** Page ids a page leads to. */
export function exits(p: Page): string[] {
  if (p.gate) return p.gate.next ? [p.gate.next] : [];
  return p.choices.map((c) => c.target);
}

export function validateStory(story: Story): { issues: Issue[]; stats: StoryStats } {
  const issues: Issue[] = [];
  const err = (line: number, message: string, page?: string) => issues.push({ level: "error", line, message, page });
  const warn = (line: number, message: string, page?: string) => issues.push({ level: "warning", line, message, page });

  // ---- Header ----
  for (const k of HEADER_KEYS) if (!story[k]) err(story.headerLines[k] ?? 1, `Missing header field "${k}:".`);
  const hl = story.headerLines;
  if (story.genre && !(GENRES as readonly string[]).includes(story.genre)) err(hl.genre ?? 1, `genre must be one of ${GENRES.join(", ")} (found "${story.genre}").`);
  if (story.band && !(BANDS as readonly string[]).includes(story.band)) err(hl.band ?? 1, `band must be one of ${BANDS.join(", ")} (found "${story.band}").`);
  if (story.cover && !(SCENES as readonly string[]).includes(story.cover)) err(hl.cover ?? 1, `cover "${story.cover}" is not a scene. Scenes: ${SCENES.join(", ")}.`);
  if (story.blurb.length > LIMITS.blurb) err(hl.blurb ?? 1, `blurb is ${story.blurb.length} characters; the limit is ${LIMITS.blurb}.`);
  if (story.title.length > 40) warn(hl.title ?? 1, `title is ${story.title.length} characters; over 40 gets cut short on the book spine.`);

  // ---- Page ids ----
  const byId = new Map<string, Page>();
  for (const p of story.pages) {
    if (!p.id) continue;
    if (!ID_RE.test(p.id)) err(p.line, `Page id "${p.id}" may use only lowercase letters, digits and hyphens.`, p.id);
    if (byId.has(p.id)) err(p.line, `Duplicate page id "${p.id}" (first at line ${byId.get(p.id)!.line}).`, p.id);
    else byId.set(p.id, p);
  }
  if (story.pages.length === 0) err(0, 'The book has no pages. Pages start with "=== page-id".');
  if (story.start && story.pages.length && !byId.has(story.start)) err(hl.start ?? 1, `start page "${story.start}" does not exist.`);

  const lowBand = story.band === "4-5";

  // ---- Each page ----
  for (const p of story.pages) {
    const id = p.id;
    if (!p.scene) err(p.line, `Page "${id}" needs a "scene:" line.`, id);
    else if (!(SCENES as readonly string[]).includes(p.scene)) err(p.line, `Unknown scene "${p.scene}" on page "${id}". Scenes: ${SCENES.join(", ")}.`, id);

    if (p.cast.length > LIMITS.maxCast) err(p.line, `Page "${id}" has ${p.cast.length} cast members; the most is ${LIMITS.maxCast}.`, id);
    const seen = new Set<string>();
    for (const c of p.cast) {
      if (!(CHAR_IDS as string[]).includes(c.id)) err(p.line, `Unknown character "${c.id}" on page "${id}". Characters: ${CHAR_IDS.join(", ")}.`, id);
      if (seen.has(c.id)) warn(p.line, `"${c.id}" is in the cast twice on page "${id}".`, id);
      seen.add(c.id);
      if (!(MOODS as readonly string[]).includes(c.mood)) {
        if (MOOD_ALIASES[c.mood]) warn(p.line, `Mood "${c.mood}" is not in the list (${MOODS.join(", ")}); shown as "${MOOD_ALIASES[c.mood]}".`, id);
        else err(p.line, `Unknown mood "${c.mood}" for ${c.id} on page "${id}". Moods: ${MOODS.join(", ")}.`, id);
      }
    }
    for (const b of p.blocks) {
      if (b.kind !== "say") continue;
      if (b.who === "hero") warn(p.line, `Page "${id}": the hero never has dialogue lines ("Hero: ..."); the story says "you".`, id);
      else if (!p.cast.some((c) => c.id === b.who)) warn(p.line, `Page "${id}": ${b.who} speaks but is not in the cast, so no sprite animates.`, id);
    }
    if (p.blocks.length === 0 && !p.gate) warn(p.line, `Page "${id}" has no story text.`, id);

    const kinds = (p.choices.length ? 1 : 0) + (p.gate ? 1 : 0) + (p.end ? 1 : 0);
    if (kinds === 0) err(p.line, `Page "${id}" has no way forward: end it with choices ("> text -> page"), a gate ("? ..."), or "end: win|lose|secret Name".`, id);

    if (p.choices.length > LIMITS.maxChoices) err(p.choices[LIMITS.maxChoices].line, `Page "${id}" has ${p.choices.length} choices; the most is ${LIMITS.maxChoices}.`, id);
    for (const c of p.choices) {
      if (!c.text) err(c.line, "A choice needs some text before the ->.", id);
      if (c.text.length > LIMITS.choice) err(c.line, `Choice text is ${c.text.length} characters; the limit is ${LIMITS.choice}: "${c.text}".`, id);
      if (!byId.has(c.target)) err(c.line, `Choice goes to page "${c.target}", which does not exist.`, id);
    }

    const g = p.gate;
    if (g) {
      if (!(g.anchor in ANCHORS)) err(g.line, `Unknown standard anchor "${g.anchor}". Use RL.1–RL.9, RI.1–RI.9, L.1–L.6, W.1–W.3, RF.3 or RF.4.`, id);
      else if (g.anchor === "RL.8") warn(g.line, "RL.8 is not used for literature in the standards; consider RL.1, RL.3 or RI.8.", id);
      else if (g.anchor.startsWith("RF.") && !lowBand) warn(g.line, `${g.anchor} (foundational skills) ends at grade 5; older players are scored on ${g.anchor === "RF.3" ? "L.x.4" : "RL.x.10"}.`, id);
      if (!g.question) err(g.line, "The gate needs a question after the colon.", id);
      if (g.kind === "mc") {
        const n = g.answers.length;
        if (n < 2 || n > 4) err(g.line, `A multiple-choice gate needs 2–4 answers ("+" right, "-" wrong); found ${n}.`, id);
        const right = g.answers.filter((a) => a.correct).length;
        if (right !== 1) err(g.line, `A multiple-choice gate needs exactly one "+" answer; found ${right}.`, id);
        const texts = new Set<string>();
        for (const a of g.answers) {
          if (!a.text) err(a.line, "Empty answer.", id);
          if (a.text.length > LIMITS.answer) err(a.line, `Answer is ${a.text.length} characters; the limit is ${LIMITS.answer}.`, id);
          const k = a.text.toLowerCase();
          if (texts.has(k)) err(a.line, `Duplicate answer "${a.text}".`, id);
          texts.add(k);
        }
      } else {
        const n = g.items.length;
        if (n < 3 || n > 5) err(g.line, `An order gate needs 3–5 numbered items; found ${n}.`, id);
        const texts = new Set<string>();
        for (const it of g.items) {
          if (it.text.length > LIMITS.answer) err(it.line, `Order item is ${it.text.length} characters; the limit is ${LIMITS.answer}.`, id);
          const k = it.text.toLowerCase();
          if (texts.has(k)) err(it.line, `Duplicate order item "${it.text}".`, id);
          texts.add(k);
        }
      }
      if (!g.hint) err(g.line, 'The gate needs a "hint:" line (Quill says it after a wrong answer).', id);
      if (!g.next) err(g.line, 'The gate needs a "next:" line (the page after the question).', id);
      else if (!byId.has(g.next)) err(g.nextLine || g.line, `Gate next: goes to page "${g.next}", which does not exist.`, id);
    }

    const e = p.end;
    if (e) {
      if (!(ENDING_TYPES as readonly string[]).includes(e.type)) err(e.line, `Ending type must be win, lose or secret (found "${e.type}").`, id);
      if (!e.name) err(e.line, 'The ending needs a name: "end: win The Treasure Keeper".', id);
      if (e.type === "lose" && lowBand) err(e.line, "Lose endings are not allowed in 4-5 books.", id);
    }
  }

  // ---- Paths: reachable from start, and every reachable page can reach an ending ----
  const reach = new Set<string>();
  if (byId.has(story.start)) {
    const queue = [story.start];
    while (queue.length) {
      const id = queue.shift()!;
      if (reach.has(id) || !byId.has(id)) continue;
      reach.add(id);
      queue.push(...exits(byId.get(id)!));
    }
    for (const p of byId.values()) if (!reach.has(p.id)) err(p.line, `Page "${p.id}" can't be reached from the start page "${story.start}".`, p.id);

    const canEnd = new Set<string>();
    for (const p of byId.values()) if (p.end) canEnd.add(p.id);
    let grew = true;
    while (grew) {
      grew = false;
      for (const p of byId.values()) {
        if (!canEnd.has(p.id) && exits(p).some((x) => canEnd.has(x))) {
          canEnd.add(p.id);
          grew = true;
        }
      }
    }
    for (const id of reach) {
      const p = byId.get(id)!;
      const hasExit = exits(p).length > 0 || !!p.end;
      if (hasExit && !canEnd.has(id)) err(p.line, `From page "${id}" the reader can never reach an ending (a loop with no way out).`, id);
    }
  }

  const ends = { win: 0, lose: 0, secret: 0 };
  let mc = 0;
  let order = 0;
  let checkpoints = 0;
  for (const p of story.pages) {
    if (p.end && p.end.type in ends) ends[p.end.type as keyof typeof ends]++;
    if (p.gate?.kind === "mc") mc++;
    if (p.gate?.kind === "order") order++;
    if (p.checkpoint) checkpoints++;
  }
  if (story.pages.length && ends.win + ends.secret === 0) warn(0, "The book has no win or secret ending.");
  if (!lowBand && story.band && checkpoints === 0 && story.pages.length) warn(0, "No checkpoint pages: players who lose restart at the start page.");

  issues.sort((a, b) => a.line - b.line);
  return {
    issues,
    stats: {
      pages: story.pages.length,
      reachable: reach.size,
      endings: ends,
      gates: { mc, order },
      checkpoints,
      readability: storyReadability(story),
    },
  };
}

export function checkStory(text: string): CheckResult {
  const { story, issues: syntax } = parseStory(text);
  const { issues, stats } = validateStory(story);
  const all = [...syntax, ...issues].sort((a, b) => a.line - b.line);
  return {
    story,
    issues: all,
    errors: all.filter((i) => i.level === "error"),
    warnings: all.filter((i) => i.level === "warning"),
    stats,
  };
}

export function formatIssue(i: Issue): string {
  return `${i.line ? `line ${i.line}: ` : ""}${i.level === "error" ? "ERROR" : "warning"}: ${i.message}`;
}

