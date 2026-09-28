title: The Keeper's Log
author: SpiderBen10's Arcade
genre: mystery
band: 9-12
cover: lighthouse
blurb: A keeper's log swears the lamp burned steady all night. So why is a ship stuck on the rocks below?
start: shelf

# ============================================================
# CHAPTER ONE: THE LOG
# ============================================================

=== shelf
scene: library
cast: hero, quill:thinking
checkpoint
~ Chapter One ~

After closing time, the Arcade Library grows so quiet that the only sounds are the ticking of the old radiator and the soft rustle of Quill's feathers as she settles onto the reading table. The owl librarian sets down a heavy ledger whose cover has been warped by salt water and whose pages still carry the faint, oily smell of a lamp that burned for decades.

Quill: This is the logbook of the Saltmark Point Light, in which a single keeper recorded every night of his working life for forty-one years, until one stormy October night when a ship ran aground beneath his tower.

She taps a line of proud, careful handwriting.

Quill: The town believes this log proves that the keeper did his duty, but a log is only the story a person chooses to tell about himself, so we must read it the way a thoughtful detective questions a witness: closely, fairly, and with particular attention to whatever has been left out.

The pages glow, and the cold smell of the sea rises around you.
> Step into the logbook -> harbor

=== harbor
scene: village
cast: quill, mayor:angry
clue: The schooner Wren ran aground on the Teeth, the rocks below Saltmark Point, during the October gale.
You land on the wet cobblestones of Greyhollow harbor on a gray morning after a gale. Beyond the breakwater, a two-masted schooner called the Wren lies tilted on the black rocks that the local fishermen call the Teeth; her crew is safe, wrapped in blankets on the quay, but her cargo of winter flour is entirely ruined.

A woman in a fur-collared coat climbs onto an upturned crate, holding a logbook high above her head. This is Mayor Cordelia Thorne, and she addresses the anxious crowd with the practiced confidence of someone who has given many speeches.

Mayor: Keeper Tarrant's log could not be plainer, because it says "lamp bright; burned steady all night," and therefore our light did not fail us. A hooded stranger was seen on those rocks with a lantern, and every sailor on this coast knows exactly what that means: a wrecker, luring honest ships to their ruin!

As the crowd mutters its agreement, Quill leans close to your ear.

Quill: That was a confident speech; now let us discover whether the facts are equally confident.
> Question the captain of the Wren -> wreck
> Climb straight up to the lighthouse -> cliff-path

=== wreck
scene: beach
cast: quill, captain:sad
clue: Captain Marlow saw a white light that "never blinked" and took it for the fixed harbor light at Pell's Quay.
On the shingle beach below the quay, Captain Ines Marlow is counting the barrels that washed ashore during the night, and although her hands are raw from hauling rope, her voice remains remarkably calm.

Captain: I have sailed into Greyhollow thirty times. Saltmark flashes white every ten seconds, while Pell's Quay, farther down the coast, shows a fixed light that never changes, and sailors learn that difference before they learn to tie a proper bowline.

She stares at her tilted ship for a long moment before continuing.

Captain: Last night, at about half past one, I saw a white light off the starboard bow that never blinked; it simply sat there, still as a star. I took it for Pell's Quay and turned toward it, exactly as I would on any safe night, and ten minutes later we struck the Teeth.

Quill: Did you notice a red lantern on the rocks, as the mayor insists?

Captain: In that downpour I saw nothing except the white light, which I steered by, and which betrayed me.
> Climb up to the lighthouse -> cliff-path

=== cliff-path
scene: lighthouse
cast: quill, kid:scared
clue: Nell Tarrant was sent to bed at nine o'clock on the night of the gale.
The path to Saltmark Point winds upward through gorse and salt-bleached boulders until it reaches the lighthouse itself, a white tower banded with red whose enormous glass lantern room glitters in the thin autumn sunlight.

A girl of about fifteen is sitting on the doorstep with her arms wrapped around her knees, and she leaps to her feet the moment she sees you approaching.

Kid: If you have come here to call my grandfather a liar, you can turn around and walk straight back down.

Her name is Nell Tarrant, and she has lived at the lighthouse with her grandfather since she was six years old.

Kid: He has never missed a single night in forty-one years. He sent me to bed at nine o'clock, the same as always, and he sat up with the lamp, and that is all there is to the story.

She delivers these words rapidly, in the way people recite something they have rehearsed, and then she opens the heavy door and leads you up one hundred and twelve iron steps.
> Follow Nell up the spiral stair -> lamp-room

=== lamp-room
scene: lighthouse
cast: quill, keeper:thinking
The lamp room is an elegant cage of glass and polished brass, and at its center stands the great lens, taller than a grown man, constructed from concentric rings of glass that resemble a frozen beehive. Keeper Absalom Tarrant, tall and stooped, with a white beard and eyes that squint even indoors, is polishing it slowly with a soft cloth.

Keeper: So the mayor has sent visitors to inspect the old man's light. Look, then, as closely as you like. This lamp is my conscience; for forty-one years it has spoken for me every night, and it has never once told a lie.

He rests his hand on the lens as though it were the shoulder of an old and trusted friend. You notice, however, that his fingers tremble, and that he must lean very close to locate the smudge he is trying to remove.

