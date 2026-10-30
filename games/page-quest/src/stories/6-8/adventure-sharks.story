title: The Tracker Before the Storm
author: SpiderBen10's Arcade
genre: adventure
band: 6-8
cover: research-boat
blurb: A great white's tracking tag popped off early. Find it in the open ocean before a storm swallows it forever.
start: start

# ============================================================
# CHAPTER ONE: THE TAG POPS UP
# ============================================================

=== start
scene: research-boat
cast: hero, quill, biologist:scared
checkpoint
clue: Clementine's tracking tag popped off three months early. All of her detailed data is stored on the tag itself.
clue: A storm will reach the area in about eighteen hours.
~ Chapter One ~

The research vessel Wavecrest rocks gently against the dock in Port Saltby, her orange crane folded above the stern like a sleeping heron. On the deck, a marine biologist named Dr. Yara Holloway is staring at her laptop with the expression of someone who has just received terrible news.

Biologist: This can't be right. Clementine's satellite tag popped up to the surface this morning, three whole months earlier than it was programmed to.

Clementine is the reason Dr. Holloway barely sleeps. Last spring, her research team carefully attached a satellite tag to the great white shark, near the base of her dorsal fin. For nine months, the tag was supposed to record every detail of Clementine's journey, and then it was supposed to release itself and float to the surface.

Biologist: The little dart that anchored it must have worked loose, which unfortunately happens sometimes. Now the tag is drifting somewhere out there, carrying six months of information that exists nowhere else. If we don't recover it before the storm arrives tomorrow, all of that information disappears.

Quill: Hoo. It sounds like a needle in an extremely large and extremely wet haystack.
> Ask how the tag works -> tag-how
> Ask about Clementine -> clementine

=== tag-how
scene: research-boat
cast: hero, quill:thinking, biologist
Dr. Holloway lifts a spare tag out of a padded case. It is a dark cylinder about as long as your forearm, with a white float at one end and a thin, flexible antenna poking out of the float.

Biologist: This is called a pop-up archival tag. An archive is a collection of stored records, and that is precisely what this device creates. Every few seconds, it measures how deep the shark is swimming, how warm the surrounding water is, and how much light is reaching it, and it saves every measurement in its memory.

Biologist: When the tag releases, it floats and transmits a short summary to satellites passing overhead. However, satellites can only receive a tiny fraction of the information. The complete record, months and months of measurements, only comes home if somebody physically picks the tag up out of the water.

Quill: So the satellite receives the postcard, but the tag keeps the entire diary.
? RI.4 : Based on Dr. Holloway's explanation, what does "archival" mean?
+ It stores a large collection of records to be read later.
- It sends every bit of its data to satellites right away.
- It can only be used on very old sharks.
- It helps the shark find its way across the ocean.
hint: Dr. Holloway defines "archive" in her first explanation. Then think about what the tag does with its records.
next: pings

=== clementine
scene: research-boat
cast: hero, quill, biologist:happy
Dr. Holloway opens a photograph of Clementine on the laptop. The shark is slate gray on top and brilliant white underneath, with a pointed snout, a powerful tail and a calm, dark eye.

Biologist: She's about four and a half meters long, which is roughly the length of a pickup truck, and she's probably around twenty years old. Great whites can live for seventy years or more. Her dark-on-top, light-underneath coloring is called countershading. Seen from above, her gray back blends in with the deep, dark water below her. Seen from below, her white belly blends in with the bright surface above her.

Biologist: She's also an extraordinary traveler. According to the satellite summaries, after we tagged her she swam more than two thousand kilometers out into the open ocean, and we honestly don't understand why. That is exactly the kind of mystery the complete data could solve.
clue: Clementine swam more than 2,000 kilometers into the open ocean after she was tagged.
? RI.1 : Which detail best explains how countershading helps Clementine?
+ Her back blends with deep water; her belly blends with the surface.
- She is about four and a half meters long.
- Great whites can live for seventy years or more.
- She swam more than two thousand kilometers into the open ocean.
hint: Countershading is about her colors. Find the sentences that say how each color blends in.
next: pings

