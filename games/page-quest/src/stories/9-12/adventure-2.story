title: When the Glass Falls
author: SpiderBen10's Arcade
genre: adventure
band: 9-12
cover: stormy-sea
blurb: A hurricane is coming, the island's telegraph is dead, and the only fast ship has a price. Sail the reef instead.
start: start

# ============================================================
# CHAPTER ONE: THE FALLING GLASS
# ============================================================

=== start
scene: city-street
cast: hero, quill, kid:scared
checkpoint
~ Chapter One ~

Quill deposits you on the slick cobblestones of Harrowgate, a weathered harbor town in the Sorrel Islands, at that indeterminate hour when the gas lamps are still burning and the gulls have not yet resumed their quarrels. The air is peculiarly warm and absolutely motionless, as though the whole archipelago were holding its breath. Beyond the harbor mouth, an unseasonable swell is collapsing against the breakwater at long, deliberate intervals, each concussion followed by an unnatural silence.

The door of the telegraph office flies open, and a girl of approximately sixteen, with ink-stained fingers and a pencil lodged behind one ear, very nearly collides with you.

Kid: The Vesper Cay line just went dead, and not gradually, either. It didn't fade or stutter; it stopped in the middle of a sentence. This is everything that came through before the silence.

She thrusts a narrow strip of paper toward you, on which the operator's hurried capitals read: GLASS FALLING FAST HERE. SKY BRASS COLORED. SEND WORD IF YOU

Quill: If you what?

Kid: Exactly. Nobody knows, and nobody can ask.
> Ask her about Vesper Cay -> sabine-home
> Go straight to the observatory -> observatory

=== sabine-home
scene: city-street
cast: hero, kid:sad, quill
Her name is Sabine Duval, and she is the telegraph office's apprentice, a position that apparently involves performing most of the work for a fraction of the salary.

Kid: Vesper Cay is seventy miles offshore, beyond the reef everybody calls the Combs. Three hundred people live there, including my grandmother, who raised me. She maintains the island's records and its barometer, and in sixty years she has never transmitted anything remotely like that.

She folds the telegram with excessive precision, the way people handle objects when they are trying not to handle their feelings.

Kid: The island is practically level with the sea. The only genuine elevation is Signal Hill, which reaches forty feet if you're generous. During the hurricane of 1871, the ocean simply walked across everything else.

Quill: Then we had better determine, with considerable precision, exactly what kind of weather is approaching.
> Hurry to the observatory -> observatory

=== observatory
scene: lab
cast: hero, scientist:thinking, kid
The Harrowgate Observatory occupies a drafty limestone tower above the harbor, crowded with brass instruments that tick, hum, and scratch. Dr. Imogen Saye, the archipelago's solitary meteorologist, is bending over a barograph, a clockwork drum on which a mechanical pen records the atmospheric pressure hour by hour.

Sabine hands her the telegram. Dr. Saye reads it once and sets down her coffee with deliberate care.

Scientist: Our barometer has been declining since midnight, at an hour when it ordinarily rises. Your grandmother's report is considerably worse. If her glass is falling fast, it is falling precipitously, the way a stone drops from a cliff edge rather than the way a leaf drifts down. That pattern is the signature of something enormous and organized.

She taps the inked line on the drum, which curves downward like a ski slope.
? L.4 : Based on context and the root "precipice," what does "precipitously" mean?
+ Steeply and suddenly, like a drop off a cliff
- Gently and gradually, like a drifting leaf
- Unpredictably, rising and falling by turns
- Heavily, as rain falls during a storm
hint: Dr. Saye contrasts a stone dropping from a cliff edge with a leaf drifting down. A precipice is a cliff edge.
next: bulletin

=== bulletin
scene: lab
cast: hero, scientist, quill:thinking
Dr. Saye composes rapidly, then pins her bulletin to the observatory door for the harbor council.

STORM BULLETIN, 6 A.M. The barometer at this station has fallen steadily since midnight, contrary to its customary morning rise, and Vesper Cay reports a rapid decline. Since yesterday evening, a long, heavy swell has been arriving from the southeast at intervals of fourteen seconds, although the local wind remains light; swell of this character travels considerably ahead of a tropical cyclone. High, feathered cirrus clouds are streaming from the same quarter. Considered together, these observations indicate a hurricane approaching from the southeast, probably reaching Vesper Cay by tomorrow night. For low islands, the principal danger is the storm surge, an elevation of the sea that may exceed the height of the land itself.

Scientist: No individual sign constitutes proof. Three independent signs pointing in the same direction constitute a forecast.
? RI.1 : Which evidence from the bulletin best supports the forecast of a hurricane?
+ Falling pressure, a long southeast swell, and cirrus from that quarter
- The local wind remains light this morning.
- The storm surge may exceed the height of the land.
- The bulletin is pinned to the observatory door.
hint: Dr. Saye says one sign is not proof, but several pointing the same way make a forecast. Which answer lists her observations?
next: council