Keeper: A keeper's word is written in two places, in his log and in his light, and both of them say precisely the same thing about that night.
? L.5 : When the keeper calls the lamp "my conscience," what does the metaphor suggest?
+ He sees the light as proof of his own honesty and sense of duty.
- He feels guilty and hopes the lamp will confess the truth for him.
- He believes the lamp is alive and can make decisions by itself.
- He wants the visitors to stop asking him questions about the lamp.
hint: Read on: he says the lamp has "spoken for me" and "never once told a lie." What does it speak for?
next: log-entry

=== log-entry
scene: lighthouse
cast: quill, keeper
clue: The log's ten o'clock entry reads: "Glass falling fast; lamp bright; burned steady all night."
The keeper opens the logbook on the brass chart table and turns it toward you with evident pride. His handwriting is tall and remarkably even, with the letters leaning forward like soldiers on parade, and you soon locate the entries for the night of the gale.

Nine o'clock: wind north-east and rising to a gale; clockwork wound; lamp lit and trimmed; granddaughter sent to bed.

Ten o'clock: glass falling fast; lamp bright; burned steady all night.

Two o'clock: a hooded figure on the rocks below, swinging a lantern, which is a wrecker's false light beyond any doubt; schooner in distress.

At dawn: the schooner Wren aground upon the Teeth, with her crew ashore and safe, thanks be.

Quill reads over your shoulder, tilting her head slowly to one side and then the other, which is what owls do when a sound does not quite make sense to them.

Quill: Read the ten o'clock entry once more, and then consider carefully what a man sitting at this table at ten o'clock could possibly have known about the rest of the night.
? RL.1 : Which line suggests an entry was not written at the time it claims?
+ "Ten o'clock: ... lamp bright; burned steady all night."
- "Nine o'clock: wind north-east and rising to a gale..."
- "Two o'clock: a hooded figure on the rocks below..."
- "At dawn: the schooner Wren aground upon the Teeth..."
hint: At ten o'clock, how could anyone already know what happened "all night"?
next: log-after

=== log-after
scene: lighthouse
cast: keeper:angry, kid:scared
clue: Every other night in the log has a "One o'clock: clockwork wound" entry, except the night of the gale.
You turn back a page, and then another, and you notice that the same pattern marches down the columns night after night: nine o'clock, ten o'clock, and then, without fail, "One o'clock: clockwork wound." That entry appears on every night for months, with a single exception, because on the night of the gale the log leaps directly from ten o'clock to two.

The keeper closes the book with a sharp snap that makes Nell flinch.

Keeper: You are reading an old man's log as though it were a confession, but I have already told you what happened, and there was a wrecker on those rocks.

Kid: Grandpa, they are only trying to help us.

Keeper: The mayor's kind of help arrives with a new keeper and a narrow room for me at the county home.

He turns toward the rain-streaked glass, and Nell looks at you with an expression you cannot quite interpret, as if she wants to say something important and has decided, for the moment, to keep silent.
> Ask the keeper about the stranger -> stranger-tale
> Ask Nell to show you the clockwork -> clockwork

=== stranger-tale
scene: lighthouse
cast: quill, keeper:angry
The keeper does not turn away from the window, and when he finally speaks, his voice drops low, like the voice of a man telling ghost stories to children beside a fire.

Keeper: I watched her from this very glass. She slunk along the rocks like a crab, bent double, with a lantern hidden beneath her cloak, and now and then she would uncover it and swing it, red as an ember, back and forth. That is the oldest trick on this coast: a wrecker displays a false light, a ship steers toward it, and by morning the wrecker is picking cargo off the beach like a gull at a rubbish heap.

At last he faces you, and you see that his eyes are wet, although you cannot tell whether anger or some other feeling has put the tears there.

Keeper: She arrived in Greyhollow three weeks ago, and nobody here knows her, and nobody here invited her to come.
? RL.4 : How do words like "slunk," "crab," and "gull at a rubbish heap" shape his account?
+ They make the stranger seem sneaky and greedy before any proof.
- They show that the keeper is a careful, neutral observer.
- They create a playful tone that suggests he is only joking.
- They prove that the stranger stole cargo from the Wren.
hint: Think about connotation. Would you want to be described as a crab that slinks along?
next: gallery

=== clockwork
scene: lighthouse
cast: quill, kid:thinking
clue: One winding of the clockwork turns the lens for about four hours.
Nell leads you down one flight of stairs into a narrow chamber crowded with gears, where a thick iron chain runs from a wooden drum down the hollow center of the tower, and where, at the very end of that chain, hangs an iron weight as heavy as a cow.

Kid: The weight pulls the chain, the chain turns the gears, and the gears rotate the lens, which is what produces the flash every ten seconds. A single winding lasts about four hours, and after that the weight reaches its nadir, down at the very bottom of the shaft, and the whole mechanism stops.

Quill peers thoughtfully into the dark shaft.

Quill: And what happens to the light itself when the whole mechanism stops?

Kid: The lamp keeps burning, because the flame has nothing to do with the clockwork. It simply stops turning, so instead of a flash you get a light that just sits there.

She says this slowly and then presses her lips together, as though she has heard her own words clearly for the very first time.
? L.4 : Using context clues, what does "nadir" most likely mean in Nell's explanation?
+ The lowest point
- The heaviest load
- A kind of gear
- The starting place
hint: Nell says the weight "reaches its nadir, down at the very bottom of the shaft."
next: gallery