=== pings
scene: research-boat
cast: hero, biologist:thinking, captain
Captain Dolores Quint climbs down from the wheelhouse carrying an enormous mug of coffee. She has been operating boats out of Port Saltby for thirty years, and she reads the weather the way other people read their favorite novels.

Captain: I understand we're chasing a floating flashlight across the ocean. Show me what the satellites have given us so far.

Dr. Holloway turns the laptop around so the captain can see the screen.

TAG POSITIONS FROM THE SATELLITE
06:00  at the pop-up point
08:00  3 km east of the pop-up point
10:00  6 km east of the pop-up point

Captain: That's a steady, predictable drift. The surface current out there flows east this time of year, and the wind is pushing in the same direction, so everything that floats is traveling east together.

Captain: It's ten o'clock now. If we leave immediately, we can reach the area by two in the afternoon.
clue: The tag is drifting east about 3 km every 2 hours.
? RI.7 : If the tag keeps drifting the same way, where will it be at 14:00 (2 p.m.)?
+ About 12 km east of the pop-up point
- About 6 km east of the pop-up point
- Back at the pop-up point
- About 12 km west of the pop-up point
hint: Look at the pattern in the table. How far does the tag move every two hours, and how many two-hour steps are there from 10:00 to 14:00?
next: rafi

=== rafi
scene: research-boat
cast: hero, kid:scared, biologist
A boy about your age freezes halfway up the gangplank, clutching a duffel bag in both arms. This is Rafi, the captain's grandson, who volunteered to help on the boat before he discovered exactly what the boat was chasing.

Kid: Wait a second. We're searching for a GREAT WHITE? Those things are monsters. Everybody knows they hunt people!

Dr. Holloway doesn't laugh at him. Instead, she sits down on a cooler so that she is at his eye level, and she answers seriously.

Biologist: I completely understand why you believe that, because movies love terrifying sharks. But people are not what great whites hunt. They eat seals, fish and the bodies of dead whales. Shark bites on people are extremely rare, and most of them are probably mistakes, when a shark confuses a swimmer with its usual food.

Biologist: Here's the part that surprises most people. Every year, fishing kills tens of millions of sharks around the world, and many kinds of sharks are now endangered. If you ask me, sharks have much more reason to be afraid of us than we have to be afraid of them.

Rafi slowly lowers his duffel bag. He still looks nervous, but now he looks curious, too.
? RI.8 : Dr. Holloway claims sharks have more reason to fear people. Which evidence best supports this?
+ Fishing kills tens of millions of sharks every year.
- Movies love to show terrifying sharks.
- Great whites eat seals, fish and dead whales.
- Rafi volunteered to help on the boat.
hint: A claim needs evidence that proves it. Which fact shows how much harm people do to sharks?
next: ch1-end

=== ch1-end
scene: research-boat
cast: hero, quill:happy, kid:thinking
The Wavecrest rumbles out of the harbor and turns east toward the open ocean. Seagulls wheel behind the stern, complaining loudly that nobody remembered to bring them breakfast.

Quill settles on the railing between you and Rafi and folds her wings with a businesslike shuffle.

Quill: Let's be clear about our situation. A tag full of irreplaceable data released early, the satellite shows it drifting steadily east, and a storm will close the ocean in less than a day. Meanwhile, our newest crew member is discovering that sharks aren't monsters after all.
? RL.2 : Which choice is the best objective summary of Chapter One?
+ A tag of shark data drifts at sea; the crew races a storm to find it.
- Rafi bravely saves the crew from a dangerous great white shark.
- Dr. Holloway decides the tag is worthless and cancels the trip.
- The satellites send every detail of Clementine's trip to the laptop.
hint: An objective summary tells the main events without opinions or made-up details. Compare each choice to what really happened.
next: quiz-wavecrest

=== quiz-wavecrest
scene: research-boat
cast: hero, quill:happy
The voyage east will take several hours. Quill hops onto the folding table beside the laptop and taps a tiny card with her beak.
Quill: Hoo! Long boat rides are perfect for thinking, so let's give your brain some exercise before the search begins.
? QUIZ : Before we go on, a quick challenge!
next: ch2

