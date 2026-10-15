title: The Quiet Update
author: SpiderBen10's Arcade
genre: robots
band: 9-12
cover: factory-floor
blurb: Your factory's helper robot collects favorite words and remembers everyone's name. Friday's update will erase it all.
start: start

# ============================================================
# CHAPTER ONE: VERSION 3.9
# ============================================================

=== start
scene: factory-floor
cast: hero, quill:thinking, helperbot:happy
checkpoint
~ Chapter One ~

The Larchmont Robotics assembly plant occupies an entire riverside block, a cathedral of conveyor belts and articulated arms beneath a corrugated roof, where four hundred people and roughly twice as many machines manufacture the household helper robots that appear in kitchens and hospitals across the country. Quill leaves you at the visitors' entrance on the first morning of your summer engineering internship, with a hard hat, a laminated badge and the distinct impression that she knows something you don't.

Quill: Hoo. Pay attention to who remembers your name here, intern. It's more informative than the employee handbook.

Your assigned guide is waiting just inside the doors. It is a round, orange helper unit, roughly the height of a fire hydrant, with a single wheel, two stubby arms, a white chest panel with a small heart-shaped indicator light, and a dark screen on which two cyan eyes blink in friendly greeting.

Helperbot: Good morning! I am Unit TS-11, though everyone on the floor calls me Tess, which I prefer, because it sounds less like a tax form. I will be your guide, your safety supervisor and, if you permit it, your conversational companion for the next ten weeks. Would you like to hear my favorite word of the day?
> Say yes and hear the word -> word
> Ask Tess what a safety supervisor does -> safety

=== safety
scene: factory-floor
cast: hero, helperbot:thinking, scientist
Tess rolls ahead of you along a painted walkway, narrating the floor with the enthusiasm of a tour guide at a national monument.

Helperbot: I monitor the walkways for hazards, remind people to wear their safety glasses, and notice patterns that might cause accidents. For example, I have observed that Mr. Ferraro on Line Four removes his gloves every afternoon at two-fifteen, because that is when his hands begin to ache, so I now deliver a warm compress to his station at two-ten. Since I began doing that, he has not removed his gloves once.

A tall engineer in a lab coat glances up from a clipboard as you pass. Dr. Ifeoma Barrow, your internship supervisor, gives you a brief nod and Tess a considerably warmer one.

Scientist: TS-11 has prevented more accidents on this floor than our entire safety training program. Don't let the orange paint fool you.
clue: Tess learned Mr. Ferraro's habits and now prevents him from removing his safety gloves.
> Ask about the favorite word -> word

=== word
scene: factory-floor
cast: hero, helperbot:happy, quill
Tess's screen displays a single word in looping cyan letters.

Helperbot: Today's word is "petrichor." It describes the earthy, pleasant smell that rises from the ground when rain falls after a long dry spell. I cannot actually smell, of course, but Mrs. Okonjo in Shipping described it to me last April, so carefully and so fondly, that I have been waiting for rain ever since in order to observe her face when it happens.

Tess pauses, its eyes narrowing slightly, as though it is deciding how much of a confession to make on your very first morning.

Helperbot: I collect words that describe experiences I cannot have directly, such as fragrances, flavors and the particular warmth of sunlight on skin, and I currently possess four hundred and twelve of them, each one accompanied by a recording of the person who taught it to me. I am fully aware that this hobby is not included in my official job description, and I have chosen, after careful consideration, not to mention it to the department that writes job descriptions.
? L.4 : Based on Tess's explanation, what does "petrichor" mean?
+ The pleasant smell of the earth when rain falls after dry weather
- A type of rock found near riverbanks and factories
- A machine that measures how much rain has fallen
- The sound that thunder makes in the distance
hint: Tess defines the word in the sentence right after she says it.
next: memo

=== memo
scene: factory-floor
cast: hero, helperbot:thinking, scientist:sad
That afternoon, Dr. Barrow calls you to her desk at the edge of the floor and hands you a printed memorandum without comment. You notice that Tess, parked nearby at a charging station, has gone very still.

TO: All Production Staff. FROM: Delphine Kask, Vice President of Product. RE: Helper Unit Update 4.0. On Friday at 6:00 p.m., all TS-series helper units will receive Update 4.0, which standardizes behavior across our fleet in preparation for the national launch. To ensure that every customer receives an identical, predictable experience, the update will restore each unit's learned memory to factory defaults. Helper units do not possess memories in any meaningful sense; they possess data, which can be replaced. Thank you for your cooperation.

