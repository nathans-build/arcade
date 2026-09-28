title: Signal Under the Ice
author: SpiderBen10's Arcade
genre: space
band: 6-8
cover: planet-surface
blurb: A strange signal is counting in prime numbers from under an alien moon's ice. The drill starts at 0600.
start: start

# ============================================================
# CHAPTER ONE: THE SIGNAL
# ============================================================

=== start
scene: space-bridge
cast: captain, robot:happy, quill
checkpoint
clue: The Deep Drill will begin melting through Nerida's ice at 0600 tomorrow.
~ Chapter One ~

The research ship Kestrel glides in orbit around Nerida, an icy moon that circles the enormous gas giant Talos. Through the bridge window, Talos fills half the sky with swirling orange and cream stripes, while Nerida below looks like a cracked white marble.

You are the youngest cadet on board, and Quill the owl, the ship's librarian, is your best friend. Tomorrow at 0600 the crew will launch the Deep Drill, a probe designed to melt its way through the moon's ice.

Captain: Cadet, the communications console has been beeping all night, and I would like somebody to find out why.

Robot: I have a theory, Captain. It could be the toaster in the galley, which has been acting suspicious.
> Go to the lab to hear the signal -> lab-signal
> Check the antenna with Bolt -> antenna

=== lab-signal
scene: lab
cast: hero, scientist:surprised, kid
clue: The signal repeats in groups of 2, 3, 5, 7, and 11 pulses, then pauses and starts again.
In the ship's laboratory, Dr. Tomas Ruiz is hunched over a screen, listening to a recording through a pair of enormous headphones. He hands them to you without saying a word.

You hear a series of soft electronic pulses. First two pulses, then a pause, then three, then five, then seven, and then eleven, before a long silence. After that, the entire pattern begins again, exactly the same.

Kid: It is probably just a glitch, since the sensors on this ship are older than my grandmother.

Your fellow cadet Pip Navarro shrugs and returns to a bag of freeze-dried strawberries, although you notice Pip keeps glancing back at the screen.

Scientist: It is not a glitch, and it is not coming from the ship. It is coming from beneath the ice.
> Report to the briefing room -> briefing

=== antenna
scene: space-corridor
cast: hero, robot:thinking, quill
clue: The antenna is working perfectly. The signal truly comes from under Nerida's ice.
Bolt the robot rolls down the corridor beside you, humming a song that is mostly beeps. Quill the owl, the ship's librarian, rides on top of Bolt's square head.

Bolt plugs into the antenna control panel, and the diagnostic lights blink green, one after another.

Robot: The antenna is functioning perfectly. I must also report that the toaster is innocent, and I apologize to it.

Quill: Then the signal is real. Where is it coming from?

Robot: According to my calculations, it originates beneath the ice of Nerida, near the planned drill site. It repeats in groups of two, three, five, seven, and eleven pulses.

Quill fluffs her feathers thoughtfully, because she has read a great many books, and that pattern looks familiar.
> Report to the briefing room -> briefing

=== briefing
scene: space-bridge
cast: captain, quill, kid
clue: Briefing: Nerida's ocean stays liquid because Talos's gravity squeezes and stretches the moon, producing heat.
clue: Briefing: Landers must stay at least 5 kilometers from the Tiger Rift, where plumes erupt without warning.
The Captain projects the official mission briefing onto the bridge screen, and everyone reads it together.

"Nerida is covered by a shell of ice many kilometers thick, but beneath that ice lies a global ocean of salty liquid water. The ocean stays liquid because Talos's gravity constantly squeezes and stretches the moon, producing heat inside it. The Deep Drill will melt through a thin section of ice near the Blue Basin to collect water samples. Landers must stay at least 5 kilometers from the Tiger Rift, where plumes of water vapor and ice erupt from the cracks without warning."

Captain: Our goal is simple. We are here to learn what is hiding in that ocean.
? RI.2 : What is the central idea of the mission briefing?
+ The crew will drill through Nerida's ice to study the ocean below.
- Nerida is a warm moon covered by tropical forests.
- The crew will land directly on the Tiger Rift to see the plumes.
- Talos is a small rocky planet with no gravity.
hint: The briefing describes the ocean, the drill, and the rules. What is the main purpose connecting all of them?
next: analysis

