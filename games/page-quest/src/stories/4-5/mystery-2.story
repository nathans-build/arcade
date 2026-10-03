title: The Case of the Vanishing Waffles
author: SpiderBen10's Arcade
genre: mystery
band: 4-5
cover: village
blurb: Waffles the cat is missing from Juniper Street! Follow paw prints, a jingly bell and a grumpy neighbor to find her.
start: start

# ============================================================
# CHAPTER 1: No Waffles for Breakfast
# ============================================================

=== start
scene: library
cast: hero, quill:surprised, kid:sad
checkpoint
~ Chapter One ~

It is a sunny Saturday morning in the Arcade Library, and you are reading a joke book when the front door bangs open. A girl rushes in, holding a stack of paper posters, and her eyes are red from crying.

Kid: Please help me! My name is Lulu Park, and my cat, Waffles, has disappeared!

Quill flutters down from the top shelf and lands softly beside her.

Quill: A missing cat? Then this is a job for detectives. Take a deep breath, Lulu, and tell us everything you remember.
> Read one of Lulu's posters -> poster
> Ask Lulu what happened -> lulu

=== poster
scene: library
cast: hero, quill:thinking, kid:sad
Lulu hands you a poster. The ink is still a little smudgy.

"MISSING CAT! Her name is Waffles, and she is orange, with a cream chest and four white socks. She wears a red collar with a little silver bell. Waffles is very affectionate. She purrs, rubs against your legs, and climbs into your lap for hugs. If you see her, please call Lulu on Juniper Street."

Quill: A cat with a bell! If she is nearby, we might hear her before we see her.
? L.4 : The poster says Waffles is "affectionate." What does affectionate mean?
+ loving and friendly
- shy and scared
- fast and sneaky
- grumpy and bossy
hint: Read the next sentence on the poster. Waffles purrs, rubs against your legs, and climbs into your lap for hugs.
next: lulu

=== lulu
scene: library
cast: hero, quill:thinking, kid:thinking
Lulu wipes her nose on her sleeve.

Kid: Every morning, Waffles walks me to the corner by Larkspur School, and then she trots home again. She did that on Friday, too, but she didn't come home for dinner, and she wasn't there for breakfast today. Waffles NEVER misses breakfast!

Kid: She has been acting so strange lately. She eats twice as much as usual, she sleeps all day, and she got as round as a pumpkin! She keeps stealing soft things, like my fuzzy socks and a dish towel.
clue: Waffles has been eating more, sleeping a lot, and stealing soft things.
? L.5 : Lulu says Waffles "got as round as a pumpkin." What does this simile tell you?
+ Waffles has gotten much bigger and rounder.
- Waffles has turned orange like a pumpkin.
- Waffles likes to sleep in pumpkin patches.
- Waffles is as small as a seed.
hint: A simile uses "like" or "as" to compare two things. Think about the shape of a pumpkin. Lulu also says Waffles eats twice as much.
next: street

=== street
scene: village
cast: hero, quill, kid
You and Quill follow Lulu to Juniper Street, which is a friendly little street with blue and yellow houses, a mailbox shaped like a fish, and a community garden full of sunflowers.

Lulu's house is the yellow one with a porch swing. Next door, an old man in a green sweater is sweeping up a mess in the garden, and he is muttering crossly to himself.

Kid: That's Mr. Abernathy. He takes care of the garden, and he is also the custodian at my school. He's kind of grumpy.
> Search Lulu's front porch -> porch
> Go straight to the garden -> garden

=== porch
scene: village
cast: hero, quill:thinking, kid:surprised
Waffles has her own little door at the bottom of Lulu's front door, which is called a cat flap. A tuft of orange fur is stuck on its edge.

Kid: My red scarf with the yellow stars was hanging on this hook on Friday, and now it's gone!

Under the porch swing, you find one fuzzy purple sock, which is covered in cat hair and has a few tiny tooth marks.

Quill: Socks, towels, and now a scarf. Waffles is collecting soft things, but why would a cat do that?
clue: Lulu's red scarf with yellow stars disappeared from the porch on Friday.
> Look at Waffles' food bowl -> bowl
> Go next door to the garden -> garden

=== bowl
scene: village
cast: hero, quill, kid:sad
Waffles' food bowl sits by the door with a fish painted on the bottom. It is still full of tuna from Friday's dinner, and not a single bite is missing.

Kid: See? Waffles would never skip tuna, because she loves it more than anything in the whole world.

