title: The Mole in the Lantern Program
author: SpiderBen10's Arcade
genre: mystery
band: 6-8
cover: secret-hq
blurb: Under a normal middle school hides a secret academy for young agents, and someone inside is selling its secrets.
start: start

# ============================================================
# CHAPTER ONE: REMEDIAL RECORDER CLUB
# ============================================================

=== start
scene: school
cast: hero, quill:thinking
checkpoint
clue: Your schedule says: 6th period, Remedial Recorder Club, gym.
~ Chapter One ~

Larkmoor Middle School looks completely ordinary: squeaky lockers, a cafeteria that smells like tater tots, and a principal who announces the lunch menu as if it were breaking news.

Your class schedule, however, contains one strange line. Sixth period: Remedial Recorder Club, gym. You have never touched a recorder in your life, and you certainly never signed up for a club.

Quill pokes her head out of your backpack, where she is pretending to be a stuffed toy owl with surprising dedication.

Quill: Nobody joins a recorder club by accident. Somebody wants you in that gym.
> Read the note clipped to your schedule -> letter
> Head straight to the gym -> gym

=== letter
scene: school
cast: hero, quill:surprised
Clipped to the back of your schedule is a small card printed on heavy, expensive paper. It carries no signature, only a tiny drawing of a lantern in the corner.

"Congratulations. Your test scores, your curiosity, and the way you noticed the substitute teacher's fake mustache last spring have earned you an invitation. Come to the gym at the beginning of sixth period, turn the third-place bowling trophy one full circle to the left, and tell absolutely no one."

Quill: Hoo. Whoever wrote this pays remarkably close attention to details, and they obviously expect that you will, too.
> Go to the gym -> gym

=== gym
scene: school
cast: hero, quill:thinking
The gym is empty except for a lonely volleyball. In the hallway outside, a dusty glass trophy case holds forty years of medals, plaques and ribbons, and on the bottom shelf sits a lopsided trophy that reads THIRD PLACE, REGIONAL BOWLING, 1987.

You turn it one full circle to the left. Something clicks behind the glass, the back wall of the case slides aside, and a narrow elevator, lit with soft orange light, waits for you.

Quill: Either this is a very elaborate prank, or the recorder club has a surprisingly large budget.

The doors close behind you, and the elevator drops so fast that your stomach seems to stay on the first floor.
> Ride the elevator down -> hq

=== hq
scene: secret-hq
cast: hero, agent:happy, quill:surprised
The doors open onto an enormous underground room glowing with screens. A world map covers one entire wall, a radar sweeps in green circles, and a dozen students your age are working at computers and whispering in low voices.

A woman in a dark suit walks toward you, sunglasses pushed up into her hair and a coiled wire tucked behind one ear.

Agent: Welcome to the Lantern Program. I'm Agent Marisol Okafor, your instructor. We train young people to solve puzzles, guard secrets and help people quietly. Our work is clandestine, which means nobody upstairs knows we exist, not the teachers, not the principal, not even your parents. Everything about us is hidden, private and done in secret.
? L.4 : Agent Okafor says the program's work is "clandestine." Which meaning fits the clues?
+ kept secret and hidden from others
- dangerous and against the rules
- famous and admired by everyone
- old-fashioned and rarely used
hint: Read the rest of her sentence. Who knows that the program exists, and how is everything about it done?
next: rules

=== rules
scene: secret-hq
cast: hero, agent:thinking, kid:happy
A boy with a bandage on his chin and a huge grin bounces up beside you and introduces himself as Dash Moreno, the other new recruit this year.

Kid: I tried to turn the bowling trophy to the right first. It sprayed me with fire-extinguisher foam. Totally worth it.

Agent: Now, the two most important rules. Rule One: if anyone upstairs asks where you go during sixth period, you are in the Remedial Recorder Club, you are terrible at the recorder, and you would rather not discuss it. Rule Two: your Lantern badge never leaves your pocket. If you show it to someone outside this room, your cover is blown, and you cannot remain in the program.

