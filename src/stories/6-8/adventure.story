title: The Dragon of Ember Pass
author: SpiderBen10's Arcade
genre: adventure
band: 6-8
cover: mountain-pass
blurb: A blizzard is two days away, the medicine is stuck past the mountain, and everyone says a dragon blocked the road.
start: start

# ============================================================
# CHAPTER ONE: THE ROAD IS CLOSED
# ============================================================

=== start
scene: village
cast: hero, mayor:sad, quill
checkpoint
clue: A rockslide blocked the road over Ember Pass, trapping the medicine wagon on the far side.
clue: A blizzard will close the pass for the whole winter in two days.
~ Chapter One ~

Snowflakes are already drifting over the mountain village of Brindlewick when Mayor Odette Crumb climbs onto the frozen fountain to address the crowd.

Mayor: Three days ago, a rockslide blocked the road over Ember Pass, and the wagon carrying our winter medicine is stuck on the other side. The weather watchers say a blizzard will close the pass completely in two days. Worse, the wagon driver swears he saw a dragon on the mountain.

The crowd gasps, and somebody faints dramatically into a snowbank.

Quill: Hoo. Somebody must cross that mountain and bring the medicine home, and I suspect that somebody is standing right beside me.
> Visit the healer's house first -> healer
> Go straight to the mapmaker's shop -> mapshop
> Meet the knight at the village gate -> knight-first

=== healer
scene: village
cast: hero, kid:sad, quill
clue: Mira's little brother Tobin is one of the sick children waiting for the medicine.
The healer's cottage smells of peppermint and wood smoke, and six small cots are lined up beside the fire. In the nearest one, a boy with flushed cheeks is sleepily counting the ceiling beams.

That is Tobin, the little brother of your friend Mira Holt, who sits beside him holding his hand.

Kid: Healer Nell says his fever is not dangerous yet, but she has run out of willowbark tonic, and the new supply is on that wagon.

Healer Nell leans over the cot and speaks quietly. She says the fever will not wait forever, and neither will winter, but she has seen this village survive worse, and with brave helpers it will survive this too.
? RL.4 : Which words best describe the tone of Healer Nell's words?
+ Urgent but hopeful
- Silly and playful
- Angry and blaming
- Bored and uninterested
hint: Nell warns that the fever and winter will not wait, but she also says the village will survive. What two feelings does that mix?
next: mapshop

=== mapshop
scene: village
cast: hero, kid, quill:thinking
clue: Mira brought Hattie Fenwick's old guidebook to Ember Mountain.
Mira is an apprentice mapmaker, and her shop is a cheerful disaster of ink bottles, rolled charts, and a globe that squeaks whenever it spins. She pulls a battered leather book off the highest shelf.

Kid: This is the Field Guide to Ember Mountain, written by Hattie Fenwick, the greatest explorer this village ever produced. If anyone knows a way over the mountain, she does.

She flips to a page marked with a faded ribbon and reads aloud. According to Hattie, in deep winter the pass becomes impassable, because the snow piles higher than a house and not even the mountain goats can get through.

Quill: So the word itself contains a warning, if you look carefully at its parts.
? L.4 : The prefix im- means "not." What does "impassable" mean?
+ Impossible to travel through or cross
- Easy to travel through quickly
- Crowded with too many travelers
- Located very far away from the village
hint: Break it apart: im- (not) + pass + -able (able to be). Hattie says not even goats can get through.
next: gate

=== knight-first
scene: village
cast: hero, knight:happy, quill
clue: Sir Bartholomew Plum wants to fight the dragon.
At the village gate, a knight in extremely shiny armor is polishing an enormous sword while admiring his own reflection in it.

Knight: Sir Bartholomew Plum, at your service! I have heard there is a dragon on the mountain, and I intend to defeat it before lunch, or possibly before dessert.

Quill: Have you ever actually met a dragon, Sir Plum?

Knight: Not personally, but I have read several paintings of them. They are enormous, wicked, and they smell like burnt toast.

