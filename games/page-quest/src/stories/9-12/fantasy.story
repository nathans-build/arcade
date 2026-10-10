title: The Crown Beneath Kessaly
author: SpiderBen10's Arcade
genre: fantasy
band: 9-12
cover: labyrinth
blurb: Once a century, a student must take a crown from the monster under the temple. This time, the monster asks a question.
start: shelf

# ============================================================
# CHAPTER ONE: THE STONE AND THE SONG
# ============================================================

=== shelf
scene: library
cast: hero, quill:thinking
checkpoint
~ Chapter One ~

Long after the last reader has gone home, the Arcade Library settles into the deep, comfortable silence of shelves at rest, and Quill is perched on the returns cart with a book that nobody has returned, because, as far as the catalog can determine, nobody ever borrowed it. Its cover is bronze rather than leather, cool to the touch and slightly green at the edges, and a narrow spiral has been pressed into its center like a thumbprint in soft clay.

Quill: This arrived in the night slot without a name or a date. The title page says only "The Crown Beneath Kessaly," and every page after that is completely blank, except for a single line of handwriting at the very bottom of the last one.

She turns the book toward you. In faded red ink, someone has written: "The stone remembers one story. Ask who carved it."

Quill: Books that arrive with instructions are usually worth reading, and books that arrive with warnings are usually worth reading very carefully indeed.

The spiral on the cover begins to turn, slowly at first, like a wheel deciding whether to roll, and the unmistakable smell of salt water and sun-warmed stone fills the room.
> Open the bronze book -> arrival
> Ask Quill what she knows about Kessaly -> kessaly-lore

=== kessaly-lore
scene: library
cast: quill:thinking
Quill fluffs her feathers, which is what she does whenever a memory turns out to be older than she would like to admit.

Quill: Kessaly is an island that sailors gossip about but can never actually locate, because it sits inside a ring of perpetual storms that they call the Gyre. Inside the Gyre, according to the legend, there is a school of myth-keepers called the Aster Cloister, whose students learn that ancient stories are not merely entertainment but also a kind of machinery, and that a legend repeated often enough can hold up a cliff or quiet an ocean.

Quill: The legend also claims that the Cloister's power comes from a crown hidden somewhere beneath an abandoned temple, and that once every hundred years somebody must descend to retrieve it. That, I confess, is everything I know, and I strongly suspect that it is the polished version.

She glances at the slowly turning spiral on the cover.

Quill: Polished versions of stories have a regrettable habit of leaving out whoever did the polishing.
> Open the bronze book -> arrival

=== arrival
scene: academy-hall
cast: quill, mentor
The library folds away like a closing fan, and you find yourself standing in an enormous hall of pale stone, where hundreds of lanterns float without strings beneath a vaulted ceiling and the tall windows reveal a sky that is calm directly overhead but violently gray at every horizon. Long tables are crowded with students in sea-blue robes, and every one of them stops talking in order to stare at you.

A tall woman with a silver braid hanging down her back comes forward, leaning on a staff whose head holds a small, steady lantern. Her robes are older and more faded than the students' robes, and her face is kind in the particular way that strict faces sometimes are.

Mentor: I am Magister Ilvane Corr, and you are very welcome at the Aster Cloister, although I will admit that we expected our guest to arrive by boat. The Renewal begins at tomorrow's Long Tide, and the bronze book that brought you here is the book that chooses the second walker; in all our history, it has never once chosen wrongly.

She raises her staff toward an empty stone cushion at the head of the hall, where a faint ring of warm light still glows, weaker now than a single candle.

Mentor: That is where the Ember Crown has rested for a hundred years. It is our aegis. Without it, the Gyre would close in upon Kessaly, and the storms that currently shield us would tear the cliffs apart. Its light is fading, as it always fades at the end of a century, so tomorrow two students will walk the labyrinth beneath the temple and carry a new crown up from the beast that guards it.
? RL.4 : The Magister calls the crown "our aegis." What does aegis mean here?
+ A protection or shield that keeps the island safe
- A weapon used to attack the storms
- A prize that students win in contests
- A curse that brings the storms closer
hint: Read what she says next: without it, the storms "would tear the cliffs apart," while now they "shield us."
next: hall-mira

=== hall-mira
scene: academy-hall
cast: quill, mentor, kid:happy
A girl about your age rises from the nearest table so abruptly that her bench scrapes across the floor. She wears a golden brooch shaped like a sunburst, and she holds herself extremely straight, as though someone has been reminding her all her life that she must.

Mentor: This is Mira Vale, the first walker, who was selected by the Cloister's council in the spring. She will descend into the labyrinth beside you.

Kid: My family has walked every single Renewal since the very first one. Oren the Bright was my ancestor, and he was the hero who descended into the labyrinth, slew the beast, and carried the first crown into the light. His name is carved on the temple frieze, and in a hundred years I intend for my name to be carved beside it.

