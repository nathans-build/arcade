title: Sabotage at the Robot Rumble
author: SpiderBen10's Arcade
genre: mystery
band: 6-8
cover: school
blurb: The night before the finals, someone stole the best robot's brain. The clues: glitter, peppermint and a talking parrot.
start: start

# ============================================================
# CHAPTER ONE: THE EMPTY SOCKET
# ============================================================

=== start
scene: school
cast: hero, quill, kid:happy
checkpoint
~ Chapter One ~

The gymnasium at Larkfield Middle School smells like buttered popcorn and overheated electronics, because the semifinals of the Robot Rumble have just ended and the crowd is still cheering for a robot named Rook.

You and Quill are covering the tournament for the school newspaper, the Larkfield Ledger. Rook, a boxy robot about the size of a microwave oven, has just climbed an entire staircase without tipping over, which no other robot in the state has ever managed to do.

Kid: That's our balance code! I wrote it myself, line by line, during the entire summer vacation.

Priya Nandi, the captain of the Gearhounds, is grinning so enthusiastically that her safety goggles slide down her nose. The championship finals begin tomorrow at eleven o'clock.
> Meet Rook up close -> rook-meet
> Watch the judges inspect the robots -> inspection

=== rook-meet
scene: school
cast: quill, robot:happy, kid
Rook rolls over and politely raises one metal arm, as though it is offering to shake hands with you.

Robot: Greetings, reporter. I am Rook, and I am capable of climbing stairs, carrying eggs without breaking them, and identifying four hundred different smells.

Kid: Tomorrow's final challenge is called Sniff Out, where every robot has to locate hidden scent canisters around the gym, so we installed an air sensor. It automatically records every smell it detects, even when Rook is powered down for the night.

Robot: Current smells detected: popcorn, rubber, and extremely nervous seventh graders.

Quill laughs so hard that she nearly topples off your shoulder.

Quill: A robot with a nose and a sense of humor. I suspect we are going to be excellent friends.
> Watch the judges inspect the robots -> inspection

=== inspection
scene: school
cast: hero, scientist, kid:thinking
clue: Dr. Marsh crunches peppermints from a silver tin and tells teams, "Shiny side up!"
At the judges' table, Dr. Celia Marsh is inspecting every robot before it is locked away for the night. She is the head judge, and her company, Marsh Mechanics, sells robot kits to schools all over the country.

She crunches a peppermint from a small silver tin and taps the table impatiently with her pen.

Scientist: Memory chips go in shiny side up, people, shiny side up! I refuse to judge a single robot that has its brain installed backward.

When she reaches Rook, she pauses and studies it balancing on one wheel for an uncomfortably long time.

Scientist: Remarkable. Who wrote this balance code? I would love to take a copy home and study it.

Kid: Thanks, but it isn't finished yet, and honestly, it's sort of our secret weapon.

Dr. Marsh smiles, but the smile never quite reaches her eyes.
> Ask Dr. Marsh about her company -> marsh-chat
> Follow the robots to the lab -> lockup

=== marsh-chat
scene: school
cast: hero, scientist:happy, quill
You flip open your reporter's notebook, and Dr. Marsh straightens her jacket for the interview.

Scientist: Marsh Mechanics kits are used in more than four hundred schools. Our robots can roll, lift, and sort colors beautifully, but unfortunately none of them can climb stairs, at least not yet.

She glances across the gym at Rook and taps her silver mint tin thoughtfully against her palm.

Scientist: Imagine if every kit in the country could do what that little robot does. That would be quite a future, wouldn't it?

She explains that she will present the trophy tomorrow and then rush directly to the airport for a flight at twelve-thirty. Before she excuses herself, she offers Quill a peppermint, which Quill politely declines.
> Follow the robots to the lab -> lockup

=== lockup
scene: lab
cast: hero, keeper:angry, guard
clue: Only three people know the lab's master code: Officer Kimball, Mr. Dunmore, and Dr. Marsh.
clue: The lab's master code changes automatically at midnight.
At six o'clock, the robots are wheeled into Room 114, the robotics laboratory, while Mr. Otis Dunmore, the night custodian, follows them with a mop and a scowl.

Keeper: Tin-can show-offs, every last one of them. They scuff my floors all day long, and then I scrub away their marks all night.

