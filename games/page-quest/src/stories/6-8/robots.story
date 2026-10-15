title: The Rescue Relay
author: SpiderBen10's Arcade
genre: robots
band: 6-8
cover: robot-arena
blurb: Your robotics club's spider-legged bot keeps falling in the water. Copy the champions, or trust your own data?
start: start

# ============================================================
# CHAPTER ONE: SPLASHDOWN
# ============================================================

=== start
scene: robot-workshop
cast: hero, kid:sad, fixbot:sad
checkpoint
~ Chapter One ~

Room 214 at Bramblecote Middle School smells like melted solder, cold pizza and soggy cardboard. Quill has deposited you here as the newest member of the Loose Screws, the school's enthusiastic but unsuccessful robotics club, exactly four days before the Regional Rescue Relay.

In the middle of the classroom sits a homemade practice course constructed from plywood and plastic storage tubs: a ramp of foam "rubble," a channel of genuine water twelve inches wide, and a "rescue zone" painted fluorescent orange. Three yellow rubber ducks, representing the "stranded residents" of a flooded town, wait patiently on the far side of the water.

A small yellow robot is lying upside down in the channel, its four spindly legs waving helplessly in the air, while its orange eyes blink miserably behind a dark visor.

Fixbot: Glub. Skitter has fallen in again. Skitter would like to be rescued now, please.

Yumi Haddad, the team captain, rescues the robot with a swimming-pool net and sighs so dramatically that her safety goggles fog up completely.

Kid: That's the ninth splashdown this week, and it's only Tuesday. Welcome to the Loose Screws. We are, as you can probably see, extremely loose.
> Help Yumi dry off Skitter -> dry
> Ask about the Rescue Relay -> rules

=== rules
scene: robot-workshop
cast: hero, kid:thinking, fixbot
Yumi taps a laminated rulebook that is pinned to the corkboard beside a calendar covered with frantic red circles.

Kid: Every robot gets three minutes. It has to climb the rubble ramp, cross the flood channel, grab the ducks, and bring them back to the rescue zone. You get twenty points for the ramp, twenty for crossing the water, and thirty for every duck you deliver. If your robot falls in the water, it's out for the rest of the run.

Fixbot: Skitter is excellent at the falling-in part.

Kid: Skitter is excellent at the ramp, which is precisely why we built it with legs instead of wheels. Legs grip the uneven rubble, while wheels just spin and slide. The water is the real problem.
clue: Scoring: ramp 20, water crossing 20, each duck delivered 30. Falling in the water ends the run.
> Help Yumi dry off Skitter -> dry

=== dry
scene: robot-workshop
cast: hero, kid, fixbot:happy
You wrap Skitter in a beach towel and carefully pat its dome dry while Yumi inspects its circuits with a tiny flashlight, searching for any sign of water damage. Skitter wiggles all four legs in obvious delight.

Fixbot: Skitter is dry! Skitter is grateful! Skitter is ready to fall in again!

Suddenly the door bangs open, and a tall boy carrying a laptop strides into the room. Yumi introduces him as Dez Achterberg, the team's chief builder, who has apparently never entered a room quietly in his entire life.

Dez spins his laptop around to show you a competition video. A massive, tank-like robot rumbles across a flood channel on enormous rubber treads, scoops up three ducks with a mechanical shovel, and rolls triumphantly back to the rescue zone while the audience applauds.

"That's Bulwark, from Westmere Academy, the state champions three years running," Dez announces. "Wheels win. Legs lose. We tear Skitter apart tonight and build a copy of Bulwark."
> Ask Yumi what she thinks -> argue

=== argue
scene: robot-workshop
cast: hero, kid:angry, fixbot:scared
Yumi folds her arms, and her expression becomes extremely stubborn.

Kid: We can't copy Bulwark. We don't have their budget, their motors, or their machine shop, and we definitely don't have the time. Besides, we don't even understand WHY Skitter keeps falling. Maybe the legs aren't the problem at all.

"Of course it's the legs," Dez says. "Look at the video. Treads don't wobble."

