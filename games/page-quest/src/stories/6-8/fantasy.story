title: The Fading Word of Briarwick
author: SpiderBen10's Arcade
genre: fantasy
band: 6-8
cover: academy-hall
blurb: At a hidden school where spells only work if the grammar is right, a word has vanished and the castle is coming apart.
start: start

# ============================================================
# CHAPTER ONE: A SCHOOL MADE OF SENTENCES
# ============================================================

=== start
scene: library
cast: hero, quill:surprised
checkpoint
~ Chapter One ~

It is a rainy afternoon in the Arcade Library, and you are reshelving returned books when one of them begins to hum.

It is a slim volume bound in green leather, with no title on its spine, and it is vibrating gently in your hands like a cat that has decided to purr. Silver letters slowly appear on its cover, one at a time, as if someone invisible were writing them: BRIARWICK.

Quill drops her feather duster in astonishment.

Quill: Briarwick? I thought that place was only a rumor that librarians whisper to each other at conferences.
> Open the humming book -> book
> Ask Quill about Briarwick -> lore

=== lore
scene: library
cast: hero, quill:thinking
Quill settles onto the reading desk and lowers her voice, although nobody else is in the library.

Quill: The story goes like this. Somewhere, hidden between the pages of the world, there is a school called the Briarwick Academy of Wordcraft. Its students learn that words are not merely sounds or marks on paper. When they are chosen carefully and arranged correctly, words can lift stones, mend bridges, and light up the dark.

Quill: But the stories also say that Briarwick is extremely particular about grammar. A sloppy sentence, apparently, can turn a student's hair blue for a week.
> Open the humming book -> book

=== book
scene: library
cast: hero, quill:surprised
You open the book. Every page is blank except the first, where elegant silver handwriting reads:

"Welcome, reader. The door to Briarwick opens only for those who understand that punctuation matters. Read aloud the sentence that invites your grandmother to dinner, rather than suggesting that someone should eat her."

Beneath it, four sentences shimmer, and you realize that only one of them is the key.

Quill: Hoo! Choose carefully. I'd rather not explain to anyone why we accidentally insulted a grandmother.
? L.2 : Which sentence invites Grandma to dinner instead of suggesting that someone eat her?
+ Let's eat, Grandma!
- Let's eat Grandma!
- Lets eat Grandma!
- Let's, eat Grandma!
hint: A comma before a person's name shows you are talking TO that person. Which sentence speaks to Grandma?
next: arrive

=== arrive
scene: academy-hall
cast: hero, mentor:happy, quill:surprised
The moment you read the sentence aloud, the page ripples like water, and you and Quill tumble softly through it.

You land in an enormous hall with a vaulted ceiling, towering bookshelves and a round window shaped like an open book. Glowing letters drift slowly upward through the air like sparks from a campfire.

A tall woman with silver hair and an ink-blue robe approaches, carrying a staff topped with a lantern.

Mentor: Welcome to Briarwick. I am Professor Odalys Thorne. Here, we are meticulous about language, which means we are extremely careful about every word, every comma and every letter, because in Wordcraft, a single careless mistake can make a spell misbehave in spectacular ways.
? L.4 : Professor Thorne says Briarwick is "meticulous about language." Which meaning fits the context?
+ extremely careful about every small detail
- bored and uninterested in something
- confused by difficult vocabulary
- loud and enthusiastic when speaking
hint: Read the rest of her sentence. She explains what "meticulous" means with the words "which means."
next: tables

=== tables
scene: academy-hall
cast: hero, mentor:thinking, kid:happy
Professor Thorne gestures toward four long tables, each beneath its own banner.

Mentor: At Briarwick, nobody sorts you. Students choose the study table that suits their questions. The Commas are patient and love long, complicated projects. The Ellipses are dreamers who rarely finish a thought. The Exclamation Points are bold and rather loud. And the Question Marks are curious about absolutely everything, sometimes inconveniently so.

