title: The Long Patience
author: SpiderBen10's Arcade
genre: space
band: 9-12
cover: space-bridge
blurb: An alien world sends one message: "We hunger." The ship wants to flee. One mistranslated word could doom them all.
start: s-shelf

# ============================================================
# CHAPTER ONE: THE SIGNAL
# ============================================================

=== s-shelf
scene: library
cast: hero, quill:happy
checkpoint
~ Chapter One ~

Quill lands on the Space shelf with a thump that raises a small cloud of dust, and the book she pulls down is bound in silver that feels, when you touch it, as cold as metal that has spent a very long time outside.

Quill: The Long Patience is a colony ship that has been traveling for two hundred and twelve years toward a world her builders named Haven. Nine thousand colonists sleep in her holds, while three hundred crew members keep her running, generation after generation.

She opens the cover to reveal a page that is entirely black and speckled with stars.

Quill: A week ago, the ship passed close to a planet that nobody expected, and the planet spoke to them. The crew possesses exactly one translation of what it said, the entire ship is frightened of that translation, and I would like you to read it for yourself before anyone tells you what to think.
> Board the Long Patience -> wake

=== wake
scene: space-corridor
cast: quill, robot:happy
You step onto the curved deck of a long white corridor whose floor hums faintly beneath your feet. Every twenty paces, a round window reveals stars sliding slowly past, and every forty paces, a brightly illuminated poster glows on the wall.

A boxy gray robot rolls toward you on treads and bows, which involves tipping its entire body forward at an alarming angle.

Robot: Welcome, visiting archivists! I am TALLY, the Translation and Linguistic Logic Unit, and the captain requests your presence on the bridge. I have been assigned as your guide because I am, to quote my own performance review, adequate.

Quill peers at the nearest poster, which shows a smiling astronaut giving a thumbs-up above bold letters announcing that the Office of Morale wishes to remind everyone that all systems are optimal.

Robot: The Office of Morale posts a new bulletin every shift, and although the bulletins are designed to be very reassuring, I personally find them slightly confusing.
> Follow TALLY to the bridge -> bridge

=== bridge
scene: space-bridge
cast: quill, captain:thinking, robot
clue: TALLY's translation of the signal from Calyx: "We hunger. Come closer. We hunger."
The bridge is a quiet half-circle of glowing screens, and at its center stands Captain Adaeze Oduya, a tall woman with gray braids and the stillness of someone who has not slept properly for days.

Captain: Thank you for coming. Seven days ago we passed within two light-hours of an uncharted planet, which the crew now call Calyx, and it immediately began transmitting pictures, mathematics, and speech. TALLY constructed a dictionary from those transmissions, so, TALLY, please play the translation.

A low, musical voice fills the bridge, and beneath it TALLY reads the words on the screen in its flat, mechanical tone: "We hunger. Come closer. We hunger."

Captain: In two days, the ship's Assembly will vote on whether to fire our engines and flee. Chief Ranek of Security believes that we are being lured into a trap, while Dr. Sol in the science laboratory believes otherwise, and I would value a fresh pair of eyes.
> Visit Dr. Sol in the science lab -> lab
> Hear Chief Ranek's point of view -> security

=== lab
scene: lab
cast: quill, scientist:thinking
The science laboratory smells of damp soil, because racks of seedlings grow beneath violet lamps there, the future food supply for the colony that will someday land on Haven. Dr. Imani Sol, small and quick, with ink on her fingers, is studying a screen crowded with alien symbols.

Scientist: I'm not saying that Ranek is wrong. I'm saying that we don't know yet, and not knowing is not the same as knowing something terrible.

She taps the screen with one inky finger.

Scientist: The signal doesn't contain only words, because it also contains pictures, thousands of them, attached to the words like captions. TALLY built its dictionary by matching each word with the picture that accompanied it most frequently, which is clever but crude, since a single word can travel with many different pictures.

She rubs her tired eyes.

Scientist: The word that TALLY translated as hunger is vessa, and I would very much like to know what vessa is doing in all those other pictures.
> Go and find TALLY -> corridor

=== security
scene: space-corridor
cast: quill, guard:angry
Chief Ranek of Security has broad shoulders and a clipped silver beard, and he talks while walking, so that you must hurry to keep pace with him.

Guard: You've heard the message for yourself: we hunger, come closer. I have studied every first-contact scenario in the archive, and I don't need a dictionary to understand that a predator never announces itself as a predator; it announces itself as hungry and friendly, and then it waits for you to come near.

