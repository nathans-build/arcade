/*
 * `.story` parser (format: PAGE_QUEST.md). Turns text into a typed Story plus syntax issues
 * with line numbers. It is lenient: it keeps going after mistakes so the validator (and the
 * Writer's Desk) can report everything at once. Semantic checks live in validate.ts.
 */
import { charByName } from "./roster";
import { HEADER_KEYS, type Block, type Gate, type Issue, type Page, type Story, type StoryHeader } from "./types";

const PAGE_RE = /^={3,}\s*(.*?)\s*=*\s*$/;
const KEY_RE = /^([A-Za-z][A-Za-z-]*)\s*:\s*(.*)$/;
const CHOICE_RE = /^>\s*(.*?)\s*(?:->|→)\s*(\S*)\s*$/;
const GATE_RE = /^\?\s*([A-Za-z]+\.[0-9A-Za-z.-]+)\s*(order)?\s*:\s*(.*)$/i;
const ORDER_ITEM_RE = /^(\d+)[.)]?\s+(.+)$/;

function emptyPage(id: string, line: number): Page {
  return { id, line, scene: "", cast: [], checkpoint: false, clues: [], blocks: [], choices: [], gate: null, end: null };
}

/** Normalises an anchor written with a grade ("RL.4.3", "RL.9-10.3") to the gradeless form ("RL.3"). */
export function stripGrade(anchor: string): string {
  const m = /^([A-Za-z]+)\.(?:\d+(?:-\d+)?|K)\.(\d+)[a-z]?$/.exec(anchor);
  return m ? `${m[1].toUpperCase()}.${m[2]}` : anchor.toUpperCase();
}

