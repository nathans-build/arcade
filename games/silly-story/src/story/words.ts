/*
 * Silly Story Studio's built-in part-of-speech word list: a few thousand common kid words.
 * Base forms only (singular nouns, base verbs, plain adjectives); grammar.ts adds the endings
 * (-s/-es plurals, -ed past tense, -ing, -ly adverbs, -er/-est) and the irregular forms.
 * A word may be in several lists ("dance" is a noun and a verb).
 */

const list = (s: string) => s.trim().split(/\s+/).map((w) => w.replace(/_/g, " "));

export const NOUNS = new Set(list(`
  aardvark acorn acrobat actor adult adventure afternoon age air airplane airport alarm album alien alley alligator alphabet
  ambulance anchor angel animal ankle answer ant anteater antelope apartment ape apple apron aquarium arch arm armadillo armchair army
  arrow art artist astronaut athlete attic aunt author avocado award ax axe baby backpack backyard bacon badge badger bag bagel bakery
  ball ballerina balloon bamboo banana band bandage banjo bank bar barbecue barn baseball basement basket basketball bat bath bathtub
  battery beach bead beak bean beanbag bear beard beast beaver bed bedroom bee beetle bell belly belt bench berry bicycle bike bird
  birthday biscuit blanket blender blimp block blossom blouse blueberry boat body bone book bookcase boot bottle boulder bow bowl bowling
  box boy bracelet brain branch bread breakfast brick bridge broccoli broom brother brownie brush bubble bucket buffalo bug building bulb
  bulldozer bumblebee bun bunny burger burrito bus bush butter butterfly button cabbage cabin cactus cafe cafeteria cage cake calculator
  calendar calf camel camera camp campfire can candle candy cane canoe cap cape captain car card cardboard carnival carpet carrot cart
  castle cat caterpillar cave ceiling celery cereal chair chalk champion cheek cheese cheetah chef cherry chess chest chick chicken child
  chimney chimpanzee chin chip chipmunk chocolate circle circus city clam clarinet class classroom claw clay cliff clock closet cloud clown
  coach coat cobra coconut coin collar comb comet comic computer cone cookie cooler corn corner costume couch cousin cow cowboy coyote crab
  cracker crane crayon creature cricket crocodile crow crown crumb crust cucumber cup cupboard cupcake curtain cushion dad daisy dancer
  daughter day deer den dentist desert desk dessert detective diamond diary dinner dinosaur dirt disco dish doctor dog doll dollar dolphin
  donkey donut door doorbell dough doughnut dragon dragonfly drawer dream dress drink drum duck duckling dumpling dust eagle ear earmuff earth
  egg eggplant elbow elephant elevator elf elk emu engine envelope eraser eye eyebrow face fairy family fan farm farmer feather fence fern
  field finger fire firefighter firefly fireworks fish fishbowl flag flamingo flashlight flower flute fly foot football forest fork fort fountain
  fox friend fries frog frosting fruit fudge garage garden garlic gecko gem genie ghost giant gift giraffe girl glass glasses glitter globe
  glove glue goat goldfish golf goose gorilla grandma grandpa grape grapefruit grass grasshopper gravy guitar gum hair hairbrush ham hamburger
  hammer hammock hamster hand hat hawk head hedgehog helicopter helmet hen hero hill hippo hippopotamus hive hockey hole honey hood hoof hook
  horn horse hose hospital hotel house hula hummingbird hut ice iceberg igloo iguana island jacket jaguar jam jar jeans jellyfish jelly jet
  jewel juice kangaroo ketchup kettle key keyboard kid king kingdom kitchen kite kitten kitty knee knight knot koala ladder ladybug lake lamb
  lamp lantern laptop leaf lemon lemonade leopard lettuce library lighthouse lightning lime lion lip lizard llama lobster lollipop lunch
  lunchbox macaroni magic magician magnet mailbox man mango map maple marble marker marshmallow mask meadow meatball melon mermaid microphone
  microwave milk mirror mitten mole mom monkey monster moon moose mop mosquito moth motorcycle mountain mouse moustache mouth muffin mug museum
  mushroom music nacho nail napkin neck necklace nest net newspaper night ninja noodle nose notebook nugget nurse nut oatmeal ocean octopus
  office olive onion orange orangutan orchestra ostrich otter oven owl ox pail paint paintbrush pajamas palace pan pancake panda pants paper
  parade park parrot party pasta peach peacock peanut pear pebble pelican pen pencil penguin pepper person pet piano pickle picnic pie pig
  pigeon pillow pilot pineapple pirate pizza planet plant plate platypus playground plum pocket polar_bear pond pony popcorn porcupine potato
  present pretzel prince princess principal pudding puddle pumpkin puppet puppy purse puzzle quail queen quilt rabbit raccoon race racecar
  radio raft rain rainbow raincoat raisin rake raspberry rat raven recess refrigerator reindeer rhino rhinoceros ribbon rice river road
  robot rock rocket roller_coaster roof room rooster rope rose ruler sack sailboat sailor salad salamander salmon salsa sand sandal sandbox
  sandcastle sandwich sauce sausage saxophone scarecrow scarf school scientist scissors scooter scorpion seagull seal seashell seaweed seed
  shark sheep shell ship shirt shoe shorts shoulder shovel sidewalk singer sink sister skateboard skeleton ski skunk sky skyscraper sled
  slide slime sloth slug smoothie snack snail snake sneaker snow snowball snowflake snowman soap sock sofa soldier son soup spaceship spaghetti
  sparrow spider sponge spoon squash squid squirrel stadium stage stairs star starfish statue stew stick sticker stomach stone stool store
  storm strawberry street student submarine subway sugar suitcase sun sunflower sunglasses superhero supper surfboard sushi swan sweater
  swing sword syrup table taco tadpole tail tambourine tank tea teacher teapot teddy_bear teeth telephone telescope television tent
  tiger tire toad toast toaster toe tomato tongue tooth toothbrush toothpaste tornado tortilla tortoise toucan towel tower town toy tractor
  train trampoline treasure tree triangle trophy truck trumpet tuba tuna turkey turnip turtle tuxedo uncle unicorn universe umbrella vacuum
  valley van vase vegetable vest village violin volcano vulture waffle wagon walrus wand wardrobe watch water waterfall watermelon wave
  weasel whale wheel whistle wig window wing wizard wolf woman wombat woodpecker worm wrench xylophone yak yard yarn yogurt yo-yo zebra zipper zoo
  zookeeper zucchini ufo hot_dog ice_cream peanut_butter french_fry gumball jellybean cheeseburger cheesecake doughnut milkshake meatloaf
  noodle pudding tofu cupcake lasagna burrito quesadilla enchilada pancake omelet bagel croissant sundae popsicle cotton_candy candy_cane
  gummy_bear snowcone snow_cone bubblegum broccoli spinach kale beet radish pea peas corndog corn_dog hotdog
  idea joke secret surprise riddle song story poem dance game sport team trick wish plan mess noise smell sound voice laugh giggle hiccup
  sneeze burp shadow treasure clue mystery prize ribbon medal trophy contest show talent concert movie picture photo drawing painting
  homework lesson test quiz report project experiment invention machine gadget gizmo button lever switch battery wire bolt screw gear
  spring rocket_ship time minute hour week month year morning evening noon midnight weekend holiday vacation trip journey bus_stop
  aroma fragrance scent perfume bouquet odor stench whiff breeze gust thunder hail fog mist frost puddle rainstorm snowstorm blizzard
  sunshine sunrise sunset galaxy asteroid meteor nebula orbit crater moonbeam starlight comet spaceship rover satellite telescope astronaut
  lava magma ash ember geyser canyon boulder pebble crystal fossil mineral pyramid temple ruin jungle rainforest swamp marsh tundra
  prairie savanna glacier iceberg cliff cove harbor dock pier lagoon reef coral seahorse stingray narwhal manatee walrus eel clownfish
  pufferfish barnacle oyster pearl anchor submarine diver mermaid tide wave current kelp
  mascot bleachers gym locker hallway cafeteria auditorium principal janitor librarian nurse coach captain pep_rally banner trophy
  sled snowbank snowboard skis mitten earmuffs cocoa marshmallow fireplace chimney blanket igloo penguin polar_bear
  candidate president vote election debate speech podium colony dome microphone audience crowd
  prom disco ballroom dj theme circuit battery spark gear bolt tuxedo gown corsage
  library librarian dictionary encyclopedia shelf bookmark page chapter author poet novel
  van camper trail vine canopy troop toucan jaguar sloth frog lizard
  kingdom castle throne dungeon moat drawbridge tower knight jester dragon griffin goblin troll ogre elf pixie fairy gnome wizard witch
  sorcerer potion spell wand cauldron broomstick crystal_ball
  baker bakery oven flour dough batter frosting sprinkle sprinkles cookie croissant muffin pie tart scone loaf
  zoo zookeeper exhibit habitat enclosure safari
  volcano guide path field_trip backpack lunchbox
  cafeteria tray lunch_lady chili nugget tater_tot
  detective clue magnifying_glass footprint suspect thief culprit case
  farm barn tractor hay haystack scarecrow silo pasture pigpen coop
  stuff thing things something everything nothing anything
  pup doggy hound lioness grizzly piglet hog bull cattle stallion mare ram sparklehorn mammoth dino t-rex trex wyvern hare gerbil
  chimp orca serpent robin insect classmate cook royal emperor guard spaceman cosmonaut explorer judge granny grandmother grandfather
  abuela abuelo grandparent ranger heroine android bot chairbot martian extraterrestrial spirit phantom yeti bigfoot snowwoman merman
  merperson slice plantain icecream gelato flapjack crepe veggie cauliflower cheddar sub taxi jeep vehicle shuttle trolley locomotive
  yacht plane tricycle unicycle bathysphere saucer beanie sombrero slipper stocking parasol ukulele bongo kazoo pot tiara package
  teddy tulip home cottage crescent heart valentine love lightbulb phone tablet tv rubber_ducky lock timer
`));

