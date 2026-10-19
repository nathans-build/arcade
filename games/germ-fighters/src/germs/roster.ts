import type { Subject } from "../kit/types";
import type { FocusTopicId } from "./focus";

/*
 * Germ Fighters's cast: the hero (a killer T cell), the eight body zones and their stage germs, the six
 * Major Viruses of the final boss rush, and the immune skills earned along the way. Every name, look and
 * line is original. Germs are cartoon characters: beaten germs poof into harmless sparkles, never anything
 * gross or scary. Every stage germ goes by its real organism name (short standard abbreviations such as
 * "S. AUREUS" where space on screen is tight), and its look matches the real germ (a Streptococcus really
 * grows in chains, Staphylococcus in grape-like clusters, and so on).
 */

export type ZoneId = "nose" | "throat" | "lungs" | "blood" | "stomach" | "gut" | "skin" | "mouth";
export type PowerId = "sneeze" | "cough" | "breath" | "plasma" | "acid" | "villi" | "platelet" | "saliva";
export type VirusId = "rhino" | "flu" | "noro" | "varicella" | "measles" | "corona";

export const HERO = {
  name: "CYTO",
  blurb: "a killer T cell who launches Granule Blasts: glowing little bubbles of perforin and granzymes that pop on germs and poof them into sparkles",
  /** Cyto's attack (Z / BLAST): round cytotoxic granules. */
  attack: {
    name: "Granule Blast",
    /** The touch button's label. */
    button: "BLAST",
    science: "Real killer T cells release tiny granules filled with perforin and granzymes to take down infected cells.",
  },
  /** The helper T cell who gives tips and opens Antigen Clues. */
  helper: "HANA",
  helperBlurb: "a helper T cell who calls in help and shares tips",
};

export interface Power {
  id: PowerId;
  name: string;
  /** Short line for the HUD and stage select. */
  short: string;
  /** What it does, for How to play. */
  desc: string;
  /** Power-meter cost per use (the meter holds POWER_MAX). */
  cost: number;
  color: string;
  color2: string;
}

/** Immune skills: one is earned from every stage germ, and they work in every other stage. */
export const POWERS: Record<PowerId, Power> = {
  sneeze: { id: "sneeze", name: "Sneeze Blast", short: "screen blast", desc: "a big ACHOO that poofs every germ on screen and clears their shots", cost: 6, color: "#e8f4ff", color2: "#4a7ad1" },
  cough: { id: "cough", name: "Cough Dash", short: "dash", desc: "a fast dash straight ahead (nothing can bump you while dashing)", cost: 3, color: "#ffe066", color2: "#b8862b" },
  breath: { id: "breath", name: "Breath Bounce", short: "air jump", desc: "one extra jump in mid-air on a puff of air", cost: 2, color: "#bdf4ff", color2: "#2a9ab8" },
  plasma: { id: "plasma", name: "Plasma Float", short: "float", desc: "float down slowly like a cell drifting in plasma (press in the air)", cost: 2, color: "#ffe9a8", color2: "#c08a1a" },
  acid: { id: "acid", name: "Acid Spray", short: "3-way granules", desc: "three acid-green granules that fly out three ways, like a splash of stomach acid", cost: 2, color: "#c8ff5a", color2: "#4a8a1a" },
  villi: { id: "villi", name: "Villi Vault", short: "super jump", desc: "a super-high jump from the ground, springy like the gut's villi", cost: 3, color: "#ff9ac8", color2: "#a01a5a" },
  platelet: { id: "platelet", name: "Platelet Patch", short: "shield", desc: "platelet friends patch a shield around you that blocks bumps and shots for a few seconds", cost: 4, color: "#ffb0b0", color2: "#c0392b" },
  saliva: { id: "saliva", name: "Saliva Slow-Mo", short: "slow germs", desc: "slows germs, their shots, hazards and moving platforms for a few seconds", cost: 5, color: "#9ad1ff", color2: "#2456e8" },
};

export const POWER_IDS = Object.keys(POWERS) as PowerId[];

export interface GermLook {
  body: string;
  trim: string;
  accent: string;
  eye: string;
}

export type Deco = "nose" | "throat" | "lungs" | "blood" | "stomach" | "gut" | "skin" | "mouth" | "lymph";

