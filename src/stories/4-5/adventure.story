title: The Last Ember of Cinder Peak
author: SpiderBen10's Arcade
genre: adventure
band: 4-5
cover: mountain-pass
blurb: The village's magic flame is fading fast. Climb Cinder Peak with a tiny dragon and light it before the snow!
start: start

# ============================================================
# CHAPTER 1: The Smallest Dragon
# ============================================================

=== start
scene: village
cast: hero, quill, mayor:sad
checkpoint
~ Chapter One ~

In the mountain village of Brambleford, the Great Lantern has kept everyone warm through every winter for a hundred years. But tonight, Mayor Oakes holds up a glass jar, and the ember inside is barely glowing.

Mayor: The Hearth Ember is fading, and the first snow will fall tomorrow at sunset. Only a dragon can wake it again, at the Sunfire Stone on top of Cinder Peak.

Behind the well, something small sneezes a puff of gray smoke.
> Peek behind the well -> sizzle
> Read the old legend first -> legend

=== legend
scene: village
cast: hero, quill:thinking, mayor
The Mayor unrolls a crinkly old scroll, and Quill reads it out loud in her best storytelling voice.

"When the Hearth Ember grows dim, carry it to the Sunfire Stone upon Cinder Peak. A dragon's breath will wake the Stone, and its fire will illuminate the land once more."

Quill: Illuminate is a wonderful word! Its root, lum, comes from the Latin word for light. You can find the same root in luminous, which means glowing.
? L.4 : Using the root "lum," what does "illuminate" most likely mean?
+ to fill something with light
- to cover something with snow
- to make something very loud
- to put something to sleep
hint: Quill says the root "lum" comes from the Latin word for light.
next: sizzle

=== sizzle
scene: village
cast: hero, quill, dragon:sad
Behind the well hides a dragon no bigger than a beagle. Her scales are the color of pumpkins, and her wings are as small as maple leaves.

Dragon: I'm Sizzle, the only dragon in Brambleford, and the smallest dragon in the whole valley. When I try to breathe fire, all I get is a hiccup of smoke. I'd just mess everything up.

Quill: Nonsense. Nobody is too small to try.

Sizzle peeks out from behind her wing, not quite sure.
? RL.3 : Which word best describes how Sizzle feels about herself at the start?
+ unsure
- boastful
- sleepy
- furious
hint: Reread what Sizzle says: "I'd just mess everything up." Does she believe in herself?
next: choose-path

=== choose-path
scene: village
cast: hero, quill:happy, dragon
You kneel down and tell Sizzle that you'll climb the mountain with her, every single step of the way. Slowly, the little dragon smiles.

The Mayor tucks the jar with the Hearth Ember into your backpack. It feels warm, like a sleeping kitten.

At the edge of the village, the road splits in two. One path winds into the shadowy Whispering Woods. The other follows the rushing Silverrun River toward the mountain.
> Take the forest path -> forest
> Take the river path -> river

=== forest
scene: forest
cast: hero, quill, dragon:scared
The Whispering Woods are so thick that the sunlight comes through in thin golden stripes. The leaves rustle and murmur, as if the trees are sharing secrets.

Sizzle stays very close to your ankles.

Dragon: Do you think there are wolves in here? Or giant spiders? Or giant wolf-spiders?

Quill: The only thing in here is a very dramatic dragon.

Ahead, the trail disappears under fallen leaves. You will need another way to find the mountain.
> Follow the glowing mushrooms -> mushrooms
> Climb a tall tree to look around -> treetop

=== mushrooms
scene: forest
cast: hero, quill:happy, dragon:surprised
Near the roots of an old oak, you notice a row of tiny blue mushrooms. They glow softly, stretching away through the trees like a string of little lanterns.

Dragon: They're beautiful! And look, they're leading uphill.

You follow the glowing trail for an hour. Sizzle hums a song, and Quill joins in, a little off key. At last the trees thin out, and the rocky foot of Cinder Peak rises in front of you.
> Start up the mountain -> ch1-end

=== treetop
scene: forest
cast: hero, quill, dragon:happy
You climb the tallest pine, branch by branch, while Sizzle flutters beside you. At the very top, you gasp.

