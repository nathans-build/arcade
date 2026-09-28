title: The Ascent
author: SpiderBen10's Arcade
genre: adventure
band: 9-12
cover: mountain-pass
blurb: A vanished mapmaker left her route as a poem full of old myths. Read it wisely, or the mountain wins.
start: a-shelf

# ============================================================
# CHAPTER ONE: THE POEM-MAP
# ============================================================

=== a-shelf
scene: library
cast: hero, quill:happy
checkpoint
~ Chapter One ~

Quill flutters down from the highest shelf of the Adventure section carrying a book bound in cracked green leather, on whose cover a mountain with a tiny spring at its peak has been stamped in faded gold.

Quill: Most maps are drawn, but this one was written. A cartographer named Isolde Varga turned the route to her greatest discovery into a poem, and then she vanished up the mountain to finish her work, leaving the poem behind for someone who could read it.

She opens the book, and instead of a map, the first page holds six short stanzas crowded with ancient names: a princess, a boy with wings, a king with a golden touch.

Quill: Those are allusions, which are brief references to much older stories, and Isolde was counting on her reader to recognize them. Anyone at all can follow a line drawn on a map, but only a genuine reader can follow a poem.

The stanzas shimmer on the page, and cold mountain air pours out of the book.
> Follow the poem into the mountains -> village

=== village
scene: village
cast: quill, kid:sad
You arrive in Haldren, a village of steep slate roofs clinging to the foot of a mountain the villagers call the Gray Widow, whose summit is already dusted with early snow. A boy about your age is nailing a notice to the wooden frame of the village well: it announces that Isolde Varga, cartographer, is missing, and it shows a pencil sketch of a woman with sharp eyes and a pencil tucked behind her ear.

His name is Tomas, and the missing woman is his aunt.

Kid: She climbed up three weeks ago, the way she does every autumn, surveying and measuring, and she always comes back within a week. The council says she is probably perfectly fine, but the council says a great many things.

He hammers the last nail considerably harder than necessary.

Kid: She left me a letter that I have read at least forty times without understanding it, so perhaps you will have better luck than I did.

He pulls a folded, much-handled sheet of paper from his coat pocket.
> Read Isolde's letter -> letter

=== letter
scene: village
cast: quill, kid:thinking
clue: Isolde's letter: "Follow the poem, not the paths. The paths were made by people who wanted to go somewhere else."
The letter is written in a small, precise hand with perfectly even margins, as though the writer measured the page before she began.

Tomas, if you are reading this, then I have been away longer than I planned. Do not send the council after me, because they will follow the paths, and the paths were made by people who wanted to go somewhere else; follow the poem, not the paths. There are people who want what I found, and they will not ask kindly. A map can be stolen and followed by anyone, but a poem must be understood, which is why I wrote it the way I did. Be careful whom you show it to, because some who smile at you are measuring your pockets.

It is signed with a pair of initials and the words "your loving aunt."

Quill reads the letter twice, slowly and attentively, the second time with her head tilted.

Quill: Isolde selected the form of her map deliberately, and the question worth investigating is precisely why she did so.
? RL.1 : Which line best explains why Isolde wrote her route as a poem?
+ "A map can be stolen... but a poem must be understood"
- "There are people who want what I found..."
- "Follow the poem, not the paths."
- "Be careful whom you show it to."
hint: Look for the sentence in which she directly compares a map with a poem.
next: poem

=== poem
scene: village
cast: quill:thinking, kid
Tomas unrolls the poem itself, which is titled The Ascent and signed with the same small initials, and you read it together in the square.

Begin where Haldren ends, behind the door of blue; / buy what the princess gave the hero, and it will lead you through.

Where three roads part, recall the boy on wings of wax: / not the sun's road, not the sea's road; take his father's track.

In the gorge of voices, be the sailors, wax in every ear; / hold the rope and keep your course, whatever you may hear.

On the stair that sends you down each time you think you climb, / the stone-roller never counted; count the cairns this time.

In the hall of the king whose touch turned bread to gold, / touch nothing that glitters, however bright or old.

At the top, the gift worth more than any crown / is the one that runs down singing to the children in the town.

Across the square, a man in a fine gray coat has been watching you over the top of his newspaper.
> Look for the blue door -> thread-shop
> Ask about the man watching you -> crale-intro

=== crale-intro
scene: village
cast: quill, kid:scared, stranger:happy
The man in the gray coat folds his newspaper and strolls over as though he had been invited. He has a neatly trimmed beard, excellent boots, and a smile that arrives a moment before his eyes do.

Stranger: Forgive the intrusion, but I am Silas Crale, explorer and collector, and I could not help noticing that you possess Madame Varga's famous poem, which I have long hoped to see in the hands of someone capable of reading it.