She announces this with obvious pride, but also with a certain tightness around her eyes, as though the carving were a debt she owed rather than a prize she genuinely wanted.

Mentor: Mira, please show our guest the frieze before the tide turns, because a walker ought to know the story of the road before walking it.

As you leave, you notice that the Magister does not watch Mira go. Instead she watches the fading ring of light on the empty cushion, and her hand tightens slowly around her staff.
> Ask Mira about her ancestor on the way -> mira-pride
> Head straight to the temple frieze -> frieze

=== mira-pride
scene: forest
cast: quill, kid:thinking
The path from the Cloister to the temple winds through a grove of wind-bent olive trees, and Mira walks so rapidly that Quill is forced to flap in order to keep pace with her.

Kid: My grandmother made me memorize the frieze before I could even read it, because every Vale child memorizes it. On the Long Tide night of each century, a Vale has gone down with the thread and come back up with the crown, and the entire school has cheered. My great-grandmother Isaura walked the last Renewal, exactly one hundred years ago, together with a student named Ilvane.

You glance back toward the Cloister, and Quill does the same.

Quill: Ilvane, you said? As in Magister Ilvane Corr?

Kid: The Magisters live for an extraordinarily long time, since the old magic slows the years of anyone who remains near the crown. She never discusses her Renewal, though, and when I asked her about it once, she abruptly changed the subject to irregular verbs.

Mira laughs, but the laugh does not survive for very long.
> Continue to the temple -> frieze

=== frieze
scene: temple-ruins
cast: quill, kid
clue: The Frieze says Oren "slew the horned terror" and "lifted the Ember Crown from its horns."
The temple stands on a headland high above the sea, its roof long vanished and its white columns leaning toward one another like elderly friends deep in conversation. Along the inner wall runs a band of carved marble, and Mira reads the inscription aloud in the practiced voice of someone who has recited it hundreds of times.

Kid: "Oren the Bright, bravest of the island, descended alone into the darkness of the labyrinth. There he encountered the horned terror that devoured the light of Kessaly. With his sword he slew the horned terror, and he lifted the Ember Crown from its horns. He bore the crown into the sun, and the Gyre bowed to him, and the sea grew still. Let all who walk after him be as bold."

The carving portrays a tall man with a raised sword, a shapeless monster crumpled at his feet, and a crown blazing above his head. The final panel, where the story ought to conclude, has been chipped away so thoroughly that only a few meaningless marks remain. In its lower corner, almost too small to notice, someone has scratched a tiny spiral, resembling thread wound around a spindle.

Quill: It is a handsome carving, and an extremely confident one. Notice that it informs you not only about what happened but also about what you ought to feel regarding it.
? RL.2 : What central message does the Frieze version of the myth teach?
+ Bold people who conquer by strength earn the right to power.
- Telling the truth matters more than winning glory.
- Power should be shared fairly among everyone.
- Monsters are usually misunderstood and lonely.
hint: Read the frieze's last line: "Let all who walk after him be as bold." What does it praise Oren for?
next: griffin

=== griffin
scene: temple-ruins
cast: quill, kid:angry, griffin
clue: Askel's song ends: "A crown that's given glows for good; a crown that's taken, for a while."
A shadow sweeps across the marble, and a griffin lands on the broken lintel above you with a clatter of talons. His eagle feathers have faded to silver with age, his lion's tail is wrapped neatly around his paws, and he regards the frieze with one golden eye half-closed, the way a patient teacher regards a student's very confident but completely incorrect answer.

Griffin: Reading the stone again, little Vale? I am Askel, messenger of the Cloister, and my grandmother's grandmother carried letters for Oren himself. The stone remembers one story, but the shepherds of the high pastures remember another, and long ago they taught it to the birds.

Before Mira can object, he opens his beak and sings in a voice that is rough, low, and surprisingly gentle.

Griffin: "Ysolde spun a thread of red by lamplight, thin as rain; she said, 'Go gently, brother, and come gently home again.' Oren followed the red thread down where the frieze says terrors creep, but found a horned child by the crown who only knew to weep. He did not ask; he did not wait; he lifted up the light, and turned the key upon the gate, and left the child the night. He told the island braver words, and stone remembered those; but shepherds told it to the birds, and this is how it goes: a crown that's given glows for good; a crown that's taken, for a while."

The final notes drift out across the water, and Mira's face has turned bright red.

Kid: That is a shepherds' slander, and everyone at the Cloister knows it perfectly well.

Griffin: Everyone at the Cloister knows the stone, whereas I knew my grandmother. To me, Oren was no hero but a thief, who climbed out of the darkness with a stolen crown and left a weeping child behind a locked door.
> Ask Askel why the stone tells it differently -> askel-why
> Ask Mira what she thinks of the song -> mira-scoff

=== askel-why
scene: temple-ruins
cast: quill, griffin:thinking
Askel lowers his enormous head until his curved beak is level with your face.

