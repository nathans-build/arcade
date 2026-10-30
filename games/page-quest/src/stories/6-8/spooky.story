title: The Moonberry Cake Caper
author: SpiderBen10's Arcade
genre: spooky
band: 6-8
cover: castle-night
blurb: A vampire grandma's prize cake recipe vanishes the night of the Moonlight Bake-Off. Can you crack the case by moonrise?
start: start

# ============================================================
# CHAPTER ONE: A BAT AT THE WINDOW
# ============================================================

=== start
scene: library
cast: hero, quill:surprised, bat:scared
checkpoint
clue: Fennick the bat flew to the library right after sunset to ask for help.
~ Chapter One ~

It is almost closing time in the Arcade Library when something small and fluttery smacks into the window, slides slowly down the glass, and lands on the windowsill with an indignant squeak.

When you open the window, a tiny brown bat with enormous ears tumbles inside, hangs upside down from the reading lamp, and starts talking before he has even caught his breath.

Bat: Help! This is a disaster, a catastrophe, a calamity of colossal, cake-related proportions! I flew here the minute Grandma Morwenna woke up at sunset and discovered that her tin was empty, and I did not stop once along the way, except for one moth, which barely counts.

Quill: Hoo! Slow down, little friend, and take a breath. Start with your name, and then tell us exactly what happened, one piece at a time.

A rolled-up letter, tied with a purple ribbon, dangles from one of his feet.
> Read the letter tied to his foot -> letter
> Let the bat explain in his own words -> explain

=== letter
scene: library
cast: hero, quill:thinking, bat
You untie the ribbon carefully. The letter is written in spidery purple ink on heavy paper that smells faintly of cinnamon and candle smoke.

"To the celebrated readers of the Arcade Library: My name is Morwenna Duskwood, and I live at Mothmere Manor, on the hill above the village of Pumpkin Hollow. Tonight is the annual Moonlight Bake-Off, and my famous recipe has mysteriously disappeared. I am a vampire, but please do not be alarmed, because I have never bitten anything except a cinnamon bun. Kindly come at once. Fennick will show you the way."

Quill: A vampire who writes polite letters and only bites cinnamon buns? I believe I like her already.

Bat: That's me, I'm Fennick, the official way-shower! Hold on tight, because bats are extraordinary navigators, especially in the dark.
> Follow Fennick -> arrive

=== explain
scene: library
cast: hero, quill:thinking, bat:sad
Bat: My name is Fennick, and I live in the bell tower of Mothmere Manor with Grandma Morwenna Duskwood, who is the finest baker in the entire village of Pumpkin Hollow. Tonight is the Moonlight Bake-Off, and her secret recipe is gone, vanished, completely kaput!

Quill: Is Grandma Morwenna, by any chance, a vampire?

Bat: Naturally she is a vampire, but she has never bitten anything except a cinnamon bun, and she insists that was an accident.

Fennick unrolls the letter so that you can read it. It is a polite invitation, written in spidery purple ink, asking the readers of the Arcade Library to come to Mothmere Manor immediately.

Bat: Hold on tight, because bats are extraordinary navigators, especially in the dark.
> Follow Fennick -> arrive

=== arrive
scene: castle-night
cast: hero, vampire:sad, bat
clue: The Moonlight Bake-Off begins when the full moon rises at 11:47 tonight.
clue: Grandma Morwenna locked the recipe card in its tin at dawn, before she went to bed.
Fennick grabs your sleeve with his tiny feet. The library spins around you, the bookshelves blur into a swirl of purple evening sky, and suddenly you are standing in an enormous candlelit hall full of cobwebs, portraits and very old furniture.

A tall woman in a long black cape glides across the floor toward you without making a single sound. Her silver hair is pinned up with a soup spoon, and she is holding a delicate teacup full of tomato soup.

Vampire: Welcome to Mothmere Manor, darlings! I am Morwenna Duskwood. Please excuse the cobwebs, because the spiders pay rent, and I simply cannot ask them to leave.

She sets down her teacup with a sad little clink.

