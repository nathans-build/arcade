title: The Silence at Corvina Seamount
author: SpiderBen10's Arcade
genre: adventure
band: 9-12
cover: deep-sea
blurb: The deep-sea sharks of Corvina Seamount have gone silent. Dive into the dark and find out why before the vote.
start: start

# ============================================================
# CHAPTER ONE: THE MISSING SIGNALS
# ============================================================

=== start
scene: research-boat
cast: hero, quill, biologist:thinking
checkpoint
clue: For six years, twelve receivers on Corvina Seamount recorded tagged sharks. Three months ago, the detections dropped by about ninety percent.
clue: The regional fisheries council votes in ten days on whether to protect the seamount.
~ Chapter One ~

The research vessel Meridian rides a long, slow swell two hundred kilometers offshore, directly above a mountain that no tourist will ever see. Corvina Seamount rises from the abyssal plain nearly three thousand meters below, and its summit stops just sixty meters short of the surface. Its upper slopes glow in blue twilight; its deep flanks lie in permanent darkness.

Dr. Mireille Okoro, the expedition's chief scientist, has spent six years listening to that mountain. On its slopes, her team moored twelve acoustic receivers, patient underwater microphones that record a coded ping whenever a tagged shark swims within range.

Biologist: For six years, the receivers recorded thousands of visits every month from the sharks we tagged here, a remarkably consistent pattern season after season. Then, three months ago, the visits dropped by roughly ninety percent, almost overnight. The mountain went silent, and not one of my colleagues can offer an explanation that survives careful scrutiny.

Biologist: In ten days, the regional fisheries council votes on whether to make Corvina a protected area. Everyone already has an explanation they prefer. What we don't have is evidence.

Quill: Hoo. Then evidence, carefully gathered and honestly interpreted, is precisely what we'll go and find.
> Review the receiver data -> data1
> Ask about the sharks that live here -> species

=== species
scene: research-boat
cast: hero, quill:thinking, biologist
Dr. Okoro opens a folder of photographs, most of them taken by cameras lowered into the dark on long cables.

Biologist: Two kinds of sharks dominate our records. The first is the bluntnose sixgill, a heavy, slow-moving shark that can grow nearly five meters long. Most sharks have five pairs of gill slits; the sixgill has six, a trait that marks it as part of a very ancient family whose fossils appear in rocks laid down when dinosaurs were alive. Sixgills spend their days in the cold depths and rise toward shallower water after dark to feed.

Biologist: The second is the scalloped hammerhead. By day, they gather in schools around the summit, sometimes hundreds at once, and at night they disperse to hunt. Seamounts like Corvina work almost like highway rest stops for animals crossing an otherwise empty ocean.

Biologist: Both species grow slowly and have few young. That's precisely why losing them would matter: a population that recovers this slowly can't afford to disappear quietly.
? RI.2 : Which statement best expresses the central idea of Dr. Okoro's explanation?
+ The seamount's sharks are unusual, slow to recover and worth saving.
- Sixgill sharks are the largest predators in the entire ocean.
- Hammerheads prefer to travel alone across the open ocean.
- Seamounts are dangerous places that sharks should avoid.
hint: A central idea is supported by the whole explanation, not one detail. What point does her final paragraph make about all of these facts?
next: data1

=== data1
scene: research-boat
cast: hero, biologist:thinking, kid
A lanky seventeen-year-old in an oversized hoodie slides a laptop across the table. Matteo Lindqvist is the expedition's student intern, and he has been staring at this spreadsheet for a week.

RECEIVER DETECTIONS ON CORVINA SEAMOUNT (monthly)
Sharks, average of previous five years: about 4,100
Sharks, last three months: 410, 380, 395
Sync tags, average of previous five years: about 8,600
Sync tags, last three months: 8,640, 8,590, 8,610

Kid: The sync tags are transmitters we bolted next to the receivers on purpose. They ping on a fixed schedule, so they let us check whether each receiver is still listening properly.
clue: The sync-tag detections stayed normal, so the receivers are still working.
? RI.7 : Which conclusion is best supported by the data in the table?
+ The receivers work normally, but far fewer sharks are visiting.
- The receivers broke three months ago and stopped recording.
- Shark visits have stayed about the same as in earlier years.
- The sync tags have been visiting the seamount less often.
hint: Compare the two kinds of detections. If the sync tags still ping normally, what does that tell you about the receivers, and about the sharks?
next: hypotheses