At that moment, a mouse scurries across the cobblestones, and Sir Plum leaps onto a barrel with a squeak that sounds suspiciously like a teakettle.

Knight: I was merely testing my reflexes.
> Wait for Mira at the gate -> gate

=== gate
scene: village
cast: knight, kid, quill
clue: Sir Plum boasts loudly but is frightened of small things.
Everyone gathers at the village gate as the afternoon light fades. Mira has packed ropes, lanterns, and Hattie's guidebook, while Sir Plum has packed a trumpet-shaped brass horn, three spare capes, and a hand mirror.

Knight: When the dragon hears my mighty horn, it will flee in terror! I am quite possibly the bravest knight in the kingdom, and I have a certificate to prove it.

Kid: Did you get that certificate for bravery or for polishing?

Knight: That is completely irrelevant.

Quill notices that the knight keeps glancing up at the dark mountain and gulping, and that his armor rattles slightly even though there is no wind.
? RL.3 : What do Sir Plum's words and actions reveal about him?
+ He boasts about bravery to hide that he is actually nervous.
- He is a quiet knight who dislikes attention.
- He has fought many dragons and fears nothing.
- He does not want to help the village at all.
hint: Compare what Sir Plum says with what Quill notices: the gulping and the rattling armor.
next: guidebook

=== guidebook
scene: village
cast: hero, kid:thinking, quill
clue: Hattie's rule: "When the ravens fall silent, the snow is ready to fall. Walk softly and speak in whispers."
clue: Hattie's rule: "A dragon that hides its face is frightened, not fierce."
clue: Hattie's rule: "Cross the Glass Bridge only in the morning. Once the afternoon sun has warmed it, the ice turns as weak as sugar."
Before you leave, Mira opens the guidebook to a page titled Four Rules for Staying Alive on Ember Mountain, and she reads them slowly so everyone can remember.

"First, when the ravens fall silent, the snow is ready to fall, so walk softly and speak in whispers. Second, a dragon that hides its face is frightened, not fierce. Third, cross the Glass Bridge only in the morning, because once the afternoon sun has warmed it, the ice turns as weak as sugar. Fourth, the Goat Stair is slow, but slow feet still reach home."

Quill: Those rules are worth more than a hundred swords.

There are two trails to the foot of the pass, a shadowy forest trail and a windy river gorge.
> Take the forest trail -> forest
> Take the river gorge -> gorge

=== forest
scene: forest
cast: hero, parrot:happy, quill
clue: Pepper the mail parrot will carry messages between you and the Mayor.
The forest trail winds between enormous pine trees whose branches sag under heavy loads of snow. Halfway along, a bright green parrot lands on your shoulder, nearly knocking Quill off the other one.

Parrot: Pepper the mail parrot, reporting for duty! The Mayor says to send messages with me! Messages with me! Squawk!

Quill: Delightful. A feathered assistant who repeats everything twice.

Pepper explains that she can fly back to Brindlewick with any message in less than an hour. Then she stuffs her head under her wing and falls asleep on your shoulder, snoring gently, which is surprisingly heavy for such a small bird.

Behind you, you hear a metallic crash, followed by a long, dramatic groan.
> See what happened to Sir Plum -> snowbank

=== snowbank
scene: forest
cast: hero, knight:scared, kid:happy
Sir Plum has tripped over a buried root and landed headfirst in a snowbank, so that only his armored legs are sticking out, kicking wildly like an upside-down beetle.

Knight: I meant to do that! I am inspecting the snow for dragon tracks!

Mira laughs so hard that she has to sit down on a log. Together, you each grab one of the knight's boots and pull until he pops free with a sound like a cork leaving a bottle, and his helmet is stuffed completely full of snow.

Knight: Thank you. Although, of course, I would have escaped on my own eventually, perhaps sometime in the spring.

For the first time, he smiles at you like a friend instead of an audience.
> Continue to the foot of the pass -> foot