=== council
scene: castle-hall
cast: hero, mayor:scared, scientist
By eight o'clock, the harbor council has assembled in the vaulted hall of the old Customs House. Mayor Ezra Lusk, a mild, conciliatory man who prefers problems that resolve themselves, reads the bulletin aloud and visibly regrets every syllable.

Mayor: The government steamer is in dry dock with a fractured propeller shaft. Every fishing vessel in the harbor is at least a day's sail from Vesper, and not one of their skippers will venture into the Combs with weather like this approaching. That leaves us remarkably few alternatives.

Scientist: It leaves us precisely one decision, Mayor, and considerably less time than you would prefer to make it.

At the back of the hall, a tall man in an immaculate oilskin cape, its hood still raised against the drizzle, clears his throat and proceeds unhurriedly toward the front.

Mayor: The chair recognizes Mr. Augustin Pryce, of the Consolidated Steam and Salvage Company.
> Hear what Pryce has to say -> pryce-speech

=== pryce-speech
scene: castle-hall
cast: hero, stranger:happy, mayor
Pryce lowers his hood and addresses the assembly in a warm, resonant baritone, the voice of a man who has rehearsed his spontaneity.

Stranger: Friends and neighbors, and I do consider every one of you a neighbor, nobody in this room wishes to see three hundred souls swept into the sea. The government steamer is regrettably out of commission. That misfortune is not my doing, but it is, I believe, my opportunity to serve. My tug, the Vigilant, can reach Vesper Cay in seven hours.

He spreads his hands, as though apologizing for the arithmetic.

Several councilors nod involuntarily, the way people do when a confident voice relieves them of the inconvenient obligation to think.

Stranger: Naturally, my directors cannot endanger a forty-thousand-dollar vessel for nothing. All I ask is that the Cay sign the harbor lease my company proposed last spring, an agreement that will bring that island coal, wages, and progress. Every sensible person here understands there is no alternative. Either the Vigilant sails with that lease, or Vesper Cay waits for the sea.
? RI.6 : What is Pryce's main purpose, and how does his rhetoric present it?
+ To win the harbor lease, which he presents as a generous rescue
- To warn the islanders, with no conditions attached
- To criticize the mayor for neglecting the government steamer
- To explain the science of hurricanes to the council
hint: Look at what he asks for after "All I ask is." How does he describe himself before he gets there?
next: saye-reply

=== saye-reply
scene: castle-hall
cast: scientist:angry, stranger, quill
Dr. Saye rises before the mayor can formulate a response.

Scientist: Mr. Pryce has presented two options as though they were the only two in existence. They are not. A schooner whose master understands the Combs could be anchored off Vesper by tomorrow morning, comfortably ahead of the storm, and a warning delivered that way would cost the islanders nothing whatsoever.

Pryce responds with a smile of courteous, practiced condescension.

Stranger: A schooner, through the Combs, with a hurricane approaching? With the greatest respect, Doctor, that is sentiment masquerading as seamanship. Ask anyone in this harbor.

A murmur circulates through the hall. Several councilors glance toward the doorway, where a lean, gray-haired woman in a salt-stained sea coat has been leaning against the frame with her arms folded. It is the kind of hush in which reputations are weighed, and you suspect that Pryce's has been accumulating interest in this room for years.

Quill: He keeps invoking "every sensible person" and "anyone," as though they were witnesses for the defense. You may notice that he never actually consults any of them.
? RI.8 : What is the main flaw in Pryce's claim that the Vigilant is the only way?
+ It's a false dilemma that ignores other ways to deliver the warning.
- It relies on too many statistics about the storm.
- It admits that the government steamer is out of service.
- It is supported by Dr. Saye's bulletin.
hint: Dr. Saye says he presents "two options as though they were the only two." What does she point out that he left out?
next: kade

=== kade
scene: ship-deck
cast: hero, captain, kid
The woman in the doorway is Captain Josefa Kade, master of the trading schooner Marisol, and within ten minutes you are standing on her weathered deck while she coils a line with swift, economical movements. Her schooner is elderly, immaculately maintained, and smaller than you anticipated, with a figurehead so weathered that its original identity has become a matter of speculation.

Captain: I've navigated the Combs two hundred times, always by daylight, always sober, and always paying attention. A hurricane changes the price of a mistake, not the method of avoiding one.

Sabine is already hauling a canvas bag up the gangway.

Kid: I'm coming, so please don't bother arguing. My grandmother is out there, and I can splice a telegraph cable, operate a galvanometer, and read a compass better than most of your crew.

Captain: I wasn't planning to argue. I was going to ask whether you're prone to seasickness.

Across the harbor, the Vigilant's funnel is already exhaling black smoke. Pryce, standing at her rail, raises his hat to you, a gesture that could be either a courtesy or an invitation.
> Sail with Captain Kade on the Marisol -> cable-fault
> Accept Pryce's faster tug instead -> pryce-tug

=== pryce-tug
scene: ship-deck
cast: hero, stranger:happy, quill:sad
You climb aboard the Vigilant, reasoning that steam must surely outpace sail, and Pryce welcomes you with a firm handshake and a cup of excellent coffee.

