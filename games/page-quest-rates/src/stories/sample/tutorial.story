# Page Quest: Rate & Percent Mysteries: the HOW TO PLAY book (SpiderBen10's special edition).
# A short practice read that shows every part: choices, the journal, a math gate with hints,
# a multi-step story problem (chain), a win ending and a secret ending.
title: Quill's Math Warm-Up
author: SpiderBen10's Arcade
genre: adventure
band: 6-8
cover: library
blurb: A quick warm-up with Quill: choices, math gates, hints, a story problem and two endings.
start: welcome

=== welcome
scene: library
cast: hero, quill:happy
checkpoint
The Arcade Library is quiet. Rows of books glow on the tall shelves, and a new shelf is labeled MATH 6, UNIT 3.
Quill: Hoo! Welcome, SpiderBen10. In these books, the story moves when you make choices and solve my math questions.
Quill: The numbers are new every time you read, so you can never memorize the answers. You have to do the math!
> Show me a math question -> first
> Ask Quill how hints work -> tip

=== tip
scene: library
cast: hero, quill:thinking
clue: Quill's tip: press H (or tap HINT) for a nudge. Press it again for a worked step.
Quill: If you get stuck, press H or tap the HINT button. The first hint is a nudge. The second hint shows a worked step.
Quill: A wrong answer never costs you anything. I'll tell you what mistake it looks like, and you try again. There is no timer.
> Show me a math question -> first

=== first
scene: library
cast: hero, quill
Quill flips open a book about a lemonade stand. A picture of the problem appears next to the question.
? MATH percent-dnl unit=cups thing=pitcher : The lemonade pitcher is full. Use the double number line.
next: second

=== second
scene: beach
cast: hero, quill:happy, kid
A kid at the beach is selling lemonade and snacks.
Kid: I'm buying supplies for my stand. Can you check my receipt?
Quill: This one is a story problem with a few steps. First I ask for the FINAL answer. If you miss it, we'll walk through the steps together.
? MATH chain:sale-tax item=cooler : What should the kid pay for the cooler?
bonus: Story problem solved in one go. That earns bonus points and a gold-star clue!
next: last

=== last
scene: beach
cast: hero, quill, kid:happy
clue: Your journal (J) keeps every clue you find, including gold-star clues.
Kid: Thanks! You're fast with percents.
Quill: Hoo! That's how every book works. When you reach an ending, you'll see your results for each skill, a button to redo the ones you missed, and buttons to save your answers.
> Go back to the library -> end-win
> Peek under the lemonade table -> end-secret

=== end-win
scene: library
cast: hero, quill:happy
You are back in the library, ready for a real book.
end: win Warmed Up

=== end-secret
scene: beach
cast: hero, quill:surprised
Under the table is a tiny treasure chest full of shiny bottle caps, each one stamped with a percent sign.
Quill: Hoo! A secret ending. Every book has one. Keep your eyes open!
end: secret The Bottle Cap Chest
