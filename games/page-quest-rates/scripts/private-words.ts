/*
 * Privacy check shared by the tests: the player is only ever "SpiderBen10". The words that must
 * never appear (a real first name, matched in any case, and a school's short name, matched in
 * capitals) are stored only as SHA-256 hashes, so the check itself never spells them out.
 */
import { createHash } from "node:crypto";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
/** Any-case words (compared lower case). */
const ANY_CASE = new Set(["d2653ff7cbb2d8ff129ac27ef5781ce68b2558c41a74af1f2ddca635cbeef07d"]);
/** Exact-case words (an all-capitals short name; the ordinary word in lower case is fine). */
const EXACT = new Set(["6d80381c5b38add22a1c6a0b4da0c23e7f78e0a1d993ae3f1219be773503ca02"]);

/** Returns a description of the first private word found in `text`, or null. */
export function privateWord(text: string): string | null {
  for (const m of text.matchAll(/[A-Za-z]+/g)) {
    const w = m[0];
    if (ANY_CASE.has(sha(w.toLowerCase())) || EXACT.has(sha(w))) return `a private word at offset ${m.index}`;
  }
  return null;
}