export interface StageTheme {
  name: string;
  /** Sky gradient top/bottom, far scenery, ground fill, ground top edge, hazard colour. */
  skyTop: string;
  skyBottom: string;
  far: string;
  ground: string;
  edge: string;
  hazard: string;
  /** The stage's timed hazard and spike strip, shown on the stage card. */
  hazardName: string;
  spikeName: string;
  deco: Deco;
}

export type Pattern = "hop" | "hover" | "dash" | "arc" | "bounce" | "zigzag" | "sprout" | "pendulum" | "teleport";

/** Germ type, for the fact checks: bacteria are living cells, viruses are not cells at all. */
export type GermKind = "bacterium" | "virus";

export interface Zone {
  id: ZoneId;
  /** The body place, e.g. "Nose & Airways". */
  place: string;
  /** One kid-friendly line about how this part of the body fights germs. */
  defense: string;
  /** The stage germ (boss): its real name in caps, abbreviated the standard way when long ("S. AUREUS"). */
  boss: string;
  /** The full real name in normal case, e.g. "Staphylococcus aureus". */
  bossFull: string;
  /** e.g. "a cartoon Staphylococcus aureus (round bacteria that grow in grape-like bunches)" */
  bossType: string;
  germ: GermKind;
  /** MIXED: every other question is this subject (the rest are life science & health). */
  partner: Subject;
  partnerTopics: FocusTopicId[];
  /** One whole subject picked: the topic this zone asks, best first (else ALL of it). */
  retune: Record<Subject, FocusTopicId[]>;
  /** Keywords that make a kit science item fit this zone's health theme. */
  flavor: RegExp;
  power: PowerId;
  /** The immune skill this germ is weak to (double hit) and that heals this stage's infected cell. */
  weakness: PowerId;
  pattern: Exclude<Pattern, "teleport">;
  look: GermLook;
  stage: StageTheme;
  lines: { intro: string; block: string[]; hit: string[]; defeat: string };
}

