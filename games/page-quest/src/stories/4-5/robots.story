title: Dumpling Learns to Bake
author: SpiderBen10's Arcade
genre: robots
band: 4-5
cover: bakery
blurb: A sweeping robot wants to bake a lemon cake for the town Bake-Off. One problem: it takes every recipe word literally!
start: start

# ============================================================
# CHAPTER ONE: RULE NUMBER ONE
# ============================================================

=== start
scene: bakery
cast: hero, quill:happy, helperbot:sad
checkpoint
~ Chapter One ~

Quill flies you down a sunny street in the little town of Sugarloaf, and she lands on the painted sign of a shop that smells like warm bread and cinnamon. The sign says BUTTERBELL BAKERY.

Inside, a round orange robot is sweeping the floor in slow, sad circles. It has one wheel, two stubby arms with fuzzy brushes on the ends, and a screen for a face. Its glowing blue eyes look very droopy.

Helperbot: Oh! Customers! Welcome to Butterbell Bakery. I am Dumpling, the sweeping robot. I am sorry, but we have no cakes today. Not one crumb.

Quill: Hoo! No cakes in a bakery? That is like a pond with no ducks!
> Ask Dumpling what happened -> trouble
> Ask what a sweeping robot does -> chores

=== chores
scene: bakery
cast: hero, helperbot:happy, quill
Dumpling spins around on its wheel and proudly shows you its arms, which each end in a fuzzy yellow brush.

Helperbot: I sweep the floor nine times a day. I count the sprinkles. I dust the cookie jars. I say "Have a sweet day!" to every customer.

Dumpling points a brush at a sign over the big brick oven. The sign says RULE NUMBER ONE: DUMPLING DOES NOT TOUCH THE OVEN.

Helperbot: Ms. Butterbell made that rule when I tried to dust the fire. My brushes are still a little bit crispy.
> Ask why there are no cakes today -> trouble

=== trouble
scene: bakery
cast: hero, helperbot:sad, quill:thinking
Dumpling rolls over to the counter and picks up a note, which is written in wobbly, sniffly handwriting.

"Dear Dumpling, I have a terrible cold. I can't stop sneezing, so I can't bake. Please tell everyone that Butterbell Bakery will miss the Sugarloaf Bake-Off tomorrow. I am so sorry. Love, Marigold Butterbell."

Helperbot: Ms. Butterbell has won the Bake-Off for ten years in a row with her Sunshine Lemon Cake. She is the kindest baker in the world. She even gave me a name, and she knits me a scarf every winter.

Dumpling's screen flickers for a moment, and then its eyes light up a bright, determined blue.

Helperbot: What if I bake the cake for her? I have watched her bake it one thousand and six times!
clue: Ms. Butterbell is sick and can't bake her Sunshine Lemon Cake for the Bake-Off tomorrow.
? RL.3 : Why does Dumpling want to bake the cake?
+ Ms. Butterbell is sick, and Dumpling wants to help her.
- Dumpling is hungry and wants to eat a whole cake.
- Dumpling wants to beat Ms. Butterbell at the Bake-Off.
- Dumpling is tired of sweeping the floor all day.
hint: Read Ms. Butterbell's note again. Then think about how Dumpling feels about her.
next: rule

=== rule
scene: bakery
cast: hero, helperbot:thinking, quill:thinking
Suddenly Dumpling stops rolling and looks up at the sign above the oven: RULE NUMBER ONE: DUMPLING DOES NOT TOUCH THE OVEN.

Helperbot: Oh no. I forgot about the rule.

Quill taps the sign with her wing.

Quill: Hoo. Rules are there to keep us safe. But maybe you could ask Ms. Butterbell?

Dumpling has a little telephone inside its belly, so it calls Ms. Butterbell right away, and you can hear her sneezing through the tiny speaker. "AH-CHOO! Dumpling, you may use the oven ONE time, if you have a friend to help you, and you follow the recipe very, very carefully. AH-CHOO!"

Helperbot: A friend! Will you be my friend for one day?
> Say yes and shake Dumpling's brush -> recipe