From up here, the forest is a green ocean, and the wind makes its treetops roll in waves all the way to the mountain. Cinder Peak rises above it all, capped with snow.

Quill: Now we know which way to go! Straight toward the peak.

Sizzle does a happy loop in the air and nearly bumps into a squirrel.
? RL.4 : The text says "the forest is a green ocean." What does this metaphor mean?
+ The treetops spread out far and move in waves like water.
- The forest has been flooded with seawater.
- Fish and whales live high up in the trees.
- The trees were painted blue and green.
hint: A metaphor compares two things. Reread how the wind makes the treetops move.
next: ch1-end

=== river
scene: forest
cast: hero, quill, dragon
The Silverrun River rushes past, cold and clear and loud. A line of flat stepping stones crosses to the other side, where the mountain trail begins.

Sizzle stares at the water and gulps.

Dragon: Dragons and water don't mix. My tail steams if it even gets damp!

On a big rock in the middle of the river sits a plump gray cat, wearing a tiny captain's hat and sunning her belly.
> Say hello to the cat -> river-cat
> Hop onto the first stone -> river-stones

=== river-stones
scene: forest
cast: hero, quill:scared, dragon:scared
You hop onto the first stepping stone, and it wobbles terribly! Your arms spin like a windmill while Quill flaps wildly overhead.

Just then, the gray cat stands up on her rock and gives a loud, bossy meow.

You manage to steady yourself and step carefully back to the shore. Your sneakers are soaked, and Sizzle hides her face in her claws.

Quill: Perhaps we should listen to that cat. She looks like she knows this river.
> Talk to the cat -> river-cat

=== river-cat
scene: forest
cast: hero, dragon, cat
Cat: Hold your horses! I'm Captain Marmalade, and nobody crosses my river without my help. Those stones are slippery, so wait until I tell you which ones are safe.

She points her tail at one stone, then another. You step only where she says, and Sizzle follows with her eyes squeezed shut.

When you reach the far bank, Captain Marmalade tips her hat and asks for payment, which turns out to be a single cracker.
? L.5 : Captain Marmalade says, "Hold your horses!" What does this idiom mean?
+ Wait and be patient.
- Grab the horses by their reins.
- Ride a horse across the river.
- Hurry up as fast as you can.
hint: Read what she says next: "wait until I tell you which ones are safe."
next: ch1-end

=== ch1-end
scene: mountain-pass
cast: hero, quill:thinking, dragon
At last you stand at the foot of Cinder Peak. The mountain towers above you, and a cold wind tugs at your jacket.

Quill: Let's remember how far we've come. The Hearth Ember is fading, and we're carrying it up the mountain so Sizzle can wake the Sunfire Stone before the snow falls.

Sizzle looks up at the enormous peak and takes a long, shaky breath.

Dragon: It's so tall. But I'm still here, aren't I?
? RL.2 : Which sentence best sums up Chapter 1?
+ You set off with Sizzle to carry the fading ember up Cinder Peak.
- Sizzle breathes a giant flame and saves the village right away.
- The Mayor climbs the mountain alone while you stay home.
- You decide to wait until spring to fix the ember.
hint: Listen to Quill's review of what has happened so far.
next: ch2

# ============================================================
# CHAPTER 2: Up the Mountain
# ============================================================

=== ch2
scene: mountain-pass
cast: hero, quill, dragon
checkpoint
~ Chapter Two ~

The trail zigzags up the mountain through boulders and patches of crunchy frost. By noon, you reach an old wooden signpost with two arrows.

One arrow says "ROPE BRIDGE: FAST BUT WINDY." The other arrow says "ECHO CAVE: SLOW BUT SHELTERED."

Sizzle sniffs the chilly air. The ember in your backpack feels a little cooler than it did this morning.

Quill: Either way leads to the summit. Which way should we go?
> Cross the rope bridge -> bridge
> Go through Echo Cave -> cave

=== bridge
scene: mountain-pass
cast: hero, knight:scared, dragon
A rope bridge sways over a deep canyon. At the near end, a knight in shiny armor is hugging a post with both arms.