She hands you each a small brass badge shaped like a lantern.
clue: Rule One: your cover story is the Remedial Recorder Club. Rule Two: never show your badge.
> Go to your first class: codes -> cipher

=== cipher
scene: secret-hq
cast: hero, agent:normal, kid:thinking
Agent Okafor writes the alphabet across a glowing screen.

Agent: Your first cipher is one of the oldest in recorded history, because the Roman general Julius Caesar reportedly used it to protect his private letters. To encode a message, shift every letter three places forward in the alphabet, so A becomes D, B becomes E, and C becomes F. When you reach the end, wrap around to the beginning, so X becomes A, Y becomes B, and Z becomes C. To decode a message, simply shift every letter three places back.

She writes a practice word on the screen: KHOOR. Dash works it out aloud, letter by letter, and announces triumphantly that it spells HELLO.

Agent: Excellent. Now it's your turn. Decode this word: VSB.
> SPY -> cipher-right
> TRY -> cipher-wrong
> YES -> cipher-wrong

=== cipher-wrong
scene: secret-hq
cast: hero, agent:thinking, kid
Agent Okafor shakes her head, although not unkindly.

Agent: Check your work one letter at a time, because careless agents make expensive mistakes. Count three places backward from V, and you pass U and T before you land on S. Now count backward from S, and then from B, remembering that the alphabet wraps around after A.

Dash mutters the alphabet backward under his breath and immediately loses his place somewhere in the middle.
> Try again: SPY -> cipher-right

=== cipher-right
scene: secret-hq
cast: hero, agent:happy, kid:happy
Agent: SPY. Correct, and appropriate. Remember this cipher, recruits. Codes are only as strong as the people who keep the key secret.

Next is Gadget Lab, which turns out to be a cluttered workshop down the hall where Mr. Felix Ambrose, the program's inventor, is extinguishing a small fire inside a toaster.

Dash whispers that Mr. Ambrose is a genius whose inventions work perfectly about half the time. Unfortunately, nobody knows which half until it is too late.
> Visit the Gadget Lab -> gadgets

=== gadgets
scene: lab
cast: hero, scientist:happy, kid:surprised
Mr. Ambrose proudly hands you a silver pen.

Scientist: The Whisper Pen! It records every word spoken within three meters, and it is completely, perfectly silent.

You click the button, and the pen immediately plays back your entire morning at full volume, including the principal's lunch announcement and a very embarrassing sneeze. The noise is as quiet as a marching band falling down a staircase.

Scientist: Ah. Still a few bugs. Here, try the Grip Gloves instead.

Dash puts them on, waves hello, and his hand sticks firmly to his own forehead.
? L.5 : The pen is described as "as quiet as a marching band falling down a staircase." What does this comparison really mean?
+ The pen is extremely loud, not quiet at all.
- The pen plays pleasant music like a band.
- The pen is quiet except for one small click.
- The pen breaks easily if you drop it.
hint: Picture a marching band tumbling down stairs. Would that be quiet? The comparison says the opposite of what it seems to say.
next: alarm

=== alarm
scene: secret-hq
cast: hero, agent:angry, scientist:scared
Suddenly, a red light begins flashing above the map, and every screen in headquarters turns the same alarming shade of crimson.

Agent: Attention, everyone. Last night, at 9:42 p.m., someone used the vault computer to copy the Nightjar List, the confidential file containing the real names of every Lantern agent. According to the computer, the key card belonged to Mr. Ambrose.

Scientist: But I lost my key card on Wednesday, and I reported it immediately! I assumed my Pocket Vacuum had swallowed it again.

Agent Okafor turns toward you and Dash and lowers her voice.

Agent: Someone inside this program is a mole. Because you two are brand new, nobody will suspect you, so I want you to identify that person, quietly and carefully.
clue: The Nightjar List was copied Thursday at 9:42 p.m. with Mr. Ambrose's key card, which he says he lost on Wednesday.
> Head back upstairs for seventh period -> principal

