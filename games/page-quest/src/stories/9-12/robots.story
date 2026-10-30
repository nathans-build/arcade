title: The Tidewright of Gannet Cove
author: SpiderBen10's Arcade
genre: robots
band: 9-12
cover: lighthouse
blurb: A cleanup mech wades the shallows of a fishing town. In nine days the council votes to keep it or scrap it.
start: start

# ============================================================
# CHAPTER ONE: THE NINE-DAY SUMMER
# ============================================================

=== start
scene: beach
cast: hero, quill:thinking, mech:happy
checkpoint
~ Chapter One ~

The town of Gannet Cove clings to a crooked bay on a stretch of northern coastline where the fog arrives every morning with the dependability of an elderly relative who has never once been late for breakfast. Quill deposits you on the beach at low tide, on the first morning of your summer internship with the Cove's marine-science program, and the first thing you notice is a robot roughly the size of a delivery van, wading knee-deep through the surf with tremendous, deliberate patience.

It is a construction mech, painted school-bus yellow, with black-and-yellow hazard stripes across its shoulders and an orange hard hat permanently bolted to its head. Someone has welded a broad mesh scoop to one of its enormous hands and an equally enormous rake to the other, and stenciled lettering across its back identifies it as HALYARD, SHORELINE RECOVERY UNIT.

It lifts the scoop from the water, and seawater cascades through the mesh, leaving behind a disheartening collection of bottle caps, a shredded shopping bag, a child's sandal and a length of faded green fishing net knotted around a piece of driftwood.

Mech: Good morning. You must be the new intern, whose arrival the program director announced with considerable enthusiasm. I am Halyard. Please excuse my appearance; I was originally manufactured to pour concrete foundations, and I am still learning, somewhat laboriously, to be delicate.

Quill: Hoo. Delicacy is overrated, my enormous friend. Purpose, however, is not.
> Ask Halyard what it does all day -> purpose
> Look more closely at the net in the scoop -> net

=== net
scene: beach
cast: hero, mech:thinking, quill
You lean over the scoop to examine the net. It is faded, brittle and furred with algae, and trapped inside one of its knots is a tiny crab, its legs waving with the indignation of a creature that considers itself seriously inconvenienced.

Halyard lowers the scoop to the wet sand with a gentleness that seems almost impossible for a machine of its dimensions, and with one colossal finger it nudges the knot loose until the crab can scuttle sideways to freedom, without, of course, a single word of gratitude.

Mech: Fishermen call this a ghost net, which is an unusually poetic name for an unusually destructive object. It was lost or abandoned at sea, and it continues fishing for years afterward, entangling anything that swims into it, although no one will ever return to haul it in. Nets of this age become brittle and gradually shed microscopic fibers into the surrounding water, which is a problem considerably larger than the net itself.
clue: Ghost nets are lost or abandoned fishing nets that keep trapping animals for years.
> Ask Halyard what it does all day -> purpose

=== purpose
scene: beach
cast: hero, mech:sad, kid:thinking
A teenager in a faded program T-shirt jogs down the sand toward you, carrying a tablet in a waterproof case. She introduces herself as Noor Halvorsen, the program's senior intern, and she explains the situation so efficiently that you suspect she has been rehearsing the speech in front of a mirror.

Kid: Halyard removes approximately four hundred pounds of debris from the shallows every week, and our survey drone maps where the garbage concentrates so that Halyard knows precisely where to wade. Unfortunately, the grant that pays for Halyard expires at the end of the month. In nine days, the town council votes on whether to renew its funding or to sell Halyard back to the construction company and spend the money rebuilding the north pier, which is, admittedly, collapsing.

Mech: The construction company has expressed an interest in returning me to concrete. I have complicated feelings about concrete.

Noor swipes her tablet to a chart and hands it to you with an expression of grim determination.

Kid: The council has made it clear that they want evidence rather than enthusiasm, and we have exactly nine days to gather it.
? RL.3 : What central conflict does this page establish?
+ Halyard's future depends on a council vote in nine days.
- Noor and Halyard disagree about how to clean the beach.
- The fishermen of Gannet Cove want to buy Halyard themselves.
- Halyard refuses to work unless it receives a new paint job.
hint: Look at what Noor says about the grant, the vote and the deadline.
next: chart