At the table beneath the green banner, a girl with braided hair and ink-stained fingers waves at you enthusiastically.

Kid: Over here! We have an empty seat, and we also have cookies, although one of them is currently a frog because of a spelling accident.
> Sit with the Question Marks -> juno
> Try the Exclamation Points' table -> sabine

=== sabine
scene: academy-hall
cast: hero, stranger:angry, kid:thinking
Beneath the red banner, a tall girl in a crimson hooded cloak stretches her arms across three empty chairs before you can reach them.

Stranger: Sorry! This table is completely full! The Exclamation Points never accept new students halfway through the term!

Several of her friends nod in unison, so emphatically that their hoods tumble over their eyes.

Behind you, the girl from the green table rolls her eyes and explains that the hooded girl is Sabine Vos, who, as far as anyone can remember, has never once said anything quietly.

Kid: Don't worry about Sabine. She behaves as though she owns the entire castle, but mostly she's just loud. Come and sit with us instead.
> Join the Question Marks -> juno

=== juno
scene: academy-hall
cast: hero, kid:happy, cat:normal
The girl introduces herself as Juno Achebe, a second-year Question Mark, and pulls out a chair for you. A sleek black cat with a curly white tail is curled up in the middle of the table, directly on top of everyone's homework.

Cat: I am Semicolon. I connect ideas; I also knock things off tables. Both are important jobs.

Juno slides you a slightly squashed cookie, which, thankfully, is not a frog.

Kid: The Exclamation Points and the Question Marks have been rivals for about two hundred years, although nobody remembers exactly why. Mostly, we just glare at each other across the hall during lunch.
> Ask Juno about the floating letters -> letters
> Go to your first Wordcraft lesson -> lesson

=== letters
scene: academy-hall
cast: hero, kid:thinking, quill:happy
You point at the glowing letters drifting toward the ceiling, and Juno grins.

Kid: Those are leftovers. Whenever someone casts a spell in this hall, a few letters escape from the sentence and float around for a while before they fade. On exam days, the ceiling looks like a snowstorm made of alphabet soup.

A lowercase g drifts past Quill's beak, and she snaps at it playfully, the way a kitten swats at a moth.

Quill: Hoo! It tastes like lemon. I believe I may enjoy this school enormously.
> Go to your first Wordcraft lesson -> lesson

=== lesson
scene: academy-hall
cast: hero, mentor:thinking, kid:surprised
Professor Thorne places a porcelain teapot on her desk and taps it with her staff.

Mentor: The first law of Wordcraft is this: a spell does exactly what its sentence says, not what you meant it to say. Juno, please make the teapot float.

Juno clears her throat and announces, "Floating above the desk, I watched the teapot." Instantly, Juno herself rises gently into the air and bobs against the ceiling, while the teapot sits on the desk, completely unimpressed.

Mentor: A dangling modifier. "Floating above the desk" describes the closest noun, and the closest noun was "I." Now, which sentence would actually lift the teapot?
? L.1 : Which sentence makes the TEAPOT float, not Juno?
+ I watched the teapot floating above the desk.
- Floating above the desk, I watched the teapot.
- While floating above the desk, I watched the teapot.
- Above the desk, floating, I watched the teapot.
hint: The phrase "floating above the desk" describes the noun it sits next to. Put it right beside "the teapot."
next: connotation

=== connotation
scene: academy-hall
cast: hero, mentor:happy, kid:happy
Once Juno has been carefully lowered back into her chair, Professor Thorne moves on.

Mentor: The second law of Wordcraft: words carry feelings as well as meanings. Two words may describe the same thing, but their connotations differ. Call the old bridge to the North Tower rickety, shabby or decrepit, and it will sag and creak beneath your feet. Call it venerable, a word we use for things that are old, wise and deeply respected, and it will stand a little straighter.

