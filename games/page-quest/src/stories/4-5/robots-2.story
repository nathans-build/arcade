title: Sprocket Takes Everything Literally
author: SpiderBen10's Arcade
genre: robots
band: 4-5
cover: city-street
blurb: A robot dog's word chip got zapped, and now it takes every saying literally. The town talent show is tonight!
start: start

# ============================================================
# CHAPTER ONE: HIT THE ROAD!
# ============================================================

=== start
scene: city-street
cast: hero, kid:happy, robodog:happy
checkpoint
~ Chapter One ~

Quill drops you off on a busy city street on a bright Saturday morning, right in front of a girl with a red backpack and a very shiny robot dog.

The girl waves at you with both hands. Her name is Billie Ashgrove, and she is ten years old. The dog has silver legs, blue ear flaps, green light-up eyes, and a little antenna for a tail that wags so fast it hums.

Kid: Hi! This is Sprocket. I built him from a kit, and tonight we are going to be in the Paws and Gears Talent Show at the arena! There's just one teeny, tiny problem.

Sprocket sits down, stands up, sits down again, spins around twice, and then barks as loudly as he can. "BORK! Bork-bork! BEEP!"
> Ask Billie about the teeny, tiny problem -> problem
> Pat Sprocket on the head -> pat

=== pat
scene: city-street
cast: hero, robodog:happy, kid
You reach down and pat Sprocket on his smooth metal head. It feels cool, like a spoon from the drawer.

Sprocket's antenna tail spins in a happy circle, and his green eyes turn into two little pink hearts that blink on and off.

Robodog: BORK! Head pat detected! Happiness level: one hundred percent! Please pat again!

Kid: He talks, too. He's a very good talker. That's actually part of the problem.
> Ask Billie about the problem -> problem

=== problem
scene: city-street
cast: hero, kid:sad, robodog:thinking
Billie sighs a long, tired sigh and taps a small metal door on Sprocket's back, right between his shoulders.

Kid: Last night there was a big thunderstorm, and lightning zapped the power lines on our street. Sprocket was charging, and the zap scrambled his word chip. Now he understands every word exactly the way it is written. He doesn't understand sayings at all!

Robodog: I understand everything perfectly! Billie said "It's raining cats and dogs," so I waited by the window all night. Zero cats fell. Zero dogs fell. Very disappointing.

Billie looks worriedly at the big clock on the front of the bank across the street.

Kid: The talent show starts at six o'clock, and we have to pick up our costume at the shop on Maple Street. Come on, everybody. Let's hit the road!

Sprocket marches straight over to the edge of the street, lifts one silver paw, and hits the road with it as hard as he can. BONK. BONK. BONK.

Robodog: The road has been hit! Is it in trouble now?
? L.5 : What does Billie mean when she says, "Let's hit the road"?
+ Let's leave and start going somewhere.
- Let's knock on the road with our hands.
- Let's paint a new road.
- Let's sit down in the middle of the road.
hint: Billie says it right after she says they have to go pick up the costume. What does she want everyone to do?
next: explain

=== explain
scene: city-street
cast: hero, kid:happy, robodog:surprised
Billie kneels down on the sidewalk next to Sprocket and explains it to him slowly and patiently.

Kid: Sprocket, "hit the road" is a saying. It means "let's go." Some words are like puzzles. They don't mean exactly what they say.

Robodog: A word puzzle! I love puzzles! But I am very confused. Why don't people just say what they mean?

Kid: Because sayings are fun! People have used them for hundreds of years.

Sprocket tilts his head so far to one side that both of his blue ear flaps flop down over his eyes.
clue: A saying (an idiom) is a group of words that means something different from the exact words.
> Walk toward Maple Street -> backpack

=== backpack
scene: city-street
cast: hero, kid:thinking, robodog:happy
On the way to Maple Street, Billie stops at a newsstand to buy a juice box, and she sets her red backpack down on the bench right next to you.

Kid: Sprocket, can you keep an eye on my backpack for a minute?

Robodog: Yes! I will keep an eye on it!

Sprocket pops one of his glowing eyes out of its socket, which is very easy for a robot dog to do, and he sets it carefully on top of the backpack. Then he walks around in a wobbly circle, bumps right into a mailbox, and sits down.

