# Page Quest: Rate & Percent Mysteries (SpiderBen10's special edition, Math 6 Unit 3)
# Book 3: a robot paint crew must Paint the Room (Section E: wall area, coats, gallons rounded UP,
# the cheap-per-gallon trap, price + tax), then a copy-machine bonus chapter (7th-grade bridge: scale factors).
title: Paint the Room, Robot Crew!
author: SpiderBen10's Arcade
genre: robots
band: 6-8
cover: robot-workshop
blurb: A robot paint crew has one day to paint the art room. Measure, mix and buy smart, then tame the copy machine.
start: workshop

=== workshop
scene: robot-workshop
cast: hero, quill, helperbot:happy
checkpoint
~ Chapter One: The Big Job ~
The Bright Brush Robot Crew operates out of a cozy workshop that smells like fresh paint and machine oil. Dabble, a round orange helper robot, rolls toward you with her heart light blinking excitedly.
Helperbot: Beep! SpiderBen10! Our crew just received its first important job, which is painting the art room at the community center before the grand opening tomorrow morning.
Helperbot: Our crew boss, Trowel, is excellent at lifting heavy things and absolutely terrible at arithmetic. Would you be our official planner?
Quill: A planner who checks every number sounds exactly like you.
> Ride to the community center -> center
> Look at the crew's color chart first -> chart

=== chart
scene: robot-workshop
cast: hero, helperbot, retrobot
Ledger, the crew's tall tin robot, is responsible for the color chart, and he clacks his claw hands together nervously.
Retrobot: The chart explains how to mix our famous Sunset Pink from red and white paint, but somebody scribbled a different mixture underneath.
Retrobot: If the new mixture uses a different rate, the color will come out completely wrong, so please check it carefully.
? MATH same-rate a=red_paint b=white_paint unit=cans thing=mix : Is the new mix the same rate as the old one?
next: center

=== center
scene: city-street
cast: hero, helperbot, mech:happy
clue: The grand opening starts tomorrow morning. Everything must be dry by then.
The crew rattles down the avenue in an old delivery van, while Trowel, the enormous construction mech, rides on the roof because he cannot possibly fit inside.
Mech: TROWEL IS READY TO PAINT! TROWEL WILL PAINT EVERYTHING!
Helperbot: Not everything, Trowel, only the walls. Do you remember what happened last time?
Mech: Trowel painted the windows, and the door, and also a very surprised cat. The cat was perfectly fine afterward.
> Go inside to the art room -> artroom

=== artroom
scene: school
cast: hero, kid, quill
The art room is spacious and bare, with gray walls, a single door and several sunny windows. Juno, the president of the art club, is waiting with a clipboard and a worried expression.
Kid: Please don't let Trowel guess this time. We need to know exactly how much wall there is before anybody opens a can.
Quill: Every wall is a rectangle, so if you imagine unrolling all four walls, they form one long rectangle.
? MATH chain:wall-area : Measure the walls the crew must paint.
bonus: Wall area in one go! Trowel writes the number on his hard hat with a marker.
next: artroom-2

=== artroom-2
scene: school
cast: hero, mech:happy, kid
clue: Doors and windows don't get painted, so their area comes off the total.
Juno opens a side door that leads to a small supply closet crowded with easels.
Kid: The supply closet is also part of the job, and it has its own door and its own window.
? MATH paint-area : How much wall in the supply closet needs paint?
next: shop

=== shop
scene: factory-floor
cast: hero, helperbot, retrobot
checkpoint
~ Chapter Two: Gallons and Buckets ~
The paint warehouse is a maze of tall shelves and humming conveyor belts, with cans and buckets of every imaginable color gliding past.
Helperbot: Two coats look much better than one coat, but how much paint does that require?
Retrobot: Paint is only sold by the whole gallon, because Ledger cannot purchase part of a can.
? MATH chain:paint-gallons : How many gallons should the crew buy?
bonus: Gallons solved in one go! Dabble's heart light flashes gold.
next: shop-2

=== shop-2
scene: factory-floor
cast: hero, retrobot:happy, quill
Ledger rolls up to the price board, extremely excited about his discovery.
Retrobot: Look over there! The big buckets are cheaper per gallon, so Ledger says we should buy ONLY big buckets and save lots of money!
Quill: Cheaper per gallon is wonderful, as long as you actually get enough paint. Let's calculate the entire order, including the tax.
? MATH chain:paint-buy : Pick the cheapest order that holds enough paint, then add the tax.
bonus: Smart buy in one go! Ledger stamps a gold star on the receipt.
next: shop-3

=== shop-3
scene: factory-floor
cast: hero, retrobot:thinking, helperbot
Ledger frowns at your plan, and his antennas droop with disappointment.
Retrobot: But the order with only buckets costs less money. Are you completely sure about this?
> Buy the order you worked out -> mixing
> Let Ledger buy only the big buckets -> short

