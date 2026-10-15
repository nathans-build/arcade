title: Tumble's Long Way Home
author: SpiderBen10's Arcade
genre: robots
band: 6-8
cover: rooftop-night
blurb: A storm knocked out a delivery rover's GPS. It has one package, one paper map, and three hours of battery left.
start: start

# ============================================================
# CHAPTER ONE: RECALCULATING
# ============================================================

=== start
scene: city-street
cast: hero, quill:thinking, rover:scared
checkpoint
~ Chapter One ~

The thunderstorm that rolled through the city of Copperton this morning has finally moved on, leaving puddles on every sidewalk and broken branches scattered across the streets. Quill sets you down outside a corner diner, where something small and green is spinning in slow, unhappy circles.

It is a six-wheeled delivery rover, about the size of a large suitcase, with a solar panel folded on one side and a white camera head on a short mast. Across its body, yellow letters read COPPERTON COURIER CO. UNIT 7. Its screen shows two frantic green eyes.

Rover: Recalculating. Recalculating. Recalculating. Excuse me, pedestrian, could you please tell me where I am? And also where everything else is?

Quill: Hoo. That is a very large question for such a small robot.
> Ask the rover what happened -> what
> Look at the rover's broken mast -> mast

=== mast
scene: city-street
cast: hero, rover:sad, quill
You kneel beside the rover and carefully examine its mast. There is a jagged plastic stub where something was obviously attached until very recently, and several colorful wires dangle from it like strands of overcooked spaghetti.

A few feet away, half buried in a puddle, lies a small white satellite dish with a cracked edge.

Rover: That is my GPS receiver. It communicates with satellites orbiting the planet, so that I always know my exact location. At 9:14 this morning, a falling branch disconnected it from my body, and I have been recalculating ever since. I have recalculated approximately four thousand times, and none of my calculations have been successful.
clue: Tumble's GPS dish was knocked off by a falling branch during the storm.
> Ask the rover what it needs -> what

=== what
scene: city-street
cast: hero, rover:thinking, quill:thinking
Rover: My name is Tumble, and I am an autonomous sidewalk delivery rover. I have one package remaining in my cargo hatch, and it must reach 14 Larch Lane by five o'clock today. After that, I must return to Northgate Depot before my battery is completely empty, which will happen in approximately three hours.

The clock on the diner window says 2:05.

Quill: Hoo. And without your GPS, you have no idea how to get anywhere.

Rover: That is correct. Although I do have... this.

A small compartment on Tumble's side pops open. Inside, folded into a tidy square, is a paper map of Copperton, slightly damp around the edges. A faded sticker on the front announces BACKUP NAVIGATION. FOR EMERGENCIES ONLY.

Rover: I have never opened it. Paper is for wrapping things, not for thinking.
? RL.3 : Based on this page, what is Tumble's biggest problem?
+ It must deliver a package and get home, but it can't find its way.
- Its cargo hatch is jammed, so it cannot reach the package.
- It is afraid of the diner and refuses to move.
- Its solar panel was stolen during the storm.
hint: Tumble explains two things it must do today. Why can't it do them right now?
next: legend

=== legend
scene: city-street
cast: hero, rover:surprised, quill
You unfold the map across Tumble's flat back. The streets of Copperton spread out in an orderly grid that is divided into lettered and numbered squares. Letters run along the top edge, A through F, from west to east, and numbers run down the side, 1 through 6, from north to south. In one corner is a decorative compass rose, with the letter N pointing toward the top of the page.

At the bottom of the map is a rectangular box labeled LEGEND, which explains what every symbol on the map represents:

Red star: Courier depot. Blue square: Parcel locker. Green circle: Park. Black line with crossbars: Railroad. Orange X: Road closed. Wavy blue line: River.

Rover: Fascinating. This paper is absolutely full of secret codes, and apparently someone has helpfully provided the answers.
? RI.4 : On a map, what is the purpose of a "legend"?
+ It explains what the symbols on the map stand for.
- It tells an old, made-up story about the city.
- It shows how many people live in each neighborhood.
- It lists the names of the people who drew the map.
hint: Read what the box at the bottom of the map does. What does it explain?
next: find

