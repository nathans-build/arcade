title: The Case of the Silent Bell
author: SpiderBen10's Arcade
genre: mystery
band: 4-5
cover: museum-hall
blurb: The town's golden bell vanished the night before the festival. Follow the clues and help it ring again!
start: start

# ============================================================
# CHAPTER 1: The Empty Case
# ============================================================

=== start
scene: library
cast: hero, quill:surprised
checkpoint
~ Chapter One ~

It is a rainy evening in the Arcade Library, and raindrops tap on the round windows. Suddenly, a folded paper bird flutters down from the ceiling and lands right on top of your book.

Quill hops over and unfolds it with the tip of one wing.

Quill: Oh, my feathers! This is a letter from Mayor Alvarez of Maple Hollow, and it says the Harvest Bell is missing!

Every year, that golden bell rings to open the town festival. This year, the festival starts tomorrow at noon.
> Read the whole letter -> note
> Fly to the museum right away -> museum

=== note
scene: library
cast: hero, quill:thinking
Quill smooths the letter flat on the table. The handwriting is loopy and rushed, as if the Mayor wrote it while running down the street.

"Dear Quill, the Harvest Bell was in its glass case at eight o'clock last night, but this morning the case was empty. Nothing was broken, and the museum door was still locked. I am completely baffled. I have no idea how it happened or who could have taken it. Please come quickly!"
? L.4 : The Mayor says she is "completely baffled." What does baffled mean?
+ confused and unable to understand something
- angry and ready to yell at someone
- sleepy and ready for bed
- happy and full of energy
hint: Read the very next sentence in the letter. The Mayor says, "I have no idea how it happened."
next: museum

=== museum
scene: museum-hall
cast: quill, mayor:sad, keeper:scared
The Maple Hollow Museum is tall and echoey, and your footsteps bounce off the marble floor. In the middle of the great hall stands an empty glass case.

Mayor: The door was locked and the glass isn't broken, so how can a heavy bell just disappear?

Beside her, the old museum keeper, Mr. Pell, is twisting his cap in his hands. He has a fresh white bandage wrapped around his thumb.

Keeper: I locked up at eight o'clock and went straight home. I didn't see a thing.
clue: Mr. Pell said, "I locked up at eight o'clock and went straight home."
clue: Mr. Pell has a fresh bandage on his thumb.
> Examine the empty glass case -> case
> Follow the muddy paw prints -> paws
> Ask Mr. Pell about his thumb -> thumb

=== case
scene: museum-hall
cast: hero, quill:thinking
You press your nose close to the glass and look inside. The case is spotless, and the velvet stand still has a round dent where the bell used to sit.

When you sniff the air, you notice something surprising. The whole case smells like fresh lemon polish.

Quill: Only someone with a key could open this case, and somebody polished it very recently.

Near the bottom of the stand, you spot a thin, dark scratch, as if something heavy slipped and banged against the wood.
clue: The empty case smells like fresh lemon polish.
clue: A scratch on the stand looks like something heavy slipped.
> Find the night guard -> guard
> Search for clues by the window -> window

=== paws
scene: museum-hall
cast: hero, quill, cat:happy
A trail of small, muddy paw prints crosses the shiny floor. You follow them past a dinosaur skeleton and a suit of armor until the trail finally stops.

There sits a fluffy orange cat, licking her paw very proudly.

Quill: That's Biscuit, the museum cat. But could a cat really carry off a golden bell?

Biscuit yawns a giant yawn. The bell weighs as much as a big dog, and besides, her prints lead to an open window instead of to the case.
clue: Biscuit the cat's paw prints lead to a window, not to the bell's case.
> Look out the open window -> window
> Find the night guard -> guard

=== window
scene: museum-hall
cast: hero, quill:surprised, cat
You lean out the open window. Below is the museum garden, and a squashed daisy in the muddy flower bed shows exactly where Biscuit landed.