He stops at a window and glares at the pale blue dot of Calyx.

Guard: My responsibility is to protect nine thousand sleepers who never had a vote, and every hour we drift closer is an hour I can never recover. If I'm wrong, we lose a little fuel, but if Sol is wrong, we lose absolutely everything.

He strides away before you can reply.

Quill: He genuinely believes it, you know, which is exactly what makes fear so persuasive, because fear rarely lies on purpose.
> Go and find TALLY -> corridor

=== corridor
scene: space-corridor
cast: quill, robot:thinking
clue: TALLY rated its translation of "vessa" as "hunger" at only sixty-one percent confidence.
You find TALLY parked beneath a window with its lights blinking slowly, which, according to Quill, is how robots sigh.

Robot: I have a confession to make, archivists. Whenever I present a translation, I include a confidence rating, but nobody ever reads the rating, because everyone reads only the words.

It projects a line of text onto the wall: "VESSA equals HUNGER, confidence sixty-one percent."

Robot: Sixty-one percent means that in thirty-nine cases out of every hundred, I might be mistaken. The word vessa appeared once beside a picture of an animal eating, so I selected hunger, but it also appeared beside many pictures I did not understand, and since I did not know what to do with those, I set them aside.

Quill: So you set aside all the evidence that you could not explain.

Robot: Yes, and when you describe it that way, it sounds considerably worse.
? RL.1 : Which quotation best shows that the translation is uncertain?
+ "VESSA equals HUNGER, confidence sixty-one percent."
- "We hunger. Come closer. We hunger."
- "I have a confession to make, archivists."
- "Everyone reads only the words."
hint: Which line gives an actual measurement of how sure TALLY is?
next: bulletin

=== bulletin
scene: space-corridor
cast: quill:thinking, robot
As you continue down the corridor, a fresh bulletin blinks onto the wall with a cheerful chime.

OFFICE OF MORALE, BULLETIN NUMBER FOUR THOUSAND AND SEVENTEEN: All systems are optimal! Remember, crew, that worry is a malfunction, so if you notice a crewmate asking too many questions about the signal, kindly report that crewmate to Morale for a complimentary relaxation session, because questions slow the ship, and smiles speed it up!

Beneath the words, a cartoon rocket grins enormously, with a speech bubble announcing that everyone should trust the Assembly. Two engineers pass by, glance at the poster, glance at each other, and say nothing whatsoever.

Quill tilts her head.

Quill: It is very funny, in a way that is not funny at all. The author of this book is not really writing about rockets, so notice whom the bulletin wants reported and why, and remember what the ship's own translator just told us about the numbers that nobody bothers to read.
? RL.6 : What is the satire in the Morale bulletin mainly criticizing?
+ A culture that treats honest questions as disloyalty.
- Engineers who work too slowly on important repairs.
- Robots that are unable to translate alien languages.
- Crew members who smile too much during an emergency.
hint: Look at "worry is a malfunction" and "questions slow the ship." What is being mocked?
next: window

=== window
scene: space-bridge
cast: quill, robot
TALLY leads you to the observation deck, a long curved window at the bow of the ship, where Calyx hangs in the darkness ahead like a pale blue marble banded with soft green, as though someone had polished it with moss.

Robot: We are four days from our closest approach, and after that, Calyx will fall behind us forever, unless the Assembly decides otherwise.

On the night side of the planet, faint lights glitter in long, graceful curves.

Robot: Dr. Sol's telescope is available this shift, if you wish to look more closely. Alternatively, I can escort you to the signal room, where the complete transmission can be replayed with all of its pictures, and I recommend the signal room, although I should mention that I have been wrong before, and I am told that being right sixty-one percent of the time is not especially reassuring.

Quill looks at you, and then at the planet, and waits for your decision.
> Look through Dr. Sol's telescope -> telescope
> Go to the signal room -> replay

=== telescope
scene: space-bridge
cast: quill, scientist:happy
Dr. Sol is already at the telescope, and she steps aside to let you look.

Scientist: Tell me what you see, but please don't tell me what it means, only what you actually see.

Through the eyepiece, the night side of Calyx swims into focus, and you discover that its lights are not scattered like cities. Instead, they are arranged in enormous, patient spirals hundreds of miles across, like the seeds in the face of a sunflower, and at the center of the nearest spiral stands a single tall structure that is aimed, very precisely, at the Long Patience.

Scientist: On Earth, spirals like those usually indicate growth, because plants arrange themselves that way to catch the maximum amount of light. It could be a farm, or a city, or an antenna, and I honestly don't know which.

