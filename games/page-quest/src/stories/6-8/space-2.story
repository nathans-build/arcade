title: The Marshmallow Zombies of Mossgrove
author: SpiderBen10's Arcade
genre: space
band: 6-8
cover: cryo-bay
blurb: A glowing fungus turned a space farm's crew into groaning zombies. The cure is locked in ice, with a frozen astronaut.
start: start

# ============================================================
# CHAPTER ONE: SOMETHING GROANING ON MOSSGROVE
# ============================================================

=== start
scene: space-bridge
cast: hero, captain:thinking, quill
checkpoint
clue: Mossgrove Station has not answered the radio for six hours.
~ Chapter One ~

The supply shuttle Peregrine glides toward Mossgrove Station, an experimental farm shaped like a giant spinning ring, orbiting high above Mars. Through the window, the rust-colored planet turns slowly below, while the station's greenhouse panels glitter like a bracelet of green glass.

You are the shuttle's newest cadet, and Quill, the ship's librarian, is perched on your shoulder in a tiny bubble helmet that she insists is extremely fashionable.

Captain: Cadet, Mossgrove hasn't answered a single radio call in six hours. The only signal on their emergency channel is a long, low, mysterious groaning.

Captain Ofelia Strand taps the speaker, and a sleepy, hungry moan fills the bridge, continuing on and on without a pause.

Quill: That is not a sound I would describe as encouraging.
> Read the station briefing first -> briefing
> Dock and go aboard right away -> dock

=== briefing
scene: space-bridge
cast: hero, quill:thinking, captain
Captain Strand flicks the official station briefing onto the main screen.

"Mossgrove Station is an experimental farm designed to grow lettuce, tomatoes and beans for future missions to Mars. To recycle plant waste, the crew uses glowcap, a fungus engineered in the station laboratory, which transforms old leaves into fresh soil and glows a soft green in the dark. The station rotates to create artificial gravity in its outer ring, although the central hub remains completely weightless. Mars is approximately 225 million kilometers from Earth today, so a radio message traveling at the speed of light needs about 12.5 minutes to reach Mission Control, and the reply needs just as long."

Quill: So if we ask Earth for advice, we will wait nearly half an hour for an answer.
? RI.2 : What is the central idea of the station briefing?
+ It explains what Mossgrove does and the conditions its crew works in.
- It proves that glowcap fungus is dangerous to humans.
- It describes the history of Mars exploration.
- It argues that space farms are a waste of money.
hint: Look at what every sentence in the briefing describes: the farm, the fungus, the gravity, the distance. What ties them together?
next: dock

=== dock
scene: space-corridor
cast: hero, quill:scared, zombie
The docking clamps lock on with a deep CLANG that you feel through your boots, because sound travels perfectly well through solid metal. Outside the window, however, the Peregrine's thrusters puff in total silence, since empty space contains no air to carry sound.

You seal your helmet, and its spore filter hums to life. When the hatch slides open, your suit's sensor reports that the dim corridor smells like old mushrooms and toasted sugar.

Something shuffles around the corner. It was obviously a crew member once, but now its skin is pale green, a fuzzy, glowing mushroom sprouts from the top of its head, and its arms are stretched hopefully toward you.

Zombie: Mmmmarshmallowwwws...
> Hide behind the cargo crates -> hide
> Say hello very politely -> hello

=== hide
scene: space-corridor
cast: hero, zombie:thinking, quill:scared
You duck behind a stack of cargo crates and hold your breath, even though your helmet filter means you really do not need to.

The zombie shuffles past at approximately the speed of an exhausted snail. Beside your crate it pauses, and its glowing mushroom tilts like a curious antenna while it sniffs loudly at your backpack, which contains, you suddenly remember, an emergency chocolate bar.

Zombie: Mmmmm, sugaaaar...

Quill presses one wing over her beak to keep from giggling. After a long, thoughtful groan, the zombie apparently decides that bending down would require far too much effort, and it shuffles off toward the galley.

A moment later, a whisper drifts down from the air vent above your head.
> Look up at the vent -> arlo

=== hello
scene: space-corridor
cast: hero, zombie:surprised, quill
You step forward and give a friendly wave. The zombie stops, blinks its sleepy eyes, and slowly attempts to wave back, but it forgets what it was doing halfway through and scratches its ear instead.

Then it sneezes, and a puff of glittering green spores splatters across your visor. You flinch, but your suit's filter beeps calmly and displays a message: SPORES BLOCKED.

