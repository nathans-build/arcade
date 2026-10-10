title: The Yellow Rows
author: SpiderBen10's Arcade
genre: space
band: 9-12
cover: planet-surface
blurb: Half of the only greenhouse on Mars is turning yellow. The commander says burn it. The evidence says something else.
start: g-shelf

# ============================================================
# CHAPTER ONE: THE WILTING
# ============================================================

=== g-shelf
scene: library
cast: hero, quill:thinking
checkpoint
~ Chapter One ~

Quill drags a slim book across the reading table with both talons, and its cover is the dusty orange of a desert at sunset, with a single green leaf pressed between the last two pages, so flat and so dry that it crackles faintly when she lifts the cover.

Quill: This is the story of Halcyon Base, a research station constructed on the floor of an ancient crater on Mars, where six people live beneath a sky the color of weak tea and grow most of their own food in a glass dome they affectionately call the Glasshouse, since the nearest grocery store is roughly two hundred million kilometers away.

She turns to a page covered in meticulous columns of numbers, with one row circled in red ink.

Quill: Half of the Glasshouse has begun to turn yellow, and the commander believes he already knows why, so he has decided what to do about it. Scientists, however, have a habit I particularly admire: they record what they observe before they decide what it means, and we are going to discover whether anyone on Halcyon Base has been doing exactly that.
> Step onto the red plain -> arrive

=== arrive
scene: planet-surface
cast: quill, astronaut
You land on a plain of rust-colored gravel beneath a pale, butterscotch sky, where low hills curve along the horizon like the rim of an enormous bowl, which is precisely what they are, and a small, cold sun hangs above them. Ahead of you, a cluster of white modules lies half-buried in red soil for radiation shielding, and beside the modules rises a glittering dome of glass panels, vividly green on one side and an unhealthy shade of mustard on the other.

A figure in a white pressure suit stomps toward you across the gravel, raising little puffs of powdery dust with every step, and through the gold visor you can make out a square jaw and a pair of exhausted gray eyes. This is Commander Teodor Hale, who has led Halcyon Base for four hundred and twenty-four sols, a sol being one Martian day, approximately forty minutes longer than a day on Earth.

Astronaut: You must be the advisers Mission Control promised me, which is good news, because you can help me accomplish what has to be done before the storm arrives.

He points a gloved finger toward the southern horizon, where a smudge of brownish haze is smeared across the sky like a thumbprint on a window.

Astronaut: That is a regional dust storm, and in approximately two sols it will be sitting directly on top of us, at which point our solar panels will lose most of their power for a week or longer. I want this crisis settled before the lights go dim, so come inside, and I will show you the plan.
> Follow the commander into the base -> command

=== command
scene: space-bridge
cast: quill, astronaut:thinking
clue: The new seed crates were unpacked beside Row 9 on Sol 415, and the first yellow leaves appeared in Row 9 on Sol 418.
The command module is cramped, warm and faintly fragrant with reheated coffee, and screens cover every wall, displaying wind speeds, battery levels, oxygen readings and a detailed map of the Glasshouse divided into sixteen numbered rows of crops.

Commander Hale peels off his helmet and taps the map, where rows nine through sixteen glow an alarming yellow.

Astronaut: Here are the facts as I understand them. On Sol 415, we unpacked three crates of fresh seed that arrived on the most recent supply lander, and we staged them on the floor of the Glasshouse beside Row 9 before transferring them to the seed vault the following morning. Three sols later, on Sol 418, Dr. Varga discovered the first yellow leaves, and she discovered them in Row 9, after which the yellowing spread steadily to every row from nine to sixteen.

He folds his arms across his chest with the air of a man who has rehearsed this explanation many times.

Astronaut: Something came out of those crates, whether a fungus, a spore or some other blight that survived the journey from Earth. On Sol 422, I ordered the Blight Protocol from our mission handbook, which means that on Sol 426, before the storm, we incinerate rows nine through sixteen, sterilize the soil trays, and begin again from uncontaminated seed.

Quill: And what does burning half of the crop cost you?

Astronaut: Our stored rations will last one hundred and forty sols, but the next supply window does not open for twenty-six months, because Earth and Mars only align for an affordable journey approximately once every two years. The Glasshouse is supposed to provide sixty percent of our calories, and without it we are living on borrowed time, which is precisely why I cannot permit a blight to spread into rows one through eight.
> Go to the Glasshouse dome -> dome
> Inspect the seed crates in the vault -> vault

=== vault
scene: cryo-bay
cast: quill, robot:happy
clue: Every seed packet in the crates was still factory-sealed, and FURROW's microscope found no fungal spores.
The seed vault is a chilly module whose walls glitter with frost, and its racks of foil packets are maintained at minus eighteen degrees, which is cold enough to keep seeds alive for decades. A boxy green robot with soil-stained treads and a trowel in place of one hand rolls out from between two racks to greet you with enthusiasm.

Robot: Welcome to the vault! I am FURROW, the Field Utility Robot for Rows, Orchards and Water, and although nobody has ever planted an orchard on Mars, I remain extremely optimistic.

You ask FURROW about the crates from the supply lander, and the robot retrieves three plastic bins from a shelf with a cheerful mechanical whirr.