=== hypotheses
scene: research-boat
cast: hero, kid:angry, biologist
On the whiteboard in the dry lab, Dr. Okoro writes three possible explanations.

A. EQUIPMENT FAILURE
B. LOW-OXYGEN WATER RISING UP THE SLOPES
C. ILLEGAL DEEP-SET LONGLINE FISHING

Matteo draws an angry line through option A and then circles option C so hard that the marker squeaks.

Kid: It's obviously C. Everybody in the harbor knows that unregistered boats have been sneaking out here at night. We should announce it publicly and let people be as outraged as they deserve to be.

Biologist: Everybody knowing something is not the same as anybody proving it. The sync tags eliminate option A. However, option B occurs naturally in several regions of the ocean, and if we accuse people of a crime that we cannot demonstrate, we will forfeit the credibility we need with the very council we're trying to persuade.
? RI.8 : Why does Dr. Okoro refuse to accept Matteo's claim yet?
+ His claim relies on rumor, and the evidence can't rule out option B.
- She has already proven that option B caused the silence.
- She believes the sync tags show that option C is impossible.
- She thinks the fisheries council will ignore any evidence anyway.
hint: Look at her response. What does she say about "everybody knowing," and which option has not been ruled out?
next: ch1-end

=== ch1-end
scene: research-boat
cast: hero, captain:thinking, quill
Captain Haakon Wendt, a weathered Norwegian who has skippered oceanographic research vessels for longer than Matteo has been alive, listens to the debate from the doorway with his arms folded and an expression of amused tolerance.

Captain: In my experience, the ocean rarely hands you a single, simple answer. It hands you a hundred small facts, and it waits to see whether you have the patience to put them in the right order.

He turns toward the bridge.

Captain: We'll hold position over the summit tonight. In the morning, we can lower our instruments into the water column and discover what the ocean itself is willing to testify.
? RL.4 : Which word best describes the tone of Captain Wendt's comment about the ocean?
+ patient and wry
- furious and accusing
- cheerful and careless
- frightened and desperate
hint: Notice the image of the ocean "waiting to see" whether you are patient. Is the captain upset, or calmly experienced and a little amused?
next: quiz-meridian

=== quiz-meridian
scene: research-boat
cast: hero, quill:happy
Night settles over the Meridian, and the deck lights paint the waves in pale gold. Quill glides down and settles on your shoulder, folding her wings with the air of a professor before an examination.
Quill: You've reasoned carefully today. Before the instruments go down at dawn, let's make sure the rest of your mind is equally sharp.
? QUIZ : Before we go on, a quick challenge!
next: ch2

# ============================================================
# CHAPTER TWO: INTO THE DARK
# ============================================================

=== ch2
scene: research-boat
cast: hero, biologist:surprised, kid
checkpoint
~ Chapter Two ~

At dawn, the crew lowers a cluster of sensors on a steel cable down the slope of the seamount. The instrument measures temperature, salinity and, most importantly, the amount of dissolved oxygen in the water at every depth.

When the readings return, Dr. Okoro studies them twice before speaking.

Biologist: Oxygen levels at every depth where our sharks normally live are completely ordinary, well above the threshold that would drive them away. If a mass of low-oxygen water had risen up the slopes, we would see it here, and we don't.

Matteo opens his mouth, then closes it again, and slowly erases option B from the whiteboard.
? RI.3 : Why is the normal oxygen reading important to the investigation?
+ It makes option B unlikely, leaving fishing as the likeliest cause.
- It proves that the receivers have been broken for three months.
- It shows that the sharks left because the water became too cold.
- It means the crew has already found the people responsible.
hint: Think about which hypothesis depended on low oxygen. What happens to that hypothesis when the oxygen turns out to be normal?
next: dive-choice

=== dive-choice
scene: research-boat
cast: hero, biologist:thinking, scientist
The Meridian carries two ways to look at the deep seafloor. The first is a remotely operated vehicle, a robotic camera sled tethered to the ship by a long cable. The second is a three-person submersible piloted by Dr. Emeka Sorensen, an engineer whose calm voice has guided more than four hundred deep dives.

