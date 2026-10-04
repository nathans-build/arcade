/*
 * Banned-word lint (run by npm test over every string the game shows).
 *  - Everywhere: slurs and slur fragments, "savage", "redskin", "squaw", "died of", "you have died",
 *    "tombstone", "dysentery", "Oregon Trail" (the trademark; the route is named in readings only as
 *    "the trail" or "the overland trails"), comedy markers in Northbound.
 *  - In anything the player does (choice labels, outcomes, store items): hunting and shooting verbs.
 *    The player never hunts. Readings may say that Native hunters or a hunter named Hans Wagner
 *    existed; that describes history, not an action the player takes.
 * The slur list is kept as patterns (partly obfuscated) so this file never spells them out.
 */

const SLUR_PATTERNS: RegExp[] = [
  /\bn[i1]gg/i,
  /\bnegr[eo]s?\b(?!\s+(migrants|history|migration|life))/i,
  /\bcolou?red\s+(man|woman|boy|girl|people)\b/i,
  /\bsquaw/i,
  /\bredskin/i,
  /\bsavages?\b/i,
  /\bhalf[- ]breed/i,
  /\binjuns?\b/i,
  /\bheathens?\b/i,
  /\bmulatto/i,
  /\bpickaninn/i,
  /\bdarkies?\b/i,
  /\bcoons?\b/i,
];

const DEATH_PATTERNS: RegExp[] = [/died of/i, /you have died/i, /tombstones?/i, /dysentery/i, /\bR\.?I\.?P\.?\b/];

export const TRADEMARK = /oregon\s+trail/i;

const HUNT_PATTERNS: RegExp[] = [/\bhunt(s|ing|ed)?\b/i, /\bshoot(s|ing)?\b/i, /\bshot\b/i, /\brifles?\b/i, /\bbullets?\b/i, /\bammunition\b/i, /\bkill(s|ed|ing)?\b/i];

const COMEDY_PATTERNS: RegExp[] = [/\blol\b/i, /\bhaha\b/i, /\bfunny\b/i, /\bsilly\b/i, /\bjoke\b/i, /!{2,}/];

export interface LintHit {
  where: string;
  rule: string;
  text: string;
}

/** Every string the game shows. `action` strings are things the player does. */
export function lint(where: string, text: string, opts: { action?: boolean; serious?: boolean; quoted?: boolean } = {}): LintHit[] {
  const hits: LintHit[] = [];
  for (const re of SLUR_PATTERNS) if (re.test(text)) hits.push({ where, rule: `slur/derogatory ${re}`, text });
  for (const re of DEATH_PATTERNS) if (re.test(text)) hits.push({ where, rule: `death trope ${re}`, text });
  if (!opts.quoted && TRADEMARK.test(text)) hits.push({ where, rule: "trademark", text });
  if (opts.action) for (const re of HUNT_PATTERNS) if (re.test(text)) hits.push({ where, rule: `hunting/shooting verb ${re}`, text });
  if (opts.serious) for (const re of COMEDY_PATTERNS) if (re.test(text)) hits.push({ where, rule: `comedy marker ${re}`, text });
  return hits;
}