=== gallery
scene: lighthouse
cast: quill:thinking
By evening the storm clouds have broken apart, and you and Quill stand together on the narrow iron gallery that encircles the lamp room. Behind you, the great lens begins its patient rotation, and a white blade of light sweeps across the water, disappears, and returns precisely ten seconds later.

Quill: A lighthouse communicates in a code made entirely of time. Its light is not merely a light but a sentence, and the darkness between the flashes is its punctuation.

Far to the south, a single light glows above Pell's Quay, and it does not blink at all; it simply rests on the horizon, patient and unchanging.

Quill: The mayor has found a villain, and so has the keeper. Villains are remarkably convenient, you know, because they spare everyone the trouble of examining the machinery.

Far below, on the black rocks at the foot of the cliff, something small and red flickers once and then goes out.
> Climb down to the rocks -> rocks
> Stay with Quill and think it over -> ch1-sum

=== rocks
scene: beach
cast: quill, stranger:scared
You pick your way down the cliff steps to the rocks, where the tide sucks and hisses in the crevices, and you discover a figure in a gray hooded oilskin crouching beside a tide pool with a small tin lantern whose glass is red.

Stranger: Please stay back! I promise I haven't taken anything from anyone.

She is young, perhaps twenty-five, with a diver's knife on her belt and a notebook protruding from her pocket, and before you can say a word she turns and scrambles away across the rocks, moving swiftly and surely until she vanishes around the point.

She leaves behind nothing except wet footprints and a scrap of paper tangled in the seaweed. On it, someone has written a neat column of times in pencil, nine o'clock, ten past nine, twenty past nine, each one followed by the same single word: flash.

Quill: How curious that a wrecker should keep such careful notes about a lighthouse.
> Climb back up to the lamp room -> ch1-sum

=== ch1-sum
scene: lighthouse
cast: quill:thinking
Back in the lamp room, Quill perches on the chart table, and her eyes glow amber in the lamplight as she considers the evidence in front of her.

Quill: Before we go any further, we must be honest about the difference between what we know and what we merely suspect, because a detective who confuses the two is like a cook who cannot distinguish salt from sugar, and every dish tastes of the same mistake.

She hops along the table, touching each object with a claw in turn: the logbook, the oil can, and the brass winding crank hanging on its hook.

Quill: Tell me the story of this chapter the way a responsible newspaper would report it, rather than the way the mayor or the keeper would tell it, or anyone else who wants us to feel a particular way. Report only what happened and what people have claimed, with no villains and no heroes, and the facts will choose their own side soon enough.
? RL.2 : Which is the most objective summary of the story so far?
+ The Wren grounded; the log claims a steady lamp; a stranger is blamed.
- A lying keeper wrecked a ship and now blames an innocent young woman.
- A cruel wrecker lured the Wren onto the rocks to steal winter flour.
- The mayor gave a stirring speech that bravely defended the keeper.
hint: An objective summary reports events and claims without judging anyone. Watch for loaded words.
next: ch2

# ============================================================
# CHAPTER TWO: TWO ACCOUNTS
# ============================================================

=== ch2
scene: village
cast: quill, guard, stranger:sad
checkpoint
clue: Orla Kett, a salvage diver, is being held at the harbor office until the council meets.
~ Chapter Two ~

The next morning, Constable Pike has the hooded stranger seated on a wooden bench in the harbor office, with a mug of tea going cold between her hands. Her name, it turns out, is Orla Kett, and she is a salvage diver who came to Greyhollow three weeks ago to raise an old anchor from the bottom of the bay.

Guard: The mayor wants her formally charged by Friday, since showing a false light is a serious crime, and my orders are to hold her here until the council meets.

When Orla pushes back her hood, she looks exhausted rather than wicked, but you remind yourself that looking exhausted proves nothing either way.

Stranger: Nobody has asked me what I actually saw that night; they have only told me what I supposedly did.

Quill: Then we shall ask her, Constable, if you would be kind enough to allow us a few minutes alone with the prisoner.

Pike shrugs and steps outside to watch the fishing boats.
> Ask Orla for her side of the story -> orla-account

=== orla-account
scene: village
cast: quill, stranger:sad
clue: Orla says that around half past one the beam "stopped sweeping," so she swung her red lantern to warn the ship.
Orla sets down her mug and speaks slowly, choosing each word with deliberate care.

Stranger: I time my dives by the tide and by the Saltmark light, and I have recorded its flashes every single night since I arrived, because divers learn to trust numbers more than they trust people. On the night of the gale the wind kept me awake, so I sat at the mouth of my cove with my notebook open on my knees.

Stranger: At about half past one, the beam stopped sweeping and simply stood there, staring out to sea like a fixed eye. Then I noticed a ship's lights coming in and turning south toward the Teeth, so I grabbed my red lantern, ran for the rocks, and swung it until my arm ached, because red means danger and every sailor knows it.

She looks down at her hands.

Stranger: They were much too far away to see me, but the keeper saw me, and he decided that I was the danger.
> Compare her story with the keeper's log -> compare

