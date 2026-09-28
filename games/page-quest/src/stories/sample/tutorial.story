# Page Quest sample book: a short tutorial that shows every part of the format.
# The real books live in src/stories/4-5/, 6-8/ and 9-12/.
title: Quill's Practice Quest
author: SpiderBen10's Arcade
genre: adventure
band: 4-5
cover: island-jungle
blurb: Learn how Page Quest works on a quick trip to Parrot Island with Quill the owl.
start: welcome

=== welcome
scene: library
cast: hero, quill:happy
checkpoint
The Arcade Library is quiet. Rows of books glow on the tall shelves.
Quill: Hoo! Welcome, reader. Every book in this library is a door to a new place.
Quill: Read each page, then choose what you do next. Some pages ask a question. The answer is always in the story.
> Open the adventure book -> dock
> Ask Quill for a tip first -> tip

=== tip
scene: library
cast: hero, quill:thinking
clue: Quill's tip: when a question pops up, look back at the words you just read.
Quill: Here is my best tip. When a question pops up, look back at the words you just read.
Quill: I put that tip in your Clue Journal. Press J or tap JOURNAL to see it.
> Open the adventure book -> dock

=== dock
scene: beach
cast: hero, captain:scared, quill
clue: A green parrot flew after the captain's map.
You open the book, and warm wind blows in your face. You are standing on a sunny dock.
A captain in a blue coat runs up to you.
Captain: My map! The wind grabbed it and blew it into the jungle. A green parrot flew after it!
Quill: Don't worry, Captain. We are good at finding things.
> Follow the parrot into the jungle -> jungle
> Look under the dock first -> under-dock

=== under-dock
scene: beach
cast: hero, quill:thinking
clue: The torn corner of the map shows a red rock.
You kneel down and peek under the dock. Two crabs wave their claws at you.
Stuck on a post is a torn corner of paper. It shows a big red rock.
Quill: That looks like part of the map. Let's go find the rest!
> Head into the jungle -> jungle

=== jungle
scene: island-jungle
cast: hero, parrot:happy, quill
checkpoint
Deep in the jungle, you find the green parrot on a branch. It is holding the map pieces in its claws.
Parrot: Squawk! I only took the map because I wanted to find the treasure. I love shiny things!
Quill: Then help us, and we will all find it together.
? RL.3 : Why did the parrot take the map?
+ It wanted to find the shiny treasure.
- It needed paper for its nest.
- The captain asked it to hide the map.
- The wind blew the map into its claws.
hint: Read what Parrot said about shiny things.
next: pieces

=== pieces
scene: island-jungle
cast: hero, parrot:happy, quill:happy
The parrot drops the map pieces into your hands. On the back, the captain wrote the steps to the treasure.
First, walk past the tall palm tree. Next, cross the rope bridge. Last, dig beside the big red rock.
? RL.5 order : Put the captain's steps in order.
1 Walk past the tall palm tree.
2 Cross the rope bridge.
3 Dig beside the big red rock.
hint: Look for the time words: first, next and last.
next: rock

=== rock
scene: mountain-pass
cast: hero, captain:happy, parrot
You walk past the palm, cross the swaying bridge, and reach the big red rock. The captain catches up, out of breath.
Behind the rock, you notice a dark cave. A cool breeze whistles out of it.
Parrot: Shiny things! I can smell shiny things in there!
> Dig beside the red rock -> treasure
> Peek inside the dark cave -> parrot-hoard

=== treasure
scene: mountain-pass
cast: hero, captain:happy, quill:happy
You dig beside the red rock and hit a wooden chest. Inside are old coins and a brand new map of the whole island.
Captain: You followed every step. You are a true map reader!
end: win The Map Reader

=== parrot-hoard
scene: cave
cast: hero, parrot:surprised, quill:surprised
Inside the cave, the floor sparkles. The parrot has been hiding shiny things here for years: buttons, spoons, keys and one golden crown.
Parrot: My secret treasure room! You are the first to see it. Squawk!
end: secret The Parrot's Hoard