You kneel down and look closely at the steps. A trail of small, muddy paw prints, each with four little toe beans, leads away from the porch. The prints go down the path and straight toward the community garden.
clue: Waffles' tuna bowl is still full from Friday's dinner.
> Follow the muddy paw prints -> garden

=== garden
scene: village
cast: hero, keeper:angry, kid:scared
The community garden smells like tomatoes and wet dirt. Near the gate, a big clay flowerpot lies on its side, cracked, and a red geranium is spilled across the path.

A line of muddy paw prints runs right through the spilled dirt and out the far gate, toward the corner.

Mr. Abernathy leans on his broom and frowns.

Keeper: Hmph! That orange cat knocked over my best geranium yesterday, and she digs in my carrots, too. If I catch her, I'll give her a very stern talking-to!
clue: Someone knocked over Mr. Abernathy's geranium pot on Friday.
> Ask Mr. Abernathy what he saw -> keeper

=== keeper
scene: village
cast: hero, keeper:thinking, quill
Mr. Abernathy grumbles as he sweeps, but you notice something interesting. A little bag of fishy cat treats is sticking out of his pocket, and he has set a bowl of fresh water by the gate.

Keeper: Fine, I'll tell you. At about three o'clock on Friday, I heard jingle, jingle, CRASH! When I looked up, that cat was racing out the gate with something long and red in her mouth.

Keeper: She went toward the corner by Larkspur School. Now go on, because I have work to do.
clue: Mr. Abernathy says Waffles ran toward Larkspur School at three o'clock with something red in her mouth.
? RL.3 : Mr. Abernathy sounds grumpy. What do his actions show about him?
+ He secretly cares about Waffles.
- He wants to keep Waffles for himself.
- He is afraid of all cats.
- He does not care about anything.
hint: Look at what he carries in his pocket and what he set out by the gate. Who are those things for?
next: ch1-end

=== ch1-end
scene: village
cast: hero, quill:thinking, kid
You sit on the curb with Lulu while Quill paces back and forth along the fence.

Quill: Let's review what we know. Waffles walked Lulu to the corner on Friday morning. That afternoon, she knocked over a flowerpot and ran toward Larkspur School with something long and red in her mouth. She hasn't come home since, and she even skipped her tuna.

Lulu twists the hem of her shirt around her finger.

Kid: Something long and red? Do you think it was my scarf?
? RL.2 : Which sentence best sums up Chapter 1?
+ Waffles is missing, and the clues point toward Larkspur School.
- Mr. Abernathy took Waffles and hid her in his garden.
- Waffles went home and ate all of her tuna.
- Lulu found Waffles asleep on the porch swing.
hint: Listen to Quill's review. Where did the clues lead, and is Waffles still missing?
next: ch2

# ============================================================
# CHAPTER 2: Three Trails to the Corner
# ============================================================

=== ch2
scene: city-street
cast: hero, quill, kid:thinking
checkpoint
~ Chapter Two ~

You walk to the corner where Juniper Street meets Larkspur Lane. Across the street stands Larkspur School, a brick building with a big front door, and it is closed for the weekend.

Kid: Wait! My neighbor Marco told me something scary. On Friday afternoon, he saw a person in a gray hoodie carrying a box with air holes. What if it was a cat-napper?

Quill: Hmm. We have three trails to follow, but we only have time for one of them. Which shall we choose?
> Talk to the crossing guard -> guard
> Find the person in the gray hoodie -> stranger
> Follow the trail of soft things -> socks

=== guard
scene: city-street
cast: hero, quill, guard:happy
At the corner, a woman in a blue uniform is twirling a big red stop sign. She is Officer Nell Tran, the crossing guard, and she helps kids cross the street every school day, even in the pouring rain.

Guard: Lulu! And who is this, an owl? Good morning, everyone. I'm only here today because I'm painting fresh crosswalk lines.

Quill: Officer Tran, did you happen to see an orange cat on Friday afternoon?

Officer Tran laughs and points her stop sign at the school.

Guard: See her? I tried to STOP her!
> Ask what she means -> guard-door

=== guard-door
scene: city-street
cast: hero, guard:thinking, kid:surprised
Officer Tran leans on her sign and remembers.

Guard: At three thirty on Friday, Mr. Abernathy propped the school door open with a bucket, because he was carrying in a giant box of lost-and-found clothes. It was so big that he couldn't even see his own feet!