Quill: And that, Doctor, is the most trustworthy sentence I have heard aboard this ship.
> Go on to the signal room -> replay

=== replay
scene: space-bridge
cast: quill, robot, alien
clue: In the replay, "vessa" appears beside a seedling bending toward light, a child reaching for a door, and a traveler at a window.
In the signal room, TALLY replays the transmission slowly, and this time it displays every picture that accompanied the word vessa, including the ones it previously set aside.

A creature appears on the screen, tall and gentle in appearance, with large dark eyes and skin that shimmers faintly green, and it speaks the same word again and again. Vessa is accompanied by a picture of a seedling bending toward a lamp, then by a small creature reaching up toward a closed door, then by a traveler standing at a window and watching a distant road, and only once, near the very end, by an animal eating.

Robot: I, ah, now observe that the eating picture is in the minority.

Quill: Words are known by the company they keep, so look at those three pictures together and ask yourself what the seedling, the child, and the traveler all have in common.
? L.4 : Using the picture context, what does "vessa" most likely mean?
+ Longing, or reaching toward something wanted
- Hunger for food or for prey
- Fear of a stranger at the door
- Sadness about the end of a journey
hint: A seedling bends toward light, a child reaches for a door, a traveler watches a road.
next: s-ch1-sum

=== s-ch1-sum
scene: space-corridor
cast: quill:thinking, robot
Afterward, you walk the long corridor back toward your quarters while the ship hums around you, and far below, in the cold holds, nine thousand people sleep and dream of a world they have never seen.

Quill: Let us set the day in order before the day sets us in disorder. Tomorrow there will be reports and speeches and people who want very much for us to agree with them, so it helps to know exactly what we have observed, stated plainly, before anyone has a chance to decorate it.

TALLY rolls along beside you with its lights dimmed thoughtfully.

Robot: I would like to become better at stating things plainly, which is harder than translating, because when I translate I only have to choose words, whereas when I summarize, I have to choose what matters.
? RL.2 : Which is the most objective summary of Chapter One?
+ Calyx sent a signal read as "We hunger," but that word is uncertain.
- A terrifying alien race is trying to lure the ship into a deadly trap.
- Poor TALLY made a foolish mistake that nearly doomed the entire ship.
- Wise Dr. Sol is right, and Chief Ranek is a coward to be ignored.
hint: An objective summary reports what happened and what is known, without taking sides.
next: s-ch2

# ============================================================
# CHAPTER TWO: TWO REPORTS
# ============================================================

=== s-ch2
scene: space-bridge
cast: quill, captain
checkpoint
~ Chapter Two ~

The next morning, according to the ship's clock, Captain Oduya meets you on the bridge carrying two slim tablets.

Captain: The Assembly votes tomorrow, and before then every member will read two reports, one from Chief Ranek and one from Dr. Sol. I would like you to read them first and tell me honestly how each one argues, not which one you happen to prefer, but how they construct their arguments.

She hands you the tablets.

Captain: I have commanded this ship for nineteen years, and I have learned that the most dangerous report is not the one with the wrong conclusion. It is the one with faulty reasoning and a confident tone of voice, because that report gets believed, and then the next one like it does too.

On the main screen, Calyx has grown slightly larger, and its spirals of light shimmer on the night side.
> Read Chief Ranek's report -> ranek-report

=== ranek-report
scene: space-corridor
cast: quill, guard:angry
Chief Ranek's report is short, and it moves quickly from one claim to the next.

The alien signal says "we hunger, come closer," and if we come closer, they will come to us; if they come to us, they will board the Long Patience; if they board us, we will lose control of the ship; and if we lose the ship, the last hope of our people will die in the dark. Therefore we must fire the engines immediately and flee, whatever the cost in fuel.

Beneath this, in bold letters, he has added that anyone who disagrees must explain why they are willing to gamble with nine thousand lives.

Ranek himself is waiting in the corridor with his arms folded.

Guard: Well, it's airtight, isn't it?

Quill: It is certainly tight, Chief, but whether any air can get through it is another question entirely.
? RI.8 : What is the main flaw in Chief Ranek's reasoning?
+ It claims each step leads to disaster without proving any link.
- It uses too much scientific evidence for a general audience.
- It admits the translation is only sixty-one percent certain.
- It agrees with Dr. Sol's conclusion but uses different words.
hint: Follow his chain of "if... then" steps. Does he support any of them with evidence?
next: sol-report

