/*
 * Story templates. Blanks are written in square brackets:
 *   [noun]  [adjective]  [verb-past]  [plural-noun]  [number] …   (see BLANK_TYPES)
 *   [noun:animal]        a noun hint (animal, food, thing, vehicle, person, place)
 *   [noun:food+s]        "+s": show it as a plural in the story (K-2 picks singular picture cards)
 *   [vocab:walk-slow]    a precise-vocabulary blank (grades 9-12)
 *   [simile:fast]        a simile blank
 *   [adjective@hat]      give the blank an id; [@hat] repeats the same word later
 *   {a} / {A}            "a" or "an", whichever fits the next word
 * Kids writing their own stories can also use friendly names: [naming word], [plural noun],
 * [action word], [past tense verb], [describing word], [color], [number], [animal], [food]…
 */
import { NOUN_HINTS } from "./prompts";
import { SIMILES, VOCAB } from "./vocab";
import { BLANK_TYPES, type Blank, type BlankType, type Parsed, type Segment } from "./types";
import { numberValue, pluralize, classify } from "./grammar";

const ALIASES: Record<string, string> = {
  "naming word": "noun", "naming-word": "noun", thing: "noun:thing", animal: "noun:animal", food: "noun:food", person: "noun:person",
  place: "noun:place", vehicle: "noun:vehicle", "plural noun": "plural-noun", plural: "plural-noun", nouns: "plural-noun",
  "action word": "verb", "action-word": "verb", "past tense verb": "verb-past", "past-tense verb": "verb-past", "past verb": "verb-past",
  "verb past": "verb-past", "past-tense": "verb-past", "ing verb": "verb-ing", "-ing verb": "verb-ing", "verb ing": "verb-ing",
  "describing word": "adjective", "describing-word": "adjective", adj: "adjective", colour: "color", num: "number",
  pronoun: "pronoun-subject", "subject pronoun": "pronoun-subject", "object pronoun": "pronoun-object", prep: "preposition",
  "silly sound": "sound", "sound word": "sound", exclamation: "sound", interjection: "sound",
};

const TOKEN = /\[([^\]\[]*)\]|\{(a|A)\}/g;
const ID = /^[a-z][a-z0-9-]*$/i;

export function parseTemplate(src: string, opts: { maxBlanks?: number } = {}): Parsed {
  const segments: Segment[] = [];
  const blanks: Blank[] = [];
  const errors: string[] = [];
  const byId = new Map<string, number>();
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  const pushText = (t: string) => {
    if (!t) return;
    if (/[\[\]]/.test(t)) errors.push(`Unmatched bracket near “${t.trim().slice(0, 30)}”`);
    const prev = segments[segments.length - 1];
    if (prev && prev.kind === "text") prev.text += t;
    else segments.push({ kind: "text", text: t });
  };
  while ((m = TOKEN.exec(src))) {
    pushText(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[2]) {
      segments.push({ kind: "article", upper: m[2] === "A" });
      continue;
    }
    let body = m[1].trim().toLowerCase().replace(/\s+/g, " ");
    if (body.startsWith("@")) {
      const id = body.slice(1);
      const idx = byId.get(id);
      if (idx === undefined) errors.push(`[@${id}] repeats a blank that isn't defined before it`);
      else segments.push({ kind: "blank", blank: idx });
      continue;
    }
    let id: string | undefined;
    const at = body.lastIndexOf("@");
    if (at > 0) {
      id = body.slice(at + 1);
      body = body.slice(0, at).trim();
      if (!ID.test(id)) errors.push(`Blank id “${id}” should be letters and numbers`);
      if (byId.has(id)) errors.push(`Blank id “${id}” is used twice`);
    }
    let plural = false;
    if (body.endsWith("+s")) {
      plural = true;
      body = body.slice(0, -2).trim();
    }
    if (ALIASES[body]) body = ALIASES[body];
    const colon = body.indexOf(":");
    const typeName = (colon < 0 ? body : body.slice(0, colon)).trim();
    const hint = colon < 0 ? undefined : body.slice(colon + 1).trim();
    const type = (ALIASES[typeName] ?? typeName) as BlankType;
    if (!(BLANK_TYPES as string[]).includes(type)) {
      errors.push(`Unknown blank “[${m[1]}]”`);
      continue;
    }
    if (type === "vocab" && (!hint || !VOCAB[hint])) errors.push(`[vocab:${hint ?? ""}] needs a known vocabulary set`);
    if (type === "simile" && hint && !SIMILES[hint]) errors.push(`[simile:${hint}] needs a known simile topic`);
    if (type === "noun" || type === "plural-noun") {
      if (hint && !NOUN_HINTS[hint]) errors.push(`Unknown noun hint “${hint}”`);
    } else if (hint && type !== "vocab" && type !== "simile") errors.push(`[${type}] can't have a hint`);
    if (plural && type !== "noun") errors.push(`+s only goes on [noun] blanks`);
    const index = blanks.length;
    const blank: Blank = { index, id: id ?? `b${index + 1}`, type, ...(hint ? { hint } : {}), ...(plural ? { plural } : {}) };
    if (!id && byId.has(blank.id)) blank.id = `b${index + 1}x`;
    byId.set(blank.id, index);
    blanks.push(blank);
    segments.push({ kind: "blank", blank: index });
  }
  pushText(src.slice(last));
  if (blanks.length === 0) errors.push("A story needs at least one [blank]");
  if (opts.maxBlanks && blanks.length > opts.maxBlanks) errors.push(`Too many blanks (${blanks.length}); the most is ${opts.maxBlanks}`);
  return { segments, blanks, errors };
}