=== find
scene: city-street
cast: hero, rover:thinking, quill:happy
You slide your finger across the map until you locate the corner diner, which is represented by a little coffee cup. It is located in square B4.

Then you search for Larch Lane. It is a short, curving street on the eastern side of the map, and the house number 14 is marked with a tiny dot. To reach it, you would travel east along Main Street, continue past a green circle, and then turn south toward a narrow creek.

Quill: Hoo! Find the depot, too, while you're looking. Then we'll know the whole journey.

The red star for Northgate Depot sits at the very top of the map, on the other side of the wavy blue line.
clue: The diner is in square B4. Larch Lane is east of the diner. The depot is far to the north, across the river.
? RI.7 : On this map, the letters A to F run west to east and the numbers 1 to 6 run north to south. Which square is directly north of B4?
+ B3
- C4
- B5
- A4
hint: North is toward the top of the map. Which way do the numbers change as you move toward the top?
next: truck

=== truck
scene: city-street
cast: hero, rover:happy, quill:surprised
Before you can fold the map, an enormous blue truck rumbles past, spraying muddy puddle water across the sidewalk. Tumble's eyes immediately brighten with excitement.

Rover: A blue truck! Courier trucks are blue! Therefore, it is probably traveling to the depot! I will simply follow it, and I will never have to read a map at all!

Tumble's six wheels are already spinning on the wet pavement.
> Let Tumble follow the blue truck -> recycle
> Stop Tumble and check the map -> ch1-end

=== recycle
scene: recycling-center
cast: hero, rover:surprised, quill:thinking
You chase Tumble for six exhausting blocks. Eventually the blue truck turns through a wide gate and parks beside four enormous bins: blue for cans, yellow for paper, green for glass and red for plastic cups. It is a recycling truck, not a courier truck at all.

A mechanical grabber crane swings overhead, lifting pieces of scrap metal from a pile and dropping them into a crusher with a deafening CRUNCH.

Rover: This is not the depot. That crane is looking at me with what I can only describe as interest.

A worker with a clipboard squints at Tumble. "Is that rover going in the scrap pile? We've got a bulk metal pickup coming in ten minutes."
> Get out your map and find the way back -> rescue-map
> Wait here and ask for a ride later -> lose-scrap

=== lose-scrap
scene: recycling-center
cast: rover:sad, quill:sad
You decide to wait for somebody to come and help. Tumble parks politely beside the scrap pile and switches into power-saving mode to protect its battery.

When the bulk metal truck arrives, its driver notices a small metal object beside the scrap pile and does exactly what bulk metal truck drivers are paid to do. Tumble is lifted, sorted and placed very gently into Bin Seven, Mixed Metals, before anyone notices the yellow letters on its side.

Rover: I would like to file a complaint. I would like to file it from inside this bin.

The package for 14 Larch Lane spends the night in a recycling center instead of on Mrs. Bellweather's doorstep. Following someone else's truck was not the same thing as knowing the way yourself.
end: lose Sorted Into Bin Seven

=== rescue-map
scene: recycling-center
cast: hero, rover:thinking, quill
You spread the map across a stack of flattened cardboard boxes and locate the recycling center, which is marked with a little triangle of arrows in square A5. That means the blue truck carried you southwest, in exactly the wrong direction.

Rover: So the map is not just decoration. It actually tells the truth.

Quill: Hoo. Maps are very honest. They just can't shout at you.

Tumble backs away from the crane very quickly.
> Head back toward Main Street -> ch1-end

=== ch1-end
scene: city-street
cast: hero, rover:happy, quill:happy
Back on Main Street, you spread the map out once more, and Tumble follows every movement of your finger with intense concentration.

Rover: I have decided that I would like to learn to read this paper. Please teach me. I am a very fast learner, although I learn things exclusively in numbers.