=== principal
scene: school
cast: hero, mayor:thinking, quill
As you step out of the trophy case, you nearly crash into Principal Hollis, a cheerful man in a tall hat who has absolutely no idea that a spy school exists under his gym.

Mayor: Well, hello there! I didn't see you come out of... wait, where did you come from? What were you doing during sixth period?

Your badge feels heavy in your pocket. Quill freezes in your backpack, doing her best impression of a stuffed animal.

Agent Okafor's two rules echo in your head. Your cover story is ready, but the badge would certainly make a more impressive answer.
> Say you were at Remedial Recorder Club -> cover
> Show him your Lantern badge -> lose-cover

=== lose-cover
scene: school
cast: hero, mayor:surprised, quill:sad
You pull out the brass lantern badge, and Principal Hollis squints at it, deeply bewildered.

Mayor: A lantern? Is this for the camping club? We don't have a camping club.

Unfortunately, Agent Okafor observes everything through the hallway camera. By the end of the day, the trophy case has been quietly rebuilt, your badge has been collected, and your schedule has been permanently changed. You are now enrolled in the genuine Remedial Recorder Club, which meets every afternoon and is precisely as squeaky as it sounds.

Quill: Rule Two was very clear, unfortunately. The badge never leaves your pocket.
end: lose Cover Blown

=== cover
scene: school
cast: hero, mayor:happy, quill:happy
You sigh dramatically and explain that you were at Remedial Recorder Club, that you are honestly the worst recorder player in the history of Larkmoor, and that you would really prefer not to talk about it.

Mayor: Oh, I understand completely. I was in the recorder club myself back in fifth grade. They asked me to play more quietly, and then they asked me to play from the hallway. Keep at it, champ!

He pats you on the shoulder and strolls off, humming badly.

Quill: Hoo! Remarkable acting. I almost believed you, and I know where you really were.
> Meet Dash after school -> ch1-end

=== ch1-end
scene: school
cast: hero, kid:thinking, quill
After school, you and Dash sit on the bleachers while the basketball team practices below, its sneakers squeaking across the polished floor.

Kid: So here's what we know. Somebody copied the secret list on Thursday night using Mr. Ambrose's key card, but he claims he lost it on Wednesday. Either he's lying to everyone, or somebody found his card and used it deliberately to frame him.

Quill: And because the mole is still inside the program, they could attempt something again at any moment.
? RL.2 : Which is the best objective summary of Chapter One?
+ You join a secret school for agents, and a mole steals a secret list.
- You learn to play the recorder and join the school's music club.
- Mr. Ambrose invents a pen that helps students cheat on tests.
- Principal Hollis discovers the secret school and closes it down.
hint: An objective summary tells the most important events without opinions. What did you discover, and what went wrong?
next: ch2

# ============================================================
# CHAPTER TWO: THE PEPPERMINT NOTE
# ============================================================

=== ch2
scene: secret-hq
cast: hero, agent:thinking, kid
checkpoint
~ Chapter Two ~

The next morning, Agent Okafor briefs you before school.

Agent: Three adults could have entered headquarters on Thursday night. Mr. Ambrose, whose card was used. Coach Dana Brandt, our fitness instructor, whose gym office is right beside the trophy case. And Mr. Lyle Fenwick, the custodian, who guards the back entrance and has a key to every door in the building.

Agent: Remember, recruits, suspicion is not evidence. Watch everything, write everything down, and accuse nobody until you can prove it.
clue: The suspects are Mr. Ambrose, Coach Brandt and Mr. Fenwick.
> Search the headquarters shredder -> shredder
> Talk to Mr. Fenwick first -> fenwick

=== fenwick
scene: school
cast: hero, keeper:angry, kid:thinking
Mr. Fenwick is mopping the hallway with ferocious concentration. He is a wiry old man who smells powerfully of pine cleaner and who glares at anyone foolish enough to walk across his wet floor.

Keeper: Thursday night? I was here late, waxing the gym floor. Around 9:30, I noticed a light on in the coach's office, but that's none of my business, and it certainly isn't any of yours.

As you walk away, Dash grabs your sleeve, his eyes enormous.