Griffin: Those who win carve their stories in stone, because stone endures, while those who lose sing their stories in the pastures, because songs travel. Stone remains exactly where it is placed and repeats the same words for a thousand years; a song changes a little with every mouth that carries it, and yet it travels everywhere, even inside the Gyre, even into the Cloister itself.

Quill: And which of the two do you trust, Askel?

Griffin: I trust neither of them entirely by itself. I trust the place where the two versions disagree, because that is precisely where somebody made a deliberate choice about what deserved to be remembered.

He spreads his wings and is gone, and the wind of his departure scatters silver olive leaves across the temple floor.
> Return to the Cloister for the night -> ch1-end

=== mira-scoff
scene: temple-ruins
cast: quill, kid:sad
Mira runs her fingertips along the carved sword of her ancestor, as though checking that it is still there.

Kid: If that song is true, then every Vale who ever walked the labyrinth was doing something cruel and calling it courageous, including my grandmother and my great-grandmother, and I would simply be the next one in line.

She takes her hand away from the stone very slowly.

Kid: So it cannot possibly be true, because it simply cannot.

Quill: "It cannot be true" and "I cannot bear for it to be true" are two remarkably different sentences, Mira, although from the inside they frequently sound identical.

Mira does not answer, and the two of you walk back toward the Cloister in a silence that seems considerably heavier than the evening air.
> Return to the Cloister for the night -> ch1-end

=== ch1-end
scene: academy-hall
cast: quill:thinking, mentor
That night the great hall is nearly deserted, the floating lanterns have been dimmed, and the ring of light on the empty cushion is noticeably fainter than it was that morning. Magister Corr sits alone at the high table with a cup of tea that she has not touched.

Mentor: I see that Askel found you. He sings that song to every walker, every century, and every century the walker eventually comes to me and asks whether it is true.

She gazes into her tea for a long moment, as though the answer might be written at the bottom of the cup.

Mentor: A song is a beautiful thing, but beauty is not evidence. Go to bed, because the tide turns at moonrise tomorrow, and the sphinx at the labyrinth door does not permit exhausted minds to pass.

After she has gone, Quill hops onto the table beside the fading cushion.

Quill: Today you heard the same myth from two tellers who stand in very different places. Before we go any further, make certain that you can say exactly where each of them stands.
? RL.6 : How do Mira's and Askel's points of view on Oren differ?
+ Mira sees a proud family hero; Askel sees a thief who left a child.
- Mira thinks Oren was a liar; Askel thinks he was very brave.
- Both of them believe the frieze is the only true version.
- Askel never met anyone who knew Oren, so he has no opinion.
hint: Mira said Oren "was my ancestor" and wants her name "carved beside it." Askel said Oren "was no hero but a thief."
next: night

=== night
scene: academy-hall
cast: quill, cat:thinking
On your way to the guest chamber, a gray cat with one torn ear steps out of an alcove and sits squarely in the middle of the corridor, curling her tail around her paws with the air of someone collecting a toll.

Cat: You are the new walker. I am Pumice, and I have lived in this Cloister for longer than is strictly natural for a cat, which is what happens when you nap beside the crown every afternoon for decades. If you intend to sleep tonight, the guest chamber is up those stairs. If you intend to learn something, however, the records tower is unlocked, and the Renewal ledger is on the third shelf.

Quill: Do you always give advice to strangers in hallways?

Cat: Only to the ones who look as though they will not take it.
> Climb the records tower to read the ledger -> ledger
> Go to bed and rest before the tide -> ch2

=== ledger
scene: academy-hall
cast: quill:thinking, cat
The records tower is a narrow spiral of bookshelves, and the Renewal ledger is a massive volume bound in sea-gray leather, its pages listing every pair of walkers in two neat columns, century after century, with a Vale's name always written first.

The entries are identical in their wording until you reach the last one, written exactly one hundred years ago: "Isaura Vale and Ilvane Corr descended at the Long Tide and returned at dawn bearing the Ember Crown." Beneath it, in a different and much shakier hand, someone has added a second line and then struck it through with a single firm stroke, although you can still make out the words: "She asked us to wait, and we did not."

Cat: That second line appeared the week after the last Renewal, and nobody in the Cloister has ever admitted to writing it.

Quill closes the ledger very gently, as one closes the door of a sleeping child.
> Go to bed and rest before the tide -> ch2

# ============================================================
# CHAPTER TWO: THE THREAD
# ============================================================

=== ch2
scene: temple-ruins
cast: quill, kid, sphinx:thinking
checkpoint
~ Chapter Two ~

At moonrise the sea withdraws farther than you would have believed possible, exposing a staircase of black rock beneath the temple that descends to a bronze door set deep into the cliff. The entire Cloister has gathered on the headland carrying lanterns and chanting the frieze in solemn unison, and Magister Corr has pressed a heavy spool of red thread into your hands without saying a single word.

