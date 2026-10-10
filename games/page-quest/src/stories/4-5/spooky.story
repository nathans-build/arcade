title: The Lost Lantern of Mistlemoor
author: SpiderBen10's Arcade
genre: spooky
band: 4-5
cover: castle-night
blurb: A young vampire who is afraid of the dark lost his lantern before the Moonlight Festival. Can you find it by midnight?
start: start

# ============================================================
# CHAPTER ONE: A VAMPIRE WHO NEEDS A NIGHT-LIGHT
# ============================================================

=== start
scene: castle-night
cast: hero, quill:happy, vampire:scared
checkpoint
~ Chapter One ~

It is the night of the Moonlight Festival, and Quill has flown you to Mistlemoor Castle, which sits on a hill above the little village of Puddleby.

You knock on the huge wooden door. KNOCK, KNOCK, KNOCK!

A shaky voice calls from inside: "Who's there? Please say it's someone with a flashlight!"

The door creaks open, and a boy in a long black cape peeks out. He has slicked-back hair, two tiny fangs, and a cup of berry juice in his hand.

Vampire: Oh, thank goodness, it's you! I'm Florian Fangsworth. I'm one hundred and eleven years old, which is eleven in vampire years.
> Step inside the castle -> hall
> Ask why he needs a flashlight -> flashlight

=== flashlight
scene: castle-night
cast: hero, vampire:sad, quill:thinking
Florian looks down at his shoes and sighs.

Vampire: Promise you won't laugh? I'm afraid of the dark. I know, I know. A vampire who is afraid of the dark is like a fish who is afraid of water.

Quill pats his shoulder with the tip of one wing.

Quill: Hoo! Lots of people are afraid of the dark, Florian. Even some owls, although they would never admit it.

Florian smiles a tiny smile, and his fangs poke out over his lip.
> Step inside the castle -> hall

=== hall
scene: castle-night
cast: hero, vampire:sad, quill
The castle hall is cozy and full of candles. Fat cobwebs hang in the corners like lace curtains, and a big window shows the round full moon.

Vampire: Tonight is the Moonlight Festival in the pumpkin patch. At midnight, the youngest Fangsworth always leads the Lantern Parade, and this year, that's me!

Florian points to a little table under the window. It is completely empty.

Vampire: My Moonglow Lantern always sits right there. It's the only thing that makes me feel brave in the dark. But when I woke up tonight, it was gone!
> Look closely at the empty table -> table
> Look at the family portraits -> portraits

=== portraits
scene: castle-night
cast: hero, vampire:thinking, quill:thinking
Rows of portraits hang along the wall. Every Fangsworth in every painting has slicked hair, a fancy cape, and a very serious face.

In the last painting, a little old lady is grinning so widely that you can see both of her fangs. A sign under it says: OTTILIE FANGSWORTH. BRAVEST BAT-WATCHER OF MISTLEMOOR.

Vampire: That's my grandma. She made the Moonglow Lantern when she was a girl. She's down in the village right now, setting up the festival, and she has no idea that I lost it!
clue: Grandma Ottilie made the Moonglow Lantern when she was a girl.
> Look closely at the empty table -> table

=== table
scene: castle-night
cast: hero, quill:thinking, vampire:scared
You kneel down beside the little table and look carefully.

There is a ring in the dust where the lantern used to sit. Next to it, you find three things: a tuft of fluffy gray fur, a smear of orange mud, and a trail of golden crumbs.

Florian leans closer to look, and then he sneezes so hard that his cape flips over his head. "AH-CHOO!"

Vampire: Those are garlic bread crumbs! Vampires are allergic to garlic. Mom baked a whole basket of garlic bread for the village bake sale, and now that's missing too!
clue: By the empty table, you find gray fur, orange mud and garlic bread crumbs.
? RL.3 : Why is Florian so worried about the missing lantern?
+ He has to lead the parade at midnight, and he is afraid of the dark.
- He wants to sell the lantern at the village bake sale.
- He thinks his grandma took it away from him.
- He needs the lantern to cook a pot of tomato soup.
hint: Look back at what Florian says about the Lantern Parade and about how the lantern makes him feel.
next: pip