=== recipe
scene: bakery
cast: hero, helperbot:happy, quill
Dumpling pulls an old card out of a drawer. It is the recipe for Sunshine Lemon Cake, and it is covered with butter stains, which means it has been used and loved for a very long time.

SUNSHINE LEMON CAKE
2 cups of flour. 1 cup of sugar. 3 eggs. A pinch of salt. 2 lemons.
Step 1: Beat the eggs.

Dumpling reads the first step out loud, rolls to the refrigerator, takes out three eggs, and lines them up carefully on the counter like runners at a starting line.

Helperbot: Ready, eggs? On your mark, get set, GO! I am going to beat you in a race!

The eggs do not move at all, because eggs are not very good at racing.
? L.4 : In a recipe, what does "beat the eggs" mean?
+ Stir the eggs fast with a fork or a whisk.
- Win a race against the eggs.
- Hit the eggs with a hammer.
- Put the eggs back in the fridge.
hint: This is a recipe, so the words are about cooking. What do cooks do to eggs in a bowl?
next: whirligig

=== whirligig
scene: bakery
cast: hero, helperbot:surprised, drone:happy
BZZZZZZ! A tiny flying robot zips through the open door. It has four spinning rotors on top and a little blue screen with a friendly smile on it.

Drone: Delivery! Delivery! Whirligig is here! I deliver bread, I deliver buns, I deliver bagels at a hundred miles an hour! Well, maybe ten miles an hour. Did somebody say cake?

Helperbot: Whirligig! We are baking the Sunshine Lemon Cake for Ms. Butterbell! The card says to add a pinch of salt.

Drone: A pinch! Easy!

Whirligig swoops down and pinches Dumpling on the arm with its little landing claw.

Helperbot: OW! Why did you pinch ME? I am not salty!
> Explain what "a pinch of salt" means -> pinch
> Look at the recipe card again -> card

=== pinch
scene: bakery
cast: hero, helperbot:thinking, drone
You pick up a few grains of salt between your thumb and your pointer finger, and you hold them up so that both robots can see exactly how much salt a pinch is.

Drone: Ohhhh. A pinch is a tiny bit. The amount you can hold between two fingers!

Helperbot: But I do not have fingers. I have brushes.

Dumpling dips one fuzzy brush into the salt and shakes it gently over the bowl until a few grains fall in. Then it puffs out a little cloud of steam, which is what Dumpling does whenever it feels proud of itself.
> Look at the recipe card again -> card

=== card
scene: bakery
cast: hero, helperbot:thinking, quill:thinking
You all look at the recipe card together. The card says to beat the eggs, mix in the sugar, and add the flour and salt.

Then, at the very bottom, in tiny letters, it says: "The secret is in the zest! Use FRESH lemons."

Dumpling opens the refrigerator and searches on every shelf, behind the milk, under the cheese, and even inside the butter box.

Helperbot: There are no lemons. Not one. And there is another problem. Ms. Butterbell always uses her big whisk, and I have only brushes. A brush will make the batter fuzzy!
clue: The recipe card says the secret is in the zest. You need FRESH lemons.
clue: Dumpling has only brush arms, so it can't use a whisk.
? RL.1 : Which words from the card tell you what kind of lemons to use?
+ "Use FRESH lemons."
- "2 cups of flour."
- "Beat the eggs."
- "A pinch of salt."
hint: Look at the tiny letters at the very bottom of the card.
next: ch1-end

=== ch1-end
scene: bakery
cast: helperbot:happy, drone:happy, quill
Whirligig zooms in an excited circle around the bakery.

Drone: I can fly to the market and get lemons! I am the fastest drone in Sugarloaf. Well, the only drone in Sugarloaf. But still!

Quill: And next door is a robot workshop. Maybe the fixbot there can give Dumpling something better than a brush.

Dumpling claps its brushes together, and puffs of flour fly everywhere like tiny clouds.