=== analysis
scene: lab
cast: scientist:happy, kid:surprised, quill
clue: Prime numbers can be divided evenly only by 1 and themselves. Natural objects like pulsars send regular pulses, not primes.
Back in the laboratory, Dr. Ruiz writes the signal on the whiteboard in large numbers: 2, 3, 5, 7, 11.

Scientist: These are prime numbers, which can be divided evenly only by one and by themselves. Natural objects in space, such as the spinning stars called pulsars, send out regular pulses, like the ticking of an enormous clock. Nothing natural counts in prime numbers. That requires a mind.

Pip drops the bag of strawberries, and they drift slowly across the laboratory in the weak artificial gravity.

Kid: Wait, are you saying that somebody down there is actually counting, and trying to talk to us? Then we cannot just sit up here eating snacks, because we need to go down there immediately!

Quill: Hoo. It seems that our skeptic has suddenly become a believer.
? RL.3 : How does Pip's reaction to the signal change?
+ Pip goes from calling it a glitch to eagerly wanting to investigate.
- Pip starts out excited but becomes bored and goes back to snacking.
- Pip is frightened the whole time and wants to leave Nerida.
- Pip never believes the signal is real at all.
hint: Compare what Pip says in the lab at first with what Pip says after Dr. Ruiz explains prime numbers.
next: glow

=== glow
scene: lab
cast: scientist:thinking, kid, quill
clue: A probe camera caught a faint blue glow moving under the ice. Bioluminescent means making light by living things.
Dr. Ruiz brings up a blurry image from a probe camera that photographed the ice last week. Beneath the frozen surface, a cluster of faint blue lights seems to be drifting slowly, like paper lanterns floating underwater.

Scientist: At first I assumed this was only a reflection, but now I wonder whether it might be bioluminescent, like the glowing fish in the deepest parts of Earth's oceans, or like fireflies on a summer evening.

Kid: Bio-what? That word sounds like a sneeze.

Quill: Break the word into its parts, because the parts carry the meaning. The Greek root bio means life, and the Latin root lumen means light, so when you put them together, you have an extremely useful scientific word.
? L.4 : Using the roots, what does "bioluminescent" mean?
+ Able to make its own light because it is a living thing
- Able to live without any light at all
- Made of glass that reflects sunlight
- Frozen solid inside a block of ice
hint: Bio- means life and lumin- means light. Dr. Ruiz compares it to glowing fish and fireflies.
next: captain

=== captain
scene: space-bridge
cast: hero, captain:thinking, scientist
Dr. Ruiz explains the prime numbers and the mysterious blue glow to Captain Amara Oyelaran, who listens with her arms folded and her expression completely unreadable.

Captain: This mission required years of preparation, and the Deep Drill is scheduled for 0600. Earth is so far away that radio messages, even traveling at the speed of light, take nearly an hour to arrive, so Mission Control cannot possibly make this decision for us.

She turns toward you, and her expression softens slightly.

Captain: I will send a small team down in the lander Wren to investigate the source of the signal. If you discover genuine proof of intelligent life, I will reconsider the drill, but otherwise we drill at 0600, exactly as planned.
> Look out the observation window -> window

=== window
scene: space-corridor
cast: hero, kid:thinking, quill
Before bed, you and Pip float to the observation window, where Nerida turns slowly beneath the ship like a cracked white egg.

Kid: I still do not understand how there can be liquid water under all that ice, when the surface is colder than anything in a freezer on Earth.

Quill: Think about what happens when you bend a paperclip back and forth many times. It grows warm, because bending creates heat. As Nerida travels around Talos, the giant planet's gravity squeezes and stretches the whole moon, over and over, and that constant flexing produces enough heat to keep the ocean liquid.

Pip stares at the moon for a long time, imagining an entire hidden ocean sloshing quietly in the dark.
> Try to get some sleep -> chapter1-end

=== chapter1-end
scene: space-corridor
cast: hero, kid, quill
That night, in the narrow bunk room, you cannot sleep. Pip is on the bunk above yours, whispering questions into the dark, and Quill is perched on the reading lamp.

Quill: Let us review what has happened so far, just the facts, so that tomorrow we remember what matters.