Knight: Greetings! I am Sir Pemberton, Knight of the Silver Spoon. The king sent me to fetch fresh snow for his lemonade. But my knees are knocking together like two tin pots! I have been standing here, holding this post, since last Tuesday.

Sizzle tilts her head at him.

Dragon: A knight who is scared? I always thought that only little dragons got scared of things.
> Ask the knight about the summit -> bridge-talk
> Offer to help him across -> bridge-help

=== bridge-talk
scene: mountain-pass
cast: hero, quill:thinking, knight
Sir Pemberton straightens his helmet and lowers his voice.

Knight: My grandfather climbed this mountain long ago. He told me that a stone owl stands beside the Sunfire Stone, and that a secret door opens for anyone who knocks on the owl three times.

Quill's feathers ruffle with excitement.

Quill: A stone owl? A secret door? I must see that for myself!

You tuck the knight's words away in your memory. They might be useful later.
clue: Sir Pemberton says a secret door opens if you knock on the stone owl three times.
> Help the knight across the bridge -> bridge-help

=== bridge-help
scene: mountain-pass
cast: hero, knight:happy, dragon:happy
You take the knight's metal glove in one hand and Sizzle's claw in the other.

You tell him not to look down, but only at the very next board. Step by step, the three of you cross, while the bridge creaks and the wind whistles.

On the far side, Sir Pemberton lifts his helmet and wipes his forehead.

Knight: I did it! And you did too, little dragon. We were both scared, and we both crossed anyway.

Sizzle stands a little taller.
? RL.1 : Which quote from Sir Pemberton best shows that he was afraid of the bridge?
+ "My knees are knocking together like two tin pots!"
- "I am Sir Pemberton, Knight of the Silver Spoon."
- "The king sent me to fetch fresh snow for his lemonade."
- "Greetings!"
hint: Look for the quote that describes what his body was doing when he felt scared.
next: ch2-end

=== cave
scene: cave
cast: hero, quill, dragon:scared
Echo Cave is dark, damp, and very quiet. Sizzle tries to make a light, but she only puffs out a gray cloud of smoke.

Dragon: See? Useless.

Then the smoke drifts up and curls around a crystal on the ceiling. The crystal begins to glow, and then another one lights up, and another, until the whole cave shimmers with soft purple light.

Quill: Useless? Your smoke just woke up the crystals!

Sizzle blinks in surprise.
> Study the paintings on the wall -> cave-paint
> Follow the strange echo -> cave-echo

=== cave-echo
scene: cave
cast: hero, quill:surprised, ghost:happy
Hello, hello, hello, says the cave, even though nobody spoke. Out of the wall floats a friendly ghost with a miner's lamp and a bushy white beard.

Ghost: Don't be frightened! I'm Old Flint. I dug tunnels here for fifty years, and now I just enjoy the echoes.

Ghost: If you're heading for the summit, remember this. Knock three times on the stone owl, and it will show you a secret.

Then he chuckles, waves, and fades back into the rock.
clue: Old Flint the ghost says to knock three times on the stone owl at the summit.
> Look at the wall paintings -> cave-paint

=== cave-paint
scene: cave
cast: hero, quill:thinking, dragon:surprised
In the purple glow, you notice paintings on the wall. They tell a story, but they are painted all over the place.

On the left, a small dragon breathes a bright flame at a glowing stone. In the middle, the same little dragon climbs a mountain with two friends. Near the floor is the very first picture, which shows an egg cracking open. Right after that comes a baby dragon who sneezes, but only smoke comes out.

Under the flame picture, someone carved a tiny owl with three dots.
clue: A tiny owl with three dots is carved under the cave painting.
? RL.5 order : Put the cave paintings in the order of the story they tell.
1 An egg cracks open.
2 A baby dragon sneezes out only smoke.
3 The little dragon climbs a mountain with friends.
4 The dragon breathes a bright flame at a glowing stone.
hint: The text says which picture is "the very first" and which comes "right after that." What must happen last?
next: ch2-end

=== ch2-end
scene: mountain-pass
cast: hero, quill, dragon:happy
By late afternoon, you are close to the top of Cinder Peak. The air is thin and icy, and gray snow clouds are gathering on the horizon.

You check the ember in your backpack. It is only a tiny red dot now, but it is still glowing.