export const ZONES: Zone[] = [
  {
    id: "nose",
    place: "Nose & Airways",
    defense: "Sticky mucus and tiny hairs catch germs before they get deep inside, and a sneeze blows them out.",
    boss: "ADENOVIRUS",
    bossFull: "Adenovirus",
    bossType: "a cartoon adenovirus (a virus shaped like a 20-sided ball with long fibers)",
    germ: "virus",
    partner: "ela",
    partnerTopics: ["grammar", "phonics", "reading"],
    retune: { math: ["numbers", "algebra"], science: ["life"], ela: ["grammar", "phonics", "reading"], social: ["civics"] },
    flavor: /nose|mucus|sneez|breath|air|respirat|cold|germ|spread/i,
    power: "sneeze",
    weakness: "cough",
    pattern: "bounce",
    look: { body: "#7ad1ff", trim: "#2a5a9a", accent: "#ffe066", eye: "#1a1a2a" },
    stage: {
      name: "Nose & Airways", skyTop: "#3a0f2a", skyBottom: "#a85a7a", far: "#6a2a4a", ground: "#c87a8a", edge: "#9aff9a", hazard: "#d8f4ff",
      hazardName: "sneeze gusts", spikeName: "sticky mucus", deco: "nose",
    },
    lines: {
      intro: "Boing! I'm ADENOVIRUS, a 20-sided virus with long fibers! I bounce in on sneezes and can give you a cold or pink eye!",
      block: ["Boing! That answer bounced right off!", "Nope! Try a different antigen!"],
      hit: ["Ah... ah... that one got me!", "Whoa, you're quick on the sniff!"],
      defeat: "Poof! You spotted my antigens. Okay, okay, I'll bounce out of here! Take my Sneeze Blast!",
    },
  },
  {
    id: "throat",
    place: "Throat & Tonsils",
    defense: "Your tonsils are full of immune cells that check the germs you breathe and swallow.",
    boss: "STREPTOCOCCUS",
    bossFull: "Streptococcus pyogenes (Strep A)",
    bossType: "a cartoon Streptococcus, Strep A for short (round bacteria that grow in a chain, like beads, and can cause strep throat)",
    germ: "bacterium",
    partner: "social",
    partnerTopics: ["civics", "history"],
    retune: { math: ["fractions", "ratios", "numbers", "algebra"], science: ["life"], ela: ["phonics", "grammar"], social: ["civics", "economics"] },
    flavor: /throat|tonsil|swallow|bacteri|antibiot|cough|sore|strep/i,
    power: "cough",
    weakness: "saliva",
    pattern: "pendulum",
    look: { body: "#ff8a5e", trim: "#a83a1a", accent: "#fff3c4", eye: "#1a1a2a" },
    stage: {
      name: "Throat & Tonsils", skyTop: "#3a0a1a", skyBottom: "#c84a5a", far: "#7a1a3a", ground: "#a83a4a", edge: "#ffb0b4", hazard: "#fff3c4",
      hazardName: "cough blasts", spikeName: "scratchy spots", deco: "throat",
    },
    lines: {
      intro: "I'm STREPTOCOCCUS, Strep A for short! My round cells link up in a chain, and I'm the germ behind strep throat!",
      block: ["Ha! My chain is still strong!", "Wrong link! Try again!"],
      hit: ["Hey! You broke a link!", "Ouch, that answer was right on the chain!"],
      defeat: "My chain's all unlinked! You spotted me, just like a doctor's strep test. Take my Cough Dash!",
    },
  },
  {
    id: "lungs",
    place: "Lung Bubbles",
    defense: "Millions of tiny air sacs called alveoli swap oxygen in, and immune cells patrol every one.",
    boss: "S. PNEUMONIAE",
    bossFull: "Streptococcus pneumoniae (pneumococcus)",
    bossType: "a cartoon Streptococcus pneumoniae, also called pneumococcus (round bacteria that often come in pairs and can cause ear infections and pneumonia)",
    germ: "bacterium",
    partner: "math",
    partnerTopics: ["numbers", "ratios", "algebra"],
    retune: { math: ["ratios", "numbers", "algebra"], science: ["life"], ela: ["reading"], social: ["geography"] },
    flavor: /lung|breath|oxygen|alveol|respirat|air|carbon dioxide|cough/i,
    power: "breath",
    weakness: "sneeze",
    pattern: "zigzag",
    look: { body: "#b8f0c8", trim: "#2a8a5a", accent: "#ffd23f", eye: "#1a1a2a" },
    stage: {
      name: "Lung Bubbles", skyTop: "#1a1030", skyBottom: "#e89aaa", far: "#8a4a6a", ground: "#d88a9a", edge: "#ffe0e8", hazard: "#bdf4ff",
      hazardName: "breathing puffs", spikeName: "itchy patches", deco: "lungs",
    },
    lines: {
      intro: "We're S. PNEUMONIAE, round bacteria that travel in pairs! We can cause ear infections and a lung infection called pneumonia!",
      block: ["Ha-ha! We both said nope!", "Wrong! That answer ran out of breath!"],
      hit: ["Gasp! You split us up!", "That one took our breath away!"],
      defeat: "Phew... we're spotted! A pneumococcal vaccine helps keep kids safe from us too. Take our Breath Bounce!",
    },
  },
  {
    id: "blood",
    place: "Bloodstream",
    defense: "White blood cells ride the blood to wherever germs show up, and red blood cells carry oxygen.",
    boss: "BORRELIA",
    bossFull: "Borrelia burgdorferi",
    bossType: "a cartoon Borrelia, a spirochete (a spiral-shaped bacterium that corkscrews through blood and body fluids; a tick bite can carry it in and cause Lyme disease)",
    germ: "bacterium",
    partner: "math",
    partnerTopics: ["numbers", "algebra", "fractions"],
    retune: { math: ["numbers", "algebra"], science: ["life"], ela: ["grammar"], social: ["economics"] },
    flavor: /blood|heart|circulat|white blood|red blood|platelet|vessel|pump|plasma/i,
    power: "plasma",
    weakness: "platelet",
    pattern: "dash",
    look: { body: "#c9b8ff", trim: "#6a4ad1", accent: "#ff7ad1", eye: "#1a1a2a" },
    stage: {
      name: "Bloodstream", skyTop: "#2a0010", skyBottom: "#8a1a2a", far: "#5a0a1a", ground: "#7a2a3a", edge: "#ff8a8a", hazard: "#ffd23f",
      hazardName: "heartbeat waves", spikeName: "sticky clots", deco: "blood",
    },
    lines: {
      intro: "Wheee! I'm BORRELIA, a spiral spirochete! I hitched a ride on a tick bite, and now I corkscrew through the bloodstream!",
      block: ["Swirly-whirly, that's not it!", "Missed me! Spin again!"],
      hit: ["Whoa, you untwisted me!", "Dizzy... that answer was spot on!"],
      defeat: "I'm all unwound! You spotted me. Check for ticks after playing outside, and doctors can treat me. Take my Plasma Float!",
    },
  },
  {
    id: "stomach",
    place: "Stomach",
    defense: "Strong stomach acid breaks down food and stops most swallowed germs.",
    boss: "H. PYLORI",
    bossFull: "Helicobacter pylori",
    bossType: "a cartoon Helicobacter pylori (a curvy bacterium with whip-like tails that can live in the stomach's lining and cause sore spots called ulcers)",
    germ: "bacterium",
    partner: "social",
    partnerTopics: ["economics", "geography"],
    retune: { math: ["fractions", "numbers", "geometry", "algebra"], science: ["life"], ela: ["reading"], social: ["economics", "geography"] },
    flavor: /stomach|acid|digest|food|enzyme|swallow|nutrient/i,
    power: "acid",
    weakness: "villi",
    pattern: "hover",
    look: { body: "#ffd27a", trim: "#b8862b", accent: "#7ad1ff", eye: "#1a1a2a" },
    stage: {
      name: "Stomach", skyTop: "#1a1a08", skyBottom: "#6a6a1a", far: "#3a3a12", ground: "#8a5a3a", edge: "#c8ff5a", hazard: "#c8ff5a",
      hazardName: "acid splashes", spikeName: "acid puddles", deco: "stomach",
    },
    lines: {
      intro: "Whirr! I'm H. PYLORI! I twirl my whip-like tails, dig into the stomach's slimy lining and cancel out the acid around me!",
      block: ["Whirr! Wrong answer!", "Ha! I wiggled right past that one!"],
      hit: ["Whoa! That answer tangled my tails!", "Hey, my spin is all wobbly!"],
      defeat: "You got me identified! Doctors can find me with a simple breath test. Take my Acid Spray!",
    },
  },
  {
    id: "gut",
    place: "Gut Garden",
    defense: "Trillions of helpful bacteria live in your gut. They help digest food and crowd out harmful germs.",
    boss: "SALMONELLA",
    bossFull: "Salmonella",
    bossType: "a cartoon Salmonella (a rod-shaped bacterium that can come from undercooked chicken or eggs and cause a tummy ache)",
    germ: "bacterium",
    partner: "ela",
    partnerTopics: ["reading", "grammar"],
    retune: { math: ["geometry", "numbers", "algebra"], science: ["life"], ela: ["reading"], social: ["geography"] },
    flavor: /gut|intestin|digest|food|bacteri|microb|helpful|nutrient|absorb/i,
    power: "villi",
    weakness: "acid",
    pattern: "hop",
    look: { body: "#ff9a6a", trim: "#c0561a", accent: "#fff3c4", eye: "#1a1a2a" },
    stage: {
      name: "Gut Garden", skyTop: "#1a0a20", skyBottom: "#7a3a5a", far: "#4a1a3a", ground: "#b85a6a", edge: "#ffb0c8", hazard: "#ff9ac8",
      hazardName: "squeeze waves", spikeName: "grumbly spots", deco: "gut",
    },
    lines: {
      intro: "Hiya! I'm SALMONELLA, a rod-shaped bacterium! I snuck in on an undercooked snack. Time for a tummy rumble!",
      block: ["Nope! That answer's half-baked!", "Ha! Undercooked answer!"],
      hit: ["Ooh, well done! That was cooked all the way!", "Yikes, you're too smart for me!"],
      defeat: "Okay, I'm spotted! Cook food all the way and wash your hands after touching raw chicken or eggs. Take my Villi Vault!",
    },
  },
  {
    id: "skin",
    place: "Skin & Cut",
    defense: "Skin is a wall against germs. When it gets cut, platelets patch the gap and white blood cells rush in.",
    boss: "S. AUREUS",
    bossFull: "Staphylococcus aureus",
    bossType: "a cartoon Staphylococcus aureus, Staph for short (round bacteria that grow in grape-like bunches; \"aureus\" means golden)",
    germ: "bacterium",
    partner: "social",
    partnerTopics: ["geography", "history"],
    retune: { math: ["geometry", "numbers", "algebra"], science: ["life"], ela: ["reading"], social: ["geography"] },
    flavor: /skin|cut|scrape|platelet|clot|scab|wound|barrier|touch|sweat/i,
    power: "platelet",
    weakness: "plasma",
    pattern: "sprout",
    look: { body: "#ffd23f", trim: "#c08a1a", accent: "#ffffff", eye: "#1a1a2a" },
    stage: {
      name: "Skin & Cut", skyTop: "#2a1a0a", skyBottom: "#e0a07a", far: "#a8704a", ground: "#c8906a", edge: "#ffe0c0", hazard: "#ff7a7a",
      hazardName: "itchy scratches", spikeName: "splinters", deco: "skin",
    },
    lines: {
      intro: "We're S. AUREUS, Staph for short! \"Aureus\" means golden. We grow in grape-like bunches, and we found a cut!",
      block: ["Ha! Our bunch is still together!", "Wrong! Grab another grape of knowledge!"],
      hit: ["Hey! You plucked one of us!", "Ooh, that answer was sharp!"],
      defeat: "The whole bunch is spotted! Wash the cut, cover it with a bandage and let it heal. Take our Platelet Patch!",
    },
  },
  {
    id: "mouth",
    place: "Mouth & Teeth",
    defense: "Saliva washes your teeth and has germ-fighting helpers. Brushing sweeps away the sticky plaque.",
    boss: "S. MUTANS",
    bossFull: "Streptococcus mutans",
    bossType: "a cartoon Streptococcus mutans (a round bacterium in the mouth that turns sugar into tooth-harming acid and causes cavities)",
    germ: "bacterium",
    partner: "math",
    partnerTopics: ["geometry", "numbers", "fractions"],
    retune: { math: ["factors", "numbers", "geometry", "algebra"], science: ["life"], ela: ["phonics", "reading"], social: ["history"] },
    flavor: /mouth|teeth|tooth|saliva|sugar|brush|plaque|chew/i,
    power: "saliva",
    weakness: "breath",
    pattern: "arc",
    look: { body: "#ff7ab8", trim: "#a01a5a", accent: "#ffffff", eye: "#1a1a2a" },
    stage: {
      name: "Mouth & Teeth", skyTop: "#2a0a1a", skyBottom: "#c8506a", far: "#7a2040", ground: "#e86a8a", edge: "#ffffff", hazard: "#f2f4ff",
      hazardName: "chomping teeth", spikeName: "sugar crumbs", deco: "mouth",
    },
    lines: {
      intro: "Nom nom! I'm S. MUTANS! Give me sugar and I'll turn it into acid that makes cavities in your teeth!",
      block: ["Sweet! That answer was wrong!", "Ha! No cavity in MY defense!"],
      hit: ["Ack! That answer brushed me away!", "Minty fresh! That one stung!"],
      defeat: "You spotted me! Brush twice a day with fluoride toothpaste and I don't stand a chance. Take my Saliva Slow-Mo!",
    },
  },
];

