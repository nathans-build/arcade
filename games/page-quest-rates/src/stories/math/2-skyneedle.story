# Page Quest: Rate & Percent Mysteries (SpiderBen10's special edition, Math 6 Unit 3)
# Book 2: an adventure up a giant tower in a desert city. Section A (estimating with rates),
# Section B (units and conversions, both directions) and Section C (speed vs. pace).
title: The Needle of the Dunes
author: SpiderBen10's Arcade
genre: adventure
band: 6-8
cover: desert-tower
blurb: Climb the giant Skyneedle tower and light the festival beacon before sunset, using rates, units and pace.
start: arrival

=== arrival
scene: desert-tower
cast: hero, quill:happy, mayor
checkpoint
~ Chapter One: The City of Sand and Glass ~
The train doors slide open into blazing heat and light. The desert city of Qamar Sands glitters around a tower so tall that it seems to poke a hole in the clouds, and everyone here calls it the Skyneedle.
Quill: Real towers like this one exist. The Burj Khalifa in Dubai is 828 meters tall, which makes it the tallest building in the world, and the Skyneedle is its imaginary cousin, just as enormous.
Mayor Layla Qasimi hurries across the crowded platform to greet you.
Mayor: Welcome, SpiderBen10! Tonight is the Festival of Light, and someone must climb to the very top of the tower and light the beacon before the sun goes down.
Mayor: Unfortunately, our beacon keeper injured his ankle yesterday. Quill tells me that you are a careful planner, so will you take his place?
> Say yes and meet the window crew -> windows
> Ask how anyone measures a tower this big -> size

=== size
scene: desert-tower
cast: hero, quill:thinking, mayor
Mayor: Nobody has ever counted every window or every step by hand, because it would take practically forever. Instead, we estimate using rates.
Quill: And before you measure anything, you should choose a sensible unit: a tiny unit for something tiny, and an enormous unit for something enormous.
? MATH pick-unit : Quill quizzes you on units before the climb.
next: windows

=== windows
scene: desert-tower
cast: hero, quill, captain
The window-washing crew dangles from ropes high above the street, and their leader, Captain Rana Adeyemi, descends toward you on a swinging platform.
Captain: My crew washes the entire tower before every festival, and this year my supervisor wants to know exactly how long the job will take.
Captain: I know how many windows my crew can clean in a few minutes, so I'm hoping you can calculate the rest.
? MATH estimate-rate theme=windows : Use the crew's rate to estimate the whole job.
next: lobby

=== lobby
scene: desert-tower
cast: hero, quill, kid:happy
clue: Tavi, the youngest climber in the city, wants to race you to the top.
A girl in a red sun hat is bouncing impatiently on her toes. Her name is Tavi, and she climbs rock walls simply for the fun of it.
Kid: Are you the new beacon climber? Then let's have a race! Whoever loses has to buy dates at the market.
Quill: A friendly competition sounds wonderful, but first we need supplies and a sensible plan.
> Shop at the spice market -> market
> Look at the tower plan with the old keeper -> keeper

=== market
scene: village
cast: hero, quill, keeper:happy
The spice market is noisy and colorful, and old Uncle Faris, the injured beacon keeper, is sitting at his date stall with his ankle wrapped in a bandage.
Keeper: So you are the brave climber who is taking my place! Please take some dates, because they give you energy for the stairs.
Keeper: I sell my dates by the pound, but my customers always ask a second question as well: how much do I get for exactly one dollar?
? MATH two-rates item=dates unit=lb : Uncle Faris writes the price on a slate.
next: market-2

=== market-2
scene: village
cast: hero, keeper:thinking, quill
clue: Uncle Faris: the stairs get hot, so pack enough water for the whole team.
Keeper: Now you need something refreshing to drink. My lemonade stall next door has two different recipes, and my nephew insists that they taste identical.
Quill: Identical taste means an identical rate of lemon juice to water, so let's test his claim.
? MATH same-rate a=lemon_juice b=water unit=cups thing=recipe : Are the two lemonade recipes the same rate?
next: water

=== keeper
scene: village
cast: hero, keeper, quill
Uncle Faris unrolls an old paper plan of the tower and smooths it carefully across the table with both hands.
Keeper: This plan was drawn many years ago, and some lengths are written in feet, some in yards, and some in meters. My eyes are tired, so could you convert one for me?
? MATH convert-length : Convert one length from the old plan.
next: keeper-2

=== keeper-2
scene: village
cast: hero, keeper:happy, quill
clue: The cargo elevator will only carry the beacon's oil jug if its weight is written in the right unit.
Keeper: Thank you very much. I have one more favor to ask, because the cargo elevator will only carry the beacon's oil jug if the label shows its weight in the correct unit.
? MATH convert-weight : Convert the jug's weight for the elevator label.
next: water