Scientist: The ROV is safer and can stay down longer, but its tether only reaches so far. The submersible lets us go wherever we need to, as long as we respect its limits.
> Send the ROV down first -> rov
> Dive in the submersible -> sub

=== rov
scene: deep-sea
cast: hero, kid:thinking, biologist
In the darkened control room, everyone crowds around the ROV's video feed. The camera glides slowly over gray volcanic rock and pale, delicate sponges, and then it pauses on something that obviously does not belong.

Long, parallel gouges scar the slope of the seamount, as if something heavy had been dragged repeatedly across the fragile seafloor. Beside them, a taut line of fishing filament disappears into the darkness below, far beyond where the ROV's tether can follow.

Biologist: Those are drag marks, characteristic of a weighted fishing line hauled across the bottom. Whatever created them descended from the surface, and it terminated somewhere considerably deeper than this tether can reach.
> Prepare the submersible -> sub

=== sub
scene: deep-sea
cast: hero, scientist:happy, biologist
The submersible's hatch seals with a soft, decisive thud, and the ocean swallows you whole. Through the thick acrylic viewport, the blue light fades gradually to indigo, and then to a blackness so complete that it seems to press physically against the glass.

Then the darkness comes alive. Flickers of blue and green bloom and vanish around you, emitted by jellyfish, shrimp and fish that manufacture their own light. In the deep sea, bioluminescence is not a novelty; it is a language. Animals use it to hunt, to hide and to find one another in a world without sunlight.

Dr. Sorensen switches on the floodlights, and a slow snowfall appears in the beams: drifting flakes of organic debris, the marine snow that feeds much of the deep.
? L.4 : The word "bioluminescence" combines "bio" (life) and "lumen" (light). What does it mean?
+ light that is produced by living things
- the study of the deep ocean floor
- the reflection of sunlight off the water
- a machine that measures how dark the sea is
hint: Put the two roots together. The text also says these animals "manufacture their own light."
next: summit

=== summit
scene: deep-sea
cast: hero, hammerhead:sad, biologist:sad
On the way down, as the submersible passes the summit, only a handful of hammerheads drift through the blue twilight where hundreds once circled in great slow wheels. Four hundred meters farther down the flank, in total darkness, Dr. Okoro grips your arm and points. Draped across a boulder is a long, heavy mainline of fishing filament, with shorter branch lines dangling from it at regular intervals. Its surface is clean, without the crust of sponges, barnacles and silt that coats everything else on the mountain.

Below it, half-buried in the sediment, lies a small cylinder no longer than your finger: an acoustic tag of the kind her team placed in sixgill sharks. A tag that should be traveling inside a living shark is lying alone on the seafloor.

Dr. Sorensen glances at the current meter, which has begun to climb.
> Collect the tag and a sample of the line -> evidence
> Follow the line down the cliff -> cliff

=== cliff
scene: deep-sea
cast: hero, scientist:scared, biologist:thinking
Beyond the boulder, the mainline drops over a sheer cliff into deeper water. Dr. Sorensen's voice remains calm, but his hands have gone very still on the controls.

Scientist: The current is intensifying, and our safety margin is narrowing with every minute. If we follow that line down the cliff, we risk becoming entangled in it, and an entangled submersible is an emergency. I recommend that we collect what we can from this location and postpone the cliff for another expedition.
> Insist on following the line deeper -> lose-dive
> Respect the pilot's limits -> evidence

=== lose-dive
scene: deep-sea
cast: hero, scientist:scared, biologist:scared
You press him to continue. Over the cliff edge, the current strengthens abruptly, and a loose branch line snags one of the submersible's thrusters.

Dr. Sorensen works through the emergency procedure methodically, and after a tense twenty minutes the line tears free and the submersible begins a controlled ascent. Everyone returns safely to the surface, but the dive is aborted, the damaged thruster grounds the submersible for the rest of the expedition, and the evidence on the flank remains where you left it.

Biologist: We're all alive and well, which is the only outcome that truly matters. But we're going to stand in front of the council with nothing but suspicions.
end: lose The Dive That Ended Early

=== evidence
scene: deep-sea
cast: hero, scientist:happy, biologist
Dr. Sorensen extends the submersible's manipulator arm, a mechanical claw delicate enough to lift a single egg. He retrieves the acoustic tag first and seals it in a sample box, then cuts a meter-long section of the mainline with two of its branch lines still attached.

