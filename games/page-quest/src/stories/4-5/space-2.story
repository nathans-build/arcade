title: The Mirror and the Two-Faced Moon
author: SpiderBen10's Arcade
genre: space
band: 4-5
cover: space-bridge
blurb: Fly a giant telescope mirror past Jupiter and Saturn to a moon with two faces. Don't let it crack!
start: start

# ============================================================
# CHAPTER 1: The Mirror
# ============================================================

=== start
scene: space-bridge
cast: hero, quill, captain
checkpoint
~ Chapter One ~

You and Quill are guest crew members on the cargo ship Skylark, which is about to blast off from Moon Base on a long trip to Saturn.

Captain Lola Bright sits in the big chair. Her nephew Mateo, who is only ten, is the junior pilot. He checks his seatbelt once, then twice, and then a third time.

Captain: Our job is to carry a giant mirror to the telescope on Iapetus, one of Saturn's moons, and it must get there before the Big Glow in six days.
> Go see the mirror in the cargo bay -> bay
> Watch Mateo fly the launch -> launch

=== launch
scene: space-bridge
cast: hero, quill, kid:scared
Mateo grips the controls with both hands, and his fingers shake a little.

Kid: Engines on. Engines on. Yes, the engines are definitely on.

He checks every switch three times before he finally pushes the big green button. The Skylark rumbles and rises, and the gray Moon shrinks below you until it looks like a dusty marble.

Kid: What if I push the wrong button someday and mess up the whole trip?

Quill: Hoo. Every new pilot feels that way at first, Mateo.
> Go see the mirror in the cargo bay -> bay

=== bay
scene: space-corridor
cast: hero, quill, robot:happy
The cargo bay is cold and quiet. In the middle stands a crate as tall as a house, wrapped in soft blue padding, with the word FRAGILE painted on every side.

A round robot with one big eye and two tiny arms rolls over to greet you.

Robot: Beep! I am Dot, and I guard the mirror. The mirror is enormous, because it is wider than a school bus is long. It took ten years to build, so please do not bump it.
? L.4 : Dot says the mirror is "enormous." Which clue helps you know what that word means?
+ It is wider than a school bus is long.
- It took ten years to build.
- The cargo bay is cold and quiet.
- Dot has one big eye and two tiny arms.
hint: Look at what Dot says right after the word "enormous." What does she compare the mirror to?
next: why-mirror

=== why-mirror
scene: space-corridor
cast: hero, quill:thinking, robot
Quill: Why does a telescope need such a giant mirror?

Dot shows a page from her science files on her big round eye.

"A telescope uses a mirror to catch light from the stars. A bigger mirror catches more light, and more light makes faint, faraway things look brighter and clearer. That is why the biggest telescopes in the world have the biggest mirrors."

Robot: Beep. With this new mirror, Dr. Sato will see stars that nobody has ever seen before.
? RI.8 : What reason does Dot's science file give for using a bigger mirror?
+ It catches more light, so faint things look brighter.
- It is easier to carry in a spaceship.
- It makes the telescope look shiny and new.
- It keeps the telescope warm in space.
hint: Find the sentence that begins "A bigger mirror..." and read it all the way to the end.
next: beep

=== beep
scene: space-corridor
cast: hero, quill:surprised, robot:scared
Suddenly, a red light starts flashing on the side of the crate, and a loud alarm fills the cargo bay.

Robot: Warning! The mirror is getting too warm! If it gets too hot, it could bend out of shape, and then it will never work again.

Quill flaps up to the ceiling to look around. Something in this room is heating up the crate, and you need to find it fast.
> Search the cargo bay yourself -> search
> Call Mateo to check the ship's screens -> screens

=== search
scene: space-corridor
cast: hero, quill, robot
You walk all the way around the giant crate. The air feels cool everywhere except in one spot near the wall.

A bright stripe of sunlight is shining through a round window and landing right on the crate, like the beam of a hot flashlight. Somebody forgot to close the window's shade!