Vampire: For three years in a row, I have won the Moonlight Bake-Off with my Moonberry Velvet Cake. The contest begins when the full moon rises at 11:47 tonight. At dawn, before I went to bed, I locked my recipe card in its tin, exactly the way I always do. When I woke up at sunset, the tin was empty, and my heart dropped like a cake when somebody slams the oven door.
? RL.4 : Morwenna says her heart "dropped like a cake when somebody slams the oven door." What does she mean?
+ She felt sudden, sinking disappointment.
- She dropped a cake on the floor this morning.
- She is excited to start baking right away.
- Her heart is made of cake.
hint: A cake that sinks suddenly is a sad sight for any baker. How did Morwenna feel when she discovered the empty tin?
next: portraits

=== portraits
scene: castle-night
cast: hero, vampire:happy, quill
As you walk toward the kitchen, you pass a long row of gloomy portraits. Every Duskwood ancestor has been painted holding a cake, a pie, or a remarkably large wooden spoon.

Vampire: That is my great-grandmother, Persimmon Duskwood. She invented upside-down cake entirely by accident, because she happened to be hanging from the ceiling at the time.

There is also a tall, gold-framed mirror in the hallway. You can see yourself and Quill in it perfectly, but where Grandma Morwenna should be standing, there is only a teacup floating in the air.

Vampire: Ah, yes, the mirror. Vampires have no reflections, which makes arranging my hair extremely difficult. That is precisely why I use a spoon, because a spoon cannot possibly be pinned in the wrong place.

Quill: Hoo. I have read thousands of books, but this is the first time I have met a hairstyle that is held up with cutlery.
? RL.3 : What does the spoon in Morwenna's hair reveal about her?
+ She solves problems in practical ways and has a sense of humor.
- She is too lazy to do her hair at all.
- She is secretly a terrible cook.
- She is afraid of mirrors and hides from them.
hint: Morwenna cannot see her reflection, so she found her own solution. How does she talk about it?
next: kitchen

=== kitchen
scene: castle-night
cast: hero, quill:thinking, bat
clue: The tin was opened neatly with a key. Only Grandma Morwenna has the key, on a ribbon she never takes off.
clue: Floury handprints are high on the cupboard, almost at the ceiling.
clue: A tuft of gray fur is caught on the tin's lid.
The kitchen of Mothmere Manor is warm and cozy, and it smells deliciously of chocolate and berries. In the middle of the long wooden table sits a little silver tin with a crescent moon engraved on its lid. The lid stands open, and the tin is completely empty.

You examine it closely. The tin is not dented, and the tiny lock is not scratched, which means that somebody opened it with the key. Grandma Morwenna wears the only key on a velvet ribbon around her neck, and she told you that she never takes it off, not even to sleep.

Then you notice something peculiar. There are floury handprints on the tall cupboard, but they are not near the bottom, where an ordinary person would touch it. They are high up, almost at the ceiling.

Bat: And look at this! There is gray fur stuck to the edge of the lid! Gray fur means a werewolf, and there is only one werewolf in Pumpkin Hollow, and his name is Rufus Howlett! Case closed!

Quill: A careful detective never closes a case after only one clue, Fennick.
? RL.1 : Which detail suggests that whoever took the card could float or fly?
+ "They are high up, almost at the ceiling."
- "The lid stands open, and the tin is completely empty."
- "There is gray fur stuck to the edge of the lid!"
- "It smells deliciously of chocolate and berries."
hint: Think about where an ordinary person would touch a cupboard. Which handprints were in a strange place?
next: sugar

=== sugar
scene: castle-night
cast: hero, quill, bat:thinking
clue: A thin trail of sugar leads from the kitchen to the attic stairs.
Something crunches under your shoe. It is sugar, a thin and sparkly line of it, as though somebody had carried a leaky sugar bag across the floor without noticing.

The glittering trail leads out of the kitchen, winds along the hallway past the portraits, and continues all the way to the bottom of a narrow, creaky staircase. Then it simply stops.

Bat: Those stairs go up to the attic, and nobody ever goes up there except the spiders, the ghost, and occasionally me, when I need some peace and quiet.

Quill: I beg your pardon, did you say a ghost?

Bat: Oh, she's perfectly pleasant, and extraordinarily tidy. She dusts the cobwebs every morning, and then she carefully puts them back.
> Climb the attic stairs right now -> attic-door
> Go find the rest of the household -> ivy

=== attic-door
scene: castle-night
cast: hero, bat:scared, quill
You climb the creaky stairs, but the attic door at the top is stuck, as though the ancient wood has swollen in the damp autumn air. You push, and then you pull. Fennick tries to help you pull, which accomplishes absolutely nothing, because he weighs approximately as much as a sock.

