title: Speckle and the Reef Rescue
author: SpiderBen10's Arcade
genre: adventure
band: 4-5
cover: reef
blurb: A gentle whale shark is caught in a lost fishing net. Dive down to Turtle Rock Reef and help set her free!
start: start

# ============================================================
# CHAPTER 1: The Missing Whale Shark
# ============================================================

=== start
scene: research-boat
cast: hero, quill:happy, biologist:scared
checkpoint
~ Chapter One ~

The sun is just coming up over Seaglass Bay. The water is calm and sparkling blue, and a little white research boat bobs beside the dock of the Seaglass Reef Station, where scientists study the animals of the ocean.

A woman in a teal wetsuit waves to you from the deck. She has a dive mask pushed up on her forehead and a worried expression on her face.

Biologist: Welcome aboard! I'm Dr. Lani Kahale. I study sharks here at the reef station. I'm so glad you came, because we have a problem.

Biologist: Every spring, a young whale shark named Speckle visits our bay to feed. She came every single day this week. But since the big storm last night, nobody has seen her anywhere.

Quill: Hoo! A missing shark? Then we had better start searching for her right away.
clue: Speckle, a young whale shark, has not been seen since the storm last night.
> Ask what a whale shark is like -> speckle-info
> Look at the photos on the cabin wall -> photo-wall

=== speckle-info
scene: research-boat
cast: hero, quill:thinking, biologist
Dr. Lani smiles for the first time this morning, because she loves talking about sharks.

Biologist: A whale shark is a shark, and sharks are fish. In fact, whale sharks are the biggest fish in the whole ocean. A grown-up whale shark can be longer than a school bus!

Biologist: But don't worry. Whale sharks are very gentle. They are filter feeders. A whale shark swims with its huge mouth wide open. Water pours in, and its gills strain out tiny plankton and little fish to eat. Then the water flows back out.

Quill: So the biggest fish in the ocean eats some of the tiniest food in the ocean. How wonderfully funny!
? RI.4 : Dr. Lani says whale sharks are "filter feeders." What does that mean?
+ They strain tiny food out of the water they swim through.
- They hunt big fish with their sharp teeth.
- They only eat food that people give them.
- They clean the dirt off of rocks with their fins.
hint: Reread how a whale shark eats. Water pours in, and its gills strain out tiny food.
next: spots

=== photo-wall
scene: research-boat
cast: hero, quill, biologist:happy
The cabin wall is covered with photographs of whale sharks. Every shark has white spots on its dark gray-blue skin. But when you look closely, you notice that the spots are all arranged differently.

Biologist: No two whale sharks have the same spots. The pattern is like a fingerprint. We take a photo of the spots behind the gills, and a computer matches it to our list. That's how we tell who is who.

She taps one photograph with her finger. Behind the shark's gills, five white spots make the shape of a star.

Biologist: That's Speckle. Do you see her star? Her spots will stay exactly the same her whole life, even as she grows bigger and bigger.
clue: Speckle has five spots in the shape of a star behind her gills.
? RI.1 : How do scientists tell one whale shark from another?
+ They match photos of the spots behind each shark's gills.
- They count how many teeth each shark has.
- They give every shark a different colored collar.
- They listen to the sound each shark makes.
hint: Look for what Dr. Lani says about the spots, a photo, and a computer.
next: spots

=== spots
scene: research-boat
cast: hero, biologist:surprised, kid:scared
Just then, a boy races down the dock so fast that his flip-flops slap against the boards. It is Benny, Dr. Lani's nephew, who volunteers at the reef station every summer.

Kid: Aunt Lani! A fisherman on the radio says he saw an enormous spotted shark near Turtle Rock Reef. He said something long and gray was dragging behind her tail!

Biologist: Oh no. The storm tore an old fishing net off the end of the pier last night. If that net is wrapped around Speckle, she could be in trouble.

