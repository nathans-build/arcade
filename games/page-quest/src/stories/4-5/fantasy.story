title: The Jar of Lost Stories
author: SpiderBen10's Arcade
genre: fantasy
band: 4-5
cover: temple-ruins
blurb: A museum jar cracks open, and the old Greek myths begin to fade. Chase them with a sphinx, a griffin and a minotaur!
start: start

# ============================================================
# CHAPTER ONE: DO NOT OPEN
# ============================================================

=== start
scene: museum-hall
cast: hero, quill:happy, kid:happy
checkpoint
~ Chapter One ~

Today is field trip day, and Quill has flown you from the Arcade Library to the City Museum to visit a brand-new exhibit called Gods, Heroes and Monsters.

A boy in a green museum vest waves at you from the doorway. His name is Ari Pappas, and his grandfather is the keeper of the whole museum.

Kid: My pappou says these myths are almost three thousand years old, which makes them even older than pizza! Come on, I'll give you the official tour.
> Read the sign by the door -> sign
> Follow Ari to the giant jar -> jar

=== sign
scene: museum-hall
cast: hero, quill:thinking, kid
A large sign hangs beside the door, so you read it out loud.

"The ancient Greeks told stories called myths, which explained the sea, the stars, and even the reasons people behave the way they do. Many English words come from these stories. Whenever you say a word like echo or panic, you are telling a tiny piece of a myth!"

Quill: Hoo! Words with whole stories hidden inside them are my very favorite kind.
> Go see the giant jar -> jar

=== jar
scene: museum-hall
cast: hero, kid:thinking, keeper
In the middle of the room stands an enormous clay jar, which is taller than Ari, and its heavy lid is sealed with crumbly gray wax.

A little card on the jar says: PITHOS. A STORAGE JAR FROM ANCIENT GREECE. SEALED LONG AGO. DO NOT OPEN.

Ari's grandfather, Mr. Doukas, is polishing the glass cases nearby. He has fluffy white hair and a kind, crinkly smile.

Keeper: Look all you like, children, but that lid stays shut, because some jars are sealed for a reason.
> Put your ear to the jar -> listen
> Look closely at the wax seal -> seal

=== seal
scene: museum-hall
cast: hero, kid:thinking, quill
The wax seal is stamped with tiny pictures of a lion with wings, a bull, a winding maze, and a bird with a long, curly tail.

Ari leans so close that his nose almost touches the jar.

Kid: I've wondered what's inside this thing ever since I was five years old, but Pappou never tells me. He just smiles mysteriously and says, "Stories."

Then something inside the jar goes tap, tap, tap.
> Put your ear to the jar -> listen

=== listen
scene: museum-hall
cast: hero, kid:surprised, quill:surprised
You press your ear against the cool clay, and inside you hear tiny voices whispering, like a crowd that is very far away.

"Once upon a time, a hero..."
"And the riddle was..."
"Follow the thread..."

Ari's eyes grow wide, and before you or Quill can stop him, his fingers are already curled around the edge of the lid.

Kid: I'll just take a tiny peek. I won't let anything out, I promise!
> Try to stop Ari -> open
> Call for Mr. Doukas -> open

=== open
scene: museum-hall
cast: hero, kid:scared, stranger:angry
CRACK! The old wax splits apart, and the lid slides off with a clunk.

WHOOSH! A gray, gloomy cloud pours out of the jar and swirls around the ceiling, giggling and hissing at the same time. It has two glowing eyes and a long, drippy hood made of fog.

Stranger: Free at last! Now I will gobble up every old story, and nobody will ever remember them again!

The cloud zooms across the room, and everywhere it passes, the words on the museum signs fade away and leave blank cards behind.
> Watch where the cloud goes -> pandora

=== pandora
scene: museum-hall
cast: hero, quill:sad, kid:sad
Ari stares into the empty jar while Quill lands on its rim and sighs.

Quill: Oh, Ari, I'm afraid you've opened a real Pandora's box.

In the old Greek myth, the gods gave a woman named Pandora a big jar with a lid. Pandora was so curious about what was inside that she lifted the lid. Out flew sickness, sadness and trouble! She slammed the lid shut, but it was too late, and only one thing stayed inside, which was Hope.