=== gorge
scene: mountain-pass
cast: hero, kid:surprised, quill
clue: Huge dragon tracks lead up the gorge toward the rockslide, not toward the village.
The river gorge is loud and windy, and icicles as long as spears hang from the cliffs on either side. Near a frozen waterfall, Mira suddenly grabs your sleeve and points at the snow.

Kid: Look at those tracks. They have to be dragon tracks, because they are as wide as a wagon wheel.

The enormous footprints are several days old and partly filled with fresh snow. What surprises you is their direction, because they do not lead down toward Brindlewick. Instead they head straight up the mountain toward the rockslide, as if the dragon had been hurrying there.

Quill: Interesting. A creature attacking a village would walk toward the village, would it not?
> Continue to the foot of the pass -> foot

=== foot
scene: mountain-pass
cast: hero, knight, quill
By sunset you reach the foot of Ember Pass and make camp beneath an overhanging rock. Mira cooks soup over a small fire, while Sir Plum practices fierce faces in his hand mirror.

Quill: Before we sleep, let us summarize our journey so far, which will help us remember what matters.

You think back over the day. A rockslide blocked the road, and the medicine wagon is trapped beyond it. A blizzard will close the pass in two days, and the sick children, including Mira's brother, need that medicine. Your group set out with Hattie Fenwick's guidebook and her four rules, and now you are camped at the foot of the pass.
? RL.2 : Which is the best objective summary of Chapter One?
+ A team sets out over the pass to bring back the trapped medicine.
- Sir Plum is the funniest and bravest knight in the whole kingdom.
- The dragon attacked Brindlewick and stole all of the medicine.
- The group decides it is much too dangerous and goes home.
hint: An objective summary tells the main events without opinions. Which choice matches what actually happened?
next: chapter2

# ============================================================
# CHAPTER TWO: THE DRAGON'S PASS
# ============================================================

=== chapter2
scene: mountain-pass
cast: hero, knight, kid
checkpoint
~ Chapter Two ~

At dawn you begin climbing the steep, winding road toward the top of Ember Pass. The air grows thinner and colder with every switchback, and your breath hangs in front of you like little ghosts.

Dozens of black ravens circle overhead, cawing and squabbling noisily about something only ravens understand.

Knight: Even the birds are announcing my arrival, which is extremely appropriate.

Kid: I think they are mostly complaining about your singing, actually.

Sir Plum has been humming a heroic song since breakfast, and it has at least forty verses, every one of them about himself. Ahead, the road curves beneath a steep slope that is loaded with a thick, overhanging shelf of snow.
> Keep climbing toward the snowy slope -> ravens

=== ravens
scene: mountain-pass
cast: hero, knight:happy, quill:scared
clue: The ravens went silent beneath the overhanging snow.
As you step beneath the overhanging snow, something strange happens. The ravens stop cawing, all at once, and settle silently on the rocks to watch you.

The whole mountain is suddenly so quiet that you can hear the snow creaking above your head.

Knight: Aha! This silence means the dragon is near. I shall blow a mighty blast on my horn to frighten the beast away before it can attack!

He raises the enormous brass horn to his lips and fills his cheeks with air, until his face turns the color of a ripe tomato.

Quill flaps anxiously, glancing from the silent ravens to the heavy shelf of snow hanging above you.
> Let Sir Plum blow his horn -> lose-avalanche
> Stop him and tiptoe past quietly -> tiptoe

=== lose-avalanche
scene: mountain-pass
cast: hero:sad, knight:scared, quill:sad
Sir Plum blows a tremendous blast on his horn, and for one moment nothing happens. Then, with a deep rumble, the shelf of snow above you breaks loose and slides down across the road.

Everyone scrambles back just in time, and nobody is hurt, but the road ahead is buried under a wall of snow taller than a house.

It takes a village rescue team with sledges a full day to reach you, and by then the blizzard has arrived and the pass is closed for the winter. Healer Nell will have to manage with herbs and patience until spring.

Quill: The silent ravens were warning us, exactly as Hattie wrote. We should have walked softly.
end: lose Buried Trail

