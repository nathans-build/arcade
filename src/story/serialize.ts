/*
 * Story → `.story` text. Round-trips with parseStory (tested in scripts/test-story.ts):
 * parse(serialize(parse(text))) gives the same model as parse(text).
 */
import { charName, type CharId } from "./roster";
import { HEADER_KEYS, type Block, type Page, type Story, type StoryHeader } from "./types";

/** Body blocks as text: paragraphs separated by blank lines, dialogue as "Name: words", headings as "~ Title ~". */
export function blocksToText(blocks: Block[]): string {
  let out = "";
  blocks.forEach((b, i) => {
    if (b.kind === "para") out += (i > 0 ? "\n\n" : "") + b.text;
    else if (b.kind === "heading") out += (i > 0 ? "\n" : "") + `~ ${b.text} ~`;
    else out += (i > 0 ? "\n" : "") + `${charName(b.who as CharId)}: ${b.text}`;
  });
  return out;
}

export function serializeHeader(h: StoryHeader): string {
  return HEADER_KEYS.map((k) => `${k}: ${h[k] ?? ""}`).join("\n");
}

/** One page. `body` is the raw body text (the Writer's Desk keeps it as typed). */
export function serializePage(p: Omit<Page, "blocks" | "line">, body: string): string {
  const out: string[] = [`=== ${p.id}`];
  if (p.scene) out.push(`scene: ${p.scene}`);
  if (p.cast.length) out.push(`cast: ${p.cast.map((c) => (c.mood && c.mood !== "normal" ? `${c.id}:${c.mood}` : c.id)).join(", ")}`);
  if (p.checkpoint) out.push("checkpoint");
  for (const c of p.clues) if (c.trim()) out.push(`clue: ${c.trim()}`);
  const b = body.replace(/\s+$/, "").replace(/^\s*\n/, "");
  if (b) out.push(b);
  if (p.gate) {
    const g = p.gate;
    out.push(`? ${g.anchor}${g.kind === "order" ? " order" : ""} : ${g.question}`);
    if (g.kind === "mc") for (const a of g.answers) out.push(`${a.correct ? "+" : "-"} ${a.text}`);
    else g.items.forEach((it, i) => out.push(`${i + 1} ${it.text}`));
    out.push(`hint: ${g.hint}`);
    out.push(`next: ${g.next}`);
  } else if (p.end) {
    out.push(`end: ${p.end.type} ${p.end.name}`.trimEnd());
  } else {
    for (const c of p.choices) out.push(`> ${c.text} -> ${c.target}`);
  }
  return out.join("\n");
}

export function serializeStory(story: Story): string {
  return [serializeHeader(story), ...story.pages.map((p) => serializePage(p, blocksToText(p.blocks)))].join("\n\n") + "\n";
}