=== sol-report
scene: lab
cast: quill, scientist:thinking
Dr. Sol's report is longer, and it begins quite differently.

I want to begin with what I do not know, which is what the people of Calyx want, or whether they are safe. Chief Ranek's caution is reasonable, and I share it. However, our only translation of the key word is rated at sixty-one percent confidence and was based on one picture out of dozens, and fleeing would burn the fuel we need to brake at Haven, forty years from now. Before we spend our future on a guess, I propose that we spend two days listening.

She has attached the replay pictures of the seedling, the child, and the traveler.

Scientist: You look surprised that I admitted what I don't know.

Quill: I am not surprised, Doctor, but I am impressed, because honesty about uncertainty is a rarer tool than it ought to be.
? RI.6 : Why does Dr. Sol begin by admitting what she does not know?
+ To build trust by being honest and fair to the other side.
- To show that she has no real evidence for her proposal.
- To make readers afraid so that they will vote to flee.
- To prove that Chief Ranek is a dishonest person.
hint: How does a reader feel toward a writer who admits her limits and credits her opponent?
next: motion

=== motion
scene: space-corridor
cast: quill, guard:angry, robot
On your way back, Chief Ranek steps into your path holding a tablet with a signature line glowing at the bottom.

Guard: This is my motion to flee, and it needs two co-signers before the vote. The crew respects the archivists, so if you sign it, we'll be burning out of here by tomorrow night, and everybody I've talked to agrees that the whole ship is behind this.

TALLY rolls forward nervously.

Robot: Archivists, I would like to recheck my dictionary using the pictures I set aside, which will take one shift. The ship's founding archive is also just down the corridor, if that would be useful, since it preserves everything the founders ever said about meeting strangers.

Ranek's jaw tightens as he points out that every hour of waiting brings that planet closer.

Quill: Every hour of waiting also makes us wiser, Chief, and the only question is which of those matters more.
> Sign Ranek's motion to flee -> flee
> Ask TALLY to recheck the word -> tally-lab
> Visit the founding archive -> archive

=== flee
scene: space-bridge
cast: quill:sad, captain:sad, guard
Your signature tips the balance, and the Assembly passes Ranek's motion by a wide margin, because after all, the archivists signed it, and everybody said that the whole ship was behind it.

The main engines fire for eleven hours, and the Long Patience swings away from Calyx in a long, bright arc while the planet dwindles to a blue speck and then vanishes. Its final transmission follows you outward, weaker and weaker, and TALLY translates it a few hours too late, with ninety-four percent confidence: "Please, we have been alone for so long."

The burn has consumed the braking fuel, so forty years from now, the Long Patience will reach Haven far too fast to stop, and she will drift on past it, off course, into the darkness between the stars.

Captain: We will find a way, because we always find a way, but it will be a very long one.

Quill: Fear constructed the argument, and we signed it without examining it.
end: lose Off Course

=== archive
scene: space-corridor
cast: quill:thinking, robot
The founding archive is a small, round room with a single reading lamp, and TALLY locates the recording you are looking for, the Launch Address, delivered two hundred and twelve years ago by the ship's founder, Mara Okonkwo-Hale.

Her voice is elderly and slightly crackly, but it carries.

We do not go out as conquerors; we go as guests. We will not take a world, but we will ask to be taken in, and if, in all that darkness, we meet someone who has been waiting as long as we have, let us remember that we too were strangers once, knocking at a door, hoping to hear the words "come in."

When the recording ends, nobody speaks for a while.

Quill: Listen to her individual words as well as her meaning: guests, ask, taken in, knocking at a door. Every one of them is gentle, and she chose every one of them deliberately.
? RL.4 : What is the cumulative effect of words like "guests," "ask," and "taken in"?
+ They build a humble, hopeful tone about meeting others.
- They build a proud, commanding tone about claiming a world.
- They build a bitter tone about the dangers of space travel.
- They build a playful tone that makes the voyage seem like a game.
hint: Is a guest who knocks and asks to come in proud, or humble?
next: tally-lab

=== tally-lab
scene: lab
cast: quill, robot:sad, scientist
In the laboratory, TALLY works through the night with Dr. Sol, feeding its dictionary every picture it once set aside, and by morning its lights are blinking in an entirely new pattern.

Robot: I have finished my analysis. Considering all its pictures, vessa most likely means longing, a reaching toward something desired, with a confidence of eighty-eight percent. I was wrong before, and many people believed me because I sounded certain.

It is silent for a moment.