=== tiptoe
scene: mountain-pass
cast: hero, knight:surprised, quill
You grab the horn and shake your head firmly, pointing at the silent ravens and then at the snow. Mira whispers Hattie's first rule into Sir Plum's ear, and his tomato-colored face slowly turns pale.

Together you creep beneath the overhang, one careful step at a time. The mountain seems to hold its breath, and not a single raven moves until you are safely past.

Behind you, a small lump of snow slides off the shelf and lands with a soft thump exactly where you were standing a moment ago.

Knight: Perhaps I shall save my horn for a birthday party.

Quill: That would be wise, and the guests would probably prefer it.
? L.5 : What does "the mountain seems to hold its breath" suggest?
+ Everything was tense and silent, as if waiting for something.
- The mountain is actually alive and breathing like a person.
- The wind was blowing very loudly across the pass.
- The group had run out of air to breathe.
hint: This is personification. When a person holds their breath, how do they feel, and how much noise do they make?
next: summit

=== summit
scene: mountain-pass
cast: hero, kid:surprised, quill
clue: From the summit you can see the rockslide, the Glass Bridge, and the Goat Stair.
The trail finally levels out, and you find yourself standing near the summit of Ember Pass, where the whole world seems to spread out beneath your boots. Far below, Brindlewick looks like a scattering of toy houses, with thin threads of chimney smoke rising into the pale sky.

Mira unrolls a map and points out the landmarks one by one, because a mapmaker never wastes a good view.

Kid: That enormous pile of boulders is the rockslide. The shining arch over that gorge is the Glass Bridge, and the zigzag scratches down that cliff are the Goat Stair.

To the north, a bank of dark gray clouds is creeping over the peaks like a spill of ink across a page. Near the rockslide, something is smoking.
> Head toward the smoke -> cave-mouth

=== cave-mouth
scene: cave
cast: hero, knight:angry, quill
clue: Smoke curls from a cave near the top of the pass.
Near the top of the pass, beside the enormous rockslide that blocks the road, a thin curl of smoke drifts out of a dark cave. Something inside the cave shifts, and a pile of stones clatters loudly.

Sir Plum draws his sword with a shaky flourish, and it gleams in the pale morning light.

Knight: At last! The fiend is cornered in its lair. Follow me, and we shall charge in together, shouting as loudly as possible!

Quill: Or we could remember that we do not actually know anything about this dragon yet, except for rumors.

Mira points silently at the rockslide beside the cave, where something about the tumbled boulders does not look quite natural.
> Charge into the cave with Sir Plum -> lose-charge
> Look closely at the rockslide first -> clues
> Walk in slowly and speak calmly -> cinder

=== lose-charge
scene: cave
cast: hero, knight:scared, quill:sad
You and Sir Plum charge into the cave, yelling as loudly as you can, while the knight waves his sword over his head.

A huge, frightened shape explodes past you in a whirl of wings and smoke, knocking Sir Plum's helmet off. By the time you stumble outside, the dragon is limping away across the high peaks, where nobody could ever follow.

You spend the rest of the day trying to shift the rockslide by hand, but the boulders are far too heavy. When the first flakes of the blizzard begin to fall, you have no choice except to turn back without the medicine.

Quill: We charged at a creature we did not understand, and we lost the only help this mountain had to offer.
end: lose The Knight's Charge

=== clues
scene: mountain-pass
cast: hero, kid:thinking, quill
clue: Claw marks scrape the boulders, and stones are stacked neatly beside the road.
clue: The snow on the rockslide has been melted away in patches, as if by warm breath.
You crouch beside the rockslide and study it carefully. Deep claw marks scrape the boulders. Several stones are stacked neatly beside the road. In a few places, the snow on the rocks has been melted away in patches, as if by warm breath.

Kid: Someone has been digging here, and I do not think it was a very small someone.

Quill: A dragon who wanted to block the road would not bother stacking the stones so tidily. It looks as though somebody has been trying to clear it.