Then you spot something else in the mud. It is a small, torn scrap of paper, so you fish it out with a stick.

The scrap is part of a pencil drawing of the Harvest Bell, with a tiny star drawn on its bottom edge.

Quill: A star? I have seen that bell a hundred times, and I never noticed a star!
clue: A torn sketch shows a tiny star on the bottom edge of the bell.
> Find the night guard -> guard

=== thumb
scene: museum-hall
cast: hero, quill, keeper:scared
You point politely at the bandage on Mr. Pell's thumb and ask how he hurt it.

Keeper: Oh, this? I, um, cut it on a... on a can of soup. Yes, that's right, it was soup.

His ears turn bright pink. He looks at the floor, then at the ceiling, and then at the floor again. Finally, he mumbles something about sweeping the stairs and hurries away with his broom.

Quill: Most people don't have to think that hard about soup.
? RL.3 : What do Mr. Pell's actions show about how he feels?
+ He is nervous about your question.
- He is proud of his soup.
- He is bored and wants a nap.
- He is angry at the Mayor.
hint: Look at what he does. His ears turn pink, he can't look at you, and he hurries away.
next: guard

=== guard
scene: museum-hall
cast: hero, quill, guard:thinking
Officer Dana Brooks, the night guard, flips open her little notebook and reads it out loud.

Guard: At a quarter to eight, a person in a hooded cloak sat by the case, drawing the bell in a sketchbook. They left when the museum closed.

She taps her pencil on the page.

Guard: Then, at nine thirty, I saw Mr. Pell leave by the back door. He was carrying a lumpy sack, and it looked very heavy.

Quill's feathers puff up like a pillow.
clue: The guard saw Mr. Pell leave at nine thirty with a heavy sack.
clue: A hooded stranger was drawing the bell at a quarter to eight.
? RL.1 : The guard saw Mr. Pell leave at nine thirty. Which quote does that prove untrue?
+ Mr. Pell: "I locked up at eight o'clock and went straight home."
- Mr. Pell: "I didn't see a thing."
- The guard: "They left when the museum closed."
- The guard: "It looked very heavy."
hint: The guard saw Mr. Pell at nine thirty. What time did Mr. Pell say he went home?
next: ch1-end

=== ch1-end
scene: museum-hall
cast: hero, quill:thinking
The museum clock bongs six times. Quill perches on the empty case and counts the clues on her feathers.

Quill: Let's review what we know. The bell vanished from a locked case, and nothing was broken. Mr. Pell said he went home at eight o'clock, but the guard saw him leave at nine thirty with a heavy sack. And a hooded stranger was drawing the bell that evening.

You nod slowly. There are still many questions, but now you know where to start looking.
? RL.2 : Which sentence best sums up Chapter 1?
+ The bell vanished, and the clues point to Mr. Pell and a stranger.
- The Mayor hid the bell to play a funny trick on the town.
- The guard broke the glass case and took the bell home.
- The bell was found safe and sound in the museum garden.
hint: Listen to Quill's review. Which answer includes the most important clues?
next: ch2

# ============================================================
# CHAPTER 2: Three Trails
# ============================================================

=== ch2
scene: city-street
cast: hero, quill
checkpoint
~ Chapter Two ~

The next morning, Maple Hollow is bustling with people getting ready for the festival. They hang paper lanterns across the street, and a band practices on the corner, a little off key. Everyone keeps asking the same question: "Where is the bell?"

The festival starts at noon, which gives you only a few hours.

Quill: We have three trails to follow, but we only have time for one. Which trail should we choose?
> Track down the hooded artist -> artist
> Visit Mr. Pell's cottage -> cottage
> Search the museum storeroom -> storeroom

=== artist
scene: village
cast: hero, quill, stranger
You find the hooded figure on a bench in Willow Park, tossing crumbs to a crowd of hungry pigeons. When you walk up, she pushes back her hood. She is a young woman with a smudge of blue paint on her nose.