export const VERBS = new Set(list(`
  act add admire agree aim allow amble answer appear applaud argue arrive ask attack bake balance bark bat bathe battle beat beg begin
  believe bellow bend bite blink blow boast boil bolt bonk boogie bounce bow bowl brag brake bark breathe bring brush bubble build bump burn
  burp burst buy buzz call calm camp carry cartwheel carve catch chant charge chase chat cheer chew chill chirp chomp chop chortle chuckle
  clap clean climb close collect color comb come cook cough count crawl crash creep croak crunch cry cuddle curl cut dance dangle dare dash
  dawdle decide deliver devour dig dine dip dive do doodle doze drag draw dream dress dribble drift drink drip drive drop drum dunk dust
  eat echo enjoy escape explode explore fall fan fart feed feel fetch fidget fight fill find fish fix flap flash flee flick fling flip
  flip-flop float flop flow flutter fly fold follow forget freeze frown fry gallop gargle gasp gaze get giggle give glide glow gnaw go
  gobble grab grin grip groan grow growl grumble grunt guess gulp gurgle hammer hang happen hatch have hear help hide hike hiss hit hold
  holler honk hop hope hover howl hug hula hum hunt hurry imagine inhale invent itch jog join joke juggle jump keep kick kiss knit knock
  know land laugh lead leap learn leave lick lie lift like limp listen live look lose love lumber make march meander meow mix moan moo
  moonwalk mope mosey mow mumble munch murmur mutter nap nibble nod notice obey open order paddle paint pant parachute pat pause peck peek
  peel pet pick pinch play plod plop plunge point poke polish pop pounce pour pout practice prance pray pretend print promise pull pump
  punt purr push put quack question quit race rain rattle reach read relax remember repeat rescue rest ride ring rip roar roast rock roll
  rotate row rub run rush sail salute saunter save say scamper scarf scoot scrape scratch scream scrub scurry search see sell send serve
  shake share shatter shimmy shine shiver shoot shop shout shove show shriek shrink shrug shuffle sigh sing sink sip sit skate skateboard
  ski skip slam sled sleep slide slip slither slurp smash smell smile snap snatch sneak sneeze sniff snicker snore snort snowboard snuggle
  soar sob somersault sparkle speak spell spill spin spit splash split spray sprint sprout squawk squeak squeal squeeze squirm squish stack
  stagger stamp stand stare start steal step stick sting stir stomp stop stretch stroll strum strut study stumble surf swat sway sweep
  swim swing swirl swish swoop tackle take talk tap taste teach tease tell thank think throw thump tickle tiptoe titter toast toss totter
  touch trace trade travel trip trot trudge try tug tumble turn twinkle twirl twist type unpack vanish vote waddle wag wait wake walk wander
  want warn wash watch water wave whack wheeze whimper whine whirl whisper whistle wiggle win wink wish wobble wonder work worry wrap
  wrestle write yawn yell yodel yowl zap zigzag zip zoom be fit flail gallop gather glare greet hiccup howl jiggle jingle kayak leap
  lounge mew neigh oink pedal plunk ponder prowl quiver rumble saunter scoff scramble scuttle shimmer sizzle skitter slouch sniffle snooze
  splatter sputter squat stammer stride stutter sulk swagger swallow swerve teeter thunder toddle topple trample tremble trickle twitch
  vroom waltz warble wade weave whiz whoop wince wolf wriggle yap yelp zipline inhale scarf gulp wolf devour gobble breathe bawl boom
  hush exclaim rule wonder tango salsa twerk jitterbug breakdance tap-dance hip-hop limbo conga cha-cha disco moonwalk headbang
`));