You pull the shade down, and the sunbeam disappears. After a minute, the red light on the crate turns green.

Robot: Beep! The temperature is normal again. You are a star, crewmate!
> Go tell Mateo the good news -> mateo-worry

=== screens
scene: space-bridge
cast: hero, kid:thinking, quill
You hurry to the bridge, where Mateo taps the ship's screens and reads each number once, twice, and three times.

Kid: The cargo bay has a window on the sunny side of the ship, and the screen says its shade is open. The sunlight must be shining right on the crate!

He presses a button, and far away in the bay, the shade slides shut. Soon the warning light turns from red to green.

Quill: Well done, Mateo! Your careful checking found the problem.
> Talk with Mateo -> mateo-worry

=== mateo-worry
scene: space-bridge
cast: hero, kid:sad, quill
Later, Mateo sits down on the bridge and lets out a long, slow breath.

Kid: I check everything three times because I'm scared of making a mistake. Aunt Lola is the best pilot in the whole solar system, and I'm afraid I'll never be good enough to be like her.

Quill puts a soft wing on his shoulder.

Quill: Being careful is a good thing, Mateo, but being scared all the time is a very heavy thing to carry.
? RL.3 : Why does Mateo check everything three times?
+ He is afraid of making a mistake.
- He likes to count things for fun.
- His aunt made it a rule for him.
- He forgets what he sees right away.
hint: Mateo tells you the reason himself. Look at what he says he is scared of.
next: jupiter

=== jupiter
scene: space-bridge
cast: hero, captain, kid:scared
Three days later, Jupiter fills the whole window. It is the biggest planet in the solar system, and it is striped with orange, white, and brown clouds.

Captain: We'll use a trick called a gravity assist. Jupiter's gravity will pull on us and swing us around it, like a ball on a string. Then we'll shoot off toward Saturn faster than before, and we'll save fuel, too.

Mateo gulps, because he is the one who will steer the swing.
> Look at Jupiter's giant red spot -> red-spot
> Help Mateo get ready to steer -> slingshot

=== red-spot
scene: space-bridge
cast: hero, quill:surprised, robot
Down on Jupiter, a huge red swirl spins slowly, like a pinwheel made of clouds.

Robot: Beep. That is the Great Red Spot. It is a giant storm that is wider than the whole planet Earth, and people have watched it spinning for more than one hundred fifty years.

Quill: A storm bigger than Earth? I am very glad that we are only flying past it!

Then a chime rings across the bridge, because it is finally time for the swing.
> Hurry to help Mateo steer -> slingshot

=== slingshot
scene: space-bridge
cast: hero, captain, kid:scared
The Skylark dives toward Jupiter. The whole ship shakes, and Mateo's knuckles turn white on the controls.

You stand beside him and read the numbers out loud, nice and slow, and Mateo nods after each one.

Captain: Now, Mateo!

He pulls back on the stick. The ship whips around the giant planet and zooms away, faster than ever before.

Captain: That was a perfect swing! Our next stop is Saturn.

Mateo grins for the very first time.
> Head to your bunk for the night -> ch1-end

=== ch1-end
scene: space-corridor
cast: hero, quill:happy, robot
That night, the ship hums softly while Dot rolls past the crate one more time to check on the mirror.

Quill: What a first chapter! We launched from the Moon with a giant mirror, and we kept it from getting too hot. Then Mateo steered us around Jupiter to speed us up.

You think about Mateo's grin and wonder if he is braver than he thinks. Then you fall asleep watching the stars slide by.
? RL.2 : Which sentence best sums up Chapter One?
+ The crew kept the mirror safe and used Jupiter to speed up.
- The crew landed on Jupiter to explore the Great Red Spot.
- Mateo broke the mirror, so the crew turned around.
- Dot flew the ship by herself all the way to Saturn.
hint: Listen to Quill's summary of the chapter. What happened to the mirror, and what happened at Jupiter?
next: ch2