Robodog: Mission complete! My eye is ON the backpack. I can see the backpack. I can also see the inside of a cloud.

Billie laughs so hard that she accidentally squirts apple juice out of her nose.
? L.5 : What does "keep an eye on my backpack" really mean?
+ Watch the backpack to make sure it stays safe.
- Put your eyeball on top of the backpack.
- Paint an eye on the side of the backpack.
- Carry the backpack around on your head.
hint: Billie walked away for a minute. What would she want someone to do with her backpack while she was gone?
next: ball

=== ball
scene: city-street
cast: hero, kid:happy, robodog:happy
Sprocket clicks his eye back into place, and you all keep walking down the sidewalk together. After a while, Billie pulls a squeaky orange ball out of her backpack.

Kid: Sprocket loves to play fetch. Watch this! Ready, Sprocket?

She throws the ball, but it bounces off a light pole, flies up into the air, and lands with a soft PLOP in the back of a big blue recycling truck that is driving by.

Kid: Oh no! That's his favorite ball!

Robodog: BALL! BALL! The ball is escaping! I will FETCH IT!

The truck turns the corner, and Sprocket's legs spin like the wheels of a bicycle as he zooms off after it.
> Chase after Sprocket -> chase
> Ask Billie where the truck is going -> truck

=== truck
scene: city-street
cast: hero, kid:scared, quill:thinking
Billie points down the street with a shaking finger. On the back of the truck, before it disappears around the corner, you can read big white letters: SUNNYDALE RECYCLING CENTER. LEFT ON OAK STREET, THEN STRAIGHT AHEAD.

Quill swoops down and lands on Billie's shoulder.

Quill: Hoo! If we follow the directions on the truck, we will find the recycling center, and I bet we will find Sprocket, too.
clue: The truck says: SUNNYDALE RECYCLING CENTER. LEFT ON OAK STREET, THEN STRAIGHT AHEAD.
> Follow the directions to the center -> ch1-end

=== chase
scene: city-street
cast: hero, kid:scared, quill
You and Billie run after Sprocket, but robot dogs are fast, and soon you can only see a tiny silver dot far down the street.

Quill swoops down from a rooftop and lands on Billie's shoulder.

Quill: Hoo! I saw it from up high. The truck went to the recycling center. It's left on Oak Street, then straight ahead.
> Follow Quill's directions -> ch1-end

=== ch1-end
scene: city-street
cast: hero, kid:sad, quill:thinking
You hurry down Oak Street as fast as you can, and Billie keeps checking the time on every clock you pass.

Kid: I just hope we find him in time for the show. We've practiced our trick for three weeks. Sprocket jumps through a hoop and then catches a flying disc in his mouth.

Quill: Hoo. And if his word chip is still mixed up?

Kid: Then I'll have to be very, very careful about what I say.
? RL.2 : Which sentence best tells what happens in Chapter One?
+ Sprocket mixes up sayings, then chases his ball toward recycling.
- Billie builds a brand-new robot dog for the talent show.
- Sprocket hits the road so hard that he breaks it.
- Quill buys a juice box and wins the talent show.
hint: Think about Sprocket's big problem with words, and about where everyone is going at the end of the chapter.
next: quiz-ch2

=== quiz-ch2
scene: city-street
cast: hero, quill:happy
You stop for a moment to catch your breath. Quill pulls a tiny card out from under her wing.
Quill: Good explorers keep all their skills sharp, not just their reading skills. Ready?
? QUIZ : Quick challenge before the next chapter!
next: ch2

# ============================================================
# CHAPTER TWO: THE GIANT AT THE RECYCLING CENTER
# ============================================================

=== ch2
scene: recycling-center
cast: hero, kid:surprised, robodog:happy
checkpoint
~ Chapter Two ~

The Sunnydale Recycling Center is noisy and sunny and busy. There are bales of squashed paper stacked like giant blocks, a long moving belt full of bottles, and four big bins in a row: blue, yellow, green and red.

Sprocket is sitting proudly on top of the blue bin, and he is wagging his antenna tail so fast that it whistles like a teakettle.