/* ---------------------------------------------------------------- filling in */

export interface FilledPiece {
  text: string;
  /** Index of the blank this came from (player's word), or -1 for story text. */
  blank: number;
}

const AN_EXCEPT = /^(uni|use|usu|uti|eu|ewe|one|once|ufo)/i;
const AN_EXTRA = /^(hour|honest|honor|heir|8|11|18|80)/i;

function article(next: string, upper: boolean): string {
  const t = next.trimStart();
  const an = (/^[aeiou]/i.test(t) && !AN_EXCEPT.test(t)) || AN_EXTRA.test(t);
  const a = an ? "an" : "a";
  return upper ? a[0].toUpperCase() + a.slice(1) : a;
}

/** The word shown in the story for one blank (plural fix-ups for +s blanks). */
export function displayWord(p: Parsed, words: string[], index: number, segIndex: number): string {
  const b = p.blanks[index];
  let w = (words[index] ?? "").trim() || "???";
  if (b.plural) {
    // "[number] [color] [noun+s]": stay singular after "one"/"1".
    let one = false;
    for (let i = segIndex - 1; i >= 0 && i >= segIndex - 4; i--) {
      const s = p.segments[i];
      if (s.kind === "blank" && p.blanks[s.blank].type === "number") {
        one = numberValue(words[s.blank] ?? "") === 1;
        break;
      }
    }
    const tags = classify(w);
    if (!one && !(tags.has("plural") && !tags.has("noun"))) w = pluralize(w);
  }
  return w;
}

