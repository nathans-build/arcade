# Page Quest: Rate & Percent Mysteries (SpiderBen10's special edition, Math 6 Unit 3)
# Book 1: a shopping-mall mystery. Sections C and D: deals per ounce, discounts, coupons, tax, tips.
# Every "? MATH" gate makes fresh numbers at play time (src/math/unit3.ts and src/math/chains.ts).
title: The Mall Rush Mystery
author: SpiderBen10's Arcade
genre: mystery
band: 6-8
cover: mall
blurb: Someone is rigging prices at the Grand Bazaar Mall. Catch the Price Phantom by catching the math mistakes!
start: entrance

=== entrance
scene: mall
cast: hero, quill:happy, detective
checkpoint
~ Chapter One: The Big Percent Sale ~
It is the first morning of the Big Percent Sale at the Grand Bazaar Mall, and colorful banners announce discounts from every window while the fountain sparkles beneath the enormous glass ceiling.
You came hoping to find new sneakers, but Quill came because she has never once missed a sale on bookmarks.
A woman in a long tan coat waves you over, and the badge clipped to her collar says Detective Nia Okoro.
Detective: You must be SpiderBen10. Quill tells me that you are remarkably careful with numbers, and today I need exactly that kind of help.
Detective: Someone has been secretly changing price signs and receipts all over the mall, so customers are paying more than they should, and nobody has noticed who is responsible. The store owners have started calling this person the Price Phantom.
Quill: A mystery made entirely of math, which happens to be my favorite kind. Where should we begin, Detective?
> Check the shelf tags at Deal Depot -> depot
> Look at receipts at the scarf shop -> checkout

=== depot
scene: mall
cast: hero, quill, kid:thinking
clue: Deal Depot: a bright BEST DEAL sticker appeared on one shampoo shelf before the store opened.
Deal Depot smells like soap and brand-new plastic, and a teenage stocker named Pip is carefully straightening a crowded shelf of shampoo.
Two bottles of the same shampoo sit side by side, but only one of them wears a bright yellow sticker that announces BEST DEAL in enormous letters.
Kid: That sticker is strange, because I definitely didn't put it there. Somebody must have stuck it on before the store opened this morning.
Quill: A sticker cannot do arithmetic, so let's compare the bottles ourselves, one ounce at a time.
? MATH deal-compare item=shampoo unit=oz : Which bottle is really the better buy?
next: depot-2

=== depot-2
scene: mall
cast: hero, kid:surprised, quill:thinking
clue: The BEST DEAL sticker does not match the unit prices. Someone wants shoppers to grab the wrong bottle.
When you show Pip the price of a single ounce in each bottle, it becomes obvious that the sticker does not match the math at all.
Kid: So the sticker is a trick! Whoever did this is hoping that customers will grab the wrong bottle without thinking about the unit price.
Pip reaches into an apron pocket and pulls out a crumpled slip of paper that looks like it has been folded many times.
Kid: I found this next to the sticker roll in the back room. It's a receipt from the scarf shop, and the total looks suspicious to me.
> Study the scarf receipt -> scarf
> Ask Pip who can use the sticker roll -> sticker-roll

=== sticker-roll
scene: mall
cast: hero, kid, quill
clue: Only people with a gray staff key card can open the sticker cabinet.
Kid: The sticker roll is kept in a locked cabinet in the back room, and you need a gray staff key card to open it.
Kid: Regular store workers carry those cards, and so do the mall managers, and I think the security officers have them as well.
Quill: That gives us a fairly short list of suspects, so keep your eyes open for anyone carrying a gray key card.
> Study the scarf receipt -> scarf

=== checkout
scene: mall
cast: hero, quill, keeper:sad
Mr. Ambrose Quayle owns a tiny scarf shop called Woolly Wonders, and at the moment he is staring at a receipt as though it might jump up and bite him.
Keeper: A customer complained that my register charged her too much, even though my register has always been perfectly honest. Could you possibly check it for me?
Quill: Receipts happen to be our favorite kind of evidence, Mr. Quayle.
> Check the receipt step by step -> scarf