=== compare
scene: village
cast: quill:thinking
Quill takes the logbook in one claw and Orla's penciled notes in the other and holds them side by side, like a judge weighing two loaves of bread.

Quill: Here we have two witnesses, and each tells the story from the place where she or he stood. The keeper was high in his tower and, according to his own log, silent from ten o'clock until two, while Orla was down in her cove, watching the tower and writing numbers.

Quill: Notice that the log calls her lantern a false light, while she calls it a warning. The same red glow, described twice, means two opposite things, which reminds us that point of view is not only where a person stands but also what that person fears.

She sets both accounts down on the bench beside Orla's cold mug of tea.

Quill: Nevertheless, opposing witnesses frequently agree about something without realizing it. If you can identify the fact that both accounts share, you will have found firm ground on which to build.
? RL.6 : On which point do the keeper's log and Orla's account agree?
+ The lamp in the tower was lit during the night of the gale.
- The lamp went completely dark for part of the night.
- Orla's lantern was meant to lure the ship onto the rocks.
- The keeper wound the clockwork at one o'clock as usual.
hint: The log says "lamp bright." Orla says the beam "stood there, staring out to sea."
next: mayor-offer

=== mayor-offer
scene: village
cast: quill, mayor:happy, stranger:sad
The door bangs open, and Mayor Thorne sweeps into the office, shaking rain from her collar, before setting a typed page on the table and uncapping an expensive pen.

Mayor: I understand you have been asking questions, which is excellent, because now you can help me bring this unpleasant business to an end. Here is a statement for the council; sign it as independent investigators, and I will make certain that your arcade receives a generous expression of thanks.

She reads the statement aloud with a politician's musical rhythm.

Mayor: "The people of Greyhollow already know the truth. For sixty years a Tarrant has kept this light, and it has never failed; therefore it could not have failed now. And what do we really know about Miss Kett? She came from nowhere, and she makes her living from other people's losses. Is it any wonder that she was on those rocks?"

Orla stares at the floor, and Quill's feathers rise slightly, as they always do when she encounters a sentence she dislikes.
? RI.8 : What is the main flaw in the mayor's argument against Orla?
+ It attacks Orla's background instead of the evidence from that night.
- It relies on too many numbers and technical details about the lamp.
- It admits that the lighthouse may have failed for part of the night.
- It quotes Orla's own notebook out of context to twist her meaning.
hint: Look at what she says about Orla: "came from nowhere," "other people's losses." Is that evidence?
next: mayor-choice

=== mayor-choice
scene: village
cast: quill:thinking, mayor, stranger:sad
The mayor holds out the pen, and although her smile is warm, her eyes seem to be counting the seconds.

Mayor: The council meets tomorrow evening, and I need this matter settled before the herring boats return and the entire coast starts gossiping about Greyhollow's unlucky light. Towns live and die by their reputations, you understand.

Quill hops onto your shoulder and speaks so softly that only you can hear her.

Quill: Notice what she wants and when she wants it. She wants a signature today, along with a story that ends before anyone examines the clockwork, and a statement signed in a hurry is almost always a statement signed without careful reading.

Through the window, you can see Constable Pike coiling a rope and pretending not to listen. Orla has not looked up even once, and the pen hovers in the air between you and the mayor, waiting for your decision.
> Sign the mayor's statement -> signed
> Ask for time to finish the investigation -> one-more-day

=== signed
scene: village
cast: quill:sad, mayor:happy, stranger:sad
You sign the statement, and the mayor blows gently on the ink, tucks the page into her coat, and disappears before you have even replaced the cap on the pen.

The council meets that evening, your statement is read aloud, and the vote is swift. Orla Kett is ordered to leave Greyhollow on the next coach, and nobody asks to see her notebook of flashes. She packs her diving equipment in silence, and at the coach door she hands you one torn page of numbers, as if to say that you could have read it.

Three weeks later, on another stormy night, the Saltmark light stops turning again a little after one o'clock. This time a fishing boat nearly strikes the Teeth before its skipper notices the missing flash and swerves away just in time, because the machine was never inspected, and the real cause is still up in the tower, winding down.

Quill: We accepted the easiest story instead of the truest one, and now the case has gone cold.
end: lose The Wrong Shadow

=== one-more-day
scene: village
cast: quill, mayor:angry, stranger
You set the pen down on the table, and the mayor's smile stiffens into something colder.

Mayor: Very well, you may have one day. The council meets tomorrow at seven o'clock, and if you have discovered something better than my statement by then, you will present it in front of the entire town; if you have not, I shall expect your signature at the door.

She sweeps out, leaving the door swinging behind her, and Orla releases a long breath and, for the first time since you met her, looks directly at you.

Stranger: My notes are in my cove at the north end of the beach, and the chart on the wall records every flash I have timed since I arrived, so please take whatever might help.

Through the window, Constable Pike gives you a small nod, as if he never much liked charging someone on the strength of a feeling.

Quill: We have two roads and only one day; Orla's chart may give us numbers, but Nell may give us something far more difficult to obtain.
> Search Orla's cove for her flash chart -> cove
> Go back to the lighthouse to find Nell -> nell-stairs