Mentor: And the third law, the most important of all: never cast a spell in anger. A shouted spell only pushes things away; it never solves anything.
clue: Professor Thorne's warning: never cast a spell in anger. A shouted spell only pushes things away.
? L.5 : You need the old bridge to feel strong and respected. Which word should your spell use?
+ venerable
- rickety
- decrepit
- shabby
hint: Look for the word that Professor Thorne says means old, wise and deeply respected. The others all have negative connotations.
next: crack

=== crack
scene: castle-hall
cast: hero, mentor:scared, kid:scared
That night, you are woken by a deep, grinding rumble. Out in the corridor, a crack is zigzagging across the stone floor, and the two halves of the hallway are slowly sliding apart, like ice floes on a river.

In the great hall, the four study tables have drifted to the four corners of the room, and no matter how hard anyone pushes, they will not move back together.

Professor Thorne stands before a huge stone tablet built into the wall, her face pale in the lantern light. Carved into it is the castle's founding sentence, and one of its words has disappeared, leaving a smooth, empty gap.

"Here, all who seek to learn will find a place ________."
clue: A word is missing from the founding sentence: "Here, all who seek to learn will find a place ________."
> Ask Professor Thorne what is happening -> ch1-end

=== ch1-end
scene: castle-hall
cast: hero, mentor:sad, quill:thinking
Mentor: Briarwick was not constructed from stone alone. Its founders wrote this sentence, and the sentence itself holds the castle in one piece. Someone has removed a word from it, and until that word is returned, Briarwick will continue coming apart.

Quill: Then we'll need to discover who took it, why they took it, and exactly which word is missing.

Mentor: Quickly, please, because at this rate, by tomorrow night the towers will be standing in different counties.
? RL.2 : Which is the best objective summary of Chapter One?
+ You join a school of word magic, and a lost word splits the castle.
- You learn to bake cookies that turn into frogs at a magic school.
- Professor Thorne takes the word from the stone to punish students.
- You join the Exclamation Points and become Sabine's best friend.
hint: An objective summary covers the main events: where you went, what you learned, and the problem at the end of the chapter.
next: ch2

# ============================================================
# CHAPTER TWO: THE HUSH
# ============================================================

=== ch2
scene: castle-hall
cast: hero, mentor:thinking, kid:thinking
checkpoint
~ Chapter Two ~

By morning, the castle has stretched in alarming directions. The North Tower leans away from the rest of the building, the bridges between wings have grown long and thin, and the corridors are full of new cracks.

Mentor: Listen carefully. With the castle in this condition, the Forgetful Corridor is more dangerous than ever. On ordinary days, it only occasionally forgets where it leads. Today, anyone who takes it may wander for hours. Use the long way around, no matter what.

Juno pulls you aside and whispers that a first-year saw Sabine Vos near the Undercroft door, where the founding stone's foundations are, last night at midnight.
clue: Professor Thorne warns: do not take the Forgetful Corridor. Sabine was seen near the Undercroft at midnight.
> Find Sabine and question her -> sabine-talk
> Visit Errata, the library dragon -> errata

=== sabine-talk
scene: academy-hall
cast: hero, stranger:angry, kid:angry
You find Sabine practicing spells alone in the empty hall, and when she notices you and Juno approaching, she yanks her hood up defensively.

Stranger: Yes, I was near the Undercroft! I heard somebody crying behind the door, so I went to help. But when I arrived, nobody was there, only a freezing draft and a sound like someone whispering.

Kid: Of course, and I suppose the Exclamation Points don't want a tower of their own, either?

Stranger: You Question Marks think we're all show-offs, and we think you never stop asking questions long enough to actually accomplish anything! But I would never damage this castle. It's my home, too.

Juno opens her mouth to argue, then closes it again, looking unexpectedly thoughtful.
? RL.6 : How do Juno's and Sabine's points of view about each other's groups differ?
+ Each sees a flaw in the other group: showing off or asking too much.
- Both agree that the Exclamation Points took the missing word.
- Juno admires Sabine's group, but Sabine dislikes Question Marks.
- Neither girl cares about the study tables at all.
hint: Reread what Sabine says each group thinks about the other: "show-offs" and "never stop asking questions."
next: errata