Helperbot: A plan! Whirligig gets the lemons, and we get new arms! Let's go!
? RL.2 : Which sentence best tells what happens in Chapter One?
+ Dumpling decides to bake the cake but needs lemons and a whisk.
- Dumpling wins the Bake-Off with a chocolate cake.
- Ms. Butterbell bakes a cake and brings it to the shop.
- Whirligig teaches Dumpling how to fly.
hint: Think about the big problem at the start and the plan at the end of the chapter.
next: quiz-ch2

=== quiz-ch2
scene: bakery
cast: hero, quill:happy
Quill hops in front of you and holds up one wing.
Quill: Wait just a moment! The next part of the story is coming. First, try one of my quick challenges.
? QUIZ : Sharp minds win the day. Try this one!
next: ch2

# ============================================================
# CHAPTER TWO: THE WORKSHOP NEXT DOOR
# ============================================================

=== ch2
scene: robot-workshop
cast: hero, helperbot:surprised, fixbot:happy
checkpoint
~ Chapter Two ~

The workshop next door is crowded with tools. Hammers, wrenches and screwdrivers hang on a wall full of little holes, and a half-built robot sits on the workbench and blinks at you curiously.

Something clicks across the floor on four thin legs. It is a yellow robot shaped like a dome, with a wrench for one hand and a screwdriver for the other, and its orange eyes glow from behind a dark visor.

Fixbot: Hello hello! I am Widget! I fix things! I fix toasters, I fix bikes, I fix robots, I fix robot bikes! What is broken? Tell Widget!

Helperbot: Nothing is broken. But I need to whisk, and I only have brushes.

Widget's eyes spin around like pinwheels in the wind.

Fixbot: An upgrade! I LOVE an upgrade!
> Ask what upgrades Widget has -> parts
> Ask about the robot on the workbench -> bench

=== bench
scene: robot-workshop
cast: hero, fixbot:sad, quill
Widget looks at the half-built robot on the bench.

Fixbot: That is my first robot ever. I built it wrong. I put its feet where its hands should go. It waved at people with its toes!

Quill: Hoo hoo! Was that a disaster?

Fixbot: At first I thought so. Then I learned how robot arms really work. Now I fix arms for everybody! A mistake is just a lesson wearing a funny hat.
clue: Widget says, "A mistake is just a lesson wearing a funny hat."
> Ask what upgrades Widget has -> parts

=== parts
scene: robot-workshop
cast: hero, fixbot:happy, helperbot:thinking
Widget opens a big plastic bin and pulls out three shiny attachments, one at a time.

Fixbot: Choose, choose! I have a whisk. I have a spatula. I have a giant spoon!

The whisk is made of loops of thin wire, the spatula is flat and bendy, and the spoon is as big as a frying pan.

Helperbot: The recipe says to beat the eggs and mix the batter. Which tool should I choose?
? RI.4 : A whisk is made of loops of wire, and it is used to stir fast and add air. What job is it best for?
+ Beating eggs until they are light and bubbly
- Flipping a pancake over in a hot pan
- Cutting a cake into slices
- Sweeping crumbs off the floor
hint: The text tells you what a whisk is used for: stirring fast and adding air.
next: attach

=== attach
scene: robot-workshop
cast: hero, fixbot:happy, helperbot:surprised
Widget climbs up onto Dumpling's shoulder with its four little legs.

Fixbot: Watch Widget work! First, I unscrew the old brush. Next, I clean the arm socket so no dust gets inside. Then, I click the whisk into the socket. Last, I tighten the screw so it can't fall off!

Widget's tools spin and whir. Zzzt, click, tink!

Dumpling lifts its brand-new arm and switches it on. The whisk spins so fast that it makes a little breeze, and Quill's feathers flutter.

Helperbot: Whee! I am a whisking robot now!
? RI.3 order : Put Widget's steps in the order he did them.
1 Unscrew the old brush.
2 Clean the arm socket.
3 Click the whisk into the socket.
4 Tighten the screw.
hint: Listen for the order words Widget uses: first, next, then and last.
next: worry

=== worry
scene: robot-workshop
cast: hero, helperbot:scared, fixbot
Dumpling looks down at its shiny new whisk, and then its eyes droop again.

