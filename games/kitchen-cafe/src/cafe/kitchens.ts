/*
 * The four kitchens (levels), their five stations and the dishes on each menu. A dish is a list
 * of station steps; a step can name the kitchen change it makes (science.ts CHANGES id), which
 * the Science Check then asks about.
 */

export type StationId = "board" | "stove" | "oven" | "freezer" | "bowl";

export const STATIONS: { id: StationId; name: string; short: string }[] = [
  { id: "board", name: "Cutting Board", short: "BOARD" },
  { id: "bowl", name: "Mixing Bowl", short: "BOWL" },
  { id: "stove", name: "Stove", short: "STOVE" },
  { id: "oven", name: "Oven", short: "OVEN" },
  { id: "freezer", name: "Freezer", short: "FREEZER" },
];
export const STATION_INDEX: Record<StationId, number> = { board: 0, bowl: 1, stove: 2, oven: 3, freezer: 4 };

export interface Step {
  station: StationId;
  /** What the ticket says, e.g. "Toast the bread". */
  verb: string;
  /** The kitchen change this step makes (science.ts CHANGES id). */
  change?: string;
}

export interface Dish {
  id: string;
  name: string;
  /** Menu price in cents (shown on the ticket; the money questions write their own prices). */
  price: number;
  steps: Step[];
  /** Bake-Off test batches (grades 5+): the experiment this order runs. */
  experiment?: boolean;
}

export interface Kitchen {
  id: 1 | 2 | 3 | 4;
  name: string;
  tag: string;
  blurb: string;
  dishes: Dish[];
}