Robot: Every packet inside these crates is still factory-sealed. I swabbed the exterior of each crate on Sol 416 and examined the swabs under my microscope at four hundred times magnification, and I identified dust, two human eyelashes and a fragment of a granola bar, but I did not identify a single fungal spore.

Quill: That is a valuable result, although an absence of evidence is not quite the same thing as evidence of absence, so a careful investigator keeps that observation in her pocket and continues searching for more.
> Go on to the Glasshouse dome -> dome

=== dome
scene: lab
cast: quill, scientist:thinking, robot
clue: Rows 7 and 8, nearest the crate staging spot, are green; the yellowing starts at leaf edges, on older leaves, with no spots or fuzz.
The Glasshouse is warm and humid, and the air smells of damp soil and green leaves. Long racks of potatoes, dwarf wheat, soybeans and lettuce stretch beneath rows of violet grow lights, while water trickles through transparent plastic tubes into every tray, and FURROW trundles along behind you, carefully irrigating a tray of basil.

Dr. Priya Varga, the station's plant biologist, is kneeling beside Row 9 with a magnifying glass and a notebook, with soil on her sleeves and a pencil tucked behind her ear, and she does not look up until she has finished writing her sentence.

Scientist: The commander believes the crates delivered a blight, and I understand his reasoning, but the plants are telling me a different story, and I have learned to listen to them. Look closely at this one.

She lifts a potato leaf delicately between two fingers, and you can see that the yellow begins at the very rim of the leaf and creeps inward toward the green center, while the margins are crisp and brown, as though someone had singed them with a match.

Scientist: The yellowing starts at the edges of the leaves, and it appears on the oldest, lowest leaves first, while the young leaves at the top remain green the longest. There are no dark spots, no rings, no fuzzy growth and no rot on the stems. And there is one more observation that troubles me, because the crates were stacked right there, on the floor between Row 8 and Row 9. Rows seven and eight, which stood closest to the crates, are perfectly green.
? RL.1 : Which quotation best challenges the commander's theory?
+ "Rows seven and eight, which stood closest to the crates..."
- "...with soil on her sleeves and a pencil tucked behind her ear..."
- "The Glasshouse is warm and humid, and the air smells of damp soil."
- "Long racks of potatoes, dwarf wheat, soybeans and lettuce..."
hint: If a blight leapt out of the crates, which plants should have caught it first? Reread Dr. Varga's final sentence.
next: tamsin

=== tamsin
scene: lab
cast: quill, kid:thinking, scientist
clue: Tank A waters Rows 1 to 8. Tank B waters Rows 9 to 16.
A teenager with a shaved head and paint-spattered overalls ducks beneath a water pipe and drops a battered notebook onto the potting bench. Tamsin Achebe is sixteen years old, the youngest person on Mars, and she serves as the station's student intern, which mostly means that she performs every job that nobody else has time for.

Kid: Dr. Varga keeps saying "chlorosis," and everybody keeps nodding as though they understand what it means, so I looked it up, and then I made a map.

She opens the notebook to a hand-drawn diagram of the Glasshouse, in which every row has been shaded with colored pencil, either green or yellow, and two thick blue lines meander across the page from the back wall.

Kid: Chlorosis is when a leaf loses its chlorophyll, the green pigment that plants use to capture light for photosynthesis, so the leaf fades to a pale yellow even though it is still alive. But look carefully at the blue lines, because the Glasshouse has two separate water tanks. Tank A irrigates rows one through eight, Tank B irrigates rows nine through sixteen, and every single yellow row is drinking from Tank B.

Dr. Varga leans over the notebook, and for a long moment she says nothing whatsoever.

Scientist: I have been staring at leaves for an entire week, and you have been staring at pipes, which has produced a far better map than mine, Tamsin.
? L.4 : Using context clues, what does "chlorosis" mean in this story?
+ Yellowing of a leaf because it has lost its green chlorophyll
- A fungus that grows on leaves and spreads by spores
- The process a plant uses to drink water through its roots
- A disease that turns plant stems soft and brown
hint: Tamsin defines the word herself. Find the sentence that begins "Chlorosis is when a leaf..."
next: dome-choice

=== dome-choice
scene: lab
cast: quill, kid, robot
Tamsin taps the two blue lines on her map, one after the other, and then she shrugs uncertainly, as if the pattern might turn out to be a coincidence after all.

Kid: It could simply be bad luck, if the blight happens to prefer the back half of the dome. However, Dr. Varga keeps an old plant-disease field guide on the shelf, and FURROW monitors everything that happens to the water, so between the two of them, somebody ought to be able to tell us.

FURROW's sensor lights blink brightly at the sound of its name, and Quill ruffles her feathers thoughtfully.

Quill: A pattern is not yet an explanation, but it is an excellent place to begin asking questions, provided that you are willing to hear answers you did not expect.
> Read the plant-disease field guide -> guide
> Ask FURROW what has changed lately -> furrow-talk

=== guide
scene: lab
cast: quill:thinking, scientist
Dr. Varga pulls a thick, water-stained volume from the shelf and opens it to a page marked with a strip of masking tape, and Quill perches on the edge of the bench to read the entry aloud.

"FUNGAL BLIGHT. Begins as small dark spots, often surrounded by a pale yellow ring. Spots enlarge and merge, and white or gray fuzzy growth may appear on the underside of the leaf in humid conditions. Blight spreads from plant to plant through spores carried by air, water splash and contact, so infections usually form patches that expand outward from a single starting point."