Helperbot: What if I make a mistake? What if the cake is terrible? Ms. Butterbell's cake has won ten years in a row. I don't want to ruin it.

Widget clicks over and pats Dumpling with its screwdriver hand.

Fixbot: Remember my robot with feet for hands? Mistakes happen. You fix them. Then you know more than before!

Dumpling's screen flickers. It still looks a little bit worried, but it nods slowly.
? RL.3 : How does Dumpling feel in this part of the story?
+ Nervous that it will make a mistake
- Angry at Widget for changing its arm
- Bored because the workshop is quiet
- Sleepy after a long day of sweeping
hint: Read what Dumpling says. What is it afraid will happen?
next: lemons

=== lemons
scene: robot-workshop
cast: hero, drone:happy, helperbot:happy
BZZZZZ! Whirligig flies in through the window, carrying a net bag with two bright yellow lemons inside. Unfortunately, it is also carrying a loaf of bread, a cabbage, a rubber duck and somebody's left sock.

Drone: I got the lemons! I also got some extra things. The market was very exciting!

Helperbot: Whirligig, whose sock is that?

Drone: I don't know! It was on a clothesline, and it looked lonely.

Quill laughs so hard that she has to sit down on a toolbox.
> Help Whirligig return the extra things -> return
> Hurry back to the bakery -> ch2-end

=== return
scene: city-street
cast: hero, drone:sad, quill:thinking
You and Whirligig carry the extras back to where they belong. The cabbage goes back to the market, the rubber duck goes back to a little boy at the fountain, and the sock goes back to a clothesline, where a surprised lady says, "My sock! I thought it ran away!"

Drone: I was trying to help. I just got too excited.

Quill: Hoo. Being excited is wonderful. But a good helper checks what is really needed.

Whirligig's screen shows a small, sorry face for a moment, and then it shows a hopeful smile.

Drone: Next time, I will make a list!
? RL.3 : What does Whirligig learn on this page?
+ A good helper checks what is really needed.
- Socks are the most important thing at the market.
- Drones should never fly to the market.
- Cabbages are better than lemons for cakes.
hint: Read what Quill tells Whirligig, and what Whirligig says it will do next time.
next: ch2-end

=== ch2-end
scene: bakery
cast: hero, helperbot:happy, drone:happy
Back at the bakery, Dumpling lines up everything on the counter in a neat row: the flour, the sugar, the eggs, the salt and two fresh lemons.

Dumpling wiggles its new whisk arm, and Whirligig hovers beside the oven like a tiny, buzzing assistant.

Helperbot: We have everything. Now we just have to bake it right.
? RL.2 : Which sentence best tells what happens in Chapter Two?
+ Widget gives Dumpling a whisk, and Whirligig brings the lemons.
- Dumpling builds a new robot with feet for hands.
- Whirligig wins a race against three eggs.
- Quill bakes a cake in the robot workshop.
hint: What two things did Dumpling need at the end of Chapter One? How did it get them?
next: quiz-ch3

=== quiz-ch3
scene: bakery
cast: hero, quill:happy
The page goes quiet, like the whole book is holding its breath. Quill puffs out her feathers.
Quill: Hoo hoo! It's time for a quick challenge. Take your time and think it through.
? QUIZ : One quick challenge, then back to the story!
next: ch3

# ============================================================
# CHAPTER THREE: THE BAKE-OFF
# ============================================================

=== ch3
scene: bakery
cast: hero, helperbot:happy, quill
checkpoint
~ Chapter Three ~

WHIRRRR! Dumpling beats the eggs with its new whisk until they are pale and fluffy. You pour in the sugar, Whirligig drops in the pinch of salt very carefully this time, and then everyone helps add the flour.

The next step on the card says: "Gently fold in the lemon zest."

You grate the lemons, and tiny curls of yellow peel fall into a little dish. The whole bakery suddenly smells like sunshine.

Dumpling picks up the bowl of batter and starts to fold it in half, like a piece of paper.