=== short
scene: school
cast: mech:sad, helperbot:sad, kid:sad
The crew paints quickly and beautifully until the very last wall, when the buckets run dry, the store has already closed, and one wall is still completely gray.
Kid: The grand opening is tomorrow morning, and we certainly cannot open with a gray wall!
Helperbot: Beep. Cheap per gallon was not cheap at all when we ran out of paint.
end: lose Out of Paint

=== mixing
scene: robot-workshop
cast: hero, helperbot, drone
Back at the workshop, Zip the drone hovers above the mixing table. Juno wants one wall painted teal, and Zip has the recipe for exactly one batch.
Helperbot: Zip needs a different amount than one batch, and fractions make Zip's rotors spin backward.
? MATH batch-scale ing=blue_paint unit=cups what=teal_paint : How much blue paint does Zip need?
next: painting

=== painting
scene: school
cast: hero, mech:happy, kid
The crew finally gets to work. Trowel rolls paint in long, even stripes, while Dabble carefully finishes the edges with a tiny brush.
Then Juno rushes in with a brand-new idea.
Kid: The back wall should be teal with an enormous golden sun in the middle, so it needs its own paint order.
? MATH chain:paint-gallons : How many gallons of teal for the back wall?
bonus: Teal order solved in one go! Trowel does a happy stomp.
next: break

=== break
scene: school
cast: hero, mech, quill:happy
clue: The walls dry overnight. The room is ready for the grand opening.
By sunset the art room is glowing, with soft white walls, a teal back wall, and a golden sun that Trowel painted with surprising care.
Mech: Trowel painted ONLY the walls. No windows. No cats.
Quill: That is a perfect job. Now the grand opening needs posters.
> Help make posters at the copy machine -> copier
> Head home and rest your planner brain -> rest

=== rest
scene: robot-workshop
cast: hero, helperbot:happy, quill
You return to the workshop, and Dabble plays a cheerful song from her speaker while the paint dries across town.
Helperbot: Beep! Our first job was done correctly. You are the best planner the Bright Brush Crew has ever had.
end: win A Room Well Painted

=== copier
scene: lab
cast: hero, retrobot, quill
checkpoint
~ Chapter Three: The Copy Machine (Bonus) ~
The community center's office contains an ancient copy machine. Ledger plugs a cable into its side, and the machine wakes up with a tremendous groan.
Retrobot: Ledger speaks fluent copier! It changes the size of a picture by a percent, and one hundred percent means exactly the same size.
Quill: A copier setting is really a scale factor. More than one hundred percent makes a picture bigger, and less than one hundred percent makes it smaller.
? MATH scale-copy thing=poster_drawing : Juno's poster drawing goes into the copier.
next: copier-2

=== copier-2
scene: lab
cast: hero, kid, quill
Juno wants one gigantic poster for the front entrance.
Kid: If the poster gets longer and also wider, how much bigger does the whole thing become?
Quill: Be careful here, because area grows by the scale factor two times, once for the length and once for the width.
? MATH chain:copy-area thing=poster : What is the area of the big poster?
bonus: Area scale factor in one go! Ledger says you speak copier better than he does.
next: copier-3

=== copier-3
scene: lab
cast: hero, kid, quill
Beside the copier hangs the floor plan of the community center, which visitors will use to find the new art room.
Kid: The plan has a scale, just like a map, so one inch on the paper represents a certain number of real feet.
? MATH scale-drawing : Use the plan's scale.
next: finale

=== finale
scene: school
cast: hero, kid:happy, helperbot:happy
The posters are hanging, the floor plan is posted, and the art room is gleaming. The whole crew waits by the door for morning.
Suddenly Juno notices a dusty canvas sticking out from behind the old copy machine.
> Open the doors for the grand opening -> win
> Pull out the dusty canvas -> sketch

=== win
scene: school
cast: hero, kid:happy, mech:happy
The doors swing open, and families pour inside. Children race straight toward the teal wall and the golden sun.
Kid: This is the best art room in the entire city, and there is not a single drop of paint on any window!
Mech: TROWEL IS PROUD. TROWEL WILL NOW PAINT... NOTHING. TROWEL WILL REST.
end: win Grand Opening Day

=== sketch
scene: lab
cast: hero, kid:surprised, quill
clue: Behind the copier: an old sketch for a giant mural, signed by the center's first art teacher.
The canvas turns out to be an old sketch for a gigantic mural of the whole city, signed by the community center's very first art teacher, and it was never painted.
Quill: It's drawn to scale on a grid, so we could copy it onto the long wall, one square at a time.
> Ask the crew to paint the mural -> secret

=== secret
scene: school
cast: hero, mech:happy, helperbot:happy
The crew stays one extra day. Using the grid and the scale, Trowel and Dabble paint the forgotten mural across the long wall, exactly as the old sketch intended.
The community center names it the Bright Brush Mural, and your name is painted in tiny letters in the corner: Planner, SpiderBen10.
end: secret The Lost Mural