=== chart
scene: beach
cast: hero, kid:thinking, drone:happy
A small blue quadcopter descends from the fog and hovers at eye level, its screen blinking two cyan eyes with obvious excitement.

Drone: Petrel reporting! Debris density mapped across shoreline zones one through six! Extremely fascinating data! Some of it is also extremely disgusting data!

Noor shows you the summary of Petrel's survey, which records the debris Halyard has recovered over the last four weeks. North Beach yielded 140 pounds and the Harbor Mouth an astonishing 610, while Lighthouse Point produced only 95, Festival Green contributed 380, the South Rocks a modest 80, and the Marsh Inlet 315.

Kid: The council will look at the total, which is roughly sixteen hundred pounds, and they'll either be impressed or horrified, depending on their mood. What I want to understand is why the debris isn't distributed evenly along the shoreline, because the ocean doesn't play favorites without a reason.
? RI.7 : What does Petrel's survey suggest about where the debris comes from?
+ Most debris collects in a few zones, especially the Harbor Mouth.
- Debris is spread evenly across all six zones of the shoreline.
- Lighthouse Point collects more debris than any other zone.
- The amount of debris has fallen sharply over four weeks.
hint: Compare the six numbers. Which zones are much higher than the others?
next: hall

=== hall
scene: village
cast: hero, mayor:thinking, captain:angry
That evening, the council holds a preliminary hearing in the town hall, a whitewashed building beside the green with rows of folding chairs and a slightly unflattering portrait of a gannet hanging above the podium. Mayor Bertrand Szabo, a patient, methodical man whose reading glasses are perpetually perched on his forehead, opens the floor for public comment.

The first speaker is Captain Hamish Quarrie, who has fished out of the Cove for thirty-one years and who speaks as though the wind has been blowing against him for every one of them.

Captain: That machine is a solution searching desperately for a problem. It stomps through the shallows frightening away the bait fish, it cost this town more than a brand-new trawler, and it collects garbage that the tide will simply deliver back next week. Meanwhile, the north pier is disintegrating beneath our boots. Every fisherman I know agrees with me, so I'll say it plainly: rebuild the pier.

Several people in the back rows applaud vigorously, and one of them whistles.

Mayor: Thank you, Captain. The council will weigh every claim carefully and impartially, and we will hear the program's evidence at the final vote in nine days.
? RI.8 : Which of Captain Quarrie's claims is supported by the least evidence?
+ That Halyard scares away the bait fish
- That the north pier needs repair
- That Halyard was expensive for the town
- That trash can wash back in with the tide
hint: Some of his claims are things everyone can see or check. Which one does he state without any observation or data?
next: claims

=== claims
scene: village
cast: hero, kid:angry, mayor
Outside the hall, Noor is fuming, pacing in tight, furious circles across the damp grass of the green.

Kid: "Every fisherman I know agrees with me." That isn't evidence; that's a popularity contest dressed up as an argument. And the bait-fish accusation is pure speculation, because he doesn't have a single measurement to support it.

You point out, cautiously, that the Captain also said something undeniably true: the tide really does bring debris back. If Halyard is removing the same sixteen hundred pounds from the same locations week after week, then it is entirely reasonable for the council to wonder whether the program is accomplishing anything permanent.

Noor stops pacing abruptly and studies you for a long, uncomfortable moment.

Kid: That's extremely annoying, because you're completely right. If our only argument is that Halyard collects an impressive quantity of trash, the Captain will say we're mopping the floor while the faucet's running. Before the vote, we need to discover where the faucet actually is.
? L.5 : Noor says Halyard might be "mopping the floor while the faucet's running." What does the metaphor suggest?
+ Cleaning up is pointless if the source keeps flowing.
- Halyard should be reprogrammed to clean floors instead.
- The town hall has a leaking faucet that needs repair.
- Mopping is more effective than using a robot.
hint: Think about what happens to a floor if you mop it while water keeps pouring from the faucet.
next: keeper