Before the bronze door, on a slab of fallen marble, lies the sphinx. She has a lion's body the color of sand, folded wings the color of dusk, and the calm, amused face of a woman who has heard every conceivable excuse and believed none of them.

Sphinx: I am Ashaya, warden of this door, and I have asked my questions at every Renewal since the first. Answer well, and the door opens; answer badly, and you are welcome to try again next century.

She smiles, which is not entirely reassuring.

Sphinx: Here is the first question. "The victors carve me and the losers sing me; I grow longer each time I am carried, yet I swear that I never change. What am I?"

Mira frowns in concentration, and then her eyes widen.

Kid: A legend, which is a story that is passed down from one generation to the next.

Sphinx: Correct. Now demonstrate that you understand what you have just said.
? L.5 : In the riddle, what does "I grow longer each time I am carried" suggest?
+ Each new teller adds something as the story is passed on.
- Old books are always much longer than new ones.
- Legends are too heavy for one person to carry.
- Stories get boring the more times they are told.
hint: Think of "carried" as a metaphor. How is a legend carried from one person to the next?
next: sphinx-two

=== sphinx-two
scene: temple-ruins
cast: quill, kid:thinking, sphinx
Ashaya stretches luxuriously, like a cat in sunshine, although there is no sunshine tonight, only the cold white moon.

Sphinx: The second question is the one I genuinely care about. You have both heard the Frieze, and you have both heard the Shepherd's Song, because Askel sings it to everyone, the meddlesome bird. Every walker who arrives at my door has heard two versions of Oren's descent, yet remarkably few of them have noticed how one version transforms the other.

Her tail flicks once toward the headland, where the students are still chanting, and then again toward the shadowy columns at the back of the temple, where, for a single heartbeat, you believe you glimpse a hooded figure standing perfectly still before it steps out of sight.

Sphinx: Tell me what the song does to the stone's story.
? RL.9 : How does the Shepherd's Song transform the myth told on the Frieze?
+ It recasts the slain monster as a captive child Oren left behind.
- It adds a second hero who helps Oren fight the monster.
- It moves the whole story from the labyrinth to the sea.
- It keeps every event the same but changes Oren's name.
hint: The Frieze says Oren "slew the horned terror." What did the song say he found, and what did he do with the gate?
next: sphinx-gift

=== sphinx-gift
scene: temple-ruins
cast: quill, sphinx:happy, kid
The bronze door groans and swings inward, exhaling air that smells of ancient stone and, rather unexpectedly, of warm hay.

Sphinx: Well answered. Most walkers inform me that the song is a lie, and the door opens for them anyway, because I am a guardian rather than a judge. You, however, noticed the seam where the two stories were stitched together, and that observation deserves a gift.

She leans closer, and her voice drops so low that Mira is obliged to lean in as well.

Sphinx: The thread knows the way back, whereas the bright way knows only forward. Remember that when the walls begin to flatter you.

Quill: That is an alarmingly specific warning.

Sphinx: I have been lying beside this door for a very long time, little owl, and I have watched a great many walkers emerge, so I have naturally noticed which ones did not.

You tie the loose end of the red thread to an iron ring beside the doorway, and the three of you step together into the darkness.
> Enter the labyrinth -> descent

=== descent
scene: labyrinth
cast: quill, kid:thinking
The corridors beneath Kessaly are narrow and tall, constructed from blocks of gray stone so precisely fitted that you could not slide a feather between them, and the only illumination comes from Quill's luminous eyes and from a faint, warm glow somewhere far ahead. The red thread unspools behind you as you walk, a thin bright line across the dark floor.

After the third turning, Mira halts and raises her lantern. The walls here are covered in scratched words, old and shallow, as though someone engraved them with a hairpin; they are lines of the Shepherd's Song, but they have been written in no particular order, scattered across the stones like the fragments of a torn letter.

Kid: Somebody came down here and wrote the song on the walls, a very long time ago by the look of it, but it is completely jumbled.

Quill: Then let us reassemble it, because a story told in the wrong order becomes a different story altogether. Remember how Askel sang it, from the first line to the last.
? RL.5 order : Put the events of the Shepherd's Song in the order Askel sang them.
1 Ysolde spun a red thread and asked her brother to go gently.
2 Oren found a horned child who only knew to weep.
3 Oren took the crown and turned the key upon the gate.
4 Oren told the island braver words, and stone remembered.
hint: The song begins with the spinning by lamplight and ends with the story that stone remembered.
next: fork

=== fork
scene: labyrinth
cast: quill, kid:surprised
As you finish reading the final line, the corridor opens onto a junction where three passages converge. The red thread, still unspooling from your hands, leads to the left, into a passage as dark and unremarkable as all the others.

The passage on the right, however, is glowing. Its walls shine with a soft golden radiance, and as you watch, letters rise out of the stone, carved deep and bold, the identical words from the Frieze above: "Let all who walk after him be as bold." The air drifting from that passage is warm and smells like a festival, of honey cakes and lamp oil and distant cheering.