Benny looks like he might start crying, because Speckle is his favorite animal in the entire ocean.
clue: The storm tore an old fishing net off the pier. A shark with something gray on her tail was seen at Turtle Rock Reef.
> Ask Benny what the fisherman said -> benny
> Get the dive gear ready -> gear

=== benny
scene: research-boat
cast: hero, kid:sad, quill
Benny takes a deep breath and tries to remember every single word the fisherman said.

Kid: The fisherman said she was swimming very slowly, near the edge of the reef. And the net trailed behind her like a long gray ghost.

Quill: People call lost nets "ghost nets." They drift through the sea for years, and they can catch fish, turtles and even sharks by accident.
clue: Lost fishing nets are called ghost nets. They can catch animals by accident.
? L.5 : The net "trailed behind her like a long gray ghost." What does this simile help you picture?
+ The net was long and pale, and it floated along behind her.
- A real ghost was following the shark around the reef.
- The net was hiding in a dark cave.
- The shark was scared of ghosts.
hint: A simile compares two things using "like." What does a ghost look like when it floats?
next: gear

=== gear
scene: research-boat
cast: hero, biologist:thinking, kid
Dr. Lani hands you a wetsuit, a mask, fins and a small air tank. She shows you how to breathe through the mouthpiece, slowly and calmly. Then she explains the most important diving rules.

Biologist: First, check that your air is on. Next, hold your mask and roll backward into the water. Stay right next to me the whole time, because we are dive buddies. And at the end, we come up slowly, never fast.

Biologist: One more thing. We never touch wild animals unless we must help them.

Benny will stay on the boat with Quill, and they will listen to the radio in case anybody needs help.
? RL.5 order : Put Dr. Lani's dive steps in order.
1 Check that your air is on.
2 Hold your mask and roll backward into the water.
3 Stay right next to your dive buddy.
4 Come up slowly at the end.
hint: Listen for the order words Dr. Lani uses: first, next, the whole time, and at the end.
next: ch1-end

=== ch1-end
scene: research-boat
cast: hero, quill:happy, kid
The little boat zooms across the bay. Salty spray splashes over the side, and a curious pelican flaps along beside you for a while.

Soon you can see Turtle Rock. It is a big, round rock that pokes out of the water like the shell of a sleeping turtle. Underneath the water, all around it, is the colorful coral reef.

Quill: Let's go over what we know. Speckle is missing, a ghost net may be caught on her tail, and she was seen here at Turtle Rock Reef.
? RL.2 : Which sentence best sums up Chapter 1?
+ You learn Speckle may be tangled in a net and set out to help her.
- You learn whale sharks are dangerous and stay away from the reef.
- Benny finds Speckle and brings her back to the dock.
- Dr. Lani takes a photo of a turtle sleeping on a rock.
hint: Listen to Quill's review. What is the problem, and what are you going to do about it?
next: quiz-reef

=== quiz-reef
scene: research-boat
cast: hero, quill:happy
Dr. Lani checks the tanks one more time. While you wait, Quill hops onto the railing and pulls a tiny card out from under her wing.
Quill: Hoo! Divers need sharp minds. Here is a quick challenge before you jump in.
? QUIZ : Before we dive, a quick challenge!
next: ch2

# ============================================================
# CHAPTER 2: Turtle Rock Reef
# ============================================================

=== ch2
scene: reef
cast: hero, biologist:happy
checkpoint
~ Chapter Two ~

Splash! You roll backward into the water, exactly the way Dr. Lani showed you. Bubbles fizz all around you. When they finally clear away, you gasp in amazement into your mouthpiece.

The reef is a busy city under the sea. Pink and orange corals grow like tiny branching trees. Purple sea fans wave back and forth in the current, and yellow fish dart past in a crowded, wiggly parade.

Dr. Lani points in two directions. One way leads along the reef wall, and the other way leads to a dark, rocky ledge.
> Swim along the reef wall -> wall
> Peek under the rocky ledge -> ledge

=== ledge
scene: reef
cast: hero, biologist:thinking
You kick your fins, swim down to the ledge, and peek underneath. Something is lying very still on the sand. It is a shark!

