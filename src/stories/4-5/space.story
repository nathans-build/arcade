title: Stowaway on the Starship Dandelion
author: SpiderBen10's Arcade
genre: space
band: 4-5
cover: space-bridge
blurb: A giggling alien is hiding on your ship to Mars! Help it get home to its comet and deliver the seeds on time.
start: start

# ============================================================
# CHAPTER 1: Giggles in the Vents
# ============================================================

=== start
scene: space-bridge
cast: hero, quill, captain
checkpoint
~ Chapter One ~

You and Quill are guest crew members on the Starship Dandelion, three days away from Mars. The ship is carrying ten thousand seeds to the greenhouse at Red Rock Base, where scientists are trying to grow the first Martian vegetable garden.

Captain Reyes frowns at her clipboard.

Captain: Something strange is happening on my ship. Snacks keep disappearing, and I keep hearing giggles coming from the air vents.
> Check the snack pantry -> pantry
> Ask Bolt the robot what he knows -> bolt

=== bolt
scene: space-corridor
cast: hero, quill, robot:thinking
Bolt, the ship's helper robot, rolls down the corridor with his antenna spinning. He is shaped like a mailbox and beeps whenever he thinks.

Robot: Beep. My sensors have recorded fourteen giggles, three burps, and one missing banana since Tuesday. Conclusion: the ship has a ghost, or the ship has a very hungry guest.

Quill: I don't think ghosts eat bananas, Bolt.

Robot: Beep. Good point. Updating my files.
> Search the air vents with Bolt -> vents
> Go look in the pantry -> pantry

=== pantry
scene: space-corridor
cast: hero, quill:surprised
The pantry door slides open with a whoosh. Crackers, noodle cups, and dried fruit are scattered across the shelves, and somebody has nibbled every single cracker into the shape of a star.

On the floor you spot a trail of crumbs that glow faintly green. Next to them are tiny footprints, and each one has three round toes.

Quill: Three toes and glowing crumbs? That's no ordinary snack thief!

The trail leads straight to an open air vent near the ceiling.
> Climb up to the air vent -> vents

=== vents
scene: space-corridor
cast: hero, quill, alien:scared
You squeeze into the air vent and shine your flashlight down the tunnel. Something squeaks, and then it simply vanishes, leaving only a pair of blinking eyes floating in the dark.

Quill: It turned invisible! The prefix "in" can mean "not," so invisible means it cannot be seen.

Slowly, the rest of the creature fades back into view. It is round like a jellybean, about the size of a teacup, and covered in glowing freckles.
? L.4 : The prefix "in-" means "not." What does "invisible" mean?
+ not able to be seen
- able to glow in the dark
- very small and round
- not able to move
hint: Quill explains that "in" means "not." Put "not" together with "visible," which means able to be seen.
next: zib-talk

=== zib-talk
scene: space-corridor
cast: hero, quill, alien:sad
Alien: Please don't be mad! I'm Zib. I only ate the crackers because I was so hungry, and I'm very sorry about the banana.

Zib explains that it lives on a comet called Glimmer with a big, noisy family. When Glimmer swooped past Earth, Zib leaned out too far to wave at the Moon and tumbled off. It hid on your ship because it was lonely and frightened.

Alien: Glimmer passes by Mars in two days. I miss my family so much.
? RL.3 : Which words best describe Zib, based on what it says and does?
+ hungry, lonely, and missing its family
- mean, sneaky, and proud of stealing
- bored, sleepy, and grumpy
- brave, loud, and bossy
hint: Reread what Zib says. Why did it eat the crackers? How does it feel about its family?
next: captain

=== captain
scene: space-bridge
cast: hero, alien:scared, captain:thinking
You carry Zib to the bridge in your cupped hands. Captain Reyes studies the little alien for a long moment while Zib trembles.

Captain: Well, Zib, on my ship we have one important rule. Nobody gets left behind in space. We'll help you get home.

Zib glows bright pink and does a happy somersault in your palm.