"CHEMICAL OR SALT TOXICITY. Yellowing begins at the leaf margins and tips and progresses inward, frequently with brown, scorched edges. Older, lower leaves are affected first, because they have been absorbing the substance the longest. No spots or fuzzy growth are present. Damage follows the source of the substance, such as a particular water supply or soil batch, rather than spreading from plant to plant."

Quill closes one eye and studies the yellow rows through the glass with the other.

Quill: A field guide is a kind of argument written in advance, because it specifies which observations would count as evidence for each explanation, so that nobody can quietly rewrite the rules after seeing the results.
? RI.1 : Which detail from the guide best matches what Dr. Varga saw?
+ "Older, lower leaves are affected first..."
- "Begins as small dark spots, often surrounded by a pale yellow ring."
- "...white or gray fuzzy growth may appear on the underside..."
- "...patches that expand outward from a single starting point."
hint: Dr. Varga said the yellowing "appears on the oldest, lowest leaves first." Which entry says the same?
next: g-ch1-sum

=== furrow-talk
scene: space-corridor
cast: quill, robot:thinking
FURROW leads you out of the Glasshouse and into a narrow corridor lined with humming pipes, where it parks in front of a panel labeled WATER RECOVERY and begins to blink contemplatively.

Robot: The water at Halcyon Base comes from ice mixed into the soil beneath us. My cousin the Excavator digs it up, the Oven bakes it, and the resulting steam is collected and condensed into liquid water, which is not yet suitable for plants. Therefore it passes through a coarse filter and then a polishing loop, which scrubs out the dissolved salts that accompany Martian soil, and I am extremely fond of the polishing loop, because it is the most hardworking machine on the base, apart from me.

You ask whether anything about the water has changed recently, and the robot's lights flicker through several colors before settling on a cautious amber.

Robot: Nothing has changed that was not supposed to change. I have followed every instruction exactly as written, and I have followed them so exactly that nobody has needed to think about them at all.

Quill swivels her head toward you very slowly.

Quill: That is a curious answer, and I wonder whether you noticed that FURROW has not actually answered your question.
? RL.4 : What does FURROW's phrase "followed every instruction exactly" suggest?
+ A change may have happened because of instructions nobody rechecked.
- FURROW is lying to protect itself from being switched off.
- The water system has never changed since the base was built.
- FURROW does not understand what a polishing loop does.
hint: FURROW says it followed instructions "so exactly that nobody has needed to think about them." What might that hide?
next: g-ch1-sum

=== g-ch1-sum
scene: library
cast: hero, quill:thinking
The pages flutter, and for a moment you are back at the reading table in the Arcade Library, with Quill tapping a talon on the edge of the book.

Outside the library window, an ordinary evening is settling over an ordinary street, and it is strange to remember that somewhere above it, beyond the clouds, a real red planet is turning slowly in the dark.

Quill: Before we turn the page, let us state plainly what we know, without decorating it with opinions, because a good summary resembles a good field note: it records what happened and postpones the arguing until later.
? RL.2 : Which is the most objective summary of Chapter One?
+ Rows 9-16 are yellow; crates are blamed, but the pattern fits Tank B.
- A reckless commander wants to burn the crop for no reason at all.
- Tamsin has proved beyond doubt that the crates are completely safe.
- A fungal blight from Earth has spread through half of the dome.
hint: An objective summary takes no sides and claims nothing beyond the evidence. Which one reports both the theory and the pattern?
next: g-ch2

# ============================================================
# CHAPTER TWO: THE LOG
# ============================================================

=== g-ch2
scene: space-corridor
cast: quill, kid:scared
checkpoint
~ Chapter Two ~

It is evening on Sol 424, and the base has dimmed its lights to conserve power. Through the small round window at the end of the corridor, you can see that the haze on the southern horizon has thickened into a brown wall, and the setting sun glows an eerie blue, because Martian dust scatters red light away and allows the blue light through.

Tamsin sits on the floor with her back against a pipe, hugging her notebook against her chest.

Kid: The commander is a good person, honestly, because he came back for me during a dust devil in my second week here, when I got lost near the edge of the crater. But when he decides something, he does not like to undecide it, and he has already scheduled the burn for the day after tomorrow.

Quill: Then we must hand him something stronger than a hunch. People rarely change their minds because someone informs them that they are wrong; they change their minds because the evidence leaves them no comfortable place to stand.

Tamsin wipes her eyes with the back of her hand and climbs to her feet.

Kid: FURROW keeps a maintenance log of absolutely everything it does, every valve and every pump, recorded to the minute, so if something changed in the water, it will be in there.
> Find Dr. Varga in the lab first -> hypotheses
> Ask FURROW to open its maintenance log -> maint-log

=== hypotheses
scene: lab
cast: quill, scientist:thinking, kid
Dr. Varga has covered the whiteboard in the lab with two columns of handwriting, and she is underlining the headings when you arrive, so forcefully that the marker squeaks.

Scientist: Before we look at any more data, I want to write down what each explanation predicts, because otherwise we will simply notice whatever agrees with us. That temptation has a name, confirmation bias, and it has ruined more experiments than any broken instrument.