=== pip
scene: castle-night
cast: hero, bat:happy, vampire
Suddenly, something small and flappy drops down from the rafters. It is a little brown bat wearing a tiny striped scarf.

Bat: Hiya, hello, howdy! I'm Pip! Did somebody say "missing"? Because I saw something, I saw EVERYTHING, well, not everything, because I was hanging upside down, and everything looks silly upside down. Have you ever noticed that? Ceilings look like floors!

Vampire: Pip, please, what did you see?

Bat: Right, sorry! A big, fluffy, gray shape came in through the window. It grabbed the lantern and the garlic bread. Then it went thumpity-thump, right up the attic stairs! Oh, and it smelled like a wet dog. Also, did I tell you about my scarf? My cousin knitted it.
? RL.1 : Which sentence from Pip is the best clue about where the thief went?
+ "Then it went thumpity-thump, right up the attic stairs!"
- "Ceilings look like floors!"
- "My cousin knitted it."
- "I'm Pip!"
hint: Find the sentence where Pip tells you which way the fluffy shape went after it grabbed the lantern.
next: garlic

=== garlic
scene: castle-night
cast: hero, vampire:happy, bat:happy
Florian holds his nose and looks at the trail of crumbs on the floor. Then his eyes light up.

Vampire: Wait a minute! Every time I get near garlic, I sneeze. So if I follow my sneezes, I can follow the thief!

Bat: A sneeze detective! That's the best idea I've heard all night, and I've heard a LOT of ideas, because I listen to everything, mostly to myself.

Florian takes one step toward the stairs. "AH-CHOO!" He takes another step. "AH-CHOO!" The sneezes grow louder as he gets closer to the attic stairs.

Quill chuckles and fluffs her feathers. She says she has seen detectives use magnifying glasses, but never a nose like that.
> Follow the sneezes up the stairs -> ch1-end

=== ch1-end
scene: castle-night
cast: hero, vampire:scared, bat:happy
The attic stairs are narrow and twisty, and there are no candles at all. Florian grabs your hand and squeezes it tight.

Vampire: It's so dark up here! What if there's a monster?

Bat: Florian, YOU are a vampire. Some people think YOU are the monster!

Vampire: I'm not a monster. I'm a vampire who drinks berry juice and collects stickers!

Step by step, and sneeze by sneeze, you climb toward the attic door.
? RL.2 : Which sentence best sums up Chapter One?
+ Florian's lantern is missing, so you follow clues toward the attic.
- Florian bakes garlic bread and sells it at the village bake sale.
- Pip the bat knits a striped scarf for his cousin.
- Grandma Ottilie paints a portrait of the whole Fangsworth family.
hint: Think about the biggest events: the lost lantern, the clues by the table, and where you are going at the end.
next: ch2

# ============================================================
# CHAPTER TWO: THE ATTIC AND THE OLD DIARY
# ============================================================

=== ch2
scene: attic
cast: hero, vampire:scared, bat:happy
checkpoint
~ Chapter Two ~

The attic door groans open. Moonlight spills through a round window and lights up dusty trunks, stacks of boxes, and a dress form wearing a very old, very fancy cape.

Florian jumps behind you.

Vampire: AAH! Somebody is standing in the corner!

Bat: That's a dress form, Florian. It doesn't have a head. Or arms. Or legs. It's basically a pillow on a stick.

The trail of garlic crumbs leads across the floor. Beside it, one old trunk has been knocked over, and papers have spilled everywhere.
> Look at the cape on the dress form -> cape
> Follow the crumbs across the floor -> crumbs
> Look at the papers by the trunk -> trunk

=== cape
scene: attic
cast: hero, vampire:surprised, quill:happy
The old cape is purple velvet with silver stars sewn along the edges. Florian lifts it off the dress form and swirls it around his shoulders.

Vampire: This was Grandma's cape! It's way too big for me.

He tries to do a dramatic vampire swoosh, but he trips on the long hem and lands in a box of old socks.

Quill: Hoo! Very dramatic. Ten out of ten for the swoosh, and two out of ten for the landing.