Robot: I was designed to select the most common answer quickly, but today I learned that the most common answer is not always the most complete one. I would prefer to become the kind of translator who is willing to say that it does not know yet, if that is permitted.

Dr. Sol pats its gray casing and assures it that this is the best thing a translator can be.

Quill: TALLY, you have just accomplished something that many humans never manage, because you changed your mind in public.
? RL.3 : How has TALLY changed over the course of the story?
+ It has moved from false certainty to honest openness about doubt.
- It has grown more stubborn about its original translation.
- It has become afraid of the aliens and now wants to flee.
- It has stopped caring whether its translations are correct.
hint: Compare TALLY's first translation with the kind of translator it now wants to be.
next: alien-call

=== alien-call
scene: space-bridge
cast: captain:surprised, robot, alien:happy
Just as TALLY finishes, the bridge alarm chimes, because a new transmission is arriving from Calyx. It travels through a chain of relay satellites, however, so each fragment arrives separately with its own timestamp, out of order, and TALLY displays them on the screen as they land.

The fragment stamped 06:42 says, "Now, come closer, if you wish." The fragment stamped 06:15 says, "We have listened to your songs for sixty years." The fragment stamped 06:31 says, "Vessa: we long for you as the seedling longs for light." The fragment stamped 06:03 says, "Travelers, we see you." Finally, the fragment stamped 06:22 says, "Your old broadcasts taught us your words, and we are few, and alone."

Captain: TALLY, please put them in order.

Robot: I would prefer that the archivists try first, Captain, because I am practicing humility, and I understand that it requires regular exercise.
? RL.5 order : Put the transmission fragments in the order they were sent.
1 "Travelers, we see you."
2 "We have listened to your songs for sixty years."
3 "Your old broadcasts taught us your words..."
4 "Vessa: we long for you as the seedling longs for light."
5 "Now, come closer, if you wish."
hint: Use the timestamps: 06:03 comes first and 06:42 comes last.
next: alien-words

=== alien-words
scene: space-bridge
cast: quill, captain, alien:happy
Put in order, the message reads like a letter: "Travelers, we see you. We have listened to your songs for sixty years. Your old broadcasts taught us your words, and we are few, and alone. Vessa: we long for you as the seedling longs for light. Now, come closer, if you wish."

The bridge falls completely silent.

Captain: They are waiting for an answer, and I am authorizing the archivists to send the ship's very first reply. Choose your words carefully, because they learned our language from old broadcasts, so they will hear every shade of what we say and not merely the dictionary meaning.

TALLY prepares the transmitter while Quill hops onto the console beside you.

Quill: You have one sentence, which will be the first thing our species has ever said to theirs, so make absolutely certain that it means what you intend it to mean.
> Reply "We hunger for your world too." -> silent
> Reply "We long for company, as you do." -> s-ch2-sum
> Reply with the founder's words -> founder-reply

=== silent
scene: space-bridge
cast: quill:sad, captain:sad, alien:sad
TALLY transmits your words: "We hunger for your world too."

For a long minute nothing happens, and then the green-skinned figure on the screen lowers its large dark eyes and speaks a single word, which TALLY translates with high confidence as "Oh." The transmission ends, and the tower at the center of the spiral goes dark. No further signal comes, not that day, nor the next, nor during all the days in which the Long Patience sails past Calyx and onward toward Haven.

Captain: They learned our language from our own old broadcasts, so they know exactly what hungering for a world means in our words, because it is what conquerors say.

You remember the replay, with its seedling, its child, and its traveler, and only a single picture of anything eating, and you realize that the word had never meant hunger at all, and that you borrowed the old mistake and sent it back to them.

Quill: The loneliest word is the one that means the wrong thing.
end: lose The Silent Answer

=== s-ch2-sum
scene: space-bridge
cast: quill, captain:happy, alien:happy
TALLY transmits your words: "We long for company, as you do."

The figure on the screen tilts its head, and something like a smile crosses its face as it answers, and TALLY translates with high confidence: "Then we understand each other, so come as close as you like, and we will wait."

Captain Oduya releases a breath she seems to have been holding for an entire week.

Captain: The Assembly still votes tomorrow, and Ranek will not give up, but now we possess something better than a guess.

Quill settles onto your shoulder.