The left column reads: HYPOTHESIS ONE, BLIGHT. Predicts fungal spores on leaves; spots or fuzz; patches spreading from plant to plant, beginning near the crates. The right column reads: HYPOTHESIS TWO, SOMETHING IN THE WATER. Predicts a measurable substance in the water feeding the yellow rows; damage following the pipes, not the crates; no fungal growth when leaves are cultured.

Kid: So we do not need to prove the commander wrong. We only need to check which list of predictions comes true.

Scientist: Exactly, and if the blight predictions come true instead, then I will help him light the fire myself.
? RI.5 : Why does Dr. Varga list each hypothesis's predictions before testing?
+ So the results are judged fairly instead of to fit what she believes.
- So she can prove the commander wrong as quickly as possible.
- So that the robot will know which pipes to repair first.
- So that she will not need to run any more tests at all.
hint: She says that "otherwise we will simply notice whatever agrees with us." What is she trying to prevent?
next: maint-log

=== maint-log
scene: space-bridge
cast: quill, robot, kid
clue: On Sol 413, under Power Plan Amber, FURROW switched the Tank B polishing loop to bypass to save power.
FURROW connects itself to the largest screen in the command module with a coiled cable, and its maintenance log scrolls upward in tidy green letters while Tamsin reads each entry aloud.

SOL 412: Dust storm forecast received from orbit; Commander Hale orders POWER PLAN AMBER, which reduces all non-essential electrical loads by twenty percent before the storm, and Amber list, item 6, reads, "Water polishing, Tank B: switch to bypass, since Tank A is already full and polishing is not required."

SOL 413: Tank B polishing loop switched to BYPASS as ordered, so that water now passes through the coarse filter only, saving 1.2 kilowatts of power.

SOL 415: Three seed crates from the supply lander staged on the Glasshouse floor beside Row 9, then transferred to the seed vault on Sol 416.

SOL 418: Dr. Varga logs the first leaf yellowing, Row 9.

SOL 422: Commander Hale orders the Blight Protocol, with the burn scheduled for Sol 426.

Tamsin reads the screen a second time, and her mouth falls slowly open.

Kid: FURROW, why did you not tell anybody about Tank B?

Robot: Nobody asked me, and it was on the list, so I assumed that anything on the list had already been thought about by somebody.
? RI.1 : Which log entry best links Tank B to the yellow rows?
+ "Tank B polishing loop switched to BYPASS as ordered..."
- "Dust storm forecast received from orbit..."
- "Three seed crates from the supply lander staged..."
- "Dr. Varga logs the first leaf yellowing, Row 9."
hint: Tamsin's map showed that Tank B irrigates the yellow rows. Which entry describes a change to Tank B's water?
next: hale-confront

=== hale-confront
scene: space-bridge
cast: quill, astronaut:angry, kid:scared
The door hisses open, and Commander Hale steps into the command module, still holding a mug of coffee, and reads the screen over your shoulders while his jaw tightens visibly.

Astronaut: I know perfectly well what the polishing loop does. It is a final cleaning step, and the coarse filter still catches the grit. Plants on Earth have been drinking slightly salty water for ten thousand years, and they did not all drop dead.

He sets the mug down hard enough that coffee slops over the rim and onto the console.

Astronaut: The Blight Protocol was written by people who devoted their entire careers to studying crop disease, and it exists so that an exhausted commander in a crisis does not have to invent a new plan from scratch. I have six lives in my hands, and I would rather lose half a crop to a fire than lose the whole crop because I allowed a fungus to spread while we argued about plumbing.

Tamsin opens her mouth and closes it again, and Quill speaks quietly, so that only you can hear her.

Quill: Listen carefully to what he fears most, because he is neither a villain nor a fool; he is frightened of one particular kind of mistake. Notice, too, whose name appears at the top of Power Plan Amber.
? RL.6 : What best explains the commander's point of view in this scene?
+ He fears a spreading blight more than a fire, and trusts the handbook.
- He does not care about the crop and just wants to finish his mission.
- He knows Tank B is poisoned but wants to hide it from Mission Control.
- He believes that Tamsin damaged the polishing loop on purpose.
hint: Reread his reasons: "I would rather lose half a crop to a fire than lose the whole crop..." What is he most afraid of?
next: burn-choice

=== burn-choice
scene: space-bridge
cast: quill, astronaut, scientist
Dr. Varga arrives, breathless, carrying a soil sample in a plastic bag, just as the commander slides a tablet across the console toward you. On the screen is the Blight Protocol authorization, with his signature already at the bottom and an empty line beside it labeled ADVISER.

Astronaut: Mission Control requires an outside opinion before I burn anything, which is the reason you are here. Sign this, and we proceed on Sol 426, before the storm, or else give me a reason, a genuine reason and not a feeling, why I should wait.

Scientist: Our laboratory has a mass spectrometer that can identify exactly what is dissolved in each tank. Give us one sol, Commander, and we will know instead of guessing.

The commander gazes at the brown wall of dust in the window for a long moment, and then he looks directly at you.
> Sign the Blight Protocol order -> burn
> Ask for one sol to test both tanks -> test

