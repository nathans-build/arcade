title: The Harbor Watch Heist
author: SpiderBen10's Arcade
genre: mystery
band: 6-8
cover: museum-hall
blurb: The lights go out for three minutes. A famous gold watch vanishes. Three witnesses, three stories. Who is lying?
start: start

# ============================================================
# CHAPTER ONE: THE LIGHTS GO OUT
# ============================================================

=== start
scene: museum-hall
cast: hero, quill, keeper:scared
checkpoint
clue: The Harbor Watch vanished during a three-minute blackout that began at 9:42 p.m.
~ Chapter One ~

Rain hammers the tall windows of the Millbrook Museum of the Sea, where tomorrow night the new Lighthouse Exhibit is supposed to open, and the most valuable object in the whole collection has just disappeared.

Keeper: At exactly 9:42 the lights went out, and when they flickered back on three minutes later, the Harbor Watch was simply gone!

Mr. Amos Voss, the elderly museum keeper, twists his cap nervously in his hands. The gold watch once belonged to his great-grandfather, the legendary keeper of Gull Point Lighthouse.

Quill: Hoo. Every mystery is a story that somebody is desperately trying to hide, and our job is to read it anyway.

The glass case in the center of the hall stands open and empty, while a security guard by the door scowls at everyone.
> Examine the empty glass case -> case
> Question the guard by the door -> guard-first

=== case
scene: museum-hall
cast: hero, quill:thinking
clue: The case lock was not scratched. Someone opened it with a key.
clue: The empty case smelled faintly of lemon.
You crouch beside the case and inspect the lock, which is neither scratched nor bent, so whoever opened it must have used a key. A faint smell of lemon lingers in the air, like expensive furniture polish.

A small card still rests on the velvet. It reads THE HARBOR WATCH, A MARINE CHRONOMETER, 1908. Beneath that, smaller print explains that sailors once relied on chronometers to keep exact time at sea, because knowing the precise hour helped them calculate where they were on the ocean.

Quill: The Greek word chronos means time. If you combine it with meter, which means measure, what do you get?
? L.4 : Using the card and the word parts, what is a "chronometer"?
+ An instrument that measures time very precisely
- A tool that measures how deep the sea is
- A map that shows where ships have sailed
- A lamp at the top of a lighthouse
hint: Chron- means time and -meter means measure. The card says sailors used it to keep exact time at sea.
next: cat

=== cat
scene: museum-hall
cast: hero, quill:happy, cat
clue: Wet paw prints lead from the case to a heating vent. The museum cat was near the case.
Something moves beneath the case, and a plump orange cat strolls out, licking one wet paw as though nothing in the universe could possibly be her fault.

Quill: Allow me to introduce Biscuit, the museum cat, who has been accused of many crimes, and most of those accusations were entirely accurate.

Biscuit's damp paw prints lead from the case to a warm heating vent, so you kneel down and peer inside. There is no watch, only a sock, three rubber bands, and an extremely ancient cracker.

Biscuit gives you a long, offended stare, the kind that suggests a real detective would have requested permission first.

You laugh in spite of yourself, because Biscuit is a thief of crackers, not of gold watches. Across the hall, the others are gathering.
> Join the others -> lineup

=== guard-first
scene: museum-hall
cast: hero, guard:angry, quill
clue: Only three people have keys to the case: Officer Pike, Mr. Voss, and Dr. Lind.
Officer Dana Pike has shoulders like a filing cabinet and a voice that sounds like one being dragged across a floor.

Guard: I have protected this museum for eleven years, and nothing valuable has ever disappeared while I was on duty, at least not until tonight.

Quill: Pardon me, Officer, but could you tell us exactly who has keys to that display case?

Guard: Three people have keys: me, Mr. Voss, and Dr. Vera Lind, the conservator who cleans and repairs the historical objects down in the basement laboratory.

She taps the ring of keys on her belt, which jingles like a wind chime.

Guard: And before you ask, my keys never left my belt for a single second.

Pike folds her arms and glares at the rainy windows, and you notice that she did not blink even once while she said it.
> Join the others -> lineup

=== lineup
scene: museum-hall
cast: detective:happy, stranger, quill
clue: Detective Grimsby blames the hooded stranger, who slipped out the side door.
The front doors bang open, and a man in a dripping trench coat marches inside as though he personally owns the building.