export const ADJECTIVES = new Set(list(`
  able active adorable adventurous afraid aggressive agreeable alert alive amazing ancient angry annoyed annoying anxious arrogant
  ashamed attractive average awesome awful awkward bad bald bashful beautiful best better big bitter bizarre black bland blank blind
  blond blue blushing bold bony boring bossy bouncy brainy brave breezy bright brilliant broad broken brown bubbly bumpy busy calm
  careful careless cautious charming cheap cheerful cheeky cheesy chewy chilly chubby chunky classic clean clear clever cloudy clumsy
  cocky colorful colossal comfortable confused conceited cool cooperative courageous cozy crabby cranky crazy creamy creepy crispy
  crooked crowded cruel crunchy cuddly curious curly cute damp dangerous daring dark dazzling dead deep delicate delicious delighted
  delightful determined different difficult dirty disheveled dizzy dramatic drained dreamy dreary drowsy dry dull dusty eager early
  easy economical ecstatic eerie elastic elated elegant embarrassed empty enchanted energetic enormous enthusiastic evil excellent
  excited exhausted expensive experienced exuberant fabulous faint fair faithful famous fancy fantastic far fast fat fatigued fearless
  feathery feisty fierce filthy fine fiery firm fizzy flaky flat flexible floppy fluffy fluttering foggy foolish fragile frail frantic
  free fresh friendly frightened frosty frozen frugal fruity fuming funny furious furry fuzzy gargantuan gentle giant giddy gigantic
  gigglish glad gleaming glittery gloomy glorious glossy glowing gooey good goofy gorgeous graceful grand grateful greasy great greedy
  green grimy grouchy grumpy gummy hairy handsome happy hard harsh hasty healthy heavy helpful helpless hilarious hollow homely honest
  hopeful horrible hot huge humble humongous hungry hurt icy ideal immense important impossible incredible innocent intelligent
  interesting invisible irate itchy jealous jittery jolly jubilant juicy jumbo jumpy kind large late lazy lean leafy light likable
  little lively livid lonely long loose loud lovely low loyal lucky lumpy magical magnificent majestic mammoth massive mean meek
  melodic merry messy mighty miniature minty mischievous miserable modern moist moldy muddy mushy musical mysterious narrow nasty
  natural naughty nervous new nice nimble noisy normal nosy nutty obedient odd old orange outrageous overjoyed pale perfect perky
  persistent petite pink plain playful pleasant plump pointy polite poor popular powerful precious pretty prickly proud prying puffy
  purple puzzled quick quiet quirky radiant ragged rainy rapid rare raw ready real red regal relaxed resolute rich ridiculous rigid
  ripe roaring rotten rough round rowdy royal rubbery rude rumpled rusty sad safe salty sandy sassy scaly scared scary scrawny
  scruffy seasoned secret seething selfish serious shaggy shaky shallow sharp shiny short shy sick silent silky silly simple skinny
  sleepy slender slim slimy slippery slow small smart smelly smiley smooth smug snappy sneaky snobbish snoopy snowy soft soggy solid
  sore sour sparkling sparkly speedy spicy spiky splendid spooky spotted spotless squeaky squishy stale steady steep sticky stiff
  stingy stinky stormy strange striped strong stubborn stupendous sturdy sunny super superb surprised suspicious svelte sweaty
  sweet swift tall tame tangy tart tasty tenacious tender tense terrible terrific thankful thick thin thirsty thoughtful thrifty
  thrilled thundering ticklish tidy tight timeless tiny tired toasty tough towering tremendous tricky triumphant troubled ugly unkempt
  unique untidy unusual upbeat upset upside-down useful vast velvety venerable victorious vintage violet vivid wacky warm wasteful
  weary weird wet whimsical white wicked wide wiggly wild willowy windy wise witty wobbly wonderful wooden woolly worried worn-out
  wrinkly yellow young yummy zany zesty zigzag zippy chaotic cluttered disorderly distinguished sapped spent fragrant smelly aromatic
  boastful pigheaded haughty bratty clingy pushy reckless timid fearful dainty glamorous shimmering glittering sparkling twinkly
  rainbow polka-dot spotty stripy checkered plaid fluffy feathered scaly slimy squishy bumpy lumpy jiggly jelly-like bouncy rubbery
  elastic magnetic electric robotic metallic golden silver bronze wooden plastic glass frosted sugary sour bitter spicy cheesy buttery
  crunchy toasted burnt frozen melted mushy gooey ghostly see-through transparent invisible faded hot cold warm cool freezing boiling
  steamy fiery flaming burning icy snowy chilly sunny gloomy stormy noisy loud quiet silent musical singing dancing flying tiny teeny
  teensy itty-bitty wee small little mini miniature big large huge giant gigantic enormous massive humongous colossal jumbo mega
  tall long short skinny chunky round square pointy fuzzy hairy furry woolly shaggy bald shiny glossy gleaming sparkly glittery
  glowing radiant dazzling magical enchanted royal fancy elegant cool awesome radical groovy funky stinky smelly fragrant spotted striped
  upside-down backwards sideways inside-out happy sad grumpy angry silly goofy sleepy tired drowsy wet soggy damp dry speedy fast slow
  lazy wobbly wiggly shaky jittery brave scared proud shy bossy friendly helpful clumsy hungry thirsty sick healthy strong weak
  powerful mighty curious nosy old new ancient young modern fresh rotten stale moldy dusty dirty clean muddy sticky slippery
  joyful enraged outraged mad sleek confident
  greasy oily juicy tasty yummy delicious disgusting gross icky slimy
`));

