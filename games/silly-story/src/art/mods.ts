/*
 * How words change the picture.
 *   Adjectives → modifiers (color, size, sparkles, fur, upside-down, stripes, spots, see-through…)
 *   Verbs      → animations (dance, spin, jump, sleep, wobble, fly, run, swim, sing…)
 *   Adverbs    → speed and extras (quickly, slowly, loudly…)
 * Comparatives, superlatives, -ly adverbs, past tense and -ing forms are traced back to
 * their base word first (grammar.ts baseForms).
 */
import { baseForms } from "../story/grammar";

export type Particle =
  | "sparkle" | "fire" | "snow" | "stink" | "hearts" | "rain" | "drops" | "zzz" | "steam" | "notes" | "bubbles" | "speed"
  | "waves" | "confetti";
export type Overlay = "shades" | "tophat" | "crown" | "cape" | "glasses";

export interface ModEffect {
  /** Shown in the word legend: what this word did. */
  does: string;
  color?: string;
  rainbow?: boolean;
  scale?: number;
  sx?: number;
  sy?: number;
  flipY?: boolean;
  flipX?: boolean;
  alpha?: number;
  fuzzy?: boolean;
  striped?: boolean;
  spotted?: boolean;
  shiny?: boolean;
  glow?: string;
  particle?: Particle;
  overlay?: Overlay;
  wobble?: boolean;
}

export const COLOR_HEX: Record<string, string> = {
  red: "#e3262f", orange: "#ff8a1f", yellow: "#ffd23f", green: "#3fbf4f", blue: "#2f5ff0", purple: "#8b3fd9", pink: "#ff8fc8",
  brown: "#8a5a2b", black: "#2a2a3a", white: "#f4f4ff", gray: "#8a8aa0", grey: "#8a8aa0", gold: "#ffc020", golden: "#ffc020",
  silver: "#c8c8d8", violet: "#a05fe0", indigo: "#4b3fd0", turquoise: "#3fd0c8", teal: "#2fa8a0", aqua: "#5fe0e0", cyan: "#5fe0ff",
  magenta: "#ff3fa8", "hot-pink": "#ff3fa8", lavender: "#c49bff", lilac: "#c8a0e8", maroon: "#800020", navy: "#1a2a7a", beige: "#d8c8a0",
  tan: "#d8a86a", crimson: "#d0102a", scarlet: "#ff2414", ruby: "#c0103a", lime: "#9be35a", mint: "#8fe8c0", peach: "#ffb08a",
  coral: "#ff7f6f", neon: "#3fff5f", olive: "#7a8a2a", ivory: "#fff4d8", cream: "#fff0c8", emerald: "#1fae5f", sapphire: "#1f4fd0",
  amber: "#ffb020", copper: "#c07030", bronze: "#b0803a", plum: "#8a3f7a", rose: "#ff6f9f", "sky-blue": "#8fd0ff", lemon: "#fff04f",
};

const group = (words: string, e: ModEffect): [string[], ModEffect] => [words.trim().split(/\s+/), e];