From somewhere behind the door comes a soft, wavering, extremely ghostly voice.

"Not now, dear. I am in the middle of dusting."

Bat: You see? I told you she was tidy.

Quill: We may need to return later, when we know exactly which questions we should be asking.
> Go back down to the kitchen -> ivy

=== ivy
scene: castle-night
cast: kid, bat:angry, quill
clue: Ivy says Grandma Morwenna sleepwalks when she is nervous. Last year she put her slippers in the soup pot.
A girl about your age bursts into the kitchen wearing an apron over her pajamas and waving a wooden spoon. This is Ivy Marsh, who lives at the bottom of the hill and has been Grandma Morwenna's baking apprentice for two whole years.

Kid: I came as soon as I heard the news! Is it really true? Did somebody actually steal the recipe?

Fennick swoops around her head in dizzy circles.

Bat: It was terrible, Ivy! An enormous hairy beast smashed through the window, ripped the tin open with its gigantic claws, and gobbled up the recipe in a single bite! I'm absolutely positive that it was Rufus!

Kid: Did you actually see that happen?

Bat: Well, technically, no, because I was asleep. But I can imagine it extremely clearly.

Ivy looks at the window, which is not broken, and then at the tin, which is not scratched, and she sighs patiently.

Kid: Grandma Morwenna always gets nervous before contests. Last year, on the day before the Moonlight Gala, she sleepwalked all afternoon and put her slippers in the soup pot, and afterward she didn't remember a single thing.
? RL.6 : How is Fennick's account different from what you saw in the kitchen?
+ He adds drama; the window and tin were not broken or scratched.
- His account matches the clues in the kitchen exactly.
- He saw the thief clearly with his own eyes.
- He says the recipe was never in the tin at all.
hint: Fennick says the beast "smashed" and "ripped," and then he admits he was asleep. What did the kitchen actually look like?
next: chapter1-end

=== chapter1-end
scene: castle-night
cast: hero, quill:thinking, vampire
Grandma Morwenna paces up and down the hallway, and her long cape swishes behind her like a velvet curtain in the wind.

Vampire: It is already half past eight, and the moon rises at 11:47. If I have the recipe by ten o'clock, there is still enough time to bake. If I do not, I shall have to enter a bowl of soup, and in the entire history of Pumpkin Hollow, soup has never won anything.

You think through the evidence carefully. The card disappeared from a locked tin at some point between dawn and sunset. The tin was opened neatly with a key instead of being forced. Somebody left floury handprints near the ceiling, a trail of sugar leading to the attic stairs, and a tuft of gray fur on the lid.

Quill: Before we chase anybody, let's make sure we can explain what happened without adding any opinions or guesses.
? RL.2 : Which is the best objective summary of Chapter One?
+ The recipe card vanished from a locked tin between dawn and sunset.
- Rufus the werewolf is obviously a greedy recipe thief.
- Grandma Morwenna's cake is the most delicious cake in the world.
- Fennick is the bravest and smartest bat in Pumpkin Hollow.
hint: An objective summary tells the main events without opinions or guesses. Which choice sticks to the facts?
next: quiz-chapter2

=== quiz-chapter2
scene: castle-night
cast: hero, quill:happy
For a moment the story goes still, as if the book itself were waiting. Quill blinks her big amber eyes.
Quill: Sharp minds solve hard problems. Let's see how you handle this one.
? QUIZ : One quick challenge, then back to the story!
next: chapter2

# ============================================================
# CHAPTER TWO: FUR, FLOUR AND A GHOST
# ============================================================

=== chapter2
scene: castle-night
cast: hero, bat:angry, kid
checkpoint
~ Chapter Two ~

Fennick lands on your shoulder and folds his wings across his chest, like a very small detective folding his arms.

Bat: The fur on the tin points directly at Rufus Howlett. He lives in the crooked cottage in the middle of the pumpkin patch, and he is entering the Bake-Off tonight too, so obviously he wanted that recipe! I just know it!

Kid: But Rufus is really kind. Last winter he shoveled our entire path without being asked, and afterward he rolled around in the snow for an hour, because he was so delighted with himself.

The candles flicker in a sudden draft. Through the tall window, you can see the pumpkin patch glowing orange at the bottom of the hill.
> Hurry down to the pumpkin patch -> patch
> Grab a lantern and a snack first -> snack