=== scarf
scene: mall
cast: hero, quill:thinking, keeper
The receipt belongs to a shopper named Mrs. Lund, who bought several striped scarves, used a coupon, and then paid the city's sales tax.
Quill: A receipt is really a story told in numbers, and if even one step is wrong, then the whole ending is wrong too.
? MATH chain:receipt who=Mrs._Lund item=striped_scarves : Work out what Mrs. Lund's receipt total SHOULD be.
bonus: You checked Mrs. Lund's receipt in one go. The real total is lower than the one the register printed.
next: scarf-2

=== scarf-2
scene: mall
cast: hero, keeper:surprised, quill
clue: The scarf register printed a bigger total than the math says. Someone changed its tax setting.
Your answer does not match the total printed on the receipt, because the printed total is noticeably higher.
Mr. Quayle opens the register settings with trembling fingers and discovers that the tax rate has been set much higher than the city's real rate.
Keeper: I never changed that setting! Yesterday evening, a worker from the mall office visited every store on this floor to "update" the registers.
Keeper: He carried a gray key card, he wore an enormous hood, and he hummed the same cheerful tune the entire time.
> Visit Percent Palace next door -> palace
> Think it over at the food court -> food

=== palace
scene: mall
cast: hero, quill, stranger
Percent Palace sells jackets in every color you could possibly imagine. Near the entrance, a hooded figure is quietly rearranging the sale signs, but when you get close, the figure hurries away, humming.
Quill: Did you hear that familiar tune? Let's examine the sign that the figure was touching.
A rack of jackets now displays a brand-new sign that promises a generous percent off.
? MATH sale-price item=jacket : What should a shopper really pay for one jacket?
next: palace-2

=== palace-2
scene: mall
cast: hero, quill:thinking, kid
clue: At Percent Palace, the register took off a smaller percent than the sale sign promised.
Pip jogs up beside you, completely out of breath.
Kid: The register here charged a customer more for a jacket than the sign promises, because it subtracted fewer dollars than it should have.
Quill: Then let's calculate what percent the register actually took off by comparing the dollars removed to the whole original price.
? MATH percent-find what=dollars adj=taken_off : Here is what one register screen showed.
next: palace-3

=== palace-3
scene: mall
cast: hero, quill, kid
The register gives a smaller discount than the sign promises, and that is definitely not an accident. Somebody programmed it that way on purpose.
Kid: It has to be the same worker who "updated" the registers last night, because it's the same trick in a different store.
Quill: Tiny changes that quietly add up. Our Phantom is counting on the idea that nobody will bother to check the math.
> Follow the humming to the food court -> food
> Report to the security office -> security

=== food
scene: mall
cast: hero, quill:happy, detective
The food court smells deliciously of soft pretzels and spicy noodles, and Detective Okoro is having lunch with two of her officers at a corner table.
Detective: Please join us! You can calculate our bill while I listen to everything you have discovered.
? MATH chain:tip-split place=the_noodle_stand : How much does each person at the table pay?
bonus: Quill tucks a gold star into your journal: lunch math, solved in one go.
next: food-2

=== food-2
scene: mall
cast: hero, detective:thinking, quill
clue: The hooded worker signed the mall office sheet as "G. Marrow."
You describe the suspicious sticker, the scarf register with the wrong tax, and the jacket register with the small discount.
Detective: Every store manager is telling me the same story. A hooded worker from the mall office visited them, and the sign-in sheet says his name is G. Marrow.
Detective: However, the office insists that nobody by that name is working this week, so let's examine the security cameras.
> Go to the security office -> security

=== security
scene: secret-hq
cast: hero, guard, quill
checkpoint
~ Chapter Two: Following the Numbers ~
The security office is crowded with glowing screens. Chief Benedetta Ruiz runs security for the entire mall, and she absolutely hates puzzles that she cannot solve.
Guard: We collected every receipt printed this morning. We know how many are incorrect, and we know what percent of all the receipts that is, but my official report needs the total number.
? MATH percent-whole what=receipts done=wrong over=no : How many receipts did the mall print this morning?
next: security-2