=== keeper
scene: lighthouse
cast: hero, keeper:happy, kid
The following morning, Noor leads you up the hill to the lighthouse at the tip of the point. The light has operated automatically for twenty years, but its retired keeper, Augusta Treloar, still lives in the cottage at its base and still climbs the hundred and twelve spiral steps every evening, as she explains, "to keep the light company, since nobody else bothers to."

Keeper: You want to know where the rubbish originates. Well, I have been recording precisely that information since before either of you existed.

She leads you into a room lined from floor to ceiling with identical blue clothbound notebooks, every spine labeled with a year, representing thirty-four years of daily entries describing the weather, the tides, the ships that passed and, in a column she added herself in 1991, "What the sea brought in."
clue: Augusta Treloar's logbooks record "What the sea brought in" every day for thirty-four years.
> Open the earliest logbook -> log-old
> Ask Augusta what she thinks of Halyard -> augusta

=== augusta
scene: lighthouse
cast: hero, keeper:thinking, mech:surprised
Augusta gazes out the cottage window, through which Halyard is visible on the beach below, wading methodically through the morning fog like an extraordinarily patient yellow heron.

Keeper: I think it is the most beautiful ugly thing I have ever seen in my life. My father kept this light before me, and he used to say that a lighthouse doesn't actually save ships; it simply tells them where the rocks are, and then the ships save themselves. Your robot can't rescue the bay by itself, either, no matter how much rubbish it hauls out. But if you're clever about it, it might tell the town where the rocks are.

Halyard, as though it had somehow overheard, raises its rake toward the cottage in a slow, solemn salute.
? RL.4 : What does Augusta mean when she says Halyard "might tell the town where the rocks are"?
+ Halyard's data could reveal the hidden causes of the pollution.
- Halyard should be used to clear rocks off the beach.
- Halyard is going to replace the lighthouse light.
- The town should build a wall of rocks to stop the trash.
hint: She is comparing Halyard to the lighthouse. A lighthouse shows ships the danger so they can avoid it.
next: log-old

=== log-old
scene: lighthouse
cast: hero, keeper, kid:thinking
You carefully remove the notebook labeled 1991 and turn its brittle pages. The entries are concise, meticulous and occasionally unexpectedly hilarious: "14 May, fog until ten o'clock, and the sea brought in driftwood, two buoys, one rubber boot (left foot only), and an entire crate of oranges, which I ate." Another, written a few weeks later, records simply that the water was calm, that the sea brought in very little, and that it was therefore "a good day."

Then you retrieve the most recent notebook and read the same column. The handwriting has grown shakier with the passing decades, but the column itself has grown considerably longer: "2 June, calm, and the sea brought in cups, cups and more cups, eleven balloons with ribbons still attached, net fragments along the harbor side, and bottle caps beyond counting." A month later, Augusta noted, with what reads like weary irritation, that the Festival Green was "full of cups again the day after the Summer Fair," and that net fragments had once more accumulated along the harbor side.
? RL.1 : Which evidence from the recent logs points to a possible source of the debris?
+ The Festival Green fills with cups the day after the Summer Fair.
- In 1991, the sea brought in a crate of oranges.
- The handwriting in the recent logs is shakier than before.
- One entry from 1991 mentions a single rubber boot.
hint: Look for an entry that links the debris to a specific place and event.
next: ch1-end

=== ch1-end
scene: lighthouse
cast: hero, kid:happy, keeper:happy
Noor has already photographed forty pages on her tablet, and her expression has transformed from fury into the quiet, ferocious concentration of somebody who has just glimpsed the outline of an answer.

Kid: Petrel's survey identifies the Festival Green and the Harbor Mouth as the worst zones, and Augusta's logbooks show that festival cups and net fragments began accumulating in exactly those locations years ago. If we cross-reference thirty-four years of observations with Halyard's collection data, we won't merely demonstrate that Halyard picks up trash. We'll demonstrate where the trash comes from, which is an entirely different argument.