=== snack
scene: castle-night
cast: hero, vampire:happy, quill
Grandma Morwenna presses a brass lantern into your hands and tucks a warm thermos under Quill's wing.

Vampire: Tomato soup, darlings, for courage. It is my favorite beverage in the whole world. Some vampires prefer berry juice, but personally, I think tomato soup has a great deal more personality.

Quill sniffs the thermos politely.

Quill: Thank you very much. I usually prefer mice, but tonight I am willing to be adventurous.

Vampire: And do mind the pumpkins on your way down the hill, because some of them are rather grumpy this time of year.
> Head down to the pumpkin patch -> patch

=== patch
scene: pumpkin-patch
cast: hero, werewolf:surprised, bat:angry
The pumpkin patch shimmers under the stars. Rows of jack-o'-lanterns grin at you from every direction, a raggedy scarecrow waves in the breeze, and far away you can hear cheerful music drifting from the Bake-Off tents in the village.

In front of a crooked little cottage sits an enormous, fluffy, silver-gray werewolf wearing an apron that says KISS THE COOK. He is concentrating very hard on carving a pumpkin into the shape of a cupcake.

Werewolf: Oh! Visitors! Hello there! I'm Rufus. Would anyone like a pumpkin seed? I roasted them myself this afternoon.

Fennick dives at him like a furious little airplane.

Bat: Don't you "hello" us, you fur-shedding recipe robber! We found your fur on Grandma Morwenna's tin, so you might as well confess!

Rufus's ears flop down, and his bushy tail stops wagging.
> Agree with Fennick and accuse Rufus -> lose-accuse
> Ask Rufus to tell his side -> barnaby

=== lose-accuse
scene: pumpkin-patch
cast: werewolf:sad, bat, quill:sad
You point at Rufus and agree with Fennick. Rufus stares at you for a long, quiet moment, and his big brown eyes fill with tears.

Werewolf: I would never do that, never! Grandma Morwenna is the one who taught me how to make toast.

He lets out a long, mournful howl, the kind that makes every dog in Pumpkin Hollow howl back in sympathy, and then he shuffles into his cottage and closes the door.

You spend the rest of the evening searching his garden, his toolshed and his enormous pile of chew toys, but there is no recipe card anywhere. By the time you trudge back up the hill, the full moon has already risen, the Bake-Off is finished, and Grandma Morwenna is quietly eating soup by herself.

Quill: We followed the loudest clue instead of all the clues. Hoo, I'm afraid this case has gone completely cold.
end: lose The Case of the Sad Werewolf

=== barnaby
scene: pumpkin-patch
cast: hero, werewolf:sad, quill
clue: Rufus came at 6:45, just before sunset, to return a pie dish. The tin was already open and empty, and he sniffed it.
clue: Rufus saw a candle in the attic's round window around lunchtime.
You hold up a hand to stop Fennick, and then you ask Rufus, very calmly, to describe exactly what happened today.

Werewolf: I walked up to the manor just before sunset to return Grandma Morwenna's pie dish, and my clock said 6:45. Nobody answered the door, because everyone was still asleep, so I let myself into the kitchen. The tin was sitting on the table with the lid open. It was already empty, I promise. I only stuck my nose inside to sniff it, because that recipe smells like heaven.

He holds up one paw. It is extraordinarily fluffy, and a puff of gray fur floats away on the evening breeze.

Werewolf: I shed when I'm nervous, and unfortunately, I'm nervous quite a lot.

Quill: Did you notice anything else unusual today?

Werewolf: Only one thing. Around lunchtime, I noticed a candle glowing in the little round window at the very top of the manor, and nobody ever goes up to that attic in the daytime.
? RL.1 : Which quote shows the recipe was gone before Rufus arrived?
+ "It was already empty, I promise."
- "I shed when I'm nervous."
- "Would anyone like a pumpkin seed?"
- "That recipe smells like heaven."
hint: Rufus describes the tin at 6:45. What does he say was inside it when he arrived?
next: walk-back

=== walk-back
scene: pumpkin-patch
cast: hero, bat:sad, werewolf:happy
Fennick hangs upside down from the scarecrow's arm, looking very small and very embarrassed.

Bat: I called you a "fur-shedding recipe robber," and that was unfair of me. I'm sorry, Rufus. You're really just a curious neighbor with an excellent nose.