Detective: I am Detective Horace Grimsby of the city police, and everyone should stand back immediately, because I have already solved this case.

He points a long, bony finger at a figure in a gray hooded coat who is standing alone beside the side door.

Detective: A mysterious stranger, wearing a hood, in the middle of the night, during a robbery! It is completely obvious, and I would happily bet my magnificent mustache on it.

The stranger pulls her hood tighter and slips silently out the side door into the rain.

Detective: You see? Guilty people always run away!

Quill: Or perhaps cold, tired people simply go home. A careful reader never skips straight to the final page of a book.
> Chase the hooded stranger -> chase
> Stay and hear the witnesses -> pike

=== chase
scene: city-street
cast: hero, quill:surprised
clue: The hooded stranger dropped a press badge: Nadia Cole, reporter for the Harbor Gazette.
You burst out into the storm, but the stranger is already halfway down the block, and the rain turns every street lamp into a blurry yellow smudge. You splash after her just as she jumps into a taxi and it pulls away.

Something small is lying in the puddle where she stood, so you pick it up. It is a press badge that says NADIA COLE, HARBOR GAZETTE, REPORTER.

Quill: So she writes for the newspaper, which explains the hood and the hurry, but it certainly does not explain a missing watch.

You tuck the badge into your pocket. A reporter might be secretive about a story, but that does not automatically make her a thief. Dripping and slightly embarrassed, you head back inside to interview the witnesses.
> Go back inside -> pike

=== pike
scene: museum-hall
cast: hero, guard, quill
clue: Officer Pike says she heard footsteps running toward the side door during the blackout.
Officer Pike tells her side of the story first, pronouncing one word at a time, as if she has to pay for each one.

Guard: I was standing by the front desk when the lights died, and it was absolutely pitch black. Then I heard footsteps, fast ones, running across the hall toward the side door, which is exactly where that stranger was standing.

Quill: Could you actually see the person who was running?

Guard: In that darkness I could not see my own nose, but I know perfectly well what I heard.

She nods at Grimsby as though the case is finished, and Grimsby nods back, delighted.

You record it in your notebook: footsteps, running, toward the side door. It sounds simple, but one witness is only one window into a room.
> Hear Theo's side next -> theo

=== theo
scene: museum-hall
cast: hero, kid:scared, quill
clue: Theo heard the elevator ding and its doors close during the blackout. It only goes down to the lab.
Theo Park is a twelve-year-old junior volunteer whose museum badge is pinned upside down on his sweater.

Kid: I was over by the elevator trying to catch Biscuit, because she absolutely hates baths. When the lights went out, she shot right past me, and then I heard the elevator go ding and its doors slide shut.

Quill: Did anyone come out of the elevator?

Kid: No, somebody went in, and from this floor the elevator only travels to one place, which is the basement lab.

Theo glances nervously at Officer Pike before he continues.

Kid: Those footsteps she heard were probably just Biscuit, because that cat runs like a miniature horse.
> Hear Mr. Voss's side -> voss

=== voss
scene: museum-hall
cast: hero, keeper:thinking, quill
clue: During the blackout, only the museum went dark. The streetlights stayed on.
Mr. Voss rubs his tired eyes and speaks slowly, choosing each word with care.

Keeper: I was working in my office with the door closed, and I heard absolutely nothing except the old clock chiming a quarter to ten, right when the lights returned. However, I did notice something peculiar. When the lights went out, I looked through my window and saw that the streetlights were still shining and the bakery sign across the road was glowing.

Quill: So the storm did not knock out the electricity for the entire street, only for this building.

Three witnesses have now told three different stories. Pike heard running footsteps, Theo heard an elevator, and Mr. Voss heard only a clock, although he observed that the only lights that failed were the ones inside the museum.
? RL.6 : How do the witnesses' different points of view add suspense?
+ Each noticed something different, so it is unclear whom to trust.
- They all agree, so the thief is obvious right away.
- They are all lying to protect the hooded stranger.
- Only Quill's point of view matters in a mystery.
hint: Compare what Pike heard, what Theo heard, and what Mr. Voss saw. Do their stories point the same way?
next: keys

=== keys
scene: museum-hall
cast: hero, quill:thinking, guard
clue: The case smelled of lemon, and only three people had keys.
You walk back to the empty case with Quill perched on your shoulder, while across the room Grimsby loudly informs someone on the telephone that the stranger is guilty.