Biologist: Look at that filament. Everything else down here wears a coat of growth, but this line is almost spotless. It hasn't been on the seamount for long, which means it was lost within the last few months.

The tag's serial number is still legible: SG-114, a sixgill that Dr. Okoro's team tagged four years earlier.
clue: The lost longline has almost no growth on it, so it was lost within the last few months.
clue: The tag SG-114 belonged to a sixgill tagged four years ago.
? RI.1 : Which evidence best suggests the line was lost on the seamount recently?
+ It has almost no growth, unlike everything else on the mountain.
- It has branch lines attached at regular intervals.
- It was draped across a boulder on the flank.
- The submersible's arm was able to cut a piece of it.
hint: Reread what Dr. Okoro says about the filament compared with "everything else down here."
next: ch2-review

=== ch2-review
scene: research-boat
cast: hero, kid:angry, biologist:thinking
Back on deck, the samples lie on a stainless steel table beneath the bright work lights, and Matteo can barely contain his excitement.

Kid: That's it, that's definitive proof. Illegal longliners have been systematically fishing this mountain, and they've practically wiped out our sharks.

Dr. Okoro sets down her coffee very deliberately.

Biologist: What we have proves that a deep-set longline was used on Corvina recently, and that at least one of our tagged sharks did not survive. That's significant. But nothing on this table tells us which vessel set that line, or whether it was set legally somewhere else and drifted here. If we overstate our evidence, we hand every critic an excuse to dismiss all of it.
? RI.8 : According to Dr. Okoro, what does the evidence on the table NOT yet prove?
+ which vessel set the line, or whether the line drifted in
- that a longline was used on the seamount recently
- that at least one tagged shark did not survive
- that the receivers are recording properly
hint: Separate the two parts of her answer: what the evidence proves, and what "nothing on this table tells us."
next: ch2-end

=== ch2-end
scene: research-boat
cast: hero, kid:thinking, quill
Matteo pulls out his phone. He has already composed a post accusing the fishing fleet from the nearest harbor, attached the dramatic submersible photographs, and tagged three regional news organizations.

Kid: Ten days isn't very long. If we publish this now, thousands of people will see it before midnight, and the council will feel the pressure. Isn't that how you actually accomplish anything?

Quill looks thoughtfully at the glowing phone, and then, expectantly, at you.
> Post the photos and name the fleet -> lose-claim
> Find out which vessel it really was -> quiz-ais

=== lose-claim
scene: village
cast: hero, kid:sad, quill:sad
The post spreads faster than anyone expected. By the following week, it has been shared a hundred thousand times, and the harbor's fishing families, most of whom have never set a deep longline in their lives, are furious at being accused of a crime they did not commit.

At the council meeting, the chair can barely keep order. Fishers who might have supported protection now refuse to listen to anyone from the Meridian, and the vote is postponed indefinitely. Whoever actually set the line is never identified.

Quill: Hoo. Being right about what happened isn't enough. You also have to be right about who did it, and you have to prove it.
end: lose A Claim Without Proof

=== quiz-ais
scene: research-boat
cast: hero, quill:happy
Matteo deletes the draft, sighs dramatically, and goes to find Officer Kealoha's phone number. Quill raises one wing, unhurried and deliberate.
Quill: The investigation will keep for a moment. Curiosity doesn't stop at the edge of a single subject, so let's test a different kind of thinking.
? QUIZ : Sharp minds win the day. Try this one!
next: ch3

# ============================================================
# CHAPTER THREE: THE VOTE
# ============================================================

=== ch3
scene: lab
cast: hero, guard:thinking, biologist
checkpoint
~ Chapter Three ~

Officer Kealoha of the regional fisheries enforcement office arrives by helicopter with a laptop and an expression of professional skepticism. Large fishing vessels are required to carry transponders that broadcast their identity and position, and she has downloaded every signal recorded near Corvina in the past four months.

VESSEL SIGNALS NEAR CORVINA SEAMOUNT
Ardent Star: signal lost 22:10, regained 04:05 (three separate nights)
All other vessels: no gaps longer than 15 minutes

