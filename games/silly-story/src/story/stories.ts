/*
 * The built-in stories: all original, silly and kid-safe. Four per grade band.
 * Template syntax is in template.ts. `cast` adds characters the story always has
 * (and links which blanks change them); every other noun blank joins the scene by itself.
 */
import type { Story } from "./types";

export const STORIES: Story[] = [
  /* ---------------------------------------------------------------- K-2 */
  {
    id: "zoo-day",
    title: "A Day at the Zoo",
    band: "K-2",
    bg: "zoo",
    blurb: "Who lives in the cages today?",
    template:
      "Today my class went to the zoo. First we saw {a} [adjective@a1] [noun:animal@n1] that liked to [verb@v1] all day. " +
      "The zookeeper gave it {a} [noun:food@f1] for a snack. Next we found [number@c2] [color@a2] [noun:animal+s@n2] in a tree. " +
      "They began to [verb@v2] when we waved! What {a} [adjective@a3] day!",
    cast: [{ sprite: "zookeeper", anim: "wave" }],
  },
  {
    id: "robot-pet",
    title: "My Robot Pet",
    band: "K-2",
    bg: "bedroom",
    blurb: "Beep boop! Build a pet out of junk.",
    template:
      "I built a robot pet out of {a} [noun:thing@n1] and some tape. My robot is [color@a1] and very [adjective@a2]. " +
      "When I press its big button, it starts to [verb@v1]! It eats [number@c1] [noun:food+s@n2] for breakfast. " +
      "At night it likes to [verb@v2] next to my pet [noun:animal@n3]. I love my robot!",
    cast: [{ sprite: "robot", adj: ["a1", "a2"], verb: "v1" }],
  },
  {
    id: "pancake-contest",
    title: "The Royal Pancake Contest",
    band: "K-2",
    bg: "castle",
    blurb: "The king is very, very hungry.",
    template:
      "The king of Flapjack Hill held a pancake contest. Chef Pip made {a} [adjective@a1] pancake as big as {a} [noun@n1]. " +
      "Then she put [number@c1] [color@a2] [noun:food+s@n2] on top. The king took one bite and began to [verb@v1]! " +
      "The queen's pet [noun:animal@n3] tried to [verb@v2] on the pancake. Chef Pip won {a} [adjective@a3] gold crown!",
    cast: [{ sprite: "pancake", adj: ["a1"] }, { sprite: "king", verb: "v1" }, { sprite: "chef", adj: ["a3"] }],
  },
  {
    id: "silly-farm",
    title: "The Bouncy Farm",
    band: "K-2",
    bg: "farm",
    blurb: "The animals on this farm are a little bit silly.",
    template:
      "On Grandpa Gus's farm, the animals are a little bit silly. The [color@a1] [noun:animal@n1] likes to [verb@v1] in the mud. " +
      "The [adjective@a2] cow says, \"Moo! I want {a} [noun:food@n2]!\" There are [number@c1] [noun:animal+s@n3] in the barn, " +
      "and they all [verb@v2] at sunrise. Grandpa Gus just laughs and eats {a} [adjective@a3] sandwich.",
    cast: [{ sprite: "cow", adj: ["a2"] }],
  },

  /* ---------------------------------------------------------------- 3-5 */
  {
    id: "space-lunch",
    title: "Space Lunch",
    band: "3-5",
    bg: "space",
    blurb: "Lunch is hard when there's no gravity.",
    template:
      "Captain Zora floated into the space station kitchen. \"I'm so hungry I could eat {a} [noun@n1]!\" she said. " +
      "She opened the fridge and found [plural-noun@n2] covered in [adjective@a1] sauce. Without gravity, her lunch " +
      "[verb-past@v1] right out of the bowl! {A} [adjective@a2] alien named Blip [verb-past@v2] [adverb@d1] past the window. " +
      "\"Want to share?\" Zora asked. Blip held up [number@c1] [color@a3] [plural-noun@n3]. They ate together, " +
      "[verb-ing@v3] [adverb@d2] until the stars came out.",
    cast: [{ sprite: "astronaut", anim: "float" }, { sprite: "alien", adj: ["a2"], verb: "v2", adverb: "d1" }],
  },
  {
    id: "volcano-trip",
    title: "Field Trip to the Volcano",
    band: "3-5",
    bg: "volcano",
    blurb: "Whatever you do, don't feed the volcano.",
    template:
      "Our bus [verb-past@v1] up the side of Mount Grumblebelly. Ms. Kettle, our [adjective@a1] guide, told us to stay on the path. " +
      "\"This volcano is sleeping,\" she whispered. \"It only wakes up if you feed it [plural-noun@n1].\" " +
      "Of course, Dex had a bag full of [color@a2] [plural-noun@n2] in his backpack! He dropped one in, and the volcano [verb-past@v2]. " +
      "Then it [verb-past@v3] {a} [adjective@a3] [noun@n3] high into the sky. Everyone [verb-past@v4] [adverb@d1] back to the bus. " +
      "Best field trip ever!",
    cast: [{ sprite: "bus", verb: "v1" }, { sprite: "teacher", adj: ["a1"] }],
  },
  {
    id: "haunted-bakery",
    title: "The Haunted Bakery",
    band: "3-5",
    bg: "bakery",
    blurb: "The ghost here only wants to bake.",
    template:
      "Everyone says the bakery on Maple Street is haunted. But the ghost there is only {a} [adjective@a1] little ghost named Puff " +
      "who loves to bake. Every night, Puff [verb-past@v1] [adverb@d1] around the kitchen. Puff baked [number@c1] [plural-noun@n1] " +
      "and a cake shaped like {a} [noun:animal@n2]. In the morning, the baker found flour everywhere and a note: \"Sorry about the mess! " +
      "I was [verb-ing@v2]. Please leave me some [color@a2] [plural-noun:food@n3]. Love, Puff.\" " +
      "Now the baker leaves {a} [adjective@a3] snack out every night.",
    cast: [{ sprite: "ghost", adj: ["a1"], verb: "v1", adverb: "d1" }],
  },
  {
    id: "science-fair",
    title: "The Great Science Fair",
    band: "3-5",
    bg: "lab",
    blurb: "An invention that turns one thing into another.",
    template:
      "For the science fair, I invented a machine that turns [plural-noun@n1] into [plural-noun@n2]. " +
      "I built it from [number@c1] [adjective@a1] [plural-noun@n4] and some glue. When the judges arrived, I pressed the " +
      "[color@a2] button. The machine [verb-past@v1] [adverb@d1] and shook the whole gym! Then {a} [adjective@a3] " +
      "[noun:animal@n5] popped out and started [verb-ing@v2]. The judges gave me a ribbon that said \"Most [adjective@a4] Invention!\"",
    cast: [{ sprite: "robot", adj: ["a2"], verb: "v1", adverb: "d1" }],
  },

  /* ---------------------------------------------------------------- 6-8 */
  {
    id: "talent-show",
    title: "The Cafeteria Talent Show",
    band: "6-8",
    bg: "stage",
    blurb: "Juggling, singing and one very surprising pet.",
    template:
      "The cafeteria talent show was the [superlative@s1] event of the year. First, Coach Brick juggled [number@c1] [plural-noun@n1] " +
      "while standing [preposition@p1] a ladder. Then the lunch lady [verb-past@v1] to a song about pickles. " +
      "Next, my best friend Rina walked on stage with her pet [noun:animal@n3]. [pronoun-subject@r1] promised the act would be " +
      "[comparative@m1] than anything we had ever seen. The pet started to [verb@v2], and the crowd went wild. " +
      "The judges gave the trophy to [pronoun-object@r2] and {a} [adjective@a2] coupon for a free [noun:food@n4].",
    cast: [{ sprite: "chef", verb: "v1" }, { noun: "n3", verb: "v2", adj: ["m1"] }],
  },
  {
    id: "deep-sea-detective",
    title: "Deep-Sea Detective",
    band: "6-8",
    bg: "ocean",
    blurb: "Someone stole the Giant Pearl!",
    template:
      "Detective Shelly Snapper is the [superlative@s1] crab in the whole ocean. One morning, someone stole the Giant Pearl " +
      "from the Clam Museum! Shelly looked [preposition@p1] the seaweed and found {a} [color@a2] [noun@n1]. " +
      "\"Aha! This clue is [comparative@m1] than a sea cucumber's sock,\" [pronoun-subject@r1] said. She followed a trail of " +
      "[plural-noun@n2] to a cave, where {a} [adjective@a3] [noun:animal@n3] was [verb-ing@v1] with the pearl. " +
      "\"I just wanted to [verb@v2] with something shiny,\" it said. Shelly gave the pearl back to the museum and invited the thief " +
      "to join [pronoun-object@r2] for kelp snacks.",
    cast: [{ sprite: "crab", adj: ["s1"], anim: "walk" }],
  },
  {
    id: "missing-mascot",
    title: "The Mystery of the Missing Mascot",
    band: "6-8",
    bg: "school",
    blurb: "The pep rally starts in ten minutes. Where is Sir Hops-a-Lot?",
    template:
      "Our school mascot, {a} [adjective@a1] [noun:animal@n1] named Sir Hops-a-Lot, was missing! Principal Park checked " +
      "[preposition@p1] the bleachers. Coach Lee looked behind the [noun@n2]. I searched the art room, which was [comparative@m1] " +
      "than a jungle. Finally, I heard a noise: \"[sound@x1]!\" There was our mascot, [verb-ing@v1] on top of the [superlative@s1] " +
      "pile of [plural-noun@n3] I had ever seen. [pronoun-subject@r1] had been practicing for the pep rally all along. " +
      "We cheered so [adverb@d1] that the windows [verb-past@v2].",
    cast: [{ noun: "n1", adj: ["a1"], verb: "v1" }],
  },
  {
    id: "snow-day",
    title: "Snow Day Championship",
    band: "6-8",
    bg: "snow",
    blurb: "School is closed. The sledding race is on.",
    template:
      "When school closed for snow, the whole town held a sledding championship. My sled was made from an old [noun@n1], " +
      "and it was [comparative@m1] than a rocket. My rival, Tobias, rode {a} [adjective@a1] [noun@n2] down the hill. " +
      "Halfway down, we hit a bump and [verb-past@v1] [preposition@p1] a snowbank. [number@c1] [color@a2] [plural-noun@n3] " +
      "were watching from the trees, [verb-ing@v2] at us. Tobias and [pronoun-subject@r1] both won the prize: " +
      "a mug of the [superlative@s1] cocoa in town.",
    cast: [{ sprite: "kid", anim: "slide" }],
  },

  /* ---------------------------------------------------------------- 9-12 */
  {
    id: "dragon-interview",
    title: "The Dragon's Job Interview",
    band: "9-12",
    bg: "library",
    blurb: "A dragon applies to work at the Royal Library. What could go wrong?",
    template:
      "Ignatius the dragon needed a job, so he applied at the Royal Library. On the big day, he [vocab:walk-slow@v1] into the " +
      "interview room, careful not to set anything on fire. The librarian, Ms. Quill, peered at him over her [adjective@a1] glasses. " +
      "\"Our last helper was [vocab:confident-negative@a2],\" she said. \"Are you good with [plural-noun@n1]?\" Ignatius felt " +
      "[vocab:happy-strong@a3]. \"I am {a} [adjective@a4] [noun@n2] expert,\" he said, his voice [simile:quiet@m1]. " +
      "Just then, a stack of books began to [verb@v2]. Ignatius caught every one with his tail. Ms. Quill [vocab:laugh@v3]. " +
      "\"You're hired,\" she said. \"Start Monday, and please don't [verb@v4] the dictionaries.\"",
    cast: [{ sprite: "dragon", verb: "v1", adj: ["a3"] }, { sprite: "teacher", adj: ["a1"], verb: "v3" }],
  },
  {
    id: "rainforest-trip",
    title: "The Rainforest Road Trip",
    band: "9-12",
    bg: "jungle",
    blurb: "A family camper van, a muddy trail and something enormous in the trees.",
    template:
      "The Ortega family's camper van rumbled into the rainforest at dawn. The air smelled of rain and a sweet " +
      "[vocab:smell-good@n1]. Abuela, who was [vocab:old-positive@a1] and fearless, led the way down the trail. " +
      "A troop of [plural-noun@n2] swung overhead, [verb-ing@v1] [adverb@d1]. \"Look!\" little Mateo [vocab:shout@v2]. " +
      "\"{A} [color@a3] [noun:animal@n3]!\" It was [simile:big@m1], and it was [verb-ing@v3] on a branch. " +
      "By sunset the family was [vocab:tired@a4] but happy, and the camper van smelled faintly of [plural-noun@n4].",
    cast: [{ sprite: "car", anim: "drive" }, { sprite: "grandma", adj: ["a1"] }, { sprite: "kid", verb: "v2", adj: ["a4"] }],
  },
  {
    id: "robot-prom",
    title: "The Robot Prom Committee",
    band: "9-12",
    bg: "ballroom",
    blurb: "Planning a dance is hard when your circuits hate water.",
    template:
      "The robots of Gearville High were planning the [superlative@s1] prom in history. Chairbot Volta wanted a theme that was " +
      "[comparative@m1] than last year's \"Night of a Thousand [plural-noun@n1].\" \"What about an underwater disco?\" suggested " +
      "{a} [vocab:thin-positive@a1] robot named Twig. Volta [vocab:laugh@v1]. \"Too wet. Our circuits would [verb@v2].\" " +
      "In the end they chose \"A Galaxy of [color@a2] [plural-noun@n2].\" On prom night the dance floor glowed, the DJ played " +
      "[adjective@a3] music, and everyone danced [simile:dance@m2] until their batteries were [vocab:tired@a4].",
    cast: [{ sprite: "robot", verb: "v1", adj: ["m1"] }, { sprite: "robot", adj: ["a1"], verb: "v2" }],
  },
  {
    id: "mars-election",
    title: "Election Day on Mars",
    band: "9-12",
    bg: "mars",
    blurb: "The first class president of the Mars colony. Two candidates. One microphone.",
    template:
      "The colony on Mars was electing its first class president, and the race was [comparative@m1] than a dust storm. " +
      "Candidate one, Nova, promised {a} [adjective@a1] [noun@n1] in every lunchroom. Candidate two, Rex, promised that every " +
      "student could [verb@v1] during recess. At the big debate, Nova [vocab:speak-quiet@v2] her plan, while Rex [vocab:shout@v3] his. " +
      "The audience of [number@c1] [plural-noun@n2] grew [vocab:angry-strong@a2] when the microphone broke. Then a rover rolled in " +
      "carrying [plural-noun@n3], and everyone [vocab:eat-fast@v4] them. The vote was a tie, so Nova and Rex became co-presidents, " +
      "[simile:team@m2].",
    cast: [{ sprite: "astronaut", verb: "v2" }, { sprite: "alien", verb: "v3", adj: ["a2"] }],
  },
];

export function storyById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
