title: The Long Way to Cloudspray Falls
author: SpiderBen10's Arcade
genre: adventure
band: 4-5
cover: ship-deck
blurb: A baby macaw is lost far from home. Ride a riverboat up the jungle river and get him back before his flock flies off!
start: start

# ============================================================
# CHAPTER 1: The Bird in the Shoebox
# ============================================================

=== start
scene: village
cast: hero, quill, kid:sad
checkpoint
~ Chapter One ~

The little river town of Mossbank sits where the jungle meets the wide, brown Ollaro River. It is a hot, sticky morning, and the air smells like rain and ripe mangoes.

A boy named Tavi runs up to you, holding a shoebox with holes poked in the lid. He opens it very carefully.

Kid: Please help me. I found a baby bird after the big storm last week, and I think he's lost. He's very far from home.

Inside the box, a fuzzy little bird with a bright blue crown blinks up at you.
> Meet the baby bird -> pip
> Ask Tavi where he found it -> found

=== found
scene: village
cast: hero, quill:thinking, kid:thinking
Tavi points at the river, where branches and leaves float slowly past the dock.

Kid: After the storm, the river was full of broken branches. One of them had a little nest stuck in its twigs, and he was inside, peeping as loud as he could.

Quill: The storm must have knocked his nest out of a tree far up the river. Then the water carried him all the way down here.
clue: Tavi found the baby bird in a nest floating down the river after a storm.
> Say hello to the baby bird -> pip

=== pip
scene: village
cast: hero, kid, parrot:sad
The baby bird hops onto Tavi's finger. His body is green, his wings are still short and stubby, and a crown of blue feathers sticks up on his head like a tiny paintbrush.

Kid: I named him Mango. He's a macaw, and he can already say one word.

Parrot: Home! Home!

Kid: He sits by the window every night and looks up the river. I think he's trying to see his family.

Mango gives a sad little peep and tucks his head under his wing.
clue: Mango sits by the window every night and looks up the river.
? RL.1 : Which sentence from the story best shows that Mango misses his home?
+ "He sits by the window every night and looks up the river."
- "He's a macaw, and he can already say one word."
- "I named him Mango."
- "It is a hot, sticky morning."
hint: Look for what Mango does every night. Where is he looking, and why?
next: station

=== station
scene: lab
cast: hero, quill, scientist:surprised
You carry Mango to the Mossbank Bird Station, where Dr. Ama Osei studies the birds of the jungle. When she sees Mango's blue crown, she nearly drops her clipboard.

Scientist: A Bluecrown macaw! They live in only one place in the whole world, and that's Cloudspray Falls, three days up the Ollaro River.

Scientist: Every year, when the full moon comes, the flock migrates. The very next morning, they all leave their nests and fly together to the warm cliffs in the south. They don't come back until spring.

She checks her calendar and frowns.

Scientist: The full moon is in three days. If Mango misses his flock, he'll be alone all winter.
clue: The Bluecrown flock leaves Cloudspray Falls the morning after the full moon, in three days.
? L.4 : Dr. Ama says the flock "migrates." Using the clues around it, what does migrate mean?
+ to travel together to another place for part of the year
- to build a brand new nest in the same tree
- to sleep through the whole winter
- to sing very loudly at night
hint: Read the next sentence. The birds "fly together to the warm cliffs in the south" and come back in spring.
next: dock

=== dock
scene: ship-deck
cast: hero, captain:happy, kid
Down at the dock, a riverboat bobs in the water. She is painted the color of mangoes, and her name is the Muddy Mabel.

Her owner, Captain Inez Marrow, has a straw hat and a laugh as big as a foghorn.

Captain: Cloudspray Falls? That's a long, twisty trip. But a baby bird who needs to get home? Climb aboard!

Dr. Ama hurries down the dock with a backpack full of notebooks. She wants to come along, too.
> Help load the boat -> load
> Ask the captain about the river -> captain-talk

=== load
scene: ship-deck
cast: hero, captain, parrot:happy
You help carry bunches of bananas, a coil of rope, a lantern, and a big jug of water onto the deck. Mango rides on top of the lantern like a little green king.

Captain: Good work! Now everyone get some sleep. We'll leave at the crack of dawn, just when the sun first peeks over the trees.