Guard: When a transponder goes quiet for six hours, three nights in a row, directly above a seamount where fishing is restricted, I start asking questions. Turning off a transponder isn't proof of illegal fishing. But it is a pattern.
clue: The vessel Ardent Star's signal disappeared for about six hours, three nights in a row, above Corvina Seamount.
? RI.7 : What does the signal data suggest about the Ardent Star?
+ It repeatedly hid its position at night above the seamount.
- It never came anywhere near Corvina Seamount.
- Its transponder briefly failed once, like every other vessel's.
- It reported its position more often than the other vessels.
hint: Compare the Ardent Star's signal gaps with those of all the other vessels. How long, how often, and where?
next: ch3-choice

=== ch3-choice
scene: lab
cast: hero, guard, kid:thinking
A pattern is a start, but Officer Kealoha needs more before she can act, and the council meets in four days.
> Compare the line to the vessel's gear records -> gear
> Ask Officer Kealoha what she can prove -> kealoha

=== gear
scene: lab
cast: hero, guard:surprised, biologist:happy
Officer Kealoha pulls the Ardent Star's last inspection report from her files. Two months before the signal gaps began, the vessel's crew declared that they carried no deep-set longline gear. However, a harbor supply log from the same week records that the Ardent Star purchased forty kilometers of heavy mainline and several hundred branch-line clips.

Dr. Okoro lays the sample from the flank next to the supplier's catalog. The clips match exactly, down to the stamped mark on each one.

Guard: So the inspection report says one thing, and the supply log says another. When two records contradict each other, somebody has some explaining to do.
? RI.9 : How do the inspection report and the supply log differ?
+ One denies the ship had longline gear; the other shows it bought some.
- Both records show that the ship never left the harbor.
- The supply log was written by Dr. Okoro's research team.
- Both records agree that the ship used only legal fishing gear.
hint: Compare what each document says about the Ardent Star's longline gear in the same period.
next: timeline

=== kealoha
scene: lab
cast: hero, guard, kid
Officer Kealoha closes her laptop and regards Matteo with an expression that is not quite a smile.

Guard: People imagine that my job is about catching villains. Mostly, it's about constructing a case solid enough that a fair-minded person, who begins entirely neutral, ends up genuinely convinced. Suspicion opens an investigation; evidence concludes it.

Guard: Your samples demonstrate what was done, and the signal gaps suggest when it happened. What I need now is documentation that connects that specific vessel to that specific equipment.

Matteo nods slowly, considering this, and for once he doesn't argue.
? RL.3 : How does Officer Kealoha's explanation affect Matteo?
+ It shows him why careful evidence matters, and he stops arguing.
- It convinces him to post his accusations on social media.
- It makes him angry, so he leaves the investigation.
- It proves to him that the Ardent Star did nothing wrong.
hint: Look at Matteo's reaction at the end of the page. What does "for once he doesn't argue" suggest?
next: gear

=== timeline
scene: lab
cast: hero, biologist:thinking, quill
That evening, you help Dr. Okoro build the timeline she will present to the council, because a sequence of events can persuade where a pile of facts cannot.
? RL.5 order : Put the events in the order they happened.
1 The Ardent Star bought deep longline gear.
2 The ship's signal went dark above the seamount three nights in a row.
3 Shark detections on Corvina dropped by about ninety percent.
4 The submersible found a recently lost longline and tag SG-114.
hint: The purchase came two months before the signal gaps; the receivers noticed the silence afterward; the dive came during this expedition.
next: council

=== council
scene: village
cast: hero, biologist:happy, mayor:thinking
The council chamber in the harbor town is crowded with fishers, scientists and reporters. Dr. Okoro speaks for twenty minutes without raising her voice once.

She begins not with accusations but with the mountain itself: its ancient sixgills and schooling hammerheads, the six years of patient listening, the sudden silence. Then she lays out the evidence in order, explaining for each piece exactly what it proves and what it does not. Finally, she thanks the harbor's fishing families, whose own logbooks helped confirm that the deep longline did not come from them.

The chair, a weathered former fisher herself, asks several sharp questions, and Dr. Okoro answers each one directly.
? RI.6 : Why does Dr. Okoro begin with the mountain and thank the local fishers?
+ To build trust and show the problem is not about blaming the town.
- To avoid ever mentioning the evidence she collected.
- To prove that local fishers set the illegal longline.
- To make the meeting last as long as possible.
hint: Think about the audience in the room. How might local fishers react to a speech that opened with blame, and to one that thanked them?
next: quiz-council