const ADJ_GROUPS: [string[], ModEffect][] = [
  group("giant gigantic enormous huge humongous colossal jumbo mega massive mammoth gargantuan immense vast tremendous", { does: "made it GIANT", scale: 2 }),
  group("big large bigger great grand", { does: "made it big", scale: 1.5 }),
  group("tall towering long", { does: "stretched it TALL", sy: 1.6 }),
  group("tiny teeny teensy itty-bitty wee mini miniature petite microscopic", { does: "made it tiny", scale: 0.5 }),
  group("small little short", { does: "made it small", scale: 0.7 }),
  group("slender slim thin skinny lean svelte willowy scrawny bony narrow sleek", { does: "made it thin", sx: 0.6 }),
  group("fat chubby plump chunky wide round pudgy puffy", { does: "made it wide", sx: 1.4 }),
  group("flat squashed squished squishy", { does: "squished it flat", sy: 0.55, sx: 1.3 }),
  group("sparkly sparkling glittery glittering twinkly twinkling magical enchanted dazzling shimmering radiant glamorous", { does: "added sparkles", particle: "sparkle" }),
  group("shiny glossy gleaming polished metallic", { does: "made it shiny", shiny: true }),
  group("glowing bright brilliant electric luminous", { does: "made it glow", glow: "#fff27a" }),
  group("spooky creepy eerie scary mysterious", { does: "gave it a spooky (not scary!) glow", glow: "#b07aff" }),
  group("fuzzy furry fluffy hairy woolly shaggy scruffy feathery feathered cuddly soft velvety", { does: "made it fuzzy", fuzzy: true }),
  group("upside-down", { does: "turned it upside down", flipY: true }),
  group("backwards sideways inside-out", { does: "turned it around", flipX: true }),
  group("striped stripy zigzag plaid checkered", { does: "gave it stripes", striped: true }),
  group("spotted spotty polka-dot speckled freckled", { does: "gave it spots", spotted: true }),
  group("invisible ghostly see-through transparent faded sneaky secret", { does: "made it almost invisible", alpha: 0.3 }),
  group("hot spicy fiery flaming burning boiling toasty", { does: "set it on (pretend) fire", particle: "fire" }),
  group("cold icy frozen freezing frosty chilly snowy", { does: "froze it", particle: "snow", color: "#a8e0ff" }),
  group("stinky smelly rotten moldy gross icky disgusting filthy dirty muddy greasy grimy", { does: "made it stinky", particle: "stink" }),
  group("happy cheerful jolly merry glad joyful ecstatic overjoyed thrilled delighted elated jubilant giddy friendly kind lovely cute adorable sweet delicious tasty yummy exuberant", { does: "added hearts", particle: "hearts" }),
  group("sad gloomy miserable lonely upset troubled dreary rainy stormy blue-ish", { does: "gave it a rain cloud", particle: "rain" }),
  group("angry grumpy cranky crabby grouchy furious livid irate enraged seething fuming mad outraged", { does: "made it steam", particle: "steam" }),
  group("sleepy tired drowsy lazy exhausted weary drained worn-out fatigued sapped spent bored boring", { does: "made it sleepy", particle: "zzz" }),
  group("wet soggy damp moist sweaty slimy juicy gooey drippy", { does: "made it drip", particle: "drops" }),
  group("fast speedy quick swift rapid zippy hasty nimble", { does: "added speed lines", particle: "speed" }),
  group("cool awesome radical groovy funky stylish", { does: "gave it sunglasses", overlay: "shades" }),
  group("fancy elegant classy distinguished venerable posh dapper formal", { does: "gave it a top hat", overlay: "tophat" }),
  group("royal regal majestic magnificent noble smug haughty arrogant conceited snobbish boastful cocky bossy proud", { does: "gave it a crown", overlay: "crown" }),
  group("brave fearless courageous heroic mighty strong powerful tough", { does: "gave it a hero cape", overlay: "cape" }),
  group("smart clever brainy intelligent wise experienced seasoned", { does: "gave it glasses", overlay: "glasses" }),
  group("wobbly wiggly jiggly shaky jittery nervous bouncy jumpy jelly-like rubbery elastic", { does: "made it wobble", wobble: true }),
  group("loud noisy roaring thundering rowdy", { does: "made it LOUD", particle: "waves" }),
  group("musical melodic singing", { does: "added music notes", particle: "notes" }),
  group("bubbly fizzy foamy", { does: "added bubbles", particle: "bubbles" }),
  group("silly goofy wacky zany crazy funny hilarious ridiculous outrageous quirky whimsical bizarre weird strange odd unusual chaotic", { does: "threw confetti", particle: "confetti" }),
  group("old ancient vintage wrinkly dusty classic timeless", { does: "made it look old-timey", color: "#b8a888" }),
  group("rainbow colorful", { does: "made it RAINBOW", rainbow: true }),
];