Quill: Most people say "box," but the oldest story says it was a jar, just like this one.
? RL.4 : Quill says Ari opened "a real Pandora's box." What does that mean?
+ He started something that caused lots of new trouble.
- He found a box full of treasure and gold.
- He opened a gift that was meant for someone else.
- He solved a puzzle that nobody else could solve.
hint: Think about the myth. What happened when Pandora opened the jar? What happened when Ari opened this jar?
next: hope

=== hope
scene: museum-hall
cast: hero, kid:surprised, quill:thinking
Ari peeks into the jar again, and down at the very bottom, tucked under the lip, something is glowing.

It is a tiny golden light, no bigger than a moth, and when it flutters up, it lands softly on Ari's finger.

Quill: It's just like the old story! The troubles flew away, but Hope stayed inside.

Across the room, a tour guide is staring at a blank sign. "Don't... don't... what's that word for when you suddenly feel scared?" she asks, because she can't remember it anymore.
clue: The gray cloud makes people forget the old stories and the words that come from them.
> Ask Mr. Doukas what to do -> keeper

=== keeper
scene: museum-hall
cast: hero, keeper:sad, kid:sad
Mr. Doukas hurries over, and he doesn't look angry, only worried.

Keeper: That cloud is called the Muddle. Long ago, storytellers trapped it in this jar so that it couldn't eat their stories. When a story is forgotten, the words it gave us are forgotten, too.

Ari's lip wobbles, but he stands up straight and looks his grandfather in the eye.

Kid: This is my fault, Pappou, and I'm sorry I didn't listen. I'm going to fix it, no matter how long it takes.

Keeper: Then follow Hope, because it will lead you to the Land of Old Stories.
clue: Mr. Doukas says the cloud is called the Muddle, and it eats stories.
? RL.1 : Which sentence from the story shows that Ari wants to fix his mistake?
+ "I'm going to fix it, no matter how long it takes."
- "I'll just take a tiny peek."
- "Come on, I'll give you the official tour."
- "I won't let anything out, I promise!"
hint: Read what Ari says to his pappou right after he says he is sorry.
next: ch1-end

=== ch1-end
scene: museum-hall
cast: hero, quill:happy, kid:happy
The little light flutters over to a huge painting on the wall, which shows a white temple on a hill above a deep blue sea.

When Hope touches the painting, the painted waves begin to sparkle and move. Warm air blows out of the frame, and it smells like salt and olive trees.

Quill: Well, readers, I believe we've just been invited inside.

Ari grabs your hand, and together you step through the frame.
? RL.2 : Which sentence best sums up Chapter One?
+ Ari opens a jar, a story-eating cloud escapes, and you chase it.
- Ari and his grandfather paint a new picture for the museum.
- Quill gives a long tour of every room in the City Museum.
- A tour guide loses her map and asks everyone for help.
hint: Think about the biggest events: the jar, the cloud, and where you go at the end.
next: ch2

# ============================================================
# CHAPTER TWO: VOICES, PANPIPES AND GOLD
# ============================================================

=== ch2
scene: temple-ruins
cast: hero, kid:surprised, quill
checkpoint
~ Chapter Two ~

You land on soft, dry grass under a hot sun and a very blue sky. A white temple stands on the hill, although some of its columns have tumbled down.

High above, a long gray streak smears across the sky, and Quill says it must be the Muddle's trail.

Kid: Whoa, we're actually inside the myths! But which way did the Muddle go?

Ari cups his hands around his mouth and shouts, "Hello? Is anybody here?"

A soft voice answers from somewhere among the columns: "...anybody here?"
> Follow the voice -> echo

=== echo
scene: temple-ruins
cast: hero, ghost:sad, quill:thinking
Between two columns, a young woman shimmers in the air. She is so faint that you can see the temple right through her.

Quill: This is Echo. Long ago, she chatted and chatted to keep the goddess Hera busy, so Hera grew angry and punished her. From then on, Echo could only repeat the last words she heard.

Quill: Later, Echo faded away until only her voice was left, and that is why we call a voice that bounces back from a cliff an echo.

Ghost: ...an echo.
> Ask Echo where the cloud went -> echo-ask

=== echo-ask
scene: temple-ruins
cast: hero, ghost:thinking, kid:thinking
Ari tries first, speaking slowly and politely.

