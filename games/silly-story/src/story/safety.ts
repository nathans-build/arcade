/*
 * Kid-safe word filter. Typed words never leave the device; a rude or unsafe word is quietly
 * swapped for "banana". Matching is whole-word (so "class", "grass", "assassin", "Scunthorpe"
 * and "cocktail" are fine), with look-alike letters (sh1t, $hit, a55), stretched letters
 * (fuuuun), spaced-out letters (f u n) and common endings (-s, -ed, -ing) handled.
 *
 * The list is stored ROT13-encoded so the words aren't readable at a glance in the source.
 * A trailing * also blocks words that start with it (e.g. the -ing and -y forms).
 */

export const ENCODED =
  "shpx* shx shxf shd spx sphx sipx cuhpx cuhx shp shxx shxva shpxva rssvat zbgureshpxre* zbsb fuvg* fug fuvm ohyyfuvg qvcfuvg " +
  "ubefrfuvg ovgpu* ovngpu ovfu onfgneq qnza* tbqqnza* qnzzvg uryy penc penccl nff nffubyr* nefr nefrubyr qhzonff wnpxnff onqnff " +
  "fznegnff qvpx qvpxurnq pbpx pbpxf pbpxfhpxre* cevpx chffl chffvrf phag* gjng* jnax* obyybpxf cvff cvffrq cvffvat fyhg* juber* " +
  "fxnax gubg qbhpur* fgsh jgs bzst yzsnb frk frkl frkhny cbea* ahqr ahqrf obbo obbof obbovrf gvg gvgf gvggl gvggvrf cravf " +
  "intvan qvyqb ubeal betnfz rerpgvba pbaqbz avttre* avttn* avtt avtn arteb snt sntf snttbg* qlxr genaal ergneq* ergneqrq fcvp " +
  "puvax xvxr jrgonpx tbbx pbba enturnq anmv anmvf uvgyre xxx qehax* xvyy xvyyrq xvyyvat xvyyf zheqre* fhvpvqr encr* encvfg zbyrfg* " +
  "fgno fgnoorq pbpnvar urebva zrgu znevwhnan fgbare ibqxn juvfxrl orre";

export const rot13 = (s: string) => s.replace(/[a-z]/g, (c) => String.fromCharCode(((c.charCodeAt(0) - 97 + 13) % 26) + 97));

interface Entry {
  exact: RegExp;
  prefix: RegExp | null;
}

/** "boob" → /^b+o{2,}b+$/: each letter may be stretched, doubled letters must stay at least doubled. */
function stretchy(word: string): string {
  let out = "";
  for (let i = 0; i < word.length; ) {
    let j = i;
    while (j < word.length && word[j] === word[i]) j++;
    const n = j - i;
    out += n === 1 ? `${word[i]}+` : `${word[i]}{${n},}`;
    i = j;
  }
  return out;
}

const ENTRIES: Entry[] = ENCODED.split(" ").filter(Boolean).map((e) => {
  const star = e.endsWith("*");
  const w = rot13(star ? e.slice(0, -1) : e);
  const core = stretchy(w);
  // Prefixes match the plain spelling only, so "shiitake"-style words stay fine.
  return { exact: new RegExp(`^${core}$`), prefix: star ? new RegExp(`^${w}`) : null };
});

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s", "!": "i", "|": "i", "€": "e" };

/** Lowercase, look-alike letters to letters, drop hyphens/apostrophes. Several readings for "1" (i or l). */
function readings(token: string): string[] {
  const lower = token.toLowerCase();
  if (!/[a-z]/.test(lower)) return []; // plain numbers are fine
  const base = lower.replace(/[0-9@$!|€]/g, (c) => LEET[c] ?? c).replace(/[^a-z]/g, "");
  const alt = lower.replace(/1/g, "l").replace(/[0-9@$!|€]/g, (c) => LEET[c] ?? c).replace(/[^a-z]/g, "");
  const plain = lower.replace(/[^a-z]/g, "");
  return [...new Set([base, alt, plain])].filter(Boolean);
}

function stems(w: string): string[] {
  const out = [w];
  for (const suf of ["ing", "ed", "es", "s"]) if (w.endsWith(suf) && w.length > suf.length + 2) out.push(w.slice(0, -suf.length));
  return out;
}

function badWord(w: string): boolean {
  for (const s of stems(w)) {
    for (const e of ENTRIES) {
      if (e.exact.test(s)) return true;
      if (e.prefix && e.prefix.test(w)) return true;
    }
  }
  return false;
}

/** True if any word (or the whole thing with spaces squeezed out) is on the list. */
export function isRude(text: string): boolean {
  const tokens = text.split(/[\s.,;:!?"()[\]{}<>/\\_+=*&^%#~`]+/).filter(Boolean);
  // "$" and "!" and "@" are look-alike letters, so put them back for the token pass.
  const raw = text.split(/[\s.,;:?"()[\]{}<>/\\_+=*&^%#~`]+/).filter(Boolean);
  for (const t of [...tokens, ...raw]) for (const r of readings(t)) if (badWord(r)) return true;
  // Spaced-out letters: "f u n" → "fun" (only when the pieces are short, so normal phrases aren't glued together).
  const pieces = text.trim().split(/[\s.\-_]+/).filter(Boolean);
  if (pieces.length > 1 && pieces.every((p) => p.length <= 2)) {
    for (const r of readings(pieces.join(""))) if (badWord(r)) return true;
  }
  return false;
}

export const SWAP_WORD = "banana";

/** A typed blank: rude → "banana", otherwise unchanged. */
export function cleanWord(word: string): string {
  return isRude(word) ? SWAP_WORD : word;
}

/** Longer text (a kid's own story template or title): swap just the rude words. */
export function cleanText(text: string): string {
  let out = text.replace(/[A-Za-z0-9@$!|'’\-]+/g, (tok) => {
    // Leave [blank] markers alone.
    return isRude(tok) ? SWAP_WORD : tok;
  });
  // Spaced-out letters across several tokens.
  out = out.replace(/\b(?:[A-Za-z0-9@$]{1,2}[ .\-_]){2,}[A-Za-z0-9@$]{1,2}\b/g, (m) => (isRude(m) ? SWAP_WORD : m));
  return out;
}

export const MAX_WORD = 20;

/** What a word box accepts: letters, numbers, spaces, hyphens and apostrophes, at most 20 characters. */
export function sanitizeInput(raw: string, max = MAX_WORD): string {
  return raw
    .replace(/[’‘`]/g, "'")
    .replace(/[^A-Za-z0-9 '\-]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+/, "")
    .slice(0, max);
}