Stranger: My name is June, and I travel from town to town drawing old treasures. That bell is the loveliest thing I've ever drawn, so I would never take it!

Quill: Then maybe you noticed something that can help us.
> Ask what she saw last night -> artist-saw
> Ask to see her sketchbook -> artist-sketch

=== artist-saw
scene: village
cast: hero, quill, stranger:thinking
June taps her chin thoughtfully with a pencil.

Stranger: After the museum closed, I sat in the café across the street, because I like to draw the building at night when the windows glow.

Stranger: At about nine thirty, the old keeper came out the back door. He was walking quickly, as if he were late for something important, and he had a big sack on his back.

Quill: Did you happen to see where he went?

June smiles and reaches for her sketchbook.
> Look at her sketchbook -> artist-sketch

=== artist-sketch
scene: village
cast: hero, quill:surprised, stranger:happy
June flips through the pages, where the bell is drawn from every side. Along its bottom edge, she has drawn a tiny star.

Stranger: I tore one page by accident last night. That little star is carved into the bell, but almost nobody notices it.

The last page is a quick drawing of Mr. Pell on Clockmaker Lane. The sack hangs from his back like a sleeping bear cub, and he is walking into a shop called Fenwick's Metal Mending.
clue: June saw a tiny star carved on the bottom edge of the bell.
clue: June's drawing shows Mr. Pell carrying the sack into Fenwick's Metal Mending.
? L.5 : The sack "hangs from his back like a sleeping bear cub." What does this simile tell you?
+ The sack was big, round, and heavy.
- The sack had a real bear cub inside.
- The sack was light and fluffy.
- Mr. Pell was sleepy on the walk.
hint: A simile compares two things using "like." How would it feel to carry a sleeping bear cub?
next: ch2-end

=== cottage
scene: village
cast: hero, quill, kid
Mr. Pell's cottage has a green door and a garden full of bright orange pumpkins. The curtains are closed, and nobody answers when you knock.

A girl with a skateboard rolls up the sidewalk and stops beside you.

Kid: Are you looking for Mr. Pell? I'm Rosa, and I live next door. He left super early this morning, before the sun was even up.

Quill: Did he say where he was going?

Rosa shrugs, but then she points toward the garden shed.
> Ask Rosa what else she saw -> cottage-rosa
> Peek inside the garden shed -> cottage-shed

=== cottage-rosa
scene: village
cast: hero, quill, kid:thinking
Rosa flips her skateboard up with her toe and catches it.

Kid: Last night he came home really late, because I heard his gate squeak at almost ten o'clock. When I looked out my window, he was carrying a big sack, and he looked really worried.

Kid: This morning, he went back out with the same sack and walked toward Clockmaker Lane. That's the street where all the fix-it shops are.

Quill: Thank you, Rosa. You have wonderfully sharp eyes!
> Peek inside the garden shed -> cottage-shed

=== cottage-shed
scene: village
cast: hero, quill:thinking
The shed door is open a crack. Inside, you find a workbench, a jar of lemon polish, and a to-do list in shaky handwriting.

"Take bell to Fenwick's Metal Mending. Fix crack by 11:30. Fixing it in one night will be a Herculean task!"

Quill: Hercules was a hero in the myths of ancient Greece. He was famous for his amazing strength, and he finished twelve jobs that seemed impossible for anyone else.
clue: Mr. Pell's list says, "Take bell to Fenwick's Metal Mending. Fix crack by 11:30."
? RL.4 : Mr. Pell writes that fixing the bell will be "a Herculean task." What does he mean?
+ It is a job that takes huge strength and effort.
- It is a job that must be done by someone from Greece.
- It is a job that is quick and easy.
- It is a job that is very silly.
hint: Quill explained that Hercules finished jobs that seemed impossible for anyone else.
next: ch2-end

=== storeroom
scene: museum-vault
cast: hero, quill, guard
Officer Brooks unlocks the museum storeroom for you. It is dim and dusty, with old paintings leaning against the walls and a stuffed moose staring at you with glass eyes.