const ADJ = new Map<string, ModEffect>();
for (const [words, e] of ADJ_GROUPS) for (const w of words) ADJ.set(w, e);
for (const [w, hex] of Object.entries(COLOR_HEX)) ADJ.set(w, { does: `turned it ${w}`, color: hex });
ADJ.set("grey", { does: "turned it gray", color: COLOR_HEX.grey });

/** Superlatives push size a bit further. */
const SUPER_SIZE: Record<string, number> = { biggest: 2.5, largest: 2.5, hugest: 2.5, tiniest: 0.4, smallest: 0.45, tallest: 1.9 };

export function adjectiveEffect(word: string): ModEffect | null {
  const w = word.trim().toLowerCase();
  if (SUPER_SIZE[w]) return { does: SUPER_SIZE[w] > 1 ? "made it the BIGGEST" : "made it the tiniest", ...(w === "tallest" ? { sy: SUPER_SIZE[w] } : { scale: SUPER_SIZE[w] }) };
  for (const cand of [w, ...w.split(/\s+/).reverse(), ...baseForms(w), ...w.replace(/^(more|most|super|very|really|extra)\s+/, "").split(" ")]) {
    const e = ADJ.get(cand);
    if (e) return e;
  }
  return null;
}

/* ---------------------------------------------------------------- verbs */

export type AnimId =
  | "dance" | "spin" | "jump" | "sleep" | "wobble" | "fly" | "run" | "slide" | "walk" | "swim" | "sing" | "eat" | "laugh" | "cry"
  | "sneeze" | "wave" | "shout" | "explode" | "juggle" | "glow" | "grow" | "think" | "hide" | "melt" | "drive" | "float" | "bob";

const VERB_GROUPS: [AnimId, string, string][] = [
  ["dance", "dance boogie disco groove shimmy tango waltz salsa prance conga jitterbug breakdance tap-dance hula limbo cha-cha moonwalk strut sway headbang twerk", "dancing"],
  ["spin", "spin twirl whirl rotate swirl pirouette cartwheel somersault flip tumble roll flip-flop", "spinning"],
  ["jump", "jump hop leap bounce skip pounce spring vault bound trampoline", "jumping"],
  ["sleep", "sleep nap snooze snore doze rest dream relax lounge yawn hibernate", "sleeping"],
  ["wobble", "wobble wiggle jiggle shake shiver quiver tremble twitch squirm wriggle fidget teeter totter stagger topple shimmy", "wobbling"],
  ["fly", "fly soar flutter hover flap levitate swoop parachute", "flying"],
  ["float", "float drift glide bob", "floating"],
  ["run", "run race dash sprint zoom rush scamper scurry hurry gallop jog chase flee bolt charge scoot whiz zigzag zip trot", "running"],
  ["slide", "slide skate ski sled surf skateboard snowboard slip slither zipline", "sliding"],
  ["walk", "walk stroll amble saunter mosey wander march plod trudge shuffle tiptoe creep sneak waddle stomp lumber meander dawdle toddle limp hike prowl stride step pace go come leave arrive", "walking"],
  ["swim", "swim paddle splash dive wade snorkel kayak", "swimming"],
  ["sing", "sing hum whistle yodel warble chant croon rap serenade strum drum play", "singing"],
  ["eat", "eat munch chomp nibble gobble devour chew gulp slurp bite lick taste scarf wolf inhale feast dine snack sip drink gnaw", "munching"],
  ["laugh", "laugh giggle chuckle snicker chortle titter cackle guffaw grin smile joke snort", "laughing"],
  ["cry", "cry sob weep whimper whine bawl sniffle pout mope sulk", "crying"],
  ["sneeze", "sneeze cough hiccup burp fart sniff wheeze gasp gargle", "sneezing"],
  ["wave", "wave salute point clap cheer applaud greet nod bow wink hug cuddle high-five", "waving"],
  ["shout", "shout yell roar scream shriek holler bellow boom howl bark growl squawk moo oink meow quack honk speak talk say chat whisper murmur mumble mutter argue exclaim neigh croak chirp", "shouting"],
  ["explode", "explode burst pop erupt blast crash smash splat kaboom", "exploding"],
  ["juggle", "juggle toss throw catch", "juggling"],
  ["glow", "glow shine sparkle twinkle flash gleam shimmer glitter", "glowing"],
  ["grow", "grow shrink stretch inflate puff swell balloon", "growing"],
  ["think", "think wonder ponder imagine remember read study learn write draw paint invent build cook bake fix", "thinking"],
  ["hide", "hide vanish disappear peek", "hiding"],
  ["melt", "melt drip ooze flop plop squish", "melting"],
  ["drive", "drive ride pedal steer vroom rumble", "driving"],
];