Officer Ruth Kimball, the school's security officer, enters a code on the keypad beside the door, and the lock clicks shut.

Guard: This keypad records every time the door opens. Only three people know tonight's master code: me, Mr. Dunmore, and Dr. Marsh, since she has to set up the arena early. At midnight the code changes automatically, and the new one is printed for me in the morning.
? RL.4 : What does Mr. Dunmore's phrase "tin-can show-offs" reveal about his attitude?
+ He resents the robots and finds them annoying.
- He thinks the robots are clever and admires them.
- He is afraid that the robots might hurt someone.
- He wants to build a robot of his own.
hint: Think about the feeling behind "tin-can" and "show-offs," and what he says about scrubbing marks all night.
next: morning

=== morning
scene: lab
cast: hero, kid:scared, quill
At eight o'clock on Saturday morning, a scream echoes down the hallway. Officer Kimball has just unlocked the laboratory with the new morning code, and you sprint into Room 114 to discover Priya kneeling beside Rook.

The robot is slumped forward like a puppet whose strings have been cut. Its back panel hangs open, the little socket where its memory chip belongs is completely empty, and a sprinkle of silver glitter is scattered across the floor around it.

Kid: Somebody stole Rook's chip! All of the balance code is stored on it, and I never made a copy of the newest version. Without it, Rook can't even stand up straight.

The finals begin at eleven o'clock, which gives you exactly three hours to investigate.
> Wake Rook on backup power -> rook-wake
> Examine the silver glitter -> glitter
> Ask Officer Kimball for the door log -> doorlog

=== rook-wake
scene: lab
cast: hero, robot:sad, kid:sad
Priya clips a backup battery onto Rook, and its eye lights flicker weakly while its voice emerges slow and crackly.

Robot: Good... morning. My memory chip is... missing. I do not remember... anything about last night.

Kid: But your air sensor kept recording, didn't it? It never switches off.

Robot: Affirmative. The sensor log was saved. Unfortunately, it is scrambled, and decoding it will require approximately one hour.

Priya connects Rook to her laptop and launches the decoding program, and a slow progress bar begins crawling across the screen.

Kid: One hour. That is going to feel like an entire year.
> Ask Officer Kimball for the door log -> doorlog

=== glitter
scene: lab
cast: hero, quill:thinking, kid:angry
You crouch down and examine the glitter carefully. It is fine, loose, and silver, and it has been scattered in a tidy circle around Rook, almost as though somebody had sprinkled it there deliberately.

Kid: Silver glitter! The Westbrook Iron Owls decorated their robot with silver sparkles, so it has to be them. Their captain, Jasper Quinn, has been desperate to beat us all year.

Quill: Perhaps. However, a clue that shouts the answer at you deserves to be questioned twice as carefully as one that whispers.

You scoop a little of the glitter into an envelope and label it, just in case it becomes important later.
> Ask Officer Kimball for the door log -> doorlog

=== doorlog
scene: lab
cast: hero, guard:thinking, quill
Officer Kimball prints the keypad record and spreads it across a workbench so everyone can read it.

LAB 114, FRIDAY: locked at 6:04 PM; opened with master code at 11:48 PM; locked again at 11:56 PM; master code automatically changed at 12:00 AM.

Guard: That glitter makes me think of those Westbrook kids. But a student couldn't possibly have opened this door, and here's the reason. Only three people knew last night's master code: me, Mr. Dunmore, and Dr. Marsh. Before you ask, I was at the front desk the entire night, and the lobby camera can prove it.

Quill: So whoever opened this door at 11:48 knew a code that no student possibly could have known.
? RL.1 : Which line best supports the idea that a Westbrook student could NOT have opened the lab door?
+ "Only three people knew last night's master code"
- "That glitter makes me think of those Westbrook kids."
- "locked again at 11:56 PM"
- "I was at the front desk the entire night"
hint: Which line tells you exactly who could unlock the door? Do any students know the code?
next: dunmore

=== dunmore
scene: lab
cast: hero, keeper:angry, quill
Mr. Dunmore stomps into the laboratory carrying his mop. His work boots are absolutely soaking wet, and they leave dark puddles on the floor with every step he takes.