Zombie: Mmmmarshmallowwwws?

Quill: We do not have any marshmallows, but it was very considerate of you to ask.

The zombie sighs an enormous, disappointed sigh and shuffles off toward the galley, leaving a sparkling trail of dust behind it. A moment later, a whisper drifts down from the air vent above your head.
> Look up at the vent -> arlo

=== arlo
scene: space-corridor
cast: hero, kid:scared, quill
A metal grate pops loose, and a boy of about thirteen drops down, wearing a paper face mask and a station cadet badge. His hair is full of dust, and he looks as though he has not slept since yesterday.

Kid: Shh! I'm Arlo Brask, and that was my dad, Commander Brask. Yesterday, after the greenhouse air filter jammed, everybody started yawning, and then their skin turned green and fuzzy until they could only say one word.

Arlo swallows hard, but his voice stays steady.

Kid: I put on a mask and climbed into the vents, because nobody could follow me up there. I've been writing down everything they do, so that when help finally arrived, I could explain exactly what happened.
clue: The outbreak started after the greenhouse air filter jammed.
? RL.3 : What do Arlo's actions show about his character?
+ He is frightened, but he keeps thinking clearly and plans ahead.
- He does not care what happens to the crew.
- He is reckless and runs straight toward danger.
- He wants to hide forever and never be found.
hint: Look at what Arlo did: he put on a mask, hid somewhere safe, and kept notes so that he "could explain exactly what happened."
next: arlo-choice

=== arlo-choice
scene: space-corridor
cast: kid:thinking, robot:happy, quill
A small round robot with a mop for an arm rolls out of a supply closet and beeps cheerfully.

Robot: Greetings! I am SWEEP-9, the station cleaning unit. Current mess level: catastrophic. Current number of marshmallows remaining in the galley: zero.

Kid: Sweep has been my only company. The one person who might understand what's going on is Dr. Selin Kaya, our fungus scientist, but I haven't seen her since the alarms started.

Quill: Then we need evidence before we need heroics. Shall we observe what the crew is doing, or search the doctor's laboratory for her notes?
> Peek into the galley -> galley
> Search Dr. Kaya's lab -> lab

=== galley
scene: space-corridor
cast: zombie:happy, robot, quill
The galley door is wedged open with a frying pan. Inside, four groaning crew members are gathered solemnly around an empty marshmallow jar, as if they were studying a priceless museum treasure. One is licking the lid, while another is attempting, extremely slowly and for the ninth time, to open the sugar drawer with her elbow.

Zombie: Mmmmore marshmallowwws...

Every surface is dusted with glowing green spores, and SWEEP-9 rolls in frantic circles, mopping as fast as his little motor allows.

Robot: The crew has consumed forty bags of marshmallows, eleven jars of honey, and one birthday cake that was not finished yet.

Quill: They are sluggish, sleepy, and interested only in sugar. It's strange, certainly, but it isn't exactly terrifying.
> Head for Dr. Kaya's lab -> lab

=== lab
scene: lab
cast: hero, quill:thinking, kid
Dr. Kaya's laboratory is empty and spotless, except for a row of glass jars along the bench, each holding a mushroom that glows a gentle green. The nameplate on her door reads "Dr. Selin Kaya, Mycologist."

Kid: What exactly is a mycologist?

Quill: Let's figure it out from the word parts. "Myco" comes from an ancient Greek word for fungus, and "logist" means a person who studies a particular subject, as in biologist or geologist.

On the screen above the bench, a recorded message is waiting, and its play button blinks patiently, as if it has been expecting someone.
? L.4 : Using the word parts, what is a mycologist?
+ A scientist who studies fungi
- A scientist who studies rocks
- A doctor who treats sick animals
- An engineer who builds space stations
hint: Quill explains that "myco" means fungus and "logist" means a person who studies a particular subject.
next: lab-log

=== lab-log
scene: lab
cast: hero, kid:scared, quill
You tap the play button, and Dr. Kaya's calm voice fills the laboratory.