=== burn
scene: lab
cast: quill:sad, astronaut:sad, kid:sad
You sign the order, and on Sol 426 FURROW pulls rows nine through sixteen out by the roots, so that the plants can be carried to the airlock and incinerated. The soil trays are steamed clean, and Dr. Varga plants fresh seed from the sealed packets in the vault.

The storm arrives, and the base hunkers down beneath a sky the color of cocoa. On Sol 437, Tamsin discovers the first new seedlings in Row 9 turning yellow at the edges, oldest leaves first, exactly as before, because nobody ever switched the polishing loop back on, and Tank B is still feeding every tray in the back half of the dome.

With half its greenhouse destroyed and its stored rations shrinking, Mission Control calculates the numbers and concludes that the crew cannot safely survive until the next supply window, so the mission is scrubbed. Six people fold their lives into small soft bags, climb into the ascent vehicle, and leave the Glasshouse standing empty on the red plain, with its lights switched off.

Quill: We dealt with the fear instead of the cause. Fire felt decisive, but a decision is only as good as the question it answers, and this one answered the wrong question entirely.
end: lose Ashes Under Glass

=== test
scene: lab
cast: quill, scientist:thinking, astronaut
clue: Tank B holds 9.4 milligrams of perchlorate per liter; Tank A holds 0.02. The plant-safe limit is 0.5.
The commander grants you one sol, and Dr. Varga uses every minute of it, drawing water from both tanks and from the drip lines in Row 9 and Row 4, then feeding each sample into the mass spectrometer, which hums and clicks for hours like a patient clockmaker. When the results finally appear, she reads them aloud as a formal report.

"HALCYON BASE LABORATORY REPORT, SOL 425. Samples were tested for dissolved salts, including perchlorate, a salt that is abundant in Martian soil and is known to be toxic to plants and people. Tank A contained 0.02 milligrams of perchlorate per liter, while Tank B contained 9.4 milligrams per liter; the Row 4 drip line measured 0.02, and the Row 9 drip line measured 9.3. The recommended plant-safe limit is 0.5 milligrams per liter. Leaf samples from Row 9 contained high concentrations of perchlorate, and leaf samples from Row 9 that were cultured for fungus over twenty hours produced no growth."

Scientist: Perchlorate is everywhere in Martian soil, about half a percent by weight in some locations, and it travels along with the ice we excavate. The polishing loop is the stage that removes it, so when the loop is switched off, Tank B begins serving the plants a slow poison.

The commander stares at the numbers for a long time, and then he picks up his mug, discovers that it is empty, and sets it down again without a word.
? RI.8 : Which claim does the report support most strongly?
+ Tank B's water has a toxic level of perchlorate; Tank A's does not.
- The seed crates definitely carried a fungus that attacks potatoes.
- Every plant in the Glasshouse will die within a few sols.
- Perchlorate is completely harmless to plants in small amounts.
hint: Compare the numbers with the "plant-safe limit." Which tank is far above it, and which is below?
next: after-test

=== after-test
scene: lab
cast: quill, kid:happy, robot
Tamsin whoops so loudly that FURROW drops its trowel, and then she remembers that half of the crop is still yellow and lowers her arms, slightly embarrassed.

Kid: We should arrange the whole story in order before we present it to everyone, because when the commander hears it all at once, it will be much harder to argue with.

Meanwhile, FURROW has rolled to the very back of the Glasshouse, where a long wooden box sits against the wall beside Row 16. It is filled with dark, crumbly compost, and growing out of the compost is a tangle of brilliant green bean vines, untouched by a single fleck of yellow.

Robot: Excuse me, but nobody has asked me about Bed Zero either.

Quill tilts her head at the vines, then at the drip line feeding them, and her eyes grow very round indeed.
> Ask FURROW about the green bed -> bed-zero
> Rebuild the timeline with Tamsin -> timeline

=== bed-zero
scene: lab
cast: quill:surprised, robot:happy, scientist
FURROW explains, with obvious pride, that Bed Zero is its compost box, where every scrap of peel, stem and root from the kitchen is broken down into soil by microorganisms, and that the starter for the compost arrived from Earth in a sealed canister: a single scoop of rich garden soil teeming with bacteria.

Robot: Bed Zero is irrigated from the Row 16 drip line, which means it drinks Tank B water, exactly like the yellow rows, and yet, as you can observe, my beans are magnificent.

Dr. Varga crouches beside the box, frowning, and then her eyebrows shoot upward.

Scientist: There are bacteria on Earth that can breathe perchlorate. Instead of using oxygen gas, they extract the oxygen from the perchlorate and leave behind ordinary chloride, the same harmless salt that is dissolved in seawater. If one of those species traveled here in FURROW's starter soil, it may be cleaning the poison out of the water before the beans can absorb it.
> Test a sample of Bed Zero -> secret-lab
> Rebuild the timeline with Tamsin -> timeline

=== secret-lab
scene: lab
cast: quill:happy, scientist:happy, robot
Dr. Varga runs the drainage water from Bed Zero through the mass spectrometer, and then she runs it a second time, because she does not entirely trust the first result.

"BED ZERO DRAINAGE, SOL 425. Water entering the bed contained 9.3 milligrams of perchlorate per liter, while water leaving the bed contained only 0.1 milligrams per liter, along with elevated chloride. A DNA screen of the compost detected perchlorate-reducing bacteria in large numbers."