export function parseStory(text: string): { story: Story; issues: Issue[] } {
  const issues: Issue[] = [];
  const story: Story = { title: "", author: "", genre: "", band: "", cover: "", blurb: "", start: "", pages: [], headerLines: {} };
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);

  let page: Page | null = null;
  let para: string[] = [];
  /** Where the page's ending part is: while a gate is open, +/-/numbered/hint/next lines belong to it. */
  let gate: Gate | null = null;
  let terminatorLine = 0;

  const err = (line: number, message: string) => issues.push({ level: "error", line, message, page: page?.id });
  const warn = (line: number, message: string) => issues.push({ level: "warning", line, message, page: page?.id });

  const flush = () => {
    if (page && para.length) page.blocks.push({ kind: "para", text: para.join("\n") });
    para = [];
  };
  const closePage = () => {
    flush();
    gate = null;
    terminatorLine = 0;
  };
  const terminator = (ln: number, kind: "choices" | "gate" | "end") => {
    if (!page) return;
    const has = { choices: page.choices.length > 0, gate: !!page.gate, end: !!page.end };
    const others = (Object.keys(has) as (keyof typeof has)[]).filter((k) => k !== kind && has[k]);
    if (others.length) err(ln, `Page "${page.id}" can end with only ONE of: choices, a gate, or an ending (it already has ${others.join(" and ")}).`);
    if (kind !== "choices" && has[kind]) err(ln, `Page "${page.id}" has more than one ${kind === "gate" ? "gate (? line)" : "end: line"}.`);
    if (!terminatorLine) terminatorLine = ln;
  };

  lines.forEach((raw, i) => {
    const ln = i + 1;
    const line = raw.trim();
    if (line.startsWith("#")) return;

    const pm = PAGE_RE.exec(line);
    if (pm) {
      closePage();
      const id = pm[1];
      if (!id) err(ln, 'A page line needs an id, like "=== dock".');
      page = emptyPage(id, ln);
      story.pages.push(page);
      return;
    }

    // ---- Header (before the first page) ----
    if (!page) {
      if (!line) return;
      const km = KEY_RE.exec(line);
      if (!km) {
        err(ln, `Header lines look like "key: value" (found "${line.slice(0, 40)}"). Pages start with "=== page-id".`);
        return;
      }
      const key = km[1].toLowerCase() as keyof StoryHeader;
      if (!HEADER_KEYS.includes(key)) {
        warn(ln, `Unknown header field "${km[1]}" (known: ${HEADER_KEYS.join(", ")}). It is ignored.`);
        return;
      }
      if (story.headerLines[key]) warn(ln, `Header field "${key}" appears twice; the last one wins.`);
      story[key] = km[2].trim();
      story.headerLines[key] = ln;
      return;
    }

    const p: Page = page;
    if (!line) {
      flush();
      return;
    }

    // ---- Gate parts (after a "?" line) ----
    if (gate) {
      const g: Gate = gate;
      if (line.startsWith("+") || (line.startsWith("-") && !line.startsWith("->"))) {
        const t = line.slice(1).trim();
        if (g.kind === "order") err(ln, `An order gate lists numbered items ("1 ..."), not "${line[0]}" answers.`);
        else g.answers.push({ text: t, correct: line[0] === "+", line: ln });
        return;
      }
      const om = ORDER_ITEM_RE.exec(line);
      if (om) {
        if (g.kind === "mc") err(ln, 'Numbered items are for order gates. Write "? RL.5 order : question" to make an order gate, or use "+"/"-" answers.');
        else {
          if (Number(om[1]) !== g.items.length + 1) warn(ln, `Order item numbered ${om[1]}, expected ${g.items.length + 1}. Items are used in the order they are written.`);
          g.items.push({ text: om[2].trim(), line: ln });
        }
        return;
      }
      const km = KEY_RE.exec(line);
      if (km && km[1].toLowerCase() === "hint") {
        if (g.hintLine) warn(ln, "The gate has two hint: lines; the last one wins.");
        g.hint = km[2].trim();
        g.hintLine = ln;
        return;
      }
      if (km && km[1].toLowerCase() === "next") {
        if (g.nextLine) warn(ln, "The gate has two next: lines; the last one wins.");
        g.next = km[2].trim();
        g.nextLine = ln;
        return;
      }
    }

    // ---- Choices ----
    if (line.startsWith(">")) {
      const cm = CHOICE_RE.exec(line);
      if (!cm || !cm[2]) {
        err(ln, 'A choice looks like "> choice text -> page-id".');
        return;
      }
      terminator(ln, "choices");
      flush();
      p.choices.push({ text: cm[1], target: cm[2], line: ln });
      return;
    }

    // ---- Gate question ----
    if (line.startsWith("?")) {
      const gm = GATE_RE.exec(line);
      if (!gm) {
        err(ln, 'A gate question looks like "? RL.3 : Why did...?" or "? RL.5 order : Put ... in order."');
        return;
      }
      terminator(ln, "gate");
      flush();
      let anchor = gm[1].toUpperCase();
      const bare = stripGrade(anchor);
      if (bare !== anchor) {
        warn(ln, `Write the anchor without the grade: "${bare}" (not "${gm[1]}"). The game adds the player's grade.`);
        anchor = bare;
      }
      gate = { kind: gm[2] ? "order" : "mc", anchor, question: gm[3].trim(), answers: [], items: [], hint: "", next: "", line: ln, hintLine: 0, nextLine: 0 };
      if (!p.gate) p.gate = gate;
      return;
    }

    const km = KEY_RE.exec(line);
    const key = km ? km[1].toLowerCase() : "";
    const val = km ? km[2].trim() : "";

    if (key === "end") {
      terminator(ln, "end");
      flush();
      const em = /^(\S+)\s*(.*)$/.exec(val);
      if (!em) {
        err(ln, 'An ending looks like "end: win The Treasure Keeper" (win, lose or secret, then its name).');
        return;
      }
      if (!p.end) p.end = { type: em[1].toLowerCase(), name: em[2].trim(), line: ln };
      return;
    }
    if (key === "scene") {
      if (p.scene) warn(ln, `Page "${p.id}" has two scene: lines; the last one wins.`);
      p.scene = val;
      return;
    }
    if (key === "cast") {
      p.cast = val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => {
          const [id, mood] = s.split(":").map((x) => x.trim().toLowerCase());
          return { id, mood: mood || "normal" };
        });
      return;
    }
    if (key === "clue") {
      if (val) p.clues.push(val);
      else warn(ln, "Empty clue: line.");
      return;
    }
    if (line.toLowerCase() === "checkpoint" || line.toLowerCase() === "checkpoint:") {
      p.checkpoint = true;
      return;
    }
    if (key === "hint" || key === "next") {
      err(ln, `"${key}:" belongs to a gate; put it after the "?" question line.`);
      return;
    }

    // ---- Body text ----
    if (terminatorLine) warn(ln, `Story text after the page's ${p.gate ? "gate" : p.end ? "ending" : "choices"} (line ${terminatorLine}) is shown with the rest of the page. Put text before the choices.`);
    const hm = /^~\s*(.*?)\s*~$/.exec(line);
    if (hm && hm[1]) {
      flush();
      p.blocks.push({ kind: "heading", text: hm[1] });
      return;
    }
    const who = km ? charByName(km[1]) : null;
    if (km && who && val) {
      flush();
      p.blocks.push({ kind: "say", who, text: val } as Block);
      return;
    }
    para.push(line);
  });
  closePage();
  return { story, issues };
}