Captain: But first, we need to understand comets better. Where should we start?
> Read the ship's log about comets -> log-comet
> Show Zib the ship's star map -> starmap

=== log-comet
scene: space-bridge
cast: hero, quill:thinking, alien
Quill reads from the ship's science log.

"Comets are giant balls of ice, dust, and rock that travel around the Sun. Far from the Sun, a comet is frozen solid. But when a comet gets close to the Sun, the heat makes some of its ice vaporize, or turn into gas. The gas and dust stream out behind the comet, making a long, glowing tail. The tail always points away from the Sun."

Alien: That's my house you're talking about!
? RI.4 : In the ship's log, what does the word "vaporize" mean?
+ to turn into gas
- to freeze solid
- to break into rocks
- to glow brightly
hint: Look right after the word "vaporize" in the log. The log explains it using the word "or."
next: ch1-end

=== starmap
scene: space-bridge
cast: hero, quill, alien:happy
The star map glows across the whole ceiling of the bridge, full of planets and swirling paths. Zib floats up and points at a bright dot with a long, shiny tail.

Alien: That's Glimmer! That's home! When my family wants to find each other, we sing our special song. It has three notes, low, then high, then middle.

Zib hums the notes, and its freckles twinkle in the same order.
clue: Zib's family song has three notes: low, then high, then middle.
> Tell the Captain about the song -> ch1-end

=== ch1-end
scene: space-bridge
cast: hero, quill:happy, alien:happy
That night, Zib curls up to sleep in an empty teacup next to your bunk. Its freckles blink slowly, like a nightlight.

Quill: What a day! We solved the mystery of the missing snacks. The thief turned out to be a lost little alien named Zib, and now we're going to help it get back to its comet family.

You smile in the dark. Tomorrow, the real adventure begins.
? RL.2 : Which sentence best sums up Chapter 1?
+ You found Zib, a lost alien, and promised to help it get home.
- You caught a ghost who was stealing bananas from the ship.
- Captain Reyes decided to turn the ship around and go back to Earth.
- Bolt the robot ate all the crackers in the pantry.
hint: Listen to Quill's summary of the day. Who did you find, and what did you promise?
next: ch2

# ============================================================
# CHAPTER 2: Trouble in the Dark
# ============================================================

=== ch2
scene: space-bridge
cast: hero, captain:scared, robot:surprised
checkpoint
~ Chapter Two ~

WHAM! In the middle of breakfast, an alarm goes off and red lights flash across the bridge.

Robot: Beep beep beep! A small space rock, about the size of a pebble, has hit our antenna. We cannot call Mars. Also, my navigation map is scrambled like an omelet.

Captain: We need two things fixed, and quickly. Somebody has to repair the antenna outside, and somebody has to reset the navigation computer.
> Go on a spacewalk to fix the antenna -> spacewalk
> Reset the navigation computer -> nav

=== spacewalk
scene: space-corridor
cast: hero, robot, alien:happy
You squeeze into a puffy white spacesuit, and Bolt clips a safety cord to your belt. Zib insists on coming along, riding inside your helmet like a tiny glowing passenger.

The airlock door opens, and you float out into space. Stars glitter everywhere, sharper and brighter than you have ever seen them. The side of the ship shines like a frosted cookie in the sunlight.

Alien: Wheee! This is the best field trip ever!
? L.5 : The ship "shines like a frosted cookie in the sunlight." What does this simile describe?
+ The ship's surface is white and sparkly.
- The ship is made of sugar and flour.
- The ship smells like fresh cookies.
- The ship is small enough to eat.
hint: A simile compares two things using "like." What does a frosted cookie look like?
next: spacewalk-float

=== spacewalk-float
scene: space-corridor
cast: hero, robot, alien:thinking
You pull yourself hand over hand along the railing toward the antenna. Below your boots, there is nothing but stars.

To calm your nerves, Zib hums its family song inside your helmet: low, then high, then middle.