/** Words that are usually adverbs without an -ly ending (plus a few common -ly ones grammar.ts can't derive). */
export const ADVERBS = new Set(list(`
  fast hard well soon very too always never often sometimes rarely seldom usually again almost already also away back
  backward backwards forward forwards down up everywhere nowhere somewhere anywhere here there inside outside indoors outdoors
  upstairs downstairs today tomorrow yesterday tonight now then later early late still yet quite rather really just even only
  maybe perhaps once twice together apart alone instead anyway else soon straight sideways upside-down loud slow quick
  far near nearby high low deep wide right wrong first last next home abroad overhead underground underwater ahead behind
`));

export const COLORS = new Set(list(`
  red orange yellow green blue purple pink brown black white gray grey gold golden silver violet indigo turquoise teal aqua cyan
  magenta lavender lilac maroon navy beige tan crimson scarlet lime mint peach coral rainbow neon olive ivory cream ruby emerald
  sapphire amber copper bronze plum rose sky-blue hot-pink lemon
`));

export const NUMBER_WORDS = new Map<string, number>([
  ["zero", 0], ["one", 1], ["two", 2], ["three", 3], ["four", 4], ["five", 5], ["six", 6], ["seven", 7], ["eight", 8], ["nine", 9],
  ["ten", 10], ["eleven", 11], ["twelve", 12], ["thirteen", 13], ["fourteen", 14], ["fifteen", 15], ["sixteen", 16],
  ["seventeen", 17], ["eighteen", 18], ["nineteen", 19], ["twenty", 20], ["thirty", 30], ["forty", 40], ["fifty", 50],
  ["sixty", 60], ["seventy", 70], ["eighty", 80], ["ninety", 90], ["hundred", 100], ["thousand", 1000], ["million", 1e6],
  ["billion", 1e9], ["trillion", 1e12], ["zillion", 1e15], ["gazillion", 1e18], ["bajillion", 1e15], ["kajillion", 1e15],
  ["dozen", 12], ["a dozen", 12], ["a hundred", 100], ["a million", 1e6], ["a zillion", 1e15], ["a gazillion", 1e18],
  ["a thousand", 1000], ["a billion", 1e9], ["a few", 3], ["a couple", 2], ["several", 4], ["many", 7], ["lots", 9], ["no", 0],
]);