Kid: Echo, did the gray cloud fly to the mountains or to the sea?

Ghost: ...to the sea.

Kid: Great! Wait, let me check. Did it fly to the sea or to the mountains?

Ghost: ...to the mountains.

Ari groans, and Echo looks very sorry. Because she can only say the last words she hears, she always gives back the last choice!
? RL.3 : Why can't Echo just tell you where the cloud went?
+ Hera's punishment lets her repeat only the last words she hears.
- She is angry at Ari for opening the jar.
- She did not see the cloud fly past the temple.
- She is too busy talking to Hera to answer.
hint: Look back at what Quill said about Hera and Echo on the page before.
next: echo-plan

=== echo-plan
scene: temple-ruins
cast: hero, ghost:happy, kid:happy
You whisper an idea to Ari. If he says two sentences, one at a time, Echo can decide which one to repeat and which one to skip!

Kid: The cloud flew to the mountains.

Echo stays completely silent.

Kid: The cloud flew into the forest.

Ghost: ...into the forest!

She nods and nods and points down the hill toward a dark green pine forest.

Kid: She can't make her own words, but she can choose which words to give back. Thank you, Echo!

Ghost: ...thank you, Echo.
clue: Echo pointed the way to the pine forest.
> Hurry down to the forest -> forest

=== forest
scene: forest
cast: hero, kid:scared, quill:surprised
The forest is cool and shady, and a herd of goats is napping peacefully under the trees.

Suddenly, an enormous shout booms through the forest: "WHO WOKE ME UP?"

The goats leap up and stampede in every direction, Ari shrieks and dives behind a tree, and your heart pounds like a drum!

Then you hear sweet music, like many little flutes playing at once. Far away, a goat-legged figure is sitting on a rock and playing a set of reed pipes, and with a chuckle, he trots off into the trees.
> Help Ari out from behind the tree -> panic

=== panic
scene: forest
cast: hero, kid:sad, quill:thinking
Ari crawls out from behind the tree, covered in pine needles.

Kid: I was in a total... a total... Ugh! What's the word? I think the Muddle ate it!

Quill: That was Pan, the god of shepherds and wild places. The ancient Greeks said that if you woke Pan from his noon nap, he would give a mighty shout. Flocks would run wild, and people would feel a sudden, wild fear, so they named that feeling after him.

Kid: PANIC! That's the word! I was in a total panic!

Far away, a little puff of gray fog fizzles into nothing.
? RL.4 : The word "panic" comes from the god Pan. What does panic mean?
+ a sudden, wild feeling of fear
- a happy song played on pipes
- a long nap in the middle of the day
- a herd of goats in a forest
hint: Read what Quill says Pan's shout made people feel.
next: river

=== river
scene: mountain-pass
cast: hero, griffin:angry, quill:scared
On the other side of the forest, a river sparkles in the sunshine, and the sand along its banks is shining gold!

On top of a pile of golden apples, golden twigs and golden stones sits a strange creature with the head and wings of an eagle and the body of a lion.

Griffin: SKREEE! Who dares to come to my river? Griffins guard gold, and I guard this gold!

Quill whispers that the ancient Greeks really did tell stories about griffins who guarded gold.
> Bow politely to the griffin -> griffin
> Explain about the Muddle -> griffin

=== griffin
scene: mountain-pass
cast: hero, griffin:sad, kid
The griffin fluffs up her feathers, but then she lets out a long sigh.

Griffin: My name is Goldwing, and this is the river Pactolus. In the old story, a king named Midas was granted one wish by the god Dionysus, and he wished that everything he touched would turn to gold.

Griffin: At first, he loved it, because twigs and stones turned to gold in his hands. But then his bread turned to gold, and his water too, so he could not eat or drink anything at all!

Kid: Yikes! What did he do?
> Listen to the rest of the story -> midas

=== midas
scene: mountain-pass
cast: hero, griffin:happy, kid:happy
Griffin: Midas begged Dionysus to take back the wish, and Dionysus told him to wash in this river. The golden touch flowed out of his hands and into the water, and ever since then, the sand here has sparkled with gold.

Goldwing ruffles her feathers proudly.

Griffin: Today, when someone succeeds at everything they try, people say they have the Midas touch.