Robodog: I fetched it! I fetched the ball! I also fetched forty-two soda cans, a spoon and a very surprised squirrel.

The squirrel hops off the bin, gives Sprocket a very grumpy look, and scampers away into the bushes.

Kid: Sprocket! You can't take things out of the bins!
> Read the sign by the bins -> sign
> Look for Sprocket's ball -> lookball

=== sign
scene: recycling-center
cast: hero, kid:thinking, robodog
A big sign hangs above the bins. It says:

HOW TO RECYCLE AT SUNNYDALE
Rinse everything first, so it is clean.
Put metal cans in the BLUE bin.
Put paper and cardboard in the YELLOW bin.
Put glass jars and bottles in the GREEN bin.
Put plastic cups in the RED bin.
Thank you for helping our planet!
? RI.1 : According to the sign, where should Sprocket put the soda cans?
+ In the blue bin
- In the yellow bin
- In the green bin
- In the red bin
hint: Find the line on the sign that talks about metal cans.
next: hoist

=== lookball
scene: recycling-center
cast: hero, robodog:thinking, kid
You search all around the bins, under the moving belt, and behind the stacks of boxes, but you don't see an orange ball anywhere.

Robodog: My ball sensor says the ball is close by. It is somewhere... up high.

Everyone looks up at the same time. Far above your heads, the squeaky orange ball is sitting on top of the tallest stack of paper bales.
> Read the sign by the bins -> sign

=== hoist
scene: recycling-center
cast: hero, mech:scared, robodog:surprised
THOOM. THOOM. THOOM. The ground shakes, and a huge yellow robot walks around the corner. It has an orange hard hat with a blinking light on top, black and yellow stripes on its shoulders, and two giant grabber hands.

Sprocket hides behind your legs, and his tail stops wagging.

But then the giant robot sees all of you and jumps backward, and it hides behind a stack of boxes that is much too small to hide behind.

Mech: Oh! Oh my. Visitors. Hello. I'm sorry. I'm Hoist. I lift the paper bales. I didn't mean to scare you. I scare everyone. I'm just so... big.
? RL.3 : Which word best describes Hoist?
+ Shy
- Mean
- Sneaky
- Bossy
hint: Look at what Hoist does when he sees everyone, and what he says about himself.
next: hoistball

=== hoistball
scene: recycling-center
cast: hero, mech:happy, kid:happy
Billie walks right up to Hoist and smiles at him.

Kid: You didn't scare us. Well, maybe a little. Could you please help us get that orange ball? It's up on top of the tallest bale.

Hoist reaches up with one giant hand and gently picks up the ball with two fingers, as carefully as if it were a soap bubble. He gives it to Sprocket, who barks with joy.

Mech: There you go, little dog.

Then Hoist sees Billie's flyer for the talent show sticking out of her backpack, and he looks at it for a long time.
> Ask Hoist if he likes talent shows -> feet

=== feet
scene: recycling-center
cast: hero, mech:sad, robodog:thinking
Mech: I signed up for the talent show. I wanted to sing. I sing to the paper bales every day, and they never complain. But now I have cold feet.

Robodog: COLD FEET! Emergency! Emergency!

Sprocket races to the lost-and-found box by the gate, digs through it, and comes back with two enormous fuzzy socks, one striped and one covered in polka dots.

Robodog: Here! Now your feet will be warm, and you can sing!

Hoist looks down at the socks for a long moment, and then he starts to laugh, a deep, rumbly laugh like a friendly thunderstorm.
? L.5 : What does Hoist mean when he says he has "cold feet"?
+ He feels too nervous to do something he planned to do.
- His feet are freezing because it is winter.
- He needs to buy new boots.
- He stepped in a puddle of ice water.
hint: Hoist wanted to sing, but now he is not sure. How does he feel about singing in front of people?
next: socks

=== socks
scene: recycling-center
cast: mech:happy, kid:happy, robodog:happy
Hoist pulls the fuzzy socks over his giant feet anyway. They only go halfway, but he wiggles his toes happily.

Mech: You know what? My feet do feel warmer. And so do I. Maybe I will sing after all.

Kid: You should! Come with us! We can practice together on the way.