export const KITCHENS: Kitchen[] = [
  {
    id: 1, name: "Breakfast Diner", tag: "DINER",
    blurb: "Eggs, toast and pancakes. Melt butter, dissolve sugar, and spot what changes for good.",
    dishes: [
      { id: "egg", name: "Sunny Egg", price: 300, steps: [{ station: "board", verb: "Crack the egg" }, { station: "stove", verb: "Fry the egg", change: "fry-egg" }] },
      { id: "toast", name: "Buttered Toast", price: 250, steps: [{ station: "board", verb: "Slice the bread", change: "slice-bread" }, { station: "oven", verb: "Toast the bread", change: "toast" }, { station: "stove", verb: "Melt the butter", change: "melt-butter" }] },
      { id: "pancakes", name: "Pancake Stack", price: 450, steps: [{ station: "bowl", verb: "Mix the batter" }, { station: "stove", verb: "Cook the pancakes", change: "pancakes" }] },
      { id: "tea", name: "Sweet Tea", price: 150, steps: [{ station: "bowl", verb: "Stir in the sugar", change: "dissolve-sugar" }, { station: "freezer", verb: "Add ice", change: "melt-ice" }] },
      { id: "lemonade", name: "Lemonade", price: 175, steps: [{ station: "board", verb: "Squeeze the lemons" }, { station: "freezer", verb: "Chill it", change: "chill-juice" }] },
      { id: "omelet", name: "Veggie Omelet", price: 500, steps: [{ station: "bowl", verb: "Whisk the eggs", change: "whisk-eggs" }, { station: "board", verb: "Chop the peppers", change: "chop-peppers" }, { station: "stove", verb: "Cook it", change: "fry-egg" }] },
    ],
  },
  {
    id: 2, name: "Pizza Parlor", tag: "PIZZA",
    blurb: "Yeast dough rises, cheese melts and crusts bake. Slice pizzas into fractions.",
    dishes: [
      { id: "cheese-pizza", name: "Cheese Pizza", price: 900, steps: [{ station: "bowl", verb: "Let the dough rise", change: "yeast-rise" }, { station: "board", verb: "Grate the cheese", change: "grate-cheese" }, { station: "oven", verb: "Bake the pizza", change: "bake-crust" }] },
      { id: "veggie-pizza", name: "Veggie Pizza", price: 1050, steps: [{ station: "board", verb: "Chop the peppers", change: "chop-peppers" }, { station: "oven", verb: "Melt the cheese", change: "melt-cheese" }] },
      { id: "pasta", name: "Pasta Bowl", price: 800, steps: [{ station: "stove", verb: "Salt the water", change: "salt-water" }, { station: "stove", verb: "Boil the water", change: "boil-water" }, { station: "board", verb: "Slice the bread", change: "slice-bread" }] },
      { id: "knots", name: "Garlic Knots", price: 450, steps: [{ station: "bowl", verb: "Let the dough rise", change: "yeast-rise" }, { station: "oven", verb: "Bake the knots", change: "bake-crust" }] },
      { id: "salad", name: "Side Salad", price: 400, steps: [{ station: "board", verb: "Chop the peppers", change: "chop-peppers" }, { station: "bowl", verb: "Crush the croutons", change: "crush-crackers" }] },
    ],
  },
  {
    id: 3, name: "Frosty Truck", tag: "FROSTY",
    blurb: "Freeze, melt and shake rock-salt ice cream. Read thermometers below zero.",
    dishes: [
      { id: "pops", name: "Ice Pops", price: 200, steps: [{ station: "bowl", verb: "Mix the juice" }, { station: "freezer", verb: "Freeze the pops", change: "freeze-pops" }] },
      { id: "icecream", name: "Shake-It Ice Cream", price: 350, steps: [{ station: "bowl", verb: "Mix cream and sugar" }, { station: "freezer", verb: "Pack in salty ice", change: "rock-salt" }, { station: "freezer", verb: "Freeze the cream", change: "freeze-cream" }] },
      { id: "float", name: "Root Beer Float", price: 375, steps: [{ station: "freezer", verb: "Scoop the ice cream" }, { station: "bowl", verb: "Pour the soda", change: "float-fizz" }] },
      { id: "cocoa", name: "Hot Cocoa", price: 250, steps: [{ station: "stove", verb: "Warm the milk" }, { station: "bowl", verb: "Stir in cocoa", change: "cocoa" }] },
      { id: "smoothie", name: "Berry Smoothie", price: 425, steps: [{ station: "freezer", verb: "Grab frozen berries" }, { station: "bowl", verb: "Blend it", change: "blend-fruit" }] },
      { id: "sundae", name: "Sunny Sundae", price: 450, steps: [{ station: "freezer", verb: "Scoop the ice cream", change: "melt-icecream" }, { station: "stove", verb: "Melt the chocolate", change: "melt-chocolate" }] },
    ],
  },
  {
    id: 4, name: "Bake-Off Finale", tag: "BAKE-OFF",
    blurb: "The big show! Bake, caramelize and run fair tests: change one thing and compare the results.",
    dishes: [
      { id: "cupcakes", name: "Cupcakes", price: 300, steps: [{ station: "bowl", verb: "Mix the batter" }, { station: "oven", verb: "Bake the cupcakes", change: "bake-cupcake" }] },
      { id: "cookies", name: "Choco Cookies", price: 250, steps: [{ station: "stove", verb: "Melt the chocolate", change: "melt-chocolate" }, { station: "oven", verb: "Bake the cookies", change: "cookies" }] },
      { id: "caramel", name: "Caramel Apples", price: 400, steps: [{ station: "board", verb: "Slice the apples", change: "brown-apple" }, { station: "stove", verb: "Cook the caramel", change: "caramel" }] },
      { id: "pie", name: "Cream Pie", price: 600, steps: [{ station: "bowl", verb: "Whip the cream", change: "whip-cream" }, { station: "freezer", verb: "Chill the pie" }] },
      { id: "volcano", name: "Volcano Cake", price: 700, steps: [{ station: "oven", verb: "Bake the cake", change: "bake-cupcake" }, { station: "bowl", verb: "Fizz the volcano", change: "soda-vinegar" }] },
      { id: "test", name: "Test Batch", price: 0, experiment: true, steps: [{ station: "bowl", verb: "Set up 3 trials" }, { station: "oven", verb: "Run the test" }] },
    ],
  },
];

export const KITCHEN_COUNT = KITCHENS.length;

export function kitchenById(id: number): Kitchen {
  return KITCHENS.find((k) => k.id === id) ?? KITCHENS[0];
}