# ============================================================
# CHAPTER 2: The Ice Fountains
# ============================================================

=== ch2
scene: space-bridge
cast: hero, captain, robot:happy
checkpoint
~ Chapter Two ~

Two days later, Saturn glows in the window like a golden ball wearing a wide, flat hat brim, and that hat brim is its famous rings.

Captain: Before we go to Iapetus, we have one quick stop. We must drop off a water pump at Geyser Station, which is on Enceladus, a small icy moon near the rings.

Robot: Beep! May I share my files about the rings first? I love the rings very much.
> Listen to Dot's ring facts -> ring-facts
> Fly straight to Enceladus -> route

=== ring-facts
scene: space-bridge
cast: hero, quill:surprised, robot:happy
Robot: Saturn's rings are not solid. They are made of billions of chunks of ice and rock, and some are as tiny as grains of sand while others are as big as a house. They all circle around Saturn together, like a giant parade.

Robot: Also, Saturn is made mostly of gas, and it is so light for its size that it could float in water, if you had a bathtub big enough!

Quill: I would love to see that bathtub. Imagine the size of the rubber duck!
> Fly on toward Enceladus -> route

=== route
scene: space-bridge
cast: hero, captain, kid
Enceladus looks like a bright white snowball. As you fly closer, you can see tall, sparkly fountains spraying out of its bottom side.

Captain: Those are geysers. Mateo, you'll fly us in. You can go close to the geysers for a better look, or you can take the long way around them.

Mateo chews his lip for a moment, and then he turns around to ask for your advice.

Kid: What do you think we should do?
> Fly close to see the geysers -> geysers
> Take the long way around -> long-way

=== geysers
scene: space-bridge
cast: hero, kid:surprised, quill:happy
Mateo steers closer. Huge fountains of ice shoot up from long cracks in the ground, higher than any mountain on Earth, and they sparkle in the sunlight like the fizz from a shaken soda bottle.

Quill: Oh, my feathers! It looks like a birthday party for a moon!

Tiny bits of ice start to tick and tap against the ship's windows. Mateo frowns and holds the controls a little tighter.
? L.5 : The geysers "sparkle in the sunlight like the fizz from a shaken soda bottle." What does this simile help you picture?
+ Bubbly, shiny spray bursting up fast
- A sweet drink that tastes like ice
- A quiet, still pool of water
- A bottle that is floating in space
hint: A simile compares two things using "like." Think about what happens when you shake a soda bottle and open it.
next: ice-facts

=== long-way
scene: space-bridge
cast: hero, kid, quill
Mateo steers the Skylark in a wide, slow circle around the moon. Far below, tall fountains of ice spray up from long cracks in the ground.

Even way out here, tiny bits of ice start to tick and tap against the windows.

Kid: Where is all this ice coming from? We are nowhere near the geysers!

Quill: Let's ask Dot, because she has a file for absolutely everything, even for ice.
> Ask Dot about the ice -> ice-facts

=== ice-facts
scene: space-bridge
cast: hero, quill:thinking, robot
Dot reads from her science file.

"Enceladus has a hidden ocean of salty water under its icy shell. Water sprays out through long cracks near its south pole, and in the cold of space, the spray freezes into tiny bits of ice. Because the ice keeps spraying out, it spreads into a wide, faint ring around Saturn, which is called the E ring."

Robot: Beep. That means we are flying through a ring that a moon made!
? RI.3 : According to Dot's file, why is there a ring of ice near Enceladus?
+ Water sprays out of the moon, freezes, and spreads into a ring.
- The ice fell off Saturn's main rings by accident.
- The Skylark's engines made the ice when they got cold.
- Snow fell from the sky of Enceladus and floated away.
hint: Look for the word "because" in the file, and read the steps that come before it.
next: ice-hit

=== ice-hit
scene: space-bridge
cast: hero, captain:scared, kid:scared
Crunch! A thick coat of frost suddenly covers the ship's front camera, so all the screens go white and Dot's map blinks off.