The two teammates glare at each other across the practice course, neither willing to back down. Skitter slowly retreats and attempts to hide behind a recycling bin, which is not quite large enough to conceal it.

Fixbot: Skitter does not enjoy arguments. Skitter would prefer to be a toaster.
? RL.3 : What is the main reason Yumi doesn't want to copy Bulwark?
+ The team lacks Bulwark's resources and doesn't know why Skitter fails.
- She thinks Bulwark is an ugly robot with an embarrassing name.
- She wants Dez to quit the Loose Screws.
- She has already decided to switch to a different team.
hint: Reread Yumi's first speech. What does she say the team doesn't have, and what doesn't it know?
next: coach

=== coach
scene: robot-workshop
cast: hero, scientist:happy, retrobot:happy
The argument is interrupted by a tremendous CLANK, CLANK, CLANK. Mr. Villanueva, the science teacher who coaches the club, wheels in a squeaky cart carrying something extremely old and remarkably shiny.

It is a tall, boxy tin robot with a red chest, two coiled antennas, an enormous dial on its belly, and clamps instead of hands. When Mr. Villanueva flips a switch on its back, its eyes illuminate, and it raises one claw in a creaky, dignified salute.

Retrobot: GREETINGS, YOUNG ENGINEERS. I AM CLATTERBOX. I WAS BUILT IN NINETEEN EIGHTY-NINE FROM A VACUUM CLEANER AND TWO TOASTERS. I HAVE SEEN MANY ROBOTS FALL INTO MANY THINGS.

Scientist: Clatterbox was my eighth-grade science fair project. He lost, by the way. He got stuck in the gym doorway in front of four hundred people.

Retrobot: IT WAS A VERY NARROW DOORWAY. I LEARNED A GREAT DEAL.
> Ask Mr. Villanueva what he'd do -> data
> Ask Clatterbox what he learned -> clatter

=== clatter
scene: robot-workshop
cast: hero, retrobot:thinking, fixbot
Clatterbox swivels his boxy head toward you with a long, rusty squeak that sounds like a door in a haunted house.

Retrobot: THE DOORWAY TAUGHT ME TO MEASURE BEFORE I MARCH. EVERY BOLT THAT FALLS OUT OF YOU TELLS YOU WHERE TO PUT A STRONGER ONE. FAILURE IS SIMPLY INFORMATION WEARING A SAD COSTUME.

Skitter creeps out from behind the recycling bin and gazes up at Clatterbox with enormous admiration.

Fixbot: Skitter has fallen in the water nine times. Skitter is therefore extremely well informed.

Retrobot: PRECISELY, SMALL FRIEND.
clue: Clatterbox: "Every bolt that falls out of you tells you where to put a stronger one."
> Ask Mr. Villanueva what he'd do -> data

=== data
scene: robot-workshop
cast: hero, scientist:thinking, kid
Mr. Villanueva projects Skitter's test log onto the classroom screen. Every practice run has been automatically recorded by the robot's own sensors, including its speed, its position and its battery level.

TEST LOG, SKITTER, RUNS 1 TO 9
Runs 1, 2 and 3: speed SLOW. Ramp: yes. Water: crossed. Ducks: 3. Time: 3 min 40 sec, too slow.
Runs 4 to 9: speed FAST. Ramp: yes. Water: fell in, every time.

Scientist: In engineering, we iterate. We build, test, analyze what happened, and improve the design, again and again, until it works. So before anyone disassembles anything, what is this information telling us?
? RI.7 : What pattern does the test log show?
+ Skitter crosses the water at slow speed but falls in at high speed.
- Skitter falls in the water on every run, no matter what speed it uses.
- Skitter can never climb the rubble ramp.
- Skitter is fastest when it carries all three ducks.
hint: Compare runs 1 to 3 with runs 4 to 9. What changed, and what happened at the water each time?
next: iterate

=== iterate
scene: robot-workshop
cast: hero, kid:surprised, scientist:happy
Yumi stares at the screen, and her mouth slowly falls open as she understands what the numbers mean.

Kid: It's not the legs. Skitter CAN cross the water. It just can't do it fast. And when it goes slowly, it runs out of time.