const VERB = new Map<string, { anim: AnimId; does: string }>();
for (const [anim, words, does] of VERB_GROUPS) for (const w of words.split(" ")) if (!VERB.has(w)) VERB.set(w, { anim, does });

export function verbAnim(word: string): { anim: AnimId; does: string } | null {
  const w = word.trim().toLowerCase();
  for (const cand of [w, ...baseForms(w), ...w.split(/\s+/).flatMap((p) => [p, ...baseForms(p)])]) {
    const v = VERB.get(cand);
    if (v) return v;
  }
  return null;
}

export const ANIM_IDS: AnimId[] = [...new Set(VERB_GROUPS.map((g) => g[0])), "bob"];

/* ---------------------------------------------------------------- adverbs */

export interface AdverbEffect {
  does: string;
  speed: number;
  particle?: Particle;
  alpha?: number;
  wobble?: boolean;
}

const ADV_GROUPS: [string, AdverbEffect][] = [
  ["quickly fast rapidly swiftly speedily hastily hurriedly briskly", { does: "sped it up", speed: 2.2, particle: "speed" }],
  ["wildly crazily madly frantically", { does: "made it go wild", speed: 2.6, particle: "confetti" }],
  ["slowly lazily sluggishly leisurely sleepily drowsily", { does: "slowed it down", speed: 0.4 }],
  ["loudly noisily", { does: "made it LOUD", speed: 1.2, particle: "waves" }],
  ["quietly softly silently gently calmly peacefully", { does: "made it calm", speed: 0.7 }],
  ["happily cheerfully joyfully gleefully merrily lovingly", { does: "added hearts", speed: 1.2, particle: "hearts" }],
  ["sadly gloomily miserably", { does: "brought a rain cloud", speed: 0.7, particle: "rain" }],
  ["angrily grumpily furiously", { does: "made it steam", speed: 1.4, particle: "steam" }],
  ["sneakily secretly mysteriously invisibly", { does: "made it sneaky", speed: 0.8, alpha: 0.45 }],
  ["gracefully elegantly beautifully magically", { does: "added sparkles", speed: 0.9, particle: "sparkle" }],
  ["clumsily awkwardly wobbily nervously", { does: "made it wobble", speed: 1.1, wobble: true }],
  ["proudly bravely boldly", { does: "made it proud", speed: 1 }],
  ["musically", { does: "added music", speed: 1, particle: "notes" }],
];
const ADV = new Map<string, AdverbEffect>();
for (const [words, e] of ADV_GROUPS) for (const w of words.split(" ")) ADV.set(w, e);

export function adverbEffect(word: string): AdverbEffect | null {
  const w = word.trim().toLowerCase();
  const last = w.split(/\s+/).pop() ?? w;
  if (ADV.has(last)) return ADV.get(last)!;
  // -ly adverb from a known adjective: borrow the adjective's effect.
  for (const b of baseForms(last)) {
    const a = ADJ.get(b);
    if (a && b !== last) return { does: a.does, speed: 1, particle: a.particle, alpha: a.alpha, wobble: a.wobble };
  }
  return null;
}

export function knownAdjective(w: string) {
  return ADJ.has(w);
}
export function knownVerb(w: string) {
  return VERB.has(w);
}
export function knownAdverb(w: string) {
  return ADV.has(w);
}