Billie checks the clock on the wall of the recycling center, which says four o'clock.

Kid: We have two hours! Let's go... I mean, it's time to walk to the arena, Sprocket. Exactly those words.

Robodog: Walking to the arena! Exactly!
> Walk to the arena together -> ch2-end

=== ch2-end
scene: city-street
cast: hero, kid:happy, mech:happy
You walk through town together. Hoist hums softly as he walks, people stop on the sidewalk to listen, and Sprocket trots happily beside him with the orange ball in his mouth.

On the way, you think about everything that has happened since this morning.
? RL.5 order : Put these events in the order they happened.
1 Sprocket hit the road with his paw.
2 Sprocket put his eye on Billie's backpack.
3 The ball landed in the recycling truck.
4 Hoist got the ball down from the paper bales.
5 Sprocket brought Hoist a pair of socks.
hint: Think back to the start of the morning on the city street, and then to the recycling center.
next: quiz-ch3

=== quiz-ch3
scene: city-street
cast: hero, quill:happy
Quill hops in front of you and holds up one wing.
Quill: Wait just a moment! The next part of the story is coming. First, try one of my quick challenges.
? QUIZ : Sharp minds win the day. Try this one!
next: ch3

# ============================================================
# CHAPTER THREE: BREAK A LEG!
# ============================================================

=== ch3
scene: robot-arena
cast: hero, kid:scared, robodog:happy
checkpoint
~ Chapter Three ~

The arena is packed. Colorful banners hang from the ceiling, spotlights sweep across the floor, and hundreds of people are cheering in the bleachers. There are dancing hamsters, a parrot who tells jokes, and a robot cat who juggles yarn.

Billie squeezes the hoop tightly in her hands, and her knees are shaking.

The host of the show, a tall man in a sparkly purple jacket, pats Billie on the back.

"You're on next, kid. Break a leg!"

Sprocket's eyes turn bright red, and his tail sticks straight up like a flagpole.

Robodog: BREAK A LEG?! I will NOT break a leg! I need all four of my legs! That man is a DANGER!
? L.5 : What does the host mean when he says "Break a leg"?
+ Good luck!
- Please break your leg.
- Go home right now.
- Run as fast as you can.
hint: The host says it right before Billie goes on stage. What do people usually say to someone who is about to perform?
next: wobble

=== wobble
scene: robot-arena
cast: hero, robodog:scared, kid:sad
Sprocket is so upset that his bolts start to rattle. A screw falls out of his ear flap, his tail droops, and one leg slides sideways with a loud CLUNK.

Kid: Sprocket, you need to pull yourself together!

Robodog: Pull myself... together? Okay!

Sprocket grabs his own tail with his teeth and pulls. He clicks his leg back into place, screws the screw back in with his paw, straightens his ears, and then he stands up as tall as he can.

Robodog: I have pulled myself together! All parts are attached!

The audience can see all of this, because the curtain is already open, and everyone is laughing. But it's a happy laugh, not a mean one.
> Start the hoop trick anyway -> trick
> Make up a brand-new act -> newact

=== trick
scene: robot-arena
cast: hero, kid:happy, robodog:happy
Billie holds up the hoop, and Sprocket runs toward it.

Kid: Okay, Sprocket! Jump through!

Sprocket jumps... and jumps... and keeps on jumping, right on the same spot, because Billie didn't tell him when to stop.

Robodog: Jumping! Still jumping! How long is a jump?

The crowd roars with laughter, and Billie starts to giggle too. She realizes that this is even better than the trick they practiced.
? RL.1 : Which words from the story explain why Sprocket keeps jumping?
+ "because Billie didn't tell him when to stop"
- "Billie holds up the hoop"
- "The crowd roars with laughter"
- "Sprocket runs toward it"
hint: Look for the word "because." It tells you the reason.
next: newact

=== newact
scene: robot-arena
cast: hero, kid:happy, robodog:happy
Billie grabs the microphone with a big grin.

Kid: Ladies and gentlemen, this is Sprocket, the only dog in the world who does exactly what you say! Who wants to give him a command?