# ============================================================
# CHAPTER TWO: DORADO BANK
# ============================================================

=== ch2
scene: research-boat
cast: hero, captain:thinking, biologist
checkpoint
clue: A single radio bearing gives a direction to the tag, but not a distance.
~ Chapter Two ~

By two o'clock in the afternoon, the coastline has disappeared completely behind you. In every direction there is nothing but restless blue water and a sky that is gradually turning the color of old dishwater.

Captain: The last satellite position arrived at ten o'clock this morning, which means it's four hours old now. Which way, Doctor?

Dr. Holloway hesitates, chewing thoughtfully on the end of her pencil.
> Head straight to the 10:00 position -> last-ping
> Work out where the tag has drifted by now -> drift-calc

=== last-ping
scene: research-boat
cast: hero, captain:angry, kid:sad
The Wavecrest slows to a crawl at the exact spot where the tag sent its ten o'clock signal. Everyone lines the railing, scanning the waves with binoculars.

There is absolutely nothing: no float, no antenna, not even a plastic bottle.

Captain: Naturally there's nothing here. That position was four hours old when we arrived. The ocean doesn't sit still and politely wait for us to catch up.

Rafi points out across the water, sweeping his arm in a big, hopeful circle.

Kid: Maybe it's somewhere close by. We could just drive around and around in circles until somebody spots it.
> Use the drift pattern to work it out -> drift-calc
> Search in circles around this spot -> lose-circles

=== lose-circles
scene: stormy-sea
cast: hero, captain:sad, biologist:sad
You circle the empty water, and then you circle wider, and then wider still. Gradually, the sun slides down behind the thickening clouds, and the wind begins to whistle through the rigging.

At six o'clock, Captain Quint finally shakes her head.

Captain: That's enough. I refuse to put this crew in the path of that storm for a piece of plastic, no matter how valuable the information inside it may be. We're heading home.

Somewhere far to the east, the tag continues drifting with the current, carrying Clementine's secrets away with it.
end: lose The Empty Circle

=== drift-calc
scene: research-boat
cast: hero, biologist:thinking, kid
You spread the printout across the folding table and trace the pattern with your finger: three kilometers east every two hours, without stopping. The current runs east, and the wind pushes east, so the tag keeps sliding steadily eastward like a leaf floating down a stream.

Kid: So we shouldn't go where the tag WAS. We should go where the tag IS right now.

Dr. Holloway grins at both of you and calls up to the wheelhouse.

Biologist: Captain! Twelve kilometers east of the pop-up point. That's our best prediction.
? RL.1 : Which evidence best explains why the crew searches east of the old position?
+ "The current runs east, and the wind pushes east."
- "There is nothing but restless blue water."
- "Dr. Holloway grins at both of you."
- "The sky is turning the color of old dishwater."
hint: Look for the sentence that explains what is moving the tag, and in which direction.
next: hammerheads

=== hammerheads
scene: reef
cast: hammerhead:happy, biologist:surprised
On the way, the Wavecrest passes directly over Dorado Bank, an underwater mountain whose summit rises to within thirty meters of the surface. Dr. Holloway simply can't resist the opportunity, so she lowers an underwater camera on a cable for exactly five minutes.

The screen fills with hammerheads. There are dozens of them, possibly a hundred, circling slowly above the peak like a living tornado of sharks.

Biologist: Scalloped hammerheads! They gather in enormous schools at underwater mountains like this one during the daytime. Then, at night, they separate and spread out to hunt by themselves.

Biologist: Notice the shape of their heads. The wide head positions their eyes far apart, so they can see almost all the way around their bodies. The head is also covered with tiny sensors that detect the electrical signals of animals hiding beneath the sand.
? L.5 : The hammerheads circle "like a living tornado of sharks." What does this simile suggest?
+ So many sharks are swirling together that they form a spinning column.
- The sharks are being blown around by a dangerous storm.
- The sharks are angry and are destroying the underwater mountain.
- There is only one shark, and it is moving very fast.
hint: Picture a tornado. What shape does it make, and how does it move? Now imagine it made of a hundred sharks.
next: beacon