Guard: Mr. Pell keeps his desk back here. Don't mind the moose, because his name is Gerald and he's very friendly.

Quill: Good morning, Gerald.

In one corner is a tall wooden box labeled "HARVEST BELL, 1850." On the other side of the room sits a tidy little desk.
> Open the old wooden box -> storeroom-box
> Check Mr. Pell's desk -> storeroom-desk

=== storeroom-box
scene: museum-vault
cast: hero, quill:surprised
Inside the box is an old photograph of a woman in a long dress, standing proudly next to the Harvest Bell.

Under the photo, someone has written: "Hazel Maple, founder of Maple Hollow, with her new bell. Look for the star."

When you look closer at the photograph, you can see a tiny star carved on the bottom edge of the bell.

Quill: Look for the star? That sounds like a message from long, long ago.
clue: An old photo says, "Hazel Maple, founder of Maple Hollow, with her new bell. Look for the star."
> Check Mr. Pell's desk -> storeroom-desk

=== storeroom-desk
scene: museum-vault
cast: hero, quill:thinking
On Mr. Pell's desk sits a telephone and a pad of paper. The top page has a message in his neat handwriting.

"Ms. Fenwick of Fenwick's Metal Mending called back. She can repair the crack, so bring the bell to her shop on Clockmaker Lane. It will be ready by 11:30."

Quill: A crack? So the bell is broken! We should write this important clue in our case book, using a complete sentence.

Quill hands you a set of word tiles.
clue: A phone message says Fenwick's Metal Mending can fix the bell's crack by 11:30.
? L.1 order : Build a correct sentence from the word tiles.
1 Last night,
2 Mr. Pell carried
3 the cracked bell
4 to Fenwick's shop.
hint: The time words with a comma come first. Then say who did it and what he did. The tile with a period comes last.
next: ch2-end

=== ch2-end
scene: city-street
cast: hero, quill:happy
You hurry back to the town square, where the big clock says ten forty-five. Quill lands on your shoulder, flapping with excitement.

Quill: Every trail leads to the same place, a shop called Fenwick's Metal Mending on Clockmaker Lane!

You think about everything you discovered. Mr. Pell did take the bell, but it looks like he was trying to fix something, not steal something.

Quill: A good detective follows the clues instead of guessing, so let's go!
? RL.2 : Which sentence best sums up Chapter 2?
+ The clues showed that Mr. Pell took the bell to a fix-it shop.
- June the artist admitted that she took the bell.
- Mr. Pell took the bell and left town on a train.
- The bell was found hidden in the museum storeroom.
hint: Quill says every trail leads to the same place. Which answer names that place?
next: ch3

# ============================================================
# CHAPTER 3: The Truth Rings Out
# ============================================================

=== ch3
scene: city-street
cast: hero, quill
checkpoint
~ Chapter Three ~

Clockmaker Lane is a crooked little street full of tiny shops, and clocks tick in every window. At the very end is a shop with a sign shaped like a hammer: Fenwick's Metal Mending.

From inside, you hear a loud CLANG, followed by a hiss of steam.

Quill: It's eleven o'clock, and the festival starts in one hour. Let's be careful and kind in there.
> Knock on the front door -> shop-front
> Peek through the back window -> shop-back

=== shop-front
scene: city-street
cast: hero, quill, scientist:surprised
The door swings open, and a tall woman in goggles and a dusty lab coat peers down at you.

Scientist: I'm Ms. Fenwick. If you've come about a broken teapot, you'll have to wait, because I'm extremely busy today.

Quill: We've come about a bell. A golden one.

Ms. Fenwick's eyebrows shoot up above her goggles. She glances over her shoulder, sighs, and opens the door wide.

Scientist: I suppose you'd better come in, then.
> Follow her into the workshop -> workshop

