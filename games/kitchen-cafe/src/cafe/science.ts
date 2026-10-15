import type { Grade } from "../kit/types";
import { bandOf, build, gradeN, type Band, type CafeQ, type Draft, type Moment } from "./common";
import { pick, shuffle, int, type Rng } from "./rng";

/*
 * The Science Check: every kitchen change the café uses, with its physical/chemical
 * classification and the evidence that proves it. scripts/check-rules.ts holds an independent
 * truth table and fails if any item, clue or generated answer disagrees with it.
 *
 * Facts kept to (kid level, accurate):
 *  - Physical: melting, freezing, boiling, condensing, dissolving, mixing, cutting, grating,
 *    crushing, blending, whipping. Same substance; new shape, size or state; often undoable.
 *  - Chemical: toasting, baking, frying an egg, browning (caramel, cut apples), burning, rusting,
 *    souring/curdling milk, yeast fermentation, baking soda + acid. A new substance: gas bubbles
 *    made by a reaction, new color, new smell, heat/light given off, a new solid, can't undo.
 *  - Bubbles alone are not proof: boiling water bubbles are water vapor, and soda fizz is CO2
 *    that was already dissolved in the drink (both physical).
 *  - "It was heated" is not evidence of a chemical change (heat was added, not given off).
 */

export type Kind = "physical" | "chemical";

export type Clue =
  // evidence of a chemical change
  | "gas" | "color" | "smell" | "heatlight" | "solid" | "cold" | "irreversible"
  // evidence of a physical change
  | "same" | "shape" | "state" | "reversible" | "mixed" | "already";

export const CLUE_KIND: Record<Clue, Kind> = {
  gas: "chemical", color: "chemical", smell: "chemical", heatlight: "chemical", solid: "chemical", cold: "chemical", irreversible: "chemical",
  same: "physical", shape: "physical", state: "physical", reversible: "physical", mixed: "physical", already: "physical",
};

/** Clue wording (lower case; the evidence question capitalizes it). */
export const CLUE_TEXT: Record<Clue, string> = {
  gas: "new gas bubbles form",
  color: "a new color appears",
  smell: "a new smell is made",
  heatlight: "it gives off heat and light",
  solid: "new solid clumps form",
  cold: "it gets colder by itself",
  irreversible: "it can't be changed back",
  same: "it is still the same stuff",
  shape: "only its shape or size changed",
  state: "it only changed state",
  reversible: "it can be changed back",
  mixed: "it mixes in but is still there",
  already: "the gas was already in it",
};

export interface K2Check {
  prompt: string;
  answer: string;
  wrong: [string, string, string];
  explanation: string;
  standard: string;
  skill: string;
}

export interface ChangeItem {
  id: string;
  /** "Toasting bread": what Chef Bix just did. */
  action: string;
  kind: Kind;
  /** True evidence for this change (all of CLUE_KIND = kind). */
  clues: Clue[];
  /** Observations of the other kind that really happen here, so they are never used as wrong answers. */
  avoid: Clue[];
  /** Lowest band that sees this item in the combined / evidence checks. */
  minBand: Band;
  /** True when heat is added by the cook (the "it was heated" misconception distractor fits). */
  heated: boolean;
  explain: string;
  k2?: K2Check;
}

const K_HEAT = { standard: "PS.2.1.1", skill: "Heating and cooling" };
const K_PROPS = { standard: "PS.K.1.1", skill: "Properties of materials" };