Scientist: So the question isn't "legs or wheels." The real question is "how do we keep the legs stable at high speed?" That's a much more useful question, and better questions usually lead to better robots.

Dez is studying the log over Yumi's shoulder. He frowns skeptically, but for once he doesn't say anything at all.
? L.4 : Mr. Villanueva says engineers "iterate." Based on the context, what does "iterate" mean?
+ Repeat a process of building, testing and improving
- Give up on a design and buy a new one
- Copy another team's robot exactly
- Write a report about a robot's history
hint: Look at the sentence right after the word. He explains what engineers do "again and again."
next: choice1

=== choice1
scene: robot-workshop
cast: hero, kid:thinking, fixbot:thinking
That evening, after Mr. Villanueva leaves for a faculty meeting, the team still has to make a decision. Dez has an elaborate sketch of a tread system, and Yumi has a printout of the test log decorated with yellow highlighter.

"We have four days," Dez says. "Treads are proven. They work for Bulwark."

Kid: The data says the legs work perfectly well, if we can solve the stability problem. You're the newest member, so you get the deciding vote.

Skitter looks up at you hopefully, blinking its orange eyes and nervously tapping one leg on the workbench.
> Rebuild Skitter with treads like Bulwark -> treads
> Keep the legs and fix the fast-walking problem -> ch1-end

=== treads
scene: robot-workshop
cast: hero, fixbot:sad, kid:sad
You vote for treads. Dez cheers triumphantly and begins unscrewing Skitter's legs before you have even finished your sentence.

The team works late that night and for the next three afternoons. Unfortunately, the treads are heavy, the small motors strain and overheat, and on the practice course the reconstructed Skitter crawls up the rubble ramp so slowly that the timer beeps before it reaches the top. Nobody has enough time to test the water crossing even once.

Fixbot: Skitter feels... different. Skitter's legs are in a box. Skitter misses its legs.
> Go to the competition anyway -> lose-treads

=== lose-treads
scene: robot-arena
cast: hero, fixbot:sad, kid:sad
At the regional competition, the heavy, treaded Skitter finally reaches the flood channel with eleven seconds remaining. It rolls forward courageously, tips over the edge, and sinks into twelve inches of water with a melancholy gurgle.

Fixbot: Glub. Skitter has fallen in. Again. But with treads, this time.

On the drive home, nobody says much. Yumi stares out the window at the drizzling rain, and eventually Dez says, very quietly, "The log was right. I should have actually looked at it."

You copied the champions instead of studying your own data, and the robot you had was better than the one you built.
end: lose Stuck in the Shallows

=== ch1-end
scene: robot-workshop
cast: hero, kid:happy, fixbot:happy
You vote to keep the legs. Yumi grins with relief, and Skitter performs an enthusiastic tap dance on the workbench.

Dez throws up his hands. "Fine. But if it falls in at regionals, I'm saying I told you so."

Kid: Deal. Tomorrow we have a field trip to the Roboworks factory across town. Mr. Villanueva's sister is the chief engineer there, and she says they have walking robots that never fall over. Maybe they can demonstrate how.
? RL.2 : Which is the best objective summary of Chapter One?
+ The team's test log reveals that Skitter's problem is speed, not legs.
- Dez builds a perfect copy of Bulwark, and the team wins the title.
- Clatterbox gets stuck in a gym doorway in front of a huge crowd.
- Yumi quits the team after an argument about wheels.
hint: An objective summary covers the main problem and the key discovery, without opinions or side details.
next: ch2

# ============================================================
# CHAPTER TWO: THE FACTORY THAT NEVER FALLS
# ============================================================

=== ch2
scene: factory-floor
cast: hero, scientist:happy, kid:surprised
checkpoint
~ Chapter Two ~

The Roboworks factory is gigantic. Conveyor belts transport cardboard boxes past towering yellow robotic arms that dip and rise like enormous birds drinking from a pond. Orange warning lights rotate on the walls, and a huge illuminated sign above the belts announces ROBOWORKS in glowing yellow letters.