Quill: Let us carefully separate what we actually know from what we are only guessing.

You examine the case one more time. The lock was not scratched, and its key light still glowed green. That tiny light only turns green when the correct key is used, and Officer Pike confirms that exactly three people carry that key: herself, Mr. Voss, and Dr. Vera Lind in the basement laboratory. The glass still smells faintly of lemon.

Guard: I suppose a stranger who wandered in off the street would not have a key, and I will admit that much.
? RL.1 : Which quote best supports the idea that the thief used a real key?
+ "The lock was not scratched, and its key light still glowed green."
- "Grimsby loudly informs someone that the stranger is guilty."
- "The glass still smells faintly of lemon."
- "You walk back to the empty case with Quill on your shoulder."
hint: Which sentence is about the lock itself? Look for the green light that only the right key can turn on.
next: chapter1-end

=== chapter1-end
scene: museum-hall
cast: hero, quill, detective
Quill hops onto the empty case and fluffs up every single feather with great ceremony.

Quill: It is time to summarize the story so far, and I do not mean what we feel or what we suspect, only what actually happened.

Detective: That is extremely easy, because the sneaky stranger stole it and ran away, which proves that I am brilliant.

Quill: That is merely a guess wearing a fancy hat.

You think it through carefully. The lights went out in the museum, and only the museum, for three minutes. The Harbor Watch disappeared from a case that was opened with a key. The witnesses noticed different things, including running feet, an elevator, and a chiming clock. Only three people have keys, and one of them works in the basement.
? RL.2 : Which is the best objective summary of Chapter One?
+ In a blackout, the watch vanished from a case opened with a key.
- Detective Grimsby is a brilliant detective who solved the case.
- The stranger is clearly guilty, since she ran away in the rain.
- Biscuit the cat is adorable and belongs in the exhibit.
hint: An objective summary gives the main events without opinions. Which choice has no opinions or guesses in it?
next: chapter2

# ============================================================
# CHAPTER TWO: DOWN THE ELEVATOR
# ============================================================

=== chapter2
scene: museum-hall
cast: detective:angry, kid, quill
checkpoint
~ Chapter Two ~

Grimsby slams down the telephone with tremendous satisfaction.

Detective: The stranger has a ticket for the midnight train to Kingsbridge, so I am heading to the station to arrest her. Are you coming with me, or are you planning to sniff lemons all night?

Theo tugs your sleeve and whispers urgently.

Kid: Nobody has checked the elevator yet, or where it actually went.

The enormous clock says 10:20, and the train departs at midnight, so you realize you cannot possibly be in two places at once.

Quill: The loudest voice in a room is not always the wisest one, but this decision belongs to you.
> Go with Grimsby to the train station -> station
> Take the elevator down to the lab -> elevator

=== station
scene: train
cast: detective, stranger:angry, quill
clue: The stranger is Nadia Cole, a reporter who spent the evening photographing the museum.
The train station smells of wet coats and hot pretzels, and Grimsby spots the gray hood on the crowded platform and charges toward it.

Detective: Aha! I have finally caught you, you sneaky thief!

The stranger pulls back her hood, revealing a young woman with a camera hanging around her neck.

Stranger: A thief? My name is Nadia Cole, and I write for the Harbor Gazette. I was researching an article about the exhibit, and now I am going home because I am completely soaked and exhausted.

Detective: That is a likely story, because she is sneaky, she is shifty, and she is wearing a suspicious hood!

Quill: She is wearing a hood during a rainstorm, which is exactly what half the city is doing tonight.

Stranger: I photographed the museum all evening, so you are welcome to look for yourself.
> Help Grimsby arrest the stranger -> lose-arrest
> Look at the photos on her camera -> photos

=== lose-arrest
scene: train
cast: detective:happy, stranger:sad, quill:sad
You help Grimsby escort Nadia Cole to the station office. She protests the entire way, while Grimsby telephones every newspaper in town to brag about his brilliant arrest.

It takes two hours to check her story, and every word of it turns out to be true, because she was across the street taking photographs when the lights went out.

By then it is well past midnight. Back at the museum, the basement laboratory is dark and deserted, and whoever really took the Harbor Watch has had plenty of time to vanish into the storm.

Quill: We listened to the loudest witness instead of the evidence. Hoo, I am afraid this case has gone completely cold.

Grimsby is still smiling for a photographer, and he has not even noticed.
end: lose The Wrong Suspect