It is long and brownish, with two little whiskers dangling beside its nose. Dr. Lani writes a message on her underwater slate and shows it to you.

"NURSE SHARK. SLEEPY, NOT SICK!"

Later, on the boat, she will explain more. Nurse sharks rest on the sea floor during the day. Many sharks have to keep swimming so water flows over their gills. But a nurse shark can pump water over its gills with its mouth and throat. So it can lie still and still breathe. At night, it wakes up to hunt.
clue: Nurse sharks can lie still because they pump water over their gills.
? RI.3 : Why can the nurse shark lie still on the sand and still breathe?
+ It pumps water over its gills with its mouth and throat.
- It holds its breath until night comes.
- It breathes air from the bubbles of the divers.
- It is not really a fish, so it has no gills.
hint: Reread the part that starts with "But a nurse shark can..." What does it do with its mouth and throat?
next: drop-off

=== wall
scene: reef
cast: hero, biologist:surprised, hammerhead
You swim along the reef wall. Then Dr. Lani grabs your arm and points out into the deep blue water.

Sharks! There are lots of them, swimming together in a group. Their heads are wide and flat, shaped like the letter T. They are hammerhead sharks!

Dr. Lani writes on her slate.

"WIDE HEAD = EYES FAR APART. THEY CAN SEE ALL AROUND. THEIR HEADS CAN ALSO SENSE FOOD HIDING IN THE SAND!"

The hammerheads glide past like gray airplanes crossing the sky. They are not interested in divers at all, and they do not even look in your direction.
clue: Hammerheads have wide heads. Their eyes are far apart, so they can see all around.
? RI.1 : Which detail explains how a hammerhead's wide head helps it?
+ Its eyes are far apart, so it can see all around.
- It swims together with other sharks in a group.
- It glides past like a gray airplane.
- It does not look at the divers.
hint: Read Dr. Lani's slate. What does she say a wide head means?
next: drop-off

=== drop-off
scene: reef
cast: hero, whaleshark:sad, biologist:scared
At the very edge of the reef, the water changes from bright blue to deep, dark blue. And there, swimming slowly in a circle, is an enormous shadow.

It is Speckle! She is almost as long as a bus, and her back is covered with white spots. Behind her gills, five spots make a star.

But something is terribly wrong. A tangle of gray net is wrapped around her tail and one of her side fins. The rest of the net drags behind her and is snagged on the coral, so every time she tries to swim away, it pulls her back.
clue: The net is wrapped around Speckle's tail and side fin and snagged on the coral.
> Grab the net and pull it off -> pull
> Signal Dr. Lani and wait -> signal

=== pull
scene: reef
cast: hero, whaleshark:scared, biologist:surprised
You swim toward the net and reach out to yank it. But Dr. Lani gently catches your hand and shakes her head.

She writes on her slate.

"NO PULLING! PULLING MAKES THE NET TIGHTER. AND IT COULD SCARE HER."

You look at the net again, and you realize she is right. The net is wrapped around and around, like string wrapped around a finger. Pulling on it would only squeeze Speckle's fin even harder.
? RL.3 : Why did Dr. Lani stop you from pulling the net?
+ Pulling would make the net tighter and could scare Speckle.
- She wanted to pull the net off all by herself.
- She thought the net would make a good souvenir.
- She was afraid that Speckle would bite you.
hint: Read what Dr. Lani writes on her slate. What would pulling do to the net?
next: plan

=== signal
scene: reef
cast: hero, whaleshark:sad, biologist:thinking
You tap Dr. Lani's arm twice, the signal for "Look!", and point.

Dr. Lani nods and holds up one flat hand, which is the signal for "Stay calm and wait." Then she takes a small tool from her belt. It is a special net cutter, with a tiny hidden blade that cuts rope but not skin.
> Watch Dr. Lani's plan -> plan

=== plan
scene: reef
cast: hero, whaleshark:sad, biologist
Dr. Lani writes her plan on the slate.