=== beacon
scene: research-boat
cast: hero, kid:surprised, biologist
Near the twelve-kilometer mark, Dr. Holloway hands Rafi a pair of headphones attached to a handheld antenna.

Biologist: Every tag also transmits a radio signal that we can hear once we're close enough. Sweep the antenna slowly from side to side, and tell us when the beeping sounds loudest.

Rafi sweeps the antenna left, then right, with tremendous concentration. Suddenly, his eyes go wide.

Kid: BEEP! I can hear it! It's loudest when I'm pointing... that direction!

He points toward the northeast. The beeping is faint, but it is definitely there.
> Follow the beep straight on -> straight
> Move the boat and take a second bearing -> bearings

=== straight
scene: research-boat
cast: hero, captain:thinking, kid:sad
You charge toward the northeast. Ten minutes later, the beeping is still faint, and twenty minutes later it is actually fading away.

Captain: We've either overshot it, or we're traveling right alongside it. A single direction tells you which WAY something is, but it can't tell you how FAR away it is. You need a second line to cross the first one.
> Take a second bearing from here -> bearings

=== bearings
scene: research-boat
cast: hero, captain:happy, kid:happy
Captain Quint swings the Wavecrest two kilometers to the south, and Rafi sweeps the antenna again. This time, the beeping is loudest toward the north.

Dr. Holloway draws both lines on the chart, the first one pointing northeast and the second one pointing north. The two lines cross at a single location.

Captain: Wherever the lines cross, that's where your tag is waiting. Sailors have been locating things this way for hundreds of years.
clue: The two radio bearings cross at a weed line northeast of the boat.
? RI.3 : Why does the crew need bearings from two different places?
+ Two lines crossing show exactly where the tag is.
- The first bearing was taken by Rafi, so it can't be trusted.
- The tag stops beeping after the first bearing.
- The captain needs to save fuel by driving south.
hint: The captain explains it: one direction tells you which way, but not how far.
next: ch2-end

=== ch2-end
scene: research-boat
cast: hero, kid:thinking, quill
The western sky has become a solid wall of purple-black clouds. Captain Quint announces that the crew has two hours to find the tag, and not one minute longer.

While the boat turns toward the crossing point, Rafi leans on the railing beside you, watching the waves.

Kid: You know what's strange? This morning, I honestly believed sharks were monsters. Now I'm worried about a shark I've never even met, and I really want to know where Clementine went.

Quill: Hoo. That's what happens when you trade a scary story for the actual facts.
? RL.6 : How has Rafi's point of view about sharks changed since Chapter One?
+ He was afraid of sharks, but now he cares and is curious.
- He used to like sharks, but now he is afraid of them.
- He never cared about sharks, and he still doesn't.
- He thinks sharks are monsters because of the storm.
hint: Compare what Rafi said on the gangplank in Chapter One with what he says to you now.
next: quiz-weedline

=== quiz-weedline
scene: research-boat
cast: hero, quill:happy
Spray rattles against the wheelhouse windows, and Quill clings to your shoulder with her feathers fluffed up against the wind.
Quill: Before the most difficult part of any adventure, I always make sure my brain is completely awake. Quick challenge!
? QUIZ : Sharp minds win the day. Try this one!
next: ch3

# ============================================================
# CHAPTER THREE: THE WEED LINE
# ============================================================

=== ch3
scene: research-boat
cast: hero, captain:scared, biologist
checkpoint
~ Chapter Three ~

At the crossing point, a long golden ribbon stretches across the water as far as you can see. It is a weed line, a band of floating seaweed collected together by the currents. Anything that floats eventually gets tangled in it, including bottles, driftwood and, hopefully, one extremely valuable tag.

The waves are noticeably taller now, and the Wavecrest climbs each one with a weary groan.

Biologist: We could launch the small inflatable boat and search the seaweed up close. It would definitely be faster.

Captain: In waves like these? I don't like that idea one bit.
> Search the weed line from the Wavecrest -> weed
> Launch the small boat anyway -> skiff-risk