Guard: Then an orange cat came trotting up, jingle, jingle, with a red scarf in her mouth. She walked right through the door behind him! I waved my stop sign at her, but cats don't follow traffic rules.
clue: Officer Tran saw Waffles walk into Larkspur School at three thirty on Friday.
? RL.1 : Which sentence from Officer Tran proves that Waffles went INTO the school?
+ "She walked right through the door behind him!"
- "It was so big that he couldn't even see his own feet!"
- "I'm only here today because I'm painting fresh crosswalk lines."
- "I waved my stop sign at her, but cats don't follow traffic rules."
hint: Look for the sentence that tells where the cat went. Which one says she went through the door?
next: ch2-end

=== stranger
scene: village
cast: hero, kid:scared, stranger
Halfway down Larkspur Lane, you spot a person in a gray hoodie carrying a cardboard box with air holes, and the box is wiggling!

Lulu grabs your arm and whispers.

Kid: That's the one Marco saw!

The person turns around and pushes back the hood. It is a young woman with curly hair and a friendly smile.

Stranger: Oh, hello there! I'm Sasha Bloom, and I just moved into the blue house on Juniper Street. Would you like to meet my best friend?
> Peek inside the wiggly box -> stranger-box

=== stranger-box
scene: village
cast: hero, stranger:happy, kid:surprised
Sasha lifts the lid. Inside is a big, wrinkly tortoise who is happily munching on a strawberry.

Stranger: This is Sir Pebbles. He is sixty years old, and he really hates moving day. The air holes help him breathe while he rides in his travel box.

Lulu's cheeks turn pink.

Kid: Oh. I thought you were a cat-napper. I'm sorry, Sasha!

Sasha laughs, and then she snaps her fingers.

Stranger: Wait, you're looking for a cat? On Friday I saw something strange, but it wasn't a cat. I'm sure it was a fox!
> Ask about the fox -> stranger-fox

=== stranger-fox
scene: village
cast: hero, quill:thinking, stranger
Sasha's eyes go wide as she tells the story.

Stranger: I grew up in a big city, so I have never seen a real fox. But on Friday, at about three thirty, a little orange fox trotted right past me! It had white feet, and it jingled when it walked. It carried a red flag with yellow stars, and it ran straight into the school.

Quill leans close and whispers to you.

Quill: A fox with white feet that jingles? I think Sasha saw someone we know.
clue: Sasha saw an "orange fox" with white feet and a jingle go into the school at three thirty.
? RL.6 : Why does Sasha think she saw a fox instead of a cat?
+ She is new and has never met Waffles or seen a real fox.
- She knows a lot about foxes from living on a farm.
- She saw Waffles up close and talked to her.
- She wanted to trick Lulu on purpose.
hint: Reread the start of Sasha's story. Where did she grow up, and what has she never seen?
next: ch2-end

=== socks
scene: city-street
cast: hero, quill, kid:thinking
You look down at the sidewalk, and a little way down the street, something purple is lying by the curb.

It's Lulu's other fuzzy sock! A few steps later, you find her blue dish towel caught on a bush. Then, right on the school's front steps, a tiny yellow felt star sparkles in the sun.

Kid: That star came off my scarf! Waffles left a trail, just like in a fairy tale.

Quill: She was carrying her treasures somewhere, and the trail ends at the school door.
clue: A trail of Lulu's sock, towel, and a scarf star leads to the school door.
> Try the school door -> school-steps

=== school-steps
scene: school
cast: hero, quill:surprised, kid
The big front door is locked, so you press your ear to the mail slot and listen. From somewhere deep inside the building, you hear a faint jingle, jingle.

Kid: That's Waffles' bell! She's inside!

Quill: Only Mr. Abernathy has the keys. Let's write him a polite note, and Lulu can zoom it over on her skateboard.

Quill hands you some word tiles. The note must start with a greeting and end with a closing and a name.
clue: You heard a bell jingling inside the locked school.
? L.2 order : Put the tiles in order to write a polite note.
1 Dear Mr. Abernathy,
2 please bring your keys
3 to the school.
4 Love, Lulu
hint: A note begins with a greeting like "Dear," followed by a comma. It ends with a closing and the writer's name.
next: ch2-end

=== ch2-end
scene: school
cast: hero, quill:happy, kid:happy
You meet back at the school's front steps, and Lulu hops from foot to foot.

Quill: Every trail leads to the same place. On Friday afternoon, Waffles carried Lulu's scarf right into Larkspur School. Then Mr. Abernathy locked the door for the weekend, and nobody knew that she was inside!