You think back over the day. The Kestrel is orbiting the ice moon Nerida and is planning to drill into its hidden ocean at 0600. A strange signal counting prime numbers is coming from under the ice, and a probe camera spotted a blue glow. The Captain is sending a team down to find proof of life before the drill begins.
? RL.2 : Which is the best objective summary of Chapter One?
+ A signal counting primes comes from the ice; a team will investigate.
- Pip is the most annoying cadet on the whole ship.
- The toaster in the galley was sending secret messages.
- Aliens attacked the Kestrel, and the crew fled home.
hint: An objective summary lists the main events without opinions. Which choice tells what actually happened?
next: chapter2

# ============================================================
# CHAPTER TWO: LANDING ON NERIDA
# ============================================================

=== chapter2
scene: space-corridor
cast: kid:happy, robot, quill
checkpoint
~ Chapter Two ~

At 0300, the landing team gathers at the airlock and climbs into spacesuits. The suits are essential, because Nerida has almost no atmosphere, which means there is no air to breathe, and the surface temperature is colder than minus 170 degrees Celsius.

Robot: I have also packed extra radiation shielding, because Talos has a powerful magnetic field that traps dangerous particles around its moons.

Kid: Bolt, you are wearing a scarf.

Robot: It is a very scientific scarf.

Quill, who has her own tiny helmet shaped like a fishbowl, looks extremely dignified. Dr. Ruiz waves from the airlock window, because he must stay aboard to monitor the drill.
> Go through the airlock -> suit-check

=== suit-check
scene: space-corridor
cast: hero, robot:happy, kid
Before anyone is allowed to board the lander, Bolt performs a safety inspection of every spacesuit, checking the seals, the heaters, the radios, and the oxygen tanks one by one.

Robot: Each suit carries enough oxygen for six hours of normal activity. Please remember that hard work, such as running or climbing, uses oxygen much faster, so check your wrist gauge often.

Kid: What happens if we run out?

Robot: You will not run out, because you will read your gauge and return to the lander when it reaches 30 percent. That is the rule.

He taps your wrist gauge twice for emphasis, and it glows a reassuring green: 100 percent.
> Board the lander Wren -> descent

=== descent
scene: space-bridge
cast: kid:happy, robot, quill:scared
The lander Wren separates from the Kestrel and spirals down toward Nerida. Pip is at the controls, because Pip is a pilot in training, and you are sitting in the co-pilot's seat.

Far to the left, a brilliant plume of ice crystals is erupting from a long crack in the surface, glittering in the distant sunlight like a fountain of diamonds.

Kid: That must be the Tiger Rift, and we should fly right up beside it, because the photographs would be absolutely incredible!

Quill: Be careful, Pip. Do you remember the ancient story of Icarus? He flew too close to the Sun on wings made of feathers and wax, and when the wax melted, he tumbled into the sea.
? RL.4 : What does Quill suggest by mentioning Icarus?
+ Getting too close to something dazzling can end in disaster.
- Pip should build wings made of wax.
- The lander will melt if it flies too near the Sun.
- Icarus was a famous pilot who landed on Nerida.
hint: Quill retells the myth right after mentioning Icarus. What happened to him when he got too close?
next: approach

=== approach
scene: space-bridge
cast: hero, kid:thinking, robot
Bolt displays two possible landing sites on the navigation screen. The first is a smooth, flat plain about 8 kilometers from the Tiger Rift, and the second is a spot right at the edge of the rift, where the view of the plumes would be spectacular.

Robot: Both sites are within walking distance of the signal source, although the rift site is closer.

Pip chews a lip nervously and scrolls back through the mission briefing, reading it again line by line, searching for the rule about landing sites.

Kid: I remember the Captain saying something about the rift, but I cannot remember the exact reason.
? RI.1 : Which sentence from the briefing explains why the lander should avoid the rift?
+ "Plumes of water vapor and ice erupt from the cracks without warning."
- "Nerida is covered by a shell of ice many kilometers thick."
- "The Deep Drill will melt through a thin section of ice."
- "We are here to learn what is hiding in that ocean."
hint: Look for the briefing sentence that describes what happens at the Tiger Rift.
next: landing-choice

=== landing-choice
scene: space-bridge
cast: kid, robot:thinking, quill
The Wren's engines rumble beneath your seats. The glittering plume at the rift is so beautiful that it is difficult to look away, and Pip's hands hover over the controls.

Kid: The rift site would save us a long walk, and we are already short on time. What do you think?

Robot: My job is to supply information, not opinions. However, my information includes the mission briefing, which is extremely clear.

Quill says nothing at all, but she looks at you with her enormous golden eyes, waiting to see which rule you will remember.