=== shop-back
scene: city-street
cast: hero, quill:surprised
You tiptoe around the side of the shop. The back window is foggy with steam, so you wipe a little circle clean with your sleeve.

On a big workbench inside sits the Harvest Bell! A long crack runs down one side, but now it is filled with shiny new metal.

Mr. Pell stands beside it, nervously twisting his cap, and his bandaged thumb sticks out like a tiny flag.

Quill: We found it! Let's go in through the back door, gently.
> Slip in through the back door -> workshop

=== workshop
scene: lab
cast: hero, keeper:scared, scientist
The workshop is hot and smells like metal, and sparks glow in a little furnace. On the workbench sits the Harvest Bell, with a shiny line where a crack has been patched.

When Mr. Pell turns around and sees you, his face goes as white as a sheet of paper.

Keeper: Oh dear, oh dear. I suppose you've discovered my secret.

Ms. Fenwick crosses her arms and gives Mr. Pell a long look.

Scientist: Pell, I think it's time you told everyone the truth.
> Ask Mr. Pell kindly what happened -> pell-story
> Call the Mayor to come here first -> mayor-comes

=== mayor-comes
scene: lab
cast: hero, mayor:surprised, keeper:sad
You call the Mayor, and five minutes later she bursts through the door, out of breath, with her festival sash all crooked.

Mayor: The bell! Oh, thank goodness it's safe! But Mr. Pell, why in the world is it here?

Mr. Pell's shoulders droop, and he stares at his shoes for a long time.

Keeper: I'm very sorry, Mayor. I should have told you right away, but I was too embarrassed.

The Mayor pulls up a stool and sits down beside him.

Mayor: Then please tell us now.
> Listen to Mr. Pell's story -> pell-story

=== pell-story
scene: lab
cast: hero, quill, keeper:sad
Mr. Pell takes a deep breath before he begins.

Keeper: I wanted the bell to shine for the festival, so I stayed late to polish it with my lemon polish. But my hands were slippery, and the bell slid right off the stand! It banged the wood and cracked, and I cut my thumb trying to catch it.

Keeper: I was so ashamed that I put the bell in a sack and brought it here to be repaired. I hoped nobody would ever know.
? RL.6 : Who is telling what happened on this page, and how can you tell?
+ Mr. Pell tells it himself, using words like "I" and "my."
- Quill tells it, because Quill is a wise owl.
- The Mayor tells it, using words like "she" and "her."
- You tell it, because you found the bell.
hint: Look at the words the speaker uses: "I wanted," "my hands," "I was so ashamed." Whose story is it?
next: pell-order

=== pell-order
scene: lab
cast: hero, quill:thinking, scientist
Ms. Fenwick taps the bell with a tiny hammer, and it makes a soft, sad little tink.

Scientist: I patched the crack last night, and the patch is strong now. But the metal is still warm, and the bell won't ring its best until it cools.

Quill: Now we know the whole story. Let's put Mr. Pell's night in order, so we can explain it clearly to the town.

The clock on the wall ticks loudly. It is already eleven twenty.
? RL.5 order : Put the events of Mr. Pell's night in the order they happened.
1 Mr. Pell polished the bell with lemon polish.
2 The bell slipped off the stand and cracked.
3 He carried the bell out in a heavy sack.
4 Ms. Fenwick patched the crack in her shop.
hint: Think back to Mr. Pell's story. What was he doing first? What made the bell crack?
next: fix

=== fix
scene: lab
cast: hero, quill:happy, keeper
Mr. Pell wipes his eyes with his cap.

Keeper: I thought hiding my mistake would make things better, but it only made the whole town worry. I should have told the truth from the start.

Quill: Everyone makes mistakes, Mr. Pell, even wise old owls. What matters most is what you do next.

Mr. Pell stands up a little straighter, and he even smiles a tiny, hopeful smile.