Kid: My aunt sells cupcakes, and every bakery she opens becomes a giant hit. She definitely has the Midas touch!
? RL.4 : Ari says his aunt "has the Midas touch." What does he mean?
+ Everything she tries turns into a big success.
- She can turn cupcakes into real gold.
- She is a queen who lives near a river.
- She never lets anyone touch her things.
hint: Read what Goldwing says people mean today. Then think about Ari's aunt and her bakeries.
next: ch2-end

=== ch2-end
scene: mountain-pass
cast: hero, griffin:happy, quill
Goldwing spreads her great wings wide.

Griffin: The Muddle flew over my river an hour ago, heading for the Sphinx's cliff beside the labyrinth. Climb on, all of you, and I will carry you there.

You climb onto her warm, feathery back, Ari sits behind you, and Quill rides on your shoulder. Then, with one mighty flap, you swoop into the sky.
clue: Goldwing says the Muddle flew toward the Sphinx's cliff and the labyrinth.
? RL.2 : Which sentence best sums up Chapter Two?
+ You learn the myths of Echo, Pan and Midas as you follow the Muddle.
- You stay at the temple and help Echo find her lost voice.
- A griffin steals the golden apples and flies away with them.
- Ari decides to go home because the forest is too scary.
hint: Think about the three myths you heard in this chapter, and what you did after each one.
next: ch3

# ============================================================
# CHAPTER THREE: RIDDLE, MAZE AND MUDDLE
# ============================================================

=== ch3
scene: temple-ruins
cast: hero, sphinx:happy, quill
checkpoint
~ Chapter Three ~

Goldwing lands on a rocky cliff and waves goodbye with the tip of her wing.

A creature is stretched out in the sun beside a stone doorway. She has a lion's body, a woman's face, and feathery wings, which means she must be a sphinx!

Sphinx: Visitors, how lovely! Nobody may pass my cliff without answering a riddle. But don't worry, because I'm not a scary sphinx. If you get it wrong, I simply make you sit and think until you get it right.
> Say you are ready for a riddle -> riddle

=== riddle
scene: temple-ruins
cast: hero, sphinx:thinking, kid:thinking
Sphinx: My famous great-aunt lived near the city of Thebes, where she asked travelers a riddle. Only one young man, named Oedipus, ever solved it. Here it is:

Sphinx: "What walks on four legs in the morning, on two legs at noon, and on three legs in the evening?"

Ari scratches his head for a moment, and then he grins.

Kid: A person! A baby crawls on hands and knees, a grown-up walks on two legs, and an old person walks with a cane, so that makes three!

Sphinx: Correct! In the riddle, one day is like a whole life.
? L.5 : In the riddle, a whole life is compared to one day. What does "evening" stand for?
+ old age
- being a baby
- lunchtime
- going to sleep at night
hint: Ari explains the riddle. Who walks on three legs, with a cane?
next: riddle2

=== riddle2
scene: temple-ruins
cast: hero, sphinx:happy, quill:thinking
Sphinx: That was my great-aunt's riddle, and now here is mine.

Sphinx: "The more of me you take, the more of me you leave behind. What am I?"

Quill puffs out her feathers and turns to you with a twinkle in her eye.

Quill: This one is yours, reader. Think about what happens when you go for a walk.
> Footsteps -> riddle-right
> Cookies -> riddle-wrong
> Time -> riddle-wrong

=== riddle-wrong
scene: temple-ruins
cast: hero, sphinx:thinking, kid:thinking
The sphinx shakes her head, but she is still smiling.

Sphinx: Not quite! Sit and think for a moment.

Ari whispers a hint in your ear. He takes thousands of them every time he walks to school, and every time he takes one, he leaves one behind him on the path.
> Answer: footsteps -> riddle-right

=== riddle-right
scene: temple-ruins
cast: hero, sphinx:happy, kid:happy
Sphinx: Footsteps! Each step you take leaves a footprint behind you. Very good!

She points her tail toward the stone doorway in the hillside.

Sphinx: The Muddle went into the labyrinth. In the old myth, a clever builder named Daedalus made the first labyrinth for King Minos on the island of Crete, and it was so twisty that nobody could find the way out. This one is a copy of it, made of old stories. But be careful, because the Muddle has blocked the door.
> Go to the labyrinth door -> boulders