Kid: Look at it! That must be the way to the heart, because the crown is warm, and that corridor is warm, and it is quoting my ancestor. We could drop the thread and run, and we would arrive in minutes, whereas the thread is unbearably slow.

She is already stepping toward the golden light, her face shining in its glow.

Quill: Allow me to remind you both that a certain sphinx said something rather pointed about walls that flatter.
> Follow the bright corridor with Mira -> lose-bright
> Keep to the red thread -> footsteps

=== lose-bright
scene: labyrinth
cast: quill:sad, kid:scared
You set down the spool and follow Mira into the golden corridor, and for a while it is wonderful, because the walls glow, the carvings praise every step you take, and each turning seems to lead deeper and warmer. Then you round a corner, and the golden light goes out like a candle in a draft.

The darkness is complete. You reach for the thread and find only cold stone, and when Mira recites the frieze aloud to steady herself, her voice echoes back from a dozen directions, so that you can no longer tell which way you came.

You wander for hours, holding hands so that you do not lose each other as well. At last, after your lanterns have burned out, you hear the beat of great wings, and Askel lands in a corridor that you are certain was a solid wall a moment earlier. He carries you both up through a shaft in the rock, and you emerge onto the headland in gray daylight, where the tide has already returned, the bronze door lies hidden beneath the sea, and it will remain there for another hundred years.

Magister Corr wraps each of you in a blanket and says nothing whatsoever, which is somehow worse than any lecture.

Quill: The bright way knew only forward, and we forgot to ask where forward led. Let us go back and keep firm hold of the thread this time.
end: lose The Bright Way

=== footsteps
scene: labyrinth
cast: quill, kid:sad, stranger
You hold up the spool so that Mira can see it, and after a long, stubborn moment she sighs and steps out of the golden light. As soon as she turns her back on it, the bright corridor dims and falls silent, as though it were sulking.

Kid: Fine, we will take the slow way, but if we arrive late, I am blaming the owl.

You follow the thread to the left. After a dozen turnings you hear a soft sound behind you, the whisper of fabric brushing stone, and when you spin around with the lantern, you catch sight of a hooded figure at the far end of the passage, standing perfectly still with a staff in one hand, before it steps back around the corner and disappears.

Quill: That is the same figure we glimpsed among the columns. Someone else is walking the labyrinth tonight, and that someone evidently does not wish to be seen.
> Go back and follow the hooded figure -> follow-steps
> Ignore it and press on toward the heart -> heart

=== follow-steps
scene: labyrinth
cast: quill:thinking, kid
You tie a loose knot in the thread to mark your position and creep back around the corner. The figure has vanished, but on the floor, exactly where it stood, lies a dried sprig of rosemary, the kind that the Cloister's cooks hang in the kitchens, and beside it the faint circular print left by the end of a staff.

Mira picks up the rosemary and turns it thoughtfully between her fingers.

Kid: Whoever it is came from the Cloister, and whoever it is knows the way well enough to walk without a thread.

Quill: Which means that they have walked it before, and that narrows the list of suspects considerably, since very few people in the world have accomplished that and survived to cook with rosemary afterward.

You return to the knot in the thread and continue toward the warm glow ahead.
> Press on toward the heart -> heart

=== heart
scene: labyrinth
cast: quill, kid:surprised, minotaur:scared
The thread ends in a circular chamber at the very center of the labyrinth. The ceiling disappears into shadow, and the floor is carpeted with old straw, which explains the smell of warm hay. In the middle stands a stone plinth, and upon the plinth rests a circlet of reddish gold that glows like a coal in a hearth, so warm that you can feel it on your face from across the room.

Curled around the base of the plinth is a creature with a calf's head, small new horns, and enormous dark eyes. He is no taller than Mira, and when he notices your lantern, he scrambles backward against the wall and raises both hands.

Minotaur: Please do not shout, because the ones who come always shout. They shout about Oren and boldness, and then they take it, and then the door locks again.

Mira's lantern trembles in her hand.

Minotaur: My name is Aurek. The crown is the island's heart, and I was made to keep it warm. If I give it to someone, it warms them for always. But nobody has ever waited for me to give it; they take it instead, and taken warmth only lasts a while, so after a hundred years it goes cold, and then they come back and take it again, and I become the monster in the story once more.

On the wall behind him, low down near the floor, you notice a small carved spiral, exactly like the one scratched into the corner of the Frieze.
? RL.3 : According to Aurek, why does the crown go cold after a hundred years?
+ It is taken from him by force instead of given, so it cannot last.
- Its gold is old and needs to be polished every century.
- The Gyre's storms slowly blow its warmth out to sea.
- Aurek lets it go cold on purpose to punish the Cloister.
hint: Aurek says, "If I give it to someone, it warms them for always." What happens instead?
next: ch2-end

