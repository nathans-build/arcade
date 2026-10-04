/*
 * Clue logic: resolving clue references against the facts table, deciding whether a clue fits a
 * place, writing the friendly "Pocket isn't here" lesson, and validating whole cases. Pure data,
 * no DOM, so the game, the tests and a future chase game can all share it.
 */
import { DIR8_WORD, DIR_WORD, dir8Verdict, dirVerdict, fmtLL, llVerdict, mainDir, mainDir8, type Dir, type Dir8 } from "./geo";
import type { CaseDef, ClueRef, Fact, Place, Tag, Verdict } from "./types";

export class World {
  readonly places = new Map<string, Place>();
  constructor(list: Place[]) {
    for (const p of list) {
      if (this.places.has(p.id)) throw new Error(`duplicate place id ${p.id}`);
      this.places.set(p.id, p);
    }
  }
  get(id: string): Place {
    const p = this.places.get(id);
    if (!p) throw new Error(`unknown place ${id}`);
    return p;
  }
}

/** How a fact key reads in a lesson ("the clue pointed to …"). */
/** "the Gateway Arch", but "Biltmore", "Mount Fuji", "granite". */
function the(v: string): string {
  if (/^(the |a |an )/i.test(v) || /^(Biltmore|Old Faithful|Mount |Big Ben|Tryon|Jockey's|Appalachian|Blackbeard|Pepsi|granite|emerald|Lake |Fraser)/.test(v)) return v;
  return `the ${v}`;
}

const LABEL: Record<string, (v: string) => string> = {
  landmark: the,
  history: the,
  people: the,
  nickname: the,
  pic: the,
  desert: the,
  symbol: the,
  between: (v) => `the ocean between ${v}`,
  around: (v) => `the ocean around ${v}`,
  home: (v) => (v === "our continent" ? "our home continent" : "the ocean that touches North Carolina"),
  region: (v) => `the ${v} region`,
  climate: (v) => (v === "hurricanes" ? "a place where hurricanes blow in" : `a place with ${v}`),
  landform: (v) => (v === "barrier island" ? "a barrier island" : `the ${v}`),
  river: (v) => `the ${v}`,
  lake: (v) => v,
  water: (v) => v,
  ocean: (v) => `the ${v}`,
  capital: (v) => (v.startsWith("capital of") ? `the ${v}` : `the capital of ${v}`),
  border: (v) => (v === "home state" ? "our home state" : `NC's neighbor to the ${v}`),
  helper: (v) => `a ${v}`,
  thing: (v) => (v.endsWith("s") ? v : `a ${v}`),
  sound: (v) => `“${v.toUpperCase()}”`,
  kind: (v) => (v === "continent" ? "a continent (land)" : "an ocean (water)"),
  size: (v) => `the ${v}`,
  animal: (v) => (v.endsWith("s") ? v : `${/^[aeiou]/i.test(v) ? "an" : "a"} ${v}`),
  continent: (v) => v,
  // grades 6–12
  country: (v) => `present-day ${v.replace(/^the /, "")}`,
  feature: (v) => `a ${v}`,
  mouth: (v) => `a river that empties into the ${v}`,
  flows: (v) => `a river that flows ${v}`,
  hemi: (v) => `the ${v} Hemisphere`,
  trait: (v) => v,
  civ: (v) => `the home of ${v}`,
  language: (v) => `a place where people speak ${v}`,
  currency: (v) => `a place that pays with the ${v}`,
  flag: (v) => `a flag with ${v}`,
  export: (v) => v,
  pop: (v) => v,
  econ: (v) => (v === "Army base" ? "a city beside a giant Army base" : `a city known for ${v}`),
  highway: (v) => `a city on ${v}`,
  port: (v) => v,
  hub: (v) => v,
  inlet: (v) => v,
  industry: (v) => `a city known for ${v}`,
  crossing: (v) => `the ${v}`,
  confluence: (v) => `the place ${v}`,
  utc: (v) => `a place on ${v}`,
  clim: (v) => `a ${v} climate`,
  plate: (v) => (v === "far from a boundary" ? "a place far from any plate boundary" : `a ${v} plate boundary`),
  trade: (v) => v,
  energy: (v) => v,
};

export function labelOf(t: Tag): string {
  if (t.k === "dir") return DIR_WORD[t.v as Dir];
  if (t.k === "dir8") return DIR8_WORD[t.v as Dir8];
  if (t.k === "ll") return `a place near ${t.v}`;
  return (LABEL[t.k] ?? ((v: string) => v))(t.v);
}

/** The fact a clue reference points to on the destination ("river" or "river=Neuse River"). */
export function factOf(place: Place, ref: ClueRef): Fact | undefined {
  const [k, v] = ref.split("=");
  return place.facts.find((f) => f.k === k && (v === undefined || f.v === v));
}

/** The tag a clue reference stands for, given the true destination (and where the clue is heard). */
export function tagOf(dest: Place, ref: ClueRef, from?: Place): Tag {
  if (ref === "dir") {
    if (!from) throw new Error("a direction clue needs a starting place");
    return { k: "dir", v: mainDir(from, dest) };
  }
  if (ref === "dir8") {
    if (!from) throw new Error("a direction clue needs a starting place");
    return { k: "dir8", v: mainDir8(from, dest) };
  }
  if (ref === "ll") return { k: "ll", v: fmtLL(dest.at) };
  const f = factOf(dest, ref);
  if (!f) throw new Error(`${dest.id} has no fact for clue "${ref}"`);
  return { k: f.k, v: f.v };
}

/** Does the tag fit `place`? Direction tags are measured from `from` on the map. */
export function holds(place: Place, tag: Tag, from?: Place): Verdict {
  if (tag.k === "dir") return from ? dirVerdict(from, place, tag.v as Dir) : "unsure";
  if (tag.k === "dir8") return from ? dir8Verdict(from, place, tag.v as Dir8) : "unsure";
  if (tag.k === "ll") return place.map === "town" ? "unsure" : llVerdict(place, tag.v);
  return place.facts.some((f) => f.k === tag.k && f.v === tag.v) ? "yes" : "no";
}

/** A first, true sentence about a place for the lesson (same key as the clue when it has one). */
function lessonFact(place: Place, k: string): Fact {
  return place.facts.find((f) => f.k === k) ?? place.facts.find((f) => f.k !== "region" && f.k !== "kind") ?? place.facts[0];
}

/**
 * The friendly local's explanation at a wrong stop: what is true HERE, and what the clue
 * really pointed to. Returns null if the clues actually fit this place (a data bug).
 */
export function deadEnd(place: Place, tags: Tag[], from: Place, short: boolean): string | null {
  const miss = tags.find((t) => holds(place, t, from) === "no");
  if (!miss) return null;
  if (miss.k === "dir") {
    const d = mainDir(from, place);
    const name = place.name[0].toUpperCase() + place.name.slice(1);
    return short
      ? `${name} is ${DIR_WORD[d].toUpperCase()} of ${from.name}. Pocket went ${DIR_WORD[miss.v as Dir].toUpperCase()}!`
      : `${name} is ${DIR_WORD[d]} of ${from.name}, but the clue said Pocket zoomed ${DIR_WORD[miss.v as Dir]}. Check the compass rose!`;
  }
  if (miss.k === "dir8") {
    const d = mainDir8(from, place);
    return `${cap(place.name)} is ${DIR8_WORD[d].toUpperCase()} of ${from.name} on the map, but the witness saw Pocket fly ${DIR8_WORD[miss.v as Dir8].toUpperCase()}. Check the compass rose!`;
  }
  if (miss.k === "ll") {
    return `${cap(place.name)} sits near ${fmtLL(place.at)}, but the clue said near ${miss.v}. Read latitude (N/S) first, then longitude (E/W).`;
  }
  const f = lessonFact(place, miss.k);
  return short ? `${f.say} Pocket wanted ${labelOf(miss)}!` : `${f.say} But the clue pointed to ${labelOf(miss)}, so Pocket didn't come here.`;
}

function cap(s: string): string {
  return s[0].toUpperCase() + s.slice(1);
}

/** The witness line for a clue (direction clues are written from the map). */
export function clueText(dest: Place, ref: ClueRef, from: Place): string {
  if (ref === "dir") return `I saw Pocket zoom ${DIR_WORD[mainDir(from, dest)].toUpperCase()} from here!`;
  if (ref === "dir8") {
    const d = mainDir8(from, dest);
    return `I saw Pocket fly off to the ${DIR8_WORD[d].toUpperCase()} across the map${d.length === 2 ? ", an in-between direction" : ""}!`;
  }
  if (ref === "ll") return `Pocket dropped a boarding pass. It says the flight lands near ${fmtLL(dest.at)}.`;
  const f = factOf(dest, ref);
  return f?.hint ?? "";
}

/** The IOU note line for a hideout trait. */
export function noteText(hideout: Place, ref: ClueRef): string {
  if (ref === "ll") return `IOU! My hideout sits near ${fmtLL(hideout.at)}.`;
  return factOf(hideout, ref)?.note ?? "";
}

export function clueIcon(dest: Place, ref: ClueRef, from: Place): string | undefined {
  if (ref === "dir") return `arrow:${mainDir(from, dest)}`;
  if (ref === "ll") return "globe";
  if (ref === "dir8") return "compass";
  return factOf(dest, ref)?.icon;
}

// ---------------------------------------------------------------- validation (tests + dev)

export interface CaseIssue {
  caseId: string;
  msg: string;
}

export interface CaseRules {
  /** Every single clue must rule out every wrong choice (picture clues for K–2). */
  eachClueDecisive: boolean;
  /** Longest witness / note line allowed. */
  maxClue: number;
  /** Picture icon required on every clue and note. */
  icons: boolean;
  /** Legs may have one unreliable (mixed-up) witness (grades 9–12). */
  unreliable?: boolean;
}

/** The mixed-up witness's line: a true fact about a WRONG option (null if the leg has none). */
export function liarText(world: World, liar: { from: string; ref: ClueRef } | undefined): string | null {
  if (!liar || !world.places.has(liar.from)) return null;
  return factOf(world.get(liar.from), liar.ref)?.hint ?? null;
}

/** Checks one case against the facts table: solvable, no accidental right answers, every dead end explained. */
export function validateCase(c: CaseDef, world: World, rules: CaseRules): CaseIssue[] {
  const out: CaseIssue[] = [];
  const bad = (msg: string) => out.push({ caseId: c.id, msg });
  const n = c.stops.length;
  if (n < 4 || n > 6) bad(`has ${n} stops (want 4–6)`);
  if (c.legs.length !== n - 2) bad(`has ${c.legs.length} legs (want ${n - 2})`);
  if (c.traits.length < 2 || c.traits.length > n - 1) bad(`has ${c.traits.length} notebook traits (want 2–${n - 1})`);
  if (new Set(c.traits).size !== c.traits.length) bad("repeats a notebook trait");
  if (new Set(c.stops).size !== n) bad("visits a stop twice");
  let places: Place[];
  try {
    places = c.stops.map((id) => world.get(id));
  } catch (e) {
    bad(String(e));
    return out;
  }
  for (const p of places) if (p.map !== c.map) bad(`${p.id} is on the ${p.map} map, not ${c.map}`);

  const checkLeg = (from: Place, dest: Place, refs: ClueRef[], opts: string[], label: string, isTrait: boolean) => {
    if (refs.length < 1 || refs.length > (isTrait ? 5 : 3)) bad(`${label}: ${refs.length} clues`);
    if (new Set(opts).size !== 3 || opts.includes(dest.id)) bad(`${label}: options must be 3 different wrong places`);
    if (opts.includes(from.id)) bad(`${label}: an option is the stop you are standing at`);
    const tags: Tag[] = [];
    for (const ref of refs) {
      if (isTrait && (ref === "dir" || ref === "dir8")) bad(`${label}: a notebook trait can't be a direction`);
      let t: Tag;
      try {
        t = tagOf(dest, ref, from);
      } catch (e) {
        bad(`${label}: ${String(e)}`);
        continue;
      }
      tags.push(t);
      if (holds(dest, t, from) !== "yes") bad(`${label}: clue "${ref}" doesn't fit the answer ${dest.id}`);
      const text = isTrait ? noteText(dest, ref) : clueText(dest, ref, from);
      if (!text) bad(`${label}: clue "${ref}" has no ${isTrait ? "note" : "hint"} text on ${dest.id}`);
      if (text.length > rules.maxClue) bad(`${label}: clue "${ref}" is ${text.length} chars (max ${rules.maxClue}): ${text}`);
      const nameWords = dest.name.replace(/^the /i, "").toLowerCase();
      if (new RegExp(`\\b${nameWords.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text)) bad(`${label}: clue "${ref}" gives away the name ${dest.name}`);
      if (rules.icons && !clueIcon(dest, ref, from)) bad(`${label}: clue "${ref}" on ${dest.id} needs a picture icon`);
    }
    for (const id of opts) {
      let o: Place;
      try {
        o = world.get(id);
      } catch (e) {
        bad(`${label}: ${String(e)}`);
        continue;
      }
      if (o.map !== c.map) bad(`${label}: option ${id} is on another map`);
      const verdicts = tags.map((t) => holds(o, t, from));
      if (verdicts.includes("unsure")) bad(`${label}: option ${id} is a borderline direction (ambiguous)`);
      if (!verdicts.includes("no")) bad(`${label}: option ${id} ALSO fits every clue (accidentally correct)`);
      if (rules.eachClueDecisive && !isTrait && verdicts.some((v) => v !== "no")) bad(`${label}: option ${id} fits one of the picture clues`);
      if (!deadEnd(o, tags, from, false)) bad(`${label}: option ${id} has no dead-end explanation`);
    }
    // at least one clue on its own must rule out all three wrong choices (asking one witness can be enough)
    if (!isTrait) {
      const solo = tags.some((t) => opts.every((id) => world.places.has(id) && holds(world.get(id), t, from) === "no"));
      if (!solo) bad(`${label}: no single clue rules out all three wrong choices`);
    }
  };

  for (let i = 0; i < c.legs.length; i++) {
    const label = `leg ${i + 1} (${places[i].id}→${places[i + 1].id})`;
    checkLeg(places[i], places[i + 1], c.legs[i].clues, c.legs[i].opts, label, false);
    const liar = c.legs[i].liar;
    if (!liar) continue;
    const from = places[i];
    const dest = places[i + 1];
    if (!rules.unreliable) bad(`${label}: this band has no unreliable witnesses`);
    if (!c.legs[i].opts.includes(liar.from)) bad(`${label}: the mixed-up witness must describe one of the wrong options`);
    if (c.legs[i].clues.length < 2) bad(`${label}: a mixed-up witness needs at least 2 reliable witnesses to out-vote it`);
    if (liar.slot < 0 || liar.slot > c.legs[i].clues.length) bad(`${label}: mixed-up witness slot ${liar.slot}`);
    if (["dir", "dir8", "ll"].includes(liar.ref)) bad(`${label}: a mixed-up witness must use a fact clue`);
    if (!world.places.has(liar.from)) continue;
    const lp = world.get(liar.from);
    const lf = factOf(lp, liar.ref);
    if (!lf?.hint) {
      bad(`${label}: mixed-up witness fact ${liar.from}.${liar.ref} has no hint`);
      continue;
    }
    if (lf.hint.length > rules.maxClue) bad(`${label}: mixed-up clue is ${lf.hint.length} chars (max ${rules.maxClue})`);
    const lt: Tag = { k: lf.k, v: lf.v };
    if (holds(dest, lt, from) !== "no") bad(`${label}: the mixed-up clue also fits the answer ${dest.id}`);
    // majority vote: the answer fits every reliable clue; every wrong option fits fewer clues in all
    const tags = c.legs[i].clues.map((r) => tagOf(dest, r, from));
    for (const id of c.legs[i].opts) {
      if (!world.places.has(id)) continue;
      const o = world.get(id);
      const score = tags.filter((t) => holds(o, t, from) === "yes").length + (holds(o, lt, from) === "yes" ? 1 : 0);
      if (score >= tags.length) bad(`${label}: with the mixed-up witness, ${id} ties the answer (${score} of ${tags.length + 1} clues)`);
      if (holds(o, lt, from) === "unsure") bad(`${label}: mixed-up clue is borderline for ${id}`);
    }
  }
  const hide = places[n - 1];
  checkLeg(places[n - 2], hide, c.traits, c.hideoutOpts, `hideout ${hide.id}`, true);
  return out;
}