Kid: So Waffles wasn't cat-napped at all. She's been inside the school this whole time!

Down the street, you hear a familiar grumble, and a ring of keys jingles closer and closer.
? RL.2 : Which sentence best sums up Chapter 2?
+ The clues showed that Waffles went into the school and got locked in.
- Sasha Bloom stole Waffles and hid her in a box.
- Waffles turned into a fox and ran into the woods.
- Officer Tran took Waffles home to her own house.
hint: Quill says every trail leads to the same place. Where is Waffles, and why can't she get out?
next: ch3

# ============================================================
# CHAPTER 3: The Lost and Found
# ============================================================

=== ch3
scene: school
cast: hero, quill, keeper:angry
checkpoint
~ Chapter Three ~

Mr. Abernathy stomps up the steps with a ring of forty keys.

Keeper: A cat? In MY school? On my clean floors? Hmph! I locked up at five o'clock on Friday, and I didn't see any cat.

He grumbles as he tries one key after another, until at last the lock clicks and the big door creaks open. Inside, the hallway is dim and very quiet, and it smells like crayons and floor wax.

Quill: Let's be calm and gentle, because a cat who is hiding might be frightened.
> Stand still and listen -> listen
> Search Lulu's classroom -> classroom

=== listen
scene: school
cast: hero, quill:thinking, kid
Everyone stands as still as statues, and at first you hear only the hum of the drinking fountain.

Then you hear it, a tiny jingle from the front office. A big cardboard box labeled LOST AND FOUND sits in the corner, and a long red scarf with yellow stars hangs over its side.

A moment later, you hear something else. It sounds like five tiny squeaky toys, all squeaking at once.

Kid: What is THAT?
> Tiptoe to the lost-and-found box -> box

=== classroom
scene: school
cast: hero, quill, kid:thinking
Lulu's classroom is Room 4. The chairs are stacked on the desks, and a hamster named Nugget is snoring in his cage by the window.

On the reading rug, you find a soft little pile of orange fur, and Lulu gasps.

Kid: Waffles sat right here, on the rug where I read every day!

From down the hall comes a faint jingle, followed by a sound like five tiny squeaky toys. Nugget wakes up, looks annoyed, and goes right back to sleep.
> Follow the sound down the hall -> box

=== box
scene: school
cast: hero, cat:happy, kid:surprised
You kneel beside the lost-and-found box. The red scarf leads inside like a welcome mat, and under a pile of mittens and sweaters, two green eyes blink up at you.

Kid: WAFFLES!

Waffles purrs as loudly as a little motor. Curled against her tummy are four teeny kittens with pink noses, and their eyes are shut tight.

Cat: Mrrrow.

Kid: Waffles... you're a MOM?
> Let Mr. Abernathy see -> abernathy

=== abernathy
scene: school
cast: hero, keeper:surprised, cat
Mr. Abernathy grumbled all the way to the school. Now he kneels beside the box very slowly, and he takes off his cap.

For a long moment, he says nothing at all. Then he chuckles softly, and his eyes crinkle at the corners.

Keeper: Well, I'll be. A whole family in my lost and found! I've found plenty of mittens in this box, but never any kittens.

He takes out his bag of fishy treats and gently sets one beside Waffles' nose.
? RL.4 : First, Mr. Abernathy "grumbled." Now he "chuckles softly." What do these words show?
+ His mood changed from cranky to gentle and happy.
- He is still angry about his geranium.
- He is sad that the box is full.
- He is laughing at Lulu.
hint: Think about how a person sounds when they grumble, and how they sound when they chuckle softly.
next: why

=== why
scene: school
cast: hero, quill, kid:thinking
Quill perches on the edge of the box and speaks very quietly.

Quill: Now all the clues make sense. Before a mother cat has kittens, she often eats more and sleeps more, and her belly gets round. Then she searches for a warm, quiet, hidden spot, and she drags soft things there to make a nest.

Kid: The socks, the towel, and my scarf! She was building a nest!

Quill: Kittens are born with their eyes closed, and they open them when they are about one or two weeks old.
clue: Mother cats eat more, then look for a warm, hidden spot and make a nest of soft things.
> Put the clues in order -> retell

=== retell
scene: school
cast: hero, quill:thinking, cat:happy
Quill fluffs her feathers and tells the whole story, but she tells it in a jumbled order, so you will need to listen for the time words!