"Log entry, day 214. The greenhouse air filter jammed at 0900, which allowed glowcap spores to escape into the ventilation system. Each spore is tiny, about one hundredth the width of a human hair, so spores ride on moving air the way dandelion seeds ride the wind. Because the fans circulate air through every room, the spores reached the entire crew within an hour. Glowcap feeds on sugar, so when it grows on a person, it makes them drowsy and gives them a powerful craving for sweets. Fortunately, it is not dangerous, and it can be cured. Fungi grow fastest in warm conditions, while cold slows them down dramatically. I am heading to the cryo bay. Cold is the answer."
clue: Dr. Kaya said she was heading to the cryo bay because "Cold is the answer."
? RI.3 : According to the log, how did the spores reach the whole crew?
+ The fans carried the spores through the vents to every room.
- The crew members ate glowcap mushrooms from the greenhouse.
- The spores crawled through the corridors on tiny legs.
- A supply shuttle brought the spores from Earth.
hint: Find the sentence that begins with "Because the fans..." and trace what the spores rode on.
next: ch1-end

=== ch1-end
scene: lab
cast: hero, quill:thinking, kid:sad
Arlo stares at the glowing jars while Quill paces along the bench, counting the facts on her feathers.

Quill: Here is what we actually know. A jammed filter released glowcap spores into the air, and the ventilation fans carried them to the whole crew. Now everyone is sleepy, slow and desperate for sugar, although Dr. Kaya says the fungus isn't dangerous and can be cured. She went to the cryo bay because cold slows fungus down, and nobody has seen her since.

Kid: So we find Dr. Kaya, and she tells us how to bring my dad back.

Quill: Precisely. It's an excellent plan, provided that nobody offers the zombies a cupcake.
? RL.2 : Which is the best objective summary of Chapter One?
+ Spores spread and changed the crew; Dr. Kaya went to the cryo bay.
- Arlo bravely cured the crew by hiding in the vents.
- Evil aliens attacked Mossgrove and stole the marshmallows.
- The crew is in terrible danger and will never be the same.
hint: An objective summary sticks to facts without opinions or exaggeration. Listen to what Quill says "we actually know."
next: ch2

# ============================================================
# CHAPTER TWO: THE COLD WAY ROUND
# ============================================================

=== ch2
scene: space-corridor
cast: hero, captain, kid:thinking
checkpoint
clue: The cryo bay is on the far side of the station, past the hub or through the greenhouse.
~ Chapter Two ~

Arlo unfolds a crumpled station map. The cryo bay is located on the far side of the ring, and there are only two possible routes to reach it.

Kid: We could float through the hub in the center of the station, where there's no gravity at all. Otherwise, we walk through the greenhouse, which is warm and full of plants, and probably full of spores and zombies too.

Captain Strand's face appears on your helmet screen, looking unusually serious.

Captain: Listen carefully, Cadet. In the hub, rule number one is to stay clipped to the safety rail at all times. If you float free in the middle of that shaft, there will be nothing to push against, and you'll remain stuck until somebody rescues you.
> Float through the weightless hub -> hub
> Sneak through the warm greenhouse -> greenhouse

=== hub
scene: space-corridor
cast: hero, robot, quill:surprised
You climb a ladder toward the center of the station, and with every rung you feel lighter, until your feet drift off the steps entirely. The hub is a long tube as wide as a gymnasium, with a safety rail running along one wall and the cryo bay hatch at the opposite end.

Quill tumbles in a slow somersault and pretends that she did it deliberately.

Robot: Reminder! Clip your tether to the rail. In zero gravity, an object in motion continues moving in a straight line, and an object at rest remains at rest. Without a wall or a rail to push against, you cannot swim through air.

The far hatch looks temptingly close, and a single powerful push from this wall might send you flying straight to it.
> Clip in and pull along the rail -> hub-rail
> Unclip and leap across. Faster! -> lose-drift

=== lose-drift
scene: space-corridor
cast: hero, robot:scared, quill:scared
You unclip, crouch, and kick off the wall. For one glorious second you soar like a superhero, until your elbow clips a light fixture and sends you spinning slowly away from the hatch.

The air inside the hub gradually slows you down, and soon you are hanging in the middle of the shaft, three meters from every wall, rotating in lazy circles. You flap your arms like a bird, but air is far too thin to swim through.

It takes SWEEP-9 forty minutes to attach his mop to an extension pole and reel you in. By then, Captain Strand has sent her own medical team to find Dr. Kaya, and she has ordered you back to the shuttle.

Quill: The captain told us to stay clipped. In space, the rules usually exist for a very good reason.
end: lose Stuck in the Middle

=== hub-rail
scene: space-corridor
cast: hero, robot:happy, kid
You clip your tether to the rail and pull yourself along, hand over hand. Every tug moves you forward, because whenever you push or pull on something, it pushes or pulls back on you with exactly the same force. Arlo glides behind you, and Quill rides on Sweep like a feathered admiral aboard a very small ship.