The decision is yours, co-pilot.
> Land on the smooth plain, as ordered -> plain
> Land beside the rift for a closer look -> lose-rift

=== lose-rift
scene: planet-surface
cast: kid:scared, robot:surprised, quill:sad
The Wren settles gently at the edge of the Tiger Rift, and for a moment everything is perfect. Then, without any warning, the ground trembles and a plume erupts from the crack just meters away.

A blizzard of ice crystals coats the lander, clogging its engines and freezing its sensors solid. Nobody is hurt, but the Wren is stuck, and it cannot take off.

The Kestrel sends a rescue shuttle, and by the time you are safely back aboard, it is past 0600. The Captain has scrubbed the landing mission, and the drill has already begun.

Quill: The briefing warned us that the plumes erupt without warning. We chose the view instead of the evidence.
end: lose Frozen at the Rift

=== plain
scene: planet-surface
cast: robot:happy, kid:happy, quill
clue: Nerida's gravity is about one-eighth of Earth's, so everything weighs much less.
The Wren lands safely on the smooth plain, and you step out onto the ice of an alien world. Above you, Talos hangs in the black sky like an enormous striped marble, so close that you feel you could almost reach up and touch it.

Nerida's gravity is only about one-eighth of Earth's, so every step turns into a slow, floating bounce. Bolt tries to roll forward, bounces three meters into the air, and lands upside down.

Robot: I would like to report that I meant to do that.

Kid: Bolt, your wheels are spinning at the sky.

Quill: The stars look like a spill of sugar across black velvet, and there is no air here to make them twinkle.
? L.5 : What does "a spill of sugar across black velvet" help you picture?
+ Countless tiny, bright stars scattered across a dark, soft-looking sky
- Real sugar floating in space around the lander
- A dessert that Bolt is making for the crew
- A dark cloud of dust hiding all of the stars
hint: This is a simile. Think about what spilled sugar looks like on a dark cloth, and what Quill is looking at.
next: trek

=== trek
scene: planet-surface
cast: hero, robot, kid
The signal is coming from the northwest, about three kilometers away, and Bolt's scanner beeps faster as you face that direction. In space there is no air to carry sound, so you hear the beeps only through your helmet radio.

Ahead of you, the smooth ice is split by a long, narrow crevasse, a crack in the ice about four meters wide. Bolt has already mapped a safe path that curves around the end of the crevasse, but it adds almost an hour to the walk.

Kid: In this gravity, I bet we could jump that crack easily, since we weigh so much less here.

Robot: Pip is scientifically correct, which is extremely annoying.
> Jump across the crevasse -> crevasse
> Follow Bolt's safe path around it -> path

=== crevasse
scene: planet-surface
cast: hero, kid:happy, quill
You back up, take a running start in slow motion, and leap. Because Nerida's gravity is so weak, you sail across the crevasse in a long, lazy arc and land on the other side with plenty of room to spare.

Pip follows, whooping so loudly over the radio that your ears ring. Quill simply spreads her wings and glides, looking unimpressed.

Kid: That was the greatest moment of my entire life, and I have eaten pizza in zero gravity.

Bolt, who cannot jump, uses his extendable arm to hook a rope over an ice ridge and swings across, shrieking the whole way.

You have saved almost an hour. Ahead, the signal grows stronger.
> Follow the signal -> ice-cave

=== path
scene: planet-surface
cast: hero, robot:happy, quill
You follow Bolt's safe path around the end of the crevasse. It is a long walk, but it gives you time to admire a landscape that no human being has ever seen before.

Robot: Would you like to hear some facts while we walk? I currently know four thousand facts about ice.

Quill: Perhaps just three of them would be sufficient.

Bolt explains that Nerida's surface ice is so cold that it is as hard as rock, that the reddish-brown streaks come from salts rising up from the ocean below, and that the cracks form because the moon is constantly being squeezed and stretched by Talos.

At last you reach the source of the signal, a jagged opening in the ice that glows a faint, mysterious blue.
> Enter the ice cave -> ice-cave

=== ice-cave
scene: cave
cast: kid:surprised, robot, quill
clue: The floor of the ice cave is thin, clear ice over the ocean, and blue lights move beneath it.
The cave slopes gently downward into the ice. At the bottom, the floor becomes a smooth window of clear ice, and far below it lies the dark ocean. Beneath the ice, blue lights are slowly drifting and pulsing.