Alien: My family always answers this song, even from very far away. If they hear it, they come zooming!

At last you reach the antenna. It is bent sideways, like a flower that needs water.
clue: Zib says its family always answers the three-note song: low, high, middle.
> Help Bolt fix the antenna -> spacewalk-fix

=== spacewalk-fix
scene: space-corridor
cast: hero, robot:happy, alien
Bolt whacks the antenna back into place with his metal arm. You feel the thump through your gloves, but you don't hear a single sound.

Inside your helmet, a screen shows a page from the ship's science log.

"Sound travels by making air or water vibrate. Space is almost completely empty, with no air at all. Because there is no air to carry the vibrations, sound cannot travel through space."

Robot: Beep. Antenna fixed! Also, that was the quietest whack of my entire career.
? RI.3 : According to the log, why can't you hear Bolt whack the antenna?
+ There is no air in space to carry the sound.
- Bolt's metal arm is too soft to make noise.
- Your helmet has earmuffs built inside it.
- Sound travels too fast for ears to hear it in space.
hint: The log uses the word "because." Read what comes right after it.
next: ch2-end

=== nav
scene: space-bridge
cast: hero, quill, robot:surprised
You and Quill hurry to the navigation computer. Its screen is showing pictures of pickles, and Bolt is spinning in slow circles.

Robot: Beep. Next stop, the planet Pickle. Please fasten your sandwich.

Quill: Oh dear, his circuits are completely muddled. Is there an instruction manual?

You find a thick book tucked under the Captain's chair. It is called "How to Reset Your Navigation Computer," and someone has drawn a smiley face on the cover.
> Ask Zib to calm Bolt down -> nav-zib
> Open the manual right away -> nav-reboot

=== nav-zib
scene: space-bridge
cast: hero, robot:thinking, alien:happy
Zib floats over to Bolt and pats his metal head. Then it hums its family song: low, then high, then middle.

Bolt stops spinning, and his lights blink slowly and calmly.

Robot: Beep. That was a lovely melody. My circuits feel much less pickled now.

Alien: My family sings that song whenever someone feels lost. They always answer it, no matter how far away they are!
clue: Zib's family always answers its song: low, then high, then middle.
> Open the reset manual -> nav-reboot

=== nav-reboot
scene: space-bridge
cast: hero, quill:thinking, robot
Quill flips open the manual and reads the steps out loud.

"First, press the big blue button to turn off the computer. Next, count slowly to ten while the machine cools down. Then, press the blue button again to turn it back on. Finally, type in your destination and press Enter."

Quill: Instructions are a kind of text with a special structure. The steps must happen in order, and the signal words tell you which step comes when.
? RI.5 order : Put the steps for resetting the computer in the correct order.
1 Press the blue button to turn off the computer.
2 Count slowly to ten while it cools down.
3 Press the blue button again to turn it on.
4 Type in the destination and press Enter.
hint: Look for the signal words "First," "Next," "Then," and "Finally."
next: ch2-end

=== ch2-end
scene: space-bridge
cast: hero, captain:happy, alien:happy
By dinnertime, the Dandelion is humming smoothly again. The antenna works, and the navigation screen shows a bright red dot straight ahead. It's Mars!

Captain: Excellent work, crew. We're back on course, and we can finally call Red Rock Base.

Behind the red planet, a silver streak glides across the dark. It is Glimmer, Zib's comet, right on time.

Zib presses its face against the window and squeaks with joy.
? RL.2 : Which sentence best sums up Chapter 2?
+ The ship was damaged, but the crew fixed it and got back on course.
- A space rock destroyed the ship, and everyone had to go home.
- Zib flew back to its comet all by itself.
- The crew decided to land on the planet Pickle instead.
hint: Think about the problem at the start of the chapter and how it was solved by the end.
next: ch3

# ============================================================
# CHAPTER 3: The Red Planet
# ============================================================

=== ch3
scene: space-bridge
cast: hero, quill, captain
checkpoint
~ Chapter Three ~