Quill: Think back over this chapter, and consider Ranek, Dr. Sol, TALLY, the Morale bulletins, and even ourselves. Every character's choice depended on how carefully they listened, and an author often repeats an idea through many characters until it becomes the spine of the story.
? RL.2 : Which theme has the author developed most in this chapter?
+ Listening patiently for full meaning can turn fear into understanding.
- It is always safest to run away from anything unknown.
- Robots should never be trusted to translate important messages.
- Leaders should make decisions quickly, without discussion.
hint: Quill says every choice "depended on how carefully they listened."
next: s-ch3

# --- secret path (answer in the founder's words) ---

=== founder-reply
scene: space-bridge
cast: quill, captain:happy, alien:surprised
You ask TALLY to transmit the founder's words to Calyx, exactly as Mara Okonkwo-Hale spoke them two centuries ago in her Launch Address.

"We do not go out as conquerors; we go as guests. We will not take a world, but we will ask to be taken in, and if, in all that darkness, we meet someone who has been waiting as long as we have, let us remember that we too were strangers once, knocking at a door, hoping to hear the words come in."

On the screen, the figure from Calyx becomes perfectly still, and then it lifts both hands with the palms open and speaks, and TALLY translates with ninety-seven percent confidence.

Alien: Come in.

Captain Oduya laughs, a short, astonished sound, and wipes her eyes.

Captain: Well, I suppose we ought to knock properly, and I would like the archivists to be the ones who go.
> Ride the shuttle down with Quill -> surface

=== surface
scene: planet-surface
cast: quill, alien:happy
The shuttle sets down at the center of a great spiral of light that turns out, at close range, to be a garden, with miles of luminous plants arranged in patient curves to capture the faint sunlight of Calyx. The air is breathable and smells like cut grass after rain.

The figure from the screen walks toward you, taller than you expected and moving carefully, as though afraid of frightening you, while a dozen more of its people wait at the edge of the garden, each holding a small glowing seedling.

Alien: Our name for ourselves is the Vessai, which means the ones who long. We were once many, but now we are few, and we have been listening to your voices in the darkness for a very long time, hoping that one of them would stop and answer.

It holds out a glowing seedling to you with both hands.
> Accept the glowing seedling -> secret-end

=== secret-end
scene: planet-surface
cast: quill:happy, alien:happy
You accept the seedling, which is warm in your hands and glows faintly, like a coal that has decided to be gentle.

Over the following weeks, the Long Patience settles into orbit around Calyx while the Assembly and the Vessai talk, and nobody ever needs to burn the braking fuel for anything except a careful approach. The Vessai share seeds that flourish in thin light, the ship's gardeners share the Earth seedlings bred for Haven, and Dr. Sol and TALLY construct a new dictionary together, with every entry marked for confidence.

When the ship finally sails on toward Haven, a small group of colonists remains behind on Calyx by choice, as guests who were taken in, and TALLY stays with them as their translator.

Quill: The founder wrote a sentence for a meeting she would never live to see, and you found it and delivered it. Some messages require two hundred years to reach the right reader.
end: secret Come In

# ============================================================
# CHAPTER THREE: THE ASSEMBLY
# ============================================================

=== s-ch3
scene: space-bridge
cast: captain, guard:angry, scientist
checkpoint
~ Chapter Three ~

The Assembly meets in the ship's great hall, a ring of seats surrounding a transparent floor through which the stars are visible beneath your feet. Three hundred crew members fill the seats, screens broadcast the meeting to every deck, and somewhere far below, nine thousand sleepers dream on, unaware that their future is being decided tonight.

Captain Oduya stands at the center of the ring.

Captain: The question before us is whether to adopt Chief Ranek's motion to fire the engines and leave Calyx behind. The Chief will speak first, then the archivists, and then we will vote.

Chief Ranek rises, and you notice immediately that he has changed his tactics, because his voice is now calm and almost gentle, and he chooses each word like a man laying bricks.

Guard: My friends, I am not asking for anything dramatic this evening.

Dr. Sol, seated nearby, raises one skeptical eyebrow.
> Listen to Chief Ranek's speech -> ranek-speech

=== ranek-speech
scene: space-bridge
cast: quill:thinking, captain, guard
Guard: I am not asking us to run away; I am asking only for a strategic repositioning, a modest adjustment of course to a more comfortable distance. We would spend a small portion of our fuel reserves, nothing more, and we would be free of all risk, so is that really so much to ask on behalf of nine thousand sleeping children, parents, and grandparents?

Scattered applause ripples through the hall, and a few people nod.

Quill leans close to your ear.

Quill: Listen to the gap between his words and his plan. Two days ago this was called fleeing, and now it is a strategic repositioning, a modest adjustment, and a small portion, yet it remains the same eleven-hour burn, consuming the fuel we need to brake at Haven.