Kid: This is unbelievable, because it is like standing inside a sapphire, and the lights are dancing as if they are happy to see us!

Robot: Correction, the lights are pulsing at a wavelength of 470 nanometers, at a depth of approximately eleven meters, and I have no data whatsoever about whether they are happy.

Kid: Bolt, you have absolutely no poetry in your circuits.

Robot: I have checked my circuits carefully, and I can confirm that your statement is accurate.
? RL.6 : How do Pip's and Bolt's different points of view create humor here?
+ Pip describes the lights with feelings, and Bolt with dry numbers.
- Both describe the lights with the exact same scientific facts.
- Pip and Bolt both refuse to look at the lights.
- Bolt is excited, while Pip reports only measurements.
hint: Compare Pip's "like standing inside a sapphire" with Bolt's "470 nanometers." Who uses feelings, and who uses facts?
next: chapter2-end

=== chapter2-end
scene: cave
cast: hero, kid, quill:thinking
You kneel at the edge of the ice window and press your gloved hand against it, while the blue lights gather beneath your palm like curious fish.

Quill: Consider everything that happened today. The rift was dazzling, but the briefing warned us, and we listened. The crevasse was a chance to use what we know about gravity. At every step, the choices that worked best balanced curiosity with careful thinking.

Pip is quiet for a long moment, which is extremely unusual.

Kid: I almost flew us straight into that plume, just because it was pretty.

Quill: And yet here we are, because you listened.
? RL.2 : Which theme is developing in Chapter Two?
+ Curiosity works best when it is guided by careful thinking.
- Explorers should always choose the most exciting option.
- Rules are made to be broken during important missions.
- Robots are always wiser than humans.
hint: Quill describes the choices that worked best. What two things did they balance?
next: chapter3

# ============================================================
# CHAPTER THREE: VOICES UNDER THE ICE
# ============================================================

=== chapter3
scene: cave
cast: alien:happy, robot, quill
checkpoint
~ Chapter Three ~

Beneath the ice window, one of the lights rises slowly toward you, and at last you can see it clearly. It is a creature shaped like a glowing umbrella, as wide as a doorway, with long ribbons of light trailing gracefully beneath it.

It pulses in a pattern of two, three, five, seven, and eleven, while Bolt's lights flicker as he runs a translation program that turns the flashes into words.

Alien: We are the Lumen. We have listened to your thumping above the ice, and we counted to you, so that you would understand that we can think.

Quill whispers that you should send a polite answer, and Bolt offers to flash it, but the message must be one correct sentence.
? L.1 order : Build your first message to the Lumen as a correct sentence.
1 Because we heard your signal,
2 we
3 came here
4 to meet you in peace.
hint: Begin with the "because" clause, which ends with a comma. Then put the subject "we" before the verb.
next: lumen-story

=== lumen-story
scene: cave
cast: hero, alien, robot:thinking
The Lumen answers with a long ripple of patterns, and Bolt translates them into a story, one picture at a time.

Alien: Long ago, our ancestors lived in the deep dark, beside the warm vents at the bottom of the ocean. Over many generations, they rose upward and planted glowing gardens beneath the ice, where they could feel the light of Talos. Then, not long ago, we felt a great thumping from above. We were afraid, so we began counting, hoping someone up there could count too.

Robot: The thumping was our seismic test from last week, when we measured the thickness of the ice.
? RL.5 order : Put the events of the Lumen's story in the order they happened.
1 The Lumen's ancestors lived beside warm vents in the deep.
2 They rose upward and planted gardens beneath the ice.
3 They felt a great thumping from above.
4 They began counting to show they could think.
hint: The Lumen tells the story in time order. Look for "long ago," "over many generations," "then," and "so."
next: question

=== question
scene: cave
cast: alien:scared, kid, quill
The Lumen's light dims to a worried violet, and it asks a question that Bolt translates slowly and carefully.

Alien: Will the thumping come again? When it came before, the ice above our garden shook, and our young ones hid in the dark for many days.

Pip looks at you, and for once Pip has nothing funny to say. Both of you know that the Deep Drill will create far more than a thump, since it is designed to melt a tunnel straight through the ice.

Quill: We cannot promise what we do not control. But we can promise to tell the truth, and we can promise to try.
> Promise to try, then check the time -> countdown