Halfway along, a single glowing spore drifts past your visor in a perfectly straight line, never falling, because there is no gravity here to pull it down.

At the far end, the hatch is coated in frost, and a sign reads CRYO BAY: SEED VAULT AND SAMPLE FREEZERS. KEEP CLOSED.

Kid: There's frost on the outside of the door, so it must be absolutely freezing in there.
> Open the frosty hatch -> cryo

=== greenhouse
scene: island-jungle
cast: hero, kid:scared, quill
The greenhouse ring is so warm and humid that your visor fogs around the edges. Without anyone to prune them, the plants have grown wild, so tomato vines dangle from the ceiling and bean stalks curl around the lamps like enormous green ropes, turning the whole place into a jungle.

Glowing spores hang in the air like glitter in a shaken snow globe, drifting and swirling whenever a fan turns. Somewhere behind the lettuce, a zombie is groaning affectionately at a pumpkin.

Kid: Glowcap loves heat and moisture, so this place is basically a birthday party for it.

Quill: Then let's be polite guests and leave early.
? L.5 : The spores "hang in the air like glitter in a shaken snow globe." What does this simile suggest?
+ Thousands of tiny sparkling spores float and swirl all around.
- The greenhouse has turned cold and snowy.
- The spores are trapped inside glass jars.
- A few big spores fall quickly to the floor.
hint: A simile compares two things using "like." Picture what glitter does after you shake a snow globe.
next: greenhouse-exit

=== greenhouse-exit
scene: island-jungle
cast: hero, zombie:happy, kid
You tiptoe carefully between the bean rows. Ahead, a zombie in a muddy lab coat is hugging a pumpkin and humming to it, and Arlo whispers that it's Dr. Amari, the station botanist, who used to be extremely serious about his pumpkins.

Zombie: Mmmmy pumpkiiin, so sweeeet...

He doesn't even glance up as you creep past. At the far end of the greenhouse, the air turns suddenly icy, and a frost-covered hatch is set into the wall beneath a sign that reads CRYO BAY: SEED VAULT AND SAMPLE FREEZERS. KEEP CLOSED.

Kid: Dr. Amari once lectured me for twenty minutes because I touched a leaf. I'm going to remind him about this pumpkin hug for the rest of his life.
> Open the frosty hatch -> cryo

=== cryo
scene: cryo-bay
cast: hero, astronaut:frozen, quill:surprised
The hatch opens with a crackle of breaking frost, and freezing air rolls across your boots. According to your suit, the temperature is eighteen degrees below zero Celsius. Old sleep pods line the walls, now used to store seeds, and icicles hang from every pipe.

In the middle of the floor stands a figure in a white spacesuit, completely trapped inside a thick shell of ice, with a few lights on the suit still blinking weakly.

Quill: It's Dr. Kaya! She must have sealed herself inside a spacesuit so that she wouldn't breathe in any spores.

You wipe the frost from the display on her sleeve, which reads: BODY TEMPERATURE 31 C. AIR SUPPLY 55 MINUTES. HEATER ON LOW POWER.
clue: Dr. Kaya's suit shows body temperature 31 C and 55 minutes of air.
> Figure out what happened -> cryo-why

=== cryo-why
scene: cryo-bay
cast: hero, astronaut:frozen, quill:thinking
Above Dr. Kaya, a pipe has split open, and a frozen waterfall hangs from the crack. The pipe carried water to cool the freezers, and when it burst, the spray turned to ice almost instantly, because water freezes at zero degrees Celsius and this room is far colder than that.

Quill: Don't worry, she isn't frozen solid. Her suit is insulated like a very sophisticated thermos, and its heater has been running. A healthy body is about 37 degrees, and below 35 is called hypothermia, which means the body is too cold to work properly. At 31 she is dangerously cold and deeply asleep, but she is alive, and we can help her.

Clutched in Dr. Kaya's frozen glove is a small silver canister labeled MV-7.
clue: Dr. Kaya is holding a silver canister labeled MV-7.
> Find out how to thaw her safely -> manual

=== manual
scene: cryo-bay
cast: hero, robot:thinking, captain
SWEEP-9 projects the station's medical guide onto the wall, while Captain Strand reads along on your helmet screen.

"COLD EMERGENCY GUIDE. Move the person to a warm place. Handle them gently, because a very cold heart can beat unevenly if the body is jolted. Warm the chest and belly before the arms and legs. Rewarm slowly, using warm air or heated blankets. Never use flames or high heat. They can burn skin and crack a helmet visor. Only give warm, sweet drinks to a person who is awake and able to swallow."