Mango yawns so wide that you can see his tiny pink tongue.
? L.5 : The captain says, "We'll leave at the crack of dawn." What does this idiom mean?
+ They will leave very early, when the sun first comes up.
- They will leave when something on the boat cracks.
- They will leave in the middle of the night.
- They will never leave at all.
hint: Read the rest of what the captain says: "just when the sun first peeks over the trees."
next: ch1-end

=== captain-talk
scene: ship-deck
cast: hero, quill:thinking, captain
Captain Inez leans on the railing and looks up the river.

Captain: I've sailed the Ollaro for thirty years. It bends like a snake, and it splits into channels where you least expect it.

Captain: When I was a little girl, my grandmother told me a legend. She said the oldest macaws keep a secret nest behind Cloudspray Falls, in a cave where the water sings.

Quill: A singing cave? Now that is something I would like to hear.
clue: Captain Inez's grandmother said the oldest macaws keep a secret nest in a cave behind the falls.
> Get ready for the trip -> ch1-end

=== ch1-end
scene: ship-deck
cast: hero, quill, kid:happy
The next morning, the Muddy Mabel chugs away from Mossbank. Mango sits on Tavi's shoulder, and the jungle slides past on both sides of the river.

Tavi whistles three notes, low, high, high. Right away, Mango peeps three notes back.

Kid: That's our bedtime song. I made it up by copying the tiny peeps Mango made on his very first night. Every time I whistle it, he answers.

Quill: Let's remember why we're here. Mango is lost, his flock leaves after the full moon, and we're taking him home up the river.
clue: Tavi's whistle is three notes, low, high, high. He copied it from Mango's peeps on his first night.
? RL.2 : Which sentence best sums up Chapter 1?
+ You set off up the river to bring Mango home before his flock leaves.
- Tavi decides to keep Mango in Mossbank forever.
- Mango flies home all by himself on the first day.
- Dr. Ama takes Mango to live at the Bird Station.
hint: Listen to Quill's review. Where are you going, and why?
next: quiz-ch2

=== quiz-ch2
scene: ship-deck
cast: hero, quill:happy
Quill hops in front of you and holds up one wing.
Quill: Wait just a moment! The next part of the story is coming. First, try one of my quick challenges.
? QUIZ : Sharp minds win the day. Try this one!
next: ch2

# ============================================================
# CHAPTER 2: Up the Ollaro River
# ============================================================

=== ch2
scene: ship-deck
cast: hero, quill, captain:thinking
checkpoint
~ Chapter Two ~

On the second day, the Muddy Mabel reaches two huge gray boulders called the Twin Rocks. Here the river splits into three channels.

Captain Inez unrolls a river chart and spreads it on a barrel so everyone can see it.

TWIN ROCKS RIVER CHART
Snake Bend, 6 hours, deep water
Lily Cut, 2 hours, very shallow water
Monkey Pass, 3 hours, deep water

Captain: The Mabel is a heavy old boat. In shallow water, she'll get stuck in the mud. We need deep water, and we need to be fast.
? RI.7 : Use the chart. Which channel is the fastest way the Mabel can go safely?
+ Monkey Pass
- Lily Cut
- Snake Bend
- None of them, so the boat must turn back
hint: The Mabel needs deep water. Of the channels with deep water, which one takes the fewest hours?
next: monkey

=== monkey
scene: island-jungle
cast: hero, kid:scared, parrot:scared
Monkey Pass is narrow and green, and vines hang down to the water. Suddenly, a deep roar booms from the treetops. Then another one. Then a hundred more!

Kid: Howler monkeys! They're just loud, they won't hurt us.

But Mango doesn't know that. He squawks, flaps his stubby wings, and flutters off the boat into the jungle.

Kid: Mango! Come back!
> Paddle the canoe ashore to search -> search
> Ask Tavi to whistle the bedtime song -> whistle

=== search
scene: island-jungle
cast: hero, quill:thinking, kid
You and Tavi paddle the little canoe to the riverbank and climb out. The jungle is dim and steamy, and it buzzes with bugs.

Quill: Look carefully. Every clue counts.

Then you spot it. A bright green feather is stuck to a fern, right beside a narrow path. A few steps later, you find another one.