Keeper: Somebody wrecked one of the robots? Well, I can't honestly say I'm heartbroken, because maybe now this school will finally stop scuffing my floors.

He notices the expression on Priya's face and clears his throat uncomfortably.

Keeper: That came out wrong, and I apologize. I'm sorry about your machine, kid. I just had an extremely long night, that's all.

He stomps out again before anyone can ask him why, and Quill watches the wet footprints slowly evaporate from the floor.

Quill: A grumpy custodian with a master code, soaking boots, and a mysterious long night. How very interesting.
> Gather your notes -> ch1-end

=== ch1-end
scene: school
cast: hero, quill, kid:sad
You and Priya sit on the bleachers while Quill hops onto your notebook to review the facts.

Quill: Let us stick to what we actually know. Overnight, someone opened the laboratory door at 11:48 using the master code, which only three adults knew. That person removed Rook's memory chip, and silver glitter was left on the floor. The finals start at eleven, and without its chip, Rook cannot compete.

Priya hugs her knees miserably.

Kid: You left out the part where Westbrook is obviously guilty.

Quill: I left it out because we do not actually know it yet.
? RL.2 : Which is the best objective summary of Chapter One?
+ Someone with the master code took Rook's chip overnight.
- The Westbrook team obviously stole Rook's chip out of jealousy.
- Mr. Dunmore is a grumpy custodian who hates all robots.
- Rook is the best robot in the state and deserves to win.
hint: An objective summary sticks to facts and leaves out opinions and guesses. Listen to what Quill says "we actually know."
next: ch2

# ============================================================
# CHAPTER TWO: WITNESSES WITH FEATHERS
# ============================================================

=== ch2
scene: school
cast: hero, guard, kid:angry
checkpoint
clue: A person in a gray hooded coat was watching the school from across the street.
~ Chapter Two ~

At nine o'clock, Officer Kimball snaps her notebook shut with a decisive click.

Guard: The glitter points to Westbrook, and honestly, that's good enough for me. I'm ready to report Jasper Quinn to the judges immediately.

Kid: Good. Let's do it before they try anything else.

Something moves outside the gymnasium window. Across the street, a person in a long gray hooded coat is standing perfectly still and staring at the school, and when they notice you looking, they turn and hurry away.

You have two hours remaining, and everybody is waiting to see what you will do next.
> Talk to the Westbrook captain -> jasper
> Visit the science room next to the lab -> newton
> Chase the hooded figure outside -> chase
> Tell Kimball to report Jasper now -> lose-glitter

=== lose-glitter
scene: school
cast: guard, scientist:happy, quill:sad
Officer Kimball marches to the judges' table and reports the glitter, while Dr. Marsh listens, crunching a peppermint and nodding gravely.

Scientist: Glitter at the scene of the crime? Then the matter is settled. The Westbrook Iron Owls are disqualified, and this investigation is officially closed.

Jasper Quinn protests until his voice cracks, but nobody listens. Everyone stops searching, and Rook sits silently in the corner with an empty socket.

At noon, Dr. Marsh presents the trophy and hurries off to the airport, rolling her suitcase behind her. A week later, someone finally notices that Westbrook's glitter is sealed into the paint and never sheds, but by then the trail has gone completely cold.

Quill: We allowed the loudest clue to do our thinking for us. That is a mistake I hope we never repeat.
end: lose The Glitter Trap

=== chase
scene: city-street
cast: hero, stranger, quill:surprised
clue: The hooded figure dropped an old pin: LARKFIELD ROBOTICS CLUB, FOUNDING MEMBER, 1986.
You burst out of the school and race across the street, but the hooded figure is already at the end of the block, walking rapidly toward the crowded Saturday farmers' market.

Something small and shiny clinks onto the sidewalk where they passed. You scoop it up and discover an old enamel pin shaped like a gear, with tiny letters around its edge: LARKFIELD ROBOTICS CLUB, FOUNDING MEMBER, 1986.

Quill: Founding member? This school's robotics club is forty years old, so whoever dropped this has been building robots for a very long time.

The gray hood disappears into a jumble of shoppers, strollers, and vegetable stands.
> Plunge into the market after them -> lose-chase
> Go back and talk to the Westbrook captain -> jasper
> Go back and visit the science room -> newton