Captain: If you can't follow that guide exactly, tell me immediately, and I will scrub your mission and send my own medical team instead.
? RI.1 : Which sentence from the guide explains why you must not use high heat?
+ "They can burn skin and crack a helmet visor."
- "Move the person to a warm place."
- "Warm the chest and belly before the arms and legs."
- "Rewarm slowly, using warm air or heated blankets."
hint: Find the sentences about flames and high heat. Which one tells what they can do?
next: thaw-choice

=== thaw-choice
scene: cryo-bay
cast: hero, astronaut:frozen, kid:thinking
Dr. Kaya's air counter ticks down to 50 minutes, and Arlo points at two tools hanging on the wall.

The first is a plasma cutter, which could slice through the ice in roughly thirty seconds, although its handle carries a warning sticker shaped like a flame. The second is a portable heater fan that blows warm air, and it would need twenty minutes or more to soften the ice enough to free her.

Kid: Twenty minutes is a long time. But fifty minutes of air is definitely more than twenty, isn't it?

Quill looks from the plasma cutter to the medical guide still glowing on the wall, and then back to the cutter, while her feathers fluff up nervously inside her bubble helmet.
> Use the plasma cutter. It's faster! -> lose-torch
> Use the warm-air fan, slowly -> thaw

=== lose-torch
scene: cryo-bay
cast: hero, captain:angry, quill:sad
You lift the plasma cutter, and its tip flares white-hot. Before you can bring it anywhere near the ice, every alarm in your helmet sounds at once.

Captain: CADET, STOP! Put that down right now!

Captain Strand saw everything through your helmet camera. A second later her voice is calm again, but extremely firm: she is scrubbing your part of the mission. Her medical team arrives within minutes and thaws Dr. Kaya slowly with warm air, exactly as the guide described, and she wakes up safe and sound.

You spend the rest of the rescue aboard the shuttle, wrapped in a blanket and feeling miserable.

Quill: The guide warned us about high heat. Remember that fast is not the same thing as safe.
end: lose Mission Scrubbed

=== thaw
scene: cryo-bay
cast: hero, astronaut:frozen, quill:happy
You aim the heater fan at the ice while Arlo holds a second one. Gradually, the shell turns cloudy, then slushy, and finally it begins to drip, while Sweep mops up every drop before it can refreeze on the floor.

After twenty-two minutes, the last chunk slides away. You lower Dr. Kaya gently onto a padded sled and wrap her chest in a heated blanket first, exactly as the guide instructed. Then you tow her out of the freezing bay and through the warm corridor to the medical room, avoiding every bump.

Quill: Gently and steadily. That's precisely right.

Sweep's display flashes a cheerful update: AIR SUPPLY 26 MINUTES. BODY TEMPERATURE RISING. MESS LEVEL ACCEPTABLE.
> Wait beside her as she warms up -> wake

=== wake
scene: lab
cast: hero, astronaut:sad, kid
An hour later, Dr. Kaya's temperature has climbed to 35 degrees, and she is shivering hard, which Quill explains is a good sign, because shaking muscles generate heat. You help her remove her helmet, and once she is fully awake, Arlo hands her a mug of warm, sweet cocoa.

Astronaut: Arlo? You're safe! I remember putting on my suit so I wouldn't breathe the spores. I planned to keep the cure frozen until I reached the air system. Then the pipe burst.

She lifts the silver canister, and you notice a tiny jar tucked in her suit pocket that glows a soft blue rather than green, although she doesn't mention it.

Astronaut: MV-7 is the cure, but this canister is empty, because the pipe burst before I could fill it. The full supply is locked in the deep freezer in the cryo bay.
clue: The full canister of MV-7 is locked in the deep freezer in the cryo bay.
? RL.1 : Which line from Dr. Kaya shows that going to the cold room was part of a plan?
+ "I planned to keep the cure frozen until I reached the air system."
- "Arlo? You're safe!"
- "The full supply is locked in the deep freezer in the cryo bay."
- "Then the pipe burst."
hint: Look for the line where Dr. Kaya explains what she meant to do. Which word shows that she had a plan?
next: ch2-end

=== ch2-end
scene: lab
cast: hero, astronaut, quill:happy
Dr. Kaya wraps both hands around her cocoa, and gradually her face changes from grayish blue to a healthier pink.