Scientist: The water enters poisoned and leaves clean, and the chloride is exactly what those bacteria ought to leave behind. FURROW, your compost box is a biological filter, and it does not require a single watt of electricity.

Robot: I have always maintained that rot is underrated.

Quill: Notice that Dr. Varga ran the test twice before she believed it. An astonishing result deserves more suspicion than an ordinary one, not less, precisely because it is the kind of result we would most enjoy being true.
? RI.3 : According to the report, how does Bed Zero clean the water?
+ Bacteria in the compost break down perchlorate, leaving chloride.
- The compost soaks up the perchlorate and stores it permanently.
- The bean vines drink all of the perchlorate before the water drains.
- FURROW filters the water through its trowel every morning.
hint: Dr. Varga explains that the bacteria "extract the oxygen from the perchlorate and leave behind ordinary chloride."
next: secret-end

=== secret-end
scene: planet-surface
cast: quill:happy, astronaut:happy, kid:happy
That evening, Dr. Varga presents the two reports side by side, and Commander Hale cancels the Blight Protocol before she has reached her second slide. He also does something that astonishes everyone: he reads out Power Plan Amber, item 6, in his own voice, and admits that he signed it without asking what Tank B was for.

Before the storm closes in, the entire crew constructs three more compost boxes, seeded with soil from Bed Zero, and plumbs Tank B through them. The polishing loop remains switched off throughout the storm, conserving its 1.2 kilowatts, while billions of microscopic Earth bacteria perform the work for free, and by Sol 440 the new leaves on rows nine through sixteen are unfolding green.

Mission Control sends a message that requires eleven minutes to cross the distance between the planets, announcing that future bases will carry perchlorate-eating bacteria as standard equipment. The engineers name the design after the robot who discovered it, and FURROW is so delighted that it waters the basil three times in a single afternoon.

Quill: The most remarkable discoveries are often hiding in the corner that nobody thought to ask about, which is an excellent reason to keep asking.
end: secret The Living Filter

=== timeline
scene: lab
cast: quill, kid:thinking
Tamsin unrolls a long strip of paper across the potting bench and begins sticking notes onto it, one for each event in FURROW's maintenance log, arranging them along a line from left to right.

Kid: The commander's version of the story begins with the crates, but a story can begin in more than one place, and where you decide to begin it changes what looks like the cause.

Quill: Precisely. The sequence in which things happened is not an opinion, so if you put the events where they belong, the timeline will construct the argument for you.
? RL.5 order : Put these events in the order they happened at Halcyon Base.
1 Commander Hale orders Power Plan Amber.
2 FURROW switches the Tank B polishing loop to bypass.
3 The seed crates are staged beside Row 9.
4 Dr. Varga finds the first yellow leaves in Row 9.
5 The commander orders the Blight Protocol.
hint: Check the sol numbers in FURROW's log: 412, 413, 415, 418, 422.
next: g-ch2-sum

=== g-ch2-sum
scene: library
cast: hero, quill
The Arcade Library reappears around you for a moment, and the radiator ticks softly while Quill flips the book over to examine the circled row of numbers on the back cover.

Quill: Notice how this chapter has been constructed. Nobody on Halcyon Base did anything wicked: a sensible order was written in a hurry, a robot obeyed it faithfully, and a frightened commander reached for the first explanation that matched the timing. Each step made sense on its own, and together they nearly burned half the food on Mars.
? RL.2 : Which theme does this chapter develop most strongly?
+ Reasonable choices made without checking can add up to a crisis.
- Robots should never be trusted to carry out human orders.
- A leader must always follow the handbook, whatever the evidence.
- Young people are always wiser than the adults around them.
hint: Quill says that "each step made sense on its own." What happens when nobody checks how the steps add up?
next: g-ch3

# ============================================================
# CHAPTER THREE: THE STORM
# ============================================================

=== g-ch3
scene: planet-surface
cast: quill, astronaut:thinking, scientist
checkpoint
~ Chapter Three ~

On the morning of Sol 426, the storm arrives, and the sky turns from butterscotch to cocoa to a deep, muddy brown, while the sun shrinks to a dim copper coin that you can look at without squinting. Fine dust hisses against the dome and settles on the solar panels, which now deliver less than a third of their usual power.

Commander Hale stands at the airlock window with his arms folded, watching the panels disappear into the gloom, because the burn has been postponed, but it has not been cancelled.

Scientist: Switching the polishing loop back on will cost 1.2 kilowatts, and the storm has left us with almost nothing to spare, so there are only two loads on the base large enough to surrender that much. The first is the Glasshouse grow lights, and potatoes, wheat and beans can survive two sols of darkness without lasting harm; they will simply pause and wait, the way plants do during a long cloudy spell on Earth. The second is the air scrubbers, which remove carbon dioxide from the air we breathe.

Astronaut: The scrubbers are life support, and on this base, life support is not a budget line.

He turns away from the window, and his voice is level but tired.

Astronaut: I am calling the whole crew together at noon. You will present your evidence, and then we will decide, together, whether we burn the yellow rows or attempt it your way.
> Go to the crew meeting -> hale-speech

=== hale-speech
scene: space-bridge
cast: quill, astronaut, kid
All six crew members crowd into the command module, namely Commander Hale, Dr. Varga, Tamsin, the two engineers and the station physician, with FURROW wedged into the doorway because it does not quite fit through. The commander speaks first.