=== errata
scene: academy-hall
cast: hero, dragon:happy, kid
At the back of the hall, curled up on a heap of old dictionaries, sleeps a small green dragon with spectacles balanced on her snout. Juno explains that this is Errata, who has lived in the Briarwick library for three hundred years and who eats only one thing: mistakes in printed books.

Dragon: Mmm. Someone wrote "definately" in a history essay this morning. Delicious.

She burps, and a tiny puff of smoke shaped like a crossed-out letter drifts into the air.

Kid: Her name comes from the Latin word "errare," which means to wander or to make a mistake. That's where we get words like error and erroneous, too.
? L.4 : Using the Latin root and what Errata eats, what does the word "errata" most likely mean?
+ a list of mistakes found in a printed book
- a kind of dragon that lives in libraries
- the history of a very old castle
- a spell that makes things wander away
hint: Errata eats mistakes in printed books, and "errare" means to make a mistake. Put the two clues together.
next: chronicle

=== chronicle
scene: academy-hall
cast: hero, dragon:thinking, quill:thinking
You ask Errata whether anything unusual has happened in the library, and she hiccups up a dusty scroll called the Briarwick Chronicle. It tells the castle's history, although, like many historians, it starts in the middle.

"When the castle was finished, the founders carved their sentence into the Cornerstone, and the walls rose around it. But before that, the two founders, Ines Arrowood and Tobias Penhallow, had argued for a year about whose school it would be. Long before their argument, they had been the only two students in an ordinary village school who loved words more than anything. In the end, they stopped arguing and wrote the founding sentence together, one word each, taking turns."

Quill: The founders were rivals, just like the tables, and they built the castle together anyway.
? RL.5 order : Put the founders' story in the order it actually happened.
1 Ines and Tobias were the only word-lovers in a village school.
2 They argued for a year about whose school it would be.
3 They wrote the founding sentence together, taking turns.
4 They carved the sentence into the Cornerstone, and the walls rose.
hint: The Chronicle starts in the middle. Look for time words like "long before," "before that," "in the end" and "when the castle was finished."
next: route

=== route
scene: castle-hall
cast: hero, kid:thinking, cat:thinking
The Undercroft lies on the far side of the castle, and every minute the cracks grow wider. Juno points toward a narrow archway decorated with question marks that keep rearranging themselves into commas.

Kid: That's the Forgetful Corridor. It's a shortcut straight to the Undercroft, assuming it remembers where it's going. The long way crosses the old bridge and the Whispering Garden, and it takes twenty minutes.

Semicolon flicks her tail toward the bridge.

Cat: Professor Thorne gave a warning; personally, I would listen to it.
> Take the shortcut through the corridor -> lose-corridor
> Take the long way over the bridge -> bridge

=== lose-corridor
scene: castle-hall
cast: hero, kid:scared, cat:thinking
The Forgetful Corridor begins normally enough, but after the third turn, it seems to lose its train of thought. Doors lead to other doors, a staircase ends in a broom closet, and at one point you walk past the same suit of armor eleven times.

Hours later, Semicolon discovers you sitting in a dead end, exhausted, while Juno recites the alphabet backward to stay calm.

Cat: I did mention the warning; I believe I mentioned it rather clearly.

By the time the cat leads you out, the North Tower has drifted completely across the valley, and Professor Thorne has sent every student home until the castle can be repaired.
end: lose Lost in the Forgetful Corridor

=== bridge
scene: mountain-pass
cast: hero, kid:scared, quill:thinking
The old stone bridge to the garden has stretched so far that it sags in the middle like a hammock, and loose pebbles tumble from its edges into the misty valley below.

Juno's knees are trembling, so you remember Professor Thorne's second law. You suggest a spell, and Juno nods and speaks it clearly, choosing every word with care: "Venerable bridge, stand tall and carry us across."