=== quiz-council
scene: village
cast: hero, quill:happy
The council withdraws to deliberate privately. In the hallway outside the chamber, Quill perches on an antique coat rack and regards you with her steady amber eyes.
Quill: Deliberations take time, and anxious waiting accomplishes nothing. Meanwhile, let's put that patient, analytical mind of yours to work on something entirely different.
? QUIZ : One quick challenge, then back to the story!
next: vote

=== vote
scene: village
cast: hero, biologist:happy, kid:happy
The council returns after an hour. By a vote of seven to two, Corvina Seamount becomes a marine protected area, closed to all bottom-contact and deep-set fishing. Separately, Officer Kealoha announces that the Ardent Star's owners will face an investigation.

Matteo lets out a whoop that echoes off the chamber walls, then turns bright red and apologizes to the chair.

Six months later, Dr. Okoro calls you with news: the receivers on Corvina are beginning to hear sharks again.
> Celebrate on the Meridian's deck -> win-sanctuary
> Join one last dive to the seamount -> last-dive

=== win-sanctuary
scene: research-boat
cast: hero, captain:happy, biologist:happy
The Meridian's crew gathers on the stern at sunset, exhausted but quietly triumphant. Captain Wendt raises a mug of cocoa toward the empty horizon, where, far below the waves, a mountain is finally allowed to recover.

Captain: To patience, and to the hundred small facts, assembled in the correct order.

Dr. Okoro clinks her mug against yours. Somewhere beneath the hull, a sixgill is rising through the dark toward its nightly feeding grounds, and for the first time in months, a receiver hears it pass.
end: win Sanctuary at Corvina

=== last-dive
scene: deep-sea
cast: hero, hammerhead:happy, scientist
The submersible sinks past the summit of Corvina for the final dive of the season. The hammerheads are returning, still fewer than before but wheeling once more through the blue twilight. Far below, on the dark flank, the abandoned longline is gone, removed by a recovery crew.

Dr. Sorensen glances at you with a slight, knowing smile.

Scientist: We have twenty minutes of margin remaining. I usually spend them taking photographs for the scientific record. Some divers, however, prefer to switch off every light and simply observe the darkness.
> Turn off the lights and wait -> secret
> Take photographs and head back up -> win-return

=== win-return
scene: research-boat
cast: hero, biologist:happy, kid:happy
On the surface, Matteo downloads the latest receiver files while you hand over your photographs for cataloguing. The detections are climbing steadily, month by month, toward the numbers recorded six years ago.

Kid: Population recovery for slow-growing species takes years, right? So this is really only the beginning.

Biologist: Exactly. We protected the mountain; now our responsibility is to keep listening, keep measuring, and allow the sharks to take as much time as they need.
end: win The Signals Return

=== secret
scene: deep-sea
cast: hero, scientist:surprised, quill
The floodlights click off, and the darkness becomes absolute. For one long, suspended minute, there is nothing visible at all.

Then, below the viewport, dozens of faint lights appear, each one a soft glow traced along the belly of a small shark no longer than your forearm. They are lanternsharks, tiny deep-sea sharks whose bellies are lined with light-producing organs, and many of them are young.

Scientist: Their belly lights match the faint glow from above, so predators looking up can't see their silhouettes. Dr. Okoro has suspected a lanternshark nursery here for years, but nobody has ever seen one. You're looking at a constellation that swims.
? L.5 : The pilot calls the lanternsharks "a constellation that swims." What does the metaphor emphasize?
+ Their scattered lights look like a pattern of stars moving in the dark
- The sharks have traveled to the seamount from outer space.
- The sharks are so bright that they light up the whole ocean.
- The sharks are arranged in perfectly straight rows.
hint: A constellation is a group of stars that seem to form a pattern. What do the tiny glowing sharks look like against the dark water?
next: secret-end

=== secret-end
scene: deep-sea
cast: hero, scientist:happy, quill:happy
You watch in silence until the margin runs out. When the floodlights return, the little lights have already slipped away into the dark.

That evening, Dr. Okoro adds a new line to the management plan for Corvina Seamount: a protected nursery zone for lanternsharks, the first ever documented on the mountain.

Quill: Hoo. Sometimes the most important discoveries are made by the people patient enough to sit in the dark and wait.
end: secret The Lantern Nursery