=== ch2-end
scene: labyrinth
cast: quill:thinking, kid:sad, minotaur
For a while nobody moves. Aurek watches you from the wall, Mira stares at the crown, and the warm glow throws all of your shadows high onto the curving stones.

Quill speaks quietly, as though she does not wish to startle anyone, least of all herself.

Quill: Before anybody decides anything, let us be absolutely clear about what has happened tonight and what has not. Feelings are going to become very loud in this room in a moment, while facts are quieter, so we should collect them while we can still hear them.

She turns her round amber eyes toward you.

Quill: Tell me Chapter Two the way a fair and careful witness would tell it, without heroes and without villains.
? RL.2 : Which is the most objective summary of Chapter Two?
+ After the sphinx, you followed the thread to Aurek and the crown.
- A cruel Cloister has tortured an innocent creature for centuries.
- Brave Mira heroically led the way through the terrifying maze.
- The sphinx tricked everyone into entering a trap under the temple.
hint: An objective summary reports events in order and avoids loaded words like "cruel" or "terrifying."
next: ch3

# ============================================================
# CHAPTER THREE: THE COST OF THE CROWN
# ============================================================

=== ch3
scene: labyrinth
cast: quill, kid:surprised, stranger
checkpoint
~ Chapter Three ~

A soft footstep sounds at the entrance of the chamber, and the hooded figure walks into the light of the crown. It carries a staff with a small lantern at its head, and it needs no thread, because it moves through the labyrinth the way you might move through your own kitchen in the dark.

Aurek presses himself even flatter against the wall. He is too frightened to speak, but Mira is not.

Kid: Who are you? Walkers always descend in pairs, and nobody else is permitted down here on the Long Tide.

The figure remains silent for a long moment. Then it raises one hand and pushes back its hood, and the light of the crown falls across a silver braid and a face that you saw only last night, bent over an untouched cup of tea.
> See who it is -> corr-confess

=== corr-confess
scene: labyrinth
cast: mentor:sad, kid:surprised, minotaur:scared
Magister Corr looks considerably older down here than she did in the great hall, as though the warm light were revealing every one of her years simultaneously.

Mentor: Hello, Aurek. You have not grown at all.

Minotaur: You came with the other Vale, and you held the lantern while she lifted it, and you looked back at me just before the door shut.

Mentor: I did, and I have been looking back ever since.

She turns toward you and Mira.

Mentor: A hundred years ago, I walked this labyrinth with Isaura Vale. We heard Askel's song exactly as you did, we came down here exactly as you did, and Aurek asked us to wait. Isaura insisted that the island could not afford to wait, and I allowed her to persuade me, because I was afraid. I was terrified that if we returned empty-handed, the Gyre would close, the cliffs would collapse, and every student in the Cloister would be lost, and that it would all be my fault.

Her knuckles have turned white around the staff.

Mentor: So I followed you tonight, because I am still afraid of precisely the same thing, and because I could not bear to watch another walker do what I did without at least explaining what it costs.
? RL.3 : What drives Magister Corr to follow you into the labyrinth?
+ Fear for the island's safety, tangled up with guilt over her choice.
- A plan to steal the crown and keep its power for herself.
- Curiosity about whether the labyrinth has changed.
- Orders from the Cloister's council to test the walkers.
hint: She says she is "still afraid of precisely the same thing" and that she "could not bear to watch."
next: mira-choice

=== mira-choice
scene: labyrinth
cast: quill, kid:angry, mentor:sad
Mira steps between the Magister and the plinth, her fists clenched at her sides.

Kid: So my great-grandmother took it, and you allowed her to, and the frieze calls it a victory, and the entire Cloister has been cheering a theft for a thousand years. Wonderful. What exactly are we supposed to do now? If we climb back up without the crown, the Gyre closes in, which you said yourself, so should I let everyone I know be swept into the sea so that one creature can keep his hat?

Aurek flinches at the word "creature," and Mira sees him flinch, and some of the anger drains out of her face, although not all of it.

Mentor: I do not know what you should do. I know only what I did, and that I have regretted it for a hundred years.

Both of them turn to you. The crown glows on its plinth, close enough to touch, and behind it Aurek watches you with eyes that have witnessed this moment many times before and expect it to end in exactly the same way.

Quill: Whatever you choose, choose it with your eyes open, which is all that anyone can ask and considerably more than most walkers have managed.
> Take the crown, as the Frieze commands -> take
> Ask Aurek what he wants -> ask-tavi

=== take
scene: labyrinth
cast: quill:sad, kid:sad, minotaur:sad
You step past Mira and lift the crown from its plinth. It is lighter than you expected and fiercely warm, like a mug of cocoa held on a winter morning, and for one dizzying moment you understand completely why Oren did it, and why Isaura did it, because holding it feels like being the hero of every story simultaneously.