Helperbot: Fold, fold, fold... Hmm. Bowls do not fold very well.
? L.5 : In this recipe, what does "fold in the zest" mean?
+ Gently stir the zest into the batter.
- Fold the bowl in half like paper.
- Fold a napkin into a fancy shape.
- Throw the zest away.
hint: The card says "gently." Think about how a cook mixes something softly into batter.
next: oven

=== oven
scene: bakery
cast: hero, helperbot:scared, drone
Dumpling gently stirs in the zest and pours the batter into a round pan.

Now comes the scary part, which is the oven. Dumpling rolls toward it very, very slowly.

Helperbot: The card says 350 degrees for 30 minutes. Whirligig, will you please read the numbers out loud so I don't make a mistake?

Drone: Three... five... zero! Perfect!

Dumpling turns the knob and slides the pan into the oven. Then it sits in front of the oven window and does not move for thirty whole minutes.

DING! The cake is golden brown, but when Dumpling pulls it out, everyone gasps, because one side of the cake is tall and the other side is completely flat.

Helperbot: Oh no! I leaned on my wheel, and the pan tipped! It's lopsided! I ruined it!
? RL.1 : Which sentence tells why the cake came out lopsided?
+ "I leaned on my wheel, and the pan tipped!"
- "The card says 350 degrees for 30 minutes."
- "Three... five... zero! Perfect!"
- "The cake is golden."
hint: Look for the sentence where Dumpling explains what went wrong.
next: fix

=== fix
scene: bakery
cast: hero, helperbot:sad, quill:thinking
Dumpling's eyes turn into two sad little lines, and a tiny drop of oil leaks from the corner of its screen, which is how robots cry.

Quill: Hoo. Remember what Widget said? A mistake is just a lesson wearing a funny hat. What could we do now?

You look at the lopsided cake and think as hard as you can.
> Cover the flat side with frosting -> frosting
> Flip the cake upside down -> flip
> Just bring it to the Bake-Off as it is -> asis

=== asis
scene: bakery
cast: hero, helperbot:thinking, drone
Dumpling looks at the cake for a long time.

Helperbot: It's lopsided. But it smells right. It smells just like Ms. Butterbell's cake.

Drone: It's like a hill! A delicious lemon hill!

Dumpling puts the cake in a box very carefully, as if it were made of glass.
> Carry the cake to the Bake-Off -> village

=== frosting
scene: bakery
cast: hero, helperbot:happy, drone:happy
You mix a bowl of lemon frosting, and Dumpling whisks it until it is smooth and shiny. Then you spread a thick layer on the flat side until the cake is nice and even.

Whirligig flies over the cake and drops thin lemon slices in a circle on top, so that they look like a bright yellow sun.

Helperbot: It looks like sunshine! It IS a Sunshine Lemon Cake!
> Carry the cake to the Bake-Off -> village

=== flip
scene: bakery
cast: hero, helperbot:surprised, quill:happy
You put a big plate on top of the pan and flip the whole thing over. Now the flat side is on top, and it is perfectly smooth!

Quill: Hoo! An upside-down cake!

Dumpling stares at it, and then its eyes light up brighter than ever before.

Helperbot: Ms. Butterbell told me about her grandmother's upside-down cake! She said it had lemon slices on the bottom of the pan, so they ended up on top!

Whirligig lays lemon slices on top in a spiral, and you drizzle them with a little honey. It shines like stained glass.
clue: You turned the lopsided cake into an upside-down cake, like Ms. Butterbell's grandmother used to make.
> Carry the cake to the Bake-Off -> village-secret

=== village
scene: village
cast: hero, helperbot:scared, mayor:happy
The Sugarloaf Bake-Off is in the village square, where long tables are covered with pies, cookies, muffins and cakes. There is even a chocolate cake shaped like a castle, with candy towers.

Mayor Higgleby walks from table to table with a fork and a clipboard, wearing a tall hat with a feather in it.

Mayor: Oh my! A robot baker! I have never judged a robot's cake before.

Dumpling's wheel shakes so much that it squeaks like a nervous mouse.

Helperbot: I am Dumpling. I baked this for Ms. Butterbell. She is sick. I made a mistake, and then I fixed it. I hope that is allowed.
> Wait for the Mayor to taste it -> taste