=== boulders
scene: labyrinth
cast: hero, kid:sad, quill:thinking
The doorway is piled high with mud, sand and heavy stones.

Kid: Moving all of this would be a herculean job.

Quill: Speaking of Heracles! The Romans called him Hercules, and he was the strongest hero in all the myths. One of his twelve labors was to clean King Augeas's stables in a single day, even though thousands of cattle had made a mountain of mess. So Heracles dug trenches and turned two rivers so they flowed right through the stables, and the water washed them clean!
? RL.4 : Ari calls the job "herculean." What does herculean mean?
+ needing great strength and effort
- very small and easy
- full of rivers and water
- dirty and smelly
hint: Think about Heracles, the strongest hero. What kind of job did he do in one day?
next: stream

=== stream
scene: labyrinth
cast: hero, kid:happy, quill:happy
You look around and notice a little stream trickling down the hill beside the door.

Kid: We're not as strong as Heracles, but we can be just as clever!

You and Ari dig a small trench with flat rocks, and then you push one big stone into the stream. The water turns, gurgles, and rushes along your trench, and it washes the mud and sand right out of the doorway!

Inside the door, hanging on a hook, is a big ball of bright red thread.
> Take the ball of thread -> thread

=== thread
scene: labyrinth
cast: hero, quill:thinking, kid
Quill: In the old myth, the princess Ariadne gave the hero Theseus a ball of thread. He tied one end at the door and unrolled it as he walked, and when he wanted to leave, he followed the thread back out.

Quill: In old English, a ball of thread was called a clew. Because a clew helped people solve a maze, it slowly turned into our word clue!

Kid: So every clue is like a little piece of thread that leads you somewhere. Cool!

You tie the end of the thread tightly to the doorpost.
> Walk into the labyrinth -> maze

=== maze
scene: labyrinth
cast: hero, minotaur:sad, kid:scared
You unroll the thread as you walk, while the labyrinth turns left, then right, then left again, and torches flicker on the stone walls.

Then you hear a sad, snuffly sound. A young minotaur is sitting in a corner, with a calf's head, two small horns, and a blue tunic, and she is holding a red flower.

Minotaur: Hello? I'm Clover. The gray cloud blew through here, and now I can't remember the way out! I've been lost for hours and hours.
> Tell Clover not to worry -> clover
> Offer her your thread -> clover

=== clover
scene: labyrinth
cast: hero, minotaur:happy, kid:happy
Ari shows Clover the red thread.

Kid: We tied this at the door, so when we're finished, we can just follow it back out.

Clover's ears perk up happily.

Minotaur: The cloud is in the middle of the maze, eating the stories off the walls. Follow me!

Clover leads you deeper and deeper, and at the very last turn, you see the Muddle. It has grown huge, and it is slurping the pictures off the walls like spaghetti.
clue: Clover the minotaur leads you to the Muddle in the middle of the maze.
? RL.5 order : Put these events from the story in the order they happened.
1 You and Ari turn the stream to wash the doorway clean.
2 You tie the thread to the doorpost.
3 You find Clover crying in a corner of the maze.
4 Clover leads you to the Muddle in the middle.
hint: Think back through Chapter Three. The doorway was blocked before you could get inside.
next: muddle

=== muddle
scene: labyrinth
cast: hero, stranger:angry, quill:scared
The Muddle spins around to face you.

Stranger: More visitors? Wonderful! More stories for me to swallow!

It puffs itself up taller, but you notice something interesting. When it floats over a picture of Echo, it shrinks a little, and when it passes Pan's pipes, it shrinks again. Those are the stories you remembered!

Quill: Look! Every story we remember makes it smaller. It's made of forgetting, so remembering is its weak spot. That's its Achilles' heel!
> Ask Quill what an Achilles' heel is -> heel

=== heel
scene: labyrinth
cast: hero, quill:thinking, kid:thinking
Quill: Achilles was a great Greek hero. In a story told later by a Roman poet, his mother dipped him in a magic river when he was a baby, and the water made him almost impossible to hurt. But she held him by his heel, so the heel never got wet, and that one spot was his only weakness.

Kid: So an Achilles' heel is the one spot where something strong can be beaten!