export const ZONE_IDS = ZONES.map((z) => z.id);

export function zoneById(id: ZoneId): Zone {
  return ZONES.find((z) => z.id === id)!;
}

export function zoneWithPower(p: PowerId): Zone {
  return ZONES.find((z) => z.power === p)!;
}

// ------------------------------------------------------------------ the Major Viruses (final boss rush)

export interface VirusFacts {
  /** The illness it causes. */
  disease: string;
  /** How it spreads. */
  spreads: string;
  /** How the body fights it back. */
  bodyFights: string;
  /** How people protect themselves (vaccine, handwashing...). */
  protect: string;
  /** Vaccine name, or null when there is no vaccine in routine use for it. */
  vaccine: string | null;
  /** Whether hand sanitizer works well on it (norovirus: no, wash with soap and water). */
  sanitizerWorksWell: boolean;
  /** Do antibiotics work on it? Never for a virus: they only work on bacteria. */
  antibioticsWork: false;
}

export interface Virus {
  id: VirusId;
  /** The real virus's name, shown as the boss name. */
  name: string;
  /** Short title, e.g. "The Common Cold Virus". */
  title: string;
  pattern: Pattern;
  look: GermLook;
  /** Three short fact lines shown on the boss's card (kid-friendly, checked). */
  card: string[];
  facts: VirusFacts;
  lines: { intro: string; block: string[]; hit: string[]; defeat: string };
}