You point out the compass rose and explain the four cardinal directions: north is at the top of the map, east is to the right, south is at the bottom, and west is to the left. Tumble repeats the directions to itself in an electronic whisper, over and over, until it has memorized them.

The diner clock says 2:40, which leaves two hours and twenty minutes before the five o'clock deadline.
? RL.2 : Which sentence is the best objective summary of Chapter One?
+ A lost rover with a broken GPS begins learning to read a paper map.
- A rover gets lost on purpose so it can visit the recycling center.
- Quill fixes Tumble's GPS dish, and the package is delivered at once.
- Tumble decides that paper maps are useless and throws its map away.
hint: An objective summary tells the main problem and the most important event, without opinions.
next: ch2

# ============================================================
# CHAPTER TWO: THE MAP DOESN'T LIE
# ============================================================

=== ch2
scene: city-street
cast: hero, rover:happy, quill
checkpoint
~ Chapter Two ~

You set off east along Main Street, with Tumble rolling beside you and the map folded open to the correct section. Every few blocks, Tumble pauses and compares what its camera can see with what the map predicts.

Rover: Green circle on the map. Green trees on the left. Hypothesis: that is Linden Park. Confirmed!

Quill: Hoo, wait. Look at the map's name for that green circle.

The circle is clearly labeled HAWTHORN PARK. Tumble's eyes flicker with obvious embarrassment.

Rover: Correction. Hypothesis was mostly confirmed. The circle and the trees agree. Only my imagination was wrong.
> Keep going toward Larch Lane -> scale

=== scale
scene: city-street
cast: hero, rover:thinking, quill:thinking
Tumble stops at an intersection and frowns at a little striped bar printed in the corner of the map. Underneath it, tiny print says: 1 inch = 1/4 mile.

Rover: What is this ruler doing on my map? I have nothing to measure.

You explain that it's the map's scale, which shows how distances on the paper compare to actual distances on the ground. Using the edge of a paper menu that Quill borrowed from the diner, you measure the route from your corner to Larch Lane, and it is exactly two inches long on the map.

Rover: My top speed on the sidewalk is three miles per hour. Calculating... Calculating...
? RI.7 : The scale says 1 inch = 1/4 mile. If the route measures 2 inches on the map, how far is it in real life?
+ One half of a mile
- Two miles
- One quarter of a mile
- Eight miles
hint: Each inch stands for one quarter of a mile. Add one quarter mile for each inch on the map.
next: route

=== route
scene: city-street
cast: hero, rover:happy, quill
Rover: Half a mile at three miles per hour is ten minutes. We are going to be EARLY. I have never been early. I am experiencing a feeling. I believe it is called smugness.

You write the directions on the back of the menu so Tumble can follow them in order:

First, continue east on Main Street past Hawthorn Park.
Next, turn south at the post office on Cobb Street.
Then, cross the little footbridge over Pebble Creek.
Finally, turn left onto Larch Lane and look for number 14.

There's an orange X on Elm Street, just north of Cobb. Road closed.
? RI.3 order : Put the directions to Larch Lane in the correct order.
1 Go east on Main Street past Hawthorn Park.
2 Turn south at the post office on Cobb Street.
3 Cross the footbridge over Pebble Creek.
4 Turn left onto Larch Lane and find number 14.
hint: The directions use the order words first, next, then and finally.
next: bellweather

=== bellweather
scene: city-street
cast: hero, rover:happy, keeper:happy
Number 14 Larch Lane is a narrow blue house with a brass telescope poking out of an upstairs window like a curious nose. An elderly woman wearing a cardigan decorated with embroidered planets opens the door before you can even knock.

This is Mrs. Fumiko Bellweather, a retired ship's navigator who now spends her evenings observing the constellations.

Keeper: My eyepiece! I thought the storm had swallowed it. You lovely, soggy machine, you're nearly two hours early!

Tumble opens its cargo hatch and presents the package with as much ceremony as a six-wheeled rover can possibly manage.