Keeper: And then the council will have to decide whether they would prefer to keep mopping indefinitely, or to finally turn off the faucet.
? RL.2 : Which is the best objective summary of Chapter One?
+ A cleanup mech faces a vote, and the team finds clues to the source.
- A captain convinces the town to buy a trawler instead of a robot.
- Augusta Treloar builds Halyard in her cottage to clean the beach.
- Noor and the captain become friends and agree to rebuild the pier.
hint: An objective summary names the central conflict and the key discovery, without opinions.
next: quiz-ch2

=== quiz-ch2
scene: lighthouse
cast: hero, quill:happy
You take a moment to gather your thoughts. Quill draws a small, neatly lettered card from beneath one wing.
Quill: The best explorers are never experts in only one thing. Consider this a brief detour before we press on.
? QUIZ : Quick challenge before the next chapter!
next: ch2

# ============================================================
# CHAPTER TWO: SOURCES
# ============================================================

=== ch2
scene: robot-workshop
cast: hero, kid:thinking, scientist:happy
checkpoint
~ Chapter Two ~

The program's workshop occupies a converted boathouse on the harbor, its walls lined with pegboards of tools and its workbench buried beneath sample jars, each meticulously labeled with a date and a zone number. The program director, Dr. Sunniva Brekke, a marine chemist with permanent salt stains on her boots and an apparently inexhaustible supply of patience, has cleared an entire table for your investigation.

For four exhausting days, you and Noor sort Halyard's collection into categories while Dr. Brekke analyzes water samples under the microscope, Petrel flies survey patterns at dawn, and Halyard wades the zones in a new, carefully calculated sequence.

Scientist: The visible garbage is only the beginning of the problem. Under the microscope, every water sample from the Harbor Mouth contains microplastics, which are fragments of plastic smaller than five millimeters, and a remarkable proportion of them are fibers from degraded nylon fishing net.
? L.4 : Based on the context, what are "microplastics"?
+ Tiny pieces of plastic smaller than five millimeters
- Large plastic objects such as bottles and buckets
- Plastics that are safe for fish to eat
- A type of seaweed that grows near harbors
hint: Dr. Brekke defines the word in the same sentence. Look right after it.
next: sort

=== sort
scene: recycling-center
cast: hero, kid:happy, mech:happy
By the fifth day, you have transported the sorted debris to the county recycling center, where a conveyor belt carries it past enormous bins marked CANS, PAPER, GLASS and CUPS. Halyard, which has insisted on carrying the heaviest bales, waits patiently at the gate with a sack of crushed bottles balanced on each colossal shoulder.

Noor has converted the totals into categories, and the results are startling: festival cups and balloons account for thirty-one percent of everything Halyard has collected, concentrated around the Festival Green and the Marsh Inlet and peaking immediately after the Summer Fair; fishing net fragments account for another twenty-seven percent, almost entirely from the Harbor Mouth; scattered bottles and cans represent twenty-two percent; and miscellaneous debris makes up the remaining twenty.

Mech: I find it genuinely reassuring that more than half of what I collect originates from only two sources. Two sources can be persuaded to change their behavior. An entire ocean is considerably more stubborn.
? RI.3 : According to Noor's categories, how are the festival and the harbor connected to the debris?
+ Together they produce more than half of the debris Halyard collects.
- Both places are where Halyard stores its tools at night.
- Neither place has any effect on the amount of debris.
- They are the only zones Petrel is unable to map.
hint: Add up the percentages for festival cups and balloons, and for fishing net fragments.
next: captain

=== captain
scene: ship-deck
cast: hero, captain:thinking, kid:scared
The net fragments raise an uncomfortable question, and you suspect that the person most capable of answering it is also the person least likely to welcome it. On the sixth day, you locate Captain Quarrie on the deck of his boat, the Wandering Gull, mending a net with a wooden needle and an impressive scowl.

You show him the data. He reads it slowly, then reads it again, and then he sets down his needle with exaggerated care.

Captain: You're telling me that my own harbor is full of my own nets.