"1. MOVE SLOWLY. 2. YOU HOLD THE LOOSE NET AWAY FROM HER EYE. 3. I CUT THE ROPES ON HER TAIL."

Speckle is entangled, so she can't swim freely. The net is twisted around her tail so tightly that her tail can only wiggle a little bit.

You swim slowly to Speckle's side. Up close, her eye is surprisingly small and calm. You carefully hold the loose net away from her eye while Dr. Lani snips the ropes, one at a time.
? L.4 : Speckle is "entangled." Which words help you know what entangled means?
+ "twisted around her tail so tightly"
- "her eye is small and calm"
- "Dr. Lani writes her plan"
- "you swim slowly to Speckle's side"
hint: Entangled describes the net and Speckle's tail. Which words tell you how the net is wrapped around her?
next: ch2-end

=== ch2-end
scene: reef
cast: hero, whaleshark:surprised, biologist:thinking
The ropes on Speckle's tail fall away! She swishes her tail once, then twice, as if she is testing it.

But the net is still caught around her side fin, and it is still snagged on the coral. Then Dr. Lani taps her air gauge. It is time to go up. Divers must always come back up before their air gets low.

You swim up slowly, side by side, watching your bubbles. Below you, Speckle waits beside the reef, swimming in a lazy circle. Surprisingly, she doesn't swim away.
? RL.3 : How does Speckle seem to feel when the ropes fall off her tail?
+ Surprised and a little better, so she tests her tail.
- Angry, so she chases Dr. Lani away.
- Sleepy, so she lies down on the sand.
- Bored, so she swims far out to sea.
hint: Look at what Speckle does right after the ropes fall away. Why would she swish her tail once, then twice?
next: quiz-tanks

=== quiz-tanks
scene: research-boat
cast: hero, quill:happy
Back on the boat, you munch an orange while Dr. Lani changes the air tanks. Quill flutters onto your knee.
Quill: You were so calm down there! Let's keep that brain busy while the tanks are filling up.
? QUIZ : One quick challenge, then back to Speckle!
next: ch3

# ============================================================
# CHAPTER 3: Free as a Fish
# ============================================================

=== ch3
scene: reef
cast: hero, whaleshark, biologist:happy
checkpoint
~ Chapter Three ~

With fresh air tanks, you and Dr. Lani roll back into the water. Speckle is still there, patiently waiting at the edge of the reef.

Dr. Lani writes two choices on her slate.

"CUT THE LAST ROPE ON HER FIN FIRST? OR FREE THE NET FROM THE CORAL FIRST?"
> Cut the last rope on her fin -> fin
> Free the net from the coral first -> coral-first

=== fin
scene: reef
cast: hero, whaleshark:happy, biologist:happy
You hold the net steady while Dr. Lani cuts the last rope on Speckle's fin. Snip!

The net drops away, and Speckle is finally free!

She swims a slow, graceful circle all the way around you. Her huge body moves smoothly, like a cloud drifting across the sky. She doesn't splash or bump into anything at all. Then she swims so close that you can see the little ridges on her back.
? RL.4 : Speckle swims a "graceful" circle. What does graceful mean here?
+ moving in a smooth and beautiful way
- moving in a fast and clumsy way
- moving in a scared and shaky way
- not moving at all
hint: Look at the clues around the word. She moves "smoothly, like a cloud," and doesn't splash or bump.
next: net-haul

=== coral-first
scene: reef
cast: hero, whaleshark:thinking, biologist
You and Dr. Lani carefully unhook the net from the coral, one piece at a time. A few pieces of coral are already broken. Dr. Lani puts them gently into a mesh bag.

Now the net only hangs from Speckle's fin. Dr. Lani snips the last rope, and the net drifts free.

Speckle swims a slow circle around you, then bumps the net bag softly with her nose, as if she is saying, "Take that away, please."
> Haul the net up to the boat -> net-haul