From inside the cave, you hear a small, sad sound, something between a whimper and a sigh.
? RL.1 : Which evidence best supports the idea that the dragon was trying to clear the road?
+ "Several stones are stacked neatly beside the road."
- "A thin curl of smoke drifts out of a dark cave."
- "Sir Plum draws his sword with a shaky flourish."
- "The wagon driver swears he saw a dragon on the mountain."
hint: Look for the sentence that shows someone moving the rocks out of the way, not just being near them.
next: cinder

=== cinder
scene: cave
cast: dragon:scared, knight:angry, quill
clue: The dragon hid her face under her wing, which Hattie says means she is frightened.
Inside the cave, curled around a heap of scorched blankets, is a dragon about the size of a hay wagon, with copper scales and a smoky tail. As soon as she sees you, she hides her face beneath one wing and trembles.

Knight: Aha! The cunning fiend hides its terrible eyes to lull us into a trap!

Quill: Or perhaps she is following Hattie's second rule exactly, since a dragon that hides its face is frightened, not fierce.

The dragon peeks out from beneath her wing, and a tiny puff of worried smoke escapes her nose.

Dragon: Please do not shout at me. Everyone keeps shouting at me, and I only wanted to help.

Sir Plum's sword droops with a confused clank.
? RL.6 : How do the different views of the dragon create humor in this scene?
+ Plum thinks she is plotting, but readers know she is just scared.
- Everyone agrees that the dragon is dangerous and cruel.
- The dragon is secretly laughing at the knight's armor.
- The knight and Quill both believe the dragon is a trap.
hint: Compare what Sir Plum says about the dragon with Hattie's rule and with what the dragon herself says.
next: cinder-story

=== cinder-story
scene: cave
cast: hero, dragon:sad, quill
The dragon's name is Cinder, and once she stops trembling, she tells you what really happened on the night of the rockslide.

Dragon: Three nights ago, the ground shook while I was sleeping, and I heard rocks thundering down the mountain. When I flew out to look, the road was buried, and a wagon was trapped on the far side. So I began digging, as fast as I could, to clear a path for it. But the driver looked up, saw me, and ran away screaming "Dragon!" all the way down the mountain. Then, while I was still digging, a falling rock struck my wing, and now I cannot fly very far at all.

She stretches out her left wing, which is bent and bruised.
? RL.5 order : Put the events of Cinder's flashback in the order they happened.
1 The ground shook while Cinder was sleeping.
2 Rocks buried the road and trapped the wagon.
3 Cinder began digging to clear a path.
4 The driver saw her and ran away screaming.
5 A falling rock struck Cinder's wing.
hint: Cinder tells the story in time order. Look for "three nights ago," "when I flew out," "so I began digging," and "then."
next: wing

=== wing
scene: cave
cast: dragon, knight:sad, kid:happy
Mira kneels beside Cinder and gently wraps the bruised wing with strips of cloth, using the same knots she uses to tie her rolled-up maps. Cinder winces but holds perfectly still.

Sir Plum stands awkwardly at the edge of the cave, and then, very slowly, he removes one of his three spare capes and lays it over the dragon's shoulders like a blanket.

Knight: I suppose it is rather cold up here, even for a dragon.

Dragon: Thank you, Sir Knight. Nobody has ever given me a cape before.

Kid: Now that I think about it, nobody has ever given Sir Plum a thank-you before, either.

The knight turns pink and pretends to be extremely interested in the ceiling.
> Rest in the cave for the night -> chapter2-end

=== chapter2-end
scene: cave
cast: hero, dragon:happy, quill
That night, everyone sleeps in the cave, warmed by Cinder's glowing scales, which crackle softly like a fireplace. Sir Plum snores. Cinder snores too, and occasionally her snores produce tiny smoke rings that float out into the stars.

Quill: Before you drift off, think about everything that happened today. The village feared a monster, the wagon driver ran from a monster, and Sir Plum came to fight a monster. But when we looked carefully and listened, the monster turned out to be a frightened helper with a hurt wing.