export const VIRUSES: Virus[] = [
  {
    id: "rhino",
    name: "RHINOVIRUS",
    title: "The Common Cold Virus",
    pattern: "hop",
    look: { body: "#7ae08a", trim: "#2a7a3a", accent: "#ffe066", eye: "#1a1a2a" },
    card: [
      "Rhinoviruses cause most common colds. \"Rhino\" means nose!",
      "They spread from hands and sneeze droplets. Washing hands helps a lot.",
      "There are more than 100 kinds, so you can catch a cold again and again.",
    ],
    facts: {
      disease: "the common cold",
      spreads: "touching germy hands and surfaces, then your nose or eyes; sneeze and cough droplets",
      bodyFights: "mucus, a runny nose and white blood cells; most colds get better in about a week to ten days",
      protect: "wash hands, cover coughs and sneezes, keep fingers away from your nose and eyes",
      vaccine: null,
      sanitizerWorksWell: true,
      antibioticsWork: false,
    },
    lines: {
      intro: "Ah-CHOO! I'm RHINOVIRUS, champion of the common cold! I'll give EVERYONE the sniffles!",
      block: ["Sniff! Wrong answer!", "Ha! Achoo-se again!"],
      hit: ["My nose is running away!", "Ugh, you're really nosy!"],
      defeat: "Spotted... Okay, I'm out. Wash your hands and I'll have a hard time getting back in!",
    },
  },
  {
    id: "flu",
    name: "INFLUENZA",
    title: "The Flu Virus",
    pattern: "zigzag",
    look: { body: "#ffb35e", trim: "#c0561a", accent: "#ff5e7a", eye: "#1a1a2a" },
    card: [
      "Influenza causes the flu: fever, aches, cough and feeling very tired.",
      "It spreads in droplets when people cough, sneeze or talk.",
      "Flu viruses keep changing, so there is a new flu vaccine every year.",
    ],
    facts: {
      disease: "the flu",
      spreads: "droplets from coughs, sneezes and talking; sometimes touching surfaces",
      bodyFights: "fever, antibodies and killer T cells; rest and fluids help",
      protect: "a flu vaccine every year, handwashing, covering coughs, staying home when sick",
      vaccine: "the yearly flu vaccine",
      sanitizerWorksWell: true,
      antibioticsWork: false,
    },
    lines: {
      intro: "I'm INFLUENZA! I change my coat every year so nobody recognizes me! Ha-ha!",
      block: ["Can't spot me! New disguise!", "Wrong! I've already changed!"],
      hit: ["Hey! You saw through my disguise!", "Achy breaky! That one stung!"],
      defeat: "You spotted my spikes! Next year I'll change again... but the new vaccine will be ready!",
    },
  },
  {
    id: "noro",
    name: "NOROVIRUS",
    title: "The Stomach Bug Virus",
    pattern: "dash",
    look: { body: "#9ad1ff", trim: "#2456e8", accent: "#c8ff5a", eye: "#1a1a2a" },
    card: [
      "Norovirus is the most common cause of a stomach bug.",
      "It is super catching: just a tiny amount can make someone sick.",
      "Hand sanitizer doesn't work well on it. Wash with soap and water!",
    ],
    facts: {
      disease: "a stomach bug (an upset stomach and throwing up)",
      spreads: "germy hands, food, water and surfaces",
      bodyFights: "the immune system clears it in a few days; drinking water replaces lost fluids",
      protect: "wash hands with soap and water, clean surfaces with bleach cleaners, keep sick people from making food",
      vaccine: null,
      sanitizerWorksWell: false,
      antibioticsWork: false,
    },
    lines: {
      intro: "Zoom! I'm NOROVIRUS, the speediest stomach bug around! Sanitizer can't stop me!",
      block: ["Zoom! Missed!", "Ha! That answer slid right off!"],
      hit: ["Ack! Soap and water? No fair!", "Whoa, you're quick!"],
      defeat: "Scrubbed out! You spotted me. Soap and water beats me every time!",
    },
  },
  {
    id: "varicella",
    name: "VARICELLA",
    title: "The Chickenpox Virus",
    pattern: "sprout",
    look: { body: "#ffb0c8", trim: "#c0396a", accent: "#ff5e7a", eye: "#1a1a2a" },
    card: [
      "Varicella-zoster virus causes chickenpox: itchy, blister-like spots.",
      "It spreads through the air and by touching the blisters.",
      "A chickenpox vaccine protects you. Try not to scratch the spots!",
    ],
    facts: {
      disease: "chickenpox",
      spreads: "the air (coughs, sneezes, breathing) and touching the blisters",
      bodyFights: "the immune system makes antibodies and memory cells, so most people get it only once",
      protect: "the chickenpox (varicella) vaccine",
      vaccine: "the chickenpox (varicella) vaccine",
      sanitizerWorksWell: true,
      antibioticsWork: false,
    },
    lines: {
      intro: "I'm VARICELLA! Watch out for my itchy spots! Pop, pop, pop!",
      block: ["Itchy-scritchy, wrong answer!", "Ha! Spot the mistake?"],
      hit: ["Ow! You spotted me!", "No more spots for you!"],
      defeat: "All my spots are popped! Your memory cells will remember me now!",
    },
  },
  {
    id: "measles",
    name: "MEASLES",
    title: "The Measles Virus",
    pattern: "arc",
    look: { body: "#ff8a8a", trim: "#a01a2a", accent: "#ffe066", eye: "#1a1a2a" },
    card: [
      "Measles is one of the most catching diseases there is.",
      "Its germs can float in a room's air for up to 2 hours.",
      "Two doses of the MMR vaccine protect about 97 out of 100 people.",
    ],
    facts: {
      disease: "measles (high fever, cough, red eyes and a rash)",
      spreads: "the air: coughs and sneezes, and it can linger in a room for up to 2 hours",
      bodyFights: "antibodies and T cells; the vaccine trains them ahead of time",
      protect: "two doses of the MMR (measles, mumps, rubella) vaccine",
      vaccine: "the MMR vaccine",
      sanitizerWorksWell: true,
      antibioticsWork: false,
    },
    lines: {
      intro: "I'm MEASLES! I float through the air and I can hang around a room for hours!",
      block: ["Floaty-floaty, wrong answer!", "Ha! Still in the air!"],
      hit: ["Whoa! You cleared the air!", "Hey! That answer was vaccinated!"],
      defeat: "Spotted! When almost everyone is vaccinated, I have nowhere to go!",
    },
  },
  {
    id: "corona",
    name: "CORONAVIRUS",
    title: "SARS-CoV-2, the COVID-19 Virus",
    pattern: "teleport",
    look: { body: "#d8a8ff", trim: "#6a2ad1", accent: "#ff5e5e", eye: "#1a1a2a" },
    card: [
      "SARS-CoV-2 is the coronavirus that causes COVID-19.",
      "\"Corona\" means crown: its spike proteins stick out like a crown.",
      "Vaccines teach the body to spot the spike. Washing hands helps too.",
    ],
    facts: {
      disease: "COVID-19",
      spreads: "droplets and tiny particles in the air when people breathe, talk, cough or sneeze",
      bodyFights: "antibodies that block the spike protein, and killer T cells",
      protect: "COVID-19 vaccines, handwashing, covering coughs, fresh air, staying home when sick",
      vaccine: "COVID-19 vaccines",
      sanitizerWorksWell: true,
      antibioticsWork: false,
    },
    lines: {
      intro: "I'm CORONAVIRUS, the virus with the crown of spikes! Let's see if you can spot me!",
      block: ["Spike shield! Wrong answer!", "Ha! Crowned again!"],
      hit: ["Hey! Those antibodies grabbed my spikes!", "My crown is slipping!"],
      defeat: "You spotted my spike proteins! The whole Major Virus crew is identified!",
    },
  },
];

export const VIRUS_IDS = VIRUSES.map((v) => v.id);

export function virusById(id: VirusId): Virus {
  return VIRUSES.find((v) => v.id === id)!;
}

/** The final stage: the Lymph Node, where the Major Virus boss rush happens. */
export const RUSH = {
  id: "rush" as const,
  name: "MAJOR VIRUS RUSH",
  stage: {
    name: "Lymph Node", skyTop: "#0a0a2a", skyBottom: "#3a2a6a", far: "#2a1a4a", ground: "#5a4a8a", edge: "#9affd8", hazard: "#ff7ad1",
    hazardName: "lymph currents", spikeName: "sticky patches", deco: "lymph",
  } as StageTheme,
  lines: {
    intro: "HANA: The Major Viruses are lining up! Spot each one with right answers, Cyto!",
    defeat: "HANA: Every Major Virus is identified! Your memory cells will remember them all. Great teamwork, Squad!",
  },
};

/** A stage is one of the eight body zones or the Lymph Node rush. */
export type StageId = ZoneId | "rush";