Quill: We made it through the hardest part of the mountain. And Sizzle, you were braver than you think.

Sizzle marches ahead, leading the way for the very first time.
? RL.2 : Which sentence best sums up Chapter 2?
+ You made it past a tough part of the mountain, and Sizzle grew braver.
- You turned back because the snow started falling.
- Sizzle flew away and left you alone on the mountain.
- The Hearth Ember went out completely in the cave.
hint: Think about where you are now and how Sizzle is acting. She is leading the way!
next: ch3

# ============================================================
# CHAPTER 3: The Sunfire Stone
# ============================================================

=== ch3
scene: mountain-pass
cast: hero, quill:surprised, dragon:surprised
checkpoint
~ Chapter Three ~

The summit of Cinder Peak is flat and windy. In the center sits the Sunfire Stone, a huge round boulder as smooth as an egg. It is cold and gray, like a sleeping sun.

Beside it stands a stone statue of an owl, taller than you are. Its carved eyes seem to be watching you.

Around the base of the Sunfire Stone, someone has carved a poem.
> Read the poem on the stone -> poem

=== poem
scene: mountain-pass
cast: hero, quill:thinking, dragon
Quill reads the poem aloud, tracing each carved word with her wing.

"I am the flame that sleeps in stone.
I wait up here, cold and alone.
It's not the size of wing or claw
That wakes me with a fiery roar.
Bring me a heart that's brave and true,
And I will shine again for you."

Sizzle's tail twitches nervously while she stares at the enormous stone and thinks about every word.
? RL.6 : Who is the narrator, or speaker, of the poem?
+ The Sunfire Stone, which says, "I am the flame that sleeps in stone."
- Quill, because she is reading the poem out loud.
- Sizzle, because she is a dragon.
- The Mayor, because she sent you up the mountain.
hint: Look at the poem's first line. Who says "I am the flame that sleeps in stone"?
next: try

=== try
scene: mountain-pass
cast: hero, quill, dragon:sad
You set the jar with the Hearth Ember in front of the Sunfire Stone. Sizzle takes a deep breath, puffs out her chest, and blows as hard as she can.

A little cloud of gray smoke floats out of her mouth and drifts away on the icy wind.

Dragon: I knew it would happen. I just can't do it, because I'm much too small.

The first snowflake lands on your nose. The sun is sinking behind the mountains, and the ember is barely glowing at all.
> Cheer Sizzle on -> cheer
> Remind Sizzle what she has done today -> remind
> Knock three times on the stone owl -> owl-door

=== cheer
scene: mountain-pass
cast: hero, quill:happy, dragon:surprised
You clap your hands and start to chant her name as loudly as you can. Quill hoots along, flapping her wings like a cheerleader waving pom-poms.

Dragon: Do you really believe that a tiny dragon like me can do it?

Quill: The poem says the stone doesn't care about the size of your wing or claw. It wants a brave heart, and yours has been brave all day long.

Sizzle closes her eyes and breathes in slowly, all the way down to the tip of her tail.
> Watch Sizzle try again -> flame

=== remind
scene: mountain-pass
cast: hero, quill, dragon:thinking
You kneel next to Sizzle and remind her of everything she did today.

She left the only home she had ever known, and she traveled through wild places even when she was frightened. She climbed an entire mountain, and at the end she proudly led the way to the top.

Dragon: I did do all that, didn't I?

Quill: A dragon who does all that is not too small for anything.

Sizzle closes her eyes and takes the deepest breath of her life.
> Watch Sizzle try again -> flame

=== flame
scene: mountain-pass
cast: hero, quill:happy, dragon:happy
Sizzle opens her mouth, and out comes a flame. It isn't huge, but it is bright gold and steady.

The flame touches the Sunfire Stone, and the stone begins to glow, first orange, then yellow, then as bright as a small sun. Warm light spills across the snowy summit, and the ember in the jar blazes back to life!

Quill: I must write this in the village record book, with the commas in exactly the right places.
? L.2 order : Build the sentence for the record book, with the commas in the right places.
1 Sizzle,
2 the smallest dragon,
3 lit the Sunfire Stone
4 at sunset.
hint: Start with the dragon's name. The words that describe her go between two commas. The tile with the period goes last.
next: descend