Florian giggles and climbs out with a sock on each ear.
> Follow the crumbs across the floor -> crumbs

=== crumbs
scene: attic
cast: hero, bat:surprised, vampire
The crumbs lead straight to the round window, which is wide open. On the windowsill, there is a huge muddy paw print, and the mud is bright orange.

Pip zooms out the window and back in again in one second.

Bat: There's a drainpipe out there! The fluffy thing must have climbed down it. And look at that orange mud! The only orange mud around here is in the pumpkin patch, where the festival is. I know because I took a mud bath there last Tuesday. Don't ask.

Under the window, more papers from the trunk have blown into a pile.
clue: A muddy orange paw print is on the attic windowsill. Orange mud comes from the pumpkin patch.
> Pick up the papers -> trunk

=== trunk
scene: attic
cast: hero, vampire:thinking, quill:thinking
Florian kneels down and gathers up the papers. They are old, yellow pages, and they are covered in loopy purple handwriting.

Vampire: This is Grandma's diary from when she was a girl! The thief must have knocked over her trunk.

The pages are not numbered, but Florian reads each one out loud carefully.

"The night before my first Moonlight Festival, I hid under my blanket. The dark was just too dark."

"The next evening, I climbed to the castle roof with an empty jam jar. I caught moonbeams in it until it glowed. That was my first Moonglow Lantern!"

"At midnight, I held up my glowing jar and led the Lantern Parade. My knees were shaking, but I kept walking."

"At the end of the parade, my jar ran out of moonlight. But by then, my eyes had learned the dark. A Fangsworth has the best night eyes in the world, once she stops squeezing them shut."
? RL.5 order : Put the events from Grandma's diary in the order they happened.
1 Young Ottilie hid under her blanket because the dark was too dark.
2 She caught moonbeams in an empty jam jar on the roof.
3 She led the Lantern Parade with her knees shaking.
4 Her jar ran out of moonlight, but her eyes had learned the dark.
hint: Look for time words in the diary, like "the night before," "the next evening," "at midnight" and "at the end."
next: diary

=== diary
scene: attic
cast: hero, vampire:surprised, quill:happy
Florian stares at the diary with his mouth wide open.

Vampire: Grandma was afraid of the dark too? But she's the bravest Fangsworth of all! Her portrait even says so!

Quill: Hoo! Being brave doesn't mean you're never scared, Florian. It means you're scared, and you keep walking anyway, just like your grandma's knees.

Florian folds the diary pages and tucks them carefully into his cape.
clue: Grandma's diary says, "A Fangsworth has the best night eyes in the world, once she stops squeezing them shut."
? RL.3 : How did young Ottilie change in her diary?
+ She went from hiding from the dark to leading the parade in it.
- She went from loving the dark to being afraid of it.
- She went from making jam to selling it at the festival.
- She went from living in the village to living in the castle.
hint: Compare the first diary page with the last two pages. How did Ottilie feel about the dark at the start and at the end?
next: ch2-end

=== ch2-end
scene: attic
cast: hero, vampire:thinking, bat:happy
Florian looks out the round window. Far below, the pumpkin patch glows with jack-o'-lanterns, and tiny festival tents twinkle beyond it.

Vampire: Maybe I can turn into a bat and fly down there! Vampires in old stories do that all the time.

He scrunches up his face and wiggles his fingers. POP! Two big, pointy bat ears appear on top of his head, and that's all.

Bat: Ooh, nice ears! Very stylish. But maybe we should just take the stairs.

So you hurry down the stairs, out the castle door, and along the dark lane to the pumpkin patch. Florian holds your hand the whole way, and he only squeaks four times.
? RL.2 : Which sentence best sums up Chapter Two?
+ In the attic, you find Grandma's diary and a clue about the pumpkins.
- Florian turns into a bat and flies all the way to the village.
- Pip takes a mud bath and then knits a new scarf.
- You clean the attic and put every box back in the trunk.
hint: Think about the two big things you found in the attic and where the clues told you to go next.
next: ch3