The stones creak, shift, and then straighten proudly, like an old soldier hearing a familiar song. The sag disappears, and the bridge becomes as steady as a sidewalk.

Kid: It worked! It actually liked being called venerable!
> Cross into the Whispering Garden -> garden

=== garden
scene: forest
cast: hero, kid:surprised, quill:surprised
The Whispering Garden is a walled forest inside the castle, where the trees grow words instead of leaves, and every breeze sets them murmuring: "maybe," "tomorrow," "once upon a time."

Near the Undercroft gate, you notice small scraps of paper caught on the branches, each one covered in faint, shaky handwriting.

Kid: Look at these. They're words that people meant to say but never actually said. "Thank you for helping me." "Can I sit with you?" "I'm sorry I laughed."

Quill: Someone has been collecting all the words that nobody ever spoke aloud, and they've been keeping them very carefully.
> Read the longest scrap of paper -> diary

=== diary
scene: forest
cast: hero, ghost:sad, kid:thinking
The longest scrap is a kind of diary, and as you read it aloud, a pale, see-through shape drifts out from behind a tree, listening.

"I am the Hush. I am made of every word that was never said out loud. For three hundred years I have drifted through this castle, but I have no table, no friends, and no place. Every night I listen to the students laughing together, and I wish I could be part of it. I only want to belong somewhere."

The shape shivers, and then it flees through the gate into the Undercroft, leaving a trail of frost on the grass.
clue: The Hush wrote: "I only want to belong somewhere."
? RL.1 : Which sentence from the diary best explains why the Hush might have taken a word?
+ "I only want to belong somewhere."
- "I am made of every word that was never said out loud."
- "For three hundred years I have drifted through this castle."
- "Every night I listen to the students laughing together."
hint: Look for the sentence that tells what the Hush wants most. A motive is the reason someone acts.
next: ch2-end

=== ch2-end
scene: forest
cast: hero, kid:thinking, quill:thinking
You stand at the Undercroft gate, which is so cold that frost has formed on its iron bars.

Kid: So it wasn't Sabine after all. She really did hear crying, and the crying was the Hush. But which word did it take?

You consider the castle: the drifting tables, the stretching bridges, and the towers leaning away from one another, until everything is coming apart. Juno's eyes widen at the same moment as yours.

Quill: Everything that used to be together is now separated. I believe the missing word has been announcing its name all along.
? RL.2 : Which is the best objective summary of Chapter Two?
+ You learn that Sabine is innocent and the lonely Hush took the word.
- You prove Sabine stole the word to build her own tower.
- Errata the dragon eats the founding sentence by mistake.
- The Question Marks and Exclamation Points move to a new castle.
hint: Think about what you discovered about Sabine, the Chronicle, and the diary in the garden.
next: ch3

# ============================================================
# CHAPTER THREE: TOGETHER
# ============================================================

=== ch3
scene: cave
cast: hero, ghost:scared, kid
checkpoint
~ Chapter Three ~

The Undercroft is an enormous cavern beneath the castle, where the roots of the towers twist downward into the rock. In the center rises the Cornerstone, carved with the founding sentence, and curled protectively around the empty gap, the Hush is clutching a single glowing word.

It is the word TOGETHER.

The Hush flinches as you approach, and frost spreads in feathery patterns across the stone floor.

Ghost: Please don't take it back. Everyone in this castle has someone, so I thought that if I held this word, I would finally be together with somebody, too.
> Speak gently to the Hush -> hush

=== hush
scene: cave
cast: hero, ghost:sad, kid:thinking
Quill flutters down and lands softly beside the Hush, asking whether it ever meant to damage the castle.

Ghost: No! I didn't realize the word was holding anything up. When the walls started cracking, I was too frightened to return it, because I was certain everyone would be furious with me.

Juno kneels on the cold floor and studies the Hush the same way she studied Sabine yesterday, thoughtfully and without judgment.