He tips his hat to Tomas, who steps behind you.

Stranger: Between ourselves, your aunt was a brilliant woman and a terrible neighbor, because the Varga family discovered gold on that mountain a century ago and never shared a single crumb with this village. I only wish to see justice done, so perhaps we might climb together, since I have ropes, provisions, and a great deal of patience.

Quill: How extraordinarily generous of you; we shall certainly think about it.

Crale bows and strolls away, whistling a cheerful tune.
> Go and find the blue door -> thread-shop

=== thread-shop
scene: village
cast: quill, kid, keeper:happy
At the very edge of Haldren, where the cobblestones give way to a goat track, stands a crooked little shop whose door is painted cornflower blue. Inside, spools of thread and coils of rope climb the walls in every imaginable color, and an old woman named Maren sits at a spinning wheel near the window.

Keeper: Isolde's nephew, and some friends with him! You will be wanting what she wanted, I expect, because she bought two hundred yards of my red cord before she went up, and she told me she would need it for the dark part.

She sets a heavy coil of bright red cord on the counter between you.

Quill: The poem instructs us to buy what the princess gave the hero. In the old Greek myth, the princess Ariadne gave the hero Theseus a ball of thread before he entered the Labyrinth, the bewildering maze beneath a king's palace.

Tomas looks at the cord and then up at the mountain.
? L.5 : Based on the allusion, how will the red cord most likely be used?
+ To mark a way through a maze so you can find the way back out.
- To tie up a monster that is waiting at the top of the mountain.
- To pay a toll to a princess who guards the mountain road.
- To climb straight up the icy ridge without ever stopping.
hint: Think about what Theseus needed inside the Labyrinth, and what Maren says about "the dark part."
next: trailhead

=== trailhead
scene: mountain-pass
cast: quill, kid:thinking
clue: The poem: "not the sun's road, not the sea's road; take his father's track."
Above the village, the goat track divides into three roads at a leaning stone post. The high road climbs straight up a bare ridge that glitters with new ice in the morning sunshine, and it looks fast and heroic, like the kind of road that people paint. The low road drops toward the river, where mist boils up from the rapids and the rocks are black with spray. The middle road follows the mountain's shoulder through a forest of dark pines, neither high nor low, and it looks by far the least exciting of the three.

Kid: The high road is the fastest, and everyone says so, because you can see the summit from it.

Quill: Remember the stanza. In the myth, Daedalus built wings of wax and feathers for his son Icarus and warned him not to fly too near the sun, where the wax would melt, nor too near the sea, where the spray would soak his feathers.
> Take the high, sunlit ridge -> ridge
> Take the middle road through the pines -> shade-road
> Take the low road beside the river -> river-road

=== ridge
scene: mountain-pass
cast: quill:sad, kid:scared
The high road is glorious for an hour, but as the sun climbs, the thin ice on the rocks begins to melt, and every step becomes a treacherous slide. By noon you and Tomas are clinging to a narrow ledge with no safe way up and no safe way down, while meltwater streams over your boots.

You wait there, cold but unhurt, until the Haldren rescue team finds you at dusk and lowers you down on ropes. They are kind about it, but they are also firm: nobody is to climb the Gray Widow again this season. The first snow falls that very night, closing the passes until spring.

Tomas takes the poem back and returns it to his pocket without saying a single word.

Quill: Icarus flew too high because flying high felt like winning, and we did precisely the same thing. The poem told us plainly to avoid the sun's road, and we read its warning as though it were an invitation.
end: lose Wings of Wax

=== river-road
scene: forest
cast: quill, kid:surprised
The low road winds down toward the river and soon becomes a slippery ledge above roaring white water. Spray drifts over everything, so that your coats grow heavy, your boots squelch, and the coil of rope over your shoulder soaks through until it weighs as much as a small child.

After half a mile, the path disappears beneath the flood entirely, and a fallen pine blocks the way, its needles streaming in the current.

Kid: I suppose this is the sea's road, then, where everything gets wet and heavy and nobody can go anywhere at all.

Quill shakes the water from her feathers with tremendous dignity.

Quill: Daedalus warned his son about both extremes, not merely the famous one, although people tend to forget the sea. It is less dramatic to fail by sinking slowly than by falling quickly, but it is failing all the same, and the only sensible response is to turn around.
> Squelch back to the fork in the road -> trailhead

=== shade-road
scene: forest
cast: quill, kid:happy
The middle road is steady and cool, with pine needles hushing your footsteps, and every so often, through a gap in the trees, you glimpse the valley spread out below like a patchwork quilt. Nothing glitters here and nothing roars; the road simply keeps rising, a little at a time, as patient as a staircase.