The tug, however, does not depart. Pryce explains, with impeccable courtesy, that his directors require the council's signature, that the council requires time for consultation, and that the lawyers require time for drafting. It is the following afternoon before the Vigilant finally raises steam, and evening when she anchors off Vesper Cay beneath a sky the color of a bruise.

The islanders have already observed the swell and consulted their own barometer, so they are climbing Signal Hill when you arrive. Pryce strides ashore with a lease, a fountain pen, and a promise to transport the elderly and sick, and frightened people sign whatever is placed in front of them.

Quill: The warning arrived, certainly, but it arrived with a price attached, which was always the underlying intention.
end: lose The Price of Passage

=== cable-fault
scene: lab
cast: hero, kid:thinking, captain
Before the Marisol casts off, Sabine insists on conducting one final test at the telegraph office. She connects a battery and a quivering galvanometer to the silent line and scribbles calculations down the margin of an enormous ledger.

Kid: Electrical resistance tells you how far the current travels before it escapes into the sea. The break is approximately eleven miles out, exactly where the cable crosses the shallows at the edge of the Combs.

Captain: Cables break all the time. Anchors drag across them, and storms grind them against the coral until the armor gives way.

Kid: Certainly, during storms. But it's been dead calm for an entire week, without a breath of wind, and the swell only started yesterday evening.

She contemplates the figure for a long, uncomfortable moment, then underlines it twice.
clue: Sabine's test puts the cable break eleven miles out, at the Combs, after a week of calm.
> Cast off for Vesper Cay -> ch1-end

=== ch1-end
scene: ship-deck
cast: hero, quill, kid
By noon, the Marisol is standing out of Harrowgate under full sail, heeling gently in a breeze that has finally begun to stir. The long swell lifts the bow and lowers it again, slowly and rhythmically, like an enormous creature breathing in its sleep.

Quill settles on the rail and tucks her talons beneath her feathers.

Quill: Let us take inventory. The telegraph line to Vesper Cay failed at dawn, and Dr. Saye's bulletin predicts that a hurricane will strike the island by tomorrow night. Pryce offered his steam tug only in exchange for the island's harbor, so we elected to sail with Captain Kade through the Combs instead. Finally, Sabine's measurements located the cable break in shallow water, after an entire week without appreciable wind.

Sabine studies the horizon, where the sky has acquired a faint metallic sheen. Whatever lies beyond that horizon, you are now committed to meeting it under sail.
? RL.2 : Which is the most objective summary of Chapter One?
+ With the cable dead and a hurricane coming, you sail to warn the Cay.
- Pryce, a greedy villain, deserves to be arrested for his speech.
- Dr. Saye is the most brilliant scientist in the Sorrel Islands.
- Sabine foolishly insists on joining a voyage she can't handle.
hint: An objective summary reports events without judging people. Which choice contains no opinion words?
next: ch2

# ============================================================
# CHAPTER TWO: THE COMBS
# ============================================================

=== ch2
scene: ship-deck
cast: hero, captain, kid
checkpoint
~ Chapter Two ~

By midafternoon the Combs stretch across the horizon like a ragged white seam: fifteen miles of coral ridges, migrating sandbars, and narrow channels where the sea transforms from sapphire to emerald to the color of weak tea within a single boat length.

Captain Kade stands at the wheel with her hat jammed down, watching not the compass but the water itself.

Captain: Charts of the Combs are about as reliable as a politician's smile. The sand relocates after every gale. If you want to know where the reef is today, you have to read it today.

Sabine glances at the compass, then at the captain, and you can practically hear her calculating how much faster a straight line would be.
> Ask the captain how she reads the water -> reading-water

=== reading-water
scene: ship-deck
cast: hero, captain:thinking, quill
Kade gestures over the side, where the color of the sea alternates in distinct, almost geological bands. As she speaks, you begin to perceive what she perceives: the faint corrugations where opposing currents meet, the subtle discoloration above submerged ridges, the entire surface of the sea transformed from scenery into a document.

Captain: Deep water is dark blue, practically black under cloud. Turquoise or green indicates sand, perhaps two fathoms deep. Brown means coral close enough to scrape your keel. And white means the reef is already breaking the surface, and you have already made your mistake.

She nods toward a cluster of seabirds circling energetically over a distant patch of discolored foam.

Captain: Terns congregate wherever baitfish gather over the shoals, so the birds are a chart as well. The sea records everything, depth, current, weather, all of it. Most people simply never learn the alphabet.

Quill: A captain after my own heart. Navigation, meteorology, diplomacy: everything eventually comes down to literacy.
? L.5 : What does Kade mean by saying most people "never learn the alphabet" of the sea?
+ The water's color and motion reveal facts to those trained to read it.
- Sailors should keep a written logbook of every voyage.
- The ocean is too mysterious for anyone to understand.
- Many sailors cannot read the letters on their charts.
hint: Kade is using a metaphor. What has she just explained that you can "read" in the water?
next: squall