Rover: Delivery complete. I navigated using a paper map. Also, I was briefly almost recycled.
> Tell Mrs. Bellweather about the broken GPS -> stars

=== stars
scene: city-street
cast: hero, keeper:thinking, rover
Mrs. Bellweather listens to the entire story with her eyebrows climbing higher and higher, and then she laughs delightedly.

Keeper: When I was a young navigator, we crossed oceans without a single satellite. We had paper charts, a compass and the stars. If you're ever lost at night, little rover, find the North Star. It sits almost exactly above the North Pole, so it barely moves while the rest of the sky turns around it. Face it, and you're facing north.

She sketches a little diagram on the back of your menu: the Big Dipper, a constellation shaped like a ladle, with the two stars at the end of its cup pointing like an arrow toward a single bright star.

Keeper: Follow the two pointer stars at the end of the Dipper's cup. They point straight to the North Star.
clue: Mrs. Bellweather: the two pointer stars of the Big Dipper point to the North Star, which shows you which way is north.
? RL.1 : Which sentence best explains why the North Star is useful for finding direction?
+ "It sits almost exactly above the North Pole, so it barely moves."
- "When I was a young navigator, we crossed oceans."
- "You lovely, soggy machine, you're nearly two hours early!"
- "I thought the storm had swallowed it."
hint: Look for the reason the North Star is special. Which sentence explains how it behaves?
next: battery

=== battery
scene: city-street
cast: hero, rover:scared, quill:thinking
As you leave Larch Lane, the sun is sinking behind the rooftops, and an amber warning light begins blinking anxiously in the corner of Tumble's screen.

Rover: Battery at thirty-one percent. That is enough for approximately ninety minutes of driving. Northgate Depot is at the far northern edge of the map, across the river.

You unfold the map again. The depot's red star is located in square D1, and between you and it lie the river and three possible crossings: the long Iron Bridge to the east, a railroad bridge through the abandoned railyard straight ahead, and the riverside path, which has an orange X printed across it.

Quill: Hoo. Read the legend before you choose. The map is trying to tell us something.
? RI.7 : According to the map's legend, what does the orange X on the riverside path mean?
+ The road is closed, so you cannot use that route.
- There is a parcel locker on the path.
- It is a shortcut to the depot.
- There is a park along the path.
hint: Go back to the legend from Chapter One. What does an orange X stand for?
next: ch2-end

=== ch2-end
scene: city-street
cast: hero, rover:thinking, quill
That leaves the railyard and the Iron Bridge. The railyard is directly north and appears much shorter on the map, while the Iron Bridge is far to the east and requires a long, looping detour.

Rover: I would like to note that I have changed my opinion of paper. Paper is for wrapping things AND for thinking.

Quill: Hoo. That might be the smartest thing a delivery robot has ever said.

As the streetlights flicker on, Tumble swivels its camera head toward the north, where a single bright light is blinking on top of a tall building beside the river.
? RL.2 : Which sentence best summarizes Chapter Two?
+ Tumble delivers early using the map, then needs a route to the depot.
- Mrs. Bellweather repairs Tumble's GPS, and it drives home easily.
- Tumble gets lost in Hawthorn Park and has to spend the night there.
- Tumble decides to stay at 14 Larch Lane and become a telescope.
hint: Think about the delivery and the new problem at the end of the chapter.
next: ch3

# ============================================================
# CHAPTER THREE: THE ROOFTOP SCOUT
# ============================================================

=== ch3
scene: rooftop-night
cast: hero, rover:surprised, drone:happy
checkpoint
~ Chapter Three ~

The blinking light turns out to belong to a tiny quadcopter drone, hovering above the flat roof of a parking garage beside the river. When it notices Tumble, it dives toward you so rapidly that its rotors whistle.

Drone: UNIT SEVEN! There you are! I'm Zephyr, the depot's sky scout. The whole depot has been searching for you since the storm! Your GPS signal disappeared at 9:14 this morning, and the dispatcher has been eating stress pretzels ever since.