Kid: Not your nets specifically, Captain, but nets from the fleet, yes: old ones, worn ones, nets lost in storms. There's nowhere in the Cove to dispose of them responsibly, so people either dump them or store them on the docks until the weather carries them away.

The Captain remains silent for a long time, staring across the harbor toward the sagging silhouette of the north pier.

Captain: There used to be a net bin on the end of the north pier, back when the pier was sound enough to walk on. Nobody has used it in ten years, because nobody can reach it without falling through the planks.
clue: Captain Quarrie: an old net-disposal bin sits unused on the rotting north pier.
? RL.3 : How does Captain Quarrie's reaction on this page complicate the conflict?
+ He reveals that the broken pier and the net debris are connected.
- He confesses that he has been secretly damaging Halyard.
- He refuses to look at the data and orders everyone off his boat.
- He decides to sell his boat and leave Gannet Cove for good.
hint: What does he reveal about the north pier and the old net bin?
next: realize

=== realize
scene: ship-deck
cast: hero, kid:surprised, captain
Noor stares at the Captain, and then she stares at you, and you can practically watch the pieces assembling themselves behind her eyes.

Kid: The pier. The very pier he wants to rebuild. The council believes it's choosing between Halyard and the pier, but if the pier had a functioning net bin again, the fleet would stop losing worn-out nets in the harbor, and the Harbor Mouth would stop filling up with ghost nets in the first place.

Captain: Don't go turning me into some kind of environmentalist now, young lady.

But for the first time since you met him, the Captain very nearly smiles.
? RL.6 : At the hearing, the Captain saw Halyard as a waste of money. How is his view shifting?
+ He sees that his concerns and the program's may share a solution.
- He now believes the robot should replace the fishing fleet.
- He has decided that the pier should never be repaired.
- His view is unchanged, and he still opposes the program.
hint: Notice the almost-smile, and what he admits about the net bin.
next: storm-warn

=== storm-warn
scene: lighthouse
cast: hero, keeper:scared, drone:surprised
On the seventh evening, two days before the vote, the barometer in Augusta's cottage drops so precipitously that she taps it twice to confirm it hasn't simply broken. By sunset, a gale is hurling rain sideways across the point, and the lighthouse beam swings through sheets of spray.

Petrel's video feed has dissolved into a smear of grey static, but one image transmits clearly: in the Harbor Mouth, entangled in a drifting ghost net, a harbor seal pup is struggling to keep its head above the churning water.

Drone: Animal entangled at the Harbor Mouth! Conditions extremely unpleasant! Petrel's rotors are deeply unhappy!

Halyard stands at the top of the beach with its hard-hat beacon spinning, but the Harbor Mouth lies beyond the breakwater, where the water is deeper than the mech was ever designed to wade.
> Ask Augusta what she would do -> augusta-storm
> Send Halyard straight out past the breakwater -> lose-sandbar

=== lose-sandbar
scene: stormy-sea
cast: mech:scared, drone:scared
You give the order, and Halyard strides into the surf without a moment's hesitation, the beam of its beacon sweeping across the waves as it wades directly toward the Harbor Mouth along the shortest possible line.

Unfortunately, the shortest line crosses Pollack Bar, a sandbar that relocates with every storm and that every fisherman in the Cove has learned to avoid. Halyard's enormous feet sink into the soft sand beneath the water, and by the time it attempts to retreat, it is buried to the knees, with the tide rising and the waves breaking over its shoulders.

Petrel manages to drop a cutting tool to the seal, which frees itself and vanishes into the darkness. Halyard is less fortunate: it remains stranded on the sandbar all night, its beacon blinking forlornly, until the harbor crane can finally reach it at dawn.

Two days later, the council reads the headline in the Gannet Cove Gazette, which announces that the town's expensive robot was stranded in the storm and requires costly repairs, and the vote is not even close. You allowed urgency to outrun knowledge, even though the bay had already warned you, in a lighthouse full of notebooks, exactly where its dangers lay.
end: lose Stranded on Pollack Bar