=== squall
scene: stormy-sea
cast: hero, captain:angry, kid:scared
Without warning, the daylight dims as though someone has lowered an enormous lamp, and a dark curtain of rain advances across the water, flattening the waves before it with ominous efficiency.

Captain: Squall! Take in the topsail. Sabine, release that halyard when I give the word, not a moment before. Now!

The rain strikes like a fistful of gravel flung against the deck. The Marisol lurches, the canvas thunders overhead, and for thirty frantic seconds you haul on a slippery line beside Sabine, both of you instantaneously drenched.

Then, as abruptly as it materialized, the squall departs, trailing gray streamers toward the northwest. In the luminous aftermath, the ocean resembles hammered pewter, and the southeastern horizon has acquired a bruised, purplish density that nobody aboard chooses to mention.

Captain: That was merely the storm clearing its throat. They'll arrive thicker and closer together from now on.

Sabine wipes the salt from her eyes, studies the descending sun, and her jaw tightens with determination.
> Listen to what Sabine says next -> sabine-argument

=== sabine-argument
scene: ship-deck
cast: hero, kid:angry, captain
Kid: We could be through the Combs by midnight if we took the Northern Gap, which is printed right there on the chart. We have a compass and a lantern, so why are we creeping along like a funeral procession?

Captain: Because that chart dates from 1886, and the Gap has silted up twice since then. At night you can't distinguish the colors, and out here the colors are the only honest chart we've got.

Kid: My grandmother is seventy-three years old! She can't possibly climb a hill in total darkness with the ocean rising behind her. Every hour we spend being cautious is an hour she may not have.

Her voice fractures on the final syllable. Kade is silent for a long moment, her eyes fixed on the trembling edge of the mainsail, and when she finally speaks again, her tone is considerably gentler.

Captain: If we wreck the Marisol on the reef tonight, your grandmother receives no warning whatsoever. Patience isn't the opposite of courage, Sabine. Sometimes it's the most demanding kind.
? RL.3 : What does this argument reveal about Sabine's motivation?
+ Her fear for her grandmother makes her willing to take reckless risks.
- She wants to prove she is a better navigator than Kade.
- She is bored by the voyage and wants it to end sooner.
- She secretly distrusts Dr. Saye's forecast.
hint: Listen to why Sabine says every hour matters, and notice when her voice breaks.
next: buoy

=== buoy
scene: ship-deck
cast: quill:thinking, kid, captain
In the last of the daylight, a red iron buoy slides past the bow, rocking in the swell, its side stenciled with the words CABLE CROSSING. DO NOT ANCHOR.

Sabine leans so precariously over the rail that Quill, alarmed, seizes her collar in her beak and anchors her there. Beneath the hull, the water has paled to a translucent green, and you can distinguish the dark, serpentine line of the cable meandering across the sand toward the invisible island.

Kid: That's it, that's where the line emerges over the shallows, eleven miles out, precisely where my measurements located the break. If we hooked it with the grapnel and hauled up the end, it would take twenty minutes.

Captain Kade, at the wheel, glances apprehensively at the sky, which has deteriorated to the dull, unhealthy yellow of tarnished brass.

Captain: Twenty minutes is twenty minutes, and the weather won't wait for us. It's your decision, but make it quickly.
> Haul up the cable and look -> cable-haul
> Sail on, because there's no time -> dusk

=== cable-haul
scene: ship-deck
cast: hero, kid:surprised, captain
You and Sabine swing the grapnel overboard on a long line and drag it systematically across the sandy bottom. On the third attempt it catches, and together you haul up a dripping length of armored cable, as heavy as an anchor chain and furred with seaweed.

Its extremity is neither frayed nor crushed, as an accidental break would leave it. It has been sawn clean through, and bright copper gleams at its center where the blade bit, untouched by the green tarnish that seawater produces within only a few days.

Sabine turns it over in her hands without speaking.

You notice something else, too. On the buoy beside you, precisely at the height of a ship's rail, there is a long, fresh scrape of blue paint.

Captain: The Vigilant is painted that identical shade of blue. I've cursed it often enough alongside the coaling wharf.

Nobody articulates the obvious conclusion aloud, but it settles over the deck like an abrupt change in the weather.
clue: The cable was sawn clean through, and a fresh scrape of blue paint marked the buoy. The Vigilant is painted blue.
? RL.1 : Which detail most strongly suggests the cable was cut deliberately, and recently?
+ "It has been sawn clean through, and bright copper gleams"
- "On the third attempt it catches"
- "as heavy as an anchor chain and furred with seaweed"
- "Sabine turns it over in her hands without speaking."
hint: Which detail describes how the end was cut, and what does the untarnished copper reveal about when?
next: dusk

=== dusk
scene: stormy-sea
cast: hero, captain:thinking, kid
Night descends rapidly in these latitudes. The wind has shifted into the east and strengthened, the swell has grown steeper, and somewhere ahead in the darkness you can hear the Combs before you can see them: a long, low roar, like a distant city heard across an empty plain.