Tumble rolls up the spiraling garage ramp to the roof, where the entire city glows beneath you. From this height, you can see the glittering river, the shadowy railyard and, far to the north, the faint red glow of the depot sign.

Rover: Zephyr! I delivered my package. I read a map. I nearly became a soup can.
> Ask Zephyr for the best way to the depot -> zephyr

=== zephyr
scene: rooftop-night
cast: hero, drone:thinking, rover:thinking
Zephyr zooms straight up into the sky, hovers for a moment to survey the area, and then descends again.

Drone: From above, here's what I can see. The railyard gate is chained shut, and the tracks are full of parked freight cars. The Iron Bridge is open and lit up, but it's a long loop. It'll take about seventy minutes at Tumble's speed.

Rover: My battery has seventy-four minutes remaining.

Drone: Then you'll make it with four minutes to spare, if you don't stop for anything. Not even a squirrel.

Tumble's eyes narrow into two thin lines of determination.
? RL.3 : Zephyr's report changes the decision. Which route does the evidence support, and why?
+ The Iron Bridge, because it is open, even though it takes longer.
- The railyard, because it is the shortest line on the map.
- The riverside path, because it is closest to the water.
- Staying on the roof, because Zephyr can carry Tumble.
hint: Zephyr describes what each route looks like from above. Which one is actually open?
next: decide

=== decide
scene: rooftop-night
cast: hero, rover:thinking, quill:thinking
You study the map one last time, and then you look up. The storm clouds have disappeared completely, and the sky above Copperton is sprinkled with stars.

Quill: Hoo. Three choices, and only one battery.
> Take the long Iron Bridge -> bridge
> Cut through the railyard anyway -> lose-railyard
> Find the North Star and head straight north -> northstar

=== lose-railyard
scene: city-street
cast: rover:scared, quill:sad
The railyard looks so much shorter on the map that you decide to risk it. Tumble rolls bravely down the dark lane toward the tracks.

The gate is chained, exactly as Zephyr reported. Tumble searches along the fence for an opening and eventually discovers one, but on the other side, the freight cars are parked so tightly together that there is nowhere to go. Every passage between them ends at another wall of steel.

Rover: Battery at four percent. Three percent. I am going to take a little nap now. Please tell the dispatcher I was very brave and somewhat foolish.

Tumble's screen fades to black between two freight cars. The shortest line on a map is not always the shortest way home, especially when someone who could see the whole route already told you it was blocked.
end: lose The Railyard Detour

=== bridge
scene: city-street
cast: hero, rover:happy, drone:happy
You choose the Iron Bridge. Zephyr flies ahead like a miniature lighthouse, illuminating the sidewalk with its camera lamp, while Tumble follows at maximum speed.

Over the river, the bridge lights shimmer on the dark water. Tumble doesn't stop for anything: not for a squirrel, not for a puddle, and not even for a food truck selling something that smells absolutely extraordinary.

Rover: Battery at nine percent. I can see the depot sign.

Northgate Depot is a long brick warehouse with an enormous red star painted above its entrance, and the doors roll open as you approach.
> Roll into the depot -> depot

=== northstar
scene: rooftop-night
cast: hero, rover:thinking, drone:surprised
You remember the diagram that Mrs. Bellweather sketched on the back of the menu. You locate the Big Dipper, hanging low over the river, and follow the two pointer stars at the end of its cup until they lead you to a single, steady star.

The North Star.

You check the map. The depot's red star is due north of the garage, and directly north from here, the map shows something that none of you noticed before: a narrow pedestrian walkway on the underside of the railroad bridge, marked with a small blue square. According to the legend, that symbol means a parcel locker.

Drone: There's a courier locker on the bridge walkway? I've flown over that bridge a thousand times and never looked UNDER it!

Rover: The paper knew. The paper always knew.
? L.5 : Tumble says, "The paper always knew." What does Tumble mean?
+ The map held useful information all along, if someone read it.
- Paper has a brain and can think for itself.
- The map was written by Tumble's friend Zephyr.
- Paper is too fragile to use for navigation.
hint: Tumble is talking about the map. What did the map show that nobody had noticed?
next: walkway