Aurek does not resist. He merely lowers his head and walks back to the wall, and as you leave the chamber, the bronze door at the far end of the corridor swings shut behind him with a soft and final sound.

By the time you climb out onto the headland, the crown has already cooled from a coal to an ember. The Cloister cheers, the Gyre steadies, and the stonemasons begin measuring the frieze for your name, but every night that week the crown grows a little dimmer, and you can feel, in a way you cannot quite explain, that its warmth is only on loan. The Magister will not meet your eyes, and Mira stops coming to meals.

Quill: Power that is taken is only borrowed, and the debt always comes due eventually. Let us return to the heart of the labyrinth and ask the question that nobody has ever asked.
end: lose The Borrowed Crown

=== ask-tavi
scene: labyrinth
cast: quill, minotaur:surprised, kid
You set down your lantern, crouch so that your eyes are level with Aurek's, and ask him what he wants.

The chamber becomes so quiet that you can hear the sea moving somewhere far above. Aurek blinks his enormous eyes at you, and then at Mira, and then at the Magister, as though he suspects some kind of trick.

Minotaur: Nobody has ever asked me that before, not Oren, not the Vales, not anyone at all.

He gazes up toward the shadows of the ceiling.

Minotaur: I want to see the sky. I want to keep the island's heart warm, because that is what I am for, and I would give the crown gladly to anyone who asked for it instead of grabbing it; I would give it for good. I simply do not want to give it from behind a locked door.

Quill turns to you with a distinct gleam in her eye.

Quill: You have now heard the same idea from two very different sources, one of them a creature who has waited a thousand years, and the other a song that shepherds taught to the birds.
? RL.1 : Which line from Askel's song best supports asking Aurek first?
+ "A crown that's given glows for good"
- "Ysolde spun a thread of red by lamplight"
- "He told the island braver words"
- "Oren followed the red thread down"
hint: Which line compares a crown that is given with a crown that is taken?
next: word

=== word
scene: labyrinth
cast: quill, mentor:sad, kid
Magister Corr sinks down onto the straw with her staff across her knees, and for the first time she resembles less a teacher than an exhausted student who has been studying the same difficult lesson for a century.

Mentor: The frieze calls Oren a king and a hero, but he seized a crown that was never his to claim, and he occupied a throne that was not his to take. There is an old word for a person who does that, and the word is usurper. I have spent a hundred years refusing to pronounce it, because if Oren was a usurper, then so was Isaura, and so was I.

Mira opens her mouth, and then closes it again without speaking.

Quill: Words carry weight, and that particular word is heavier than most. Before we decide what to do with it, let us be certain that we understand exactly what it means.
? L.4 : Based on the Magister's words, what is a "usurper"?
+ Someone who wrongfully seizes power that belongs to another.
- Someone who protects a crown for its rightful owner.
- Someone who carves stories into stone for a living.
- Someone who travels to faraway places to find treasure.
hint: She explains it herself: someone who "seized a crown that was never his to claim."
next: mira-loyal

=== mira-loyal
scene: labyrinth
cast: kid:sad, mentor, minotaur
Mira unpins the sunburst brooch from her robe and holds it in her open palm, and you realize that it is the Vale family crest, the very sunburst that blazes above Oren's head on the frieze.

Kid: My whole life, I have been told that being a Vale means being bold, which meant walking down here, taking whatever was waiting, and climbing back up to the cheering. I believed that being loyal to my family meant being loyal to that story.

She closes her fingers around the brooch.

Kid: But Isaura was afraid, and Oren never asked, and I do not think that loyalty to someone means repeating their mistakes. I think it might mean repairing them, and if the Vales did the taking, then perhaps a Vale can do the asking.

She slips the brooch into her pocket instead of pinning it back onto her robe, and she turns to Aurek.

Kid: Will you come up with us? Not as a prisoner and not as a prize, but simply to see the sky.

Aurek studies the open doorway for a very long time. Behind him, low on the wall, the little carved spiral catches the warm light of the crown.
> Open the way for Aurek to climb to the sky -> climb
> Press the small spiral carved on the wall -> loom

# --- secret path (the spiral from the frieze) ---

=== loom
scene: labyrinth
cast: quill:surprised, minotaur:surprised, mentor:surprised
You kneel and press your palm against the spiral. It sinks into the wall with a quiet click, and a section of stone slides aside to reveal a low, narrow room that none of you knew existed, not even Aurek.

Inside stands an ancient wooden loom, and on it hangs a tapestry woven entirely in shades of red. It depicts a girl spinning thread by lamplight, a young man following it downward, a horned child weeping beside a glowing crown, and a key turning in a gate. Then it shows something the song never mentioned: the same girl, older now, descending alone, sitting beside the horned child in the straw, and patiently teaching him to weave. Beneath the images, in faded thread, a line of words has been stitched: "I could not unlock the door, but I could make certain that he was not alone, and that someone, someday, would know the true story."