Captain: The camera is iced over! Mateo, you'll have to fly by looking out the window, and you must keep us clear of the geysers.

Mateo freezes, and his hand hovers over the controls without moving at all.

Kid: I can't do it! What if I crash the whole ship and break the mirror?
> Tell Mateo you believe in him -> believe
> Help Dot melt the ice off the camera -> melt

=== believe
scene: space-bridge
cast: hero, kid:thinking, quill
You put your hand on Mateo's shoulder and give it a squeeze. Then you point out the window at the bright stars ahead, which don't move even when the ship does.

Mateo takes a deep breath and looks carefully at the stars. This time, he checks the controls only once before he starts to steer.

Kid: Okay. I'll steer toward the bright star and keep the geysers on the left.

Slowly and smoothly, the Skylark glides out of the icy spray.
> Land at Geyser Station -> station

=== melt
scene: space-corridor
cast: hero, robot, kid:scared
You and Dot race to the front of the ship, where Dot opens a small hatch and blows warm air at the frosted camera. You hold the hatch steady while she works.

Over the speaker, you hear Mateo's shaky voice.

Kid: I'm steering by the stars now. Keep the geysers on the left. Keep the geysers on the left.

With a drip and a pop, the camera clears, and the screens show the ship sliding safely out of the spray. Mateo did it!
> Land at Geyser Station -> station

=== station
scene: planet-surface
cast: hero, captain:happy, kid:happy
The Skylark sets down on the ice at Geyser Station with a soft bump, and the station crew cheers as you hand over their new water pump.

Captain: Mateo, you flew through an ice storm without a camera. You steered by the stars, just like a real space pilot, and I am so proud of you.

Mateo's cheeks turn pink. That night, everyone writes about the day in the ship's log, and even Dot writes in it.
> Read the ship's log -> logs

=== logs
scene: space-bridge
cast: hero, kid:happy, robot
You open the ship's log and carefully read the two newest pages, which were written by two very different crew members.

Mateo wrote: "Today was the scariest day of my life, because ice was everywhere and my hands were shaking! But I looked at the stars, and I did it. I feel ten feet tall!"

Dot wrote: "Number of ice bits that hit the ship, four thousand and twelve. Minutes the camera was iced over, six. Damage to the ship, zero. Pilot, Mateo. End of report."
? RL.6 : Why do Mateo's log and Dot's log sound so different?
+ Mateo shares his feelings, but Dot only lists facts and numbers.
- Mateo was not on the ship, so he did not see what happened.
- Dot was scared, but Mateo was not scared at all.
- They are writing about two different days.
hint: Look at the words each one uses. Who talks about being scared and proud? Who uses numbers?
next: ch2-end

=== ch2-end
scene: space-bridge
cast: hero, quill:happy, captain
The Skylark lifts off from Enceladus and heads out, far past the rings, toward Iapetus.

Quill: Let's sum up. We visited Enceladus, a moon that sprays out ice. The ice froze over our camera, but Mateo steered us out by looking at the stars, and then we delivered the water pump.

Captain Bright smiles at her nephew, and he smiles back. You notice that he hasn't checked his seatbelt three times all day.
? RL.2 : Which sentence best sums up Chapter Two?
+ Ice blocked the camera, but Mateo flew the ship out safely.
- The Skylark crashed into a geyser and had to be rescued.
- Dot broke the water pump, so the crew went home.
- Mateo stayed in bed while the Captain flew through the ice.
hint: Quill sums it up. What was the big problem, and who solved it?
next: ch3

# ============================================================
# CHAPTER 3: The Two-Faced Moon
# ============================================================

=== ch3
scene: space-bridge
cast: hero, captain, quill
checkpoint
~ Chapter Three ~

At last, Iapetus appears in the window. You say its name like this: eye-AP-uh-tus. Half of the moon is as dark as coal, and the other half is as bright as snow.