By midafternoon you discover a small cairn of stones beside the path with a scrap of red cord knotted around the top stone, and Tomas lets out a whoop.

Kid: That is her knot, because she always ties it exactly like that, so we must be on her road!

Quill glances back toward the ridge, where the sun is now blazing on the melting ice.

Quill: The myth of Icarus is a tragedy about a boy who ignored his father's advice. Isolde did not retell that tragedy in her stanza, however; she did something rather different and more practical with it.
? RL.9 : How does Isolde's poem transform the myth of Icarus?
+ It turns a tragic warning into practical advice for choosing a road.
- It retells the myth exactly, to teach that sons must obey fathers.
- It makes Icarus a hero whose high flight should be copied.
- It changes the ending so that Icarus survives and reaches the sun.
hint: Her stanza does not tell the story of Icarus at all; it tells you which road to take.
next: camp

=== camp
scene: forest
cast: quill, kid:sad
You make camp in a sheltered hollow among the pines as the daylight fades, and Tomas constructs a small, expertly arranged fire and then sits staring into it for a long time.

Kid: The night before she left, I told her that maps were useless, that nobody needs paper maps anymore, and that she had spent her entire life on something nobody wants. She didn't argue with me; she just went quiet and wrote in her journal.

He pokes the fire with a stick and admits, almost inaudibly, that he didn't really mean it, because he only wanted her to stay home for once.

Quill settles beside him, her feathers puffed against the cold.

Quill: People often say the sharpest thing when what they mean is the softest, and I suspect she understood that perfectly well.

When Tomas finally falls asleep, Quill turns to you with a thoughtful expression.

Quill: One day of our expedition is complete, so tell me plainly what happened today, the way a stranger reading over your shoulder would need to hear it.
? RL.2 : Which is the most objective summary of Chapter One?
+ With the poem's help, you and Tomas took the middle road to her trail.
- Tomas, a rude boy who insulted his aunt, now wants to make up for it.
- Isolde is lost because the lazy council refused to search for her.
- The beautiful forest road was the best part of a truly wonderful day.
hint: A summary covers the main events without judgments like "rude," "lazy," or "wonderful."
next: a-ch2

# ============================================================
# CHAPTER TWO: THE GORGE AND THE MAZE
# ============================================================

=== a-ch2
scene: mountain-pass
cast: quill, kid:scared, stranger:happy
checkpoint
~ Chapter Two ~

You wake to the smell of coffee, because somebody has built up your campfire and is sitting beside it in a fine gray coat, with a pair of excellent boots propped on a stone.

Stranger: Good morning, and forgive the intrusion. Whether or not we have been introduced, allow me to present myself properly: Silas Crale, explorer and collector, who followed the smoke of your fire because the mountain is a lonely place.

He speaks as though you ought to have heard of him already, and while he speaks, his eyes travel directly to the poem sticking out of Tomas's coat pocket.

Stranger: I have climbed this mountain four times in search of what Isolde Varga found, and I know every trail on it, whereas you, it seems, have her poem. It strikes me that we could help one another enormously.

Tomas edges closer to the fire and says nothing at all.
> Hear what Crale has to say -> crale-pitch

=== crale-pitch
scene: mountain-pass
cast: quill, kid, stranger:happy
Crale warms his hands over the flames and begins, in the smooth voice of someone who has delivered this speech many times before.

Stranger: Let me be perfectly frank with you. Every guide in Haldren will tell you that there is gold on this mountain, so ask anyone you like. The Varga family have always been secretive and odd, living alone with their maps and their measuring chains, and honest people do not hide things inside poems. If Isolde has vanished, perhaps she has simply taken what she found and gone, and in any case, you will never reach the summit without me. I have ropes and I know a shortcut over the east shoulder, so hand me the poem and I will have us all there by nightfall.

He holds out a gloved hand, and Quill whispers without taking her eyes off the glove.

Quill: Listen to the shape of his argument rather than its music, and ask yourself what each claim is actually resting on.
? RI.8 : Which statement best evaluates Crale's argument?
+ It relies on rumor and personal attacks, not evidence about Isolde.
- It is convincing because he supports each claim with clear facts.
- It is weak only because Crale speaks too politely to be trusted.
- It is fair because he admits that the Varga family is honest.
hint: Look at "ask anyone you like" and "secretive and odd." Are those evidence, or something else?
next: crale-choice

=== crale-choice
scene: mountain-pass
cast: quill:thinking, kid:scared, stranger
Crale's hand remains outstretched while the fire pops and crackles, and when Tomas glances at you, you remember the warning in his aunt's letter about people who smile while measuring your pockets.

Quill: Consider what we actually know. Isolde wrote a poem precisely so that her route could not simply be handed over, she warned us specifically about smiling strangers, and this gentleman wants the poem far more than he wants our company.