Mr. Villanueva's older sister, a mechanical engineer named Dr. Imelda Villanueva, greets you at the entrance with hard hats and safety glasses for everyone.

Dr. Villanueva guides the team to a corner of the factory where small, six-legged inspection robots scurry along the tops of the machinery, checking for loose bolts and overheating parts. They travel remarkably quickly, stepping over gaps and cables without hesitating, and not a single one of them wobbles.
> Read the sign about the inspection robots -> placard
> Watch the robots up close -> watch

=== watch
scene: factory-floor
cast: hero, kid:thinking, fixbot:surprised
Skitter, who has come along in Yumi's backpack, pokes its dome out of the opening and observes the inspection robots with its visor pressed against the zipper.

Fixbot: They are so fast. They are so stable. Skitter is jealous in a respectful way.

You observe the walkers carefully. Each robot lifts some of its legs while the others remain firmly planted on the ground, and they never lift all the legs on one side at the same moment.
> Read the sign about the inspection robots -> placard

=== placard
scene: factory-floor
cast: hero, scientist:thinking, kid
A sign beside the walkway explains how the inspection robots work.

HOW OUR WALKERS STAY STEADY
Our inspection robots use a "tripod gait." A tripod is a stand with three legs, like a camera stand, and three legs are always stable on the ground. At every moment, three of the robot's six legs touch the ground and form a triangle, while the other three swing forward. Because the robot's weight always rests inside that triangle, the walker cannot tip over, even at top speed. Robots that lift too many legs at once, or that lift both legs on one side, lose their balance.
? RI.2 : What is the central idea of the sign?
+ Keeping three legs down in a triangle keeps walkers stable at speed.
- Camera stands are the most important tools in a robot factory.
- Robots with six legs are always slower than robots with wheels.
- Inspection robots check for loose bolts on every machine.
hint: The central idea is what the whole sign is about. What does the title promise to explain?
next: gait

=== gait
scene: factory-floor
cast: hero, kid:happy, fixbot:thinking
Yumi is already scribbling furiously in her engineering notebook.

Kid: Skitter only has four legs, not six, but the same principle should work. Right now, whenever Skitter accelerates, its program lifts both front legs simultaneously, and that's exactly when it tips forward into the water. If we always keep two diagonal legs planted, its weight will stay balanced between them.

Dr. Villanueva nods and sketches the steps on the back of a clipboard:

First, plant the front-left and back-right legs firmly.
Next, lift and swing the other two legs forward.
Then, plant those two legs.
Finally, lift the first pair and repeat, faster and faster.
? RI.3 order : Put the steps of Skitter's new diagonal walk in order.
1 Plant the front-left and back-right legs firmly.
2 Lift and swing the other two legs forward.
3 Plant those two legs.
4 Lift the first pair and repeat, faster.
hint: Use the order words on the clipboard: first, next, then and finally.
next: dez

=== dez
scene: factory-floor
cast: hero, kid:thinking, scientist
While everyone else is absorbed in watching the walkers, you notice that Dez has wandered away by himself. You eventually discover him leaning against a stack of boxes near the loading dock, staring silently at his phone.

On the screen is a photograph of a smiling teenage girl holding an enormous trophy, standing proudly beside Bulwark.

"That's my sister, Liesl," Dez says without looking up. "She was on the Westmere team when they won their first state title. My parents have that photo on the fridge. Every time I walk into the kitchen, there it is."

He shoves the phone in his pocket.

"I just wanted to build something that wins. Something that's as good as hers. Copying Bulwark seemed like the fastest way."
? RL.3 : Why did Dez want to copy Bulwark so badly?
+ He wanted to measure up to his sister, who won with Bulwark's team.
- He secretly works for Westmere Academy as a spy.
- He thinks legs are too expensive for the club to buy.
- He wanted to get Yumi kicked out of the club.
hint: Think about the photo on Dez's phone and what he says about it.
next: dez-talk

=== dez-talk
scene: factory-floor
cast: hero, retrobot:happy, kid
Clatterbox, who has been trundling slowly behind the group for the entire tour, finally catches up with a dramatic grinding of gears.