=== countdown
scene: cave
cast: hero, kid:scared, robot
clue: The Deep Drill is aimed directly at the Lumen's glowing garden. It starts at 0600.
Your helmet radio crackles, and Dr. Ruiz's worried voice fills your ears. The Deep Drill is warming up on the surface, and it will begin melting downward in exactly forty minutes.

Bolt compares the drill's coordinates with his map of the cave, and his indicator lights turn an alarming shade of orange.

Robot: The drill is aimed at a point only two hundred meters from here, which means it will melt straight down into the Lumen's glowing garden.

Kid: We have to tell the Captain immediately, before it is too late!

You have forty minutes and several possible choices, and every one of them matters enormously.
> Radio the Captain with the evidence -> evidence
> Explore the glowing garden first -> garden
> Flash a reply to the Lumen yourself -> reply

=== garden
scene: cave
cast: hero, alien:happy, robot:scared
clue: Your oxygen gauge reads 30 percent, and Bolt warns you to head back.
You follow the ice window deeper into the cave, where the Lumen's garden spreads out beneath your boots. Crystal towers glow in every color, and tiny creatures dart between them like sparks from a campfire.

Your suit beeps. The oxygen gauge on your wrist reads 30 percent, and a yellow warning light is blinking.

Robot: Your oxygen is lower than planned, because walking in a spacesuit uses more air than resting. I strongly recommend returning to the lander now, while there is still a safe amount left.

Below the ice, the Lumen drifts deeper, as if inviting you to follow even farther.
> Keep going deeper into the garden -> lose-oxygen
> Head back and radio the Captain -> evidence

=== lose-oxygen
scene: planet-surface
cast: kid:scared, robot:sad, quill:sad
You go deeper, telling yourself that five more minutes cannot hurt. Then your suit's warning light turns red, and the alarm becomes a steady, insistent tone.

Bolt and Pip half-carry you back to the Wren, bouncing across the ice in giant, frantic leaps, and you plug into the lander's air supply with only minutes to spare. You are safe, but you are exhausted, and there is no time left to radio anyone.

At 0600, the Deep Drill begins melting downward, and beneath the ice, the blue lights go dark.

Quill: Your oxygen gauge was the most important thing you could read today, and we ignored it.
end: lose Running on Empty

=== reply
scene: cave
cast: hero, alien, kid:thinking
You switch on your helmet light and kneel beside the ice window. If you can continue the Lumen's pattern correctly, they will know for certain that humans can think in the same way they do.

The pattern is 2, 3, 5, 7, 11, and every one of those numbers is prime. You need the next number in the sequence, which must be the next number that can be divided evenly only by one and by itself.

Kid: Is it twelve? After all, twelve comes right after eleven, so that seems logical to me.

The Lumen waits patiently beneath the ice, glowing softly, as if it is holding its breath.
> Flash your light 12 times -> wrong-reply
> Flash your light 13 times -> secret

=== wrong-reply
scene: cave
cast: hero, alien:sad, quill
You flash your helmet light twelve times, and the Lumen's glow flickers uncertainly before slowly dimming.

Quill: Oh dear, twelve can be divided evenly by two, three, four, and six, so it is not a prime number at all, and the Lumen must think we did not understand the pattern.

The Lumen does not swim away, but it drifts downward slightly, as though it is disappointed and trying to decide whether to trust you after all.

Quill: Unfortunately, there is no time to try again, because the drill starts in less than thirty minutes. We must get convincing proof to the Captain some other way.
> Radio the Captain with the evidence -> evidence

=== secret
scene: cave
cast: hero, alien:happy, quill:happy
You flash your helmet light thirteen times, and the Lumen blazes with joy. It answers with seventeen, nineteen, and twenty-three flashes, and then, one by one, dozens of Lumen rise out of the darkness until the entire ice floor is glowing.

Dr. Ruiz, watching through your helmet camera, gasps so loudly that the Captain comes running, and within seconds she orders the drill shut down.

The Lumen arrange themselves into a single shining picture beneath your feet, which turns out to be a map of Talos and all its moons, with a bright dot glowing on the far side of a moon that nobody has ever explored.

Alien: There are others like us there, so go and say hello.
end: secret The Thirteenth Flash

=== evidence
scene: cave
cast: captain:thinking, kid, quill
The Captain's face appears on your wrist screen, calm but tired, while behind her the countdown to the drill reads twenty-five minutes.