Crale's smile does not flicker for an instant.

Stranger: Your owl is remarkably suspicious, which I suppose is what owls are for, but think of the time you would save, and think of the danger. The poem sends you through the Gorge of Voices, you know, and people who wander in there sometimes don't come out for days.

He allows that thought to settle, and then he adds, very kindly, that the decision is of course entirely yours.
> Hand Crale the poem and take his shortcut -> shortcut
> Refuse, and head for the gorge -> gorge

=== shortcut
scene: mountain-pass
cast: quill:sad, kid:sad, stranger:happy
Crale's shortcut is real enough for about an hour, until, at a fork beneath the east shoulder, he stops, studies the poem with a frown, and announces that he will scout ahead. He takes the poem with him in order to check a line, and he does not come back.

By evening you understand that Crale never needed a partner; he needed the poem, and you handed it to him. You and Tomas pick your way down through the dusk and reach Haldren after dark, cold, exhausted, and empty-handed, and Tomas sits on the steps of the well without speaking for a very long time.

A week later, a company called Brannock Mining files papers claiming the summit, and Crale's name appears at the bottom of them.

Quill: He told us exactly who he was, because he argued with rumors and insults and flattered us with speed. We allowed his confidence to stand in for evidence, and the poem was only ever safe with readers who understood it.
end: lose The Borrowed Map

=== gorge
scene: mountain-pass
cast: quill, kid:scared
The gorge is a slot of gray rock so narrow that you can touch both walls at once. The wind pours through it and whistles across a thousand holes worn in the stone, and the whistling gradually becomes voices, never quite words, but soft calls, half-names, and a woman's voice rising and falling somewhere above you.

Tomas freezes where he stands.

Kid: That's her, that's definitely Aunt Isolde, and she's somewhere up there above us!

He points toward a side ledge that climbs away from the main trail into the mist, and the voice does seem to come from there, calling and calling.

Quill's feathers flatten against her body.

Quill: In the ancient epic, the Sirens sang so sweetly that passing sailors steered toward them and were wrecked upon the rocks, so the hero's crew stopped their ears with wax and rowed onward. Isolde's stanza tells us to be the sailors, to hold the rope and keep our course, whatever we may hear.
> Follow the voice up the side ledge -> voices
> Stop your ears and hold the red cord -> gorge-through

=== voices
scene: mountain-pass
cast: quill:sad, kid:sad
You cannot bear to leave the voice behind, so you and Tomas scramble up the side ledge into the mist, calling Isolde's name. The voice always seems to be just ahead, around the next boulder or over the next rise, until after an hour it simply stops, and you find yourselves standing on a bare slope in thick fog with no idea which way you came.

You spend a long, cold night beneath an overhang, sharing the last of your bread, and in the morning two goatherds following the bells of their flock discover you and walk you all the way back to Haldren. Isolde's route is lost in the fog, and the first snow arrives before you can try again.

Quill: The voice was nothing but the wind in the rocks, and Isolde warned us about it in her own way. The Sirens never lied with words; they lied with whatever their listeners most wanted to hear.
end: lose The Singing Rocks

=== gorge-through
scene: mountain-pass
cast: quill:thinking, kid:sad
You tear strips from your scarf and stuff them into your ears, Tomas does the same with his jaw clenched, and hand over hand you follow the red cord through the gorge, looking only at the next knot ahead.

Even with your ears muffled, you can hear the rock. The wind moans and coaxes; it sighs, it pleads, and it murmurs sweetly from the side ledges, and once it even seems to sob, but Tomas never lets go of the rope.

When at last you step into sunlight on the far side and pull out the cloth, the gorge behind you is only a gorge, and the wind is only wind.

Quill: Listen to the words I would use to describe it: moaned, coaxed, pleaded, murmured sweetly. Not one of those words is really about wind, because each of them is about persuasion, and a writer who chose them would be choosing them on purpose.
? RL.4 : What is the cumulative effect of "moans," "coaxes," "pleads," and "murmurs sweetly"?
+ They make the wind a tempter, creating a tone of false comfort.
- They make the wind seem violent, creating a tone of pure terror.
- They make the gorge seem cheerful, creating a lighthearted tone.
- They show that the wind is actually Isolde calling for help.
hint: Each verb describes someone trying to talk you into something. What mood does that build?
next: switchbacks

=== switchbacks
scene: mountain-pass
cast: quill, kid:thinking
Beyond the gorge, the trail zigzags up a wall of loose scree in tight switchbacks. After an hour of climbing you reach a cairn with one stone tied in red cord, and after another hour you reach a cairn with two, but when you climb again you arrive, to your dismay, at a cairn with only one.