=== augusta-storm
scene: lighthouse
cast: hero, keeper:thinking, mech
Augusta pulls a notebook from the shelf without even glancing at its spine, flips to an entry written nineteen years earlier, and runs a weathered finger down the page.

Keeper: A gale from the southwest, identical to tonight's. "Pollack Bar shifted east. Safe passage along the breakwater, north side, on the falling tide." The bar relocates with every storm, but it invariably moves in the same direction during a southwest blow. Keep to the north side of the breakwater, and your robot will keep its footing.

She consults the tide clock mounted on the wall beside the fireplace.

Keeper: The tide turned twenty minutes ago, and it's falling now, which gives you approximately one hour before the water becomes impossible.
? RL.5 order : Put these events from the storm in the order they happen.
1 The barometer in Augusta's cottage drops sharply.
2 Petrel spots a seal pup tangled in a ghost net.
3 Augusta finds an old entry about the same kind of gale.
4 The team learns there is a safe passage on the falling tide.
hint: Start with the first sign of the storm and end with the plan.
next: rescue

=== rescue
scene: stormy-sea
cast: hero, mech:scared, drone:happy
Halyard wades along the north side of the breakwater exactly as the logbook describes, its feet discovering firm sand with every step, while the wind shrieks across the rocks and Petrel hovers overhead, struggling to maintain its position as it illuminates the route with its camera lamp.

At the Harbor Mouth, the seal pup is exhausted, its flippers bound in green netting. Halyard lowers its mesh scoop beneath the little animal, lifts it gently from the water, and holds it steady against its chest while Petrel guides your hands, through the video link, to the cutting tool mounted on Halyard's wrist.

Mech: Please hold still, small one. I was constructed to pour concrete, and I am attempting, with every circuit I possess, not to be concrete right now.

The net parts. The pup slides off the scoop, rolls once and dives, and a moment later its sleek dark head reappears twenty feet away, blinking at Halyard before it disappears toward the open sea.
? L.5 : Halyard says it is "trying very hard not to be concrete." What does this suggest?
+ It is trying to be gentle, unlike the machine it was built to be.
- It wants to pour a concrete foundation during the storm.
- It is afraid the cold water will turn its body to stone.
- It is annoyed that the seal is wasting its valuable time.
hint: Think about what concrete is like, and about the delicate job Halyard is doing.
next: ch2-end

=== ch2-end
scene: beach
cast: hero, mech:happy, kid:happy
By dawn, the storm has exhausted itself, and the beach is strewn with kelp, driftwood and a fresh deposit of debris. Halyard is already at work, wading methodically through the shallows of the Festival Green as though nothing remarkable has happened.

Noor sits on an overturned crate with her tablet balanced on her knees, writing furiously. She hasn't slept, and her eyes are unnaturally bright.

Kid: The vote is tomorrow, and I have the data, the logbooks and the categories. But I keep thinking about the moment the Captain's expression changed when he finally understood. The numbers didn't accomplish that by themselves. The story did, because it gave the numbers somewhere to live.
? RL.2 : Which sentence best summarizes Chapter Two?
+ The team traces the debris; Halyard saves a seal with Augusta's log.
- Halyard is sold to the construction company and pours concrete.
- Captain Quarrie persuades Noor to give up the cleanup program.
- Petrel maps the storm and predicts that the vote will fail.
hint: Think about the two major discoveries and the major event during the storm.
next: quiz-ch3

=== quiz-ch3
scene: beach
cast: hero, quill:happy
Before you can turn the page, Quill raises one wing, unhurried and deliberate.
Quill: The story will keep. A quick challenge first; think it through rather than guessing.
? QUIZ : Sharp minds win the day. Try this one!
next: ch3

# ============================================================
# CHAPTER THREE: THE VOTE
# ============================================================

=== ch3
scene: village
cast: hero, kid:scared, mayor
checkpoint
~ Chapter Three ~

The town hall is more crowded than it has been in years. Fishermen in rubber boots line the back wall, festival organizers occupy the front rows, and someone has inexplicably brought a casserole. Mayor Szabo taps the microphone, which emits an earsplitting squeal, and invites the program to present its evidence.