=== lose-chase
scene: city-street
cast: hero, quill:sad
You plunge into the market, where every third person seems to be wearing a gray coat. You follow one hood after another past tables of tomatoes, honey, and handmade soap, but each time, the face underneath belongs to a complete stranger.

By the time you finally give up, the town clock says 10:55, and you sprint back to Larkfield just as the finals begin.

Rook sits in the corner with its empty socket, and the Gearhounds are forced to forfeit. Dr. Marsh presents the trophy at noon and rushes off to the airport, and with her departure goes your last opportunity to question everyone before they scatter.

Quill: We chased a shadow and abandoned the real clues. I am afraid the case has gone cold.
end: lose Lost in the Market

=== jasper
scene: school
cast: hero, kid:angry, quill
In the far corner of the gym, Jasper Quinn of the Westbrook Iron Owls is protectively guarding his team's robot, Magpie, which glitters with silver sparkles from top to bottom.

Kid: I know what everybody's saying. They're staring at us like we're criminals, just because of some glitter.

He drags his fingernail hard across Magpie's side, and not a single speck comes off.

Kid: See? Our glitter is mixed into the paint and sealed underneath three coats of clear varnish, so it doesn't shed, and that was the whole point. Whoever dumped loose glitter on that floor wanted everybody to blame us.

He crosses his arms, but his voice wobbles.

Kid: We wanted to beat Rook fair and square, and now nobody will even believe that we could have.
? RL.6 : How does Jasper's point of view about the glitter differ from Officer Kimball's?
+ Kimball sees it as proof against Westbrook; Jasper sees a setup.
- Both of them believe the glitter proves Westbrook is guilty.
- Jasper thinks Kimball planted the glitter herself.
- Kimball thinks the glitter is from the art room; Jasper does not.
hint: Kimball said the glitter "points to Westbrook." What does Jasper say about whoever dumped the glitter?
next: artroom

=== newton
scene: lab
cast: hero, parrot:surprised, quill
clue: Newton the parrot keeps saying "Shiny side up!" and "Hush, bird!" He repeats new phrases for about a day.
The science classroom shares a wall with the robotics laboratory. In a large cage beside the window sits Newton, the class parrot, a gray bird with a scarlet tail and a very loud opinion about everything.

A sign on the cage reads: NEWTON COPIES VOICES. HE REPEATS NEW PHRASES FOR ABOUT A DAY, THEN FORGETS THEM. PLEASE DO NOT TEACH HIM ANYTHING RUDE.

Newton bobs his head enthusiastically, as though he has been waiting all morning for an audience, and squawks.

Parrot: Shiny side up! Shiny side up! Hush, bird! Hush, bird!

The final two words come out as a sharp, irritated whisper, exactly like someone who is desperately trying not to be overheard.

Quill: A parrot is a tape recorder with feathers, and this particular recorder seems to have captured something new very recently.
? L.5 : What does Quill mean when she calls the parrot "a tape recorder with feathers"?
+ Newton repeats exactly what he hears, like a recording.
- Newton is a robot dressed up to look like a bird.
- Newton is broken and needs new batteries.
- Newton likes to listen to music all day.
hint: Quill is using a metaphor. What does a tape recorder do with sounds, and what does Newton do with voices?
next: artroom

=== artroom
scene: school
cast: hero, kid:thinking, quill
On your way back to the gym, you pass the art room, whose door is propped open. On the supply shelf sits an enormous jar labeled SPARKLE STORM LOOSE GLITTER, SILVER. Its lid is lying beside it, and someone has dug a scoop-shaped dent into the glitter.

You open your envelope and compare the two samples, and the glitter from the laboratory floor matches perfectly.

Kid: Wait a minute. Magpie's glitter is sealed into the paint, because I've seen it up close at three different tournaments. This is loose craft glitter from our own art room.

Quill: Then someone carried it from this jar to the laboratory. I believe that it was planted.
? L.4 : Quill says the glitter "was planted." What does "planted" mean here?
+ Placed on purpose to make someone look guilty
- Buried in soil so that it can grow
- Painted onto a robot to make it sparkle
- Spilled by accident while cleaning
hint: Glitter does not grow. Think about why someone would carry it from the art room and leave it beside Rook.
next: boiler