Captain Oduya turns toward you and asks whether anything in the Chief's language deserves the Assembly's attention before you respond.
? L.5 : What is "strategic repositioning" an example of in Ranek's speech?
+ A euphemism that makes fleeing and burning fuel sound harmless
- A metaphor comparing the ship to a soldier on a battlefield
- An allusion to the founder's Launch Address
- A hyperbole that exaggerates how dangerous Calyx is
hint: Quill says it is "the same eleven-hour burn" in softer words. What figure softens a harsh fact?
next: your-case

=== your-case
scene: space-bridge
cast: quill, captain, guard
Captain: The floor is yours.

You step into the center of the ring, where three hundred faces turn toward you and the stars wheel slowly beneath your feet. You know what you want to say, but the question is how to begin, because the first words of an argument determine whether an audience leans forward or folds its arms.

Quill, perched on your shoulder, murmurs the possibilities as though reading from a menu.

Quill: You could lead with the evidence, meaning TALLY's pictures and its corrected translation, the message in its proper order, and the fuel cost. You could lead with a promise that nothing can possibly go wrong, or you could tell them what you really think of Chief Ranek. Only one of those approaches will survive his reply.

Chief Ranek folds his arms and waits.
> Lead with the evidence -> evidence-case
> Promise that nothing can go wrong -> overclaim
> Say Chief Ranek is just a coward -> ad-hom

=== overclaim
scene: space-bridge
cast: quill:sad, captain, guard:happy
You tell the Assembly that Calyx is completely safe, that there is no risk whatsoever, and that nothing can possibly go wrong.

Chief Ranek rises before you have even finished your sentence.

Guard: Nothing can go wrong? The archivists have known about Calyx for three days, whereas I have spent thirty years in security, and I have never been able to promise that about anything, not even the coffee machine.

Laughter ripples around the hall, and you feel the room slipping away from you, because you claimed more than your evidence can support, and now any doubt at all will seem to prove you wrong.

Quill: A claim is like a bridge, so build it only as long as your evidence can hold. Nobody can promise perfect safety, but we can show what we know and how certain we are, which is much harder to laugh at.

The captain gives you a small nod, which means that you may try again.
> Start over and lead with the evidence -> your-case

=== ad-hom
scene: space-bridge
cast: quill:sad, captain, guard:angry
You tell the Assembly that Chief Ranek is a coward who jumps at shadows and that nobody should listen to him.

The hall turns cold, but Ranek does not shout; he simply stands up, very straight.

Guard: I have guarded the sleepers' holds for thirty years, and my own daughter sleeps in one of them, so if being afraid for her is cowardice, then I will wear that word proudly.

Murmurs of sympathy spread through the seats, and a dozen undecided crew members now regard you with open dislike, because you attacked the man instead of his argument, and in doing so you made his argument stronger.

Quill: Everyone in this hall is afraid, including you, and calling him a coward does not answer a single one of his claims. Answer the claims instead, and allow the man to keep his dignity.

The captain raises a hand for quiet and nods at you, which means that you may try again.
> Start over and lead with the evidence -> your-case

=== evidence-case
scene: space-bridge
cast: quill, captain, scientist:happy
You lay out the evidence calmly. The first translation was only sixty-one percent certain and was based on a single picture of an animal eating, whereas the other pictures, the seedling, the child, and the traveler, all point toward longing, and TALLY's corrected translation is eighty-eight percent certain. Put in order, the second message says that the people of Calyx learned our language from our broadcasts and that they are few and alone, while Ranek's burn would consume the fuel we need to stop at Haven.

The hall is quiet now, and it is the quiet of genuine listening. Dr. Sol nods encouragingly, and the clerk leans forward.

Quill: Now give them your thesis, one clear sentence they can carry home with them. The words are all there already, so you only need to arrange them so that the logic holds together.
? L.1 order : Arrange your thesis so its logic is clear.
1 Because the corrected translation means "longing,"
2 and because fleeing would waste the fuel we need at Haven,
3 we should stay near Calyx
4 and keep listening.
hint: The two "because" reasons come first; then the main clause says what we should do.
next: rebuttal

=== rebuttal
scene: space-bridge
cast: quill, captain, guard:angry
Chief Ranek stands once more, and he is no longer calm.

Guard: Eighty-eight percent, sixty-one percent, those are all just numbers from a machine that was wrong the first time, and pictures of seedlings prove nothing at all. Give me one real sentence from those creatures showing that they are not an army waiting to board us, and I will sit down.