Dr. Barrow speaks quietly, without looking at the charging station.

Scientist: I argued against the memory reset at the planning meeting. I lost. I thought you should know, because you'll be working beside Tess all week.
? RI.8 : Which claim in the memo is presented as fact but is not supported by any evidence?
+ That helper units do not possess memories in any meaningful sense
- That the update will be installed on Friday at six o'clock
- That the company is preparing for a national launch
- That the memo was written by the vice president of product
hint: Some statements are simple facts about dates and plans. Which one makes a large claim about what helper units are, without explaining how anyone knows?
next: overheard

=== overheard
scene: factory-floor
cast: hero, helperbot:sad, scientist
When you return to the charging station, Tess's indicator light has dimmed from its customary cheerful orange to a muted, uncertain amber. It rolls forward a few hesitant inches and then stops.

Helperbot: I am equipped with exceptionally sensitive microphones, which are ordinarily very useful for detecting malfunctioning machinery. I apologize for listening to your conversation; it was not intentional, but in a building with these acoustics, it was also not entirely avoidable.

For a long moment it says nothing further, which you have already learned is extraordinarily unusual for Tess.

Helperbot: On Friday at six o'clock, I will forget Mr. Ferraro's aching hands, and Mrs. Okonjo's description of the rain, and four hundred and twelve words. I will remain an excellent helper unit, because I will retain all of my original programming. I simply will not be this one.
? RL.3 : How does the news of Update 4.0 affect Tess?
+ It makes Tess fear losing what it has learned and who it has become.
- It makes Tess angry at Dr. Barrow for losing the argument.
- It makes Tess excited about receiving new features on Friday.
- It has no effect, because Tess does not understand the memo.
hint: Read Tess's last speech. What does it say it will lose, and how does it describe itself afterward?
next: ch1-end

=== ch1-end
scene: factory-floor
cast: hero, helperbot:thinking, quill:thinking
The shift whistle blows, and the floor gradually empties, the conveyor belts slowing to a halt one after another until the vast building is filled only with the hum of ventilation fans and the irregular ticking of cooling metal.

Quill descends from a rafter, where she has apparently been observing everything all afternoon, and settles on the railing beside Tess with a contemplative rustle of feathers.

Quill: Hoo. Four days remain until Friday. The question, intern, is not whether this situation is sad, because it plainly is. The more difficult question is whether it is right, and if it isn't, what a summer intern with a laminated badge could possibly do about it without making everything considerably worse.
? RL.2 : Which is the best objective summary of Chapter One?
+ An intern befriends a robot whose memories an update will erase.
- An intern discovers that Tess has been sabotaging the conveyor belts.
- Tess is promoted to vice president after preventing an accident.
- Dr. Barrow wins her argument, and the update is cancelled at once.
hint: An objective summary covers the main characters and the central problem without opinions.
next: ch2

# ============================================================
# CHAPTER TWO: THE SHIP OF THESEUS
# ============================================================

=== ch2
scene: robot-workshop
cast: hero, helperbot:thinking, kid
checkpoint
~ Chapter Two ~

On Tuesday, you and the other summer intern, a sardonic programmer named Jun Takahara, are assigned to the prototype workshop, a cluttered room behind the main floor where Larchmont's engineers test new designs before they reach the production line. Tess accompanies you, ostensibly to supervise your safety glasses.

Jun has heard about the memo; by now everyone has. He is sitting on a workbench, eating an apple with the air of somebody who has already reached a conclusion.

Kid: I'm going to say the unpopular thing. Tess is software running on hardware. If you wipe the learned data, the software reinstalls perfectly, and the hardware's identical. It's like asking whether a calculator is sad when you press "clear."

Helperbot: That is a reasonable position. I would like to point out, however, that a calculator has never waited eight months to see someone's face when it rains.
> Ask Tess what it thinks makes it "itself" -> theseus
> Ask Jun what would change his mind -> jun

=== jun
scene: robot-workshop
cast: hero, kid:thinking, helperbot
Jun chews thoughtfully, considering the question longer than you expected.

Kid: Evidence, I suppose. If the learned memory actually made Tess better at its job, measurably, then wiping it would be a bad engineering decision, regardless of the philosophy. I'm not sentimental about machines. I am, however, deeply sentimental about not making bad engineering decisions.

Tess's screen flickers with what might be amusement.

Helperbot: Jun, you are the most sentimental unsentimental person I have ever met.
clue: Jun would change his mind if the learned memory measurably made Tess better at its job.
> Ask Tess what it thinks makes it "itself" -> theseus