# ============================================================
# CHAPTER THREE: THE PUMPKIN PATCH
# ============================================================

=== ch3
scene: pumpkin-patch
cast: hero, vampire:scared, quill
checkpoint
~ Chapter Three ~

The pumpkin patch is full of grinning jack-o'-lanterns. A scarecrow with a crooked hat stands in the middle, and festival music drifts over from the village tents.

But then a big gray cloud slides across the sky and covers the moon. Everything gets darker.

Florian's bat ears droop.

From somewhere between the pumpkins, you hear a scritch-scratch, scritch-scratch, like someone digging. Then you hear a little howl: "Awoo-hic! Awoo-HIC!"
> Follow the digging sound -> biscuit
> Read the festival sign first -> festsign

=== festsign
scene: pumpkin-patch
cast: hero, quill:thinking, bat:happy
A painted wooden sign stands at the edge of the patch.

MOONLIGHT FESTIVAL TONIGHT!
Tomato Soup Stand by Mayor Pumpernickel
Lantern Parade at Midnight
Garlic Bread Bake Sale

Someone has written CANCELLED across the bake sale in big red letters, and under it they wrote: BREAD MISSING!

Bat: Ha! Whoever has that garlic bread is going to have very stinky breath. I'm just saying.
> Follow the digging sound -> biscuit

=== biscuit
scene: pumpkin-patch
cast: hero, werewolf:happy, vampire:surprised
Behind the biggest pumpkin, you find a huge, fluffy, gray werewolf. He has one floppy ear, orange mud on all four paws, and garlic bread crumbs on his chin.

When he sees you, his tail starts wagging like a windshield wiper in a rainstorm.

Werewolf: Visitors! Hi! Hello! I'm Biscuit! Do you want to play fetch? Do you want to smell this pumpkin? It smells AMAZING!

Florian sneezes three times in a row. "AH-CHOO! AH-CHOO! AH-CHOO!"

Vampire: You have garlic breath! And orange mud! And gray fur! You took my lantern!

Biscuit's floppy ear drops even lower.
? L.5 : Biscuit's tail is "wagging like a windshield wiper in a rainstorm." What does this tell you?
+ His tail is wagging fast because he is very excited.
- His tail is soaking wet from the rain.
- His tail is broken and needs to be fixed.
- His tail is moving very slowly because he is tired.
hint: Think about how a windshield wiper moves in a big rainstorm. Then look at how Biscuit acts when he sees you.
next: why

=== why
scene: pumpkin-patch
cast: hero, werewolf:sad, quill:thinking
Biscuit sits down and puts his paws over his snout.

Werewolf: I'm sorry! I didn't mean to be a bad dog. I mean, a bad wolf. Tonight is my very first Big Howl at the festival. But a young werewolf can only howl properly when he can see the moon, and the clouds kept hiding it!

Werewolf: Then I looked up at the castle window, and I saw your lantern. It was round and glowing, just like a little moon! So I borrowed it to practice my howl.

Werewolf: The garlic bread was just because it smelled really, really good.

Quill hoots softly.
? RL.3 : Why did Biscuit take the Moonglow Lantern?
+ It looked like a little moon, and he needed a moon to practice howls.
- He wanted to sell it at the garlic bread bake sale.
- He was angry at Florian for not playing fetch.
- He wanted to use it to find the garlic bread in the dark.
hint: Read what Biscuit says about the clouds, the moon and the castle window.
next: where

=== where
scene: pumpkin-patch
cast: hero, werewolf:thinking, bat:happy
Florian pats Biscuit's fluffy head and tells him it's okay. Then he asks where the lantern is now.

Biscuit scratches behind his floppy ear with his back paw.

Werewolf: Well, I wanted to keep it safe, so I buried it, just like my best bone. I sang a little song so I would remember the spot. It went like this: "Not by the gate, and not by the tree. Under the scarecrow's left boot, that's where it will be!"

Werewolf: But then I dug forty-two more holes, just for fun, and now I can't remember which one is the right one.

You look around. The pumpkin patch is full of holes!