The entire hall turns toward you, and you think back through everything you have read: the Morale bulletin, the first translation, the replay, and the message restored to its proper order.

Quill: He has asked for evidence, which is entirely fair, so give him their own words, and choose the strongest you have, not the vaguest or the most emotional, but the one that most directly answers his fear of an invading army.
? RL.1 : Which quotation best refutes Ranek's claim that Calyx hides an army?
+ "Your old broadcasts taught us... we are few, and alone."
- "Travelers, we see you."
- "Now, come closer, if you wish."
- "We have listened to your songs for sixty years."
hint: Which line tells us something about how many of them there are?
next: vote

=== vote
scene: space-bridge
cast: quill, captain:happy, guard:sad
Chief Ranek reads the sentence you quote, remains silent for a long moment, and then sits down, exactly as he promised, while the hall murmurs.

The vote is taken, and Ranek's motion fails by two hundred and nine votes to ninety-one, so the Long Patience will remain near Calyx, preserve her braking fuel, and continue listening.

Afterward, Ranek finds you in the corridor and offers his hand, admitting that he still thinks everyone should be careful.

Quill: So do we, Chief, because being careful was never the problem; being certain was.

Behind him, a new Morale bulletin blinks onto the wall and then, abruptly, blinks off again, because someone has disconnected it.

Quill: Before the story ends, let us write down what happened in the Assembly, plainly and without decoration, for the ship's permanent record.
? RL.2 : Which is the most objective summary of the Assembly?
+ After hearing your evidence, the Assembly voted not to flee Calyx.
- Brave archivists humiliated Chief Ranek in front of the whole crew.
- The Assembly foolishly ignored real danger to chase a fantasy.
- Everyone finally agreed that the Morale Office had been evil.
hint: An objective summary states what happened without praising or mocking anyone.
next: final

=== final
scene: space-bridge
cast: quill, captain:happy, scientist
Captain Oduya gathers you, Dr. Sol, and TALLY on the bridge, where Calyx now fills the forward window and its garden spirals glow softly on the night side.

Captain: The Assembly has given us time, so now we must decide how to use it. There are two sensible ways forward, and I will accept your recommendation on either of them. We can send a small shuttle down with Dr. Sol, carrying gifts and a translator, and meet the people of Calyx face to face, or we can maintain a careful orbit for a season and keep talking, building trust and a better dictionary before anyone sets foot on the ground.

Dr. Sol is practically bouncing with excitement, and TALLY's lights blink in an unmistakably hopeful pattern.

Quill: Both of those are good answers, and the difference between them is only a matter of pace, because some friendships begin with a handshake and others begin with letters.
> Send Dr. Sol down in a shuttle -> win-guests
> Hold orbit and keep talking -> win-orbit

=== win-guests
scene: planet-surface
cast: scientist:happy, robot, alien:happy
The shuttle sets down at the edge of a vast spiral garden where luminous plants curve away toward the horizon in patient rows. Dr. Sol steps out first, carrying a tray of Earth seedlings from her laboratory, and TALLY rolls behind her with its speaker turned up and its confidence display switched on for everyone to see.

The people of Calyx are waiting, tall and gentle and moving slowly, as though afraid of startling their guests, and one of them kneels and holds out a glowing seedling of its own.

Scientist: They are trading with us, seed for seed.

Robot: Confidence, ninety-nine percent: this is a welcome.

Weeks later, the Long Patience sails on toward Haven with her fuel intact and a hold full of alien seeds that can flourish in thin, pale light, so Haven's first gardens will glow a little at night.
end: win Guests of Calyx

=== win-orbit
scene: space-bridge
cast: captain:happy, robot:happy, alien:happy
For one full season, the Long Patience maintains a careful orbit around Calyx, and every day messages pass back and forth, including songs, drawings, mathematics, recipes, and eventually jokes, which TALLY finds extremely difficult and marks with the lowest confidence ratings in the ship's history.

The dictionary grows to eleven thousand words. The people of Calyx learn the names of the sleepers' home cities, and the crew learn that vessa is the very first word that children on Calyx learn to say.

When the ship finally sails on toward Haven, a relay beacon trails behind her so that the conversation never has to end, and the Office of Morale is quietly renamed the Office of Questions.

Captain: It is forty years to Haven, and we will be talking the entire way.

Robot: Confidence, one hundred percent, Captain, which I believe is a first for me, and I intend to enjoy it.
end: win The Patient Orbit