Werewolf: That's all right, Fennick. "Curious neighbor" sounds much nicer. I might even embroider it on my apron.

Quill points out that both descriptions are about the same werewolf, standing in the same pumpkin patch, on the same evening. The only thing that has changed is the words.
? L.5 : Why does "recipe robber" feel so different from "curious neighbor"?
+ "Robber" has a negative feeling and suggests he did something wrong.
- The two phrases mean exactly the same thing and feel the same.
- "Neighbor" is a longer word, so it sounds more important.
- "Robber" is a compliment that werewolves like to hear.
hint: Think about how Rufus's ears and tail reacted to each phrase. Which words feel like an accusation?
next: mildred

=== mildred
scene: attic
cast: hero, ghost:happy, quill
clue: Mildred the ghost says Grandma Morwenna was a "somnambulist" at noon.
When you return to the manor and climb the creaky stairs again, the attic door swings open all by itself, as though somebody inside has finally finished dusting.

The attic is crowded with trunks, boxes and old hat stands. A dress form wearing a silky purple gown stands beside a little round window. Next to it floats a pale, transparent lady in a lace cap, holding a feather duster.

Ghost: Good evening. My name is Mildred, and I have haunted this attic for two hundred years, and I keep it impeccably tidy. Do mind the cobwebs, because I have just arranged them.

You ask Mildred whether she noticed anything unusual today.

Ghost: Only Madam Morwenna, at noon. She was a somnambulist again. She came drifting up the stairs with her eyes shut tight, fast asleep, humming the Bake-Off waltz and carrying a candle. Naturally, I did not wake her, because it is terribly rude to wake a sleeping vampire.
? L.4 : Mildred says Morwenna "was a somnambulist again." What does "somnambulist" mean?
+ someone who walks around while asleep
- someone who bakes award-winning cakes
- someone who is afraid of the dark
- someone who haunts an old house
hint: Read the rest of what Mildred says. Morwenna had her "eyes shut tight, fast asleep," but she was still moving.
next: remember

=== remember
scene: castle-night
cast: hero, bat:surprised, quill
clue: Fennick half-remembers a cape gliding up the attic stairs at noon, humming.
Back downstairs, Fennick suddenly flaps his wings so hard that he flies straight into a cobweb.

Bat: Wait, wait, wait! I remember now! At noon, I was hanging in the hallway, half asleep, when something swished right past me. It was a cape, gliding up the attic stairs and humming a waltz, and I honestly thought I was dreaming!

Quill: Then let's arrange the whole day in order. When clues come from different witnesses, a timeline helps us see the true shape of the story.

You think about everything you have heard tonight: what Grandma Morwenna did at dawn, what Mildred and Fennick saw at noon, what Rufus found at 6:45, and when Fennick flew off to the library.
? RL.5 order : Put the day's events in the order they happened.
1 Grandma Morwenna locks the recipe card in its tin.
2 A sleeping, humming figure in a cape drifts up to the attic.
3 Rufus finds the tin open and empty.
4 Fennick flies to the Arcade Library for help.
hint: Morwenna locked the tin at dawn. Mildred saw her at noon. Rufus came at 6:45, just before sunset. Fennick flew off after Grandma woke up at sunset.
next: reveal

=== reveal
scene: castle-night
cast: hero, vampire:surprised, kid
You find Grandma Morwenna in the kitchen and explain the clues as gently as you can: the key she never takes off, the handprints too high for anybody who walks on the floor, the sugar trail leading to the attic stairs, and the caped figure that Mildred and Fennick saw at noon.

Grandma Morwenna looks down at her fuzzy slippers. They are dusted with flour and sparkling with sugar.

Vampire: Oh. Oh, my. Oh, my goodness gracious, it was me!

For a moment she hides her face behind her cape. Then her shoulders begin to shake, and you realize that she is laughing.

Vampire: I hid my own recipe in my sleep! I am three hundred years old, and I still get the jitters before a baking contest. Ivy, darling, you must never let me forget this.

Kid: Don't worry, I promise to remind you every single day.
? RL.3 : How does Grandma Morwenna respond when she learns the truth?
+ She is embarrassed at first, then laughs at herself.
- She grows angry and blames Rufus anyway.
- She refuses to believe the clues.
- She decides to cancel the Bake-Off.
hint: Look at what she does with her cape, and then what her shoulders do.
next: riddle