=== photos
scene: train
cast: hero, stranger, quill:thinking
clue: Nadia's 9:43 photo shows the museum dark except for one glowing basement window, the lab.
Nadia scrolls through her pictures: the museum in the rain at 9:30, the museum at 9:40, and then, at 9:43, the whole building dark, like a candle someone had blown out. But not all of it was dark, because low at one corner, a small basement window glows bright yellow.

Stranger: That is strange, because I did not even notice it.

Quill: That window belongs to the basement laboratory, which means the lab still had electricity during the blackout.

Grimsby squints and grumbles. He called Nadia "sneaky" and "shifty," while Quill describes her as "private," since she simply kept her work to herself until it was finished. The words have nearly identical meanings, but they certainly do not feel the same.
? L.5 : Why does Grimsby call Nadia "sneaky" instead of "private"?
+ "Sneaky" feels negative, showing he already thinks she is guilty.
- "Sneaky" and "private" have exactly the same feeling.
- "Sneaky" is a compliment that shows he admires her.
- He is repeating what Nadia said about herself.
hint: Words can share a meaning but carry different feelings. Which word sounds like an accusation?
next: lab-door

=== elevator
scene: museum-vault
cast: hero, kid, quill
clue: A lemon-scented polishing cloth lay crumpled on the elevator floor.
The elevator is ancient and creaky, with brass buttons and a folding metal gate. Theo presses the button marked B, and the elevator sinks. It groans the whole way down.

Kid: I always think this elevator sounds like a whale with a terrible stomachache.

Something white lies crumpled in the corner, so you pick it up. It is a soft cloth, the kind used for polishing old metal, and it smells powerfully of lemon.

Quill: That is the same lemon scent we noticed at the empty case.

Kid: Dr. Lind uses lemon oil on absolutely everything, because she says it keeps the brass happy.

The elevator shudders to a stop, and the gate rattles open onto a long, dim hallway that ends at a door marked CONSERVATION LAB.
> Knock on the lab door -> lab-door

=== lab-door
scene: lab
cast: hero, scientist:happy, quill
clue: Dr. Lind said she worked by flashlight the whole time and never left the lab.
You step out of the elevator into the basement, and before you can even knock, the laboratory door swings open. Dr. Vera Lind is wearing a spotless lab coat and a warm, friendly smile.

Scientist: You must be the young detective everyone is talking about! This is terrible news about the watch. I was down here the entire time, working by flashlight after the power failed, and I did not hear a thing, because I never left this room. Would you like some tea?

Quill: We have not asked you anything yet.

Scientist: Well, I am simply saving you time, because detectives are extremely busy people.

She laughs a little too long. Her eyes flick toward a gray metal box on the wall before darting back to you.
? RL.3 : What does Dr. Lind's dialogue reveal about her?
+ She is nervous and setting up an alibi before anyone asks.
- She is bored and does not care about the watch at all.
- She is angry that you interrupted her tea.
- She is confused about what happened upstairs.
hint: Quill points out that nobody has asked her anything yet. Why would someone explain before being asked?
next: lab

=== lab
scene: lab
cast: hero, scientist, quill:thinking
clue: The switch marked HALL was clean, but every other switch wore dust.
clue: Dr. Lind's desk lamp was on, though she claimed she worked by flashlight.
The laboratory is crowded with old treasures waiting for repair, including a cracked ship's bell, a rusty sword, and a globe with half of Africa missing. A bottle of lemon polishing oil sits on the workbench.

You notice something else, too. Dr. Lind said she worked by flashlight, but her desk lamp is plugged into the wall and shining brightly, and the flashlight beside it has no batteries.

The gray box on the wall is a fuse box whose little door hangs open, and each switch inside has a label: LAB, VAULT, STAIRS, and HALL. The switch marked HALL was clean, but every other switch wore dust.

Scientist: Please do not touch anything, because these objects are extremely delicate.

She steps in front of the fuse box, still smiling.
> Examine the fuse box up close -> fuse
> Read the notebook on her desk -> notes

=== fuse
scene: lab
cast: hero, quill, scientist:scared
clue: A smudge of lemon oil was on the HALL switch.
You slip around Dr. Lind and lean close to the fuse box, where every switch is covered with the kind of gray, furry dust that settles slowly over many years.