You pull your blanket closer and watch the smoke rings disappear into the darkness.
? RL.2 : Which theme is developing in Chapter Two?
+ Fear can make us see a monster where there is really a friend.
- Dragons are always more dangerous than they appear.
- Knights should always blow their horns in the mountains.
- It is best to avoid talking to anyone who looks different.
hint: Think about how the village, the driver, and Sir Plum saw Cinder, and how she turned out to be.
next: chapter3

# ============================================================
# CHAPTER THREE: HOME BEFORE THE SNOW
# ============================================================

=== chapter3
scene: mountain-pass
cast: hero, parrot:scared, quill
checkpoint
~ Chapter Three ~

In the morning, Pepper the mail parrot comes flapping out of a gray sky with an urgent message from the Mayor, and she is so upset that she forgets to repeat anything.

Parrot: The blizzard is coming early! It will arrive tonight instead of tomorrow!

Quill: Then we must send a reply at once, so the village knows we are still coming.

You decide to write a short note for Pepper to carry. It needs to admit that the road is still blocked, while promising that you will not give up, and it must be one correct sentence that begins with a dependent clause.
? L.1 order : Build the message to the Mayor as a correct sentence.
1 Although the road is still blocked,
2 we
3 will bring
4 the medicine home tonight.
hint: Begin with the "although" clause, which ends with a comma. Then place the subject "we" before the verb.
next: wagon

=== wagon
scene: mountain-pass
cast: hero, dragon, kid
clue: The medicine wagon waits on the far side of the rockslide. The blizzard arrives tonight.
You scramble over the jagged rockslide and find the medicine wagon on the far side, exactly where it was abandoned, with its crates of willowbark tonic still safely packed in straw.

Now you have to get the medicine back across the mountain before tonight's blizzard, and there are several possible routes.

Kid: Cinder could try to clear the rockslide so the wagon can drive through. Or we could carry the crates down Hattie's Goat Stair, which is long but steady. Or there is the Glass Bridge, which is the fastest shortcut of all.

Cinder looks at the sun, which has already climbed past the middle of the sky, and she frowns.
> Ask Cinder to help clear the rockslide -> melt
> Carry the crates down the Goat Stair -> goat-stair
> Take the shortcut over the Glass Bridge -> bridge-approach

=== melt
scene: mountain-pass
cast: dragon:thinking, knight:happy, quill
Cinder breathes a long, steady stream of fire over the rockslide. The rocks themselves do not melt, but the ice that has cemented them together hisses away into steam, and the boulders begin to loosen.

Knight: Stand aside, everyone, because this is a job for a knight!

Sir Plum wedges his enormous sword beneath the largest boulder, using it as a lever, and pushes until his face turns red again. The boulder groans, tilts, and finally rolls aside with a thunderous crash.

Knight: I must confess something. I was terrified of dragons, and I was terrified of mountains, and I am still slightly terrified of mice. But I would rather be frightened and useful than brave and wrong.
? RL.3 : How has Sir Plum changed since the beginning of the story?
+ He admits his fears and uses his strength to help, not to fight.
- He is still boasting and wants to defeat the dragon.
- He has become lazy and refuses to help anyone.
- He has decided that he dislikes Cinder and Mira.
hint: Compare the knight at the village gate with the knight pushing the boulder. What does he confess?
next: melt-done

=== melt-done
scene: mountain-pass
cast: hero, dragon:happy, knight:happy
Working together, Cinder melts the ice, Sir Plum levers the boulders, and you and Mira roll the smaller stones aside, until at last there is a gap wide enough for the medicine wagon to pass through.

Cinder hitches herself to the front of the wagon with Mira's ropes, because the wagon's horses ran away with the frightened driver three days ago.

Dragon: I cannot fly with this wing, but I can certainly still pull.

The knight, who came to fight a monster, is now arguing cheerfully with the monster about which route downhill is the fastest.
? RL.2 : Which theme does the story develop through Sir Plum and Cinder?
+ Working together can turn fear into friendship.
- It is always best to solve problems completely alone.
- Knights and dragons can never truly trust each other.
- Being strong matters more than being kind.
hint: Think about how Sir Plum felt about Cinder at the start and how they are acting now.
next: arch