=== walkway
scene: rooftop-night
cast: rover:happy, drone:happy, quill:happy
Tumble rolls across the narrow walkway beneath the railroad bridge, steering by the North Star, while freight cars sleep on the tracks overhead and the river glitters below. Halfway across, it stops beside a blue parcel locker with a charging port built into its side, and it plugs itself in for five minutes, just long enough to be safe.

Rover: Battery at twenty-two percent. I have never had so much battery and so much sky at the same time.

From the far end of the walkway, the depot is only three blocks north.
> Roll into the depot -> depot-secret

=== depot
scene: factory-floor
cast: hero, rover:happy, guard:happy
Inside, the depot's sorting floor is crowded with conveyor belts and robotic arms, but every machine seems to pause as Tumble rolls through the doorway. A security officer named Officer Dunleavy, who has a coffee mug in each hand, looks up from the dispatch desk and shouts so loudly that one of the mugs sloshes.

Guard: UNIT SEVEN IS HOME!

Rover: Battery at two percent. Delivery completed nearly two hours early. GPS missing. Map skills acquired.

Officer Dunleavy plugs Tumble into its charging dock, and the whole night shift gives it a round of applause.
? RL.6 : At the start of the story, Tumble said, "Paper is for wrapping things, not for thinking." How has its point of view changed?
+ It now sees the paper map as a useful tool for thinking.
- It now believes paper should only be used for wrapping gifts.
- It still thinks maps are useless and wants a new GPS right away.
- It has decided that it never wants to make deliveries again.
hint: Remember what Tumble says at the end of Chapter Two about paper.
next: finale

=== finale
scene: factory-floor
cast: hero, rover:happy, guard
Officer Dunleavy holds up a brand-new GPS dish, still in its box.

Guard: The repair team can install this tonight. You'll be back to normal by morning.

Tumble considers the box for a long moment. Then it looks at the damp, wrinkled paper map folded inside its side compartment.
> Install the new GPS and keep the map too -> win-both
> Teach the other rovers to read maps -> win-teach

=== win-both
scene: factory-floor
cast: rover:happy, drone:happy, guard:happy
Tumble receives its new GPS dish that night, but it absolutely refuses to give up the paper map. The repair team has to construct a special waterproof pocket for it, right beside the cargo hatch.

A month later, a solar storm interferes with every GPS signal in Copperton for an entire afternoon. Forty delivery robots stop in the streets, spinning helplessly in circles and announcing "Recalculating."

One small green rover keeps rolling, map open, delivering every package on its route on time.
end: win Unit Seven, Back on the Map

=== win-teach
scene: factory-floor
cast: rover:happy, guard:happy, drone:happy
Rover: I will accept the GPS. But first, I have a request. I would like to teach every rover in the depot how to read a paper map. Also the forklifts. Also Zephyr.

Drone: I can already read maps! I'm a DRONE!

Rover: Then you will be my assistant.

Every Friday afternoon after that, the depot's robots line up on the sorting floor for Tumble's Map Class, where they learn about legends, scales, grids and compass roses. On the wall, the dispatcher hangs a framed copy of Tumble's original map, still stained with puddle water.
end: win Tumble's Map Class

=== depot-secret
scene: factory-floor
cast: hero, rover:happy, guard:surprised
You arrive at the depot with battery to spare. Officer Dunleavy drops both of her coffee mugs.

Guard: Unit Seven? How did you get here so fast? The bridge is a seventy-minute loop!

Rover: I followed the North Star, and then I followed the map. The map showed a parcel locker under the railroad bridge that nobody had ever used.

The next morning, the Copperton Courier Company opens the forgotten walkway as an official delivery route and names it the Tumble Line. On the depot wall, beside the dispatch desk, someone paints a small green rover looking up at a single bright star.
end: secret Steered by the North Star