=== boiler
scene: museum-vault
cast: hero, keeper:sad, quill
You follow a trail of damp footprints down to the basement boiler room, where Mr. Dunmore is sitting on an overturned bucket beside a pipe wrapped in fresh tape.

Keeper: Before you ask, a pipe burst last night. I was down here from eleven-fifteen until one in the morning, standing up to my ankles in freezing water, which is why my boots are soaked.

He hands you his phone, and the call log shows a twenty-two-minute call to an emergency plumber that began at 11:41 PM.

Keeper: I was on the phone with her the entire time, trying to locate the shutoff valve, and this boiler room is at the opposite end of the building from the lab. Look, I complain about those robots constantly, but I'd never damage one. That girl worked all summer on hers, and I watched her do it.
? RL.3 : How does this new evidence change your view of Mr. Dunmore?
+ His wet boots and phone call show he was busy at 11:48.
- His grumpy attitude proves that he must be the thief.
- He was working with Westbrook to frame the Gearhounds.
- He knew nothing about the robots or the lab code.
hint: Compare the time of his phone call with the time the lab door opened. Why were his boots wet?
next: rook-memory

=== rook-memory
scene: lab
cast: hero, robot, kid:surprised
Back in the laboratory, Priya's laptop chimes. Since early this morning it has been decoding the log from Rook's air sensor, which keeps recording smells, sounds, and light even while the robot is powered down. The decoding is finished, but the lines have come out completely jumbled.

AIR SENSOR: PEPPERMINT, VERY STRONG. (11:49 PM)
SOUND: LOUD SQUAWK FROM NEXT ROOM. VOICE: "HUSH, BIRD!" (11:53 PM)
LIGHT: ONE SMALL FLASHLIGHT. DOOR OPENS. (11:48 PM)
DOOR CLOSES. (11:56 PM)
BACK PANEL OPENED. MEMORY CHIP REMOVED. (11:51 PM)

Robot: My apologies. The information is accurate, but it is presented out of order.

Kid: Peppermint? Our laboratory usually smells like melted solder and leftover pizza, definitely not peppermint.
? RL.5 order : Put Rook's sensor log back in the order that things happened.
1 A flashlight shines and the door opens.
2 The air sensor smells strong peppermint.
3 The back panel opens and the chip is removed.
4 A parrot squawks and a voice says, "Hush, bird!"
5 The door closes.
hint: Use the times at the end of each line in the log, from 11:48 to 11:56.
next: ch2-end

=== ch2-end
scene: lab
cast: hero, quill:thinking, kid
Quill paces back and forth along the workbench, her talons clicking.

Quill: Let us summarize this chapter. The glitter was never Westbrook's; somebody planted it from the art room. Mr. Dunmore was repairing a burst pipe when the door opened. And according to Rook's sensor log, the intruder smelled strongly of peppermint, and Newton squawked while the chip was being stolen.

Priya stares at the log, and her expression gradually changes.

Kid: Only three people knew the code. One was at the front desk, and one was in the boiler room, so that leaves...

Quill: Careful. A name is not a case until the evidence agrees with it.
? RL.2 : Which is the best objective summary of Chapter Two?
+ Planted glitter, an alibi for Dunmore, and a thief who smelled minty
- Jasper Quinn admitted that his team stole the chip.
- Mr. Dunmore is clearly the thief because his boots were wet.
- Newton the parrot is the smartest witness in the school.
hint: An objective summary lists the key facts without opinions. Look at the three facts Quill names.
next: ch3

# ============================================================
# CHAPTER THREE: SHINY SIDE UP
# ============================================================

=== ch3
scene: school
cast: hero, scientist, quill:scared
checkpoint
~ Chapter Three ~

At 10:20, you walk back into the gymnasium. Dr. Marsh is sitting at the judges' table, crunching a peppermint from her silver tin, with her suitcase packed and waiting beside her chair.

Scientist: Ah, the reporter. Please remind the Gearhounds that if their robot cannot operate by eleven o'clock, they forfeit. Rules are rules.

Your heart is pounding, and the scent of peppermint drifts across the table.

Quill whispers urgently in your ear.

Quill: An accusation without evidence is only a rumor standing up straight. Whatever you decide to do next, do it carefully.
> Accuse Dr. Marsh right now -> lose-early
> Lay out your evidence with Priya first -> evidence
> Find the hooded figure from the window -> cafe