Astronaut: MV-7 is a mycovirus, which is a virus that infects only fungi. It attacks glowcap and nothing else, so it's completely harmless to people and plants. Once it's sprayed into the air system, it will travel through the vents exactly the way the spores did.

Quill: So the cure will travel the same road as the problem. How remarkably tidy.

Astronaut: There is one complication, though. MV-7 must stay frozen until the moment it's used. The freezer code is the freezing point of water followed by its boiling point, in the old Fahrenheit scale.
? RL.2 : Which is the best objective summary of Chapter Two?
+ You safely thawed Dr. Kaya, who said the cure is in the freezer.
- Dr. Kaya was frozen like a popsicle, and the crew is doomed.
- Arlo discovered that marshmallows are the cure for glowcap.
- Captain Strand rescued everyone, and the mission is over.
hint: An objective summary tells the key events without exaggeration. Whom did you rescue, and what did she tell you about the cure?
next: ch3

# ============================================================
# CHAPTER THREE: THE MARSHMALLOW PARADE
# ============================================================

=== ch3
scene: cryo-bay
cast: hero, quill:thinking, kid
checkpoint
clue: The freezer code is the freezing point of water, then its boiling point, in Fahrenheit.
~ Chapter Three ~

You hurry back to the cryo bay, where a squat freezer the size of a refrigerator hums in the corner. Its display reads MINUS 80 C, and a numbered keypad blinks beside the handle, waiting for a code.

Kid: Freezing point, then boiling point. That's easy, it's zero and one hundred!

Quill tilts her helmet thoughtfully.

Quill: That's correct in Celsius, the scale that scientists normally use. However, Dr. Kaya specifically said the old Fahrenheit scale, in which water freezes at 32 degrees and boils at 212 degrees.
> Enter the code 0-100 -> wrong-code
> Enter the code 32-212 -> canister

=== wrong-code
scene: cryo-bay
cast: hero, kid:sad, quill
The keypad gives an unhappy buzz, and a red light flashes a warning: INCORRECT CODE. PLEASE TRY AGAIN.

Arlo groans almost as dramatically as a zombie and presses his helmet against the freezer door.

Kid: Sorry, that was my fault. I always confuse the two temperature scales.

Quill: Zero and one hundred are the freezing and boiling points in Celsius, but Dr. Kaya was very specific about using Fahrenheit. Let's reread the clue carefully before we guess again, because a detective who rushes usually ends up guessing twice.
> Try the code again -> ch3

=== canister
scene: cryo-bay
cast: hero, astronaut, robot
The keypad chirps, the lock clunks open, and a cloud of icy fog spills out. Inside, nestled in a box of dry ice, is a full silver canister of MV-7. Dr. Kaya has followed you, wrapped in three blankets.

Astronaut: Keep it in the cold box until the very last second, because above ten degrees Celsius, MV-7 survives for only about five minutes. The air system is in the engineering room, and there are two ways to reach it. The service tunnel is cold, but the crew has wandered in there. The greenhouse is a shortcut, but it's thirty degrees inside, which is far too warm.

SWEEP-9 rolls in and beeps nervously.

Robot: Update. The zombies are now in the service tunnel, holding a slow-motion meeting about honey.
> Find out how the crew is doing -> zombie-pov

=== zombie-pov
scene: cryo-bay
cast: kid:sad, robot, zombie
On Sweep's camera feed, you watch Commander Brask lead the crew in a slow shuffle through the service tunnel, groaning a long, mournful note.

Robot: Report. Commander Brask is traveling at 0.8 kilometers per hour. He has said "marshmallow" 412 times today. Threat level: sticky.

Arlo touches the screen where his father's face glows faintly green.

Kid: He used to read me stories about the first astronauts on the Moon, every single night, even when he was exhausted. I just want him to sound like himself again.

Zombie: Mmmmarshmallowwwws...
? RL.6 : How do Sweep's and Arlo's points of view about Commander Brask differ?
+ Sweep sees him as numbers and data; Arlo sees a dad he misses.
- Sweep is afraid of him, but Arlo is not afraid at all.
- Both of them think the Commander is dangerous.
- Arlo only cares about speed, while Sweep cares about family.
hint: Compare Sweep's report, full of speeds and counts, with Arlo's memory of bedtime stories.
next: route

=== route
scene: space-corridor
cast: hero, quill:thinking, kid
You hold the cold box tightly against your chest. The greenhouse door is right in front of you, with warm air puffing out around its edges, while the cold service tunnel lies at the bottom of a long ladder, crowded with the crew.