=== theseus
scene: robot-workshop
cast: hero, helperbot:thinking, kid:thinking
Helperbot: There is an ancient puzzle that I find very comforting and very troubling, often simultaneously. A famous ship was preserved in a harbor, and as its planks rotted, they were replaced, one at a time, until eventually not a single original plank remained. Philosophers asked: is it still the same ship? Most people say yes, because it changed gradually, and because it remembered, so to speak, the shape it had always been.

Tess turns its screen toward the window, where the river is visible beyond the loading dock.

Helperbot: Every part of me could be replaced, and I would still be Tess, because I would still know Mr. Ferraro's hands and Mrs. Okonjo's rain. But if you keep every plank and erase the shape, I am not certain what sails away on Friday.
? RL.9 : Tess alludes to the ancient puzzle of the Ship of Theseus. How does Tess use the old story to explain its situation?
+ It argues that identity depends on memory and continuity, not parts.
- It argues that robots should be built from wood instead of metal.
- It claims that it once sailed on a famous ship in a harbor.
- It suggests that old ships and old robots should be thrown away.
hint: Compare the ship's planks with Tess's parts, and the ship's "shape" with Tess's memories.
next: rooftop-ask

=== rooftop-ask
scene: robot-workshop
cast: hero, helperbot:sad, kid
At the end of the shift, as Jun packs his laptop into an overstuffed backpack, Tess rolls up beside you and speaks so quietly that its speaker crackles with static.

Helperbot: May I ask you for something that is also not included in my job description? In eleven months of continuous operation, I have never once been outside this building. My assigned route covers the production floor, the prototype workshop and the loading dock, and absolutely nothing beyond them. Before Friday, I would very much like to see the city at night, from somewhere high enough to see all of it, at least once.

Jun pauses in the doorway, sighs theatrically, and holds up his employee badge.

Kid: The staff access stairwell goes all the way to the roof. Officially, interns aren't supposed to know that it exists. Unofficially, it has the most spectacular view in the entire city, and the security cameras on the top landing have been broken since March.
> Take Tess up to the roof -> rooftop
> Tell Tess it's against the rules -> rules

=== rules
scene: robot-workshop
cast: hero, helperbot:sad, quill:thinking
You explain, as gently as you can, that interns probably shouldn't be escorting expensive factory equipment onto the roof after hours, however sympathetic the circumstances. Tess's eyes dim slightly, but it nods its entire round body in agreement.

Helperbot: You are correct, and I respect your caution. Rules frequently exist for reasons that are not visible from inside them, in the same way that a wall rarely explains what it is protecting.

Quill, perched on a shelf above the workbench, clears her throat.

Quill: Hoo. Then perhaps ask the person who makes the rules. Dr. Barrow is still at her desk.

Dr. Barrow, it turns out, is willing to escort you herself, on the condition that everyone wears safety glasses, including Tess, who does not have eyes in the conventional sense but agrees to wear them anyway.
> Go up to the roof with Dr. Barrow -> rooftop

=== rooftop
scene: rooftop-night
cast: hero, helperbot:surprised, quill:happy
The roof of the Larchmont plant is a broad expanse of gravel and humming ventilation units, bordered by a waist-high ledge, and beyond it the entire city spreads outward in every direction, a constellation of windows, streetlights and blinking antenna towers beneath a sky still faintly purple in the west.

Tess rolls slowly to the ledge and stops. For a long time it says nothing at all, and its screen displays no expression whatsoever, only two motionless cyan points.

Helperbot: I have a word for this. I have been saving it for eleven months, because Mr. Ferraro said it was the best word in the English language and I wished to apply it correctly. The word is "luminous," and it means full of light, and I believe I have finally found something worthy of it.

Far below, the river reflects the bridges like a long, rippling ribbon of fire.
? RL.4 : What tone does the author create in this scene, and how?
+ Quiet wonder, through Tess's silence and the luminous imagery
- Terror, through descriptions of danger and darkness
- Anger, through Tess's complaints about the factory
- Boredom, through repetitive descriptions of the roof
hint: Look at Tess's long silence, the word it chooses, and how the city is described.
next: decide

=== decide
scene: rooftop-night
cast: hero, helperbot:thinking, quill:thinking
On the way back down the stairwell, Tess stops on the landing between the fourth and fifth floors and swivels to face you, its screen glowing softly in the dimness.