Every switch except one, that is. The switch marked HALL is as clean as a new penny in a dusty drawer, and a faint smudge of lemon oil gleams on its surface.

Quill: Someone flipped that switch very recently, and their fingers had obviously been polishing something.

Dr. Lind's smile wobbles like a picture frame that is about to fall off the wall.

Scientist: I suppose the storm must have tripped it somehow.

Quill: Storms are certainly powerful, but I have never known one to wipe away dust so politely.
? L.5 : The switch was "as clean as a new penny in a dusty drawer." What does this simile show?
+ It stood out because someone had touched it recently.
- It was made of copper, just like a penny.
- Someone was hiding coins inside the fuse box.
- It was the oldest switch in the whole box.
hint: A simile compares two things. Why would a shiny new penny stand out in a drawer full of dust?
next: keeper-story

=== notes
scene: lab
cast: hero, quill, scientist:angry
clue: Dr. Lind's notes say a riddle is engraved under the watch lid: "Where the light turns, the keeper's heart rests."
A leather notebook lies open on the desk, and Dr. Lind's neat handwriting covers the entire page.

"Harbor Watch, restoration notes. Discovered a hidden engraving beneath the inner lid, which appears to be a riddle: WHERE THE LIGHT TURNS, THE KEEPER'S HEART RESTS. Elias Voss definitely hid something at Gull Point, and the museum must not know about it yet."

The final words are underlined three times with heavy, angry strokes.

Scientist: That notebook is private property!

She snaps it shut so forcefully that a pencil jumps off the desk and rolls across the floor.

Quill: It is private, and it is also extremely interesting. Why would anyone keep an important museum discovery secret from the museum itself?

Dr. Lind does not answer, and her face has turned noticeably pale.
> Tell Mr. Voss what you found -> keeper-story

=== keeper-story
scene: lab
cast: hero, keeper:sad, quill
Mr. Voss has come downstairs in the elevator carrying a mug of cocoa for Theo. When he hears what you discovered, he sinks onto a stool and repeats the family story his grandmother once told him.

Keeper: My great-grandfather Elias was the keeper of the Gull Point light. During the great storm of 1911, a fishing boat was drifting toward the rocks, and because the lamp's gears had frozen solid, Elias turned the enormous lamp by hand all night long. The boat made it home safely, and the next spring the grateful town presented him with that gold watch. Years later, he left the watch to our family, along with a note saying the rest was "safe with the light."

He looks up sadly.

Keeper: Unfortunately, nobody in my family ever discovered what "the rest" meant.
? RL.5 order : Put the events of Mr. Voss's flashback in the order they happened.
1 A great storm hit Gull Point in 1911.
2 Elias turned the lamp by hand all night.
3 The fishing boat made it home safely.
4 The town gave Elias the gold watch.
5 Elias left a note: the rest was "safe with the light."
hint: Mr. Voss tells it in time order. Look for "during the great storm," "all night long," "the next spring," and "years later."
next: lind-gone

=== lind-gone
scene: lab
cast: hero, kid:surprised, quill
clue: Dr. Lind rode off with a toolbag toward Gull Point Lighthouse.
While everyone was listening to the old story, nobody was watching the back door, which is now banging loudly in the wind. Dr. Lind's coat hook is completely empty.

Theo runs in, gasping for breath.

Kid: I saw her from the loading dock! Dr. Lind rode away on her bicycle with a heavy toolbag, and she was heading up the coast road toward Gull Point!

Quill: She has the watch, and she must be chasing whatever Elias left "safe with the light." However, opening that secret for herself might be rather like opening Pandora's box.

Kid: Whose box are you talking about?

Quill: It comes from an ancient Greek myth. Pandora opened a box she had been told to keep closed, and every kind of trouble flew out into the world, and she could never put any of it back.
? RL.4 : What does Quill mean by comparing Dr. Lind's plan to Pandora's box?
+ Her curiosity could release trouble that she cannot take back.
- She plans to buy a box at the lighthouse gift shop.
- She plans to share the treasure with the whole world.
- The lighthouse is shaped exactly like a box.
hint: Quill explains the myth right after the allusion. What happened after Pandora opened the box?
next: chapter2-end

=== chapter2-end
scene: lab
cast: hero, quill, keeper
Mr. Voss grabs his car keys with trembling hands, while Officer Pike is already warming up the patrol van outside.

Keeper: My great-grandfather rescued a boat full of strangers because it was the right thing to do, and whatever he hid was never intended for a thief.

