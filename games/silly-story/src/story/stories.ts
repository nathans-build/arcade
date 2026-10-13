/*
 * The built-in stories: all original, silly and kid-safe. Each has a grade band and a length
 * (Short / Medium / Long; the limits per band are in length.ts).
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
    length: "short",
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
    length: "short",
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
    length: "short",
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
    length: "short",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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
    length: "medium",
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

  /* ================================================================ more stories, including longer ones
   * Medium stories for K-2 (still picture cards), and Short/Long choices for the older bands.
   * Long stories come in paragraphs ("\n\n").
   */

  /* ---------------------------------------------------------------- K-2 (Medium) */
  {
    id: "bubble-bath",
    title: "The Bubble Bath Surprise",
    band: "K-2",
    length: "medium",
    bg: "bathroom",
    blurb: "Bath time gets very bubbly, very fast.",
    template:
      "It was bath time, and the tub was full of [color@a1] bubbles. I brought my rubber duck and {a} [adjective@a2] [noun:animal@n1] made of soap. " +
      "When I squeezed the duck, it began to [verb@v1]! Then [number@c1] [noun:thing+s@n2] popped up out of the bubbles.\n\n" +
      "\"Let's [verb@v2]!\" said the duck. We splashed so much that Mom came in holding {a} [noun:food@n3]. \"What is going on in here?\" she asked. " +
      "The duck said, \"We are having {a} [adjective@a3] bath party!\" Mom laughed and began to [verb@v3] too. " +
      "The bubbles turned [color@a4] and floated all the way to the [noun:place@n4].",
    cast: [{ sprite: "rubberduck", verb: "v1" }],
  },
  {
    id: "camping-stars",
    title: "Camping Under the Stars",
    band: "K-2",
    length: "medium",
    bg: "campsite",
    blurb: "A tent, a campfire and a surprise visitor.",
    template:
      "Grandpa and I went camping in the woods. We set up {a} [color@a1] tent next to a big tree. " +
      "For dinner we cooked [number@c1] [noun:food+s@n1] over the campfire. Yum!\n\n" +
      "Then we heard a noise. Out of the bushes came {a} [adjective@a2] [noun:animal@n2]! It wanted to [verb@v1] with us. " +
      "Grandpa gave it {a} [noun:food@n3], and it was very [adjective@a3]. We all sang songs and began to [verb@v2].\n\n" +
      "When the moon came up, I saw {a} [noun:thing@n4] in the sky. Grandpa said, \"That is the [adjective@a4] star!\" " +
      "I fell asleep and dreamed I could [verb@v3].",
    cast: [{ sprite: "grandma", anim: "wave" }, { sprite: "tent", adj: ["a1"] }],
  },

  /* ---------------------------------------------------------------- 3-5 (Short, Long, Long) */
  {
    id: "talking-lunchbox",
    title: "The Lunchbox That Talked",
    band: "3-5",
    length: "short",
    bg: "school",
    blurb: "A quick one: lunch has a lot to say today.",
    template:
      "When I opened my lunchbox, it said, \"Good morning!\" in {a} [adjective@a1] voice. Inside were [number@c1] [plural-noun:food@n1] " +
      "and a note from my [noun:person@n2]. The lunchbox [verb-past@v1] [adverb@d1] across the table and asked to trade for {a} [noun@n3]. " +
      "My friends started [verb-ing@v2]. Now my lunchbox sits with us every day, and it is the most [adjective@a2] member of our class.",
    cast: [{ sprite: "backpack", adj: ["a1"], verb: "v1", adverb: "d1" }],
  },
  {
    id: "pirate-picnic",
    title: "The Pirate Picnic",
    band: "3-5",
    length: "long",
    bg: "island",
    blurb: "A long one: a picnic basket, a sneaky crab and a very odd treasure.",
    template:
      "Captain Pickles was the [adjective@a1] pirate on the seven seas. One sunny morning, she [verb-past@v1] onto Coconut Island " +
      "with a picnic basket full of [plural-noun:food@n1]. Her parrot, Squawk, flew [adverb@d1] overhead.\n\n" +
      "\"Arr! Let's eat!\" she shouted. But when she opened the basket, [number@c1] [color@a2] [plural-noun:animal@n2] jumped out " +
      "and started [verb-ing@v2] on the sand. Then {a} [adjective@a3] crab [verb-past@v3] the last [noun:food@n3]!\n\n" +
      "Captain Pickles was not angry. She dug up her treasure chest, but instead of gold it was full of [plural-noun@n4]. " +
      "\"Even better,\" she said. The whole crew [verb-past@v4] until sunset, and the crab got to wear the captain's [noun:thing@n5]. " +
      "It was the most [adjective@a4] picnic in pirate history.",
    cast: [{ sprite: "pirate", adj: ["a1"], verb: "v1" }, { sprite: "bird", adverb: "d1", anim: "fly" }, { sprite: "crab", adj: ["a3"], verb: "v3" }],
  },
  {
    id: "museum-sleepover",
    title: "The Museum Sleepover",
    band: "3-5",
    length: "long",
    bg: "museum",
    blurb: "A long one: the dinosaur skeleton doesn't stay still at night.",
    template:
      "Our class got to sleep over at the Museum of Very Old Stuff. Mr. Fossil, the night guard, gave each of us {a} [adjective@a1] flashlight " +
      "and [number@c1] [plural-noun:food@n1] for a snack. We rolled out our sleeping bags right under the giant dinosaur skeleton.\n\n" +
      "At midnight, I heard {a} [adjective@a2] noise. The dinosaur [verb-past@v1] its tail and [verb-past@v2] [adverb@d1] down from its stand! " +
      "It was looking for {a} [noun@n2] to play with. Behind it, the [color@a3] statue of {a} [noun:animal@n3] started [verb-ing@v3]. " +
      "Then a suit of armor [verb-past@v5] across the hall.\n\n" +
      "Everybody woke up. We taught the dinosaur how to [verb@v4], and it taught us how to roar. By morning, everything was back in place, " +
      "except for one thing: the dinosaur was wearing my [noun:thing@n4], and it looked very [adjective@a4].",
    cast: [{ sprite: "dinosaur", verb: "v2", adverb: "d1" }, { sprite: "knight", verb: "v5" }],
  },

  /* ---------------------------------------------------------------- 6-8 (Short, Long, Long) */
  {
    id: "overdue-book",
    title: "The Overdue Library Book",
    band: "6-8",
    length: "short",
    bg: "library",
    blurb: "A quick one: this book is twenty-five years late.",
    template:
      "My library book was due back in 1999. Grandpa had hidden it [preposition@p1] the couch for twenty-five years. " +
      "When I returned it, the librarian gasped, \"[sound@x1]!\" [pronoun-subject@r1] said the fine was [comparative@m1] than a mountain of " +
      "[plural-noun@n1]. Then she laughed and said I could pay it by reading to the library's pet [noun:animal@n2] every Saturday. " +
      "Now it is the [superlative@s1] reader in town, and it [verb-past@v1] through every book on the shelf.",
    cast: [{ sprite: "teacher", anim: "laugh" }, { noun: "n2", adj: ["s1"], verb: "v1" }, { sprite: "book", anim: "float" }],
  },
  {
    id: "time-machine",
    title: "The Time Machine Project",
    band: "6-8",
    length: "long",
    bg: "lab",
    blurb: "A long one: a science fair, a dinosaur and the year 3000.",
    template:
      "For the science fair, my lab partner Dev and I built a time machine out of {a} [noun@n1], two hair dryers and [number@c1] [plural-noun@n2]. " +
      "It was [comparative@m1] than a refrigerator and smelled like burnt toast. Ms. Ortiz, our science teacher, looked at it [adverb@d1]. " +
      "[pronoun-subject@r1] asked, \"Does it work?\"\n\n" +
      "Dev pressed the big [color@a1] button. [sound@x1]! Suddenly we were standing [preposition@p1] a giant fern in the age of the dinosaurs. " +
      "{A} [adjective@a2] [noun:animal@n3] was [verb-ing@v1] next to a volcano, and it did not look friendly. " +
      "\"Quick, hand [pronoun-object@r2] the remote!\" Dev yelled.\n\n" +
      "I twisted the dial too far. Next we landed in the year 3000, where robots [verb-past@v2] in the streets and everyone ate " +
      "[plural-noun@n4] for breakfast. One robot gave us the [superlative@s1] souvenir ever: {a} [adjective@a3] [noun@n5].\n\n" +
      "We zoomed back just in time for judging. Our machine [verb-past@v3] once, sparked twice and fell apart. We got second place. " +
      "First place went to a potato battery. Science is [adjective@a4].",
    cast: [{ sprite: "robot", adj: ["m1"], verb: "v3" }, { sprite: "teacher", adverb: "d1", anim: "think" }, { sprite: "kid", anim: "jump" }],
  },
  {
    id: "robot-referee",
    title: "The Robot Referee",
    band: "6-8",
    length: "long",
    bg: "stadium",
    blurb: "A long one: the new soccer referee runs on batteries.",
    template:
      "The Wobbleton Wombats had not won a soccer game in [number@c1] years. This season, the league replaced the human referee with " +
      "RefBot 5000, a robot that was [comparative@m1] than a vending machine and twice as loud.\n\n" +
      "In the first minute, RefBot blew its whistle and shouted, \"[sound@x1]! Foul on the [noun:animal@n1]!\" Nobody knew what it meant. " +
      "Then it gave a yellow card to {a} [noun@n2] that was just sitting [preposition@p1] the bench.\n\n" +
      "Our goalie, Priya, was the [superlative@s1] player on the team. When the other team kicked the ball, [pronoun-subject@r1] " +
      "[verb-past@v1] [adverb@d1] and caught it with one hand. The crowd [verb-past@v2]. Even our mascot, {a} [adjective@a1] " +
      "[noun:animal@n3] in {a} [color@a2] costume, started [verb-ing@v3].\n\n" +
      "With ten seconds left, RefBot's batteries ran low. It began to [verb@v4] in circles and called a penalty on the snack bar for selling " +
      "[adjective@a3] [plural-noun@n4]. Our striker took the penalty kick, and the ball flew past the goalie and into the [noun:place@n5]. " +
      "Goal! The Wombats won, and RefBot handed the trophy to [pronoun-object@r2], then gave everyone in the stands a free [noun:food@n6].",
    cast: [{ sprite: "robot", adj: ["m1"], verb: "v4" }, { sprite: "kid", adj: ["s1"], verb: "v1", adverb: "d1" }, { sprite: "ball", anim: "jump" }],
  },

  /* ---------------------------------------------------------------- 9-12 (Long, Long) */
  {
    id: "food-truck-rivalry",
    title: "The Food Truck Rivalry",
    band: "9-12",
    length: "long",
    bg: "market",
    blurb: "A long one: two food trucks, one parking spot and a terrible secret ingredient.",
    template:
      "On Maple Avenue, two food trucks parked side by side every Saturday. Abuela Rosa's Taco Wagon served [plural-noun@n1] so " +
      "[vocab:tasty@a1] that people lined up around the block. Across the street, Chef Brock's Burger Blaster served burgers that were, " +
      "honestly, [adjective@a2].\n\n" +
      "Chef Brock was [vocab:confident-negative@a3]. \"My burgers are [comparative@m1] than anything on this street!\" he " +
      "[vocab:shout@v1] through a megaphone. Abuela Rosa just [vocab:laugh@v2] and kept flipping tortillas, [simile:fast@m2].\n\n" +
      "Then Brock tried a new secret ingredient: [plural-noun@n2]. {A} [vocab:smell-bad@n3] drifted down the block. A pigeon fainted. " +
      "Customers [vocab:run-fast@v3] to the Taco Wagon, where Rosa handed out [number@c1] free [plural-noun:food@n4] while the line grew " +
      "[simile:big@m3].\n\n" +
      "By sunset, Brock was [vocab:angry-strong@a4], then [vocab:tired@a5], then just sad. Rosa walked over with a plate of her famous " +
      "[noun:food@n5]. He [vocab:eat-fast@v4] it in four bites. \"Teach me,\" he [vocab:speak-quiet@v5]. Now the two trucks share one " +
      "parking spot and one name: the Taco Blaster. Business is [adverb@d1] booming.",
    cast: [{ sprite: "grandma", verb: "v2" }, { sprite: "chef", adj: ["a3"], verb: "v1" }, { sprite: "truck", anim: "bob" }],
  },
  {
    id: "lighthouse-week",
    title: "The Lighthouse Keeper's Week",
    band: "9-12",
    length: "long",
    bg: "lighthouse",
    blurb: "A long one: a quiet summer job that is not quiet at all.",
    template:
      "Marisol took the summer job at Gull Point Lighthouse because the ad promised \"peace, quiet and ocean views.\" The previous keeper, " +
      "{a} [vocab:old-positive@a1] sailor named Captain Finch, handed her the keys and a list of rules. Rule one: never let the light go out. " +
      "Rule two: never feed anything that knocks.\n\n" +
      "On Monday, a fog rolled in [simile:quiet@m1]. Marisol climbed all [number@c1] steps and [vocab:walk-slow@v1] back down, " +
      "[vocab:tired@a2]. On Tuesday, {a} [adjective@a3] [noun:animal@n2] knocked on the door, [verb-ing@v2] [adverb@d1] and demanding " +
      "breakfast. Marisol felt sorry for it and gave it a bowl of [plural-noun@n3]. That was a mistake.\n\n" +
      "By Wednesday there were [number@c2] of them, and they had invited their cousins, the [plural-noun@n4]. The guests " +
      "[vocab:eat-fast@v3] everything in the pantry, including the [noun@n6].\n\n" +
      "On Thursday, a storm hit. Waves crashed [simile:loud@m2] against the rocks, and the light flickered. Marisol [vocab:shout@v4] for help. " +
      "To her surprise, the animals formed a line and passed buckets up the stairs, working together [simile:team@m3]. The light stayed on.\n\n" +
      "When Captain Finch returned on Friday, he found the lighthouse spotless and Marisol [vocab:happy-strong@a4]. \"I see you broke rule two,\" " +
      "he said, raising {a} [color@a5] eyebrow. \"Good. Rule two was a test.\"",
    cast: [{ sprite: "zookeeper", adj: ["a4"], verb: "v4" }, { sprite: "pirate", adj: ["a1"], anim: "wave" }],
  },
  {
    id: "pet-rock-audition",
    title: "The Pet Rock's Big Audition",
    band: "9-12",
    length: "short",
    bg: "stage",
    blurb: "A quick one: a very old rock wants to be a star.",
    template:
      "My pet rock, Gerald, auditioned for the school musical. He is {a} [vocab:old-positive@a1] rock, millions of years old, and frankly " +
      "[vocab:confident-negative@a2]. When the music started, Gerald sat there [simile:quiet@m1]. The director [vocab:speak-quiet@v1], " +
      "\"Is he doing anything?\" I explained that Gerald was [verb-ing@v2] on the inside. She cast him as {a} [noun@n1] in the second act. " +
      "On opening night, the audience [vocab:laugh@v3] so hard that Gerald got [number@c1] standing ovations. " +
      "He is now [vocab:happy-strong@a3], though you would never know it.",
    cast: [{ sprite: "rock", adj: ["a1"], anim: "bob" }, { sprite: "teacher", verb: "v1" }],
  },
];

export function storyById(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id);
}