export const CHANGES: ChangeItem[] = [
  // ---------------------------------------------------------------- Breakfast Diner
  {
    id: "fry-egg", action: "Frying an egg", kind: "chemical", clues: ["color", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Frying makes new substances: the clear egg white turns white and firm, and you can never un-fry it. That's a chemical change.",
    k2: { prompt: "The egg cooks in the hot pan. What happens to the clear part?", answer: "It turns white", wrong: ["It turns blue", "It freezes", "It melts away"], explanation: "Heat cooks the egg. The clear part turns white and firm, and it can't turn back.", ...K_HEAT },
  },
  {
    id: "toast", action: "Toasting bread", kind: "chemical", clues: ["color", "smell", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Toasting makes new substances on the bread: a brown color and a toasty smell. You can't un-toast toast, so it's a chemical change.",
    k2: { prompt: "Bread goes in the hot toaster. How does it come out?", answer: "Brown and crunchy", wrong: ["Frozen and icy", "Green and soft", "Melted like juice"], explanation: "Heat turns bread brown and crunchy. Toast can't turn back into soft bread.", ...K_HEAT },
  },
  {
    id: "melt-butter", action: "Melting butter", kind: "physical", clues: ["state", "reversible", "same"], avoid: ["gas"], minBand: "g35", heated: true,
    explain: "Melting only changes butter from a solid to a liquid. It is still butter, and it gets hard again in the fridge. That's a physical change.",
    k2: { prompt: "Butter sits in the warm pan. What happens to it?", answer: "It melts", wrong: ["It freezes", "It gets harder", "It turns to ice"], explanation: "Heat melts solid butter into a liquid. Put it in the fridge and it gets hard again.", ...K_HEAT },
  },
  {
    id: "dissolve-sugar", action: "Stirring sugar into tea", kind: "physical", clues: ["mixed", "reversible", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Dissolving is a physical change. The sugar spreads out in the tea but is still sugar (the tea tastes sweet). Boil the water away and the sugar is left behind.",
    k2: { prompt: "Chef Bix stirs sugar into the tea. Where did the sugar go?", answer: "It's in the tea", wrong: ["It flew away", "It turned to ice", "It became a rock"], explanation: "The sugar dissolves: it spreads out in tiny bits you can't see. Taste the tea: it's sweet, so the sugar is still there!", standard: "PS.K.1.1", skill: "Properties of materials" },
  },
  {
    id: "slice-bread", action: "Slicing bread", kind: "physical", clues: ["shape", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Cutting only changes the bread's shape and size. Every slice is still bread, so it's a physical change.",
  },
  {
    id: "pancakes", action: "Cooking pancake batter", kind: "chemical", clues: ["gas", "color", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Baking powder in the batter reacts and makes new gas bubbles, and the pancake turns golden brown. It can't turn back into batter: a chemical change.",
    k2: { prompt: "Pancake batter cooks on the hot griddle. What do you see?", answer: "Bubbles and brown", wrong: ["Ice cubes", "It turns to juice", "Nothing changes"], explanation: "Bubbles pop up and the pancake turns golden brown. A cooked pancake can't turn back into batter.", ...K_HEAT },
  },
  {
    id: "whisk-eggs", action: "Whisking eggs", kind: "physical", clues: ["mixed", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Whisking just mixes the yolk and the white together. It's still raw egg, so it's a physical change (cooking it later is the chemical part).",
  },
  {
    id: "chill-juice", action: "Chilling lemonade in the fridge", kind: "physical", clues: ["same", "reversible"], avoid: ["cold"], minBand: "g35", heated: false,
    explain: "Cooling only changes how cold the lemonade is. It's still lemonade and can warm back up: a physical change.",
    k2: { prompt: "Warm lemonade goes in the fridge for an hour. How is it now?", answer: "Colder", wrong: ["Hotter", "Bubbling", "Brown and crunchy"], explanation: "The fridge takes heat away, so the lemonade gets colder. It's still lemonade!", ...K_HEAT },
  },
  // ---------------------------------------------------------------- Pizza Parlor
  {
    id: "yeast-rise", action: "Yeast making pizza dough rise", kind: "chemical", clues: ["gas", "smell", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "Yeast are tiny living things that eat sugar and make new substances: carbon dioxide gas (the bubbles that puff up the dough) and a yeasty smell. That's a chemical change.",
    k2: { prompt: "The pizza dough sits in a warm spot. What happens?", answer: "It puffs up bigger", wrong: ["It shrinks away", "It freezes", "It turns to water"], explanation: "Tiny yeast in the dough make gas bubbles, so the dough puffs up. Warm spots help yeast work.", ...K_HEAT },
  },
  {
    id: "grate-cheese", action: "Grating cheese", kind: "physical", clues: ["shape", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Grating cuts the cheese into tiny shreds. It's still cheese, just smaller pieces, so it's a physical change.",
  },
  {
    id: "melt-cheese", action: "Melting cheese on a pizza", kind: "physical", clues: ["state", "same"], avoid: ["gas", "color"], minBand: "g35", heated: true,
    explain: "Melting changes the cheese from solid to a gooey liquid, but it's still cheese. Melting is a physical change (if it gets brown spots, that browning part is chemical).",
    k2: { prompt: "Cheese goes on the pizza in the hot oven. What happens to it?", answer: "It melts", wrong: ["It freezes", "It turns to ice", "It gets harder"], explanation: "Heat melts the cheese so it gets soft and gooey.", ...K_HEAT },
  },
  {
    id: "bake-crust", action: "Baking pizza crust", kind: "chemical", clues: ["color", "smell", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Baking turns pale dough into a golden-brown crust with a new baked smell. New substances form and it can't turn back into dough: a chemical change.",
  },
  {
    id: "chop-peppers", action: "Chopping peppers", kind: "physical", clues: ["shape", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Chopping only changes the size and shape of the peppers. Each piece is still pepper: a physical change.",
  },
  {
    id: "boil-water", action: "Boiling pasta water", kind: "physical", clues: ["state", "reversible", "same"], avoid: ["gas"], minBand: "g35", heated: true,
    explain: "Boiling turns liquid water into water vapor (a gas). The bubbles are just water as a gas, not a new substance, and the steam turns back into drops when it cools. Physical change!",
    k2: { prompt: "Water heats up on the stove until it boils. What rises from the pot?", answer: "Steam", wrong: ["Ice", "Juice", "Sand"], explanation: "Boiling turns liquid water into steam, a gas you see rising from the pot.", ...K_HEAT },
  },
  {
    id: "steam-lid", action: "Steam making drops on the pot lid", kind: "physical", clues: ["state", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Steam cools on the lid and condenses back into liquid water drops. Still water, just a new state: a physical change.",
  },
  // ---------------------------------------------------------------- Frosty Truck
  {
    id: "freeze-pops", action: "Freezing juice into ice pops", kind: "physical", clues: ["state", "reversible", "same"], avoid: ["cold"], minBand: "g35", heated: false,
    explain: "Freezing changes juice from a liquid to a solid. It's still juice, and it melts back on a hot day: a physical change.",
    k2: { prompt: "Juice goes into the freezer overnight. What is it in the morning?", answer: "A frozen ice pop", wrong: ["Hot soup", "Steam", "Melted juice"], explanation: "The freezer is very cold, so the liquid juice freezes into a solid ice pop.", ...K_HEAT },
  },
  {
    id: "rock-salt", action: "Rock salt melting the ice around the ice-cream can", kind: "physical", clues: ["state", "mixed"], avoid: ["cold"], minBand: "g35", heated: false,
    explain: "Salt mixes into the ice and makes it melt, even below 32°F. Melting ice pulls heat out of the cream, so the cream freezes. Salt and water are still salt and water: physical changes.",
  },
  {
    id: "freeze-cream", action: "Freezing sweet cream into ice cream", kind: "physical", clues: ["state", "same"], avoid: ["cold"], minBand: "g35", heated: false,
    explain: "The cream gets cold enough to turn from liquid to solid. It's still cream and sugar, just frozen: a physical change.",
    k2: { prompt: "Sweet cream gets very, very cold in the ice-cream can. What does it become?", answer: "Ice cream", wrong: ["Hot cocoa", "Steam", "Toast"], explanation: "Cold turns the liquid cream into solid ice cream.", ...K_HEAT },
  },
  {
    id: "float-fizz", action: "Ice cream fizzing in a root beer float", kind: "physical", clues: ["already", "same"], avoid: ["gas", "cold"], minBand: "g68", heated: false,
    explain: "Tricky one! The fizz is carbon dioxide that was already dissolved in the soda. Ice cream gives it bumps to bubble out on. No new substance forms, so it's a physical change: bubbles alone don't prove a chemical change.",
  },
  {
    id: "melt-icecream", action: "Ice cream melting in the sun", kind: "physical", clues: ["state", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Melting changes ice cream from solid to liquid. It's still ice cream (just drippy!): a physical change.",
    k2: { prompt: "An ice-cream cone sits in the hot sun. What happens?", answer: "It melts and drips", wrong: ["It freezes harder", "It gets bigger", "It turns to toast"], explanation: "The sun's heat melts solid ice cream into a drippy liquid.", ...K_HEAT },
  },
  {
    id: "cocoa", action: "Stirring cocoa powder into warm milk", kind: "physical", clues: ["mixed", "same"], avoid: ["color"], minBand: "g35", heated: false,
    explain: "The cocoa mixes into the milk, but it's still cocoa and milk. Mixing is a physical change.",
  },
  {
    id: "blend-fruit", action: "Blending frozen fruit", kind: "physical", clues: ["shape", "same"], avoid: ["color"], minBand: "g35", heated: false,
    explain: "The blender breaks the fruit into tiny pieces. It's still fruit: a physical change.",
  },
  // ---------------------------------------------------------------- Bake-Off
  {
    id: "bake-cupcake", action: "Baking cupcakes with baking soda", kind: "chemical", clues: ["gas", "color", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Baking soda reacts with acid in the batter and makes carbon dioxide gas, so the cupcakes rise, and the tops turn golden. New substances, can't undo: a chemical change.",
    k2: { prompt: "Cupcake batter bakes in the hot oven. What happens?", answer: "It rises up", wrong: ["It freezes", "It turns to juice", "It gets smaller"], explanation: "Heat and tiny gas bubbles make the cupcakes rise up and turn golden.", ...K_HEAT },
  },
  {
    id: "caramel", action: "Heating sugar until it turns into brown caramel", kind: "chemical", clues: ["color", "smell", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "At first sugar just melts (physical). Keep heating and it turns brown with a new caramel smell: new substances, so caramelizing is a chemical change.",
  },
  {
    id: "melt-chocolate", action: "Melting chocolate", kind: "physical", clues: ["state", "reversible", "same"], avoid: [], minBand: "g35", heated: true,
    explain: "Melting changes chocolate from solid to liquid. It's still chocolate and hardens again when it cools: a physical change.",
    k2: { prompt: "Chocolate chips warm up in a bowl. What happens to them?", answer: "They melt", wrong: ["They freeze", "They turn to ice", "They grow bigger"], explanation: "Warm chocolate melts into a liquid. When it cools, it gets hard again.", ...K_HEAT },
  },
  {
    id: "cookies", action: "Baking cookies", kind: "chemical", clues: ["color", "smell", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Baking makes new substances: golden-brown edges and that fresh-cookie smell. You can't un-bake a cookie: a chemical change.",
  },
  {
    id: "soda-vinegar", action: "Mixing baking soda and vinegar", kind: "chemical", clues: ["gas", "cold", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "Baking soda and vinegar react and make a new gas, carbon dioxide, so it fizzes. The mix even gets a little colder. New substances form: a chemical change.",
  },
  {
    id: "whip-cream", action: "Whipping cream", kind: "physical", clues: ["mixed", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Whipping beats tiny air bubbles into the cream so it gets fluffy. It's still cream plus air: a physical change.",
  },
  // ---------------------------------------------------------------- around any kitchen
  {
    id: "brown-apple", action: "A cut apple turning brown", kind: "chemical", clues: ["color", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "Chemicals in the apple react with oxygen in the air and make new brown substances. It can't turn white again: a chemical change.",
  },
  {
    id: "sour-milk", action: "Old milk going sour", kind: "chemical", clues: ["smell", "solid", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "Bacteria change the milk into new substances: a sour smell and lumpy clumps. Sour milk can't become fresh again: a chemical change.",
  },
  {
    id: "milk-vinegar", action: "Vinegar curdling warm milk", kind: "chemical", clues: ["solid", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "The acid in vinegar makes the milk's protein clump into new solid curds. They don't turn back into milk: a chemical change.",
  },
  {
    id: "gas-flame", action: "Gas burning in the stove's flame", kind: "chemical", clues: ["heatlight", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "Burning is a chemical change: the gas reacts with oxygen and gives off heat and light, making new gases (carbon dioxide and water vapor).",
  },
  {
    id: "rust-pan", action: "A wet iron pan rusting", kind: "chemical", clues: ["color", "irreversible"], avoid: [], minBand: "g35", heated: false,
    explain: "Iron reacts with water and oxygen to make rust, a new orange-brown substance. That's a chemical change.",
  },
  {
    id: "crush-crackers", action: "Crushing crackers", kind: "physical", clues: ["shape", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Crushing makes smaller pieces, but they're still crackers: a physical change.",
  },
  {
    id: "melt-ice", action: "Ice cubes melting in a drink", kind: "physical", clues: ["state", "reversible", "same"], avoid: ["cold"], minBand: "g35", heated: false,
    explain: "Melting turns solid ice into liquid water. It's still water and can freeze again: a physical change.",
    k2: { prompt: "Ice cubes sit in a glass of warm juice. What happens?", answer: "They melt", wrong: ["They grow bigger", "They turn to steam", "They get colder"], explanation: "The warm juice melts the solid ice cubes into liquid water.", ...K_HEAT },
  },
  {
    id: "salt-water", action: "Dissolving salt in pasta water", kind: "physical", clues: ["mixed", "reversible", "same"], avoid: [], minBand: "g35", heated: false,
    explain: "Salt dissolves and spreads through the water, but it's still salt (taste it!). Let the water evaporate and the salt is left. Dissolving is a physical change.",
  },
  {
    id: "burnt-toast", action: "Burning toast", kind: "chemical", clues: ["color", "smell", "irreversible"], avoid: [], minBand: "g35", heated: true,
    explain: "Burnt toast turns black and smoky-smelling. New substances (like carbon) form and you can't undo it: a chemical change.",
  },
];

export const CHANGE_BY_ID = new Map(CHANGES.map((c) => [c.id, c]));

const BAND_ORDER: Band[] = ["k2", "g35", "g68", "hs"];
export function bandAtLeast(b: Band, min: Band): boolean {
  return BAND_ORDER.indexOf(b) >= BAND_ORDER.indexOf(min);
}

// ------------------------------------------------------------------ K-2 extras

export type State = "solid" | "liquid" | "gas";
/** Kitchen things and their state (at room temperature unless the name says otherwise). */
export const STATE_THINGS: { thing: string; state: State }[] = [
  { thing: "an ice cube", state: "solid" },
  { thing: "a carrot", state: "solid" },
  { thing: "a cookie", state: "solid" },
  { thing: "a stick of cold butter", state: "solid" },
  { thing: "a frozen ice pop", state: "solid" },
  { thing: "an apple", state: "solid" },
  { thing: "orange juice", state: "liquid" },
  { thing: "milk", state: "liquid" },
  { thing: "maple syrup", state: "liquid" },
  { thing: "honey", state: "liquid" },
  { thing: "water from the tap", state: "liquid" },
  { thing: "steam from the pot", state: "gas" },
  { thing: "the air in a balloon", state: "gas" },
  { thing: "the bubbles' air in soda", state: "gas" },
];

/** Heating and cooling: what happens to a thing on the stove or in the freezer. */
export type Transition = { thing: string; start: "solid" | "liquid"; action: "heat" | "cool"; boils?: boolean };
export const TRANSITIONS: Transition[] = [
  { thing: "a pat of butter", start: "solid", action: "heat" },
  { thing: "chocolate chips", start: "solid", action: "heat" },
  { thing: "an ice cube", start: "solid", action: "heat" },
  { thing: "a slice of cheese", start: "solid", action: "heat" },
  { thing: "orange juice", start: "liquid", action: "cool" },
  { thing: "a cup of water", start: "liquid", action: "cool" },
  { thing: "melted chocolate", start: "liquid", action: "cool" },
  { thing: "lemonade", start: "liquid", action: "cool" },
  { thing: "a pot of water", start: "liquid", action: "heat", boils: true },
];

export function transitionResult(t: Transition): string {
  if (t.action === "heat") return t.start === "solid" ? "It melts" : "It boils into steam";
  return t.start === "liquid" ? "It freezes" : "It stays solid";
}

// ------------------------------------------------------------------ 3-5 mixtures

export const MIXES: { what: string; dissolves: boolean }[] = [
  { what: "Sugar stirred into warm water", dissolves: true },
  { what: "Salt stirred into soup broth", dissolves: true },
  { what: "Lemonade powder stirred into water", dissolves: true },
  { what: "Honey stirred into hot tea", dissolves: true },
  { what: "Blueberries tossed with strawberries", dissolves: false },
  { what: "Cereal poured into milk", dissolves: false },
  { what: "Raisins mixed with peanuts", dissolves: false },
  { what: "Pepper flakes sprinkled on water", dissolves: false },
];
export const MIX_CHOICES = {
  solution: "Solution: it dissolves",
  mixture: "Mixture: parts stay apart",
  reacts: "New substance: it reacts",
  none: "Nothing mixes at all",
};

// ------------------------------------------------------------------ 6-12 rates and energy

export type RateFactor = "temperature" | "surface area" | "concentration" | "a catalyst";
export const RATES: { situation: string; effect: "faster" | "slower"; factor: RateFactor }[] = [
  { situation: "Pizza dough is set to rise in a warm spot instead of the fridge", effect: "faster", factor: "temperature" },
  { situation: "Sugar is stirred into iced tea instead of hot tea", effect: "slower", factor: "temperature" },
  { situation: "Milk is kept in the fridge instead of on the counter (it sours)", effect: "slower", factor: "temperature" },
  { situation: "Cookies bake at 400°F instead of 325°F (they brown)", effect: "faster", factor: "temperature" },
  { situation: "Sugar cubes are crushed into powder before going in the tea", effect: "faster", factor: "surface area" },
  { situation: "Potatoes are cut into small cubes before boiling", effect: "faster", factor: "surface area" },
  { situation: "Baking soda is added to stronger vinegar instead of watered-down vinegar", effect: "faster", factor: "concentration" },
  { situation: "Meat tenderizer powder (an enzyme) is sprinkled on a steak", effect: "faster", factor: "a catalyst" },
  { situation: "Yeast dough rises in a 40°F fridge instead of an 80°F kitchen", effect: "slower", factor: "temperature" },
  { situation: "A whole sugar cube is used instead of loose sugar crystals", effect: "slower", factor: "surface area" },
];

export const ENERGY: { process: string; kind: Kind; energy: "exothermic" | "endothermic"; why: string }[] = [
  { process: "Natural gas burning in the stove's flame", kind: "chemical", energy: "exothermic", why: "Burning makes new substances and gives off heat and light." },
  { process: "Baking soda reacting with vinegar (the cup gets colder)", kind: "chemical", energy: "endothermic", why: "A new gas forms, and the reaction takes in heat from its surroundings, so the cup feels colder." },
  { process: "Cake batter baking in the oven", kind: "chemical", energy: "endothermic", why: "New substances form, but only while the oven keeps pouring heat in. Take the heat away and the baking stops." },
  { process: "An egg cooking in a pan", kind: "chemical", energy: "endothermic", why: "The egg's proteins change into new forms, and the egg must keep absorbing heat from the pan." },
  { process: "Yeast fermenting sugar in bread dough", kind: "chemical", energy: "exothermic", why: "Yeast break sugar into CO2 and alcohol and release a little energy as heat; a big bowl of dough even warms up slightly." },
  { process: "A wet iron pan slowly rusting", kind: "chemical", energy: "exothermic", why: "Iron + oxygen + water make rust and release heat (fast enough in hand warmers to feel it)." },
  { process: "Ice cubes melting in a drink", kind: "physical", energy: "endothermic", why: "Melting is a change of state that absorbs heat from the drink, which is why the drink gets cold." },
  { process: "Juice freezing into ice pops", kind: "physical", energy: "exothermic", why: "Freezing is a change of state; the juice must give off heat to the freezer to become solid." },
  { process: "Steam condensing into drops on a cold lid", kind: "physical", energy: "exothermic", why: "Condensing is a change of state that releases heat (steam burns are worse than hot-water burns for this reason)." },
  { process: "Water boiling in a pot", kind: "physical", energy: "endothermic", why: "Boiling is a change of state; water must absorb heat to become a gas." },
  { process: "Ice melting in rock salt around an ice-cream can", kind: "physical", energy: "endothermic", why: "Salt makes the ice melt; melting absorbs heat, pulling it out of the cream so the cream freezes." },
];

const ENERGY_CHOICE = (k: Kind, e: "exothermic" | "endothermic") => `${k === "chemical" ? "Chemical" : "Physical"}, ${e}`;

/** Static high-school and middle-school items, answer first. */
interface Fixed { id: string; band: Band; standard: string; skill: string; prompt: string; answer: string; wrong: [string, string, string]; explanation: string }
export const FIXED: Fixed[] = [
  { id: "yeast-gas", band: "hs", standard: "LS.Bio.3.3", skill: "Fermentation", prompt: "Yeast in pizza dough ferment sugar. Which gas makes the dough rise?", answer: "Carbon dioxide", wrong: ["Oxygen", "Nitrogen", "Hydrogen"], explanation: "Fermentation breaks sugar into carbon dioxide and ethanol. CO2 bubbles get trapped in the stretchy dough and puff it up." },
  { id: "yeast-ethanol", band: "hs", standard: "LS.Bio.3.3", skill: "Fermentation", prompt: "Besides CO2, yeast fermentation makes which product, which bakes off in the oven?", answer: "Ethanol (alcohol)", wrong: ["Table salt", "Oxygen gas", "Protein"], explanation: "Yeast fermentation: sugar → ethanol + carbon dioxide. The small amount of ethanol evaporates during baking." },
  { id: "soda-acid", band: "hs", standard: "PS.Chm.4.2", skill: "Reaction types", prompt: "Why does a recipe using baking soda also need an acid like buttermilk or lemon juice?", answer: "The acid reacts with it to release CO2", wrong: ["The acid makes it taste sweeter", "The acid freezes the batter", "The acid adds oxygen gas"], explanation: "Baking soda (NaHCO3) is a base. With an acid it reacts to form carbon dioxide gas, water and a salt; the CO2 makes the batter rise." },
  { id: "powder", band: "hs", standard: "PS.Chm.4.2", skill: "Reaction types", prompt: "Baking powder rises without any added acid in the recipe. What does it contain besides baking soda?", answer: "A dry acid", wrong: ["Dried yeast", "Extra sugar", "Ice crystals"], explanation: "Baking powder is baking soda plus a dry acid. Add water (and heat) and they react to make CO2." },
  { id: "soda-eq", band: "hs", standard: "PS.Chm.4.2", skill: "Reaction types", prompt: "NaHCO3 + CH3COOH → CH3COONa + H2O + ___. What fills the blank?", answer: "CO2", wrong: ["O2", "H2", "NaCl"], explanation: "Baking soda + acetic acid (vinegar) → sodium acetate + water + carbon dioxide. Count the atoms: one C and two O are left for CO2." },
  { id: "yeast-hot", band: "hs", standard: "LS.Bio.3.3", skill: "Fermentation", prompt: "Why shouldn't dough rise in a spot hotter than about 140°F (60°C)?", answer: "Too much heat kills the yeast", wrong: ["Heat turns the yeast into sugar", "Yeast only works when frozen", "Heat makes extra oxygen"], explanation: "Yeast work fastest around 80–100°F. Much hotter and the living yeast cells die, so no more CO2 is made." },
  { id: "maillard", band: "hs", standard: "PS.Chm.4.2", skill: "Reaction types", prompt: "The brown crust and toasty smell of baked bread come mainly from...", answer: "Sugars and proteins reacting", wrong: ["Water freezing in the dough", "Salt dissolving", "Yeast multiplying"], explanation: "The Maillard reaction between sugars and proteins at high heat forms hundreds of new brown, tasty-smelling compounds: a chemical change." },
  { id: "particles-melt", band: "g68", standard: "PS.6.1.2", skill: "Particles and phase changes", prompt: "When butter melts in a warm pan, what happens to its particles?", answer: "They move faster and slide past each other", wrong: ["They turn into new molecules", "They stop moving", "They disappear"], explanation: "Heating gives particles more energy. In a liquid they still touch but can slide past each other. The molecules are the same, so melting is physical." },
  { id: "particles-freeze", band: "g68", standard: "PS.6.1.2", skill: "Particles and phase changes", prompt: "When juice freezes into an ice pop, its particles...", answer: "Slow down and lock in place", wrong: ["Speed up and fly apart", "Turn into new substances", "Get bigger"], explanation: "Cooling takes energy away. The particles slow down until they hold fixed positions and only vibrate: a solid." },
  { id: "evidence-heat", band: "g68", standard: "PS.8.1.4", skill: "Physical and chemical changes", prompt: "Butter gets hot in a pan. Why isn't 'it got hot' proof of a chemical change?", answer: "The heat came from the stove", wrong: ["Butter can never get hot", "Hot things are always chemical", "Heat is a new substance"], explanation: "Evidence of a chemical reaction is heat or light given off BY the reaction. Here the stove added the heat, and the butter just melted (physical)." },
  { id: "bubbles-boil", band: "g68", standard: "PS.8.1.4", skill: "Physical and chemical changes", prompt: "Boiling water is full of bubbles. What are they?", answer: "Water vapor (gas water)", wrong: ["A new gas from a reaction", "Air from the stove", "Oxygen split from water"], explanation: "Boiling bubbles are water that changed to its gas state. No new substance forms, so boiling is a physical change." },
];

// ------------------------------------------------------------------ generators

/** The kit-style NC code for a combined / evidence check at a band. */
function changeStandard(band: Band, item: ChangeItem): { standard: string; skill: string } {
  if (band === "g35") {
    if (item.clues.includes("state")) return { standard: "PS.3.1.3", skill: "Heating and cooling matter" };
    return { standard: "PS.5.1.2", skill: "Physical and chemical changes" };
  }
  if (band === "g68") return { standard: "PS.8.1.4", skill: "Physical and chemical changes" };
  return { standard: "PS.Chm.4", skill: "Evidence of chemical reactions" };
}

const LABEL: Record<Kind, string> = { physical: "Physical", chemical: "Chemical" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

let sciCounter = 0;
const nextId = (key: string) => `sci-kc-${key}-${++sciCounter}`;

/** Physical or chemical, plus the evidence: "Chemical: a new color appears". */
export function combinedCheck(item: ChangeItem, grade: Grade, r: Rng, moment: Moment = "any"): CafeQ | null {
  const band = bandOf(grade);
  const other: Kind = item.kind === "physical" ? "chemical" : "physical";
  const right = pick(r, item.clues);
  const pool = (Object.keys(CLUE_KIND) as Clue[]).filter((c) => CLUE_KIND[c] === other && !item.avoid.includes(c));
  const wrong = shuffle(r, pool).slice(0, 3).map((c) => `${LABEL[other]}: ${CLUE_TEXT[c]}`);
  const d: Draft = {
    prompt: `Chef Bix is ${item.action[0].toLowerCase()}${item.action.slice(1)}. Physical or chemical change? Pick the change and its evidence.`,
    answer: `${LABEL[item.kind]}: ${CLUE_TEXT[right]}`,
    wrong,
    explanation: item.explain,
    params: { item: item.id, clue: right },
  };
  return build({ id: nextId(item.id), subject: "science", grade, ...changeStandard(band, item), topic: "physical", gen: "combined", moment }, d);
}

/** Which observation is evidence? (grades 6+). */
export function evidenceCheck(item: ChangeItem, grade: Grade, r: Rng, moment: Moment = "any"): CafeQ | null {
  const band = bandOf(grade);
  const other: Kind = item.kind === "physical" ? "chemical" : "physical";
  const right = pick(r, item.clues);
  const pool = (Object.keys(CLUE_KIND) as Clue[]).filter((c) => CLUE_KIND[c] === other && !item.avoid.includes(c));
  const wrongClues = shuffle(r, pool);
  const wrong: string[] = [];
  if (item.kind === "chemical" && item.heated) wrong.push("It was heated on purpose");
  for (const c of wrongClues) wrong.push(cap(CLUE_TEXT[c]));
  const verb = item.action[0].toLowerCase() + item.action.slice(1);
  const d: Draft = {
    prompt: item.kind === "chemical" ? `Which clue is real evidence that ${verb} is a chemical change?` : `Which clue shows that ${verb} is only a physical change?`,
    answer: cap(CLUE_TEXT[right]),
    wrong,
    explanation: item.explain,
    params: { item: item.id, clue: right },
  };
  return build({ id: nextId(`ev-${item.id}`), subject: "science", grade, ...changeStandard(band, item), topic: "physical", gen: "evidence", moment }, d);
}

export function k2Check(item: ChangeItem, grade: Grade, moment: Moment = "any"): CafeQ | null {
  const k = item.k2;
  if (!k) return null;
  return build(
    { id: nextId(`k2-${item.id}`), subject: "science", grade, standard: k.standard, skill: k.skill, topic: "physical", gen: "k2item", moment },
    { prompt: k.prompt, answer: k.answer, wrong: [...k.wrong], explanation: k.explanation, params: { item: item.id } },
  );
}

function stateCheck(grade: Grade, r: Rng): CafeQ | null {
  const state = pick(r, ["solid", "liquid", "gas"] as State[]);
  const right = pick(r, STATE_THINGS.filter((t) => t.state === state));
  const wrong = shuffle(r, STATE_THINGS.filter((t) => t.state !== state)).slice(0, 3);
  const name = (t: string) => cap(t.replace(/^(an?|the) /, ""));
  return build(
    { id: nextId("state"), subject: "science", grade, ...K_PROPS, topic: "physical", gen: "state", moment: "any" },
    {
      prompt: `Which one is a ${state}?`,
      answer: name(right.thing),
      wrong: wrong.map((w) => name(w.thing)),
      explanation: `${name(right.thing)} is a ${state}. ${state === "solid" ? "Solids keep their own shape." : state === "liquid" ? "Liquids pour and take the shape of their cup." : "Gases spread out to fill any space."}`,
      params: { state, thing: right.thing, others: wrong.map((w) => w.thing) },
    },
  );
}

function transitionCheck(grade: Grade, r: Rng): CafeQ | null {
  const t = pick(r, TRANSITIONS);
  const answer = transitionResult(t);
  const where = t.action === "heat" ? "on the hot stove" : "in the freezer";
  const all = ["It melts", "It freezes", "It boils into steam", "It turns into a carrot", "It stays solid"];
  return build(
    { id: nextId("trans"), subject: "science", grade, ...K_HEAT, topic: "physical", gen: "transition", moment: t.action === "heat" ? "stove" : "freezer" },
    {
      prompt: `Chef Bix puts ${t.thing} ${where}. What happens?`,
      answer,
      wrong: shuffle(r, all.filter((a) => a !== answer)),
      explanation: t.action === "heat" ? (t.start === "solid" ? "Heating a solid makes it melt into a liquid." : "Heating water a lot makes it boil into steam, a gas.") : "Cooling a liquid a lot makes it freeze into a solid.",
      params: { thing: t.thing },
    },
  );
}

function warmPlaceCheck(grade: Grade, r: Rng): CafeQ | null {
  const thing = pick(r, ["butter", "chocolate", "an ice cube", "an ice pop"]);
  return build(
    { id: nextId("warm"), subject: "science", grade, ...K_HEAT, topic: "physical", gen: "warmPlace", moment: "any" },
    {
      prompt: `Where will ${thing} melt the fastest?`,
      answer: "Next to the warm stove",
      wrong: ["In the freezer", "In the fridge", "In a snowbank"],
      explanation: "Heat makes things melt. The warmest place melts it fastest!",
      params: { thing },
    },
  );
}

function mixCheck(grade: Grade, r: Rng): CafeQ | null {
  const m = pick(r, MIXES);
  return build(
    { id: nextId("mix"), subject: "science", grade, standard: "PS.5.1.2", skill: "Mixtures and solutions", topic: "physical", gen: "mix", moment: "bowl" },
    {
      prompt: `${m.what}. What do you get?`,
      answer: m.dissolves ? MIX_CHOICES.solution : MIX_CHOICES.mixture,
      wrong: [m.dissolves ? MIX_CHOICES.mixture : MIX_CHOICES.solution, MIX_CHOICES.reacts, MIX_CHOICES.none],
      explanation: m.dissolves
        ? "It dissolves: the pieces spread out evenly and you can't see them, but they're still there. That mixture is called a solution (a physical change)."
        : "Each part keeps its own look and you could pick them apart. That's a mixture, not a solution (a physical change).",
      params: { what: m.what },
    },
  );
}

function massCheck(grade: Grade, r: Rng): CafeQ | null {
  const band = bandOf(grade);
  const before = int(r, 12, 60) * 5;
  const gas = int(r, 2, 9);
  const sealed = r() < 0.5;
  const answer = sealed ? before : before - gas;
  const unit = "g";
  return build(
    { id: nextId("mass"), subject: "science", grade, standard: band === "g35" ? "PS.5.1.1" : "PS.8.1", skill: "Conservation of mass", topic: "physical", gen: "mass", moment: "bowl" },
    {
      prompt: sealed
        ? `In a sealed bag, baking soda and vinegar weigh ${before} ${unit} in all. They fizz and make ${gas} ${unit} of gas, but the bag stays shut. What does the bag weigh now?`
        : `In an open cup, baking soda and vinegar weigh ${before} ${unit}. They fizz and ${gas} ${unit} of carbon dioxide floats away. What does the cup weigh now?`,
      answer: `${answer} ${unit}`,
      wrong: [`${sealed ? before + gas : before} ${unit}`, `${sealed ? before - gas : before + gas} ${unit}`, `${gas} ${unit}`, `${before * 2} ${unit}`],
      explanation: sealed
        ? `Matter isn't created or destroyed. The new gas is trapped in the sealed bag, so the total stays ${before} ${unit}.`
        : `Mass is conserved, but the ${gas} ${unit} of gas escaped from the open cup: ${before} − ${gas} = ${answer} ${unit} left on the scale.`,
      params: { before, gas, sealed },
    },
  );
}

function rateCheck(grade: Grade, r: Rng): CafeQ | null {
  const band = bandOf(grade);
  const x = pick(r, RATES);
  if (band === "hs") {
    const all: RateFactor[] = ["temperature", "surface area", "concentration", "a catalyst"];
    return build(
      { id: nextId("rateF"), subject: "science", grade, standard: "PS.Chm.5.1", skill: "Reaction rates", topic: "physical", gen: "rateFactor", moment: "oven" },
      {
        prompt: `${x.situation}. Which factor changes how fast it happens?`,
        answer: cap(x.factor),
        wrong: all.filter((f) => f !== x.factor).map(cap),
        explanation: `${cap(x.factor)} changes the rate here: it makes it ${x.effect}. ${rateWhy(x.factor)}`,
        params: { situation: x.situation },
      },
    );
  }
  return build(
    { id: nextId("rate"), subject: "science", grade, standard: "PS.8.1", skill: "Temperature and reaction speed", topic: "physical", gen: "rate", moment: "oven" },
    {
      prompt: `${x.situation}. Does the change happen faster or slower?`,
      answer: cap(x.effect),
      wrong: [cap(x.effect === "faster" ? "slower" : "faster"), "Exactly the same speed", "It can't happen at all"],
      explanation: `${cap(x.effect)}. ${rateWhy(x.factor)}`,
      params: { situation: x.situation },
    },
  );
}

function rateWhy(f: RateFactor): string {
  switch (f) {
    case "temperature": return "Warmer particles move faster and bump into each other more often and harder; colder ones slow down.";
    case "surface area": return "Smaller pieces have more surface touching the water or air, so more particles can react or dissolve at once.";
    case "concentration": return "A stronger solution packs more particles into the same space, so they collide more often.";
    case "a catalyst": return "A catalyst (like an enzyme) speeds up a reaction without being used up.";
  }
}

function energyCheck(grade: Grade, r: Rng): CafeQ | null {
  const x = pick(r, ENERGY);
  const all = (["chemical", "physical"] as Kind[]).flatMap((k) => (["exothermic", "endothermic"] as const).map((e) => ENERGY_CHOICE(k, e)));
  const answer = ENERGY_CHOICE(x.kind, x.energy);
  return build(
    { id: nextId("energy"), subject: "science", grade, standard: "PS.Chm.4.1", skill: "Energy in reactions", topic: "physical", gen: "energy", moment: "stove" },
    {
      prompt: `${x.process}: which kind of change is it, and does it release heat (exothermic) or absorb heat (endothermic)?`,
      answer,
      wrong: all.filter((a) => a !== answer),
      explanation: x.why,
      params: { process: x.process },
    },
  );
}

function fixedCheck(f: Fixed, grade: Grade): CafeQ | null {
  return build(
    { id: nextId(f.id), subject: "science", grade, standard: f.standard, skill: f.skill, topic: "physical", gen: "fixed", moment: "any" },
    { prompt: f.prompt, answer: f.answer, wrong: [...f.wrong], explanation: f.explanation, params: { fixed: f.id } },
  );
}

/** Items a grade can see in the combined/evidence checks. */
export function changesFor(grade: Grade): ChangeItem[] {
  const band = bandOf(grade);
  if (band === "k2") return CHANGES.filter((c) => c.k2);
  return CHANGES.filter((c) => bandAtLeast(band, c.minBand));
}

/**
 * A Science Check for a grade. `itemId` (the change Chef Bix just made at a station) is used when
 * the grade has a check for it; otherwise a random check from the grade's pool.
 */
export function scienceCheck(grade: Grade, r: Rng, itemId?: string, moment: Moment = "any"): CafeQ {
  const band = bandOf(grade);
  const n = gradeN(grade);
  const item = itemId ? CHANGE_BY_ID.get(itemId) : undefined;
  for (let attempt = 0; attempt < 40; attempt++) {
    let q: CafeQ | null = null;
    const roll = r();
    if (band === "k2") {
      if (item?.k2 && attempt === 0) q = k2Check(item, grade, moment);
      else if (roll < 0.45) q = k2Check(pick(r, changesFor(grade)), grade, moment);
      else if (roll < 0.7) q = transitionCheck(grade, r);
      else if (roll < 0.88) q = stateCheck(grade, r);
      else q = warmPlaceCheck(grade, r);
    } else if (band === "g35") {
      const pool = changesFor(grade);
      if (item && attempt === 0 && pool.includes(item)) q = combinedCheck(item, grade, r, moment);
      else if (roll < 0.7) q = combinedCheck(pick(r, pool), grade, r, moment);
      else if (roll < 0.85 || n < 5) q = mixCheck(grade, r);
      else q = massCheck(grade, r);
    } else if (band === "g68") {
      const pool = changesFor(grade);
      if (item && attempt === 0 && pool.includes(item)) q = r() < 0.5 ? combinedCheck(item, grade, r, moment) : evidenceCheck(item, grade, r, moment);
      else if (roll < 0.3) q = combinedCheck(pick(r, pool), grade, r, moment);
      else if (roll < 0.55) q = evidenceCheck(pick(r, pool), grade, r, moment);
      else if (roll < 0.7) q = massCheck(grade, r);
      else if (roll < 0.87) q = rateCheck(grade, r);
      else q = fixedCheck(pick(r, FIXED.filter((f) => f.band === "g68")), grade);
    } else {
      const pool = changesFor(grade);
      if (item && attempt === 0 && pool.includes(item)) q = evidenceCheck(item, grade, r, moment);
      else if (roll < 0.3) q = energyCheck(grade, r);
      else if (roll < 0.5) q = rateCheck(grade, r);
      else if (roll < 0.75) q = fixedCheck(pick(r, FIXED.filter((f) => f.band === "hs")), grade);
      else q = evidenceCheck(pick(r, pool), grade, r, moment);
    }
    if (q) return q;
  }
  // Never reached in practice (the checker proves every path builds); a safe item just in case.
  return combinedCheck(CHANGES[0], grade, r, moment)!;
}

/** Every science generator, by name, for the checker. */
export const SCIENCE_GENS = { combinedCheck, evidenceCheck, k2Check, stateCheck, transitionCheck, warmPlaceCheck, mixCheck, massCheck, rateCheck, energyCheck, fixedCheck };