Quill: Before we fly away, consider what this chapter has been teaching us. Grimsby was absolutely certain about the stranger from the very first second, and Dr. Lind had a smile and an alibi prepared. But a clean switch, a lemon smell, and a lamp that was shining when she claimed a flashlight told a completely different story.

You nod thoughtfully, because the first impressions shouted the loudest, but the quiet clues were the ones telling the truth.
? RL.2 : Which theme is developing in Chapter Two?
+ Careful attention to evidence beats quick first impressions.
- Detectives should always trust the loudest voice in the room.
- People who smile a lot are usually criminals.
- It is never a good idea to take an old elevator.
hint: Quill compares Grimsby's quick guess with the quiet clues. What lesson connects them?
next: chapter3

# ============================================================
# CHAPTER THREE: THE KEEPER'S LIGHT
# ============================================================

=== chapter3
scene: lighthouse
cast: hero, guard, quill
checkpoint
~ Chapter Three ~

Gull Point Lighthouse rises out of the storm like a white finger pointing at the clouds, while enormous waves crash against the jagged rocks below. At the bottom of the tower, a bicycle lies abandoned on its side in the mud.

Officer Pike stops the van, and she seems to have decided that you are worth listening to after all.

Guard: Tell me exactly what to say on the radio, detective, because headquarters needs one clear sentence describing our plan.

Quill: It should be clear and grammatically correct, since commas matter even during a storm.

You arrange the words carefully in your head. The sentence should begin with the introductory clause and then explain who will do what.
? L.1 order : Build Officer Pike's radio message as a correct sentence.
1 Before the suspect can escape,
2 Officer Pike
3 will block
4 the lighthouse door.
hint: Start with the "before" clause, which ends with a comma. Then put the subject before its verb.
next: gull

=== gull
scene: lighthouse
cast: hero, guard, quill:thinking
The heavy lighthouse door stands open a crack. High above, the great lamp is dark, but a small flashlight beam darts back and forth behind the uppermost windows.

Guard: She is up in the lamp room, and there is only one staircase, which has one hundred and twelve steps.

Quill: There is also a boat dock at the bottom of the cliff, and if she reaches it with the watch, she will disappear forever.

Officer Pike checks her radio while rain drips steadily from the brim of her hat.

Guard: I can guard the door and the dock path so she cannot slip out while you go upstairs. Otherwise, you can charge up there alone right now. It is your decision, detective.

It is the first time she has called you that, and she seems to mean it sincerely.
> Rush up the stairs alone, right now -> stairs
> Plan with Pike: she guards the exits -> plan

=== stairs
scene: lighthouse
cast: hero, scientist:surprised, quill
You race up the spiral staircase, around and around, until your legs are burning and the lamp room door bursts open in front of you.

Dr. Lind spins around, and the Harbor Watch dangles from its chain in her hand, glinting in her flashlight beam.

Scientist: You are remarkably fast, I will admit that. Listen to me carefully. Elias Voss hid something valuable in this tower, something that could be worth a fortune, and the museum would only lock it in another glass box. If you help me find it, we will divide it equally, with half for you.

Through the rain-streaked window behind her, you can see a small motorboat tied to the dock below.

Quill: Be careful, because a person who lies about a flashlight will certainly lie about a promise.
> Take her deal and help her search -> lose-deal
> Refuse, and keep her talking -> stall

=== lose-deal
scene: lighthouse
cast: hero:sad, scientist:happy, quill:sad
Dr. Lind smiles warmly and hands you her spare flashlight.

Scientist: Wonderful! You should investigate the storeroom at the bottom of the tower while I continue searching up here.

You hurry down to the little storeroom, and the moment you step inside, the door slams behind you and a heavy bolt slides shut.

You pound on the door, but through a tiny window you can only watch a flashlight bobbing down the cliff path toward the dock. An engine coughs, then roars, and then fades away into the storm.

Officer Pike discovers you twenty minutes later, but by then the boat has disappeared, and so has the Harbor Watch.

Quill: We trusted a promise instead of the evidence. I am afraid the lighthouse will keep its secret tonight, and so will she.
end: lose Locked in the Storeroom

=== stall
scene: lighthouse
cast: scientist:angry, guard, quill
You refuse her offer, and then you ask her question after question to keep her talking. What is she searching for, why did she use lemon oil, and does the old watch still keep accurate time?