Bat: Good thing I was listening to every word of that song. I always listen to every word. It's my best talent, after talking.
? RL.1 : Which line from Biscuit's song tells you where the lantern is buried?
+ "Under the scarecrow's left boot, that's where it will be!"
- "Not by the gate, and not by the tree."
- "I dug forty-two more holes, just for fun."
- "It smells AMAZING!"
hint: Reread Biscuit's song. One line says where the lantern is NOT, and one line says where it IS.
next: dig

=== dig
scene: pumpkin-patch
cast: hero, vampire:sad, quill:happy
You march over to the scarecrow with the crooked hat and kneel by his left boot. The dirt there is soft and orange.

You dig, and Biscuit helps, which means that mud flies everywhere. Some of it lands on Quill.

Quill: Hoo! I am now an orange owl.

Then your fingers touch something smooth and round. You pull it out of the dirt. It's the Moonglow Lantern!

But when Florian wipes off the mud, his face falls. The lantern is cold, and it is completely dark.

Vampire: Oh no. It has been buried too long, and all the moonlight leaked out. And the clouds are still covering the moon!
clue: You found the Moonglow Lantern under the scarecrow's left boot, but it has no light left.
> Look toward the village -> dark

=== dark
scene: pumpkin-patch
cast: hero, vampire:scared, quill
DONG! DONG! DONG! The village clock begins to ring. It is almost midnight!

To reach the parade, you have to walk through the pumpkin patch, and now it is darker than ever. Florian's hands are shaking.

Vampire: I can't do it. Everything is just black and blobby. I'm going to have to squeeze my eyes shut and hope.

Quill lands on his shoulder.

Quill: Florian, remember the last page of your grandma's diary? Owls and vampires are both nocturnal. That means we're awake all night and sleep all day. Nocturnal eyes are made for seeing in the dark!
? RL.4 : Quill says owls and vampires are "nocturnal." What does nocturnal mean?
+ awake at night and asleep during the day
- afraid of the dark and the night
- able to fly high above the clouds
- awake in the morning and asleep at night
hint: Read the sentence right after Quill says the word. It begins with "That means..."
next: eyes

=== eyes
scene: pumpkin-patch
cast: hero, vampire:surprised, werewolf:happy
Florian takes a deep breath. Instead of squeezing his eyes shut, he opens them as wide as they will go.

At first, everything is black. Then, slowly, shapes appear. He can see the curly pumpkin vines. He can see the scarecrow's crooked hat. He can even see a tiny mouse waving at him from a pumpkin!

Vampire: I can see! I can really see! Everything is silvery and soft, like a dream!

His knees are still shaking a little, but he keeps walking. He leads you, Quill, Pip and Biscuit right through the dark patch without bumping into a single pumpkin.

Werewolf: Wow! You're like a superhero with a cape!

Vampire: I already have the cape. Now I just need to stop tripping on it.
> Hurry to the festival -> clouds

=== clouds
scene: pumpkin-patch
cast: hero, bat:happy, werewolf:sad
At the edge of the village, Biscuit looks up at the cloudy sky and whimpers.

Werewolf: The parade is starting, and I still can't see the moon. My Big Howl will just be a Little Hiccup.

Pip flaps his wings and puffs out his tiny chest.

Bat: Leave this to me! If there's one thing I can do, it's talk. I can talk to anybody about anything for as long as it takes!

Pip zooms up to the cloud and starts chattering about his scarf, his cousin, his mud bath, his favorite bugs, and the time he sneezed upside down. He talks, and talks, and talks.

Finally, the cloud gets so bored that it drifts away. The full moon shines bright again!

Moonbeams pour down into the Moonglow Lantern, and it fills up with a soft, silver light.
> Watch the lantern glow -> recap

=== recap
scene: pumpkin-patch
cast: hero, vampire:happy, quill:happy
Biscuit throws back his head and does his very first Big Howl: "AWOOOOOOOOO!" It is long and beautiful, and there is not a single hiccup in it.

Florian holds up the glowing lantern and grins so wide that both fangs show.