Quill: Last of all, Waffles had her kittens in the lost-and-found box. But first, on Friday morning, she walked Lulu to school. Later, at three o'clock, she knocked over the geranium with the scarf in her mouth. After that, at three thirty, she slipped through the open school door.
? RL.5 order : Put Waffles' Friday in the order it happened.
1 Waffles walked Lulu to school in the morning.
2 Waffles knocked over the geranium at three o'clock.
3 Waffles slipped through the open school door.
4 Waffles had her kittens in the lost-and-found box.
hint: Look for the time words in Quill's story: "first," "on Friday morning," "later," "after that," and "last of all."
next: theme

=== theme
scene: school
cast: hero, quill:happy, kid
Lulu laughs and hugs Quill until her feathers stick out in every direction.

Kid: This morning I thought Mr. Abernathy was mean, and I thought Sasha was a cat-napper. But they were both helping in their own ways.

Quill: That happens to detectives all the time. People who seem grumpy or strange are often very kind once you get to know them. A good detective doesn't jump to conclusions, because she waits for the clues.
? RL.2 : What is the theme, or big lesson, of this story?
+ Don't judge people too quickly. Learn the facts first.
- Cats should never be allowed inside schools.
- Always keep your socks in a drawer.
- Grumpy people are never kind.
hint: Reread what Quill says about people who seem grumpy or strange, and about jumping to conclusions.
next: vet

=== vet
scene: school
cast: hero, scientist:happy, cat:happy
Lulu's dad arrives with Dr. Hollis, the animal doctor from the Juniper Street Pet Clinic, who is wearing her white coat over her pajamas.

Dr. Hollis listens to each kitten with a tiny stethoscope.

Scientist: They are all strong and healthy, and so is their mother. Waffles chose a perfect spot, because it is warm, quiet, and full of soft sweaters!

Now everyone wants to know what will happen next.
> Carry the family home in the box -> end-home
> Throw a welcome party on the street -> party
> Count the tiny squeaks one more time -> count

=== end-home
scene: village
cast: hero, kid:happy, cat:happy
Mr. Abernathy carries the lost-and-found box all the way to Lulu's house. He walks so carefully that he looks like he is carrying a cake made of glass.

Lulu sets up a cozy corner in her bedroom, and Waffles settles in with her kittens and her stolen socks.

Kid: You can keep the scarf forever, Waffles.

That night, Waffles eats two whole bowls of tuna. Mr. Abernathy stops by with a bag of cat treats, and he doesn't grumble even once.
end: win The Lost and Found Family

=== party
scene: village
cast: hero, quill:happy, guard:happy
By lunchtime, everyone on Juniper Street has heard the news. Officer Tran paints a little paw print next to the new crosswalk, Sasha brings Sir Pebbles to say hello, and Mr. Abernathy builds a tiny wooden bed for the kittens.

Guard: Kittens crossing! Everybody stop!

Lulu lets the neighbors help name the kittens, and they choose Jingle, Geranium, Tuna, and Star.

Quill: A whole street that cares about one cat. I call that a happy ending.
> Wave goodbye to Juniper Street -> end-party

=== end-party
scene: village
cast: hero, kid:happy, keeper:happy
The party lasts all afternoon, with lemonade for the people and a crunchy snack for Sir Pebbles. Mr. Abernathy even plants a brand-new geranium and lets Lulu water it.

Keeper: That cat owes me one flowerpot. I suppose four kittens will do.

As you walk back to the Arcade Library with Quill, you hear a happy jingle from Lulu's window, and you smile all the way home.
end: win Welcome to Juniper Street

=== count
scene: school
cast: hero, quill:thinking, cat
You lean over the box and count the kittens again: one, two, three, four.

Then you count the squeaks: one, two, three, four... FIVE.

Quill: Four kittens, but five squeaks? A good detective always checks her numbers!

In the corner of the box, a fuzzy blue mitten is wiggling all by itself. Very gently, you lift it up and peek inside.
> Look inside the wiggly mitten -> end-secret

=== end-secret
scene: school
cast: hero, quill:happy, kid:surprised
Inside the mitten is a fifth kitten! It is the tiniest one of all, orange from nose to tail, with one white sock, and it must have wriggled in there to stay warm.

Kid: A kitten in a mitten! You found the very last clue!

Lulu names the tiny kitten Clue. Waffles licks its head, and then she licks your hand, too.

Quill: You noticed what everyone else missed, and that is the mark of a true detective.
end: secret The Kitten in the Mitten