Kid: We have looped back, and that is exactly what the stanza means! The stone-roller is the man in the old story who pushes a boulder up a hill forever while it always rolls back down, and he never counted. She numbered her cairns so that we would know whenever we were going backward.

He laughs, and it is the first genuine laugh you have heard from him since your arrival in Haldren.

Kid: I told her that maps were useless, and she built a map out of counting stones, because she knew I would be the one reading it.

He takes the other fork, counting aloud, and his steps are lighter than they have been all day.
? RL.3 : How has Tomas changed since his confession at the campfire?
+ His guilt is turning into pride as he sees his aunt's skill.
- He has grown angrier at his aunt for making the route difficult.
- He has lost interest in the search and wants to go home.
- He now trusts Silas Crale more than he trusts his aunt.
hint: Compare what he said at the camp about "useless" maps with what he says at the cairns.
next: cave-mouth

=== cave-mouth
scene: cave
cast: quill:thinking, kid
The switchbacks end at the black mouth of a cave that breathes out cold air smelling of stone and water. Once inside, you can see immediately that the cave is not a single tunnel but many, splitting and rejoining like the veins in a leaf.

Two different guides present themselves. On the right-hand wall, a line of bold white chalk arrows points confidently into the darkness, while on the floor to the left, half-buried in grit, lies a thin, faded red cord running away into another passage.

When Tomas touches one of the chalk arrows, it smears white on his fingertip, and he remarks that the arrows are considerably clearer than an old piece of string.

Quill: Clearer is not the same as truer. Remember the letter, which said that the paths were made by people who wanted to go somewhere else, and ask yourself who draws arrows in a cave, and when.

You tie your own new coil of red cord to a rock at the entrance, just in case.
> Follow the bold chalk arrows -> arrows
> Follow the old red cord -> old-cord

=== arrows
scene: cave
cast: quill, kid:surprised
The chalk arrows lead you briskly through three chambers and around a pillar of dripping stone and then into a fourth chamber that looks strangely familiar, and when Tomas raises his lantern, you see your own red cord lying on the floor, still tied to the same rock at the entrance. You are back exactly where you started.

Kid: These arrows are fresh, because the chalk still smears, but Aunt Isolde came up weeks ago, so somebody drew them yesterday or the day before.

Quill examines a chalk mark closely with one talon.

Quill: Someone has been in this cave very recently, and someone wanted the next visitors to walk in circles. I can think of one person on this mountain who carries a great deal of confidence and quite possibly a great deal of chalk.

Tomas scowls at the wall and rubs out the nearest arrow with his sleeve.
> Go back and follow the old red cord -> old-cord

=== old-cord
scene: cave
cast: quill, kid:thinking
clue: Isolde's note in the cave: "Be circumspect here."
The old cord certainly belongs to Isolde, because every twenty yards it is tied in her particular knot, and it leads you down a sloping passage to a place where the floor itself changes. Here the stone is pale and thin and riddled with holes like a sponge, and far beneath your feet you can hear water running.

Pinned to the wall with a climbing spike is a card in Isolde's handwriting, which reads: "Be circumspect here, because the floor is honeycombed, and what appears solid may be only a crust; keep to the cord, since I have tested every foot of it."

Tomas reads it and swallows hard.

Kid: I've heard the word circumspect before, but I never knew exactly what it meant.

Quill: Look at its parts, then. Circum is Latin for around, as in circumference, and you already know the other half from the word spectator, so put those together with the danger she describes.
? L.4 : Based on its roots and context, what does "circumspect" mean?
+ Careful to look at everything around you before acting
- Brave enough to take risks without any fear
- Moving in circles because you are completely lost
- Able to see clearly in the dark
hint: Circum means "around"; a spectator is someone who looks. Why would that matter on a honeycombed floor?
next: cave-hall

=== cave-hall
scene: cave
cast: quill, kid:surprised
The cord ends in a round chamber where a shaft of daylight falls from a crack far above. Isolde camped here, and scattered across the floor, as though a gust had caught them, lie loose pages from her journal, none of them dated.

You gather them and read them in the order you find them.

The same smiling surveyor has now filed papers to dam the spring I found in June, and if Brannock owns the spring, then Brannock owns the valley's water.

Now that Brannock has filed its claim, no map is safe, so I have spent the rest of the summer writing the route in verse.

I found it at last, the Mother Spring above the old keep, where every stream in Haldren begins.

Tomorrow I climb to finish the survey, although Tomas and I quarreled tonight.