Kade illuminates the binnacle lamp and studies the chart with ferocious concentration, although you suspect she memorized every soundings figure on it decades ago.

Captain: We have two options. We heave to here, in deep water, and wait for first light. Alternatively, we attempt the Northern Gap by lantern, as Sabine prefers, and hope the sand hasn't migrated.

Sabine says nothing, but she is watching you with an intensity that makes the decision feel considerably heavier.

Captain: You've been reading this voyage as attentively as anyone aboard, so I'd value your judgment. What do you recommend?
> Shoot the Northern Gap by lantern -> gap-lose
> Heave to and wait for first light -> heave-to

=== gap-lose
scene: stormy-sea
cast: hero, captain:sad, quill:sad
The Marisol plunges toward the Northern Gap with a lantern swinging from the bowsprit, its yellow circle revealing nothing except black water and the occasional spectral flash of foam.

The keel meets sand with a long, grinding sigh. The schooner shudders, heels over, and stops, and no amount of maneuvering will dislodge her. Nobody is injured, but the Marisol is going nowhere until a high tide and a calm sea happen to coincide.

A fishing smack discovers you two days later, stranded and hoarse, after the hurricane has passed. On Vesper Cay, Sabine's grandmother interpreted her own barometer and led the islanders up Signal Hill, so everyone survived the night. However, no warning reached them in time to secure their boats, and every vessel on the island was lost.

Quill: We attempted to outrun our own judgment, and the reef, which is infinitely patient, was waiting for us.
end: lose The Teeth of the Combs

=== heave-to
scene: stormy-sea
cast: hero, captain, kid:sad
Kade positions the sails in deliberate opposition to each other so that the schooner lies quietly in the deep water, ascending and descending over the swell like a gull riding out a gale.

Hours elapse. Intermittent rain squalls hiss across the deck and continue onward into the darkness. Sabine sits wrapped in a blanket beside the companionway, refusing to go below. Periodically she consults the barometer mounted in the companionway, as though sufficient vigilance might persuade the needle to reconsider its descent.

Kid: I know you're right. I absolutely despise how often you're right.

Captain: I've despised it myself, on more sleepless nights than I could possibly count.

Around two in the morning, Sabine falls asleep sitting upright. You are about to do the same when a light materializes to the north: a steamer's masthead lantern, moving steadily along the perimeter of the reef.

As you watch, a signal lamp aboard the steamer begins blinking in long and short flashes.
> Read the signal lamp -> night-light

=== night-light
scene: stormy-sea
cast: captain:thinking, quill, kid:surprised
Kade deciphers the flashes aloud, letter by deliberate letter, translating the Morse code as fluently as ordinary speech.

Captain: F-O-L-L-O-W. S-A-F-E. C-H-A-N-N-E-L.

The steamer's lights swing gradually into the Combs, as though her pilot possessed some private knowledge of a passage straight through the reef in impenetrable darkness.

Captain: There's no safe channel through the Combs at night. Nobody knows one, and if anybody did, they certainly wouldn't advertise it to strangers with a signal lamp. I can't identify her colors in this murk, either.

Quill shifts uneasily on the rail, her feathers bristling with suspicion.

Quill: A rescuer who materializes precisely when you are exhausted and politely invites you to stop thinking. I believe I have encountered this chapter before, in several different novels.

Sabine wakes, notices the beckoning light, and is on her feet instantly, her exhaustion forgotten.

Kid: It's a way through! If we follow that steamer, we could be anchored off Vesper by dawn!
> Follow the steamer's lantern -> false-light
> Hold position until dawn -> dawn

=== false-light
scene: stormy-sea
cast: kid:scared, captain:angry, quill:sad
Kade reluctantly yields to Sabine's pleading, and the Marisol creeps after the steamer's stern light, deeper and deeper into the thunder of the reef.

Then the light ahead swerves sharply to port and, without warning, is extinguished.

A moment later you feel it unmistakably: the long, sickening scrape of sand beneath the keel. The schooner slews sideways and settles, firmly aground on a shoal, while somewhere in the darkness a steam whistle emits one short, mocking hoot.

At dawn you can see the Vigilant's blue hull far to the south, steaming comfortably toward Vesper Cay. Nobody aboard the Marisol is injured, but she will not float until the next spring tide, and you endure the hurricane huddled on a sandbar, rescued only after the seas subside.

Quill: He never needed to sink us. He merely needed to delay us, which is a considerably easier crime to deny.
end: lose The False Lantern

=== dawn
scene: ship-deck
cast: hero, captain, kid
The steamer's light wanders deeper into the reef and eventually vanishes. Kade declines to follow, and at first light the Marisol turns toward the Combs with Sabine perched on the bowsprit, interpreting the water's shifting coloration. Kade stands at the wheel with the absolute stillness of someone who has stopped thinking in words and started thinking in currents.

Kid: Green to port!

Captain: Hold her.

Kid: Brown ahead! Brown!

Captain: Starboard a spoke. Easy.

Kid: Blue! Dark blue, straight on!