Kid: He was here late, he has keys to everything, and he's grumpy. Case closed! It's obviously him.

Quill pokes her head out of your backpack and reminds him, in a whisper, of exactly what Agent Okafor said that morning: suspicion is not evidence, and nobody should be accused until it can be proved.
clue: Mr. Fenwick says he saw a light in Coach Brandt's office around 9:30 on Thursday night.
? RL.6 : How do Dash's and Agent Okafor's points of view on the case differ?
+ Dash is sure Fenwick did it; Okafor wants proof before accusing.
- Dash trusts Fenwick completely; Okafor is sure he is the mole.
- Both of them believe Fenwick is the mole and want to arrest him.
- Both of them think Fenwick is too grumpy to bother investigating.
hint: Compare Dash's "Case closed!" with what Agent Okafor said about suspicion and evidence.
next: shredder

=== shredder
scene: secret-hq
cast: hero, kid:surprised, quill:thinking
Every scrap of paper in headquarters goes into one giant shredder, which Mr. Ambrose built himself. Naturally, it jammed on Thursday night, and wedged in its teeth is a half-shredded note.

Dash carefully pulls it free. The paper smells strongly of peppermint, and the top line is written in capital letters that make no sense at all.

PHHW DW WKH FORFN WRZHU DW IRXU

Underneath, in ordinary handwriting, someone has added: "Founders Day. Bring the file to our rendevous."

Quill: Capital letters that make no sense? That looks like a lesson you had yesterday.
clue: The note smells like peppermint. It says: PHHW DW WKH FORFN WRZHU DW IRXU.
> Decode the message -> decode

=== decode
scene: secret-hq
cast: hero, kid:thinking, quill
You copy the code onto a sheet of paper and write the alphabet underneath. Following Agent Okafor's rule, you shift every letter three places back. P becomes M. H becomes E. W becomes T.

Dash leans over your shoulder, counting on his fingers and occasionally getting lost somewhere around the letter Q.

Kid: The Founders Day fair is tomorrow, on Main Street. The whole town goes. Everybody's distracted, there are crowds everywhere... it's the perfect place to hand over a stolen file without anyone noticing.
? RI.3 : Use the cipher rule and shift each letter three places back. What does the message say?
+ MEET AT THE CLOCK TOWER AT FOUR
- MEET AT THE BELL TOWER AT NINE
- LEAVE THE FILE AT THE CLOCK SHOP
- MEET AT THE BOWLING TROPHY AT TEN
hint: Decode it one word at a time. PHHW: P becomes M, H becomes E, H becomes E, W becomes T. Then try the last word, IRXU.
next: spelling

=== spelling
scene: secret-hq
cast: hero, agent:thinking, kid:surprised
You bring the note to Agent Okafor, who reads it twice before tapping the handwritten line with one finger.

Agent: Interesting. Our mole understands ciphers but apparently never consults a dictionary. Look carefully at the final word.

The word is "rendevous." Dash frowns at it for a moment, and then his entire face lights up.

Kid: It's missing a Z! The real word comes from French, and it's spelled with a silent Z in the middle that you can't hear when you pronounce it. If we discover someone else who misspells it in exactly the same way, we've probably found our mole!

Agent: Now you're thinking like an agent. Handwriting can be disguised, but spelling habits are remarkably difficult to hide.
clue: The mole spells "rendezvous" wrong, as "rendevous."
? L.2 : The mole spelled the word wrong. Which is the correct spelling?
+ rendezvous
- rendevous
- rondayvoo
- rendezvoos
hint: Dash says the correct word has a silent Z in the middle, and it ends with the same letters as the French word "vous."
next: log

=== log
scene: secret-hq
cast: hero, robot:normal, kid:thinking
The headquarters security robot, a squat, beeping machine called BEACON, prints Thursday night's door log. Unfortunately, it insists on reading the entries in the order they were saved, which is not the order in which the events actually happened.