=== descend
scene: mountain-pass
cast: hero, quill, dragon:happy
Sizzle bounces around the glowing stone, puffing happy little flames at the falling snowflakes.

Dragon: I did it! I'm still the smallest dragon in the valley, but I actually did it!

Quill: The stone never needed the biggest dragon. It needed the bravest heart.

You pick up the jar. The Hearth Ember is warm and bright, like a tiny sunrise you can hold in your hands.
? RL.2 : What is the theme, or big lesson, of this story?
+ Courage matters more than size.
- The biggest dragons are always the bravest.
- Mountains are too dangerous to ever climb.
- Snow is better than fire.
hint: Reread Quill's words: "The stone never needed the biggest dragon. It needed the bravest heart."
next: home

=== home
scene: mountain-pass
cast: hero, quill:happy, dragon:happy
The Sunfire Stone keeps glowing, lighting a warm golden path down the side of the mountain. The snow is falling faster now, but you aren't cold anymore.

Far below, you can see the tiny lights of Brambleford twinkling in the dark valley, where your friends are waiting and hoping for good news.

Quill: The village is waiting for us. How shall we bring the ember home?
> Hurry down to light the Great Lantern -> end-lantern
> Let Sizzle lead the way home -> end-sizzle

=== end-lantern
scene: village
cast: hero, mayor:happy, dragon:happy
The whole village is waiting in the square when you arrive, bundled in scarves and mittens. You open the jar, and Sizzle gently breathes the ember into the Great Lantern.

WHOOSH! Golden light floods Brambleford, and the snowflakes sparkle like glitter.

Mayor: You brought the warmth back to our village. Thank you, all three of you!

Everyone cheers, and somebody hands you a mug of hot cocoa with a marshmallow shaped like a dragon.
end: win The Lantern of Brambleford

=== end-sizzle
scene: village
cast: hero, quill:happy, dragon:happy
Sizzle leads the way home, lighting the snowy path with little puffs of flame. When you reach the square, she lights the Great Lantern all by herself.

The Mayor places a tiny golden medal around Sizzle's neck, and it says "Official Lantern Keeper."

Dragon: Me? The Lantern Keeper? But I'm so small!

Quill: Small, maybe. But you have the biggest heart in Brambleford.

Sizzle glows pink from snout to tail, and the whole village cheers.
end: win Sizzle's Big Flame

=== owl-door
scene: mountain-pass
cast: hero, quill:surprised, dragon:surprised
Something tells you to try the stone owl, so you knock on its chest once, twice, three times.

With a deep rumble, the owl statue slides sideways. Behind it, a stone staircase spirals down into the mountain, and warm light glows at the bottom.

Quill: An owl guarding a secret door? I knew owls were important!

Sizzle grabs your hand, and together you climb down the winding stairs.
> Follow the stairs down -> dragon-library

=== dragon-library
scene: castle-hall
cast: hero, quill:happy, dragon:surprised
At the bottom is a huge hall with shelves packed with books, some as big as doors and some as small as matchboxes.

Quill: A dragon library! This is the best day of my life!

Sizzle pulls down a dusty book called "The Story of Ashwing." Inside is a picture of a tiny orange dragon who looks just like her.

Dragon: That's my great-grandmother! It says her first fire was only smoke, too!

On the last page, Ashwing wrote, "Fire comes from the heart, not from the size of the dragon."
? RL.2 : What is the theme, or big lesson, of Ashwing's story?
+ Courage matters more than size.
- Only big dragons can make fire.
- Libraries should be kept secret.
- Smoke is better than fire.
hint: Reread the last page of Ashwing's book: "Fire comes from the heart, not from the size of the dragon."
next: end-secret

=== end-secret
scene: castle-hall
cast: hero, quill:happy, dragon:happy
Sizzle hugs the book and reads the last page again, very quietly, to herself. Then she closes it, marches back up the stairs, and breathes a bright golden flame at the Sunfire Stone. The stone blazes, and the ember glows.

Back in Brambleford, the Great Lantern shines brighter than ever. And every winter after that, Quill takes you back up the mountain to read in the secret library.
end: secret The Hidden Dragon Library