=== arch
scene: mountain-pass
cast: dragon:surprised, quill:thinking, kid
As the last boulder rolls away, it reveals something that has been hidden for a very long time: an ancient stone arch beside the road, carved with pictures of dragons and villagers standing side by side. At the top of the arch hangs a green bronze bell, and beneath it, words are carved into the stone.

Quill: The inscription is old, but I can still read it. It says, "Ring me, and remember."

Cinder stares at the carvings with wide, shining eyes, as if she has seen something she did not know she was missing.

Kid: The sky is getting darker, though, and the blizzard is coming.
> Hurry home with the medicine -> wagon-ride
> Ring the ancient bell -> secret

=== secret
scene: mountain-pass
cast: dragon:happy, mayor:surprised, quill:happy
You ring the old bell, and its deep voice rolls down the mountain all the way to Brindlewick. From the high peaks, one by one, three more copper dragons appear, gliding down through the snow to land beside the arch.

They are Cinder's family, who had flown away years ago after villagers forgot the old promise carved in the stone. Together they carry the wagon, Sir Plum, and you down the mountain in minutes.

Mayor Crumb meets you at the gate, staring upward in astonishment, while Quill reads her the carved promise that dragons and villagers once shared.

Mayor: Then we shall remember it again, starting tonight.

Tobin gets his medicine, and Brindlewick gets four new neighbors.
end: secret Ring Me and Remember

=== wagon-ride
scene: mountain-pass
cast: dragon:happy, knight:scared, kid:happy
The ride down the mountain is the wildest ten minutes of your life. Cinder pulls the wagon at a gallop, her tail streaming behind her like a copper banner, while the crates rattle and Sir Plum clings to the seat with both hands.

Knight: Perhaps slightly slower, if the dragon would be so kind!

Dragon: This is my slow speed, Sir Knight.

Mira is laughing so hard that she cannot breathe, and Quill has given up flying and is riding inside your hood, where it is warm and considerably less windy.

The first heavy snowflakes begin to swirl around you as the lights of the village appear below.
> Race the storm to the village gate -> win-road

=== win-road
scene: village
cast: hero, mayor:happy, knight:happy
The wagon thunders through the gates of Brindlewick just as the blizzard arrives in earnest. The snow is falling so thickly that you can barely see the lanterns, but the whole village is there to cheer.

Healer Nell hurries the willowbark tonic to the cottage, and within two days Tobin is sitting up and demanding pancakes.

Mayor: Brindlewick owes you, and it owes Cinder even more. From now on, she is welcome here whenever she likes.

Sir Plum has written a new heroic song. It has forty verses, and every single one is about Cinder.
end: win The Dragon Road

=== goat-stair
scene: mountain-pass
cast: hero, kid, knight
clue: Hattie's fourth rule: "The Goat Stair is slow, but slow feet still reach home."
You divide the crates of medicine into packs, and everyone carries as much as they can. Even Cinder carries two crates tied to her back, walking carefully on her strong legs, since her wing cannot lift her.

The Goat Stair is a narrow trail of steps carved into the cliff by mountain goats and explorers long ago. It zigzags back and forth, back and forth, and seems to go on forever.

Kid: Hattie said slow feet still reach home. I hope she meant before the blizzard.

Sir Plum grumbles about the number of steps, but he also carries three crates without being asked, which Mira pretends not to notice.
> Keep going down the Goat Stair -> goat-ledge

=== goat-ledge
scene: mountain-pass
cast: hero, knight:scared, quill
Halfway down, the Goat Stair narrows to a ledge barely wider than your boots, with a long drop into misty nothingness on one side.

Sir Plum freezes, pressing his back against the cliff so firmly that his armor squeaks.

Knight: I do not think knights are designed for ledges.

Quill: Then we will tie everyone together with Mira's rope, so that nobody can fall, and we will cross one step at a time.

You loop the rope around every waist, and Cinder anchors the end with her tail. Step by careful step, with Mira counting aloud, the whole group shuffles across the ledge and onto wider ground on the other side.
> Continue down to the valley -> goat-top