=== cove
scene: cave
cast: quill:thinking
clue: Orla's chart for the night of the gale: "1:30, no flash. Beam fixed." Beside two o'clock: "Flashing again."
Orla's cove is a dry sea cave furnished with a canvas cot, a rack of diving equipment, and an enormous chart pinned to the rock wall with fishhooks. The chart is covered in tiny, disciplined handwriting, with dates running down the left side and hours running across the top, and in nearly every box, night after night, appears the same entry: flash, ten seconds.

You locate the night of the gale. From nine o'clock until one, every box says flash, ten seconds, but after that, in a hurried scrawl that spills over the lines, Orla has written "1:30, no flash. Beam fixed. Ship turning south," and beside two o'clock, in calmer pencil, "flashing again."

Quill: The light began flashing again at two, which is precisely the moment when the keeper's log wakes up. A man writes "burned steady all night" at ten o'clock and then records nothing whatsoever until two, and at two the light begins to turn once more, so the numbers are beginning to testify.
> Take the chart and go find Nell -> nell-stairs

=== nell-stairs
scene: lighthouse
cast: quill, kid:sad
You find Nell halfway up the spiral stair, sitting on the ninety-first step with a small green notebook pressed against her chest; she has obviously been crying, and she is visibly angry about it.

Kid: I know what you're going to tell me, because I worked it out last night: the clockwork weight runs down about four hours after each winding, and then the lens stops turning.

She turns the notebook over and over in her hands.

Kid: Grandpa's eyesight is failing, and he forgets things, so he left the kettle burning twice last month. I started keeping private notes so that I could quietly cover for him, because if the mayor finds out, they'll take the light away from him, and the light is the only place where he still feels like himself.

She looks up at you, fierce and miserable at the same time.

Kid: So tell me honestly, what would you do in my place?
? RL.3 : What best explains why Nell has hidden her notebook?
+ She is protecting her grandfather's dignity and his job at the light.
- She wants the mayor to blame Orla so the case will close quickly.
- She is afraid she will be punished for letting the clock run down.
- She plans to use the notebook to become the new keeper herself.
hint: Nell says why she started the notes and what she fears the mayor will do.
next: nell-choice

=== nell-choice
scene: lighthouse
cast: quill, kid:thinking
Nell's question hangs in the cold air of the stairwell. Far above, you can hear the keeper's slow footsteps on the iron floor of the lamp room and the soft, rhythmic squeak of his polishing cloth.

Quill settles on the railing beside her and speaks gently.

Quill: Loyalty is an admirable quality, Nell, but loyalty that conceals the truth is like a coat thrown over a leak in the roof: the water still comes in, and you simply cannot see where.

Kid: And if the truth sends him away to the county home?

Quill: Then it is far better that the truth be told by someone who loves him than by someone who only wants a convenient story for the council.

Nell opens the notebook partway, then hesitates with her thumb holding the page, and you realize that this decision belongs to her as much as it belongs to you. You can press her, or you can give her room to decide.
> Ask Nell to let you read the notebook -> notebook
> Promise to keep Nell's secret -> keep-secret

=== keep-secret
scene: lighthouse
cast: quill, kid:surprised
You tell Nell that the notebook belongs to her and that you will not ask for it, and she blinks in surprise, as though she had braced herself for an argument that never arrived.

Kid: Do you honestly mean that?

She tucks the notebook inside her sweater, and then, after a long pause, she leans toward you and lowers her voice.

Kid: In that case I'll tell you one thing, and you didn't hear it from me: look carefully at the ink in Grandpa's log, not at the words themselves, but at the ink.

She hurries away up the stairs before you can ask what she means, and Quill watches her disappear around the curve of the wall.

Quill: She kept her promise to her grandfather and still found a way to be honest with us, which is considerably harder than it looks. People are rarely only one thing at a time, since they can be loyal and truthful, frightened and brave, all at once, so let us go and examine that ink.
> Examine the ink in the keeper's log -> ink

=== notebook
scene: lighthouse
cast: quill, kid:sad
clue: Nell's notebook, night of the gale: "Grandpa said he'd sit up alone... I slept through, and I didn't wind it."
Nell hands you the notebook without a word. Its entries are brief and written in a round, careful hand, and they tell a story that the official log never mentions.

On Tuesday, Grandpa forgot the one o'clock winding, so I did it at twenty past, and he never knew.

On Friday, Grandpa wound it twice by mistake, but there was no harm done.

Then comes the night of the gale: Grandpa said he'd sit up alone and said I needed my sleep, so I slept through, and I didn't wind it, and I woke at two to the ship's horn.

Nell's voice cracks as she watches you read.

Kid: If I had stayed awake that night, none of this would have happened.

Quill: You are fifteen years old, Nell, and you were told to go to bed, so the duty was his and not yours. You have just done something genuinely brave, however, because you have placed the truth in someone else's hands.

Above you, the lamp room has fallen silent, and the polishing has stopped.
> Take the notebook as evidence -> ink
> Keep watch in the lamp room tonight -> watch

=== ink
scene: lighthouse
cast: quill, keeper:thinking
Back in the lamp room, you open the log on the chart table and tilt it toward the window, and you immediately see what Nell meant. On every other night, the ink varies from entry to entry, blacker where the keeper dipped a fresh pen and paler where it began to run dry, but the entries for the night of the gale are all the same uniform black, as though every one of them had been written in a single sitting.