Captain: Steady.

The coral slides past close enough to touch, close enough to observe tropical fish suspended in the crevices like scraps of colored paper. Then the roar diminishes behind you, the water deepens to a tranquil, inky indigo, and the treacherous Combs are finally astern.
? RL.5 : Why does the author shift to short, clipped dialogue during the reef passage?
+ To slow the pace and build tension, moment by moment
- To show that Sabine and Kade are angry at each other
- To skip quickly over an unimportant part of the voyage
- To introduce new characters into the scene
hint: Think about how it feels to read one short call after another. What is happening to the ship in each moment?
next: ch2-end

=== ch2-end
scene: ship-deck
cast: hero, quill:happy, kid:happy
Sabine clambers down from the bowsprit, salt-encrusted and exhilarated, and throws her arms around Captain Kade, who tolerates the embrace with the long-suffering expression of a cat being affectionately squeezed.

Quill fluffs her damp feathers and reflects, with characteristic thoroughness, on the long night behind you.

Quill: Let us summarize. We learned to interpret the reef by its colors, and we survived a squall. Sabine argued for speed, motivated by fear for her grandmother, but Kade deliberately chose patience. We declined to cross the Combs in darkness, even when an unidentified steamer signaled us to follow, and at dawn we navigated through by observation.

Ahead, a low green smudge emerges from the sea: palm trees, a church steeple, and a single modest hill. After the nocturnal tension of the reef, its ordinariness seems almost miraculous.

Kid: Vesper Cay. We actually, genuinely made it.
? RL.2 : Which is the most objective summary of Chapter Two?
+ Choosing patience over speed, the crew crossed the reef at dawn.
- Captain Kade was cowardly to wait instead of sailing at night.
- Sabine ruined the voyage by arguing with the captain.
- The mysterious steamer generously guided the Marisol to safety.
hint: Quill's summary lists events without praising or blaming anyone. Which answer does the same?
next: ch3

# ============================================================
# CHAPTER THREE: VESPER CAY
# ============================================================

=== ch3
scene: beach
cast: hero, keeper:thinking, kid:happy
checkpoint
~ Chapter Three ~

The Marisol anchors in the lagoon of Vesper Cay in the late morning, beneath a sky that has darkened to a sullen copper, while the swell detonates against the outer reef with a percussion you can feel in your teeth.

A small, dignified woman with white hair is waiting on the beach, leaning on a furled umbrella as though it were a walking stick. Sabine leaps into the shallows and runs to her.

Keeper: You came by sail, through the Combs, beneath that sky? I raised you to have more sense than that, and I have never been so grateful to be disobeyed.

This is Celestine Duval. She kisses her granddaughter, then gazes past you toward the lagoon, and her expression hardens into something considerably less affectionate.

The Vigilant is already riding at anchor there, her blue hull gleaming. On the beach, Augustin Pryce is addressing an anxious crowd of islanders. Even from the waterline, you can recognize the cadence of his voice, that warm, reasonable music, drifting across the sand.
> Listen to Pryce's speech -> pryce-island

=== pryce-island
scene: beach
cast: hero, stranger:happy, keeper:angry
Pryce stands on an overturned dory, a sheaf of documents in one hand.

Stranger: I come to you as a partner, not as a stranger. A hurricane is bearing down upon this island, and my company is prepared to extend its protection to every one of you. The Vigilant will transport your families to Harrowgate in comfort and security. In return, we request only a small formality: your signatures on a harbor partnership that will bring prosperity to Vesper for generations.

He smiles benevolently at a young mother holding an infant. The islanders shift uneasily, glancing from the lagoon's unnaturally glassy surface to the copper sky and back again to the persuasive stranger on the dory.

Stranger: Consider the children. Surely their safety is worth a single, inexpensive signature.

Celestine Duval turns toward you and speaks in a low voice.

Keeper: Partnership. Protection. Formality. Prosperity. That man could sell rainwater to a drowning sailor.
? RL.4 : What is the cumulative effect of "partner," "protection," and "prosperity"?
+ They make a demand for the harbor sound generous and harmless.
- They prove that Pryce sincerely cares about the islanders.
- They give precise scientific details about the hurricane.
- They show that Pryce is nervous about speaking in public.
hint: Celestine lists his words back to him. What is Pryce actually asking for, and how do those words dress it up?
next: celestine

=== celestine
scene: village
cast: hero, keeper, quill
Celestine leads you up a sandy lane to a whitewashed cottage, where a battered brass barometer hangs beside a shelf of ledgers filled with her meticulous handwriting. These ledgers, you realize, constitute the island's collective memory: decades of pressures, tides, harvests, births, and storms, recorded with the patient conviction that facts outlast opinions.

Keeper: I don't trust Mr. Pryce. To be candid, I'm not certain I trust you either. In 1871 a company representative sailed in two days before the great storm, carrying warnings and a pen. He evacuated forty people and departed with the deeds to half this island. The storm was genuine, and so was the theft.

She taps the barometer, and the needle trembles lower.