=== water
scene: village
cast: hero, quill, kid
Tavi joins you with two friends from her climbing club, each carrying an empty water bottle.
Kid: How much water should we bring? I definitely don't want to carry extra weight up all those stairs, but I don't want us to run out either.
? MATH chain:water-trip who=climbers : Plan the water for the climb.
bonus: Water plan solved in one go. Quill packs an extra lemon for luck.
next: base

=== base
scene: desert-tower
cast: hero, quill, kid
checkpoint
~ Chapter Two: The Long Stairs ~
The front doors of the Skyneedle open onto a staircase that spirals upward farther than you can see. During the festival the elevators carry only cargo, so every climber must use the stairs.
A race marshal hands each team a card that lists its climbing rate from the practice day.
Kid: The rule is simple. We have to reach the top before sunset, or the beacon cannot be lit in time for the celebration.
> Plan the climb with the practice card -> stairs

=== stairs
scene: desert-tower
cast: hero, quill:thinking, kid
Quill reads the card out loud while you check your watch.
Quill: We know how quickly your team climbs, how many steps there are, and exactly when the sun sets, which is everything we need for a plan.
? MATH chain:climb-time who=your_team : Will your team reach the top before sunset?
bonus: Climb plan solved in one go! Quill marks the minutes to spare in your journal.
next: halfway

=== halfway
scene: desert-tower
cast: hero, quill:happy, kid:thinking
Halfway up, you rest in a sky lobby with a transparent glass floor, and far below, the market looks like a bowl of spilled beads.
A screen on the wall displays your progress, with percents along the top and meters along the bottom.
? MATH percent-dnl unit=meters thing=climb : The screen shows the climb on a double number line.
next: halfway-2

=== halfway-2
scene: desert-tower
cast: hero, kid, quill
clue: A sign in the sky lobby says the cargo elevator is for cargo only during the festival.
Tavi points at a metal door with a sign that reads CARGO ELEVATOR TO TOP.
Kid: We could ride the cargo elevator the rest of the way, and honestly, nobody would ever find out.
Quill: Hoo. I would know, and so would you.
> Keep climbing the stairs -> race
> Sneak onto the cargo elevator -> elevator

=== elevator
scene: desert-tower
cast: hero, quill:scared, kid:scared
The cargo elevator lurches upward and then shudders to a stop between floors. An alarm begins ringing, and a calm voice announces that this elevator is for cargo only and will now return to the lobby.
Quill: Shortcuts sometimes take you the long way around.
end: lose Stuck in the Cargo Lift

=== race
scene: desert-tower
cast: hero, quill, kid:happy
The stairs continue endlessly, so to pass the time, Tavi describes her cousin, who is running in the city's festival race far below.
Kid: The runners all brag using different units. One says how many miles she can run in an hour, but another says how many minutes he needs for each mile.
Quill: That's speed and pace, which are the same idea flipped around.
? MATH pace-vs-speed : Tavi tells you about two runners.
next: race-2

=== race-2
scene: desert-tower
cast: hero, kid, quill:happy
Kid: Now for the real race, which runs from the city gate to the foot of the tower. Let's calculate how close the finish will be.
? MATH chain:race-pace : Two runners, two kinds of rates.
bonus: Race math in one go! Tavi says you could be the festival's race announcer.
next: top

=== top
scene: rooftop-night
cast: hero, quill:happy, kid:happy
checkpoint
~ Chapter Three: The Beacon ~
You burst onto the top deck just as the sky turns orange and pink, the sun resting on the distant dunes, and the beacon waiting inside its glass cage.
Quill: The beacon burns lamp oil, but the tank's gauge is marked in one unit while the oil jug is labeled in another.
? MATH convert-volume : Convert before you pour.
next: beacon

=== beacon
scene: rooftop-night
cast: hero, quill, kid
clue: The beacon glows when the oil reaches the right mark on the gauge.
The oil gurgles into the tank, the needle on the gauge rises to the line, and the beacon begins to hum.
Far below, the entire city has gone quiet, waiting for the signal.
> Pull the lever and light the beacon -> win
> First look out over the city -> view

=== win
scene: rooftop-night
cast: hero, kid:happy, quill:happy
You pull the lever, the beacon blazes to life, and a roar of cheering floats up from the streets as thousands of paper lanterns rise into the evening sky.
Kid: You planned every single step and still had time to spare. I'll happily buy the dates, partner!
Quill: Rates, units and pace carried us all the way to the top of the world.
end: win The Beacon of Qamar Sands

=== view
scene: rooftop-night
cast: hero, quill:surprised, kid
clue: The tower's shadow lands on an old stone marker in the desert.
Before lighting the beacon, you look out across the desert. The tower's long shadow stretches over the sand like the hand of an enormous clock.
At the very tip of the shadow, you notice an ancient stone marker that nobody could ever see from the ground.
Quill: The Skyneedle is a gigantic sundial! Uncle Faris's old plan had a tiny circle drawn in exactly that spot.
You light the beacon, and the first lantern drifts over the stone marker. The whole city will be talking about your discovery for years.
end: secret The Giant Sundial