Kid: You know, at Briarwick, nobody sorts you. Everyone chooses their own table. I suppose nobody ever told you that you were allowed to choose one, too.
> Wait as footsteps approach -> sabine-arrives

=== sabine-arrives
scene: cave
cast: hero, stranger:angry, quill:scared
Footsteps thunder down the stairs, and Sabine bursts into the cavern with five Exclamation Points behind her, their hoods raised and their hands lifted, ready to cast.

Stranger: There it is, the creature that's breaking our castle! On three, everybody shout the banishing spell! BEGONE, FOUL SPIRIT!

The Hush shrinks against the Cornerstone, clutching the glowing word even more tightly, and Juno steps in front of it with her arms spread wide.

Quill: Remember Professor Thorne's third law! A shouted spell only pushes things away; it never solves anything.
> Let Sabine's group shout the spell -> lose-shout
> Ask everyone to write a spell together -> compose

=== lose-shout
scene: cave
cast: hero, stranger:surprised, quill:sad
The Exclamation Points shout together, and the spell hits the Undercroft like a thunderclap.

It works, in the worst possible way. The Hush is blown backward through the rock, and the glowing word goes with it, tumbling away into the dark. With a final groan, the castle splits completely in two, and the halves drift gently apart.

By morning, there are two schools instead of one: Briarwick North, where the Exclamation Points shout, and Briarwick South, where the Question Marks ask why. Neither side ever finds the missing word.

Quill: Professor Thorne warned us. A spell cast in anger never solves anything.
end: lose A Castle Divided

=== compose
scene: cave
cast: hero, stranger:thinking, kid:thinking
Sabine slowly lowers her hands, looking suspicious.

Stranger: Write a spell together? With you? Our tables have been rivals for two hundred years!

Kid: The founders were rivals, too. They argued for an entire year, and then they wrote the founding sentence together, one word each, taking turns. Maybe that's the only way the sentence works.

Sabine stares at Juno, then at the shivering Hush, and finally she pulls down her hood.

Stranger: Fine. But we're writing it properly, with absolutely no dangling modifiers.

Professor Thorne appears at the bottom of the stairs with her lantern raised, and quietly lets you continue.
> Write a welcome for the Hush first -> draft

=== draft
scene: cave
cast: hero, stranger:happy, kid:happy
Before returning the word, Sabine insists on writing a short welcome for the Hush, because, as she puts it, nobody should come back to a table without being invited.

Her first draft reads, "Glowing with happiness, the Cornerstone welcomes the Hush." The Cornerstone immediately begins to glow, beaming like a proud grandparent, while the Hush stays exactly as pale as before.

Kid: Dangling modifier! You made the rock happy instead of the Hush.

Sabine laughs, for the first time all week, and rewrites it: "The Cornerstone welcomes the Hush, who is glowing with happiness." This time, a faint golden shimmer spreads across the Hush.
> Ask the Hush to return the word -> restore

=== restore
scene: cave
cast: hero, ghost:happy, mentor:happy
Together, the Question Marks and the Exclamation Points kneel at the Cornerstone. You ask the Hush whether it will help, too, and after a long moment, it nods and holds out the glowing word with trembling hands.

Mentor: The founding sentence must be spoken correctly, in its proper order, by everyone at once. Arrange the pieces carefully.

Four glowing fragments of the sentence float in the air in front of you, scrambled.
? L.1 order : Build the founding sentence in the correct order.
1 Here,
2 all who seek to learn
3 will find a place
4 together.
hint: Look back at the sentence carved on the stone, which begins "Here, all who seek to learn will find a place" and ends with the missing word.
next: whole

=== whole
scene: academy-hall
cast: hero, ghost:happy, stranger:happy
Every voice in the Undercroft speaks the sentence at once, and the word TOGETHER flies from the Hush's hands back into the Cornerstone with a sound like a bell.

Above you, the castle groans, rumbles and then, with a series of satisfying clunks, slides back into place. The bridges shorten, the cracks close, and in the great hall, the four study tables glide back to the center of the room.