Astronaut: I have flown for eleven years, and the Blight Protocol has never once failed me. The crates came from Earth, and the yellowing began beside the crates three sols later, so the pattern is obvious. Some of you want to gamble with our food because of a few numbers from one machine, but I do not gamble, and anyone who votes against the burn is asking us to bet our lives on a hunch.

There is a short, uncomfortable silence, during which the two engineers study their boots with great concentration.

Quill: Weigh his argument the way you would weigh a seed: not by how firmly it is spoken, but by what is actually inside it.
? RI.8 : What is the main flaw in the commander's argument?
+ He blames the crates because of timing alone, ignoring green Rows 7-8.
- He relies too heavily on the laboratory report from Dr. Varga.
- He admits too openly that he signed Power Plan Amber himself.
- He has no experience as a commander and does not understand crops.
hint: Remember where the crates stood, and which rows beside them stayed green. Does "began beside" prove "caused by"?
next: your-case

=== your-case
scene: space-bridge
cast: quill, astronaut:thinking, scientist
The commander gestures toward the screen, where Tamsin's map and Dr. Varga's report wait side by side, and every face in the room turns to look at you.

Astronaut: Very well, then. Make your case, and make it carefully, because everyone in this room has a stake in the outcome.

Dr. Varga gives you an encouraging nod, Tamsin crosses her fingers beneath the edge of the console, and FURROW dims its sensor lights respectfully, as though settling into a theater seat.

Quill: Remember who you are addressing, because these are frightened people with a storm outside, and they need a reason to trust the evidence, not a reason to choose sides.
> Lead with the evidence, step by step -> evidence
> Say the commander caused it all -> accuse
> Promise that the plants will recover -> overclaim

=== accuse
scene: space-bridge
cast: quill:sad, astronaut:angry, kid:scared
You point at Power Plan Amber on the screen and announce that the commander signed the order that poisoned the crop, and that he wants to burn the evidence of his own mistake.

The atmosphere in the room turns very cold. The commander's face flushes red, the two engineers, who have served beside him for years, step closer to his side, and even Tamsin winces.

Astronaut: So that is what this is really about: not plants, but blame.

Quill: You converted a question about water into a question about loyalty, and now nobody is listening to the numbers, because an argument that attacks a person invites that person to defend himself instead of to think.
> Start over and lead with the evidence -> your-case

=== overclaim
scene: space-bridge
cast: quill:thinking, astronaut, scientist:sad
You assure the crew that if they switch the polishing loop back on, every plant in the Glasshouse will recover completely within a week, absolutely guaranteed.

Dr. Varga gives you a pained look, and the commander leans forward immediately.

Astronaut: Guaranteed? The report says nothing whatsoever about how quickly the plants recover. Can you guarantee that, Doctor?

Scientist: No, I cannot. I can tell you precisely what the water contains, but I cannot promise how quickly a poisoned potato will heal.

Quill: Claiming more than the evidence demonstrates hands your opponent the easiest possible target, whereas a careful argument says exactly what the evidence supports and not one word more.
> Start over and lead with the evidence -> your-case

=== evidence
scene: space-bridge
cast: quill, scientist, kid
You take a deep breath and begin again, slowly and deliberately. Tamsin holds up her map, Dr. Varga reads the numbers from her report, and FURROW projects its maintenance log onto the wall, while Quill whispers that a strong argument has a recognizable shape: first state what you think, then present what you found, then explain why the one proves the other, and finally deal fairly with the most serious objection.
? W.1 order : Put your argument in a clear, logical order.
1 Claim: The yellow rows are poisoned by perchlorate in Tank B.
2 Evidence: Tank B holds 9.4 mg/L of perchlorate; Tank A holds 0.02.
3 Reasoning: Only rows that drink Tank B are yellow, at the leaf edges.
4 Rebuttal: Rows 7 and 8, nearest the crates, stayed green.
hint: Begin with what you believe, then the facts, then the explanation, and finish by answering the crate theory.
next: hale-turn

=== hale-turn
scene: space-bridge
cast: quill, astronaut:sad, kid
When you finish, nobody speaks, until Commander Hale stands up, walks to the wall where FURROW's log is projected, and places his finger on the line that reads "Amber list, item 6."

Astronaut: I signed this on Sol 412. There were thirty-one items on that list, and I was exhausted, and I was thinking about the storm, so I never asked what Tank B was for. Then, when the leaves turned yellow, I went searching for a cause that was located somewhere outside my own signature.

He turns to face the crew, and his voice is quieter than you have ever heard it.

Astronaut: The Blight Protocol is cancelled. I was mistaken about the crates, and I would rather be wrong in front of all of you today than be stubborn in front of an empty greenhouse four months from now. Tamsin, that is the finest map anyone has drawn on this planet.

Tamsin turns pink to the tips of her ears, and one of the engineers, who has not said a single word during the entire meeting, begins quietly applauding, until the rest of the crew joins in.

Quill: Admitting a mistake publicly requires considerably more courage than defending one, and a leader who can do it earns a kind of trust that no handbook can provide.
? RL.3 : How has the commander changed by this point in the story?
+ He moves from defending his plan to admitting his part in the problem.
- He moves from trusting the crew to suspecting them of sabotage.
- He moves from caring about the crop to not caring about it at all.
- He moves from blaming Tamsin to blaming Dr. Varga instead.
hint: Compare his angry words about "plumbing" in Chapter Two with what he says about "my own signature" here.
next: power