Keeper: Then next, I'll tell everyone the truth.
? RL.2 : What is the theme, or big lesson, of this story?
+ It is better to admit a mistake than to hide it.
- Never polish anything that is made of gold.
- Cats are the best detectives in any town.
- Always go to bed before eight o'clock.
hint: Read what Mr. Pell says: "I should have told the truth from the start."
next: ready

=== ready
scene: lab
cast: hero, quill, keeper:happy
Ms. Fenwick pours a bucket of cool water over the bell, and steam puffs up like a little cloud. Now the bell is finally ready!

Mr. Pell and Ms. Fenwick lift it onto a wagon. The clock says eleven thirty, which is just enough time to reach the square.

As the wagon tips, you catch a glimpse of the bottom edge of the bell. Something tiny is carved there, and it is shaped like a star.
> Pull the wagon to the town square -> square
> Look closely at the tiny star -> star

=== square
scene: village
cast: hero, mayor:happy, keeper
The town square is packed with people. When they see the bell rolling in on the wagon, everybody cheers, and the band plays a very loud, very happy song.

The Mayor climbs onto the stage and waves her arms for quiet.

Mayor: Friends, our bell is back! Now, who should ring it to open the festival?

Mr. Pell twists his cap and looks out at the crowd. Then he turns and looks at you.
> Let Mr. Pell tell the truth and ring it -> end-truth
> Ring it together with Quill -> end-badge

=== end-truth
scene: village
cast: hero, quill:happy, keeper:happy
Mr. Pell steps up to the bell. His voice shakes at first, but he tells the whole town exactly what happened.

Nobody boos. Instead, a baker in the front row shouts, "We all drop things sometimes, Mr. Pell!" Everyone laughs, and then the whole crowd claps and cheers for him.

Mr. Pell pulls the rope. BONG! The bell's voice rolls over the rooftops and across the hills, clear and bright and beautiful.

Quill: You solved the case, and you helped a friend be brave. That's real detective work.
end: win The Bell Rings True

=== end-badge
scene: village
cast: hero, quill:happy, mayor:happy
You and Quill grab the rope together and pull with all your might. BONG! The sound is so loud that the pigeons fly up in a swirl.

The Mayor pins a shiny badge on your shirt that says "Maple Hollow Junior Detective."

Mayor: You followed the clues and treated everyone kindly, and that's the best kind of detective.

Later, Mr. Pell tells everyone the truth, and the town forgives him with a giant plate of pumpkin cookies.
end: win Maple Hollow's Newest Detective

=== star
scene: lab
cast: hero, quill:surprised, keeper:surprised
You kneel down to look at the star. It isn't just a carving, because it sticks out a tiny bit, like a button.

Quill: Look for the star! Could this be a secret message from long ago?

Carefully, you press it. Click! A narrow drawer slides out of the bell's thick rim, and inside is a rolled-up paper tied with faded ribbon.

Keeper: I've cared for this bell for forty years, and I never knew about this!
> Unroll the old paper -> star-map

=== star-map
scene: lab
cast: hero, quill:happy, keeper:surprised
The paper is thin and yellow, and the writing is in curly old ink.

"To whoever finds this: I buried a time capsule beneath the great oak in the town square. Open it at the festival, and share it with everyone. Signed, Hazel Maple, 1850."

Quill hoots so loudly that Ms. Fenwick drops her hammer with a clatter.

Quill: A time capsule from the founder of the town! We have to show everyone right away!
> Race to the oak tree in the square -> end-secret

=== end-secret
scene: village
cast: hero, quill:happy, mayor:surprised
First, Mr. Pell tells the town the truth, and everyone forgives him. Then he rings the bell, and it echoes across the valley.

Next, you lead the whole crowd to the great oak. The Mayor digs and digs until her shovel clanks against a metal box.

Inside are old letters, a wooden toy train, and a drawing of the bell with its star. One letter says, "Be honest, be kind, and ring the bell together."

Quill: You noticed the smallest clue of all. Well done, detective!
end: secret The Founder's Time Capsule