=== goat-top
scene: forest
cast: dragon:happy, kid:happy, quill
The sun is setting and the first snowflakes are falling as you step off the last stair into the pine forest above Brindlewick. Your legs feel like wet noodles, but every crate of medicine is safe.

Kid: The Glass Bridge might have been faster, but I would much rather be slow and home than fast and stuck.

Cinder chuckles, sending a smoke ring up into the falling snow.

Quill: Hattie knew what she was talking about. Nobody rushed, nobody showed off, and everyone helped carry the load.
? RL.2 : Which statement best expresses a theme of this story?
+ Patience and teamwork can succeed where speed and pride fail.
- The fastest route is always the best one to take.
- Only knights are strong enough to complete a quest.
- Explorers' guidebooks are too old to be useful.
hint: Think about Hattie's fourth rule and how the whole group made it down the Goat Stair.
next: win-goat

=== win-goat
scene: village
cast: hero, mayor:happy, quill:happy
You stagger into Brindlewick just as the blizzard begins in earnest, and the villagers rush out with lanterns and blankets to help carry the crates. Healer Nell gives Tobin his first dose of willowbark tonic that very night.

Mayor Crumb declares a festival for the next sunny day, and she insists that Cinder be the guest of honor, although Cinder is too shy to say much and mostly toasts marshmallows for the children.

Mayor: Slow feet still reach home. I think we should carve that above the village gate.

Tobin, feeling better, asks whether dragons can be adopted. Cinder does not say no.
end: win Slow Feet, Home at Last

=== bridge-approach
scene: mountain-pass
cast: hero, kid:scared, quill:thinking
clue: It is afternoon, and water is dripping from the underside of the Glass Bridge.
The Glass Bridge is a natural arch of blue ice stretching across a deep gorge, and it glitters beautifully in the sunshine. It would save you hours.

But when you look closely, you notice that water is dripping steadily from the underside of the bridge, and a thin crack runs along one edge. The sun, which has already passed the middle of the sky, is shining directly on the ice.

Kid: Hattie's third rule was very clear about this bridge.

Quill: Yes, and a good explorer checks what she has read against what she can see.
? RL.1 : Which evidence most strongly shows the bridge is unsafe right now?
+ Hattie says to cross only in the morning, and it is afternoon now.
- The bridge glitters beautifully in the sunshine.
- Crossing the bridge would save the group several hours.
- The bridge is made of blue ice that stretches across a gorge.
hint: Reread Hattie's third rule, then look at where the sun is. Which answer connects the rule to the time of day?
next: bridge-choice

=== bridge-choice
scene: mountain-pass
cast: hero, knight, dragon
Sir Plum taps the bridge with the toe of his boot, and a tiny chip of ice breaks off and tumbles into the gorge. It falls for a very long time before you hear it land.

Knight: I say, it is rather slippery, but we would be home by suppertime.

Cinder shifts nervously on her feet, and her tail curls around the crates as if to protect them.

Dragon: My mother always told me never to trust ice after noon, although I suppose I cannot fly across if anyone falls.

The Goat Stair is still waiting back up the trail, slow and steady. The bridge is right here, shining and fast.
> Cross the Glass Bridge anyway -> lose-bridge
> Go back and take the Goat Stair -> goat-stair

=== lose-bridge
scene: mountain-pass
cast: hero:scared, kid:scared, quill:sad
You step onto the Glass Bridge, and halfway across, a loud crack echoes through the gorge. The ice sags beneath your feet, and everyone scrambles onto a narrow rocky ledge on the far side just as the middle of the bridge collapses with a roar.

Nobody is hurt, but you are stranded on the ledge with no way forward and no way back, while the blizzard closes in.

Cinder limps back to the village for help, and a rescue team reaches you the next morning with ropes and ladders. The medicine crates are safe, but they are stuck on the ledge until the storm passes.

Quill: Hattie warned us about the afternoon sun, and the dripping water warned us too.
end: lose Stranded on the Glass Bridge