At the end of the path stands an old stone wall covered in moss. Mango is perched on top of it, shivering. Carved into the stone are birds with crowns, flying straight into a waterfall.
clue: An old stone carving shows crowned birds flying into a waterfall.
? RL.1 : Which detail helped you know that Mango went down the narrow path?
+ A bright green feather was stuck to a fern beside the path.
- The jungle was dim and steamy.
- The howler monkeys roared from the treetops.
- Tavi paddled the canoe to the riverbank.
hint: Reread what you spotted right before you found Mango. What did Mango leave behind?
next: night

=== whistle
scene: island-jungle
cast: hero, kid, parrot:happy
Tavi takes a deep breath and whistles three notes, low, high, high.

For a moment, the jungle is quiet. Then, from high in the leaves, three tiny peeps answer him.

Mango flutters down through the branches, as light as a falling leaf, and lands right on Tavi's head.

Kid: I knew you'd come back, buddy!
? RL.3 : Why did Mango come back to the boat?
+ He heard the bedtime whistle he knew from Tavi.
- He was hungry and smelled the bananas.
- The howler monkeys chased him out of the tree.
- Captain Inez called him with a horn.
hint: Think about the bedtime song from Chapter 1. What happens every time Tavi whistles it?
next: night

=== night
scene: ship-deck
cast: hero, quill, kid:sad
That night, the Muddy Mabel is tied to a tree, and fireflies blink all around the boat. Mango is asleep in Tavi's hat.

Tavi sits at the edge of the deck, very quiet.

Kid: I want Mango to be with his family. I really do. But he's my best friend. What if he flies away and forgets all about me?

He wipes his nose on his sleeve and looks up the dark river.

Quill: Those are big feelings, Tavi. It's all right to feel two things at once.
? RL.3 : Which words best describe how Tavi feels on this night?
+ He is happy for Mango but sad to lose his friend.
- He is angry at Mango for flying away.
- He is bored and ready to go home.
- He is scared of the fireflies.
hint: Tavi says, "I want Mango to be with his family," and then, "But he's my best friend." Quill says he feels two things at once.
next: blocked

=== blocked
scene: ship-deck
cast: hero, captain:surprised, scientist
Early on the third day, the Mabel comes around a bend and stops with a jolt. A giant tree has fallen across the river!

Captain: Well, that's a problem. We can't go over it, and we can't go under it.

Dr. Ama points at the riverbank.

Scientist: There might be another way around. Or we could try to clear a path through the branches.
clue: On the third day, a fallen tree blocked the river.
> Help cut through the branches -> saw
> Search for another way around -> side-channel

=== saw
scene: ship-deck
cast: hero, captain:happy, kid:happy
Captain Inez hands out saws and gloves. Everyone works together, even Mango, who tugs at little twigs with his beak.

The fallen tree is a giant's arm stretched across the water, with leafy fingers that grab at the boat. One branch at a time, you cut a gap wide enough for the Mabel.

When the last branch splashes into the river, everyone cheers.

Captain: Good job, crew! Many hands make light work!
? RL.4 : The text says, "The fallen tree is a giant's arm stretched across the water." What does this metaphor help you picture?
+ The tree is huge, and it reaches all the way across the river.
- A real giant is lying in the river.
- The tree is waving hello to the boat.
- The tree is small and easy to step over.
hint: A metaphor compares two things. How would a giant's arm look if it stretched across the water?
next: ch2-end

=== side-channel
scene: island-jungle
cast: hero, quill, scientist:thinking
You and Dr. Ama walk along the muddy bank. Behind a curtain of hanging vines, you find a narrow channel of water. It is so slim that the branches on each side almost touch in the middle.

Scientist: It's deep enough for the boat. But the Mabel will barely fit.

Captain Inez steers very slowly. Leaves brush the windows, and the sides of the boat squeak against the branches. At last, you slide out past the fallen tree.
? L.4 : The channel is "narrow." Which words from the text help you know what narrow means?
+ "so slim that the branches on each side almost touch"
- "It's deep enough for the boat"
- "You and Dr. Ama walk along the muddy bank"
- "At last, you slide out past the fallen tree"
hint: Narrow describes how wide the channel is. Which words tell you it was not very wide?
next: ch2-end

=== ch2-end
scene: ship-deck
cast: hero, quill:happy, scientist
By evening, you can hear a deep, steady roar ahead. Mist drifts over the river like smoke. Above the trees, the full moon rises, round and silver.

Scientist: That roar is Cloudspray Falls. The flock leaves tomorrow at sunrise.

Quill: We made it past the monkeys and the fallen tree, and we're almost there. Tavi, you've been a brave friend to Mango the whole way.