Keeper: So when strangers arrive bearing terrible news and excellent intentions, I prefer to discover what else they happen to be carrying.

Quill: That strikes me as an eminently reasonable position, and a historically educated one.
? RL.6 : Why does Celestine distrust both Pryce and the newcomers at first?
+ In 1871, a company man used a storm warning to take islanders' land.
- She believes the barometer is broken and no storm is coming.
- She is angry that Sabine left the island to work in Harrowgate.
- She has never met anyone from Harrowgate before.
hint: Celestine tells a story about what happened in 1871. What did the company man carry away besides people?
next: your-turn

=== your-turn
scene: village
cast: hero, keeper:thinking, kid
Outside, islanders have begun congregating around the cottage, waiting to hear what Celestine will decide. Many are still clutching Pryce's documents.

Sabine squeezes your arm.

Kid: They'll listen to her, and she'll listen to you, if you give her a reason that isn't simply fear. Pryce has already tried intimidation.

You consider everything you have learned since yesterday's dawn: the declining needles on two separate barometers, Dr. Saye's bulletin, the swell, the cirrus, and Signal Hill, the solitary place on the island that remained dry in 1871. You also consider what you are deliberately not selling.

Celestine folds her hands and waits. Her silence is not hostile, merely exacting, the silence of an examiner who intends to grade your reasoning rather than your enthusiasm.
? W.1 : Which argument would make the strongest, most honest case to Celestine?
+ Both barometers are falling fast; Signal Hill stayed dry in 1871.
- Pryce is a liar, so anything he says must be wrong.
- Everyone in Harrowgate agrees with us, so you should too.
- If you don't act now, everyone on this island will die.
hint: A strong argument rests on a clear claim backed by evidence, without insults or panic. Which answer uses facts Celestine can check?
next: theme

=== theme
scene: village
cast: hero, keeper:happy, kid
You present your case plainly and methodically: what the instruments indicate, what the swell and the sky reveal, where the elevated ground is located, and the essential fact that nobody needs to sign anything in order to climb it.

Celestine listens without interrupting, her expression unreadable. Then she steps outside, raises her voice, and addresses the assembled crowd for less than a minute, and one by one, the islanders allow Pryce's documents to drop into the wet sand.

Keeper: The storm is coming no matter who delivers the news. The only real question was whether we'd have to pay for the truth. We don't.

Sabine laughs unsteadily, overwhelmed by relief, and wipes her face with a salt-stiffened sleeve.

Kid: Real help doesn't arrive with a contract attached to it.
? RL.2 : Which theme does the story develop most fully?
+ Honest, evidence-based help differs from aid that exploits fear.
- In an emergency, it is wise to accept any offer of help.
- Older people are always more trustworthy than younger people.
- Nature is too powerful for human beings to resist.
hint: Compare how Pryce tried to persuade the islanders with how you did. What do Celestine and Sabine say about paying for help?
next: decide

=== decide
scene: village
cast: hero, captain, keeper
Captain Kade strides up the lane, rain streaming from her hat brim, as the first outer band of the hurricane darkens the sky.

Captain: You have approximately six hours before the surge arrives. Decide how you intend to spend them.

Celestine calculates rapidly, enumerating the island's limited resources aloud. Signal Hill has caves in its limestone flank, cool and dry and large enough for everyone if people squeeze together. But eleven residents are too ill or frail to manage the climb, and the Marisol could carry them back toward Harrowgate ahead of the storm, provided she departs within the hour.

Through the window you can see the Vigilant swinging at her anchor, and Pryce being rowed back aboard. The lagoon around the tug has begun to churn with a restless, irregular chop, as though the sea itself were growing impatient with human deliberation.
> Lead everyone to the caves on Signal Hill -> caves
> Sail the frail and sick out on the Marisol -> ferry
> Row out and take a look at the Vigilant -> tug-search

=== caves
scene: cave
cast: hero, keeper, kid
You spend the afternoon transporting blankets, water jars, lanterns, and frail neighbors up the slope of Signal Hill, while Kade and her crew drag the fishing boats into the mangrove creek and lash them securely to the roots.

By nightfall, three hundred people are crowded into the limestone caverns, where the walls drip and exhausted children fall asleep in heaps. Celestine sits beside the entrance with her ledger open across her knees, recording the barometer by lamplight.

Keeper: Twenty-eight point four, and still declining. In sixty years of observations, I've never recorded a number that low.

Outside, the wind escalates from a howl to a shriek, and you hear the sea come ashore, not as waves but as a slow, grinding inundation, climbing the hillside toward the cave mouth.
> Wait out the night -> caves-end

=== caves-end
scene: beach
cast: hero, keeper:happy, quill:happy
At dawn, the floodwater has halted twelve feet below the cave mouth, leaving a tidemark of debris across the hillside. You emerge into a rinsed, astonished landscape: palms snapped like matchsticks, the church roof vanished, the beach rearranged into unfamiliar contours.

Nevertheless, every inhabitant of Vesper Cay walks down the hillside alive, and the fishing fleet rides undamaged in the sheltering mangroves.