Captain: Cadet, you have exactly one chance, so give me your strongest evidence that there is intelligent life down there.

You think quickly about everything you have learned since yesterday. The Lumen glow with blue light, and they live in a garden beneath the ice. Most importantly, their signal counts out prime numbers, and Dr. Ruiz explained that nothing natural counts in prime numbers, because that requires a mind.
? RL.1 : Which evidence most strongly shows the signal comes from intelligent life?
+ "Nothing natural counts in prime numbers. That requires a mind."
- "Beneath the ice, blue lights are slowly drifting and pulsing."
- "Nerida's gravity is only about one-eighth of Earth's."
- "They live in a garden beneath the ice."
hint: Glowing and living in a garden show life, but not thinking. Which quote shows a mind is sending the signal?
next: captain-log

=== captain-log
scene: space-bridge
cast: captain:sad, scientist, quill
On the bridge of the Kestrel, the Captain stares at the drill controls for a long moment, and then she speaks slowly and carefully into the official ship's log.

Captain: For years I believed that the purpose of this mission was simply to collect samples. However, science is about asking questions and listening to the answers, not about smashing through them. Today a young cadet reminded me that the most important discoveries require patience and respect.

Dr. Ruiz nods silently, and his eyes are shining.

Quill: Hoo. That is a sentence worth preserving in the ship's library forever.
? RL.2 : Which statement best expresses a theme of the whole story?
+ True discovery means listening to others with patience and respect.
- The fastest way to learn is to drill through every obstacle.
- Cadets should never question their captains.
- Alien life is dangerous and should be avoided.
hint: Reread the Captain's log. What does she say science is really about?
next: decision

=== decision
scene: space-bridge
cast: captain, scientist:thinking, kid
The countdown reads twenty minutes, and everyone on the bridge is watching your face on the screen.

Captain: I will make the final decision, Cadet, but I would like your recommendation first. We could move the drill to a new location, far away from the Lumen. We could cancel the drilling entirely. Or we could proceed as planned, since the Lumen might simply swim away from the drill.

Scientist: If we move it, we still collect our ocean samples, and nobody gets hurt.

Kid: If we cancel it, the Lumen will know for certain that we mean them no harm.

Meanwhile, the Lumen's blue lights are still pulsing patiently on the monitor.
> Move the drill to a new site -> new-site
> Cancel the drilling completely -> first-contact
> Let the drill go ahead as planned -> lose-drill

=== lose-drill
scene: planet-surface
cast: kid:sad, robot:sad, quill:sad
The drill begins at 0600, glowing red as it melts its way down through the ice, while everyone hopes the Lumen will simply move out of the way.

Instead, the blue lights beneath the ice window scatter and go dark, and the prime-number signal stops completely. Bolt scans the ocean for hours, but he detects nothing except silence.

The Kestrel eventually heads home with ice cores and water samples, but without the greatest discovery in human history, and nobody ever hears the Lumen count again.

Quill: They told us they were afraid of the thumping, and they asked for help. We had the evidence, but we did not act on it.
end: lose The Silent Sea

=== new-site
scene: planet-surface
cast: hero, scientist:happy, robot:happy
The Captain orders the Deep Drill moved fifty kilometers south, to a barren area where Bolt's scans detect no lights at all. Before the drilling begins, you flash a message to the Lumen, warning them that the thumping will be far away and will not harm their garden.

The drill reaches the ocean two days later, and Dr. Ruiz nearly faints from happiness when the first water samples arrive. Meanwhile, the Lumen continue counting, and every evening you count back with them.

Scientist: We collected our samples, and we protected our new neighbors, which is what I would call an excellent experiment.

Bolt has started learning to count in flashes, and he has reached one hundred.
end: win A Safer Place to Dig

=== first-contact
scene: cave
cast: hero, alien:happy, captain:happy
The Captain cancels the drilling. For the first time in history, human beings and an alien species exchange messages, one flash at a time, through a window of ice.

The following week, the Captain herself travels down to the ice cave. She kneels beside the ice window, switches on her helmet light, and counts to eleven while the Lumen count along with her.

Captain: The samples can wait, because friendship is a far rarer discovery.

The Lumen answer with a shimmering pattern that Bolt translates as a single word, and that word becomes the name of the new research station on Nerida. The word is Welcome.
end: win First Contact