Quill: Exactly! So let's start remembering, all together!
? RL.4 : Quill says remembering is the Muddle's Achilles' heel. What is an Achilles' heel?
+ a weak spot in something that is otherwise strong
- a kind of shoe that heroes wear in battle
- a very fast way to run away from danger
- a river that makes people strong
hint: Read what Ari says about Achilles' heel right after Quill tells the story.
next: remember

=== remember
scene: labyrinth
cast: hero, kid:happy, minotaur:happy
You all take turns telling the stories as loudly as you can. Ari tells about Pandora's jar, you tell how Echo can only repeat the last words she hears, Quill describes Pan's shout and the Midas touch, and Clover stamps her hooves and tells about Heracles and the rivers.

With every story, the Muddle shrinks, first to the size of a car, then a cat, and finally a cotton ball!

Kid: Quick, Hope, let's take it home!

The little golden light swoops around the Muddle and tugs it along like a puppy on a leash.
> Follow the thread out of the maze -> theme

=== theme
scene: labyrinth
cast: hero, quill:happy, kid:happy
You follow the red thread back through every twist and turn, while Clover trots happily behind you.

At the door, Ari stops and looks down at the tiny gray puff.

Kid: You know what? I made a big mistake today, but I didn't run away from it. I said sorry, and then I worked hard to fix it, with help from my friends.

Quill: Hoo! That lesson is worth more than all of Goldwing's gold.
? RL.2 : Which sentence best states a theme, or big lesson, of this story?
+ When you make a mistake, own it and work hard to fix it.
- Never visit a museum on a field trip.
- Gold is the most important thing in the world.
- It is always best to work alone.
hint: Read what Ari says at the door. What did he do after his mistake?
next: finale

=== finale
scene: temple-ruins
cast: hero, minotaur:happy, griffin:happy
Outside, Goldwing is waiting on the hill, and Clover hugs everyone goodbye.

Minotaur: Thank you for finding me! Please come back and visit the labyrinth someday.

The museum painting shimmers in the air like an open window, and on the other side, you can see Mr. Doukas waving.

Hope hovers in front of Ari with the little Muddle on its leash, and it blinks, as if it is waiting for something.
> Carry the Muddle back to the jar -> end-jar
> Ride Goldwing home over the sea -> end-ride
> Ask the little light its name -> name

=== end-jar
scene: museum-hall
cast: hero, keeper:happy, kid:happy
You step back into the museum, where Hope tucks the tiny Muddle into the jar and Mr. Doukas presses the lid down tight.

All around the room, the words come floating back onto the signs: echo, panic, herculean, clue.

The tour guide snaps her fingers. "Don't panic! That was the word!"

Ari makes a brand-new card for the jar, which says: THE JAR OF LOST STORIES. PLEASE REMEMBER THEM.

Keeper: Well done, my brave story keepers.
end: win Keepers of the Old Stories

=== end-ride
scene: beach
cast: hero, griffin:happy, kid:happy
You climb onto Goldwing's back one more time, and she swoops over the sparkling sea, past little white islands and bobbing fishing boats.

Kid: This trip has been a real odyssey!

Quill explains that the hero Odysseus spent ten long years sailing home after a war, so now any long journey full of adventures is called an odyssey.

Goldwing glides gently through the painting and lands in the museum, just in time for the field trip bus.
end: win A Griffin's Odyssey

=== name
scene: temple-ruins
cast: hero, kid:thinking, quill:happy
Ari holds out his finger, and the little light lands on it.

Kid: What's your name, little light?

The light glows brighter, and a tiny voice, like a silver bell, answers: "Elpis."

Quill: Elpis is the Greek word for hope. In the old story, Hope stayed in Pandora's jar, but maybe Hope doesn't want to stay in a jar forever.
> Let Elpis choose where to go -> end-secret

=== end-secret
scene: museum-hall
cast: hero, kid:happy, keeper:happy
Back in the museum, Elpis tucks the Muddle into the jar, and Mr. Doukas seals the lid. But Elpis doesn't go back inside.

Instead, the little light flutters out the open window and sparkles above the rooftops of the city.

That night, people all across town feel a little bit braver. A girl tries out for the soccer team, a grandpa signs up for an art class, and Ari decides to write down every myth his pappou knows, so that they will never be lost again.
end: secret Hope Flies Free