Noor is gripping her tablet so tightly that her knuckles have turned white. She has asked you to deliver the opening argument, and you have precisely ten minutes.
> Open with the seal rescue story -> lose-story
> Open with the evidence of the sources -> evidence

=== lose-story
scene: village
cast: hero, mayor:sad, captain:thinking
You describe the storm, the seal pup, the green net and the gentle robot in vivid, emotional detail. People in the front rows dab their eyes, and somebody whispers, "Oh, the poor little thing."

However, when a council member asks how much debris Halyard removes per dollar of funding, you don't have the figure prepared. When another asks whether the garbage simply returns every week, you reply that Halyard keeps cleaning it up, and you notice the Captain wince. You run out of time before Noor can display a single chart.

The council votes four to three to sell Halyard and rebuild the pier. Afterward, Mayor Szabo shakes your hand regretfully. "It was a beautiful story," he says quietly, "but I needed to know that the plan would actually work."

A story can open a door, but evidence has to walk through it.
end: lose The Vote That Sank

=== evidence
scene: village
cast: hero, kid:happy, mayor:thinking
You begin with Petrel's survey and Noor's four categories, and then you place Augusta's logbook entries beside them, revealing thirty-four years of the same narrative unfolding in the same locations: festival cups on the green the morning after every Summer Fair, net fragments at the Harbor Mouth ever since the north pier closed, and microplastics in every sample Dr. Brekke analyzed.

Then you present your central claim: Halyard is not merely a cleanup machine but a measuring instrument, and what it has measured shows the council exactly where the pollution originates and precisely what it would cost to prevent it.

The hall becomes extraordinarily quiet. In the back row, Captain Quarrie is leaning forward, with his arms folded across the chair in front of him.
? RI.8 : Why is your argument stronger than Captain Quarrie's speech at the first hearing?
+ It supports its claims with data and long-term records.
- It is longer and uses more difficult vocabulary.
- It relies on the fact that many people in town agree.
- It avoids mentioning the north pier entirely.
hint: Compare how each speaker backs up their claims. What did the Captain rely on?
next: proposal

=== proposal
scene: village
cast: hero, kid:happy, captain:happy
Noor rises to deliver the proposal that the two of you composed at dawn, and it has three components: first, renew Halyard's funding for an additional year; second, rebuild only the first section of the north pier, sufficient to reach the abandoned net bin, and convert it into a free net-recycling station for the fishing fleet; and third, replace the Summer Fair's plastic cups and balloon releases with washable cups and paper lanterns.

Before the Mayor can respond, a chair scrapes loudly in the back row, and Captain Quarrie rises to his feet.

Captain: At the first hearing, I announced that every fisherman I know agrees with me. Since then, I've spoken with every one of them, with these young people's numbers in my hand, and we will use the net station. I'll add this for the record: that yellow machine walked into a gale to rescue a seal pup, which is considerably more than I would have done at its age.
? RL.3 : Why is the Captain's speech so important to the outcome of the vote?
+ A respected former opponent now publicly supports the plan.
- He threatens to leave the town if the vote fails.
- He offers to pay for Halyard with his own money.
- He reveals that he built Halyard years ago.
hint: Think about who the Captain is and what he said at the first hearing.
next: author

=== author
scene: village
cast: hero, mayor:thinking, keeper:happy
While the council deliberates, Augusta passes you a folded copy of that morning's Gannet Cove Gazette, on whose opinion page appears a brief essay signed by the Mayor himself, composed the night before the vote.

"I grew up in this Cove, and I have watched it change. Some of those changes are measured in pounds of plastic, and others are measured in the number of children who still swim at the Festival Green each summer. I do not intend to tell the council how to vote. I intend only to remind them that a town is exactly as healthy as the water it is built beside."
? RI.6 : What is the Mayor's main purpose in writing this essay?
+ To urge readers to value the bay while claiming neutrality
- To announce that he will vote to sell Halyard
- To describe the history of the lighthouse and its keepers
- To advertise the upcoming Summer Fair
hint: He says he won't tell the council how to vote. But what does he remind them, and why?
next: vote