/** The story with the player's words in, as pieces (so the words can be highlighted). */
export function fill(p: Parsed, words: string[]): FilledPiece[] {
  const raw: FilledPiece[] = [];
  const articles: number[] = [];
  p.segments.forEach((s, si) => {
    if (s.kind === "text") raw.push({ text: s.text, blank: -1 });
    else if (s.kind === "blank") raw.push({ text: displayWord(p, words, s.blank, si), blank: s.blank });
    else {
      articles.push(raw.length);
      raw.push({ text: s.upper ? "A" : "a", blank: -2 });
    }
  });
  // Articles look at the next piece's first letters.
  for (const i of articles) {
    const next = raw.slice(i + 1).map((r) => r.text).join("").trimStart();
    raw[i] = { text: article(next, raw[i].text === "A"), blank: -1 };
  }
  // Capitalize a player's word at the start of a sentence, a paragraph or a quotation (he said, "Boing!").
  let soFar = "";
  for (const piece of raw) {
    if (piece.blank >= 0 && (soFar.trim() === "" || /[.!?]["”']?\s*$/.test(soFar) || /\n\s*$/.test(soFar) || /(^|[.!?]\s*)["“]\s*$/.test(soFar) || /(^|[\s(])["“]$/.test(soFar))) {
      piece.text = piece.text.charAt(0).toUpperCase() + piece.text.slice(1);
    }
    soFar += piece.text;
  }
  // Merge neighbouring story text.
  const out: FilledPiece[] = [];
  for (const r of raw) {
    const prev = out[out.length - 1];
    if (prev && prev.blank === -1 && r.blank === -1) prev.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

export function filledText(p: Parsed, words: string[]): string {
  return fill(p, words).map((x) => x.text).join("");
}

/* ---------------------------------------------------------------- who's in the picture */

export interface CastLink {
  /** Noun blank index, or -1 for a fixed sprite. */
  noun: number;
  sprite?: string;
  adjs: number[];
  verb: number;
  adverb: number;
  count: number;
  anim?: string;
}

const ADJ_TYPES = new Set<BlankType>(["adjective", "color", "comparative", "superlative"]);
const VERB_TYPES = new Set<BlankType>(["verb", "verb-past", "verb-ing"]);
const isNounBlank = (b: Blank) => b.type === "noun" || b.type === "plural-noun" || (b.type === "vocab" && VOCAB[b.hint ?? ""]?.pos === "noun");
const isVerbBlank = (b: Blank) => VERB_TYPES.has(b.type) || (b.type === "vocab" && VERB_TYPES.has(VOCAB[b.hint ?? ""]?.pos as BlankType));
const isAdjBlank = (b: Blank) => ADJ_TYPES.has(b.type) || (b.type === "vocab" && VOCAB[b.hint ?? ""]?.pos === "adjective");

/** Gap text that still counts as "right before": spaces, commas, "a/an", "and", "very". */
const GLUE = /^[\s,]*((and|very|so|super|a|an|the|of)\s+)*[\s,]*$/i;

/**
 * Links blanks into the characters of the scene. Fixed cast members come from the story's `cast`;
 * every other noun blank becomes a character, wearing the describing words just before it,
 * counted by a number just before it, and doing the first action word after it (before the next noun).
 * Adverbs stick to the action word next to them. Left-over describing words color the whole scene.
 */
export function linkCast(p: Parsed, cast: import("./types").CastSpec[] = []): { links: CastLink[]; sceneAdjs: number[] } {
  const idOf = new Map(p.blanks.map((b) => [b.id, b.index]));
  const claimed = new Set<number>();
  const links: CastLink[] = [];
  const get = (id?: string) => (id && idOf.has(id) ? idOf.get(id)! : -1);
  for (const c of cast) {
    const link: CastLink = {
      noun: get(c.noun), sprite: c.sprite, adjs: (c.adj ?? []).map(get).filter((i) => i >= 0),
      verb: get(c.verb), adverb: get(c.adverb), count: get(c.count), anim: c.anim,
    };
    [link.noun, ...link.adjs, link.verb, link.adverb, link.count].forEach((i) => i >= 0 && claimed.add(i));
    links.push(link);
  }
  // Blank order as written (first appearance of each blank in the text).
  const order: { blank: number; seg: number }[] = [];
  const seen = new Set<number>();
  p.segments.forEach((s, si) => {
    if (s.kind === "blank" && !seen.has(s.blank)) {
      seen.add(s.blank);
      order.push({ blank: s.blank, seg: si });
    }
  });
  const gapIsGlue = (fromSeg: number, toSeg: number) => {
    let t = "";
    for (let i = fromSeg + 1; i < toSeg; i++) {
      const s = p.segments[i];
      if (s.kind === "text") t += s.text;
      else if (s.kind === "article") t += " a ";
      else return false;
    }
    return GLUE.test(t);
  };
  for (let k = 0; k < order.length; k++) {
    const { blank, seg } = order[k];
    const b = p.blanks[blank];
    if (claimed.has(blank) || !isNounBlank(b)) continue;
    const link: CastLink = { noun: blank, adjs: [], verb: -1, adverb: -1, count: -1 };
    claimed.add(blank);
    // Walk back over describing words / a number directly before the noun.
    let j = k - 1;
    let rightSeg = seg;
    while (j >= 0) {
      const ob = p.blanks[order[j].blank];
      if (claimed.has(order[j].blank) || !gapIsGlue(order[j].seg, rightSeg)) break;
      if (isAdjBlank(ob)) link.adjs.unshift(order[j].blank);
      else if (ob.type === "number" && link.count < 0) link.count = order[j].blank;
      else break;
      claimed.add(order[j].blank);
      rightSeg = order[j].seg;
      j--;
    }
    // Forward to the first action word before the next noun.
    for (let f = k + 1; f < order.length; f++) {
      const ob = p.blanks[order[f].blank];
      if (isNounBlank(ob) && !claimed.has(order[f].blank)) break;
      if (isVerbBlank(ob) && !claimed.has(order[f].blank)) {
        link.verb = order[f].blank;
        claimed.add(link.verb);
        break;
      }
    }
    links.push(link);
  }
  // Adverbs: next to a linked verb.
  for (const link of links) {
    if (link.verb < 0 || link.adverb >= 0) continue;
    const vi = order.findIndex((o) => o.blank === link.verb);
    for (const d of [vi + 1, vi - 1]) {
      const o = order[d];
      if (o && p.blanks[o.blank].type === "adverb" && !claimed.has(o.blank)) {
        link.adverb = o.blank;
        claimed.add(o.blank);
        break;
      }
    }
  }
  const sceneAdjs = order.map((o) => o.blank).filter((i) => !claimed.has(i) && isAdjBlank(p.blanks[i]));
  return { links, sceneAdjs };
}