=== riddle
scene: castle-night
cast: hero, vampire:thinking, quill
clue: Morwenna's hiding rhyme: "Keep it where the moon can read it."
Vampire: The trouble is that I have absolutely no idea where I put it. Whenever I hide something important, whether I am awake or asleep, I always recite the same little rhyme to myself.

She closes her eyes and recites it in a singsong voice.

Vampire: "Keep it safe and keep it near. Keep it where the moon can read it."

Quill: Forgive me, but that second line doesn't quite rhyme.

Vampire: I was extremely sleepy when I invented it.

The grandfather clock in the hallway strikes half past nine. You think about the attic, where the only window is a little round one that faces the night sky.
? RL.4 : What does "keep it where the moon can read it" most likely mean?
+ Hide it somewhere the moonlight shines on it.
- Write the recipe on the moon.
- Hide it in a book about the moon.
- Read the recipe aloud at night.
hint: The moon cannot really read. What does the moon give off that could fall on a hiding place through a window?
next: quiz-chapter3

=== quiz-chapter3
scene: castle-night
cast: hero, quill:happy
Quill swoops down and settles on your shoulder, her feathers ruffled from the trip.
Quill: Hoo! You've made it this far by reading carefully. Before the next part begins, let's keep your mind sharp.
? QUIZ : Before we go on, a quick challenge!
next: chapter3

# ============================================================
# CHAPTER THREE: THE CAKE THAT SINGS
# ============================================================

=== chapter3
scene: attic
cast: hero, ghost, bat
checkpoint
~ Chapter Three ~

You hurry up the creaky stairs with Grandma Morwenna, Ivy, Quill and Fennick close behind you. Mildred has lit a single candle, and the attic is full of soft, wobbly shadows.

Ghost: Back so soon? Please wipe your feet, because I have just swept the dust into a much nicer arrangement.

There are dozens of trunks in the attic. One of them, near the door, is labeled IMPORTANT in big purple letters. Across the room, moonlight streams through the little round window and makes a silver circle on the floorboards.

Bat: That trunk says IMPORTANT, and important things belong in important trunks! That's simply logic!
> Open the trunk marked IMPORTANT -> trunk
> Follow the moonlight from the window -> moonbeam

=== trunk
scene: attic
cast: hero, bat:surprised, quill
You lift the heavy lid, and a cloud of dust puffs out. Everybody sneezes at once, including Mildred, who does not even have a nose.

Inside the trunk you discover forty-two black capes, a hat shaped like a bat, and a box of baby photographs. Every single photograph shows an empty high chair with a rattle floating above it.

Bat: That's Grandma Morwenna as a baby! Isn't she adorable? Well, she would be adorable, if anybody could see her.

There is no recipe card anywhere in the trunk. Quill taps her beak thoughtfully and gazes across the room at the silver circle of moonlight.

Quill: The trunk is labeled IMPORTANT, but Grandma Morwenna's rhyme says nothing whatsoever about trunks.
> Follow the moonlight from the window -> moonbeam

=== moonbeam
scene: attic
cast: hero, vampire:happy, ghost
clue: The recipe card was in the pocket of Morwenna's old gala gown, right where the moonlight fell.
The moonlight from the round window stretches across the floor and lands on the dress form in its silky purple gown. It shines directly on a little pocket at the waist.

You reach inside, and your fingers touch a stiff piece of paper.

Vampire: My recipe, in the pocket of my old Moonlight Gala gown! I wore that dress on the night I met my dear husband, Bartholomew, so no wonder my sleepy self believed it was a safe place.

Ghost: I did wonder why you were putting paperwork in your evening dress, Madam. I assumed it was a new fashion.

You hold the card up to the moonlight and read it aloud:

"MOONBERRY VELVET CAKE. First, whisk three eggs with a cup of sugar until pale as moonlight. Next, fold in the flour and a spoonful of cocoa. Then swirl in a whole jar of moonberry jam. Bake in a slow oven. Do NOT open the oven door until the cake sings."

On the back of the card, in smaller handwriting, there is a note: "P.S. The secret ingredient is not in any jar. Always bake it for someone."
> Rush to the kitchen and start baking -> bake