The keeper watches you from his chair beside the lens. He does not deny anything, and he does not say anything at all; he only looks, quite suddenly, very old.

Keeper: A log is a promise, and I have kept that promise faithfully for forty-one years.

Quill: Then perhaps, Keeper, the time has come to let it tell the truth.

The old man turns his face toward the sea and does not answer.
> Walk back down to town -> ch2-sum

=== ch2-sum
scene: beach
cast: quill:thinking
You walk down the cliff path at dusk with Quill riding on your shoulder. Below you, the Wren still leans on the Teeth like an exhausted animal, and above you the great lens begins its slow rotation, sweeping white light across the darkening water.

Quill: Consider everyone we have met. The keeper protects his pride with a log, the mayor protects the town's reputation with a speech, and Nell protected her grandfather with a secret notebook, so every one of them has been guarding something they love.

Quill: And yet every one of those secrets made the real danger more difficult to see. Stories are frequently built on patterns like this one, in which an author places the same idea in several different characters so that the reader begins to feel it long before anyone states it aloud.

The first stars appear above Pell's Quay, and the steady harbor light glows beneath them.
? RL.2 : Which theme is the story developing through the keeper, the mayor, and Nell?
+ Hiding the truth to protect what we love can put others in danger.
- Strangers should never be trusted in a small, close-knit town.
- Old people should not be given important or dangerous jobs.
- Machines are always more reliable than the people who run them.
hint: Quill lists what each character was "guarding" and what those secrets did.
next: ch3

# --- secret path (from the notebook) ---

=== watch
scene: lighthouse
cast: quill, keeper:thinking, kid:thinking
You, Nell, and Quill keep watch in the lamp room that night, sitting quietly in the shadows while the keeper occupies his usual chair beside the lens. The wind is gentle, and the lens turns steadily, casting its white beam across the sea every ten seconds.

At half past twelve, the keeper's chin sinks slowly to his chest, and by a quarter to one he is snoring softly. Nell grips your arm as, below you in the gear room, you hear the chain slow down, and then slow further, and then, a few minutes after one o'clock, stop entirely, so that the lens halts in the middle of its turn and the beam hangs motionless over the sea like a star that has forgotten how to move.

Nell does not run for the winding crank; instead, she kneels beside her grandfather's chair and gently shakes his shoulder.

Kid: Grandpa, wake up and look.

The old man opens his eyes, stares at the motionless beam, and understands everything at once.
> Stay silent and let them talk -> secret-end

=== secret-end
scene: lighthouse
cast: quill:happy, keeper:sad, kid:happy
For a long moment the keeper says nothing at all. Then he rises, descends to the gear room himself, and turns the crank until the chain rattles upward and the lens begins to rotate once again, and when he returns, he opens the log.

Keeper: I fell asleep that night, and I woke at two to the ship's horn, saw my beam standing still, and wound the clock. Then I noticed that young woman's lantern and allowed myself to believe she was to blame, and in the morning I rewrote the whole night so that it would look like a night I could be proud of.

He picks up his pen and writes, in a hand that trembles: the light stood still, and the fault was mine.

At the council meeting, the keeper is the first to speak, Orla is cleared of every charge, Nell is appointed assistant keeper, and Orla offers to teach her the flash chart. The old man keeps his chair beside the lens, but he never again keeps watch alone.
end: secret The Honest Page


# ============================================================
# CHAPTER THREE: THE COUNCIL
# ============================================================
=== ch3
scene: castle-hall
cast: quill, mayor, captain
checkpoint
~ Chapter Three ~

The Greyhollow council assembles in the old customs house, a stone hall with a vaulted ceiling and portraits of long-dead harbormasters along its walls. Every bench is occupied, and fishermen stand at the back holding their caps. Orla sits beside Constable Pike near the front, while the keeper sits alone on the opposite side, very straight, with Nell behind him.

Mayor Thorne raps her gavel for silence.

Mayor: We are gathered to settle the matter of the Wren. We shall hear from the ship's captain, after which I will deliver a closing statement, and then our young investigators may speak, if they absolutely insist.

A few people laugh, but Quill does not.

Quill: Listen carefully to every witness, because in a hall like this one the loudest story often wins, and our task is to make the truest story loud enough to be heard.

Captain Marlow rises and walks to the front of the hall.
> Listen to the captain's testimony -> captain-testifies

=== captain-testifies
scene: castle-hall
cast: quill, captain, keeper:sad
Captain: I will state this plainly, so that nobody in this hall can misunderstand me. Saltmark flashes every ten seconds, and Pell's Quay shows a fixed light. At half past one that night, I saw a white light off my starboard bow that never blinked, still as a star, and I took it for Pell's Quay, as any sailor would, and steered toward it; it was not Pell's Quay at all, but Saltmark, standing perfectly still.

A murmur rolls across the crowded hall.

Captain: I saw no red lantern, and nobody lured me anywhere, because I simply followed the only light I could see.

The keeper's hands tighten on his knees. Near the back of the hall, somebody reads aloud, mockingly, from a copy of the log that has been passed from hand to hand: "Lamp bright; burned steady all night."

Quill closes her eyes for a moment.