=== lose-early
scene: school
cast: quill:sad, scientist:angry, guard
You point at Dr. Marsh and announce, loudly enough for the entire gym to hear, that she stole Rook's chip.

Dr. Marsh responds with a light, tinkling laugh that echoes around the enormous room.

Scientist: Me? Because I enjoy peppermints? Half the people in this gymnasium have mints in their pockets. I was asleep in my hotel last night, and I have supported students for twenty years. I honestly expected better from a reporter.

Officer Kimball apologizes to her and steers you away, and nobody in the gymnasium wants to hear another word about it.

At eleven, the Gearhounds forfeit. At noon, Dr. Marsh rolls her suitcase out to a waiting taxi, tapping her silver tin, and then she is gone.

Quill: We had the right suspect but not the proof. Sometimes being right too early is the same as being wrong.
end: lose The Mint Tin Walks Away

=== evidence
scene: lab
cast: hero, kid:thinking, quill
You and Priya arrange everything on the workbench: the keypad record, the envelope of glitter, a photo of Newton's sign, and Rook's decoded sensor log.

Kid: Only three adults knew the code. Officer Kimball was on camera at the front desk, and Mr. Dunmore was on the phone in the basement, which leaves Dr. Marsh.

Quill: Knowing who could have done it is only a beginning. Now tell me what actually connects her to the scene.

You remember the judges' table on Friday afternoon: the silver tin, the constant crunching, and the phrase she kept repeating to every single team.
? RL.1 : Which detail from Rook's log connects the thief to something Dr. Marsh did on Friday?
+ "AIR SENSOR: PEPPERMINT, VERY STRONG."
- "DOOR CLOSES."
- "LIGHT: ONE SMALL FLASHLIGHT. DOOR OPENS."
- "BACK PANEL OPENED. MEMORY CHIP REMOVED."
hint: What was Dr. Marsh eating from her silver tin during the inspection?
next: plan

=== plan
scene: lab
cast: quill, guard:thinking, kid
Officer Kimball reads through your evidence twice, frowning thoughtfully and tapping her pen against the workbench.

Guard: Peppermint and a parrot. I'll admit it's suggestive, but she'll simply deny everything, and I can't search a judge's pockets because of a smell. We need that chip.

Kid: She never lets go of that silver tin, and a memory chip is tiny, smaller than a postage stamp.

Quill: Then we need Dr. Marsh to reveal the truth herself, in front of witnesses.

You glance anxiously at the wall clock, which reads 10:35, and realize that time is running out.
> Ask Kimball to question Dr. Marsh -> request
> Bring Newton the parrot to the gym -> newton-show

=== request
scene: school
cast: guard, scientist:angry, quill
Officer Kimball approaches the judges' table and politely asks Dr. Marsh where she was at 11:48 last night.

Scientist: I cannot believe this. I have devoted twenty years to helping young engineers, and my company puts robots in more than four hundred schools. Everyone in this gymnasium knows my reputation. Are you seriously going to trust a parrot and a robot's nose over me?

She folds her arms, and the silver tin clicks against her bracelet.

Quill murmurs to you from your shoulder.

Quill: Listen closely. Did she actually answer the question that was asked?
? RI.8 : Which of these is NOT evidence about who was in the lab at 11:48?
+ "My company puts robots in more than four hundred schools."
- The keypad log shows the master code was used at 11:48.
- Rook's sensor logged strong peppermint at 11:49.
- Newton heard a voice say "Hush, bird!" at 11:53.
hint: Officer Kimball asked where Dr. Marsh was. Which choice talks about her reputation instead of the lab?
next: newton-show

=== newton-show
scene: school
cast: parrot:angry, scientist:scared, kid
Priya marches into the gymnasium carrying Newton's cage in both arms and sets it down directly beside the judges' table.

Newton tilts his head and examines Dr. Marsh suspiciously, first with one bright eye and then with the other. Then he fluffs up every feather and squawks in a perfect, unmistakable imitation of her voice.

Parrot: Shiny side up! Shiny side up! Hush, bird! Hush, bird!

The gymnasium falls completely silent, and dozens of curious heads turn toward the judges' table.