A surveyor from Brannock Mining came asking about the old spring, and I told him, truthfully, that I have never found it and that it may be only a legend, but he smiled far too much.
? RL.5 order : Put Isolde's journal entries back in the order she wrote them.
1 A Brannock surveyor asks about the spring; she has not found it yet.
2 She finds the Mother Spring above the old keep.
3 Brannock files papers to dam the spring she found in June.
4 She spends the rest of the summer writing the route as a poem.
5 She plans to climb tomorrow after quarreling with Tomas.
hint: Look for clue words: "never found it," "at last," "the same smiling surveyor," "now that Brannock has filed," "tomorrow."
next: journal-read

=== journal-read
scene: cave
cast: quill:thinking, kid:sad
clue: On the back of the last journal page, in pencil: "If I am late, look for me where the stars are counted."
Tomas sits down on Isolde's tarp with the pages in his lap and turns the last one over, where a single line has been written in pencil: "If I am late, look for me where the stars are counted."

Kid: It was never gold at all, was it? It was water, and Crale's gold was only a story to stop people asking questions.

Quill nods slowly.

Quill: Now her choices make sense: the poem, the cairns, the cord, and the warning about smiling strangers. A thief can copy the lines on a map, but a thief cannot copy understanding, and Isolde wagered the whole valley on the idea that the right reader, reading slowly, would arrive here, while the wrong reader, reading greedily, would not.

Through the crack above, you hear the wind and, very faintly, the sound of falling water.

Quill: Stories often reveal what they value through the characters who succeed in them, and so far in this one, the fast have fallen behind while the careful have gone on.
? RL.2 : Which theme is developing through Isolde's poem and your journey?
+ Careful understanding protects what greed would carelessly take.
- Treasure always belongs to whoever manages to reach it first.
- Family members should never argue before a long journey.
- Old stories are entertaining but have no practical use.
hint: Think about who has succeeded so far: the fast and greedy, or the slow and careful?
next: a-ch3

# ============================================================
# CHAPTER THREE: THE SUMMIT
# ============================================================

=== a-ch3
scene: castle-hall
cast: quill, kid:surprised
checkpoint
~ Chapter Three ~

The upper passage of the cave opens into the ruins of an old keep built directly into the mountainside. Its roof collapsed long ago, so snow sifts down into a long stone hall, and along both walls stand iron-bound chests, some of them burst open, which glow a deep, buttery yellow in the thin light.

It is gold: coins, cups, chains, and bars, heaped like harvested grain among the drifts of snow.

Kid: So Crale was right after all, and there really was gold up here?

Quill: Long ago there was a king here, or at least a count who believed he was one, and he taxed this valley for forty years and hoarded everything in this hall. According to the story, he froze to death among his treasure because he would not spend a single coin on firewood.

At the far end of the hall, a stair climbs toward daylight, and between you and that stair lies the glittering floor.
> Walk carefully down the hall -> gold-hall

=== gold-hall
scene: castle-hall
cast: quill, kid:scared, stranger:happy
Halfway down the hall, a side door bangs open and Silas Crale strides in, breathless and scraped, with his fine coat torn at the shoulder, and when he sees the chests he stops dead and begins to laugh.

Stranger: I knew it all along, because for ten years I have been telling everyone in the valley, and the poem was about gold after all!

He drops to his knees and scoops coins into his pack with both hands, and then into his pockets, and then into his hat, while Quill, perfectly motionless, recites the fifth stanza very quietly.

Quill: In the hall of the king whose touch turned bread to gold, touch nothing that glitters, however bright or old.

Crale, preoccupied with his treasure, does not hear her, because he is lifting a heavy gold chain from a chest that sits upon a flat stone plate set into the floor, and he is grinning like a man who has finally won an argument.
? RL.6 : Why is Crale's cry "The poem was about gold after all!" ironic?
+ We know the poem warns against gold and leads to a spring.
- Crale has secretly been reading the poem correctly all along.
- The gold in the hall is fake and is really painted lead.
- Tomas wanted the gold even more than Crale did.
hint: Remember the fifth stanza, and what Isolde's journal said the real treasure was.
next: crale-trapped

=== crale-trapped
scene: castle-hall
cast: quill, kid:scared, stranger:scared
As Crale lifts the chain, the stone plate beneath the chest sinks with a heavy clunk, old counterweights groan somewhere inside the walls, and an iron grate rattles down from the ceiling and slams into the floor, sealing Crale inside the treasury alcove with the gold.

He is not hurt in the least; he is simply caged, surrounded by more treasure than he could ever carry, with no way out.

Stranger: Help me, please, because there must be a lever somewhere, and you can read the poem, so you can find it!

Tomas takes a step backward, and his voice shakes when he answers.

Kid: You lied about my aunt, and you would have stolen her map.

Quill: The mechanism may reset if the weight is restored to the plate, but that would mean returning everything he took, every single coin of it.