Robot: Entry saved. At 9:42, the vault computer was opened with the key card belonging to F. Ambrose. Entry saved. At 9:05, the custodian unlocked the back door. Entry saved. At 9:55, the gym office door was locked from the inside, and the light was switched off. Entry saved. At 9:30, a light was switched on in the gym office.

Kid: Thank you, BEACON, that was extremely confusing. Let's rearrange it into an order that actually makes sense.
? RL.5 order : Put Thursday night's events in the order they happened.
1 The custodian unlocked the back door.
2 A light was switched on in the gym office.
3 The vault computer was opened with Mr. Ambrose's key card.
4 The gym office door was locked and the light went out.
hint: Ignore the order BEACON reads them in. Look only at the times: 9:05, 9:30, 9:42 and 9:55.
next: stakeout

=== stakeout
scene: city-street
cast: hero, kid:scared, quill:thinking
That night, you and Dash hide behind the dumpsters behind the school, wearing dark hoodies and Mr. Ambrose's Shadow Shoes, which make no sound at all but, it turns out, glow bright green in the dark.

At exactly 9:05, Mr. Fenwick slips out the back door carrying a lumpy paper bag and glancing nervously over his shoulder.

Kid: This is it! He's carrying the stolen file to his contact!

You follow him around the corner, your shoes glowing like two traffic lights. He kneels beside the fence, opens the bag, and whispers into the darkness.
> Creep closer to listen -> cat

=== cat
scene: city-street
cast: hero, keeper:happy, cat:happy
A skinny gray cat with one torn ear trots out from beneath the fence, and Mr. Fenwick pours a generous pile of tuna onto a paper plate.

Keeper: There you are, Captain Whiskers. Same time as always, eh? Don't you dare tell anybody I'm soft.

He sits on the curb while the cat eats, scratching it behind its ears and describing his entire day in a gentle, rumbling voice. When it finishes, it climbs into his lap and purrs like a tiny engine.

Beside you, Dash slowly lowers his binoculars and whispers that this is the most suspicious-looking thing he has ever witnessed that turned out to be completely adorable.
? RL.3 : What do Mr. Fenwick's actions with the cat reveal about his character?
+ Behind his grumpy act, he is caring and gentle.
- He is secretly planning to sell the cat at the fair.
- He is afraid of animals and wants the cat to go away.
- He is the mole and uses the cat to carry messages.
hint: Look at what he does for the cat and what he says: "Don't you dare tell anybody I'm soft."
next: office

=== office
scene: school
cast: hero, kid:thinking, quill:thinking
The next morning, while Coach Brandt is outside running the track team through drills, you slip into her gym office.

The trash can is full of peppermint gum wrappers. On her whiteboard, in big blue marker, she has written: FIELD DAY RENDEVOUS AT THE FLAGPOLE, 8 A.M.

And in the lost-and-found box under her desk, beneath a pile of mismatched socks, is a white plastic key card with a photo of Mr. Ambrose on it.

Quill: Hoo. The same misspelling, the same peppermint, and the lost key card, all in one office.
clue: Coach Brandt's whiteboard says "RENDEVOUS," her trash is full of peppermint gum wrappers, and Mr. Ambrose's key card is in her desk.
> Check Mr. Ambrose's lab, to be fair -> ambrose
> Report back to Dash at lunch -> ch2-end

=== ambrose
scene: lab
cast: hero, scientist:thinking, robot
Mr. Ambrose's lab smells like burnt toast and melted plastic, not peppermint. A sticky note on his monitor reads: Rendezvous with toaster repairman, 3 p.m., and the word is spelled perfectly.

Scientist: Still hunting the mole? I hope you find them, because the whole program thinks it's me. I've been so nervous that I've invented four new stress balls this morning, and three of them exploded.

He sighs and squeezes the fourth one, which squeaks like a rubber duck.
> Report back to Dash at lunch -> ch2-end

=== ch2-end
scene: school
cast: hero, kid:thinking, quill
In the cafeteria, Dash spreads your notes across the table between two trays of tater tots.

Kid: So, Mr. Fenwick was outside feeding Captain Whiskers during the robbery. Mr. Ambrose lost his card on Wednesday. And the card turned up in Coach Brandt's office, next to a whiteboard with the exact same misspelling as the note.