=== net-haul
scene: research-boat
cast: hero, kid:happy, biologist:happy
Back on the boat, Benny helps you haul the ghost net out of the water. It is heavy and slimy, and it smells absolutely terrible. But now it can never accidentally catch another animal.

Kid: You did it! You really, truly rescued her!

Dr. Lani holds up the mesh bag of broken coral pieces.

Biologist: Coral may look like plants or rocks, but it's really made of tiny animals. These broken pieces can still grow. Or we could go back and say goodbye to Speckle.
> Help replant the broken coral -> replant
> Snorkel out to see Speckle one last time -> follow

=== replant
scene: reef
cast: hero, biologist:happy
Dr. Lani takes you to the reef station's coral nursery. Underwater, there are frames that look like little trees made of pipes. Small pieces of coral hang from every branch.

Biologist: Each fragment is a small piece of coral that broke off. We hang the fragments here, where they are safe. When they grow big, we plant them back on the reef.

You tie the fragments from the bag onto a branch, one by one.
? RI.4 : Dr. Lani says each "fragment" is a small piece of coral that broke off. What is a fragment?
+ a small piece that broke off something bigger
- a kind of fish that lives on a coral reef
- a tree made out of pipes
- a tool that is used for cutting nets
hint: Dr. Lani tells you what a fragment is right in her first sentence.
next: win-reef

=== win-reef
scene: reef
cast: hero, biologist:happy, whaleshark:happy
A few weeks later, Dr. Lani sends you a photo. The coral pieces you tied on are growing new tips! And in the corner of the photo, a big spotted shadow swims past the nursery.

Speckle is back, happy and healthy, swimming the reef with her mouth wide open to catch her lunch.

Biologist: You saved a whale shark AND helped a coral reef grow back. That's a whole lot of good work for one day, partner.
end: win The Reef Keepers

=== follow
scene: reef
cast: hero, whaleshark:happy, kid:happy
You and Benny put on snorkels and float at the top of the water. Speckle is right below you, feeding near the surface with her huge mouth open wide. Water pours in, and tiny plankton disappear inside.

Benny takes a photo of her spots with his underwater camera.

Kid: Look! Her star is right there in the picture. I'm going to put it on the photo wall with all the others.
> Compare the photo to the old ones -> compare
> Wave goodbye to Speckle -> win-goodbye

=== win-goodbye
scene: reef
cast: hero, whaleshark:happy, kid:happy
Speckle swims one last slow circle under you. Then she glides off toward the deep blue sea, her spots shining in the sunlight.

Benny waves and waves until she is just a tiny speck far away.

Kid: Goodbye, Speckle! We'll see you again next spring!

Up on the boat, Quill hoots so loudly that the pelicans flap away. Speckle is free as a fish, and she is right where she belongs.
end: win Speckle's Thank-You Swim

=== compare
scene: research-boat
cast: hero, kid:surprised, biologist:surprised
Back in the cabin, Benny holds his new photo up to the old photos on the wall. Then he stops. He points at a faded picture in the very corner.

The label says: "LITTLE COMET. Seaglass Bay. Photo by Lani, age 11."

The little shark in the old photo has five spots in the shape of a star behind her gills.

Biologist: That's my very first shark photo! I took it when I was a kid. That's what made me want to study sharks.
? RL.1 : Which detail proves that Little Comet and Speckle are the same shark?
+ Both photos show five spots in a star shape behind the gills.
- Both photos were taken in the morning.
- Benny and Dr. Lani both like whale sharks.
- The old photo is faded and in the corner.
hint: Remember what Dr. Lani said about spots. They never change, so how could you match two photos?
next: secret

=== secret
scene: research-boat
cast: hero, biologist:happy, quill:happy
Dr. Lani laughs and wipes her eyes at the same time.

Biologist: Spots never change. All these years, the little shark I photographed has been coming home to Seaglass Bay. And today, you helped me save her.

She pins Benny's photo right next to the old one. Now the wall shows Speckle twice: once small, and once grown up.

Quill: Hoo hoo! Some friends find you again, even after a very long time.
end: secret The Spots Remember