Retrobot: YOUNG MAN. A ROBOT THAT IS A COPY OF ANOTHER ROBOT CAN ONLY EVER BE SECOND BEST AT BEING THAT ROBOT. BUT A ROBOT THAT IS ITSELF CAN BE FIRST BEST AT BEING ITSELF.

Dez blinks at him. "Did a vacuum cleaner just give me life advice?"

Retrobot: AND TWO TOASTERS.

Dez laughs, genuinely, for the first time all week. Then he returns to the group and examines the diagonal-walk diagram over Yumi's shoulder.

"Okay," he says. "If we're doing legs, they need stronger hip joints for the faster steps. I can build those tonight."
? RL.6 : At the start of the story, Dez saw Skitter's legs as a weakness. How has his point of view changed?
+ He now sees the legs as worth improving instead of replacing.
- He still believes the legs should be thrown away.
- He has decided robots are a waste of time.
- He thinks Clatterbox should compete instead of Skitter.
hint: Look at what Dez offers to build at the end of the page.
next: ch2-end

=== ch2-end
scene: robot-workshop
cast: hero, fixbot:happy, kid:happy
For the next two days, the Loose Screws collaborate better than they ever have before. Dez manufactures sturdier hip joints out of aluminum, Yumi rewrites the walking program, and you conduct test after test on the practice course while Clatterbox announces the times in his booming, old-fashioned voice.

Run twelve: Skitter crosses the water at full speed and stays dry.

Run thirteen: dry again. Run fourteen: dry, and with nineteen seconds to spare.

Fixbot: Skitter is DRY! Skitter is FAST! Skitter has never been so DRY and so FAST at the same time!

Late on Friday night, Yumi notices a small warning flashing in the corner of the screen: BATTERY HEALTH 71 PERCENT. Walking faster consumes considerably more electricity, and the team's main battery is getting old.
clue: Skitter's battery health is only 71 percent, and fast walking drains power quickly.
? RL.2 : Which sentence best summarizes Chapter Two?
+ A factory visit inspires a new gait, and Dez helps improve Skitter.
- The team buys six-legged robots from the Roboworks factory.
- Dez builds treads after all, and Skitter crosses the water.
- Dr. Villanueva joins the Loose Screws as their new captain.
hint: Think about what the team learned at the factory and how the team changed afterward.
next: ch3

# ============================================================
# CHAPTER THREE: THE REGIONAL RESCUE RELAY
# ============================================================

=== ch3
scene: robot-arena
cast: hero, kid:scared, fixbot:happy
checkpoint
~ Chapter Three ~

The regional arena is packed with families, teachers and competitors in matching T-shirts. Colorful banners dangle from the rafters, spotlights sweep across the floor, and the scoreboard clock glows yellow above the course, which is identical to your practice course, except considerably shinier and much more intimidating.

The Loose Screws' first run goes smoothly. Skitter climbs the ramp, scurries across the water using its new diagonal walk, and delivers two ducks before the buzzer sounds, earning ninety points. That places you third, behind Westmere's Bulwark and a team from the coast.

Kid: The final is in forty minutes. We need all three ducks to have a chance.

Yumi glances at the battery meter. It reads 38 percent.
> Swap in the spare battery now -> battery
> Skip the swap and practice the duck grab -> lose-battery

=== lose-battery
scene: robot-arena
cast: hero, fixbot:scared, kid:sad
You spend the forty minutes practicing duck grabs in the pit area, and Skitter becomes faster and faster at scooping them up.

In the final, Skitter races up the ramp and across the water, grabs all three ducks in record time, and pivots toward the rescue zone. Then, gradually, its legs begin to slow down, and its orange eyes dim.

Fixbot: Skitter is... very... sleepy...

Skitter stops eight inches from the rescue zone with three ducks clutched to its dome, and it doesn't move again until the buzzer sounds. Yumi covers her face with her hands. On the screen, the battery meter reads zero.

The evidence was in your notes the entire time: fast walking drains power quickly, and the battery was already weakened.
end: lose Out of Juice