export const SUBJECT_PRONOUNS = new Set(["i", "you", "he", "she", "it", "we", "they"]);
export const OBJECT_PRONOUNS = new Set(["me", "you", "him", "her", "it", "us", "them"]);
export const POSSESSIVE_PRONOUNS = new Set(["my", "your", "his", "her", "its", "our", "their", "mine", "yours", "hers", "ours", "theirs"]);
export const OTHER_PRONOUNS = new Set(list(`
  myself yourself himself herself itself ourselves yourselves themselves someone somebody everyone everybody anyone anybody
  nobody no_one something everything anything nothing who whom whose which what this that these those each all both
`));

export const PREPOSITIONS = new Set(list(`
  about above across after against along alongside amid among around at atop before behind below beneath beside besides between
  beyond by down during except for from in inside into near next_to of off on onto opposite out outside over past through
  throughout to toward towards under underneath until up upon with within without aboard round via like on_top_of in_front_of
  across_from near_to out_of inside_of
`));

export const CONJUNCTIONS = new Set(list(`and but or nor so yet because although though while if unless since when whenever after before`));
export const DETERMINERS = new Set(list(`a an the this that these those some any every each no`));

/** Interjections and sound words (the "silly sound" blank accepts anything, but these are known). */
export const SOUNDS = new Set(list(`
  boing splat kaboom whoosh wow oops yikes hooray achoo honk zoink zoinks yippee eek ouch bam pow kapow ka-pow zap ding dong bonk moo oink
  quack woof meow splash crash boom ha haha yay uh-oh phew whee wheee ahem aha bang beep blam bloop boop brr burp buzz clang clank
  click clonk cock-a-doodle-doo crunch ding-dong drip fizz gasp glug gulp hiccup hmm huh kerplunk kersplat kerplop mmm nom oof
  oh ooh ow plop poof pop psst ribbit shh sizzle smack snap splish splosh squeak squish swoosh thud thump tweet uh vroom wham whoa
  whomp yahoo yeehaw yowza yum zing zoom bzzt honk-honk toot tada ta-da woo-hoo woohoo hurray hey hi hello bye goodbye wahoo gadzooks
  crikey golly gosh gee jeepers wowza bravo cowabunga
`));