Kid: The greenhouse is way shorter. If we sprint, we could get through in two minutes, or maybe three.

Quill: Or maybe ten, if a zombie decides to hug us. Remember what Dr. Kaya told us about warm air and MV-7.

Even here, the frost on the canister is already beginning to bead into tiny droplets.
> Run through the warm greenhouse -> lose-cure
> Take the cold service tunnel -> tunnel

=== lose-cure
scene: island-jungle
cast: quill:sad, zombie:happy, kid:scared
You burst into the greenhouse at a sprint, and warm, damp air wraps around you. You make it halfway down the bean rows before Dr. Amari steps out from behind a pumpkin, delighted to have visitors, and wraps his arms around all three of you.

Zombie: Huuuug...

It takes six long minutes to wriggle free. By the time you reach engineering, the canister is warm, and its label has faded from blue to gray, which means the MV-7 is no longer alive.

Dr. Kaya sends a message to Earth requesting a new batch, and twenty-five minutes later Mission Control replies that it will arrive in three weeks. Nobody is harmed, but the station remains a slow, groaning marshmallow festival for a very long time.

Quill: Dr. Kaya warned us about the heat. A shortcut isn't short if it ruins what you're carrying.
end: lose The Cure Melts

=== tunnel
scene: space-corridor
cast: hero, zombie:thinking, kid:thinking
The service tunnel is cold and dim. Ahead, the whole crew stands shoulder to shoulder, blocking the passage completely and groaning together like a sleepy choir.

Zombie: Mmmmm, sweeeeet...

Arlo slips something out of his jacket pocket: a single, slightly squashed marshmallow, which he has apparently been saving since yesterday.

Kid: This is my emergency marshmallow. I was saving it for a really terrible day, and I think today definitely qualifies.

He holds it high above his head, and every glowing mushroom in the tunnel swivels toward it at the same moment, like a field of sunflowers turning toward the sun.
> Let Arlo lead them away -> lure

=== lure
scene: space-corridor
cast: kid:happy, zombie:happy, quill
Arlo walks backward down a side passage, holding the marshmallow high. The crew follows in a solemn procession, one slow step at a time, groaning together as if they were a royal choir marching through a grand cathedral, with Commander Brask leading the way in tremendous dignity while his mushroom bobs.

Zombie: Mmmmarshmallowwwws...

Quill: I have witnessed far less organized parades on Earth.

When the last zombie disappears around the corner, the tunnel to engineering is empty, and Arlo's voice echoes faintly back to you, telling you to keep going while he keeps the crew busy.
? RL.4 : The zombies are called "a royal choir marching through a grand cathedral." What tone does this create?
+ A funny tone, because grand words describe something silly.
- A frightening tone, because the zombies are dangerous.
- A sad tone, because the crew will never recover.
- A serious tone, because it describes a real ceremony.
hint: Picture a grand, royal parade, and then picture sleepy green crew members following one squashed marshmallow. How do those two pictures feel together?
next: engineering

=== engineering
scene: space-bridge
cast: hero, astronaut, robot
In the engineering room, the gigantic air handler roars, pushing air to every corner of Mossgrove. Dr. Kaya talks you through the procedure over the radio, while Sweep holds a flashlight steady.

Astronaut: Listen carefully, because the order matters. Before you switch the fans to full power, the hatch must be sealed, or the mist will leak out in that room instead of traveling through the vents. First, open the sprayer hatch. Load the canister only after the hatch is open, obviously, and seal the hatch immediately after loading it.

Robot: Canister temperature: rising. Recommendation: hurry, but do not panic.
? RL.5 order : Put Dr. Kaya's steps in the correct order.
1 Open the sprayer hatch.
2 Load the MV-7 canister.
3 Seal the sprayer hatch.
4 Switch the fans to full power.
hint: Dr. Kaya says "first" for one step. Then look for "after," "immediately after," and "before" to find where each other step belongs.
next: cure

=== cure
scene: space-bridge
cast: hero, zombie:surprised, robot:happy
The fans thunder to full power, and a fine silver mist whooshes into the vents, drifting into every room on the station exactly the way the spores did.

Within an hour, the glowing fuzz on the crew begins to fade, the mushrooms shrivel and drop off like dry autumn leaves, and the groaning stops, one voice at a time.

Commander Brask stumbles into engineering, rubbing his eyes, his face still slightly green and his eyebrows dusted with marshmallow powder.