=== battery
scene: robot-arena
cast: hero, kid:happy, fixbot
You install the fully charged spare battery. Skitter's eyes immediately glow brighter, and it performs a celebratory dance on the pit table.

Then you hear an anguished shout from the neighboring pit table. It's the Westmere team. One of Bulwark's rubber treads has snapped completely in half, and their captain, a tall girl named Annika Rasmussen, is staring at the pieces in horror.

"We don't have a spare," she says. "We've never needed one."

Dez looks over at Bulwark, the robot he spent all week wanting to imitate. In his toolbox there is a roll of tread material, left over from the night he almost rebuilt Skitter.
> Offer Westmere your spare tread material -> help
> Focus on your own robot -> focus

=== focus
scene: robot-arena
cast: hero, kid:thinking, fixbot
You decide to remain focused on your own robot. It's a difficult choice, but the final begins in twenty minutes, and Skitter needs one more test of its duck grab.

Across the aisle, the Westmere team manages to patch Bulwark's tread with an entire roll of duct tape. It isn't attractive, but it holds.
> Line up for the final -> final

=== help
scene: robot-arena
cast: hero, kid:happy, retrobot:happy
Dez walks over and offers Annika the roll of tread material. She stares at him in complete disbelief.

"You're Liesl Achterberg's brother," she says. "Why would you help us? We're your competition."

"Because a robot that wins should win by being better," Dez says, "not because the other robot broke."

Clatterbox, standing guard over the Loose Screws' pit table, raises one claw.

Retrobot: GRACIOUS PROFESSIONALISM. I APPROVE. ALSO, I ONCE LOST A TREAD IN NINETEEN NINETY-ONE. IT WAS A DARK DAY.

Together, the two teams fix Bulwark's tread in eleven minutes flat.
clue: Dez helped Westmere fix Bulwark's tread before the final.
? RL.3 : What does Dez's choice to help Westmere show about how he has changed?
+ He cares more about fair competition than about beating Bulwark.
- He wants Westmere to win so his sister will be happy.
- He has given up on competing and wants to join another team.
- He is trying to trick Westmere into using a weak tread.
hint: Read what Dez says to Annika about how a robot should win.
next: help-final

=== final
scene: robot-arena
cast: hero, fixbot:happy, kid:scared
The final begins. The crowd counts down from ten, and Skitter is scheduled to be the last robot to run.

Bulwark has already scored one hundred and fifty points, completing the ramp, the water and all three ducks in two minutes and fifty seconds. To defeat it, Skitter must deliver all three ducks in less time.

The buzzer sounds. Skitter scrambles up the ramp in twenty seconds, its reinforced hip joints pumping rhythmically. It reaches the water, plants two diagonal legs, swings the other two forward, plants again, and skims across the channel like a water bug.

Fixbot: Skitter is DRY! Skitter is still DRY!

It scoops up the first duck, the second, the third, and pivots toward the rescue zone. The clock reads 2:31.

Suddenly Yumi grabs your arm. On the course, a gust from the arena's ventilation system has blown one of the foam rubble blocks directly into Skitter's path.
? RL.1 : Which detail from earlier in the story suggests Skitter can handle the rubble block?
+ Legs grip the rubble, which is why the team chose legs over wheels.
- Clatterbox was built from a vacuum cleaner and two toasters.
- Bulwark scored one hundred and fifty points in its final run.
- The arena has banners hanging from the rafters.
hint: Go back to Chapter One, when Yumi explains why Skitter was built with legs.
next: finish

=== finish
scene: robot-arena
cast: fixbot:happy, kid:happy, retrobot:happy
Skitter doesn't even hesitate. It steps up onto the foam block, steps down the other side, and marches into the rescue zone with all three ducks balanced on its dome like a miniature parade.

The clock stops at 2:44: one hundred and fifty points, six seconds faster than Bulwark.

The arena erupts in cheers. Dez lifts Yumi off the ground, and Clatterbox spins his antennas so enthusiastically that one of them detaches and lands in the water channel.

Retrobot: DO NOT WORRY. I HAVE LEARNED A GREAT DEAL FROM THIS EXPERIENCE.