Quill: And tomorrow at four, someone plans to meet at the clock tower with a stolen list of every Lantern agent's real name.
? RL.2 : Which is the best objective summary of Chapter Two?
+ You decode the mole's note and gather clues about each suspect.
- You and Dash adopt a stray cat and name it Captain Whiskers.
- Mr. Fenwick confesses that he stole the Nightjar List.
- You learn to play the recorder well enough to join the band.
hint: Think about the note, the cipher, and the clues you found about Fenwick, Ambrose and Brandt.
next: ch3

# ============================================================
# CHAPTER THREE: FOUNDERS DAY
# ============================================================

=== ch3
scene: village
cast: hero, agent:thinking, kid
checkpoint
~ Chapter Three ~

Main Street has been transformed for the Founders Day fair. Striped tents line the sidewalks, a brass band is warming up on a stage, and the smell of funnel cakes hangs over everything. At the far end of the street, the old clock tower reads 3:30.

Agent Okafor, wearing a sunhat and pretending to shop for jam, listens to your whole report.

Agent: You have thirty minutes. Before we move, I need you to name the mole. But be absolutely certain, because if we accuse the wrong person, the real mole will know we're onto them and simply walk away.
> Name the mole -> accuse

=== accuse
scene: village
cast: hero, agent:thinking, quill:thinking
Agent Okafor waits. Quill reviews your notes in her head, muttering about peppermint, pine cleaner and burnt toast.

You think about the light in the gym office at 9:30, the misspelled word, the gum wrappers, and the key card hiding in a box of socks.
> Coach Dana Brandt -> proof
> Mr. Lyle Fenwick -> lose-wrong
> Mr. Felix Ambrose -> lose-wrong

=== lose-wrong
scene: village
cast: hero, agent:sad, kid:sad
Agent Okafor listens to your reasoning, and then she shakes her head slowly.

Agent: I'm afraid that doesn't match the evidence. That person's explanation checks out, and their spelling is flawless.

Before you can reconsider, her phone vibrates with a warning. Someone noticed her radioing for backup and recognized the signal. When you finally reach the clock tower at four, nobody is waiting there except a disinterested pigeon, and by evening, the real mole has mysteriously called in sick for the remainder of the year.

Kid: We had the evidence. We just pointed it at the wrong person.

The investigation goes cold, and the Nightjar List is never recovered.
end: lose The Wrong Suspect

=== proof
scene: village
cast: hero, agent:happy, kid:happy
Agent Okafor nods slowly, and a small, satisfied smile appears.

Agent: Coach Brandt. That's my conclusion, too. However, in this program, a conclusion is only as valuable as the evidence supporting it. If you had to convince a room full of doubtful, experienced agents, which piece of evidence would you present first?

Dash flips through your notebook, reading the clues aloud: the peppermint, the light in the office, the missing key card, and the misspelled word.
? RL.1 : Which evidence best proves that Coach Brandt wrote the note?
+ Her whiteboard misspells "rendezvous" the same way the note does.
- Mr. Fenwick says he is too busy to care about her office.
- She coaches the track team after school every day.
- The Founders Day fair is held on Main Street.
hint: Which clue connects the note itself to one particular person? Think about the mistake Agent Okafor said was "remarkably difficult to hide."
next: plan

=== plan
scene: village
cast: hero, agent:thinking, scientist:happy
Agent: Good. Now we catch her in the act. At four o'clock precisely, she'll meet her contact at the base of the clock tower, and if we arrive even one minute late, the file changes hands and disappears forever.

Mr. Ambrose pops out from behind a lemonade stand, beaming, and presses something into your hand.

Scientist: The Glitter Decoy! It looks exactly like an ordinary file drive, but when someone plugs it in, it plays the entire Remedial Recorder Club concert and sprays them with glitter. It has never once worked correctly, which statistically means that today it absolutely will.

Dash tucks the decoy into his sleeve, and the plan is set.
> Head for the clock tower -> fair