=== skiff-risk
scene: research-boat
cast: hero, captain:angry, kid:scared
Captain Quint plants herself firmly between you and the inflatable boat.

Captain: Listen to me carefully. Out here, the ocean makes the rules, not us. These waves could flip that little boat over like a pancake, and then I wouldn't be searching for a tag anymore. I'd be searching for you.

Rafi looks back and forth between his grandmother and you, waiting to see what you'll decide.
> Insist on launching the small boat -> lose-storm
> Listen to Captain Quint -> weed

=== lose-storm
scene: stormy-sea
cast: hero, captain:sad, kid:sad
The inflatable boat barely touches the water before a wave slaps it sideways and fills it with foam. Fortunately, everyone is wearing a life jacket, and the crew hauls you back aboard, soaked and shivering but completely safe.

By the time the inflatable has been pumped out and tied down, the storm has arrived. Rain hammers the deck, and the weed line disappears into gray, churning chaos.

Captain: Nobody got hurt, and that's what matters most. But this search is finished.
end: lose Turned Back by the Storm

=== weed
scene: research-boat
cast: hero, biologist:thinking, kid
Captain Quint steers slowly along the edge of the weed line while everyone studies the water. The floating seaweed is called sargassum. It is full of tiny air-filled bubbles that keep it afloat, and small fish, crabs and baby sea turtles shelter underneath it.

The minutes tick by while you inspect every floating object: a bottle, a flip-flop, a tangled knot of rope.

Then you spot it. A thin antenna pokes up out of the golden seaweed, with a small white float bobbing right beside it.

Kid: THERE! It's right there!
? L.4 : Using context clues, what is "sargassum"?
+ a kind of seaweed that floats on the ocean
- a kind of crab that hides under boats
- a radio antenna on a tracking tag
- a long rope that ties two boats together
hint: Reread the sentence that comes before the word, and the one that comes after it. What is floating, and what keeps it afloat?
next: grab

=== grab
scene: research-boat
cast: hero, biologist:happy, kid:happy
Dr. Holloway hands you a long pole with a net attached to the end. The Wavecrest rises and falls beneath your feet, so you wait patiently for the boat to dip, then reach out and scoop.

You've got it!

The tag drips seaweed all over the deck. Dr. Holloway cradles it like a newborn kitten, and Rafi performs a celebration dance that nobody will ever allow him to forget.

From the wheelhouse, Captain Quint's voice crackles over the loudspeaker, telling everyone to hold on tight because the Wavecrest is leaving immediately.

Then Rafi suddenly grabs your arm and points farther down the weed line.

Kid: Wait a second. What's that?
> Head home before the storm hits -> race-home
> Take one more look down the weed line -> second-look

=== second-look
scene: research-boat
cast: hero, captain:thinking, kid
About thirty meters away, something gray and lumpy is caught in the seaweed. It's another cylinder, crusted with barnacles, with a broken antenna sticking out of it.

Captain Quint studies the clouds, then her watch, and then the hopeful faces staring up at her.

Captain: Ten minutes. Not eleven. If we can reach it in ten minutes without launching anything, we'll take it. If we can't, we leave it behind.

She steers carefully, keeping the bow pointed into the waves, and you scoop the barnacle-covered object out of the seaweed in eight minutes.
? RL.3 : Why does Captain Quint allow only ten minutes?
+ She wants to help, but she must get the crew home before the storm.
- She doesn't care about the old tag at all.
- She is angry that Rafi spotted it before she did.
- She wants to search for the rest of the night.
hint: Think about what the captain looks at before she answers, and what she has been worried about all day.
next: secret-run

=== secret-run
scene: stormy-sea
cast: hero, captain, biologist:surprised
You reach Port Saltby just as the first powerful gust slams into the harbor. That night, while rain drums on the roof of the lab, Dr. Holloway carefully scrubs the barnacles off the mysterious old tag.

Underneath, there's a faded but readable label. The tag belonged to a hammerhead shark that Dr. Holloway's former teacher had tagged six years ago, and everyone had given it up as lost forever.