Quill: There it is, the proudest line in the entire logbook, and also the most dangerous.
? RL.6 : Why is the log's line "burned steady all night" ironic?
+ A steady, unmoving light is exactly what misled the Wren.
- The lamp actually went completely dark for the whole night.
- The keeper was not at the lighthouse on the night of the gale.
- The captain never saw any light from Saltmark Point at all.
hint: The keeper meant "steady" as praise. What did a steady light mean to Captain Marlow?
next: timeline

=== timeline
scene: castle-hall
cast: quill:thinking
While the hall buzzes with conversation, Quill guides you into an alcove beneath the portrait of a scowling harbormaster.

Quill: The mayor will conclude with a tidy story, so ours must be tidier, and true. Everyone has described that night out of order: the log jumps from ten o'clock to two, Orla began with the stopped beam, and the captain began with the rocks. We must restore the events to the sequence in which they actually happened.

She reviews the clues on her feathers, but deliberately not in order. At two o'clock, the keeper woke to the horn, rewound the clock, and saw Orla's lantern. The Wren struck the Teeth about ten minutes after the captain first noticed the motionless light. At nine o'clock, the keeper wound the clockwork and sent Nell to bed. Orla ran for the rocks as soon as she saw the beam stand still and a ship turning toward it. Finally, after roughly four hours, the weight reached the bottom of its shaft.
? RL.5 order : Put the events of the night of the gale in the order they happened.
1 The keeper wound the clockwork and sent Nell to bed.
2 The weight reached the bottom, and the lens stopped turning.
3 Orla saw the still beam and ran out with her red lantern.
4 The Wren steered for the fixed light and struck the Teeth.
5 The keeper woke at two, rewound the clock, and saw Orla.
hint: One winding lasts about four hours. Follow the times: nine, about half past one, ten minutes later, two.
next: mayor-closing

=== mayor-closing
scene: castle-hall
cast: quill, mayor:angry, keeper:sad
The mayor rises and walks to the center of the hall, allowing her heels to ring on the stone floor.

Mayor: My friends, this matter is actually very simple, because there are only two possibilities. Either Orla Kett is a wrecker who deliberately lured the Wren onto the rocks, or our own Keeper Tarrant, a man who has guarded this coast for forty-one years, is a liar, and I, for one, will never call a Tarrant a liar.

She allows the silence to stretch while several fishermen shake their heads, and somebody near the back calls out that nobody will.

Mayor: In that case, the choice has already been made for us.

She sits down, evidently satisfied, while the keeper stares at the floor and Quill leans toward you.

Quill: That is a handsome trap, because she has constructed a room with exactly two doors and invited everyone to choose one of them. Look carefully at the walls, however, and ask yourself whether there are truly only two ways out.
? RI.8 : What is the flaw in the mayor's closing argument?
+ It offers only two choices when an honest mistake is also possible.
- It relies too heavily on the captain's sworn testimony.
- It openly admits that the keeper was asleep during the gale.
- It uses Orla's flash chart to prove she was on the rocks.
hint: She says there are "only two possibilities." Is anything left out, like a machine that simply stopped?
next: your-turn

=== your-turn
scene: castle-hall
cast: quill, mayor, keeper:sad
Mayor Thorne gestures toward you with exaggerated politeness.

Mayor: Our visitors wished to speak, so the floor is yours, but please be brief.

Every face in the hall turns toward you, and you feel the pressure of their attention, heavy as the iron weight in the tower. On the table before you lie the pieces of the case: the keeper's log, the captain's testimony, the fact that Saltmark flashes while Pell's Quay does not, and whatever else you have gathered along the way.

Quill: You have a single opportunity to set the story straight. Make certain that your argument rests on what the witnesses actually said rather than on whatever would sound most dramatic, and if you build on the ground they share, the mayor will not be able to knock you down.

You stand up, and your mouth is dry. Somewhere outside, on its lonely point, the great lens of Saltmark continues to turn.
> Argue the lamp went dark for lack of oil -> dark-argument
> Argue the lamp burned but stopped turning -> turning-argument

=== dark-argument
scene: castle-hall
cast: quill:sad, mayor:happy, keeper:angry
You tell the council that the lamp must have gone dark, that its oil must have run low during the storm so that the flame went out, and that this failure explains why the Wren struck the rocks.

The keeper rises, red in the face, and recites the oil supply down to the last gallon, because the cask was two-thirds full that morning. Captain Marlow frowns and declares loudly that she certainly saw a light, a white one, still as a star, and even Orla shakes her head, since she watched the lamp burning all night.

The mayor, who no longer needs to argue at all, simply smiles.

Mayor: So our investigators claim that the light went out, while every single witness says that it did not. I believe we have heard enough.

The council adopts the mayor's statement and sends Orla away, and the clockwork is never examined, because nobody ever asked the right question about it.

Quill: We argued against our own witnesses, and now the case has gone cold.
end: lose Dark on Paper

=== turning-argument
scene: castle-hall
cast: quill, captain:surprised, keeper:sad
You explain the problem step by step. Saltmark is supposed to flash, while Pell's Quay is supposed to stand still, and the lens only rotates while the clockwork weight is descending, which lasts about four hours after each winding. The keeper wound it at nine, so by half past one the weight had reached the bottom, and although the lamp kept burning, bright and steady, exactly as the log says, it no longer turned. To a captain in a gale, Saltmark had become Pell's Quay.