When you climb the stairs, the Hush is no longer pale and frosty. It glows a soft gold, and Sabine and Juno have pulled up a fifth chair between their tables.

Stranger: It can sit with us on Mondays. Question Marks get it on Tuesdays.
> Listen to Professor Thorne -> theme

=== theme
scene: academy-hall
cast: hero, mentor:happy, kid:happy
Professor Thorne raps her staff on the floor, and the whole school falls silent.

Mentor: Two hundred years ago, our founders were rivals who discovered that their best sentence was the one they wrote together. Last night, the Question Marks and the Exclamation Points discovered the same thing. And the Hush has taught all of us that a place where everyone belongs must make room even for those who have never spoken up.

The Hush glows so brightly that the floating letters swirl around it like fireflies.
? RL.2 : Which statement best expresses a theme of the story?
+ People who disagree build something stronger by including everyone.
- Rivals should always stay apart to avoid arguments.
- Shouting is the fastest way to solve a difficult problem.
- Old castles are too dangerous for students to live in.
hint: Read Professor Thorne's speech. What did the founders, the two tables and the Hush all learn?
next: finale

=== finale
scene: academy-hall
cast: hero, kid:happy, cat:happy
That evening, Briarwick holds a feast to celebrate the castle being whole again. The tables are pushed so close together that they form one long table, and nobody can remember which seats belong to whom.

Semicolon walks the full length of the table, knocking exactly one spoon off each place setting.

Cat: I connect ideas; I also have traditions.

Juno nudges you and points to the doorway, where your humming green book is waiting to take you home whenever you are ready.
> Stay for the feast -> end-feast
> Write the story in the Chronicle -> end-chronicle
> Follow Semicolon through a tiny door -> door

=== end-feast
scene: academy-hall
cast: hero, ghost:happy, stranger:happy
You stay for the feast, which features soup that rhymes, bread that tells jokes, and a pudding that is technically an adverb.

Sabine teaches you a spell that makes your voice echo like a trumpet, Juno teaches you one that turns hiccups into butterflies, and the Hush teaches you a word that has never been spoken aloud before. It sounds like the moment right before a friend laughs.

When the green book finally carries you home to the Arcade Library, you are still smiling.
end: win A Place Together

=== end-chronicle
scene: academy-hall
cast: hero, dragon:happy, mentor:happy
Professor Thorne hands you a silver pen, and you write the whole story into the Briarwick Chronicle: the humming book, the fading word, the Hush, and the spell that rivals wrote together.

Errata reads it over your shoulder, searching hopefully for a typo, but she can't find a single one.

Dragon: Disappointing. Also, very well written.

Mentor: Your words are part of this castle now, reader. You will always have a seat at Briarwick.
end: win Written in the Chronicle

=== door
scene: castle-hall
cast: hero, cat:thinking, quill:surprised
Semicolon slips beneath the table and through a door no taller than a teapot, and somehow, when you follow, you fit.

On the other side is a tiny, dusty room with a writing desk, two chairs, and a single sheet of paper under glass. It is covered in two different kinds of handwriting, crossed-out words and arrows, and at the bottom, in both hands at once, is the founding sentence.

Cat: The founders' first draft. Nobody has seen it in three hundred years; I sleep on it on Thursdays.
> Look closely at the first draft -> end-secret

=== end-secret
scene: castle-hall
cast: hero, cat:happy, quill:happy
In the margins of the first draft, tiny notes run back and forth between the two founders, like a conversation that lasted all night.

"Your word is better than mine. Use yours."
"No, let's use ours."
"Should we add a word for people who are too shy to ask for a seat?"
"Yes. Let's make that word 'together.'"

Quill: Hoo. The founders were thinking about the Hush three hundred years before anyone had ever met it.

Semicolon curls up on the desk and purrs, and you leave the draft exactly where you found it, where it has been quietly keeping the castle's best secret all along.
end: secret The Founders' First Draft