Quill: Hoo! What a night. Let's remember how we got here.
? RL.5 order : Put these events from Chapter Three in the order they happened.
1 You hear digging and a hiccupy howl in the pumpkin patch.
2 Biscuit sings a song about where he buried the lantern.
3 You dig up the lantern by the scarecrow's left boot.
4 Florian opens his eyes wide and walks through the dark.
5 Pip talks to the cloud until it drifts away.
hint: Think back through Chapter Three. You had to find Biscuit before you could find the lantern.
next: theme

=== theme
scene: pumpkin-patch
cast: hero, vampire:happy, werewolf:happy
Florian looks down at the lantern, and then he looks out at the dark patch he just walked through.

Vampire: You know what? I was still scared tonight. My knees shook the whole time. But I kept walking anyway, just like Grandma did.

Werewolf: And I made a mistake, but you all helped me fix it! That's what friends are for!
? RL.2 : Which sentence best states a theme, or big lesson, of this story?
+ Being brave means you keep going even when you feel scared.
- Vampires should never eat garlic bread at a festival.
- You should always bury your best things in the ground.
- It is best to stay home when it is dark outside.
hint: Read what Florian says about his knees and about his grandma.
next: finale

=== finale
scene: pumpkin-patch
cast: hero, vampire:happy, bat:happy
The village bells ring twelve times. It is midnight!

A long line of villagers is waiting with their own little lanterns. At the front, a tiny old lady in a purple cape waves both arms at you. It's Grandma Ottilie!

Bat: Florian, it's time! Everyone is waiting! No pressure! Okay, a little pressure! Mostly fun pressure!

Florian looks at you, smiles, and takes a deep breath.
> Lead the parade with the lantern -> end-parade
> Let Biscuit howl to start the parade -> end-howl
> Show Grandma the old diary pages -> grandma

=== end-parade
scene: pumpkin-patch
cast: hero, vampire:happy, quill:happy
Florian lifts the Moonglow Lantern high above his head and steps to the front of the line.

The whole village follows him through the pumpkin patch. Every jack-o'-lantern seems to grin a little wider as he passes.

At the end of the parade, the Mayor hands everyone a warm cup of tomato soup. Florian sips his happily, and he doesn't sneeze even once.

Vampire: Thank you for helping me tonight. I'll never forget it, even if I live another hundred and eleven years!
end: win The Brightest Night in Puddleby

=== end-howl
scene: pumpkin-patch
cast: hero, werewolf:happy, vampire:happy
Florian sets the glowing lantern on top of a pumpkin, right where Biscuit can see it next to the real moon.

Vampire: Biscuit, you start the parade!

Biscuit throws back his head. "AWOOOOOOOO!" The whole village cheers, and then everyone starts howling too, even the Mayor.

Florian leads the parade with Biscuit trotting beside him, and Pip rides on Biscuit's floppy ear, talking the whole way.

Biscuit even gives back the garlic bread. Well, most of it.
end: win A Howling Good Festival

=== grandma
scene: pumpkin-patch
cast: hero, vampire:thinking, quill:happy
Florian runs to Grandma Ottilie and pulls the yellow diary pages out of his cape.

Vampire: Grandma, I found your diary. You were afraid of the dark too, just like me!

Grandma Ottilie reads the pages, and her eyes twinkle. She hugs Florian so tight that his bat ears pop right off his head. POP!

Then she whispers something in his ear. Florian's eyes go wide.

Vampire: Grandma says the jam jar ran out of moonlight on purpose. She says a lantern is just a helper, until you're ready to see by yourself.
> Do what Grandma whispered -> end-secret

=== end-secret
scene: pumpkin-patch
cast: hero, vampire:happy, bat:happy
Florian hands the glowing lantern to the littlest kid in the line, who has been scared of the dark all night.

Then Florian walks to the front of the parade with nothing in his hands at all. He opens his night eyes wide and leads the whole village through the moonlit patch, pointing out every vine, every pumpkin and every waving mouse along the way.

Grandma Ottilie walks beside him with her purple cape, and she is grinning so wide that you can see both of her fangs.

Bat: This is the best night ever! And I would know, because I've talked through all of them!
end: secret Night Eyes Wide Open