=== security-2
scene: secret-hq
cast: hero, guard:thinking, quill
clue: Camera 7: the hooded worker carries a gray key card and a bag of gummy bears.
Chief Ruiz plays the recording from Camera 7, which shows the hooded worker strolling past the candy shop with a gray key card dangling from a clip and a bag of gummy bears in one hand.
Guard: Only people with gray key cards can enter the back rooms, which means store workers, managers, or my own officers.
Quill: And there is only one hooded person carrying gummy bears, so let's ask questions at the candy shop.
> Visit the candy shop -> candy
> Check the electronics store first -> tech

=== candy
scene: bakery
cast: hero, quill, scientist:happy
The Sugar Lab candy shop has walls covered with clear plastic bins of gummies, sour worms and trail mix, and Dr. Juniper Fizz invents unusual flavors in the kitchen behind the counter.
Scientist: The hooded worker? He buys gummy bears from the bulk bins every single day, and he always chooses the cheaper bin, which makes him a rather clever shopper.
Scientist: Today he paid with a large bill and rushed away without his change. Please help me count it out so that I can return it.
? MATH chain:deal-total who=the_hooded_worker item=gummy_bears : How much change should he get back?
bonus: Candy shop math in one go! Dr. Fizz says the hooded worker always counts his change twice.
next: candy-2

=== candy-2
scene: bakery
cast: hero, scientist:thinking, quill
clue: The hooded worker left a parking pass for the managers' lot, spot G.
Dr. Fizz hands you an envelope containing the change, and tucked inside it is a parking pass for the managers' lot, spot G.
Scientist: Spot G? Only managers are allowed to park in that lot, and each parking spot is labeled with the first letter of a manager's name.
Quill: G. Marrow, and now spot G. The pieces of this puzzle are finally lining up.
> Check the electronics store -> tech
> Take the clues to the Mayor -> manager

=== tech
scene: lab
cast: hero, quill, guard
Bolt and Byte Electronics glows with blue light, and dozens of headphones hang along the wall, each one wearing a little price tag. Chief Ruiz meets you at the entrance.
Guard: The registers in this store are behaving strangely too, so let's calculate the honest total for a single pair of headphones.
? MATH sales-tax item=headphones : What should the total be with the city's sales tax?
next: tech-2

=== tech-2
scene: lab
cast: hero, guard:angry, quill
clue: The electronics register added the tax twice. The repair log is signed "G.M., assistant manager."
The register displays a much bigger total than yours, because it adds the tax two separate times. In the repair log you find a short note that says, Tax updated, G.M., assistant manager.
Guard: G.M.? Our assistant manager is Gideon Marrow, and he told everyone that he would be on vacation this week!
> Find the assistant manager's storeroom -> office
> Tell the Mayor first -> manager

=== manager
scene: mall
cast: hero, quill, mayor:surprised
Mayor Opal Brightwater cut the ribbon for the sale this morning with a gigantic pair of scissors, and now she listens to your evidence with wide, astonished eyes.
Mayor: Gideon Marrow organizes the mall's raffle on the second floor, and he promised that the money would go to the city library.
Mayor: During the sale, though, he raised the price of every raffle ticket, and the new price is a percent of the old price.
? MATH percent-rate thing=raffle_ticket : What is the new price of a raffle ticket?
next: manager-2

=== manager-2
scene: mall
cast: hero, mayor:angry, quill
clue: The library never received any of the raffle money.
The Mayor telephones the library, which reports that it has not received a single cent from the raffle.
Mayor: That money was supposed to help the library! Please find Gideon before he manages to leave the mall.
> Search the storeroom upstairs -> office