/** Irregular past tenses → base verb. */
export const IRREGULAR_PAST: Record<string, string> = {
  ate: "eat", awoke: "wake", was: "be", were: "be", became: "become", began: "begin", bent: "bend", bit: "bite", blew: "blow",
  broke: "break", brought: "bring", built: "build", burnt: "burn", bought: "buy", caught: "catch", chose: "choose", came: "come",
  crept: "creep", cut: "cut", dealt: "deal", dug: "dig", did: "do", drew: "draw", dreamt: "dream", drank: "drink", drove: "drive",
  fell: "fall", fed: "feed", felt: "feel", fought: "fight", found: "find", fled: "flee", flung: "fling", flew: "fly", forgot: "forget",
  froze: "freeze", got: "get", gave: "give", went: "go", grew: "grow", hung: "hang", had: "have", heard: "hear", hid: "hide", hit: "hit",
  held: "hold", hurt: "hurt", kept: "keep", knelt: "kneel", knew: "know", laid: "lay", led: "lead", leapt: "leap", left: "leave",
  lent: "lend", let: "let", lay: "lie", lit: "light", lost: "lose", made: "make", meant: "mean", met: "meet", paid: "pay", put: "put",
  quit: "quit", read: "read", rode: "ride", rang: "ring", rose: "rise", ran: "run", said: "say", saw: "see", sold: "sell", sent: "send",
  set: "set", shook: "shake", shone: "shine", shot: "shoot", shrank: "shrink", shut: "shut", sang: "sing", sank: "sink", sat: "sit",
  slept: "sleep", slid: "slide", slung: "sling", smelt: "smell", spoke: "speak", sped: "speed", spent: "spend", spilt: "spill", spun: "spin",
  spat: "spit", split: "split", sprang: "spring", stood: "stand", stole: "steal", stuck: "stick", stung: "sting", strode: "stride",
  struck: "strike", swore: "swear", swept: "sweep", swam: "swim", swung: "swing", took: "take", taught: "teach", tore: "tear",
  told: "tell", thought: "think", threw: "throw", understood: "understand", woke: "wake", wore: "wear", wove: "weave", wept: "weep",
  won: "win", wound: "wind", wrote: "write", dove: "dive", lit_up: "light", slunk: "slink", strove: "strive", trod: "tread",
};