=== vote
scene: village
cast: mayor:happy, kid:surprised, keeper:happy
The council votes six to one to adopt the entire proposal. The hall erupts, and somebody knocks the casserole off its table.

Outside on the green, Halyard is waiting with its scoop held carefully in front of it, like a student waiting outside the principal's office, uncertain whether celebration is permitted. When Noor bursts through the doors and shouts the result, it raises both enormous arms straight into the air, and several bystanders prudently retreat a few steps.

Augusta catches your sleeve before you can join them.

Keeper: Before you all rush off to celebrate, come up to the lighthouse with me. There's something I have never shown anyone.
> Celebrate with Halyard on the beach -> theme
> Follow Augusta to the lighthouse -> secret-log

=== theme
scene: beach
cast: hero, mech:happy, quill:happy
That night, the entire program gathers on the beach around a driftwood fire, and Quill perches on Halyard's hard hat like a very small, very satisfied ship's captain.

Quill: Hoo. So, intern, after nine remarkably eventful days, what has the Cove taught you?
? RL.2 : Which theme does the story develop most fully?
+ Lasting solutions come from understanding a problem's sources.
- Robots are always more reliable than people in emergencies.
- Small towns should never change their traditions.
- Arguing with your opponents is a waste of time.
hint: Think about the faucet, the logbooks, the net station and the festival cups.
next: ending-choice

=== ending-choice
scene: beach
cast: hero, mech:happy, kid:happy
Noor turns toward you in the flickering firelight.

Kid: The internship ends next week, and Dr. Brekke has asked whether one of us would present the Gannet Cove model at the state coastal conference. Meanwhile, Halyard needs someone to design next year's survey routes, and that person needs to understand the tides almost as well as Augusta does.
> Present the model at the state conference -> win-conference
> Stay and plan Halyard's routes -> win-routes

=== win-conference
scene: village
cast: hero, kid:happy, mayor:happy
At the state coastal conference, you and Noor present the Gannet Cove model to an auditorium full of mayors, scientists and fishermen. Your slides display the weathered logbooks beside Petrel's maps, the net station on the rebuilt section of the pier, and a photograph of the Summer Fair without a single balloon drifting in the sky.

A year later, the Festival Green collects eighty percent less debris, the net station has received four tons of worn-out nets that are shredded and recycled into new rope, and four other coastal towns have written to ask how they might borrow a robot, a drone and a lighthouse keeper's logbook.
end: win The Gannet Cove Model

=== win-routes
scene: beach
cast: mech:happy, drone:happy, kid
You spend your final week designing Halyard's next year of survey routes alongside Petrel, drawing on the categories you constructed and on every logbook entry Augusta ever wrote about tides and sandbars.

On the last morning, Halyard wades into the fog at dawn and follows the new route without a single wasted step. By autumn, its weekly collection has declined from four hundred pounds to ninety, not because it is working less diligently, but because there is simply less to find.

Mech: I have collected less debris this month than in any month since my arrival. I believe this is the first occasion in my career on which accomplishing less has felt unmistakably like success.
end: win Less to Find

=== secret-log
scene: lighthouse
cast: hero, keeper:happy, mech:surprised
Augusta leads you up the hundred and twelve steps to the lamp room, where the enormous lens rotates slowly above your heads. From a drawer beneath the lens, she withdraws one final notebook, older than all the others, its cover bleached almost completely white by decades of sunlight.

Keeper: My father's notebook, from the first year he kept the light. Read the final entry.

The handwriting is careful and formal: "Sea brought in: nothing but sea. May it always be so, and if it is not, may someone be keeping count."

Augusta presses the notebook gently into your hands.

Keeper: Someone was keeping count, and now it's your turn. A new notebook begins tonight, and I believe the machine deserves a column of its own.

Below the lighthouse, on the moonlit beach, Halyard looks up at the turning beam, and for a single moment its own small beacon blinks in perfect time with it.
end: secret Someone Keeping Count