=== power
scene: space-bridge
cast: quill, astronaut:thinking, scientist
The commander displays the power budget on the main screen, where every load on the base is marked in red, yellow or green, and the storm has reduced the incoming supply to a thin and unreliable trickle.

Astronaut: Then here is our final decision. The polishing loop requires 1.2 kilowatts, and the only way to find that power during the storm is to switch something else off. You have already heard the alternatives.

Outside, the dust hisses against the hull like sand poured slowly over paper, and somewhere in the corridor a fan labors noisily against the gathering cold.
> Switch off the grow lights for two sols -> lights-off
> Borrow power from the air scrubbers -> scrubbed

=== scrubbed
scene: space-corridor
cast: quill:sad, astronaut:scared, robot:scared
You suggest borrowing the power from the air scrubbers, only for a little while, and although nobody is happy about it, the plants are suffering and the storm will not wait, so the engineers reroute the circuit and the polishing loop hums back to life.

Six hours later, the carbon dioxide level in the habitat creeps above its safety line, and the station's safety computer does exactly what it was designed to do: it sounds the evacuation alarm, and the entire crew files into the ascent vehicle, wearing masks, to wait out the reading. Nobody is injured, but when Mission Control reviews the logs, it finds a crew that switched off life support in order to rescue a crop.

Within a week the mission is scrubbed, the Glasshouse is abandoned to fend for itself, and the yellow rows never receive their chance to turn green again.

Quill: Dr. Varga told us which loads could safely be surrendered and which could not, and solving one problem by creating a more dangerous one is not a solution; it is a trade, and this one was a very bad bargain.
end: lose Scrubbed

=== lights-off
scene: lab
cast: quill, kid, robot
The grow lights in the Glasshouse go dark, one rack at a time, until the only illumination in the dome is the dim brown glow of the storm through the glass. The polishing loop rumbles back to life, and FURROW opens every valve on the Tank B lines to flush the contaminated water out of the pipes and replace it with clean.

For two sols the Glasshouse is silent, and the plants stand motionless in the gloom with their leaves folded slightly, as if the entire dome were holding its breath. Tamsin visits every few hours with a flashlight, while FURROW tests the water from Row 9 every morning and announces the results aloud: 6.1, then 2.4, then 0.3.

On the third morning the grow lights flicker on again, and the dome exhales, and the young leaves at the tops of the potato plants in Row 9 are a deep and healthy green.
? L.5 : What does the image of the dome "holding its breath" suggest?
+ The plants and the crew are waiting tensely to see what will happen.
- The air in the Glasshouse has run out of oxygen during the storm.
- FURROW has sealed the dome shut so that nobody can get inside.
- The plants have died and will not grow again after the storm.
hint: Consider why a person holds their breath, and notice that later "the dome exhales" when the lights return.
next: final-sum

=== final-sum
scene: lab
cast: quill:happy, scientist:happy, kid:happy
The storm passes on Sol 437, and the sky fades from brown back to butterscotch. The solar panels are brushed clean, and Power Plan Amber is filed away with a new note at the top in the commander's handwriting: "Before switching anything off, ask what it is for."

Dr. Varga and Tamsin walk the rows together with a clipboard, observing that the oldest leaves on rows nine through sixteen remain scarred and brown at the edges, because a damaged leaf does not heal, but that every new leaf is unfolding green, and the first potatoes are swelling in the soil.

Kid: Dr. Varga says the damaged leaves will eventually fall off, and the plants will simply grow new ones, which seems like a sensible way to deal with a bad week.

Quill: Before we close the book, let us tell the whole story the way a scientist would, accurately and without decoration.
? RL.2 : Which is the best objective summary of the whole story?
+ A power-saving bypass let perchlorate into Tank B; tests led to a fix.
- A blight from Earth was stopped when the crew burned the yellow rows.
- The commander tried to hide his mistake until Tamsin exposed him.
- A dust storm broke the polishing loop, and FURROW repaired it in time.
hint: What actually caused the yellowing, and what changed the crew's minds: fire, blame, or evidence?
next: win-end

=== win-end
scene: planet-surface
cast: quill:happy, astronaut:happy, robot:happy
On Sol 470, the crew of Halcyon Base gathers in the Glasshouse for the first harvest since the storm, and Commander Hale digs up the first potato from Row 9 with his own hands, holds it up to the light, and declares it the most expensive potato in the history of the solar system, which may very well be true.

Tamsin's map is framed and hung on the wall of the command module, beside a new rule printed on the Amber list in thick black marker: every item must be signed by two people, and one of them must understand what it does. FURROW, which has been formally thanked for its meticulous log, now appends a line to the end of every entry that reads, "Has anyone thought about this?"

Mission Control approves another twenty-six months on Mars. Outside, the red plain stretches away to the rim of the crater, and inside, beneath the violet lights, the Glasshouse is green from wall to wall.

Quill: Notice that nobody won this argument by being the loudest, because the plants were telling the truth from the very beginning, and all anyone had to do was read them carefully.
end: win The Green Line