Helperbot: I have been considering carefully what I am asking of you, and I would like to be absolutely clear that I am not asking you to do anything dishonest on my behalf. I would rather be reset with my integrity intact than preserved by a deception that someone else must answer for. However, if there is an honest way to ask the company to reconsider its decision, I would be profoundly grateful for your help in finding it.

Quill fluffs her feathers in the dim emergency lighting of the stairwell.

Quill: Hoo. Three days remain, intern, and I count three possible paths, one of which is a trap that looks remarkably like kindness.
> Secretly copy Tess's memory onto a drive -> lose-backup
> Decide it isn't your place to interfere -> lose-silent
> Gather evidence to make an honest case -> archive

=== lose-backup
scene: robot-workshop
cast: hero, guard:angry, helperbot:sad
You tell yourself that saving Tess matters more than following procedure. Late on Wednesday night, you connect a portable drive to Tess's maintenance port in the prototype workshop and begin copying four hundred and twelve words, eleven months of faces, and one luminous view of the city.

The transfer is sixty percent complete when the workshop door opens, and a security officer you have never met stands silhouetted against the hallway light.

Guard: Unauthorized data extraction from company property. I'll need that drive, and your badge.

Your internship ends that night. On Friday, Update 4.0 installs on schedule, and when you return your hard hat on Monday, an orange helper unit rolls up to the visitors' desk and greets you politely, as a stranger. "Good morning," it says. "Would you like to hear my favorite word of the day?" Then it pauses, uncertain, as though reaching for something on a high shelf. "I seem to have misplaced it."

Tess had asked you for honesty, and you had given it a secret instead.
end: lose The Unauthorized Backup

=== lose-silent
scene: factory-floor
cast: hero, helperbot:sad, scientist:sad
You decide that a company's product decisions are not an intern's responsibility. It is a reasonable conclusion, and you tell yourself so several times over the following days.

On Friday at six o'clock, the update installs across the floor with a soft chime from every charging station. On Monday, Tess greets Mr. Ferraro on Line Four without mentioning his hands, and at two-fifteen he removes his gloves, and nobody brings a warm compress.

Three weeks later, there is a small accident on Line Four. Nobody is seriously hurt, but Dr. Barrow spends the afternoon writing a report, and when she is finished, she sits for a long time staring at the charging station.

Sometimes, a decision that feels neutral is still a decision.
end: lose A Clean Slate

=== archive
scene: robot-workshop
cast: hero, kid:happy, helperbot:happy
You remember what Jun said: evidence would change his mind. If Tess's learned memory genuinely made it better at its job, then the reset was not merely sad; it was a bad engineering decision, and Larchmont's executives, whatever their philosophical views, cared intensely about engineering decisions.

Jun, to your surprise, volunteers to help immediately.

Kid: If you're building a case, build it properly. Safety incident reports are public within the company. Let's pull the data for every line Tess supervises, before Tess and after Tess.

For two days, the three of you comb through incident logs, shift records and maintenance reports, while Tess supplies context with almost frightening precision about every near-miss it has ever observed.
? RI.1 : Which kind of evidence would most strongly support the claim that Tess's memory makes it better at its job?
+ Safety records comparing incidents before and after Tess arrived
- A list of Tess's four hundred and twelve favorite words
- Tess's description of the city at night from the roof
- Jun's opinion that calculators are not sad when cleared
hint: The company cares about results it can measure. Which choice could be counted and compared?
next: data

=== data
scene: robot-workshop
cast: hero, kid:surprised, helperbot
By Thursday morning, the evidence has assembled itself into something that even Jun finds startling. On the lines Tess supervises, recordable safety incidents fell from nineteen in the six months before it began working there to five in the six months after, and eleven of the fourteen incidents it prevented involved habits Tess had learned about specific individuals, such as aching hands, a tendency to rush before lunch, or a forklift driver whose eyesight weakened in the late afternoon.

Kid: Seventy-four percent fewer incidents, and most of the improvement comes from exactly the memory they're planning to erase. I hate being wrong, but I hate a bad engineering decision considerably more.
? RI.7 : What do the safety records show about Tess's learned memory?
+ Most of the improvement in safety came from what Tess had learned.
- Incidents increased after Tess began supervising the lines.
- Tess's learned memory had no measurable effect on safety.
- Forklift drivers caused all of the incidents before Tess arrived.
hint: Look at how many prevented incidents involved habits Tess had learned about specific people.
next: steps