=== taste
scene: village
cast: hero, mayor:happy, helperbot:surprised
The Mayor takes one bite and closes her eyes, and for a long time she does not say anything at all.

Then she says, "This cake is scrumptious. It is moist, it is lemony, and it tastes like a sunny day in the middle of winter."

Dumpling's whisk spins all by itself.
? L.4 : The Mayor says the cake is "scrumptious." Which words help you know what "scrumptious" means?
+ "it is moist, it is lemony, and it tastes like a sunny day"
- "She does not say anything for a long time."
- "Dumpling's whisk spins all by itself."
- "The Mayor takes one bite."
hint: Find the words that come right after "scrumptious." They describe how the cake tastes.
next: theme

=== theme
scene: village
cast: hero, helperbot:happy, quill:happy
The Mayor climbs onto a little wooden stage and holds up two shiny ribbons, a blue one and a gold one.

Quill hops onto your shoulder and whispers to you.

Quill: Hoo. Think about everything Dumpling did today. It was scared. It made mistakes. It got help from friends. And it kept going.
? RL.2 : What lesson does Dumpling's story teach?
+ Mistakes can help you learn if you keep trying.
- Robots should never bake cakes.
- It is best to do everything all by yourself.
- If something goes wrong, you should give up.
hint: Think about what Widget said about mistakes, and what Dumpling did when the cake came out lopsided.
next: ribbons

=== ribbons
scene: village
cast: hero, mayor:happy, helperbot:happy
Mayor: The blue ribbon for the best cake goes to... the Sunshine Lemon Cake from Butterbell Bakery!

The crowd cheers, and Whirligig zooms in happy loops over the square.

Dumpling rolls up to take the ribbon, but then it stops and looks back at you.
> Take the ribbon to Ms. Butterbell -> win-visit
> Ask the Mayor if Dumpling can bake again -> win-baker

=== win-visit
scene: bakery
cast: hero, helperbot:happy, quill:happy
That evening, you, Quill, Dumpling and Whirligig take the ribbon and the last slice of cake to Ms. Butterbell's house, where she is wrapped in a patchwork quilt with a cup of tea.

She takes one bite of the cake, and then she sneezes, laughs, and cries a little bit, all at the same time.

"Dumpling, it tastes just like mine. No, it tastes better, because a friend made it."

Dumpling's screen shows a big pink heart. The next morning, Ms. Butterbell takes down the old sign over the oven and writes a new one: RULE NUMBER ONE: DUMPLING BAKES WITH A FRIEND.
end: win The Eleventh Blue Ribbon

=== win-baker
scene: village
cast: mayor:happy, helperbot:happy, drone:happy
Mayor: Can Dumpling bake again? My dear robot, I would like to order one hundred lemon cupcakes for the town picnic!

Dumpling's whisk spins so fast that it lifts off the ground for one second.

Helperbot: One hundred! I will need a lot of lemons. And a list. Whirligig, no socks this time!

Drone: No socks! I promise!

By the end of the week, Butterbell Bakery has a new sign in the window that says NOW WITH ROBOT BAKING LESSONS. The very first student is Widget, who wants to bake a cake shaped like a wrench.
end: win Sugarloaf's First Robot Baker

=== village-secret
scene: village
cast: hero, mayor:surprised, helperbot:happy
At the Bake-Off, the Mayor stops in front of your shining upside-down cake, and her fork freezes in the air.

Mayor: Is that... a Butterbell Upside-Down Lemon Cake? I have not seen one of these in forty years! Old Grandma Butterbell made them when I was a little girl.

She takes a bite, and a happy tear rolls down her cheek.

Mayor: It tastes exactly like being seven years old. This cake gets the gold ribbon, the blue ribbon, AND a special ribbon I am inventing right now. It is called the Best Mistake Ever Ribbon!

Dumpling spins around three times, Whirligig does a loop-the-loop, and Quill hoots so loudly that a pigeon falls off the fountain.
end: secret The Best Mistake Ever