Tavi hugs Mango gently, and Mango nibbles his ear.
? RL.2 : Which sentence best sums up Chapter 2?
+ You got past the monkeys and the fallen tree and neared the falls.
- The Mabel got stuck in Lily Cut and had to turn around.
- Mango flew away and joined the howler monkeys.
- Tavi decided not to take Mango home after all.
hint: Listen to Quill's review. What did you get past, and where are you now?
next: quiz-ch3

=== quiz-ch3
scene: ship-deck
cast: hero, quill:happy
The page goes quiet, like the whole book is holding its breath. Quill puffs out her feathers.
Quill: Hoo hoo! It's time for a quick challenge. Take your time and think it through.
? QUIZ : One quick challenge, then back to the story!
next: ch3

# ============================================================
# CHAPTER 3: Cloudspray Falls
# ============================================================

=== ch3
scene: island-jungle
cast: hero, quill:surprised, scientist
checkpoint
~ Chapter Three ~

At dawn, you finally see Cloudspray Falls. White water thunders off a tall green cliff, and rainbows shimmer in the spray.

High on the cliff, hundreds of macaws with blue crowns flutter from ledge to ledge. The whole flock is getting ready to leave!

Mango stretches his neck and cries, "Home! Home!" But the falls are much too loud. Nobody up there hears him.

Scientist: We need to get Mango closer, somewhere quieter. And we don't have much time.
> Climb the cliff path with Mango -> cliff
> Ask Dr. Ama for ideas -> ama-idea
> Look behind the waterfall -> behind-falls

=== ama-idea
scene: island-jungle
cast: hero, scientist:thinking, kid
Dr. Ama looks through her binoculars at the cliff.

Scientist: Baby macaws learn a call from their parents. Each family has its very own call, so they can find each other in a big, noisy flock.

Kid: But Mango got lost before he could learn his family's call.

Scientist: Maybe. But there's a path up the side of the cliff to a flat rock called Lookout Rock. It's far enough from the falls that a bird's call could be heard.
> Climb to Lookout Rock -> cliff

=== cliff
scene: mountain-pass
cast: hero, kid, parrot
You climb the steep path with Tavi. Mango rides inside the front of Tavi's shirt, poking his head out like a kangaroo baby.

At last, you reach Lookout Rock. Up here, the roar of the falls is softer, and the flock is close enough to see each bird.

Mango squawks, "Home!" as loudly as he can. A few birds turn their heads, but none of them fly down.

Tavi's shoulders sag.
> Ask Tavi to whistle the bedtime song -> flock-whistle
> Let Mango try calling one more time -> pip-calls

=== flock-whistle
scene: mountain-pass
cast: hero, kid:surprised, scientist:surprised
Tavi wipes his eyes, puts two fingers to his lips, and whistles three notes, low, high, high.

The whole cliff goes still. Then a hundred birds answer with the very same three notes!

Scientist: Tavi! You copied Mango's peeps from his first night. Those weren't just baby noises. Mango was singing his family's call, and you've been whistling it all along!

A big macaw with a crooked tail feather swoops down and lands on the rock. She bends her head to Mango, and Mango peeps the call right back.
> Watch Mango and the big macaw -> journey-log

=== pip-calls
scene: mountain-pass
cast: hero, kid, parrot:happy
Mango takes a big breath. This time he doesn't say "Home." Instead, he peeps three notes, low, high, high. It is the bedtime song!

Kid: That's our song! He's singing our song!

High on the cliff, one macaw stops flapping. She tilts her head, and then she peeps the same three notes back.

She swoops down and lands on the rock. She has a crooked tail feather, and she bends her head to Mango as if she has been looking for him for a very long time.
> Watch Mango and the big macaw -> journey-log

=== journey-log
scene: mountain-pass
cast: hero, quill:happy, kid:surprised
Quill: That's Mango's mother! I'm sure of it!

The big macaw fluffs her feathers around Mango like a warm green blanket. Mango snuggles in close.

Quill takes out her little notebook.

Quill: This trip belongs in the ship's log. Help me write down what happened, in the right order.
? RL.5 order : Put the events of the journey in the order they happened.
1 Tavi found Mango in a nest floating down the river.
2 Dr. Ama explained that the flock leaves after the full moon.
3 The Muddy Mabel took Monkey Pass.
4 A fallen tree blocked the river.
5 You climbed up to Lookout Rock.
hint: Think back through the chapters. What happened in Mossbank first? What happened on the second day and the third day?
next: goodbye