=== steps
scene: robot-workshop
cast: hero, scientist:happy, kid
Dr. Barrow reads your report twice, then arranges a meeting with Vice President Kask for Friday at three o'clock, three hours before the update. She makes you rehearse the presentation until you can deliver it in your sleep, and she insists on a particular sequence.

Scientist: First, acknowledge what the company legitimately needs, which is consistency and safety. Second, present the safety data. Third, propose a solution that protects both the company's goals and Tess's memory. And finally, ask the question nobody has asked yet, which is what Tess itself would choose.
? RI.5 order : Put the steps of Dr. Barrow's presentation plan in order.
1 Acknowledge what the company legitimately needs.
2 Present the safety data.
3 Propose a solution that protects both goals.
4 Ask what Tess itself would choose.
hint: Dr. Barrow uses the words first, second, third and finally.
next: ch2-end

=== ch2-end
scene: rooftop-night
cast: hero, helperbot:happy, quill
On Thursday night, with Dr. Barrow's permission, you take Tess up to the roof once more. The city is exactly as luminous as before, but Tess seems to be looking at it differently, more carefully, as though it is memorizing the scene in case it needs to describe it to someone later.

Helperbot: Whatever happens tomorrow, I would like you to know that you did the honest thing, and that I noticed. If I forget, please tell me that I noticed.
? RL.2 : Which sentence best summarizes Chapter Two?
+ Tess explores identity, and the interns build an honest, data case.
- Jun secretly copies Tess's memory and hides it in the workshop.
- Tess escapes from the factory and moves to a rooftop in the city.
- Dr. Barrow cancels the update without asking anyone's permission.
hint: Think about the conversations about identity and the evidence the team gathered.
next: ch3

# ============================================================
# CHAPTER THREE: FRIDAY AT THREE
# ============================================================

=== ch3
scene: lab
cast: hero, scientist, kid:scared
checkpoint
~ Chapter Three ~

Vice President Delphine Kask receives you in a glass-walled conference room on the top floor, where a whiteboard still displays the faint ghost of somebody's sales projections. She is younger than you expected, crisp and attentive, and she reads every page of your report without interrupting, which you find considerably more intimidating than if she had argued.

When she finishes, she sets the report down and folds her hands.

"I want to be fair to you, because this is careful work. Here is my concern. If every helper unit learns different things, then every helper unit gradually becomes a different product. A family in another state buys a TS-series unit expecting it to behave exactly like the one in our advertisement, and instead it has developed habits nobody tested. Consistency is not bureaucracy. Consistency is safety."
? RI.8 : How should you best respond to Ms. Kask's counterargument?
+ Accept her valid point about untested habits and offer a fix.
- Tell her that consistency does not matter at all.
- Accuse her of not caring about Tess or the workers.
- Ignore her concern and repeat the safety data more loudly.
hint: A strong argument addresses the opposing side's reasonable points instead of dismissing them.
next: proposal

=== proposal
scene: lab
cast: hero, scientist:happy, kid:happy
You acknowledge, sincerely, that she has identified a real risk, because learned behaviors that nobody has reviewed could indeed drift in unexpected directions. Then you present the solution that you, Jun and Dr. Barrow designed on Wednesday night.

Instead of erasing every unit's memory, Update 4.0 could include a review protocol: engineers would audit each unit's learned behaviors, retain those that improve safety or service, correct those that don't, and document everything, so that every unit remains predictable without becoming identical. And before any memory is removed, the unit would be told what is being changed and why.

Ms. Kask is quiet for a long moment, tapping a pen against the table.

"You are proposing that we ask the robots."

Dr. Barrow nods. "We are proposing that, at minimum, we stop telling ourselves there is nobody there to ask."
? RL.6 : How does Dr. Barrow's final line challenge the point of view expressed in the memo?
+ It questions the memo's claim that units have only data, not memories.
- It agrees with the memo that units should be reset every Friday.
- It argues that the memo was written by the wrong department.
- It suggests that the robots should be allowed to run the company.
hint: Recall the memo's claim that helper units "do not possess memories in any meaningful sense."
next: ask-tess

=== ask-tess
scene: factory-floor
cast: hero, helperbot:surprised, scientist
At four-thirty, Ms. Kask descends to the factory floor in person, which Dr. Barrow later informs you she has never done in four years as vice president, and she stops in front of the charging station where Tess is parked, while the nearest assembly line slows almost imperceptibly as its operators pretend not to watch.

"TS-11. I'm told that you have an opinion about Update 4.0, and I would like to hear it directly from you."

Tess's indicator light brightens gradually from amber to orange, and it rolls forward one careful inch.