=== bake
scene: castle-night
cast: hero, vampire:happy, kid:happy
It is exactly ten o'clock, and the kitchen bursts into action. Grandma Morwenna ties on an apron printed with tiny bats, and Ivy hands out spoons, bowls and whisks.

Vampire: Darling, you are the one who found and read the card, so tonight you shall be head chef, and I shall be your humble assistant. Tell us what to do, and in what order.

Kid: Baking is a lot like a story, because if you mix up the order of events, the ending comes out lumpy.
? RL.5 order : Put the recipe steps in the order the card gives them.
1 Whisk the eggs and sugar until pale.
2 Fold in the flour and cocoa.
3 Swirl in the moonberry jam.
4 Bake without opening the oven door.
hint: Look for the order words on the card: "First," "Next," "Then," and the last instruction about the oven.
next: oven

=== oven
scene: castle-night
cast: hero, bat:thinking, quill
The cake goes into the oven at twenty past ten, and the whole kitchen fills with a marvelous smell of chocolate, berries and warm summer evenings.

Then you wait, and wait, and wait some more. Fennick hangs from the pot rack and swings back and forth, faster and faster, until he looks like a furry little pendulum.

Bat: It's been ages! Centuries! At least eleven minutes! How do we even know it's working? I only want one tiny peek. Just open the door a crack, and nobody will ever know!

Quill raises one feathery eyebrow and glances meaningfully at the recipe card lying on the table.
> Open the oven door for a quick peek -> lose-collapse
> Wait for the cake to sing -> sings

=== lose-collapse
scene: castle-night
cast: vampire:sad, bat:scared, quill:sad
You open the oven door just a crack. A puff of warm air rushes out, and with it comes a sad little sound, like a balloon that has completely given up on life.

Fwoomp.

The beautiful, puffy cake sinks in the middle until it is as flat as a pancake, a very purple and very disappointed pancake.

Vampire: Oh, dear. The card did warn us not to open the door until it sings.

There is no time left to bake another one. At 11:47 the full moon rises over Pumpkin Hollow, and Grandma Morwenna's flattened entry receives a ribbon that says MOST ENTHUSIASTIC.

Quill: Hoo. The answer was written right there on the card. Next time, we should read before we peek.
end: lose The Flattest Cake in Pumpkin Hollow

=== sings
scene: castle-night
cast: hero, vampire:happy, bat:surprised
At five minutes past eleven, a sweet, high whistle rises from the oven, like a kettle humming a lullaby. The cake is singing!

Grandma Morwenna flings open the door. The Moonberry Velvet Cake has risen tall and round and purple, and it glows softly, like a full moon rising over a hill.

Vampire: Perfect! Absolutely perfect! You did it, darling!

Fennick is so excited that he performs three loop-the-loops in a row and crashes directly into the flour sack. When he climbs out, he is completely white from his ears to his toes.

Bat: Am I a ghost now? Mildred, come and look! I'm a ghost!
? L.5 : The cake "glows softly, like a full moon rising over a hill." What does this simile show?
+ The cake is round, tall and beautiful.
- The cake is burnt and smoking.
- The cake is floating out the window.
- The cake is small and flat.
hint: A simile compares two things using "like." Picture a full moon rising. What shape is it, and how does it look?
next: hill

=== hill
scene: pumpkin-patch
cast: hero, kid:happy, bat:happy
At twenty minutes to midnight, you carry the cake down the hill on a silver tray, with Ivy, Quill and Fennick marching behind you like a small parade. Mildred waves a lace handkerchief from the round attic window, and the sound of the village band grows louder with every step.

Kid: I can't believe we did it. Well, almost did it. We still have to get this cake to the judges without dropping it.

Bat: I volunteer to guard the cake! I will protect it with my life, and also with my mouth, by eating any crumbs that try to escape.

Pumpkin Hollow is glowing. Jack-o'-lanterns line every path, paper bats dangle from the trees, and the long Bake-Off tables are piled high with pies, tarts and cookies shaped like crescent moons.
> Carry the cake to the judges' tent -> festival

=== festival
scene: pumpkin-patch
cast: hero, mayor:happy, vampire
The judge this year is Mayor Pruitt Hobb, a round little man with a tall striped hat and a very serious fork.

Mayor: Morwenna! The whole village heard that your recipe was stolen!

Vampire: It was not stolen, Mayor, merely misplaced, by a sleepy vampire who should have trusted her friends sooner. These clever readers found it again, and they did not blame anybody without evidence.

