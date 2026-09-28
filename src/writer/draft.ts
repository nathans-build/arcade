/*
 * Writer's Desk drafts: an editable form of a Story. The body is kept as typed (raw text),
 * and a page keeps its choices, gate and ending fields even while another kind is picked, so
 * switching back and forth loses nothing. Drafts serialize to `.story` text with the same
 * serializer as everything else, and are saved in localStorage (several drafts).
 */
import { parseStory } from "@/story/parse";
import { blocksToText, serializeHeader, serializePage } from "@/story/serialize";
import type { CastMember, Gate, Page, Story, StoryHeader } from "@/story/types";

export type EndKind = "choices" | "gate" | "end";

export interface DraftGate {
  kind: "mc" | "order";
  anchor: string;
  question: string;
  answers: { text: string; correct: boolean }[];
  items: string[];
  hint: string;
  next: string;
}

export interface DraftPage {
  id: string;
  scene: string;
  cast: CastMember[];
  checkpoint: boolean;
  clues: string[];
  body: string;
  kind: EndKind;
  choices: { text: string; target: string }[];
  gate: DraftGate;
  end: { type: string; name: string };
}

export interface Draft {
  id: string;
  updated: number;
  header: StoryHeader;
  pages: DraftPage[];
}

export function blankGate(): DraftGate {
  return {
    kind: "mc",
    anchor: "RL.3",
    question: "",
    answers: [
      { text: "", correct: true },
      { text: "", correct: false },
      { text: "", correct: false },
    ],
    items: ["", "", ""],
    hint: "",
    next: "",
  };
}

export function blankPage(id: string, scene = "library"): DraftPage {
  return {
    id,
    scene,
    cast: [{ id: "hero", mood: "normal" }],
    checkpoint: false,
    clues: [],
    body: "",
    kind: "end",
    choices: [],
    gate: blankGate(),
    end: { type: "win", name: "The End" },
  };
}

export function draftId(): string {
  return `d${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function newDraft(band = "4-5"): Draft {
  const start = blankPage("start");
  start.cast = [
    { id: "hero", mood: "normal" },
    { id: "quill", mood: "happy" },
  ];
  start.checkpoint = true;
  start.body = "Your story starts here. Where will it go?\nQuill: Hoo! Write me some lines, author!";
  return {
    id: draftId(),
    updated: Date.now(),
    header: {
      title: "My First Book",
      author: "SpiderBen10",
      genre: "adventure",
      band,
      cover: "library",
      blurb: "A brand-new adventure from the Writer's Desk.",
      start: "start",
    },
    pages: [start],
  };
}

function gateOf(g: DraftGate): Gate {
  return {
    kind: g.kind,
    anchor: g.anchor,
    question: g.question,
    answers: g.answers.map((a) => ({ ...a, line: 0 })),
    items: g.items.map((t) => ({ text: t, line: 0 })),
    hint: g.hint,
    next: g.next,
    line: 0,
    hintLine: 0,
    nextLine: 0,
  };
}

export function pageText(p: DraftPage): string {
  return serializePage(
    {
      id: p.id,
      scene: p.scene,
      cast: p.cast,
      checkpoint: p.checkpoint,
      clues: p.clues,
      choices: p.kind === "choices" ? p.choices.map((c) => ({ ...c, line: 0 })) : [],
      gate: p.kind === "gate" ? gateOf(p.gate) : null,
      end: p.kind === "end" ? { ...p.end, line: 0 } : null,
    },
    p.body,
  );
}

export function draftToText(d: Draft): string {
  return [serializeHeader(d.header), ...d.pages.map(pageText)].join("\n\n") + "\n";
}

export function draftPageFromPage(p: Page): DraftPage {
  const g = p.gate;
  return {
    id: p.id,
    scene: p.scene,
    cast: p.cast.map((c) => ({ ...c })),
    checkpoint: p.checkpoint,
    clues: [...p.clues],
    body: blocksToText(p.blocks),
    kind: p.gate ? "gate" : p.end ? "end" : "choices",
    choices: p.choices.map((c) => ({ text: c.text, target: c.target })),
    gate: g
      ? { kind: g.kind, anchor: g.anchor, question: g.question, answers: g.answers.map((a) => ({ text: a.text, correct: a.correct })), items: g.items.map((i) => i.text), hint: g.hint, next: g.next }
      : blankGate(),
    end: p.end ? { type: p.end.type, name: p.end.name } : { type: "win", name: "The End" },
  };
}

export function draftFromStory(s: Story, id = draftId()): Draft {
  return {
    id,
    updated: Date.now(),
    header: { title: s.title, author: s.author, genre: s.genre, band: s.band, cover: s.cover, blurb: s.blurb, start: s.start },
    pages: s.pages.map(draftPageFromPage),
  };
}

export function draftFromText(text: string): Draft {
  return draftFromStory(parseStory(text).story);
}

// ---- Storage (several drafts, per browser) ----
const KEY = "pageQuest.drafts.v1";

export function loadDrafts(): Draft[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as Draft[];
    return Array.isArray(list) ? list.filter((d) => d && d.header && Array.isArray(d.pages)) : [];
  } catch {
    return [];
  }
}

/** Drafts are stored whole (JSON), so half-written choices and gates survive a reload. */
export function saveDrafts(drafts: Draft[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts));
  } catch {
    // storage full or blocked
  }
}