=== fair
scene: village
cast: hero, kid:happy, quill:thinking
You weave through the crowd toward the clock tower, which now reads 3:56.

On your left, a funnel cake stand is distributing free samples, and the line is only four people long. On your right, Principal Hollis is judging a pie contest and waving at you enthusiastically with a fork.

Kid: Free funnel cake! It'll only take two minutes, maximum, so we'll still make it. Probably.

Quill: Agent Okafor said four o'clock precisely, and she said that even one minute late would be too late.
> Grab a quick funnel cake sample -> lose-late
> Go straight to the clock tower -> tower

=== lose-late
scene: village
cast: hero, kid:sad, agent:sad
The line moves slowly, because the man in front of you has detailed questions about powdered sugar. When you finally receive your sample, the clock tower bell is already ringing four.

You sprint down the street, powdered sugar flying everywhere, but when you reach the tower at 4:03, nobody is there. A black car is pulling away from the curb, and Coach Brandt is strolling back toward the fair with empty hands.

Agent Okafor appears beside you, looking more disappointed than angry.

Agent: The handoff is finished. The rendezvous was at four o'clock, and we missed it.
end: lose Missed Rendezvous

=== tower
scene: city-street
cast: hero, guard:thinking, stranger
You slip behind a hot-dog cart just as the clock strikes four.

Coach Brandt, wearing her track suit and chewing gum, waits at the base of the tower. A man in a gray hoodie and mirrored sunglasses steps up beside her, holding a phone on a selfie stick, and you recognize him immediately: Gideon Crane, whose channel, Exposed!, reveals other people's secrets in exchange for views.

Stranger: Do you have it? Excellent. Once I let the cat out of the bag, my followers will know everything about your little secret school, and my channel will become the most popular in the country.

Guard: Just pay me what you promised, Crane.
? RL.4 : Crane says he will "let the cat out of the bag." What does he mean?
+ He will reveal the program's secret to everyone.
- He will release a stray cat into the fair.
- He will hide the file inside a bag.
- He will give the stolen file back to the school.
hint: This is an idiom. Look at the rest of his sentence: what will his followers know everything about?
next: swap

=== swap
scene: city-street
cast: hero, kid:happy, guard:surprised
Dash strolls past, pretending to search for his parents, and trips spectacularly over a power cable. He crashes directly into Coach Brandt, and for one confusing second, both of their hands are a blur.

Kid: So sorry, Coach! I'm incredibly clumsy! Bye!

When Coach Brandt straightens up, she is holding a small silver drive, although it is no longer her drive. Dash winks at you from behind a balloon stand, with the real file tucked safely inside his sleeve.

Brandt hands the decoy to Crane, who plugs it into his phone while he is still broadcasting live to his followers.
> Watch what happens -> glitter

=== glitter
scene: city-street
cast: hero, stranger:surprised, agent:happy
For a moment, nothing happens. Then Crane's phone begins to play the shrillest recorder concert in the history of music, and a fountain of pink glitter explodes out of the drive, coating his hoodie, his sunglasses and his very expensive phone.

Two hundred thousand viewers watch Gideon Crane sneeze glitter while a recorder squeals "Hot Cross Buns" in the background.

Agent Okafor steps out from behind the jam stand and flips open her badge.

Agent: Coach Brandt. You and I need to have a very long conversation.
> Hear what Coach Brandt has to say -> confess

=== confess
scene: city-street
cast: hero, guard:sad, agent:thinking
Coach Brandt slumps onto a bench, with glitter sparkling in her hair.

Guard: For twelve years, I've trained agents in that gym, and they never promoted me once. Crane offered me enough money to start my own program, so when I found Ambrose's card on the floor of his lab, I figured nobody would ever suspect the coach.

Agent: You trained excellent agents, Dana. But you forgot the very first lesson you ever taught them: the people in this program trust each other with their real names.

The Lantern Program's security team arrives quietly. Brandt is dismissed from the program, Crane's video becomes famous only as "Glitter Guy Sneezes," and the Nightjar List is locked securely back inside the vault.
> Return to headquarters -> theme