Dr. Lind cannot resist explaining how clever she has been. While she talks, Quill drifts silently out the door and swoops down the stairwell like a gray shadow.

Scientist: And then I simply flipped the breaker, and there were three minutes of perfect darkness, and nobody even suspected that I was the one who...

She stops abruptly, because heavy boots are thumping up the stairs. Officer Pike appears in the doorway, breathing hard, with Quill riding proudly on her shoulder.

Guard: Good evening, Doctor. Nobody is going anywhere tonight.
> Lay out the evidence -> confront

=== plan
scene: lighthouse
cast: hero, guard, quill
Officer Pike positions herself at the bottom of the stairs, where she can observe both the door and the path leading down to the dock.

Guard: Nobody is getting past me, so take your time up there.

Quill: There is no reason to rush now, because a trap works best when it is quiet.

You climb the spiral stairs silently, keeping one hand on the cold iron railing. Wind moans through cracks in the ancient stones, and every step feels like a heartbeat. Through a narrow window you notice a motorboat tied at the dock, bobbing in the waves, which was obviously Dr. Lind's escape plan.

At the top, the lamp room door stands open, and Dr. Lind is kneeling on the floor with the watch, tapping the stones one by one.
> Step into the lamp room -> confront

=== confront
scene: lighthouse
cast: hero, scientist:angry, quill
Dr. Lind stands up and slides the watch behind her back, as though you might not have noticed it.

Scientist: This proves absolutely nothing. Anyone could have taken that watch, including the stranger, the guard, or the old man.

Quill: Then let us examine the evidence together, as carefully as we would read a book.

You go through it step by step. The case was opened with a key, and she had one. Theo heard the elevator descend toward her laboratory. She claimed she worked by flashlight, but her desk lamp was shining. The case smelled of lemon, exactly like her polishing oil. And in her lab, the switch marked HALL was clean, but every other switch wore dust.
? RL.1 : Which evidence most strongly shows that Dr. Lind caused the blackout?
+ "The switch marked HALL was clean, but every other switch wore dust."
- "Anyone could have taken that watch."
- "She laughs a little too long."
- "Theo presses the button marked B, and the elevator sinks."
hint: The blackout came from the fuse box. Which quote is about the switch that controls the hall lights?
next: reveal

=== reveal
scene: lighthouse
cast: hero, scientist:sad, quill
For a long moment the only sound is the rain, and then Dr. Lind's shoulders slowly droop.

Scientist: I discovered the riddle while I was cleaning the watch. For twenty years I have repaired other people's treasures and returned them to glass boxes, and just once I wanted to discover something myself. I told myself it was not really stealing, since nobody even knew the secret existed.

She shakes her head slowly, looking at the floor.

Scientist: But I switched off the lights, I lied directly to a child, and I let Amos Voss believe his family's watch was gone forever. That is not discovery. That is theft.

She presses the watch gently into your hand.
? RL.3 : How does Dr. Lind change once she faces the evidence?
+ She stops making excuses and admits her actions were wrong.
- She blames Officer Pike and tries to run for the boat.
- She laughs and says the watch was hers all along.
- She stays calm and keeps insisting she never left the lab.
hint: Reread her words. Compare "it was not really stealing" with "That is theft."
next: dawn

=== dawn
scene: lighthouse
cast: hero, keeper:happy, quill
Headlights sweep across the rocks as Mr. Voss and Theo come puffing up the stairs, with Grimsby wheezing far behind them, while Officer Pike escorts Dr. Lind down to the van.

Mr. Voss takes the watch in both hands, as gently as if it were a baby bird.

Keeper: My great-grandfather turned this lamp by hand all night to guide strangers home, and he never expected any reward for it.

Grimsby finally arrives, removes his hat, and mumbles that he may have been a teensy bit mistaken about the stranger in the gray hood.

Quill: Elias Voss chose what was right even when it was difficult. Tonight the loud guesses were wrong and the quiet clues were right, and you listened to them anyway.
? RL.2 : Which statement best expresses a theme of the whole story?
+ Doing the right thing matters more than winning a prize.
- Old lighthouses are the best places to hide treasure.
- It is impossible to trust anyone you meet.
- Gold watches always bring bad luck.
hint: Think about Elias turning the lamp for strangers, and Dr. Lind finally giving the watch back.
next: decide