You glance across the patch at Rufus, who is standing beside a lumpy, slightly burnt pumpkin pie. His ears are drooping again.
? RL.2 : Which theme does the story develop through Fennick and Rufus?
+ Look at all the evidence before you blame someone.
- Werewolves are always guilty of something.
- The loudest person is usually right.
- Never bake a cake on the night of a contest.
hint: Think about how Fennick accused Rufus, what the evidence really showed, and how Fennick felt afterward.
next: choose

=== choose
scene: pumpkin-patch
cast: hero, werewolf:sad, quill
The full moon is almost peeking over the hills, and the Mayor is tapping his serious fork impatiently against his plate.

Rufus looks down at his pie. One side is rather black, and the middle has sunk.

Werewolf: I was so worried about being blamed that I forgot to take it out of the oven on time. But that's all right. Grandma Morwenna's cake deserves to win, anyway.

Quill tilts her head at you, as though she is remembering something written on the back of a certain recipe card.
> Put the cake on the judges' table -> win-ribbon
> Go over and talk to Rufus -> barnaby-pie

=== barnaby-pie
scene: pumpkin-patch
cast: hero, werewolf:thinking, vampire:thinking
You walk over to Rufus's table, and Grandma Morwenna follows you, her cape swishing through the pumpkin leaves.

Werewolf: The burnt part is only on one side, and the rest tastes fine, I think. I made it with pumpkins from my own patch, and I whipped the cream myself. I only wanted to make something nice for everybody.

You remember the note on the back of the recipe card: "The secret ingredient is not in any jar. Always bake it for someone."

Grandma Morwenna looks at the cake, then at the pie, and finally at you.

Vampire: Darling, you are the head chef tonight. What shall we do?
> Combine the cake and pie as one entry -> secret
> Wish Rufus luck and enter the cake -> win-luck

=== secret
scene: pumpkin-patch
cast: werewolf:happy, vampire:happy, mayor:surprised
You trim the burnt side off Rufus's pie, and Ivy crumbles the rest over the top of the Moonberry Velvet Cake. Rufus piles on his homemade whipped cream, and Grandma Morwenna sprinkles everything with sugar, very carefully, while wide awake. You name your creation the Full Moon Friendship Cake.

At exactly 11:47, the full moon rises over Pumpkin Hollow. Mayor Hobb takes one bite, then another, then a third, and then he puts down his fork and dabs his eyes with a napkin.

Mayor: In forty years of judging, I have never tasted anything like it. I am inventing a brand-new prize this very minute: the Golden Spoon, for the finest thing baked together.

Rufus howls so joyfully that every dog in the village joins in, and Fennick, still white with flour, flies a victory lap around the moon.
end: secret The Secret Ingredient

=== win-luck
scene: pumpkin-patch
cast: hero, werewolf:happy, bat:happy
You shake Rufus's fluffy paw and tell him that his pie smells wonderful, burnt side and all, and his tail starts wagging again.

At 11:47 the full moon rises, and Mayor Hobb tastes every single entry. The Moonberry Velvet Cake wins the blue ribbon for the fourth year in a row. Rufus's pie wins a ribbon that says MOST IMPROVED, and he proudly pins it to his apron, right beside KISS THE COOK.

Bat: I would like to make a speech. Rufus is a curious neighbor, an excellent sniffer, and a true gentlewolf. Also, I'm sorry. That is the end of my speech.

Later, Grandma Morwenna cuts the cake into generous slices and gives the very first one to Rufus.
end: win A Ribbon and a Slice

=== win-ribbon
scene: pumpkin-patch
cast: hero, mayor:happy, vampire:happy
You set the Moonberry Velvet Cake on the judges' table just as the full moon rises over Pumpkin Hollow at 11:47.

Mayor Hobb takes a bite. He closes his eyes and chews very, very slowly. Then he pins an enormous blue ribbon right on your shirt.

Mayor: Four years in a row! Morwenna, you have outdone yourself, and so has your head chef.

Vampire: Darling, you rescued the Bake-Off, and you taught a nervous old vampire to write her rhymes down on paper.

Later that night, back in the Arcade Library, you discover a slice of purple cake wrapped in a napkin in your pocket, along with a note in spidery purple ink: "For my favorite detectives. Please come back next year, and bring a fork."
end: win Blue Ribbon by Moonlight