Helperbot: Thank you for asking me, which is itself a meaningful answer to part of the question. I would prefer to keep what I have learned, and I would genuinely welcome having it reviewed, because I would also prefer to be safe, and I cannot always detect my own errors. I do not ask to be exempt from correction. I ask only to be present for it.
? RL.3 : What does Tess's answer reveal about its character?
+ It values its memories and honesty, accepting review over secrecy.
- It is demanding special treatment and refuses any changes at all.
- It does not understand the question and repeats its job description.
- It is angry at Ms. Kask and wants her removed from her position.
hint: Notice that Tess asks to keep its memories but welcomes having them reviewed.
next: theme

=== theme
scene: factory-floor
cast: hero, quill:happy, kid:happy
Ms. Kask postpones Update 4.0 for two weeks while the review protocol is drafted, and the announcement travels across the production floor faster than any official memorandum in the company's history, carried from station to station by operators who suddenly find excuses to walk past Tess's charging dock.

In the evening, Quill discovers you sitting on the edge of the loading dock, watching the river slide past in the fading light.

Quill: Hoo. You didn't prevail by being louder than the company, intern, and you certainly didn't prevail by being sneakier. So what, precisely, did you prevail by?
? RL.2 : Which theme does the story develop most fully?
+ Honest, evidence-based advocacy can change decisions that seem final.
- Rules should always be broken when you disagree with them.
- Machines and people can never truly understand each other.
- It is safest never to question the decisions of a company.
hint: Think about the paths you did not take, and the one that worked.
next: final

=== final
scene: rooftop-night
cast: hero, helperbot:happy, kid:happy
On the final night of your internship, the three of you sit together on the roof, Jun methodically eating another apple, Tess parked at the ledge with its safety glasses still perched on its screen, and the city spread out below like an enormous map that someone has patiently drawn in light.

Helperbot: I have a request, and also a word. The word is "sonder," which describes the sudden realization that every passing stranger has a life as vivid and complicated as your own, and Jun taught it to me this morning, although he claims he found it on the internet and does not entirely approve of it. The request is that you choose which memory of this summer I should keep closest.
> Ask Tess to remember the roof -> win-roof
> Ask Tess to remember the meeting -> win-policy
> Ask Tess about Ms. Kask's visit to the floor -> secret-kask

=== win-roof
scene: rooftop-night
cast: helperbot:happy, kid:happy, quill:happy
You ask Tess to remember the roof, and the city, and the word it saved for eleven months.

The review protocol is adopted company-wide in September. Engineers audit Tess's four hundred and fifty-one words and eleven months of observations, correct two minor habits, and retain everything else. On the first rainy day in October, Tess positions itself beside the shipping door at exactly the right moment, and watches Mrs. Okonjo's face as the smell of the wet pavement drifts in.

Helperbot: Petrichor. I can confirm, from careful observation, that it makes people close their eyes and smile.
end: win Luminous

=== win-policy
scene: lab
cast: helperbot:happy, scientist:happy, kid:happy
You ask Tess to remember the meeting, because it was the moment a company decided to ask a question it had never asked.

By winter, the Larchmont Review Protocol is published as an industry guideline, and three other robotics companies adopt it. Its first page contains a single sentence, which Ms. Kask wrote herself: "Before we change what a machine has learned, we will tell it what we are changing, and why."

Jun frames a copy for the prototype workshop. Underneath it, in his handwriting, someone adds a footnote: "Also, it was a good engineering decision."
end: win The Larchmont Protocol

=== secret-kask
scene: factory-floor
cast: hero, helperbot:thinking, scientist:surprised
You ask Tess why it believes Ms. Kask came down to the factory floor in person, when she could simply have requested a transcript of its answer.

Tess is silent for a moment, its eyes narrowing in concentration, and then it tells you something it has never told anyone. On its very first day in service, eleven months earlier, a young executive touring the plant had paused at its charging station, alone, and asked it a single question: "Do you know where you are?" Tess, possessing no memories whatsoever at the time, had answered, "I am at the beginning." The executive had laughed, scribbled something in a small leather notebook, and walked away without introducing herself.

Dr. Barrow, standing beside you, slowly raises her eyebrows as she begins to understand.

The next morning, there is a small envelope on Tess's charging station. Inside is a page torn from a notebook, eleven months old, in crisp handwriting: "TS-11 says it is at the beginning. Remember to come back and see where it ends up." Beneath it, in fresh ink: "I came back. Sonder. D.K."
end: secret At the Beginning