The next morning, Mars fills the whole front window. It is enormous and rusty red, with swirls of pale dust and dark lines that look like old riverbeds.

Captain: We'll land at Red Rock Base in two hours. Meanwhile, Glimmer will pass closest to Mars this afternoon. We need a plan for the seeds and a plan for Zib.

Quill: Let's learn about Mars before we land. The ship's log has a chapter about it.
> Read the log about Mars -> mars-log

=== mars-log
scene: space-bridge
cast: hero, quill:thinking, alien:surprised
Quill reads from the log.

"Mars is the fourth planet from the Sun. It looks red because its rocks and dust contain iron oxide, which is the same thing as rust. Mars has two small moons, called Phobos and Deimos. Its air is very thin and mostly carbon dioxide, so people cannot breathe it. A day on Mars lasts about 24 hours and 40 minutes."

Alien: A rusty planet? Does it squeak when it spins?
? RI.1 : According to the ship's log, why does Mars look red?
+ Its rocks and dust contain iron oxide, which is rust.
- It is the planet closest to the hot Sun.
- Its two moons shine red light onto it.
- Its air is full of red carbon dioxide.
hint: Find the sentence in the log that begins, "It looks red because..."
next: zib-note

=== zib-note
scene: space-bridge
cast: hero, quill, alien:sad
Zib floats over, holding a crumpled paper with both tiny hands. It has written you a note in wobbly, glowing letters.

"Dear friend, when I fell off my comet, I felt so small and scared. Then you found me in the vents, and you weren't even mad about the banana. I will miss you and Quill very much when I go home. Love, Zib."

Zib sniffles, and one freckle blinks like a tiny teardrop.
? RL.6 : Who is the narrator of the note, and how can you tell?
+ Zib wrote it, using "I" and "me" to tell about its own feelings.
- Quill wrote it, because Quill is a librarian.
- The Captain wrote it, because she is in charge of the ship.
- Bolt wrote it, because robots have neat handwriting.
hint: Look at who signed the note, and at words like "I felt" and "I will miss you."
next: theme

=== theme
scene: space-bridge
cast: hero, captain:happy, alien
Captain Reyes kneels down so she can look Zib in the eye.

Captain: Zib, do you remember our rule? Nobody gets left behind in space. You were far from home and needed help, so we helped. That's what good crewmates do for each other, whether they're human, robot, owl, or alien.

Zib's freckles turn a warm, happy gold.

Alien: Then I'm lucky to be part of the best crew in the whole galaxy!
? RL.2 : What is the theme, or big lesson, of this story?
+ Helping others, even strangers, is the right thing to do.
- Aliens should never be allowed on spaceships.
- It is fine to take snacks as long as you are hungry.
- Space is too dangerous for anyone to travel in.
hint: Reread the Captain's rule and what she says good crewmates do.
next: decide

=== decide
scene: space-bridge
cast: hero, quill:thinking, captain
The Captain spreads a map of Mars across the table. Red Rock Base is marked with a green star, and Glimmer's path is a curvy silver line.

Captain: We have the seeds to deliver and a comet to catch. You've been a wonderful crewmate, so I'll let you decide what we do next.

Quill taps the radio with one wing. Now that the antenna is fixed, it can send messages far across space.
> Land at Red Rock Base first -> land
> Fly out to meet the comet first -> comet
> Radio Zib's three-note song -> song

=== land
scene: planet-surface
cast: hero, quill, scientist:happy
The Dandelion settles onto the red dust of Mars with a gentle bump. You bounce down the ramp in your spacesuit and nearly float over Quill's head.

Quill: That's because of gravity, the force that pulls things down toward a planet. On Mars, gravity pulls only a little more than one-third as hard as it does on Earth!

Dr. Okafor, the head scientist at Red Rock Base, waves both arms. In the distance rises Olympus Mons, the tallest volcano in the solar system.
> Carry the seeds to the greenhouse -> greenhouse