Kid: The sign on his cage says he repeats new phrases for about a day. He was quiet all week, so he must have learned those words last night, from someone standing right next to his classroom.

Very slowly, Dr. Marsh's hand moves toward her jacket pocket.
> Watch Officer Kimball step forward -> confront

=== confront
scene: school
cast: hero, guard, scientist:sad
Officer Kimball steps forward and holds out her hand.

Guard: Dr. Marsh, would you mind showing me the contents of your mint tin, please?

For a long moment, nobody in the gymnasium breathes. Then Dr. Marsh places the silver tin on the table and opens it, and beneath the peppermints, wrapped in a tissue, lies a tiny green memory chip.

Scientist: I only intended to borrow it. I needed my laptop at the hotel to copy the balance code, and I planned to return the chip before morning. But when I came back at half past midnight, the master code had already changed, so I couldn't get back in. The glitter was simply insurance, in case anyone noticed.

She stares miserably at the polished floor.

Scientist: My company's kits still can't climb stairs, and that child solved the problem in a single summer.
? RL.3 : Why couldn't Dr. Marsh return the chip after she took it?
+ The master code changed at midnight, so she couldn't reopen the lab.
- Newton the parrot was guarding the lab door all night.
- Officer Kimball caught her at the front desk.
- The chip broke when she copied it on her laptop.
hint: Reread her confession. What had changed when she came back at half past midnight?
next: rook-reboot

=== rook-reboot
scene: lab
cast: hero, robot:happy, kid:happy
Priya races back to the laboratory with the chip pinched carefully between two fingers, slides it into Rook's socket, and presses it gently into place.

Kid: Shiny side up.

Rook's eye lights blink, then glow brilliant blue. The robot straightens up, rolls forward, and balances on one wheel as gracefully as a dancer.

Robot: Good morning. I appear to have missed some excitement. My air sensor detects peppermint, relief, and one extremely happy captain.

Priya laughs and hugs the robot, goggles and all, while the clock above the door ticks toward 10:51.
> Talk with Priya before the finals -> theme

=== theme
scene: lab
cast: hero, kid:thinking, quill
Priya sits down on a stool, still holding Rook's metal hand.

Kid: This morning I was completely sure that Jasper did it. I was ready to report him without even talking to him, just because of some glitter. If you hadn't checked, he would have been punished for something he never did.

Quill: First impressions are loud, and evidence is usually quiet, so a good detective learns to listen patiently to the quiet one.

Kid: And Dr. Marsh could have simply asked us. If she had offered to give us credit, I probably would have shared the code with her.
? RL.2 : Which theme does the story develop most strongly?
+ The truth comes from careful evidence, not first impressions.
- Adults always know better than kids do.
- Winning a competition matters more than anything else.
- Parrots make better detectives than people.
hint: Think about the glitter, and listen to what Quill says about first impressions and evidence.
next: finals

=== finals
scene: school
cast: hero, kid:happy, robot:happy
Officer Kimball has quietly escorted Dr. Marsh out of the gymnasium, and the two remaining judges agree to run the finals together. The Westbrook team receives a public apology, and Jasper actually smiles.

Priya pushes her goggles up onto her forehead and turns to you.

Kid: Rook's ready. But you're a reporter, too, and somebody has to write the real story before the rumors about Westbrook spread any further.

Robot: I would be honored to have a witness. I am also extremely happy to be famous.

The buzzer sounds for the first round.
> Cheer for Rook in the finals -> win-rook
> Write the true story for the Ledger -> win-ledger

=== win-rook
scene: school
cast: hero, robot:happy, kid:happy
The final challenge begins. Rook rolls across the gym, climbs the staircase without a single wobble, and sniffs out every hidden scent canister: lemon, cinnamon, pine, and finally, naturally, peppermint.

The crowd roars as the Gearhounds win the Robot Rumble by twelve points, with Jasper's Iron Owls finishing in second place.

Afterward, Priya and Jasper shake hands in the middle of the gym and make an agreement: next summer, the two teams will design a stair-climbing robot together, and both schools will receive the credit.

Robot: Final smell report: popcorn, victory, and friendship.
end: win Rook Rises

=== win-ledger
scene: school
cast: hero, quill:happy, kid
You find a quiet corner of the bleachers and write as fast as your pencil will move, while Quill reads over your shoulder and corrects your commas.