=== office
scene: attic
cast: hero, quill:scared, stranger
checkpoint
~ Chapter Three: The Phantom's Storeroom ~
Behind a door marked STAFF ONLY, a narrow staircase leads to a dusty storeroom where cardboard boxes are stacked all the way to the ceiling, and somebody is humming in the darkness.
A hooded figure turns around, clutching a box overflowing with coupons.
Stranger: Who's there? This storeroom is for staff members only!
Quill: It's the Phantom! Be careful, SpiderBen10, and let's find out what is inside that box before anything else.
? MATH percent-tape unit=coupons thing=coupon_box : The coupons are sorted into equal stacks. How many coupons fill the whole box?
next: office-2

=== office-2
scene: attic
cast: hero, stranger:angry, quill
clue: The coupon box is full of fake coupons that only work at the raffle booth.
The coupons are counterfeits. Each one promises enormous savings, but they only work at the raffle booth.
Stranger: You think you're clever, don't you? Then prove it, right now, in your head, without any paper!
? MATH benchmark-percent unit=dollars : The Phantom fires a quick question at you.
next: office-3

=== office-3
scene: attic
cast: hero, stranger:surprised, quill:happy
The hooded figure takes a nervous step backward, because you have caught every single trick so far, and the Phantom knows it.
Now you have to decide carefully what to do next.
> Show the evidence and call the detective -> accuse
> Chase the figure down the escalator -> chase
> Look inside the last box first -> secret-box

=== chase
scene: mall
cast: hero, quill:scared
You race down the escalator, but the figure ducks into a crowd of shoppers, and by the time you reach the fountain, the hood has completely disappeared.
Quill: We ran when we should have proved it, and now the Phantom has slipped away.
end: lose The Phantom Slips Away

=== accuse
scene: mall
cast: hero, detective, stranger:sad
Detective Okoro arrives with Chief Ruiz, and you lay out your evidence like a trail of receipts across the table.
You explain the fake sticker at Deal Depot, the scarf register with the wrong tax, the jacket register with the smaller discount, the parking pass for spot G, and the note signed G.M.
The hood falls back to reveal Gideon Marrow, the assistant manager.
Stranger: I only changed a few numbers here and there, a few cents and a few percent. I never imagined that a kid would actually check the math!
Detective: A few cents from thousands of shoppers adds up surprisingly fast. Gideon Marrow, you are coming with us.
> Help the stores fix their prices -> fixit

=== fixit
scene: mall
cast: hero, mayor:happy, quill:happy
The stores reset their registers, and to thank everyone, the mall holds an honest sale for the rest of the afternoon.
Mayor: SpiderBen10, would you check one final price for me? I want this sale to be completely fair from beginning to end.
? MATH chain:sale-tax item=skateboard : The Mayor buys a skateboard for the library's new reading club. What is the total at the register?
bonus: The Mayor's skateboard total, solved in one go. The Mall Rush is over!
next: win

=== win
scene: mall
cast: hero, detective:happy, quill:happy
Every price sign in the mall is honest again, shoppers receive refunds for the extra money they paid, and the library finally collects the raffle money it was promised.
Detective: You caught the Phantom by catching the math, and I would gladly hire you any day.
Quill: Unit prices, percents, coupons, taxes and tips together make a genuine detective's toolkit.
end: win The Honest Sale

=== secret-box
scene: attic
cast: hero, quill:surprised, stranger:scared
clue: The last box hides the Phantom's notebook: every changed price, written down.
While the figure watches nervously, you open the last box and discover a notebook packed with numbers, recording every price that was changed, in every store, at every hour.
Quill: That is a confession written in mathematics, and with it, every shopper can get their money back.
> Hand the notebook to the detective -> secret-end

=== secret-end
scene: mall
cast: hero, detective:happy, stranger:sad
Using the notebook, Detective Okoro can repay every shopper, cent by cent, and even Gideon looks a little relieved that the whole thing is finally over.
Detective: A notebook full of evidence, carefully checked by a sixth grader, is a first in my career.
The mall presents you with a golden shopping bag and names the bench beside the fountain in your honor: the Unit Price Bench.
end: secret The Phantom's Notebook