The hall falls silent, and Captain Marlow slowly nods. Then Orla stands and raises her chart, with its hurried pencil line: "1:30, no flash. Beam fixed."

The council clerk dips her pen and looks up at you expectantly.

Quill: She needs one clear sentence for the town's official record, and since a careless sentence invites a careless verdict, let us put every piece in its proper place.
? L.2 order : Build the council's finding, one phrase at a time.
1 The lamp at Saltmark Point was burning;
2 however, its lens had stopped turning,
3 so the crew of the Wren
4 mistook it for the fixed light at Pell's Quay.
hint: A semicolon joins two complete ideas, and "however" begins the second one, followed by a comma.
next: keeper-speaks

=== keeper-speaks
scene: castle-hall
cast: quill, keeper:sad, kid:sad
Before the mayor can respond, Keeper Tarrant stands, holding the logbook in both hands.

Keeper: It is true that I fell asleep in my chair that night. I woke at two to a ship's horn and saw my beam standing still, and I wound the clock with my heart in my mouth; then I looked down, saw a red lantern on the rocks, and was glad of it. I am ashamed to admit it, but I was relieved that there was someone else to blame.

He turns slowly toward Orla.

Keeper: You were trying to warn them, and I made you a villain because I could not bear to be one myself.

Nell steps forward and places her small green notebook on the table beside his log, so that the two books lie side by side, his grand, straight lines next to her small, rounded ones. For a long moment, nobody in the crowded hall says a single word.
> Wait for the council to decide -> ch3-sum

=== ch3-sum
scene: castle-hall
cast: quill:thinking, mayor:thinking
The council members lean together and confer in whispers. The mayor, for once, has nothing whatsoever to say, and she stares at the two notebooks as though they were written in a language she once knew and has since forgotten.

Quill hops onto your shoulder.

Quill: Before they reach a decision, we should make sure that we can tell the whole tale plainly, the way a clerk would record it in the town's permanent record, without the drama and without our own cleverness, simply the essential facts.

Through the tall windows of the customs house, you can see Saltmark on its point, turning faithfully in the darkness, while the Wren waits out on the Teeth for the spring tides to lift her free.

Quill: A good summary is a small kindness, because it allows the next reader to understand what happened without having to live through it.
? RL.2 : Which is the best objective summary of the whole case?
+ The keeper slept; the lens stopped; the ship took it for Pell's Quay.
- A wrecker named Orla lured the Wren onto the Teeth with a red lantern.
- A careless old man lied, and a brave girl exposed his shameful secret.
- The mayor saved the town's reputation with a brilliant closing speech.
hint: Choose the summary that states what happened without praising or blaming anyone.
next: verdict

=== verdict
scene: castle-hall
cast: quill, mayor:thinking, keeper
At last Mayor Thorne clears her throat, and her voice is quieter than you have ever heard it.

Mayor: The council would welcome your recommendation. What should Greyhollow do now?

The question seems to come from the entire hall, for the keeper is waiting, and Nell is waiting, and Orla, seated beside the constable, is waiting too, although she already has what she needed most, because her name has been cleared.

Quill: There is more than one good answer here, since a verdict repairs the past while a recommendation protects the future. Consider what truly went wrong, which was not wickedness but a man alone, exhausted, with nobody to share the watch and a log he was too proud to correct.

You look at the two notebooks lying side by side on the table, and then at the portraits of the old harbormasters, every one of whom kept his watch alone.
> Recommend a second keeper to share the watch -> win-shared
> Recommend the log be corrected in public -> win-record

=== win-shared
scene: lighthouse
cast: quill:happy, keeper:happy, kid:happy
The council agrees immediately that from now on Saltmark will have two keepers, along with a bell that rings whenever the weight approaches the bottom of its shaft. Keeper Tarrant is not dismissed; instead, Nell becomes his official assistant, and Orla, to everyone's astonishment, volunteers to take the midnight watch twice a week, on nights when the diving is poor.

On the first night under the new arrangement, the three of them sit together in the lamp room. Orla teaches Nell to time the flashes, and the keeper teaches them both to trim the wick. Nobody falls asleep, but if anybody did, somebody else would be awake.

As the pages glow and the library gradually returns around you, Quill tucks the logbook under her wing.

Quill: A light that turns needs someone to turn it, and a person who keeps watch needs someone to keep watch with. That is not weakness; that is how lighthouses were always meant to work.
end: win Two Keepers

=== win-record
scene: castle-hall
cast: quill, keeper:sad, stranger:happy
The council votes that the Saltmark log must be corrected publicly, in the keeper's own hand. The following morning, before a small crowd on the quay, Keeper Tarrant opens the book and draws a single neat line through "burned steady all night," and beneath it he writes that the lens stood still from about half past one until two, and that the fault was his own, not Miss Kett's.

Orla shakes his hand. The mayor, to her credit, reads the correction aloud herself, in the same carrying voice she once used to accuse Orla, although this time it sounds noticeably humbler.

The keeper retires in the spring with his pension and his dignity intact, and Nell keeps his old log on her bookshelf with the crossed-out line facing upward, so that she will never forget it.

Quill: A record that can be corrected is worth far more than a record that claims it was never wrong, because the second kind simply does not exist.
end: win The Corrected Log