Aurek touches the tapestry with one careful finger.

Minotaur: Ysolde used to visit me. I thought I had only dreamed her.

The final row of the tapestry is unfinished, and the shuttle still rests among the threads, as though Ysolde had merely stepped out for a moment, a thousand years ago.
> Finish the last row together -> weaver-end

=== weaver-end
scene: academy-hall
cast: quill:happy, minotaur:happy, kid:happy
Together, the four of you complete the final row of Ysolde's tapestry, with Mira passing the shuttle, the Magister guiding your hands, and Aurek choosing the colors, which turn out to be every color of the sky. When the last knot is tied, the tapestry glows, and the entire labyrinth seems to breathe out.

You carry the tapestry up into the dawn with Aurek walking beside you. In front of the whole Cloister, Aurek takes the crown and places it gently on the stone cushion in the great hall, where it blazes up warmer and brighter than anyone alive has ever seen it, and the Gyre outside the windows softens from storm to a slow, shimmering mist that remains that way.

The tapestry is hung beside the frieze, so that every student who reads the stone must also read the thread. Askel sings the Shepherd's Song in the great hall for the first time, and on this occasion he adds a new verse at the end, about a weaver who refused to allow the true story to be forgotten.

Quill: The frieze told the story of the one who won, and the song told the story of the one who was wronged, but the tapestry told the story of the one who stayed, and I suspect that may be the truest version of all.
end: secret The Weaver's Version

# --- main path ---

=== climb
scene: temple-ruins
cast: minotaur:happy, griffin, sphinx:happy
You lead the way back along the red thread, winding it up as you go, with Mira on one side of Aurek and Magister Corr on the other. Aurek carries the crown in both hands, as carefully as if it were brimming with water, and when you reach the bronze door, the first gray light of dawn is spilling down the stone stairs and the tide is just beginning to return.

Aurek steps out onto the rocks and looks upward. The sky is pale pink and gold, and the last stars are fading one by one, and he makes a sound that is half a laugh and half something else entirely.

Minotaur: It is so much bigger than the ceiling.

On the headland, the whole Cloister has fallen silent. Ashaya the sphinx rises from her marble slab and bows her head, low and slow, to the creature whose door she has guarded for a thousand years, and Askel lands on a broken column and folds his silver wings.

Griffin: I have waited my entire life to see a walker come up with something other than a crown.

Sphinx: Then I shall ask one final question, since you appear to enjoy them. Every story keeps a heart hidden inside it, so tell me what this one has been trying to say.
? RL.2 : Which statement best expresses a theme of this story?
+ Power seized by force fades, but power freely given can endure.
- The strongest person always deserves to rule over the weak.
- Old stories should be forgotten because they are never true.
- It is safer never to ask questions about your family's past.
hint: Remember Aurek's words, "If I give it to someone, it warms them for always," and the last line of the song.
next: finale

=== finale
scene: academy-hall
cast: quill, mentor:happy, minotaur:happy
In the great hall, before every student of the Aster Cloister, Aurek walks to the head of the room and turns to face you. He holds out the crown, and you understand that he is not surrendering it but giving it, which is an entirely different thing.

You take it from his hands and set it on the stone cushion together. The moment it touches the stone, it blazes so warmly that every floating lantern in the hall flares gold, and through the tall windows you watch the Gyre soften from a ring of storms into a slow, glimmering mist that conceals the island just as effectively and frightens no one at all.

Magister Corr summons the stonemasons. The chipped final panel of the frieze is to be carved at last, and she asks you to compose its words, a single sentence to be read by every walker who comes after.

Quill: A semicolon is a hinge between two complete thoughts, so make certain that this one swings the right way.
? L.2 order : Build the new inscription for the frieze, one phrase at a time.
1 The crown that Oren took by force,
2 Aurek gave by choice;
3 and so it glows for good,
4 not merely for a while.
hint: Start with what Oren did, then what Aurek did, then put the result after the semicolon.
next: win-end

=== win-end
scene: academy-hall
cast: quill:happy, kid:happy, minotaur:happy
The new panel is completed by midsummer. It shows no sword and no monster, only two students, an elderly woman with a lantern staff, and a horned boy holding a crown up toward the sky. Mira's name is carved there after all, although not in the manner she once imagined, and she insists that she prefers it this way.

Aurek takes a room in the Cloister's east tower, where the windows face the sunrise, and he attends lessons in history, at which he is extraordinarily good, since he personally remembers most of it. Magister Corr now teaches the Renewal differently, beginning every year with both versions of the myth placed side by side and concluding with a question instead of a commandment.

The bronze book glows in your hands, and the great hall folds gently back into the Arcade Library. Quill returns the book to its shelf, where its title has quietly changed to "The Crown That Was Given."

Quill: Every myth is somebody's decision about what to remember. The bravest thing a reader can do is ask who made that decision, and whether it is time to make a different one.
end: win The Given Crown