=== decide
scene: lighthouse
cast: hero, keeper, quill:thinking
Mr. Voss turns the watch over in his hands, and it is still warm from yours.

Keeper: Dr. Lind said a riddle is hidden inside the lid, which my family never knew. Should we open it immediately, or should we leave it for the museum experts in the morning?

The rain is gradually easing, and far below, the waves hush against the rocks. Theo is bouncing on his toes, whispering that he would open it in a heartbeat.

Quill: A solved mystery sometimes opens the door to another one. However, there is no shame in resting, either, because you have already accomplished the difficult part.

The tiny latch on the watch glints in the flashlight beam.
> Hand the watch over for the exhibit -> win-exhibit
> Open the lid and read the riddle -> riddle

=== riddle
scene: lighthouse
cast: hero, kid:happy, quill
Mr. Voss nods, so you press the tiny latch, and the inner lid swings open. Engraved in small, elegant letters are the words WHERE THE LIGHT TURNS, THE KEEPER'S HEART RESTS.

Kid: Where the light turns? Maybe it means under the doormat, because that is where my grandmother always hides her spare key.

Quill: Think like Elias. What was the proudest night of his entire life, and what did he turn by hand?

You look around the lamp room. In the center stands the great lamp on its heavy iron turning gear, the same machinery that Elias cranked all night in 1911, and around its base is a circle of old iron plates.
> Search under the doormat downstairs -> doormat
> Check the base of the turning gear -> secret
> Close the lid; leave it for tomorrow -> win-riddle-waits

=== doormat
scene: lighthouse
cast: hero, kid:sad, quill
You all troop down one hundred and twelve steps to the front door and lift the soggy doormat. Underneath it you discover two beetles, one extremely surprised spider, and a bottle cap from 1974.

Kid: Okay, so perhaps it was not the doormat after all.

Quill: The riddle says where the light turns. Does the light turn at the front door, or somewhere considerably higher?

Theo groans and looks up the stairwell, which rises endlessly into the darkness.

Kid: That is another one hundred and twelve steps, unfortunately.

Quill flutters to the first step and looks back at you, waiting patiently. The watch ticks softly in your pocket, as if it is waiting too.
> Climb back up to the turning gear -> secret
> Call it a night and head home -> win-riddle-waits

=== secret
scene: lighthouse
cast: hero, keeper:surprised, quill:happy
You kneel beside the great lamp's turning gear and run your fingers over the iron plates around its base, until you find one plate with a keyhole no bigger than a grain of rice.

The little winding key on the back of the Harbor Watch fits it perfectly.

With a click, the plate lifts. Inside, wrapped in oilcloth, is a small leather logbook containing Elias's own description of the storm of 1911. Tucked between its pages are thank-you letters from every sailor on that fishing boat, along with a crayon drawing of the lighthouse created by one of their children.

Keeper: So "the rest" was safe with the light, and it was never gold at all.

Quill: The most valuable treasures are often made of words.
end: secret The Keeper's Heart

=== win-exhibit
scene: museum-hall
cast: hero, keeper:happy, detective
The next evening, the Lighthouse Exhibit opens right on schedule. The Harbor Watch gleams in its case, which now has a brand-new lock and a brand-new guard, Officer Pike, who salutes you when you walk in.

Nadia Cole, the reporter in the gray hood, writes the front-page story, and the headline says YOUNG DETECTIVE CRACKS HARBOR WATCH CASE. Grimsby is quoted too, claiming he "suspected the truth all along," and Quill rolls both enormous eyes.

Keeper: You gave my family's story its ending back.

Biscuit the cat is sound asleep in an empty display case next door, and nobody has the heart to move her.
end: win Opening Night

=== win-riddle-waits
scene: museum-hall
cast: hero, kid:happy, quill
You yawn so enormously that Quill can count your teeth, and everyone agrees that the riddle can wait for daylight. Mr. Voss locks the watch in the museum safe, and Theo makes you pinky-swear to come back.

A week later, the Harbor Watch is the celebrated star of the Lighthouse Exhibit. Dr. Lind has returned every key she ever held and apologized to Mr. Voss in person, and Theo pins his volunteer badge on right side up for the very first time.

Kid: Next Saturday, it will be you, me, Quill, and the riddle, so do we have a deal?

Quill: A good detective recognizes when a case is closed, and also when a new one is just beginning.
end: win The Riddle Waits