Captain: Landing a mirror the size of a bus on a faraway moon? That is a titanic job.

Quill: How fitting! Many of Saturn's moons are named after the Titans, who were giants in old Greek stories, and Iapetus was one of those giants.
? RL.4 : What does the Captain mean when she calls the landing "a titanic job"?
+ It is a very big, hard job.
- It is a tiny, easy job.
- It is a job for Greek people only.
- It is a job that is very old.
hint: Quill says the Titans were giants. What would a giant-sized job be like?
next: two-faced

=== two-faced
scene: space-bridge
cast: hero, quill:thinking, robot
Dot shares one last file.

"Iapetus is called the two-faced moon, because one side is dark and the other side is bright. A long ridge of mountains wraps around its middle, like the seam on a walnut shell. Its path around Saturn is tilted, so it has a great view of the rings. Its gravity is very weak, so you could jump many times higher than you can on Earth!"

Robot: Beep. The telescope is on top of the ridge.
clue: Iapetus has very weak gravity. You could jump many times higher than on Earth.
> Get ready to land -> land

=== land
scene: space-bridge
cast: hero, kid:happy, captain
Captain Bright stands up from the big chair.

Captain: Mateo, would you like to land us?

Mateo does not check his seatbelt three times. He checks it just once, and then he takes the controls with steady hands.

Kid: I've got this. Gentle and slow, like setting down a sleeping cat.

The Skylark drifts down past the dark side of Iapetus and settles softly at the bottom of the ridge without even a bump.
? RL.1 : Which sentence from the story best shows that Mateo has become more confident?
+ "I've got this. Gentle and slow, like setting down a sleeping cat."
- "Captain Bright stands up from the big chair."
- "Mateo, would you like to land us?"
- "The Skylark drifts down past the dark side of Iapetus."
hint: Look for the words Mateo says before he lands. Do they sound worried or sure?
next: radio

=== radio
scene: planet-surface
cast: hero, kid, quill
Outside, the ground is dark and dusty, and the ridge rises up ahead like a giant stone wall. Way up on top, a white dome shines.

Mateo grabs the radio to call the telescope team, and he wants his message to be a correct sentence.

Quill: Remember, a sentence starts with a capital letter and ends with a period. When you speak to someone by name, put a comma after the name.
? L.2 order : Put the word tiles in order to build Mateo's radio message.
1 Dr. Sato,
2 the mirror
3 has landed
4 on Iapetus.
hint: Start with the name and its comma, because it has the capital letter. End with the tile that has the period.
next: sato

=== sato
scene: planet-surface
cast: hero, scientist:scared, kid
A rover rumbles down the ridge road, and Dr. Hana Sato hops out with her helmet light blinking.

Scientist: You made it! But we have a problem, because the Big Glow starts in one hour. The road up the ridge is long and twisty, and the rover is very slow with a heavy load. Someone must get to the top first to open the telescope dome.

Mateo looks up at the ridge, which is very, very tall.
> Ask the Captain what she thinks -> theme

=== theme
scene: planet-surface
cast: hero, captain:happy, kid
Captain Bright kneels down beside Mateo.

Captain: Do you know what I learned when I was a young pilot? Brave people still feel scared, but they don't let the scared feeling steer the ship. You were scared at Jupiter and in the ice, and you flew anyway.

Mateo thinks about this for a long moment, and then he stands up a little taller.

Kid: So being brave means doing it even when you're scared.
? RL.2 : What is the theme, or big lesson, of this story?
+ Being brave means doing hard things even when you feel scared.
- Only grown-ups can be brave pilots.
- It is best to never feel scared at all.
- Robots are better pilots than people.
hint: Reread what the Captain says about brave people, and how Mateo says it in his own words.
next: decide

=== decide
scene: planet-surface
cast: hero, scientist, quill:thinking
Dr. Sato's crane lifts the mirror crate onto the back of the rover.