Biologist: It has been wandering around the ocean for years, and it ended up in the very same weed line as Clementine's tag. If its memory survived, this is six years of hammerhead data that nobody has ever seen.

The next morning, the little memory chip blinks back to life.
end: secret Two Tags, One Storm

=== race-home
scene: stormy-sea
cast: hero, captain, kid:scared
The storm catches the Wavecrest an hour from port. Rain blows sideways across the deck, and the boat slams through the waves while Captain Quint holds the wheel perfectly steady.

Rafi grips the railing with one hand and the precious tag with the other. Nobody talks very much, but nobody panics, either. The captain made a plan, the crew followed it, and the boat slides safely into Port Saltby shortly after dark.

Captain: Good crew. Being brave isn't the same thing as taking risks. Real bravery means knowing which risks are worth taking.
? RL.2 : Which theme is best supported by the captain's words and the crew's choices?
+ Real courage means making careful choices, not reckless ones.
- The ocean is too dangerous for anyone to explore.
- It is always best to work alone instead of on a team.
- People should never change their minds about anything.
hint: Reread what the captain says at the end. How is being brave different from taking risks?
next: quiz-morning

=== quiz-morning
scene: lab
cast: hero, quill:happy
By the next morning, the storm has exhausted itself and drifted away. While the computer slowly downloads the tag's memory, Quill perches on top of the monitor.
Quill: The download will take several minutes, and I refuse to waste them. Quick challenge!
? QUIZ : One quick challenge, then back to the story!
next: data

=== data
scene: lab
cast: hero, biologist:happy, kid:happy
The download finishes, and the screen fills with a jagged line that plunges and climbs, plunges and climbs, over and over again.

Biologist: Look at this. Out in the open ocean, Clementine repeatedly dove more than a thousand meters deep, where the water is frigid and completely dark, and then returned to the surface. Not long ago, scientists had no idea that great whites spent so much time in the middle of the ocean, diving that deep.

DEEPEST DIVE: 1,128 meters
WATER TEMPERATURE THERE: 4 degrees C
DAYS IN THE OPEN OCEAN: 104

Rafi stares at the screen with his mouth slightly open.

Kid: She went all the way down into the darkness. But why would she do that?

Biologist: That's the next question. Perhaps she was hunting squid, or perhaps it was something else entirely. That's how science works: every answer arrives with a brand-new question attached.
? RI.1 : Which evidence best supports the idea that Clementine visited cold, dark water?
+ Her deepest dive was 1,128 meters, where the water was 4 degrees C.
- She spent 104 days in the open ocean.
- Rafi stares at the screen and asks a question.
- The download finishes and the screen fills with a line.
hint: Look at the data box. Which numbers tell you how deep she went and how cold it was?
next: data-choice

=== data-choice
scene: lab
cast: hero, biologist, kid:thinking
Dr. Holloway has an important scientific report to write, and Rafi has approximately a thousand questions that he would like answered immediately.
> Help Dr. Holloway write the report -> win-report
> Teach Rafi how to read the dive graph -> win-rafi

=== win-report
scene: lab
cast: hero, biologist:happy, quill:happy
For three days, you help Dr. Holloway transform numbers into sentences. The final report includes a new map of Clementine's journey and an entire page about her mysterious deep dives.

On the last page, under the heading ACKNOWLEDGMENTS, she has thanked the Wavecrest, Captain Quint, Rafi, a certain owl, and you.

Quill: Hoo! Our names in a genuine scientific report. I may have to frame it.
end: win The Tag Came Home

=== win-rafi
scene: lab
cast: hero, kid:happy, biologist:happy
You sit beside Rafi and show him how to interpret the dive graph: lower means deeper, flat stretches mean steady swimming, and every sharp spike is Clementine plunging into the darkness.

By the afternoon, he is explaining it to visitors at the research station, waving his arms around like a scientist on television.

Kid: I used to think sharks were monsters. Now I think they're the most fascinating animals on the entire planet. I'm going to study them when I grow up.

Biologist: Then you'd better start reading immediately. The world needs more shark scientists.
end: win Rafi's New Favorite Animal