=== theme
scene: secret-hq
cast: hero, agent:happy, kid:happy
Back underground, Agent Okafor gathers the whole program in front of the giant map.

Agent: Yesterday, half of you were certain that Mr. Ambrose was guilty because his card was used. Some of you were sure it was Mr. Fenwick, because he is grumpy and has keys. Both were wrong. Our two newest recruits solved this case because they didn't trust their first guess. They followed the evidence, even when it led somewhere they didn't expect.

Mr. Fenwick, standing at the back, gives you a tiny nod, which may be the warmest thing he has ever done in public.
? RL.2 : Which statement best expresses a theme of the story?
+ Following the evidence matters more than trusting first impressions.
- Grumpy people usually turn out to be the guilty ones.
- It is always better to work alone than with a partner.
- Being late is fine as long as you get there eventually.
hint: Read Agent Okafor's speech. What did the recruits do that the rest of the program didn't?
next: finale

=== finale
scene: secret-hq
cast: hero, kid:happy, quill:happy
Agent Okafor pins a second lantern onto your badge. Dash receives one too, although his ends up slightly crooked, because he absolutely refuses to stop bouncing.

Kid: So what happens now? Do we get our own investigations? Our own gadgets? Gadgets that actually function?

Quill: One thing at a time, Dash. First, the official report.

Congratulations echo around the enormous room, Mr. Ambrose's stress ball explodes again, and somewhere far above you, the genuine recorder club is practicing enthusiastically.
> Write your case report -> end-report
> Go to recorder club to protect your cover -> end-recorder
> Thank Mr. Fenwick for his help -> fenwick-thanks

=== end-report
scene: secret-hq
cast: hero, agent:happy, kid:happy
You spend the evening writing your first official case report, with every clue, every time and every peppermint wrapper recorded in careful detail.

Agent Okafor reads it twice, then stamps it with the program's lantern seal and files it in the vault, right next to the reports of agents who came before you.

Agent: Clear, accurate and fair to every suspect. Welcome to the Lantern Program, Agent.

Dash insists on reading his own report aloud. It is fourteen pages long and mostly about funnel cakes.
end: win Agent of the Lantern

=== end-recorder
scene: school
cast: hero, mayor:happy, kid:happy
A good agent protects their cover, so you and Dash actually attend the Remedial Recorder Club, where you play "Hot Cross Buns" so badly that the teacher has to sit down.

At the spring concert, Principal Hollis gives you a standing ovation anyway.

Mayor: Most improved! Well, most... enthusiastic! Keep at it, champs!

Nobody in the audience suspects that the two worst recorder players in Larkmoor just caught a mole and saved a secret academy. That is exactly how it should be.
end: win Most Enthusiastic Recorder Players

=== fenwick-thanks
scene: school
cast: hero, keeper:thinking, cat:happy
You find Mr. Fenwick beside the back door, where Captain Whiskers is snoozing contentedly on a folded towel.

Keeper: Thanks? For what? I just mop floors around here.

Then he studies you for a long, thoughtful moment, reaches into his pocket, and pulls out an old brass badge. It is shaped like a lantern, and its five tiny stars have been worn almost completely smooth.

Keeper: I was the program's very first recruit, forty years ago, and they called me the Nightjar. These days, I just keep an eye on the doors, the hallways and the cats.
> Ask him about the old days -> end-secret

=== end-secret
scene: school
cast: hero, keeper:happy, cat:happy
Mr. Fenwick shares stories until the sun goes down: the mystery of the singing statue, the legendary spaghetti code of 1991, and the night he pursued a jewel thief straight through an automatic car wash.

Keeper: You noticed the light in the office, and you noticed the spelling, but the most important thing you noticed was that I wasn't the villain. Most people never look past the grumpy part.

He presses his old five-star badge into your hand and closes your fingers around it.

Keeper: Keep it. Someday you'll be training recruits of your own, and when you do, remind them to feed the cats.
end: secret The Nightjar's Badge