=== goodbye
scene: mountain-pass
cast: hero, kid:sad, parrot
The sun is climbing higher. Up on the cliff, the flock begins to lift into the sky.

Mango's mother spreads her wings. Mango looks at her, then back at Tavi.

Tavi kneels down. His voice is shaky, but he smiles.

Kid: It's okay, Mango. Go with your family. Being your friend means helping you get home, even if I have to say goodbye.

Parrot: Home!
? RL.2 : What is the theme, or big lesson, of this story?
+ Sometimes being a good friend means letting go.
- Birds should always be kept in shoeboxes.
- Rivers are too dangerous to travel on.
- You should never make friends with animals.
hint: Reread what Tavi says: "Being your friend means helping you get home, even if I have to say goodbye."
next: farewell

=== farewell
scene: mountain-pass
cast: hero, quill, kid
Mango hops onto his mother's back, the way baby macaws do when their wings are still too short to fly far.

Quill puts a soft wing around Tavi's shoulders.

Quill: How would you like to say goodbye, Tavi?
> Wave goodbye as the flock flies south -> end-home
> Whistle the bedtime song one last time -> end-feather

=== end-home
scene: mountain-pass
cast: hero, kid:happy, parrot:happy
Mango's mother leaps off the rock with Mango holding on tight. They rise up and up, until they join the whole flock in a swirl of green and blue.

Tavi waves with both arms until the flock is just a tiny dot in the sky.

Kid: He's home. He's really home.

That night, back on the Muddy Mabel, Captain Inez cooks a giant pot of banana pancakes. She says the trip was the best one she's had in thirty years.
end: win Home to the Flock

=== end-feather
scene: mountain-pass
cast: hero, quill:happy, kid:happy
Tavi whistles three notes, low, high, high, one last time.

Mango peeps the song back. Then he pulls a tiny blue feather from his crown and drops it into Tavi's hand.

Mango's mother leaps into the sky, and the flock flies south over the jungle.

Quill: Next spring, when the flock comes back, I think a certain macaw will be listening for that song.

Tavi tucks the blue feather into his pocket and smiles all the way back to Mossbank.
end: win A Feather to Remember

# ============================================================
# SECRET PATH: The Singing Cave
# ============================================================

=== behind-falls
scene: cave
cast: hero, quill:surprised, kid:surprised
You squeeze along a slippery ledge and step right behind the waterfall. The falling water is a silver curtain, and behind it hides a cave!

Inside, the roar turns into a low, humming song. The water hums and whistles and sings as it bounces off the rock walls.

Quill: The cave where the water sings! Captain Inez's legend was true!

On the walls are old paintings of crowned birds, flying into a waterfall. Mango pokes his head out of Tavi's shirt and listens.
? RL.4 : The text says, "The falling water is a silver curtain." What does this metaphor mean?
+ The water falls in a shiny sheet that hides what is behind it.
- Someone hung real silver curtains in front of the cave.
- The water is made of silver coins.
- The waterfall has stopped falling.
hint: Think about what a curtain does. What did the falling water hide?
next: singing-cave

=== singing-cave
scene: cave
cast: hero, kid, parrot:happy
Deep in the cave, on a rocky shelf, sit three very old macaws. Their feathers are faded, and their blue crowns have turned almost white. They are too old to fly south, so they stay here all winter, where it is warm and dry.

Mango hops toward them and peeps three notes, low, high, high.

The oldest macaw answers. Then the cave catches her call and makes it a hundred times louder. It echoes out through the falls and all the way up the cliff!
> See who answers the call -> end-secret

=== end-secret
scene: mountain-pass
cast: hero, quill:happy, kid:happy
A big macaw with a crooked tail feather comes swooping down through the spray. It's Mango's mother, and she heard the call in the singing cave!

Mango climbs onto her back, and Tavi whistles goodbye. The flock lifts off and flies south, a river of green and blue across the sky.

Before you leave, the oldest macaw drops a white crown feather at Tavi's feet. Dr. Ama gasps. No scientist has ever seen the Singing Cave before.

Quill: You found the oldest secret on the whole river. Captain Inez's grandmother would be proud.
end: secret The Singing Cave