Scientist: The mirror goes up on the rover no matter what. But how will you get to the top in time to open the dome?

Quill looks at the stone steps carved up the side of the ridge, which go up and up, all the way to the dome. Then she looks back at the ship, and you think about everything you have learned on this trip.
> Ride up slowly with the rover -> rover
> Ask Mateo to fly the Skylark up -> hop
> Climb the stone steps on foot -> bounce

# ---- Ending 1: the rover ----

=== rover
scene: planet-surface
cast: hero, robot, scientist
You climb into the rover next to Dr. Sato, while Dot rides on top of the mirror crate and holds on with both tiny arms.

The rover crawls up the twisty road, around and around and around. Far below you, the dark half of the moon meets the bright half in a long, wavy line.

Robot: Beep. Time left, four minutes. Road left, almost none!

The rover rolls through the dome doors just in time.
> Open the dome -> rover-end

=== rover-end
scene: planet-surface
cast: hero, scientist:happy, kid:happy
Dr. Sato flips the big switch, and the dome opens like a giant eye. The crane lifts the mirror into the telescope with a soft click.

Then Saturn slides in front of the Sun, and all at once its rings light up in a glowing circle, like a halo of silver fire. Everyone gasps, and the new telescope sees it all, sharp and clear.

Scientist: Thank you, crew. Tonight we will see stars that nobody has ever seen.
end: win The Big Glow

# ---- Ending 2: Mateo flies ----

=== hop
scene: space-bridge
cast: hero, kid:happy, captain
Mateo is already buckled in, and he checks his seatbelt only once.

Kid: The landing pad at the top is tiny, but I've done harder things this week.

The Skylark lifts off and climbs along the side of the ridge. Mateo steers by the stars, just like he did at Enceladus, and he sets the ship down on the tiny pad with barely a bump.

Captain: That was the best landing I have ever seen, and it was even better than mine.
> Hurry into the dome -> hop-end

=== hop-end
scene: planet-surface
cast: hero, scientist:happy, kid:happy
You and Mateo race into the dome and open its great doors. Soon the rover rolls in with the mirror, and the crane lifts it into place.

Then Saturn slides in front of the Sun, and its rings blaze into a circle of silver light.

Dr. Sato pins a small golden badge on Mateo's suit, shaped just like Saturn's rings.

Scientist: Every great telescope needs a great pilot to get it here. Thank you, Pilot Mateo.
end: win Pilot Mateo

# ---- Secret ending: remember the weak gravity ----

=== bounce
scene: planet-surface
cast: hero, quill:happy, kid:surprised
The steps look much too tall to climb in time, until you remember Dot's file, which said that the gravity on Iapetus is very weak!

You bend your knees and jump as hard as you can. Whoosh! You float up, up, past three whole steps, and you land as softly as a feather. Mateo laughs and jumps right after you.

Quill: Hoo-hoo! On this moon, I don't even need to flap my wings!
> Keep bouncing to the top -> bounce-top

=== bounce-top
scene: planet-surface
cast: hero, kid:happy, scientist:surprised
Bounce by bounce, you reach the top of the ridge in five minutes, and you open the dome long before the rover arrives.

From up here, you can see both faces of Iapetus at once, the dark side and the bright side. Above them, Saturn floats with its rings tilted like a tipped hat.

At last, Dr. Sato's rover rolls in.

Scientist: You jumped up the steps? Nobody has ever thought of that!
> Watch the Big Glow from the ridge -> secret-end

=== secret-end
scene: planet-surface
cast: hero, quill:happy, kid:happy
The mirror clicks into place. Saturn slides across the Sun, and its rings flash into a halo of silver light, brighter than anything you have ever seen.

Dr. Sato names the stone steps the Leaping Stairs, and she paints your name and Mateo's name on the very top step.

Quill: You read carefully, you remembered a fact, and you used it in a brand-new way. That is what real scientists do!
end: secret The Leaping Stairs