=== greenhouse
scene: lab
cast: hero, scientist:happy, alien:surprised
The greenhouse is a huge glass dome full of dirt beds and water pipes. Dr. Okafor opens the seed box and gasps with delight.

Scientist: Ten thousand seeds, and every single one is safe! There are carrots, beans, tomatoes, and my favorite, sunflowers. You've made history today.

Zib, peeking out of your pocket, watches the clock nervously. Through the glass roof, Glimmer's silver tail is growing brighter and brighter across the pink Martian sky.
> Take Zib to the top of the hill -> end-seeds

=== end-seeds
scene: planet-surface
cast: hero, quill:happy, alien:happy
You race Zib to the top of a red hill behind the base, bouncing in the low gravity. Glimmer swoops low overhead, and a shimmering bubble floats down to meet you.

Zib hugs your finger, then hops into the bubble and floats up toward its cheering family.

Alien: Goodbye, best friend! I'll wave every time Glimmer passes by!

Months later, the very first Martian sunflower blooms in the greenhouse, and the scientists name it "Zib."
end: win Seeds on Mars

=== comet
scene: space-bridge
cast: hero, captain, alien:happy
Captain Reyes steers the Dandelion toward the comet. Glimmer grows bigger and bigger in the window, a glittering mountain of ice with a tail that stretches farther than you can see.

Alien: I can see them! There's my grandma, and my cousins, and my baby brother!

Dozens of glowing jellybean aliens are waving from the ice. The Captain gently parks the ship alongside the comet, as carefully as parking a bicycle.
> Open the airlock for Zib -> comet-hug

=== comet-hug
scene: space-corridor
cast: hero, quill:happy, alien:happy
The airlock opens, and Zib's whole family tumbles in at once in a giggling, glowing pile. They hug Zib, then they hug you, then they hug Quill, and then they hug Bolt, who beeps in surprise.

Zib's grandma presses a sparkling crystal of comet ice into your hands.

Alien: It's a thank-you gift. This magic crystal always glows when a friend is thinking of you.
> Say goodbye and fly to Mars -> end-comet

=== end-comet
scene: planet-surface
cast: hero, scientist:happy, alien:happy
You wave goodbye as Glimmer sails away, and then the Dandelion zooms down to Red Rock Base just in time. Dr. Okafor cheers when she sees the box of ten thousand seeds.

That night, you sit outside the base and look up at the two tiny moons of Mars. The comet crystal in your pocket starts to glow warm and gold.

Somewhere far away, Zib is thinking of you, too.
end: win A Friend on a Comet

=== song
scene: space-bridge
cast: hero, quill:surprised, alien:surprised
You remember Zib's family song. You switch on the radio, and you and Zib sing the three notes together: low, then high, then middle.

For a moment, there is only silence. Then the speaker crackles, and a hundred tiny voices sing the song right back!

Alien: They heard us! They're coming! They're really coming!

Out the window, Glimmer changes course and curves gracefully toward Mars.
> Watch the comet come closer -> song-arrive

=== song-arrive
scene: planet-surface
cast: hero, alien:happy, scientist:surprised
The Dandelion lands at Red Rock Base, and a minute later Glimmer glides overhead, so low that its tail brushes the sky with sparkles.

Zib's family floats down in shimmering bubbles. Dr. Okafor drops her clipboard.

Scientist: In twenty years of science, I have never seen anything like this!

Zib's grandma explains that anyone who knows their family song is part of the family, and that includes you.
> Meet Zib's family -> end-secret

=== end-secret
scene: planet-surface
cast: hero, quill:happy, alien:happy
Zib's family gives the base a wonderful gift. It is a giant chunk of comet ice, enough fresh water for the greenhouse to grow seeds for a hundred years.

Then Zib's grandma gives you a tiny silver whistle that plays the family song.

Alien: Whenever you blow it, we'll come to visit. After all, you're family now!

Quill wipes away a happy tear. You listened, you remembered, and you made friends across the stars.
end: secret The Comet Song