Crale stares at his bulging pack while snow drifts down through the broken roof, and the stair to the summit waits.
> Stop and help Crale out -> help-crale
> Leave Crale and climb to the summit -> summit-alone

=== help-crale
scene: castle-hall
cast: quill, kid, stranger:sad
You kneel beside the grate and explain what Quill said, that the plate must have its weight restored. Crale stares at you in disbelief, and then, slowly, one handful at a time, he empties his pockets, his hat, and his pack, and finally lays the heavy chain back in its chest, whereupon the plate rises with a sigh and the grate lifts.

He does not rush out, but sits with his back against the wall, holding his empty hat.

Stranger: For ten years I told everyone there was gold up here, and I was right, and it nearly buried me, yet you helped me when you had no reason to.

Kid: We didn't have to, but we did.

Crale looks at Tomas for a long moment.

Stranger: Brannock Mining pays me, because they wanted the poem so they could file their claim before anyone proved the spring's value to the valley, and I will tell the council everything.
? RL.3 : How does the author use the trap to develop Crale's character?
+ Being rescued by those he tricked pushes him to admit the truth.
- It shows that Crale had been honest from the very beginning.
- It proves that Crale is much braver than Tomas.
- It makes Crale greedier, so that he plans a new trick.
hint: Look at what Crale does and says after the grate lifts.
next: crale-turns

=== crale-turns
scene: castle-hall
cast: quill, kid:thinking, stranger:sad
Crale takes a folded document from inside his coat and hands it to Tomas. It is a copy of Brannock Mining's claim, stamped and ready to be filed at the first thaw, marking the summit spring as company property.

Stranger: If your aunt's map reaches the council first, with the spring surveyed and recorded as the source of the valley's water, then this paper becomes worthless. I will go down now and tell them what I know, and although they will not like me, they will listen.

He pauses at the side passage and turns back to acknowledge, with a rueful smile, that your owl was right about him, and that he really was measuring your pockets.

He disappears into the darkness, and Tomas folds the claim into his coat beside the poem, admitting that he honestly didn't believe Crale was capable of changing.

Quill: People rarely change all at once, but sometimes a door closes on them, and someone else opens it, and they notice.
> Climb the stair toward the summit -> spring

=== summit-alone
scene: mountain-pass
cast: quill, kid:thinking
You step around the grate and climb the stair toward the light, and behind you Crale's shouting fades into muttering and then into the clink of coins being returned, one at a time.

Quill: He knows what he must do now, and whether he does it is his own choice, because the plate will reset once he returns the gold.

Tomas climbs in silence until, near the top of the stair, he stops and confesses that part of him wanted Crale to be imprisoned there forever, and he asks whether that makes him a terrible person.

Quill: It is an entirely human feeling, and what matters is what you decide to do with it. We will tell the goatherds where he is, and they will come for him.

The stair ends on a wide, windswept saddle of rock just beneath the summit, where the snow has not yet settled, and somewhere ahead you hear a sound that is certainly not the wind: the clear, bright music of running water.
> Follow the sound of running water -> spring

=== spring
scene: mountain-pass
cast: quill, kid:happy
clue: At the spring, Isolde's cairn holds the finished map and a note: file it with the council "before the first snow."
The Mother Spring rises from a cleft in the rock, clear as glass and so cold that it steams in the air, filling a small pool before spilling over a lip of stone and running downhill in a dozen silver threads that you can follow all the way down to the rooftops of Haldren.

Beside the pool stands a cairn of six stones, the top one tied with red cord, and beneath it, wrapped in oilcloth, lies a finished map, with the summit surveyed to the inch, the spring clearly marked, and every stream traced to the valley. A note pinned to it says that if the map is filed with the Haldren council before the first snow, the spring will belong to the valley forever.

Quill: The council clerk will need a clear statement to accompany the map, and Isolde left the words on a card, but the wind has scattered them.
? L.2 order : Build the statement for the council record, phrase by phrase.
1 The Mother Spring,
2 which feeds every stream in Haldren,
3 belongs to the people of the valley;
4 therefore, no company may dam it.
hint: The phrase set off by commas describes the spring, and "therefore" follows the semicolon.
next: spring-sum

=== spring-sum
scene: mountain-pass
cast: quill:thinking, kid
Tomas holds the map against his chest and gazes down at the valley for a long time, while snow clouds gather over the western peaks and remind you that there is not much time left.

Quill: Before we descend, we must be able to tell this story plainly, because the council will hear a dozen versions of this journey, including Crale's, the goatherds', and the village gossips', and ours must be the one that sticks to what actually happened.

She fluffs her feathers against the rising wind.

Quill: A summary is not the place for describing how brave we were, or how clever the poem was, or how much we disliked Mr. Crale. It is the place for the bones of the story: who did what, and why it matters.