/** Irregular plurals → singular. */
export const IRREGULAR_PLURAL: Record<string, string> = {
  mice: "mouse", geese: "goose", children: "child", teeth: "tooth", feet: "foot", people: "person", men: "man", women: "woman",
  oxen: "ox", dice: "die", cacti: "cactus", fungi: "fungus", octopi: "octopus", knives: "knife", wives: "wife", lives: "life",
  leaves: "leaf", loaves: "loaf", wolves: "wolf", halves: "half", calves: "calf", elves: "elf", shelves: "shelf", scarves: "scarf",
  thieves: "thief", hooves: "hoof", potatoes: "potato", tomatoes: "tomato", heroes: "hero", volcanoes: "volcano", mosquitoes: "mosquito",
  echoes: "echo", dominoes: "domino", buffaloes: "buffalo", tornadoes: "tornado",
};

/** Nouns whose plural is the same word. */
export const SAME_PLURAL = new Set(["sheep", "fish", "deer", "moose", "salmon", "trout", "shrimp", "bison", "squid", "aircraft", "spacecraft", "series", "species", "tuna", "cod"]);

/** Nouns that are always plural. */
export const PLURAL_ONLY = new Set(["pants", "jeans", "scissors", "glasses", "sunglasses", "pajamas", "shorts", "fries", "sprinkles", "bleachers", "earmuffs", "skis", "peas", "fireworks", "things"]);

/** Irregular comparatives/superlatives → base. */
export const IRREGULAR_COMPARE: Record<string, { base: string; kind: "comp" | "sup" }> = {
  better: { base: "good", kind: "comp" }, best: { base: "good", kind: "sup" }, worse: { base: "bad", kind: "comp" },
  worst: { base: "bad", kind: "sup" }, farther: { base: "far", kind: "comp" }, farthest: { base: "far", kind: "sup" },
  further: { base: "far", kind: "comp" }, furthest: { base: "far", kind: "sup" }, less: { base: "little", kind: "comp" },
  least: { base: "little", kind: "sup" }, more: { base: "many", kind: "comp" }, most: { base: "many", kind: "sup" },
  elder: { base: "old", kind: "comp" }, eldest: { base: "old", kind: "sup" },
};