Zombie: Why am I holding a pumpkin? And why does my mouth taste like forty bags of marshmallows?

Then he sees Arlo in the doorway, and he rushes over and hugs his son so hard that they both topple over in a laughing heap.
> Gather everyone together -> theme

=== theme
scene: lab
cast: hero, astronaut:happy, quill
That evening, the whole crew sits in the medical room, wrapped in blankets and drinking water instead of honey, while Dr. Kaya looks around at everyone.

Astronaut: Every time we were in a hurry today, the fast choice was the wrong one: the plasma cutter, the greenhouse shortcut, leaping across the hub. What rescued us was slowing down, reading the guide, and doing things in the proper order.

Quill: Science isn't about being fast. It's about being careful enough to be right.

Dr. Kaya sips her cocoa, and the little jar in her pocket glows soft blue again.
? RL.2 : Which statement best expresses a theme of the story?
+ Careful, patient thinking solves problems better than rushing.
- Zombies are always more dangerous than they look.
- Marshmallows should be banned from space stations.
- It is best to wait for adults to fix everything.
hint: Reread what Dr. Kaya and Quill say about hurrying, reading the guide, and being careful enough to be right.
next: finale

=== finale
scene: space-bridge
cast: hero, captain:happy, kid:happy
Captain Strand calls from the Peregrine, beaming from ear to ear.

Captain: Mossgrove is cured, the crew is safe, and my newest cadet accomplished it all by the book. Mission Control will be absolutely thrilled, in approximately twelve and a half minutes.

Arlo grins proudly, because his father has just appointed him Mossgrove's official spore detective.

Kid: Before you leave, we're having a celebration breakfast. Dad says there will be no marshmallows ever again, but there will definitely be pancakes, and Sweep has promised not to mop anybody's plate.
> Write the report to Mission Control -> end-report
> Stay for the pancake breakfast -> end-breakfast
> Ask Dr. Kaya about her blue jar -> jar

=== end-report
scene: space-bridge
cast: hero, captain:happy, quill:happy
You sit at the shuttle's console and compose your official report to Mission Control, describing the jammed filter, the spores, the frozen pipe and the cure, with every time and temperature in its proper place.

You press SEND, and the message races toward Earth at the speed of light. Twenty-five minutes later, the reply arrives: "Outstanding work, Cadet. Mossgrove Station is safe because you kept a cool head."

Quill: A cool head, in a cryo bay! Apparently Mission Control has a sense of humor after all.

Captain Strand pins a small silver snowflake to your collar, and you decide to wear it on every mission from now on.
end: win A Cool Head in a Cold Place

=== end-breakfast
scene: lab
cast: hero, kid:happy, zombie:happy
The galley is spotless again, thanks to SWEEP-9, who has been mopping all night and is tremendously proud of himself. The crew builds towers of pancakes topped with fresh tomatoes and beans from the greenhouse, which tastes considerably better than it sounds.

Commander Brask, now only slightly green around the ears, raises his glass of water.

Zombie: To the cadet, to the owl, to Dr. Kaya, and to my son, who led a zombie parade with one squashed marshmallow!

Everyone cheers, and Arlo turns bright red, but he is smiling, and he doesn't stop smiling for the rest of the day.
end: win Pancakes on Mossgrove

=== jar
scene: lab
cast: hero, astronaut:surprised, quill:thinking
Dr. Kaya blinks in surprise, then laughs and pulls the tiny jar from her pocket. Inside, a single mushroom glows a gentle, steady blue.

Astronaut: You noticed! This is my secret project, a glowcap variety I bred so that it produces no spores whatsoever. It can't spread, and it can't make anyone crave sugar. It simply glows.

She holds it up to the window, and its light shines softly against the enormous darkness of space.

Astronaut: I never told anyone, because I wasn't certain it would work. After today, though, I think this station could use a little gentle light.
> Help her plant it in the greenhouse -> end-secret

=== end-secret
scene: island-jungle
cast: hero, astronaut:happy, quill:happy
That night, you, Arlo and Dr. Kaya plant the blue glowcap along the greenhouse paths. Within a week it has spread into soft blue lines that glow between the bean rows like a runway of stars.

The crew names it the Night Garden. Whenever anyone on Mossgrove can't sleep, they wander there and gaze out at Mars, illuminated by the gentle glow of a fungus that once caused all the trouble.

Quill: You noticed a tiny blue light that nobody else paid attention to. That is exactly what makes a true explorer.
end: secret The Night Garden