Below you, the spring's silver threads keep running toward the town, exactly as they have for ten thousand years.
? RL.2 : Which is the most objective summary of the whole journey?
+ Following Isolde's poem, you reached the spring she mapped to protect.
- Clever heroes outsmarted a wicked thief and saved a helpless village.
- Tomas finally proved that his aunt's maps were not useless after all.
- Greedy Crale got exactly what he deserved in the king's cold hall.
hint: Choose the version with no praise or blame, only the main events and their purpose.
next: spring-choice

=== spring-choice
scene: mountain-pass
cast: quill, kid:thinking
Tomas wraps the map in its oilcloth, ties it securely with red cord, and looks ready to run the whole way down the mountain.

Kid: Somebody has to present this to the council, and it ought to be someone who understands what it means.

Quill: That is a question of honor rather than speed, and either of you could carry it with credit.

High above the spring, on the true summit, a small stone dome squats against the darkening sky, its roof split by a single narrow slot, and a thin thread of smoke rises from a chimney on its side. Tomas has not noticed it, because he is looking down at the valley rather than up at the peak.

Quill follows your gaze and says nothing, although one of her eyebrows, if owls can be said to have eyebrows, rises very slightly.
> Let Tomas present his aunt's map -> tomas-win
> Carry the map to the council yourself -> council-win
> Climb to the stone dome on the peak -> star-room

=== council-win
scene: village
cast: quill, kid, mayor:happy
You carry the map down through the pines, past the switchbacks and the silent gorge, and reach Haldren just as the first flakes begin to fall. The council meets by lamplight, you unroll Isolde's survey on the long table and read the statement aloud, and the clerk stamps it with the valley's seal before the snow has covered the square.

Mayor: The Mother Spring is hereby recorded as the source of our water and the property of this valley, so no claim may ever be made upon it.

Brannock's papers arrive by courier three days later, and the clerk sends them back unopened. When the weather breaks, a search party follows your route, cord and cairns and all, and finds Isolde sheltering in an old observatory near the peak, with a sprained ankle and plenty of stubbornness.

Quill: A poem that is understood is harder to steal than any treasure, and today you proved it.
end: win The Mother Spring

=== tomas-win
scene: village
cast: quill, kid:happy, mayor:happy
You hand the map to Tomas, and he carries it all the way down himself, clutched against his chest like something alive. The council meets by lamplight as the first snow begins, and Tomas unrolls the survey on the long table, his voice shaking at first and then growing steady.

Kid: My aunt spent her whole life making maps, and I once told her they were useless, but this one gives the entire valley its water, so I was wrong, and I am glad I was.

The clerk stamps the survey with the valley's seal, the spring is recorded as the property of Haldren, and Brannock's claim is refused the moment it arrives. When the weather breaks, a search party follows the cord and cairns and finds Isolde sheltering in an old observatory near the peak, and Tomas is the first one through the door.

Quill: Some maps lead to places, but the best ones lead people back to each other.
end: win Tomas's Map

=== star-room
scene: lab
cast: quill, kid:surprised, scientist:surprised
The stone dome sits on the true summit, its roof split by a slot for a telescope, and when you push open its frozen door, you find a woman sitting beside a small iron stove among brass instruments and star charts, with her ankle bound in a splint and a pencil tucked behind her ear.

Scientist: Well, it certainly took you long enough.

Tomas makes a sound that is half laughter and half sobbing and crosses the room in three strides.

Between hugs, Isolde Varga explains that she sprained her ankle on the way down after placing the final cairn, and that an early snowfall closed the gorge behind her. Since she had food, fuel, and an excellent view, she decided to wait for her reader in the old observatory, where astronomers once counted the stars.

Scientist: I left one line on the back of my last journal page, and most people would never have turned it over, but you did.
> Show Isolde the map you found -> secret-end

=== secret-end
scene: lab
cast: quill:happy, kid:happy, scientist:happy
Isolde unrolls her own copy of the map on the chart table beside yours and checks every line with a careful finger before nodding with satisfaction.

Scientist: You took the middle road, you ignored the singing rocks, you counted the cairns, and you touched nothing in the king's hall, which means you read the poem exactly as it was written.

She fashions a sling from the red cord, and together you help her down the mountain, slowly, the way the poem taught you, and the council records the spring before the snow can stop you.

In the spring, a new sign appears above a door painted cornflower blue, right beside Maren's thread shop, announcing Varga and Apprentices, Cartographers. Tomas's name is painted beneath his aunt's, and beneath his there is a space deliberately left blank.

Quill: I believe she is waiting for the next careful reader, and perhaps that reader will be you.
end: secret The Cartographer's Apprentices