On Monday, the Larkfield Ledger publishes your article on the front page under the headline MINT CONDITION: HOW A PARROT, A ROBOT, AND THE EVIDENCE SOLVED THE ROBOT RUMBLE. It clears Westbrook's name, explains every clue, and gives Priya full credit for her balance code.

Jasper tapes a copy to Magpie's side, and Priya frames another for the laboratory wall.

Quill: A good story does not merely report what happened. Sometimes it makes things right.
end: win Mint Condition

# ---- Secret path: the hooded figure ----

=== cafe
scene: city-street
cast: hero, stranger, quill
Across the street from the school is a small cafe called the Corner Cup, and in its front window sits the person in the long gray hooded coat, cradling a mug of tea.

When you step inside, the figure lowers the hood, revealing an elderly woman with silver hair, bright eyes, and an oil stain on one knuckle.

Stranger: I'm Ada Penhallow. I started the Larkfield robotics club forty years ago, and I came back to watch the finals. I was too nervous to go inside, so I watched from my room upstairs. And last night, I witnessed something I didn't like.

She sets down her tea and leans closer.
> Ask what she saw -> ada-story

=== ada-story
scene: city-street
cast: hero, stranger:thinking, quill:surprised
Stranger: My window looks directly into Room 114. At a quarter to midnight, I noticed a flashlight moving in there. A tall woman was leaning over one of the robots, and every time the beam crossed her hand, something small and silver flashed, like a little tin.

Ada wraps both hands around her mug as though the memory makes her cold.

Stranger: I recognized the way she stood. Her name is Celia Marsh. Thirty years ago, she was the most talented student I ever taught, and I'm sorry to say it, but I would recognize her anywhere.

Quill: Would you be willing to tell that to the officer in the gymnasium?

Ada is quiet for a moment, considering, and then she stands up and buttons her coat with determination.
> Walk Ada into the gym -> ada-gym

=== ada-gym
scene: school
cast: stranger, scientist:scared, guard
When Ada walks into the gymnasium, Dr. Marsh turns pale and grips the edge of the judges' table.

Scientist: Professor Penhallow? What on earth are you doing here?

Stranger: Watching, Celia, exactly as I was watching yesterday evening. I taught you how to build robots, and I also taught you to give credit to the people whose ideas you use. I believed both lessons had stuck.

Dr. Marsh's shoulders sag. Without another word, she opens her silver tin, lifts a tiny green memory chip from beneath the peppermints, and hands it to Officer Kimball.

Guard: Thank you, Professor. I believe the judges' table needs a new head judge.
> Hear what Ada says to Priya -> ada-theme

=== ada-theme
scene: lab
cast: stranger:happy, kid, robot:happy
Priya slides the chip into Rook, shiny side up, and the robot glows back to life. Ada watches it balance on one wheel and laughs out loud.

Stranger: Forty years ago, my robots couldn't even climb over a curb, so you should be extremely proud of what you've accomplished.

Kid: I almost blamed the wrong team this morning, and I was absolutely certain that I was right.

Stranger: Being certain is easy. Checking is the difficult part, and the part that actually matters, in engineering and with people. Test everything before you trust it.
? RL.2 : Which theme do Ada's words and the whole story express?
+ Test and check the evidence before you decide what is true.
- Older people are always the best judges.
- Robots should never be used in competitions.
- It is better to be fast than to be careful.
hint: Ada says "being certain is easy" and tells Priya to test everything. How does that connect to the glitter?
next: secret-end

=== secret-end
scene: school
cast: hero, stranger:happy, quill:happy
Ada Penhallow agrees to serve as head judge for the finals. Rook climbs the stairs, sniffs out every canister, and wins by a single point over Jasper's Iron Owls, who cheer just as enthusiastically as the Gearhounds.

At the closing ceremony, Ada takes an old enamel pin shaped like a gear from her coat and fastens it to your jacket. Around its edge, tiny letters say LARKFIELD ROBOTICS CLUB, FOUNDING MEMBER, 1986.

Stranger: I always carry a spare. I'd say you've earned an honorary membership, because a good engineer and a good detective do exactly the same thing: they test everything.

Quill: I would like one of those for my feathers, please.
end: secret The Founder's Pin