Celestine opens her ledger to a fresh page and records the date, the lowest pressure, and the high-water mark. Then, after a contemplative pause, she adds your name in her meticulous handwriting.

Keeper: Every storm in this book has a name. This one will have yours beside it.

Quill: For once in my distinguished career, I shall refrain from correcting anyone's punctuation.
end: win The Hill Holds

=== ferry
scene: stormy-sea
cast: hero, captain, kid:scared
The eleven passengers are carried aboard the Marisol swaddled in blankets: an elderly fisherman with a weak heart, a mother with newborn twins, a boy with a fractured leg. Celestine remains behind to supervise the evacuation of everyone else to the caves.

Kade sets every scrap of canvas she dares and runs north before the intensifying wind, retracing your route across the Combs while the daylight still permits navigation by color. Sabine stands on the bowsprit again, calling colors through the rain, her voice hoarse but steady. Behind you, Vesper Cay dwindles to a gray smear and then disappears entirely into the advancing wall of weather.

Kid: Green! Green to port! Blue ahead!

Captain: Good. Keep reading.

The hurricane's outer bands lash the schooner throughout the afternoon, but the Combs open before you like a familiar, well-annotated book, and by nightfall the gas lamps of Harrowgate are glimmering through the spray.
> Bring the passengers ashore -> ferry-end

=== ferry-end
scene: city-street
cast: hero, scientist:happy, captain
Dr. Saye is waiting on the quay with a physician, two ambulance wagons, and an umbrella the gale has turned inside out. Eleven passengers disembark, and all eleven are admitted safely to the hospital.

Several days later, a telegram arrives from Vesper Cay, transmitted along a hastily repaired line: ALL SAFE ON SIGNAL HILL. CHURCH ROOF GONE. BOATS SOUND. COME BACK AND EAT, BOTH OF YOU. CELESTINE.

Captain Kade reads it twice, her weathered face uncharacteristically emotional, then tucks it carefully inside her coat.

Captain: Two hundred and two crossings of the Combs, and that final one counted double.

Scientist: The forecast was mine, but the interpretation was yours. I'm entering both your names in the observatory's permanent record.
end: win Reading the Water

=== tug-search
scene: ship-deck
cast: hero, kid:thinking, quill
You and Sabine borrow a dinghy and row across the lagoon, impersonating curious islanders. The Vigilant's crew have retreated below to escape the rain, and nobody prevents you from climbing the boarding ladder. Your pulse is hammering so violently that you are half convinced the crew below can hear it through the planking.

On the afterdeck, partially concealed beneath a tarpaulin, lie a heavy grappling hook still trailing seaweed, a coil of armored telegraph cable, and a long-handled industrial hacksaw. Copper filings glitter between the saw's teeth.

Sabine lifts the end of the cable. It has been sawn clean through, and the copper core is bright.

Kid: That's the Vesper line; I'd recognize that armor anywhere. He severed it deliberately, so the island couldn't summon assistance unless he was the one delivering it.

Quill: And then he arrived, with remarkable convenience, to sell them the very assistance he had prevented.
> Take the evidence to the islanders -> tug-proof

=== tug-proof
scene: beach
cast: hero, stranger:angry, keeper
The Vigilant's first mate catches you on the ladder, but after one look at the hacksaw in Sabine's hand, he chooses to accompany you rather than raise an alarm. You haul the coil of cable onto the beach and deposit the saw at Celestine's feet while the mate, pale and shaken, insists that the crew genuinely believed they were dredging for abandoned salvage.

Pryce, rowed ashore to investigate the commotion, surveys the evidence and attempts an unconvincing smile.

Stranger: Pure coincidence, I assure you. Any reputable salvage company would carry identical equipment.

Keeper: Any salvage company would not saw through our cable during a flat calm and then appear with a contract the following morning.

The crowd falls utterly silent, and the only sound is the relentless detonation of surf against the outer reef. Then the Vigilant's mate removes his cap and turns toward Celestine, and Pryce's composure finally fractures. For the first time since you met him, his voice loses its velvet.

Stranger: You can't possibly do this. That vessel is the legal property of my company!
> Hear what the mate decides -> secret-end

=== secret-end
scene: beach
cast: hero, keeper:happy, quill:happy
The mate announces that the Vigilant will transport every frail and sick islander to Harrowgate without charge, and that her crew will testify to what they discovered on the afterdeck before any magistrate in the islands. Pryce returns to Harrowgate in the tug's coal bunker, under guard and in an extremely disagreeable mood.

The remainder of the island rides out the hurricane in the caves of Signal Hill, and every person walks down the slope alive at dawn.

Weeks later, the Consolidated Steam and Salvage Company quietly withdraws its harbor lease. Celestine frames the sawn cable end and hangs it in the church, which by then has a new roof.

Keeper: Evidence makes a sturdier shelter than promises.

Quill: I could not have phrased it more elegantly myself, and believe me, I have attempted it.
end: secret The Clean Cut