Then the judges call the Loose Screws to the stage.
? RL.2 : Which theme does the story develop through the Loose Screws' journey?
+ Studying your own failures beats copying someone else's success.
- The team with the most money always wins in the end.
- Robots with treads are always better than robots with legs.
- It is best to make important decisions quickly, without data.
hint: Think about the test log, the factory visit, and what happened when the team tried to copy Bulwark.
next: awards

=== awards
scene: robot-arena
cast: hero, scientist:happy, kid:happy
On the stage, the head judge holds a microphone in one hand and two trophies in the other.

"This year's Regional Rescue Relay champions, by six seconds, are the Loose Screws of Bramblecote Middle School!"

Mr. Villanueva wipes his eyes and claims it's dust. Then the judge holds up the second, smaller trophy, which is shaped like a gear.

"The judges also give an award for the Most Improved Robot. We read every team's test logs, and one robot fell into the water nine times on Monday and zero times on Saturday. That robot is Skitter."

Skitter's orange eyes go wide, and the judge holds the microphone down toward it.
> Let Skitter give the speech -> win-speech
> Walk up together for the trophies -> win-champs

=== win-speech
scene: robot-arena
cast: hero, fixbot:happy, retrobot:happy
Skitter climbs the judge's leg, perches on the podium, and leans toward the microphone.

Fixbot: Skitter would like to thank the water, for being wet. Skitter would like to thank the test log, for remembering. And Skitter would like to thank its team, for not turning Skitter into a toaster.

The whole arena laughs and claps, and Clatterbox salutes so hard that his other antenna falls off.

Back in Room 214 that night, the gear-shaped trophy goes on the shelf right next to a framed copy of the test log from runs one to nine, with every splashdown highlighted in yellow.
end: win The Most Improved Robot

=== win-champs
scene: robot-arena
cast: hero, kid:happy, fixbot:happy
You walk up together to accept both trophies, and Skitter rides on top of the big one, waving one leg at the crowd.

That night, back in Room 214, Dez prints out a new photo and pins it to the corkboard: the Loose Screws, Skitter, Clatterbox and you, holding the trophies. Underneath, in thick marker, he writes the team's new motto.

FAILURE IS INFORMATION. READ THE LOG.

The next morning, Dez's parents put the new photo on the fridge, right next to his sister's.
end: win Champions of the Rescue Relay

=== help-final
scene: robot-arena
cast: hero, fixbot:happy, mech:happy
The final begins. Bulwark runs first on its patched tread and scores one hundred and fifty points in two minutes and fifty seconds, and the Westmere team cheers loudest for the Loose Screws' tread material.

Then it's Skitter's turn. It scrambles up the ramp, skims across the water on its diagonal walk, scoops up all three ducks, steps right over a foam block that has blown into its path, and marches into the rescue zone at 2:44.

Six seconds faster. The Loose Screws are the regional champions.

Before the trophies are handed out, the head judge asks for quiet. "The judges saw something in the pit area today that we want to recognize. One team helped a rival repair their robot, knowing it might cost them the title."
? RL.2 : Which theme does Dez's choice to help Westmere develop?
+ Winning means more when you compete fairly and respect rivals.
- It is always smarter to keep your spare parts a secret.
- Rival teams can never become friends.
- The fastest robot is the only thing that matters.
hint: Think about what Dez told Annika, and how the judges reacted.
next: secret-gears

=== secret-gears
scene: robot-arena
cast: hero, mech:happy, kid:happy
The judge calls both teams to the stage, and Annika walks up with Bulwark rumbling behind her. Its rubber tread, patched with the Loose Screws' spare, squeaks proudly with every turn.

The judge hands a special gear-shaped trophy to Dez, and Dez immediately hands it to Annika, who hands it right back, until finally both captains hold it together while the cameras flash.

"Next year," Annika says, "we're building legs."

"Next year," Dez says, "we're building treads. Just to confuse you."

Later, the two teams eat pizza together on the arena floor, and Skitter rides on top of Bulwark like a tiny general, giving orders that nobody follows.
end: secret The Gracious Gear Award