The audience goes wild. A grandma shouts, "Shake a leg!" and Sprocket shakes his leg so hard that it rattles like maracas. A little boy shouts, "Hold your horses!" and Sprocket looks everywhere for horses. A teacher shouts, "Zip your lips!" and Sprocket makes a zipping sound with his mouth: ZZZZIP.

Robodog: Mmmf! Mmmf mmmf!

Everyone in the arena is laughing so hard that they are wiping tears from their eyes.
? RL.3 : How does Billie solve the problem when Sprocket can't do the trick?
+ She turns his literal thinking into a funny new act.
- She asks Hoist to fix Sprocket's word chip.
- She gives up and leaves the stage.
- She buys a new robot dog.
hint: Read what Billie says into the microphone, and what she asks the audience to do.
next: hoistsing

=== hoistsing
scene: robot-arena
cast: kid:happy, mech:happy, robodog:happy
At the end of the act, Billie points to the side of the stage, where a giant yellow robot in mismatched socks is peeking out from behind the curtain.

Kid: And now, please welcome our friend Hoist!

Hoist steps carefully onto the stage. THOOM. THOOM. Then he opens his mouth and sings a slow, deep song about the moon and the sea and the paper bales. His voice is so warm and gentle that the whole arena goes quiet.

Mech: ...and every lonely thing gets a second chance to shine.

When the song ends, there is a moment of complete silence, and then everyone in the arena jumps to their feet and cheers.
? RL.2 : What lesson do Sprocket and Hoist's stories teach?
+ Things that make you different can also make you special.
- Robots should never be in talent shows.
- It is bad to laugh at a funny act.
- Sayings are silly and nobody should use them.
hint: Sprocket's mixed-up words and Hoist's big size both seemed like problems at first. How did they turn out?
next: finale

=== finale
scene: robot-arena
cast: hero, kid:happy, robodog:thinking
After the show, the host gives out the prizes, and then Billie sits down on the edge of the stage and looks thoughtfully at Sprocket.

Kid: I can fix your word chip now, if you want. Then you'll understand sayings again.

Sprocket thinks about it for a long time, and his ear flaps go slowly up and down.

Quill flutters down beside you and points one wing toward the sky outside the open arena doors, where the first stars are coming out.
> Fix Sprocket's word chip -> win-fix
> Keep Sprocket just the way he is -> win-keep
> Follow Quill to look at the stars -> secret-stars

=== win-fix
scene: city-street
cast: hero, kid:happy, robodog:happy
The next morning, Billie gently fixes Sprocket's word chip with a tiny screwdriver while you hold the flashlight.

Kid: There. Sprocket, it's raining cats and dogs outside.

Robodog: That means it is raining very hard! I should bring an umbrella! BORK!

But every once in a while, just to make Billie laugh, Sprocket still hits the road with his paw, BONK, before they go for a walk. Their trophy for Funniest Act in Town sits on the shelf, right next to a picture of Hoist in his fuzzy socks.
end: win Funniest Act in Town

=== win-keep
scene: city-street
cast: hero, kid:happy, robodog:happy
Kid: You know what? I like you exactly the way you are.

Robodog: I like me too! And I like you exactly the way YOU are!

From then on, Billie and Sprocket perform at birthday parties all over town. Kids shout sayings, and Sprocket acts them out, and Billie explains what each saying really means. Teachers start bringing whole classes to watch, because it turns out that Sprocket is the best idiom teacher in Sunnydale.

Hoist comes to every show, wearing his lucky socks.
end: win The Idiom Dog of Sunnydale

=== secret-stars
scene: rooftop-night
cast: robodog:happy, mech:happy, kid:happy
Hoist lifts you, Billie and Sprocket up onto the flat roof of the building across the street, where you can see the whole city glowing below you.

Mech: I come up here sometimes to sing to the stars. They are good listeners, like the paper bales.

Just then, a shooting star zips across the sky, and then another one, and then a whole sparkling shower of them.

Kid: Look! It's raining stars!

Robodog: Billie, is that a saying, or is it real?

Kid: This time, Sprocket, it's real.

Sprocket's eyes turn into two tiny stars, and he barks at the sky until the very last one is gone.
end: secret It's Raining Stars
