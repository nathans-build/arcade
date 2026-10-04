/*
 * Expedition 3: Westward Trail, 1846. Independence, Missouri to the Willamette Valley (Oregon
 * City), about 2,000 miles. The real route is named in readings; the game's UI never uses its
 * trademarked name.
 *
 * Mileposts are rounded "about" figures (Fort Laramie about 640 miles; Oregon City "not quite
 * 2,000"). Wagons averaged about 15 miles a day (BLM). The Barlow Road toll ($5 a wagon and
 * 10 cents a head of livestock, 1846) is sourced; other prices are game numbers.
 * Native nations appear as traders, guides and owners of the land who set their own prices.
 */
import type { Expedition } from "./types";

const OE_TRAIL = "Oregon Encyclopedia, \"Oregon Trail\", https://www.oregonencyclopedia.org/articles/oregon_trail/";
const BLM_WAGONS = "Bureau of Land Management, National Historic Oregon Trail Interpretive Center, \"Wagons\", https://www.blm.gov/learn/interpretive-centers/national-historic-oregon-trail-interpretive-center/explore/wagons";
const NPS_TRAVEL = "National Park Service, \"Traveling the Emigrant Trails\", https://www.nps.gov/articles/000/traveling-emigrant-trails.htm";
const HASTINGS = "Hastings, Lansford W. The Emigrants' Guide to Oregon and California. Cincinnati: George Conclin, 1845";
const PALMER = "Palmer, Joel. Journal of Travels over the Rocky Mountains, to the Mouth of the Columbia River. Cincinnati: J. A. & U. P. James, 1847";
const CTUIR = "Confederated Tribes of the Umatilla Indian Reservation, \"Brief History of CTUIR\", https://ctuir.org/about/brief-history-of-ctuir/";
const IDAHO_HALL = "Idaho State Historical Society, Reference Series No. 121, \"Fort Hall\", https://history.idaho.gov/wp-content/uploads/2018/12/0121.pdf";

export const WESTWARD: Expedition = {
  id: "westward",
  title: "Westward Trail",
  year: 1846,
  route: "Independence, Missouri → Willamette Valley, Oregon · about 2,000 miles",
  role: "You are part of an emigrant family of five with one wagon and six oxen.",
  recommended: [5, 12],
  start: "1846-05-10",
  historicalDays: 150,
  historicalNote: "Most 1846 companies left Missouri in early to mid May and needed four to six months; many reached the Willamette Valley in September or October.",
  deadline: [212, 198, 186],
  lateLabel: "WINTERED",
  lateText: "Snow closed the Cascade passes before your wagon got through. You spend the winter at The Dalles and finish the trip in spring.",
  party: 5,
  partyLabel: "family of 5",
  mode: "wagon",
  units: { food: "lb", parts: "wagon parts", trade: "trade goods", money: "dollars" },
  startRes: { food: 0, money: 0, parts: 0, morale: 70, trade: 0 },
  budget: [9000, 11000, 11600],
  weightLimit: 2400,
  store: [
    { id: "flour", name: "Flour", unit: "100 lb sack", price: 200, weight: 100, gives: { food: 100 }, rec: [10, 10, 10], max: 25 },
    { id: "bacon", name: "Bacon", unit: "50 lb side", price: 250, weight: 50, gives: { food: 50 }, rec: [15, 15, 15], max: 30 },
    { id: "coffee", name: "Coffee, sugar and salt", unit: "40 lb lot", price: 400, weight: 40, gives: { food: 30, morale: 1 }, rec: [4, 4, 4], max: 10 },
    { id: "parts", name: "Spare wheel, axle or tongue", unit: "part", price: 500, weight: 70, gives: { parts: 1 }, rec: [0, 3, 3], max: 6, minBand: 1 },
    { id: "clothes", name: "Boots and wool clothing", unit: "bundle", price: 400, weight: 15, gives: { morale: 3 }, rec: [0, 2, 2], max: 6, minBand: 1 },
    { id: "goods", name: "Trade goods (shirts, blankets, fishhooks)", unit: "bundle", price: 300, weight: 15, gives: { trade: 1 }, rec: [0, 0, 4], max: 10, minBand: 2 },
  ],
  paces: [
    { id: "easy", label: "Easy", note: "Let the oxen graze", speed: 0.8, morale: 1, wear: 0.02 },
    { id: "steady", label: "Steady", note: "About 15 miles a day", speed: 1, morale: 0, wear: 0.04 },
    { id: "hard", label: "Push hard", note: "Long days wear out oxen", speed: 1.25, morale: -2, wear: 0.1 },
  ],
  rations: [
    { id: "lean", label: "Lean", perPerson: 2, morale: -1 },
    { id: "steady", label: "Steady", perPerson: 2.5, morale: 0 },
    { id: "filling", label: "Filling", perPerson: 3, morale: 1 },
  ],
  resupply: {
    label: "Trade with another company",
    days: 1,
    money: 300,
    food: 100,
    text: "You stop and buy flour and bacon from a wagon company with extra. Their price is high this far from Missouri.",
    source: NPS_TRAVEL,
  },
  work: {
    label: "Work for another company",
    days: 3,
    money: 200,
    food: 150,
    text: "You stop and work for a larger wagon company, driving cattle and mending harness. They pay in flour, bacon and a few dollars.",
    source: NPS_TRAVEL,
  },
  legs: [
    { miles: 640, mpd: 16, terrain: "plains", cost: { money: 100, label: "Pappan's ferry over the Kansas River (game number)", source: "Historical Marker Database, \"Pappan's Ferry\", https://www.hmdb.org/m.asp?m=65025" } },
    { miles: 190, mpd: 15, terrain: "plains" },
    { miles: 420, mpd: 14, terrain: "mountains" },
    { miles: 600, mpd: 13, terrain: "desert" },
    { miles: 110, mpd: 8, terrain: "mountains", cost: { money: 560, label: "Barlow Road toll: $5 a wagon + 10¢ × 6 oxen (1846 rate)", source: "Oregon Encyclopedia, \"Barlow Road\", https://www.oregonencyclopedia.org/articles/barlow_road/" } },
  ],
  landmarks: [
    {
      id: "independence",
      name: "Independence",
      place: "Missouri · the jumping-off town",
      mile: 0,
      scene: "independence",
      source: OE_TRAIL + "; " + HASTINGS + "; Oregon Pioneers, \"Food on the Oregon Trail\", http://www.oregonpioneers.com/FoodChoices.htm",
      read: [
        {
          text: "Independence, Missouri, is busy every spring. Families buy flour, bacon and oxen here. Then they head west on a trail of about 2,000 miles to Oregon. A guidebook says each person needs about 200 pounds of flour. The land ahead is home to many Native nations.",
          excerpt: { quote: "At least, two hundred pounds of flour, or meal; one hundred and fifty pounds of bacon.", cite: "Lansford Hastings, The Emigrants' Guide to Oregon and California (1845)", status: "public domain" },
        },
        {
          text: "Every spring in the 1840s, Independence filled with wagons, oxen and families getting ready to go west. Most tried to leave in April or May, when new grass could feed their animals. Guidebooks told them what to pack. Lansford Hastings's 1845 guide listed food for each person: flour, bacon, coffee, sugar and salt. The trail ahead crossed the homelands of many nations, including the Kaw, Pawnee, Lakota, Shoshone and Cayuse. In 1846 the United States and Britain still both claimed the Oregon Country, and war with Mexico was just beginning.",
          excerpt: { quote: "Each emigrant should be provided with, at least, two hundred pounds of flour, or meal; one hundred and fifty pounds of bacon; ten pounds of coffee; twenty pounds of sugar; and ten pounds of salt.", cite: "Lansford Hastings, The Emigrants' Guide to Oregon and California (1845)", status: "public domain" },
          gloss: [["emigrant", "a person leaving one place to live in another"]],
        },
        {
          text: "In May 1846, Independence was the busiest jumping-off point for the overland trails. That spring was a turning point: Congress declared war on Mexico on May 13, and in June the Oregon Treaty with Britain split the Oregon Country at the 49th parallel. Families packed using guidebooks such as Lansford Hastings's Emigrants' Guide of 1845, which listed the food each person needed. Historians read Hastings with care. He was promoting settlement in California and later urged travelers to take an untested shortcut, the Hastings Cutoff, which led the Donner Party into disaster that winter. A guidebook is a primary source, but its author had a purpose. The trail itself crossed lands that belonged to Native nations, from the Kaw and Pawnee on the plains to the Shoshone, Cayuse and Nez Perce farther west.",
          excerpt: { quote: "Each emigrant should be provided with, at least, two hundred pounds of flour, or meal; one hundred and fifty pounds of bacon; ten pounds of coffee; twenty pounds of sugar; and ten pounds of salt.", cite: "Lansford Hastings, The Emigrants' Guide to Oregon and California (1845)", status: "public domain" },
        },
      ],
    },
    {
      id: "laramie",
      name: "Fort Laramie",
      place: "Wyoming · trading post on the North Platte",
      mile: 640,
      scene: "laramie",
      source: "WyoHistory.org, \"Fort Laramie\" and \"Fort John\", https://www.wyohistory.org/encyclopedia/fort-laramie; " + OE_TRAIL,
      read: [
        {
          text: "Fort Laramie is a trading post, not an army fort yet. It stands where two rivers meet. Lakota families bring buffalo robes here to trade for cloth, kettles and tools. Travelers fix their wagons, buy supplies and rest their oxen before the mountains.",
        },
        {
          text: "Fort Laramie, about 640 miles from Independence, began as a fur-trade post in 1834. By 1846 the American Fur Company ran a large adobe post here called Fort John, though most people still said Fort Laramie. It was a center of the buffalo robe trade. Lakota traders brought tanned robes and exchanged them for manufactured goods. For emigrants, the fort was a place to repair wagons, buy goods at high prices and mail letters east. It marked the end of the plains and the start of the climb toward the Rocky Mountains.",
          gloss: [["adobe", "sun-dried brick"], ["tanned", "treated to make soft leather"]],
        },
        {
          text: "When emigrants reached Fort Laramie in June 1846, they found a private trading post, not a government fort; the U.S. Army bought it only in 1849. The American Fur Company's adobe Fort John, finished in 1841, sat near the meeting of the Laramie and North Platte Rivers, about 640 miles from Independence. Its business was the buffalo robe trade with the Lakota and their allies, who traded tanned robes for cloth, kettles, guns and other goods. The growing number of wagons changed this relationship. Emigrant cattle ate the grass and travelers used up wood along the Platte, resources the Lakota relied on. In later years, Lakota leaders asked the government to pay for this damage, a claim recognized in the Fort Laramie Treaty of 1851. A trading post can be studied as a meeting place where groups depended on each other and also competed.",
        },
      ],
    },
    {
      id: "indrock",
      name: "Independence Rock",
      place: "Wyoming · the register of the desert",
      mile: 830,
      scene: "indrock",
      source: "Oregon Encyclopedia, \"Oregon Trail\"; WyoHistory.org, \"Independence Rock\", https://www.wyohistory.org/encyclopedia/independence-rock; " + NPS_TRAVEL,
      read: [
        {
          text: "Independence Rock is a huge granite rock shaped like a turtle. Travelers hoped to reach it by the Fourth of July. If they did, they were on time to cross the mountains before snow. Many people painted or carved their names on the rock.",
        },
        {
          text: "Independence Rock is a huge granite hump that covers about 25 acres beside the Sweetwater River. Fur trappers named it in the 1820s. Emigrants used it as a calendar: arriving by July 4 meant you were on schedule to cross the Blue Mountains and the Cascades before winter. So many travelers painted, scratched or carved their names on it that it was called the Great Register of the Desert. Some 1846 diaries describe families stopping here to celebrate the Fourth with songs and a picnic.",
          excerpt: { quote: "On July 3 we camped in the shadow of the rock, and on the Fourth we rested and sang patriotic songs.", cite: "Margaret M. Hecox, 1846 overland memoir (retold)", status: "retold" },
        },
        {
          text: "Independence Rock rises beside the Sweetwater River about 830 miles from Missouri. For emigrants it worked as a checkpoint on a calendar: wagons that reached it by Independence Day were on pace to cross the Cascades before the snows. The rock's surface became a register of thousands of names, which is why travelers called it the Great Register of the Desert. Today those names are themselves primary sources: they record who passed, and sometimes when. Historians also notice what the rock cannot record. It lists the people who traveled through, not the Shoshone, Lakota, Arapaho and Cheyenne people whose homelands surrounded it, and not the many travelers who could not stop to carve a name. Ahead lay South Pass, a wide, gentle saddle across the Continental Divide that let wagons cross the Rockies.",
          excerpt: { quote: "On July 3 we camped in the shadow of the rock, and on the Fourth we rested and sang patriotic songs.", cite: "Margaret M. Hecox, 1846 overland memoir (retold)", status: "retold" },
        },
      ],
    },
    {
      id: "forthall",
      name: "Fort Hall",
      place: "Idaho · Hudson's Bay Company post on the Snake River",
      mile: 1250,
      scene: "forthall",
      source: IDAHO_HALL + "; Idaho State Historical Society, Reference Series No. 184 (Salmon Falls), https://history.idaho.gov/wp-content/uploads/0184.pdf",
      read: [
        {
          text: "Fort Hall is a trading post on the Snake River. It is in the homeland of the Shoshone and Bannock people. Travelers buy flour here, but it costs a lot. Farther along the river, Shoshone families catch salmon and trade it to travelers.",
        },
        {
          text: "Fort Hall was built in 1834 and sold to Britain's Hudson's Bay Company in 1837. It stood in the homeland of the northern Shoshone and Bannock, who used the Snake River valley for fishing, gathering and trade. Supplies at the fort were expensive because everything came by pack train. West of the fort, at Salmon Falls, Shoshone families caught salmon where the fish could swim no farther upstream. Many emigrants traded clothing and other goods for dried salmon. The Shoshone set the terms of these trades.",
          gloss: [["pack train", "a line of horses or mules carrying loads"]],
        },
        {
          text: "Fort Hall, about 1,250 miles from Independence, was a British post when emigrants passed it in 1846. Nathaniel Wyeth built it in 1834 and sold it to the Hudson's Bay Company in 1837. That same June, the Oregon Treaty placed the fort inside the United States. For the northern Shoshone and Bannock, the Snake River plain was home: they fished for salmon, gathered camas root and traded along routes much older than the fort. At Salmon Falls, where salmon could ascend no higher, Shoshone fishers traded dried salmon to emigrants for clothing, blankets and tools, on terms they set. Earlier, Hudson's Bay men had warned that wagons could not get through to Oregon; since 1843, emigrants had proved them wrong. Ask how each group at Fort Hall, British traders, Shoshone families and American emigrants, might have described the same summer.",
          gloss: [["camas", "a plant with an edible bulb, an important food"]],
        },
      ],
    },
    {
      id: "dalles",
      name: "The Dalles",
      place: "Oregon · on the Columbia River near Celilo Falls",
      mile: 1850,
      scene: "dalles",
      source: "Northwest Power and Conservation Council, \"Celilo Falls\", https://www.nwcouncil.org/history/CeliloFalls/; Oregon Encyclopedia, \"Barlow Road\", https://www.oregonencyclopedia.org/articles/barlow_road/",
      read: [
        {
          text: "The Dalles is on the Columbia River. Wasco and Wishram people have run a great trading center here for thousands of years. Near Celilo Falls, fishers catch salmon. From here, the new Barlow Road goes around Mount Hood. It opened in 1846 and costs $5 a wagon.",
        },
        {
          text: "At The Dalles the Columbia River squeezes through rock channels near Celilo Falls. For thousands of years this was one of the great trading centers of North America. Wasco people on the south bank and Wishram people on the north bank hosted traders from up and down the river. Until 1846, emigrants had to float their wagons down the dangerous Columbia on rafts. That year, Sam Barlow opened a toll road around the south side of Mount Hood. The toll was five dollars a wagon and ten cents for each animal.",
          gloss: [["toll", "a fee to use a road"]],
        },
        {
          text: "The Dalles marked the end of the overland route in the trail's early years. Here the Columbia narrows through basalt channels near Celilo Falls, a fishery and trading center that Wasco and Wishram people, Upper Chinookan nations, had hosted for thousands of years. Lewis and Clark had called it a great mart of the region. A Methodist mission, Wascopam, had stood here since 1838. Emigrants faced a costly choice: hire boats or build rafts for the dangerous run down the Columbia, often paying Native pilots, or try the new Barlow Road. Sam Barlow opened the road in 1846 under a charter that let him charge five dollars a wagon and ten cents a head of livestock. In its first season about 145 wagons used it. The toll road is an early example of private business building public infrastructure, and travelers argued about whether its price was fair.",
          gloss: [["infrastructure", "roads, bridges and other shared works"], ["charter", "official permission"]],
        },
      ],
    },
    {
      id: "willamette",
      name: "Willamette Valley",
      place: "Oregon City · journey's end",
      mile: 1960,
      scene: "willamette",
      source: "Oregon Encyclopedia, \"George Bush (c. 1790–1863)\", https://www.oregonencyclopedia.org/articles/bush_george_washington_1790_1863_1790_1863_/; Historic Oregon City, \"Exclusion Laws\", https://historicoregoncity.org/2019/04/02/exclusion-laws/; " + OE_TRAIL,
      read: [
        {
          text: "You made it to Oregon City in the green Willamette Valley! This valley is the homeland of the Kalapuya people. Families here start farms. Not everyone was welcome, though. A law of 1844 told Black settlers to leave, so some Black pioneers settled farther north.",
        },
        {
          text: "Oregon City, at the falls of the Willamette River, was the end of the trail and the seat of Oregon's provisional government. The Willamette Valley is the homeland of the Kalapuya people, whose numbers had already fallen sharply from disease. In 1844 the provisional government banned slavery but also passed a law ordering Black settlers to leave. George Washington Bush, a free Black farmer who came west in 1844, settled north of the Columbia River instead, near today's Olympia, Washington. Arriving in Oregon did not mean the same thing for every family.",
          gloss: [["provisional", "temporary, until a permanent one is set up"]],
        },
        {
          text: "For emigrant families, reaching the Willamette Valley meant land claims, farms and the end of a long, exhausting road. The valley is the homeland of the Kalapuya, who had suffered devastating epidemics and would later be pressed into treaties that took most of their land. The settlers' provisional government also drew a color line. In 1844 it outlawed slavery and, in the same act, ordered free Black people to leave the territory; later laws repeated the ban, and Oregon's 1857 constitution kept it. George Washington Bush, a free Black farmer who helped lead a wagon party west in 1844, settled north of the Columbia, outside the provisional government's reach, near present-day Tumwater, Washington. To judge whether the trail was a story of opportunity, historians ask: opportunity for whom, and at whose cost?",
        },
      ],
    },
  ],
  events: [
    {
      id: "wt-storm", legs: [0, 1], title: "Prairie Thunderstorm",
      text: "A huge thunderstorm rolls over the plains at night. Lightning and hail scare the oxen, and in the morning several are gone.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Search for the oxen together", effect: { days: 1 }, outcome: "You find them two miles away, grazing in a draw." },
        { label: "Join another family's search party", effect: { days: 1, morale: 2 }, outcome: "Working together, both families find their animals by noon." },
        { label: "Go on with the oxen you have", effect: { morale: -3 }, minBand: 1, outcome: "The team is short-handed.", later: { days: 4, effect: { days: 2 }, text: "Your tired team cannot keep up. You rest them for two days." } },
      ],
    },
    {
      id: "wt-chips", legs: [0, 1], title: "No Firewood",
      text: "Along the Platte River there are almost no trees. You need fuel to cook supper.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Gather dried buffalo chips to burn", effect: { morale: 1 }, outcome: "The children collect dried dung chips. They burn hot, if a bit smelly." },
        { label: "Eat a cold supper", effect: { morale: -2 }, outcome: "Cold bacon and bread. Nobody is happy about it." },
      ],
    },
    {
      id: "wt-wheel", legs: [0, 1, 2, 3], title: "Broken Wheel",
      text: "A wheel hits a rut and several spokes snap. Dry air has also shrunk the wood, so the iron tire is loose.",
      source: BLM_WAGONS,
      choices: [
        { label: "Put on the spare wheel", effect: { parts: -1 }, needs: { parts: 1 }, outcome: "The spare goes on. You lose only an hour." },
        { label: "Soak the wheel overnight and mend it", effect: { days: 1 }, outcome: "Soaking swells the wood tight again. The mended wheel holds." },
        { label: "Tie it with rawhide and keep going", effect: { morale: -1 }, minBand: 1, outcome: "It wobbles, but it rolls.", later: { days: 6, effect: { days: 2 }, text: "The tied wheel finally gives out. Fixing it properly takes two days." } },
      ],
    },
    {
      id: "wt-lakota", legs: [1], title: "Lakota Traders",
      text: "Lakota families are camped near Fort Laramie. Their traders offer moccasins and tanned buffalo robes, which are warm in the mountains. They set the prices.",
      source: "WyoHistory.org, \"Fort John\", https://wyohistory.org/encyclopedia/fort-john",
      choices: [
        { label: "Pay $1.00 for moccasins for the children", effect: { money: -100, morale: 3 }, needs: { money: 100 }, outcome: "Soft moccasins are a relief for sore feet." },
        { label: "Trade a bundle of goods for a robe", effect: { trade: -1, morale: 4 }, needs: { trade: 1 }, minBand: 2, outcome: "The traders accept your goods. The robe will be welcome on cold nights." },
        { label: "Thank them and keep your money", effect: {}, outcome: "You move on." },
      ],
    },
    {
      id: "wt-load", legs: [1, 2], title: "Too Heavy",
      text: "The road is climbing and the oxen are tiring. Families ahead of you have left furniture beside the trail to lighten their wagons.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Leave the heavy oak chest behind", effect: { miles: 10, morale: -3 }, outcome: "It is hard to leave Grandmother's chest, but the oxen pull easier." },
        { label: "Keep everything and go slowly", effect: { days: 1 }, outcome: "You keep your things, and lose a day." },
      ],
    },
    {
      id: "wt-cutoff", legs: [2], title: "Parting of the Ways",
      text: "West of South Pass the trail splits. The Sublette Cutoff saves about 85 miles, but about 45 of them have no water. The main road swings south by Fort Bridger, where you can rest.",
      source: "WyoHistory.org, \"Parting of the Ways\", https://www.wyohistory.org/encyclopedia/parting-ways",
      choices: [
        { label: "Take the main road by Fort Bridger", effect: { morale: 2 }, outcome: "Longer, but with water and a trading post." },
        { label: "Take the Sublette Cutoff", effect: { miles: 80, morale: -6 }, outcome: "You fill every keg and drive through the night across the dry stretch.", later: { days: 4, effect: { days: 2 }, text: "The dry crossing wore out the oxen. You rest them for two days." } },
      ],
    },
    {
      id: "wt-salmon", legs: [3], title: "Salmon Falls",
      text: "At Salmon Falls on the Snake River, Shoshone families are fishing and drying salmon. Their price for 40 pounds of dried salmon is one dollar, or one bundle of trade goods.",
      source: "Idaho State Historical Society, Reference Series No. 184, https://history.idaho.gov/wp-content/uploads/0184.pdf",
      choices: [
        { label: "Pay $1.00 for 40 pounds of salmon", effect: { money: -100, food: 40 }, needs: { money: 100 }, outcome: "Fresh food at last! The salmon is rich and filling." },
        { label: "Trade goods for the salmon", effect: { trade: -1, food: 40 }, needs: { trade: 1 }, minBand: 2, outcome: "A fishing family looks over your goods and agrees to the trade." },
        { label: "Thank them and move on", effect: {}, outcome: "You keep your money and your goods." },
      ],
    },
    {
      id: "wt-guide", legs: [3], title: "A Shoshone Guide",
      text: "The Snake River plain is dry and rough. A Shoshone man who knows the country offers to show you where to find grass and water. His price is one dollar or a blanket.",
      source: IDAHO_HALL,
      choices: [
        { label: "Hire him for $1.00", effect: { money: -100, miles: 15, morale: 2 }, needs: { money: 100 }, outcome: "He leads you to good springs and saves you a long dry stretch." },
        { label: "Pay him in trade goods", effect: { trade: -1, miles: 15, morale: 2 }, needs: { trade: 1 }, minBand: 2, outcome: "He accepts the goods and leads you to water." },
        { label: "Find the way yourselves", effect: { days: 1 }, outcome: "You lose a day looking for water." },
      ],
    },
    {
      id: "wt-cayuse", legs: [3], title: "Cayuse Traders",
      text: "Near the Blue Mountains, Cayuse families are trading. They are known for fine horses, and they also sell potatoes and vegetables from their gardens. They name the price.",
      source: CTUIR,
      choices: [
        { label: "Buy potatoes and vegetables for $1.50", effect: { money: -150, food: 60, morale: 3 }, needs: { money: 150 }, outcome: "Fresh vegetables after months of bacon and bread!" },
        { label: "Trade two bundles of goods for a fresh horse", effect: { trade: -2, morale: 4, miles: 20 }, needs: { trade: 2 }, minBand: 2, outcome: "The Cayuse traders drive a hard bargain. The horse is strong and fast." },
        { label: "Thank them and keep going", effect: {}, outcome: "You save your money for the last stretch." },
      ],
    },
    {
      id: "wt-nezperce", legs: [3], title: "Nez Perce Traders",
      text: "Nez Perce traders on their way to the Columbia offer dried meat, roots and camas cakes. They are willing to trade food and horses, but on their own terms.",
      source: "University of Idaho Library, \"Fur Trade Era\", https://www.lib.uidaho.edu/mcbeth/governmentdoc/histfur.htm",
      choices: [
        { label: "Buy food for $1.20", effect: { money: -120, food: 50 }, needs: { money: 120 }, outcome: "The camas cakes are sweet and filling." },
        { label: "Trade goods for food", effect: { trade: -1, food: 50 }, needs: { trade: 1 }, minBand: 2, outcome: "The traders accept your fishhooks and a shirt." },
        { label: "Decline politely", effect: {}, outcome: "They ride on toward the river." },
      ],
    },
    {
      id: "wt-heat", legs: [2, 3], title: "Dust and Heat",
      text: "The days are hot and the dust is thick. Oxen and people are worn out by noon.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Travel at dawn and rest at midday", effect: { days: 1, morale: 2 }, outcome: "Slower, but everyone feels better." },
        { label: "Push through the heat", effect: { morale: -3 }, outcome: "You make your miles, but tempers are short." },
      ],
    },
    {
      id: "wt-oxen", legs: [1, 2, 3], title: "Strayed Oxen",
      text: "Two oxen wandered off in the night looking for grass. The family cannot move without them.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Track them through the sagebrush", effect: { days: 1 }, outcome: "You find them by a creek." },
        { label: "Pay a herder from another company to find them", effect: { money: -75 }, needs: { money: 75 }, outcome: "He brings them back before breakfast." },
      ],
    },
    {
      id: "wt-letters", legs: [0, 1, 2], title: "Letters East",
      text: "A party of traders is heading back east to Missouri. They offer to carry letters for 25 cents each.",
      source: OE_TRAIL,
      choices: [
        { label: "Send a letter home for 25¢", effect: { money: -25, morale: 4 }, needs: { money: 25 }, outcome: "You tell your family you are safe and well." },
        { label: "Save your money", effect: {}, outcome: "Maybe at the next fort." },
      ],
    },
    {
      id: "wt-fourth", legs: [1, 2], title: "The Fourth of July",
      text: "It is the Fourth of July. Families in the wagon company want to stop and celebrate with songs and a picnic.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Stop for the day and celebrate", effect: { days: 1, morale: 6 }, outcome: "Songs, a speech and a picnic. A happy day." },
        { label: "Celebrate at camp tonight", effect: { morale: 2 }, outcome: "You sing around the fire after a full day of travel." },
      ],
    },
    {
      id: "wt-sick", legs: [0, 1, 2, 3], title: "A Sick Child",
      text: "Your youngest child has a fever and a cough. She is too tired to walk beside the wagon today.",
      source: NPS_TRAVEL,
      choices: [
        { label: "Make her a bed in the wagon and go slowly", effect: { days: 1 }, outcome: "She rests in the wagon. In a few days she is well." },
        { label: "Stop for two days so she can rest", effect: { days: 2, morale: 3 }, outcome: "The rest does her good." },
      ],
    },
    {
      id: "wt-prices", legs: [3], title: "Fort Prices",
      text: "Flour at Fort Hall costs about twice what it did in Missouri. Everything here came a long way by pack train.",
      source: IDAHO_HALL,
      choices: [
        { label: "Buy 100 pounds of flour for $4.00", effect: { money: -400, food: 100 }, needs: { money: 400 }, outcome: "Expensive, but it fills the flour barrel." },
        { label: "Make do with what you have", effect: {}, outcome: "You hope your food will last." },
      ],
    },
    {
      id: "wt-laurel", legs: [4], title: "Laurel Hill",
      text: "On the Barlow Road, Laurel Hill drops down a slope so steep that wagons cannot simply drive down. Families tie ropes to their wagons and wrap them around trees to lower them.",
      source: "Historic Oregon City, \"The Final Leg of the Trail\", https://historicoregoncity.org/2019/04/02/the-final-leg-of-the-trail/; " + PALMER + " (Palmer crossed the Cascades with Barlow in 1845)",
      choices: [
        { label: "Snub the wagon with ropes around trees", effect: { days: 1, morale: -1 }, outcome: "Slowly, foot by foot, the wagon goes down safely." },
        { label: "Drag a cut tree behind as a brake", effect: { days: 1 }, outcome: "The tree drags like an anchor and slows the wagon." },
        { label: "Use your spare parts to build a stronger brake", effect: { parts: -1 }, needs: { parts: 1 }, minBand: 1, outcome: "The new brake holds. You are down by evening." },
      ],
    },
    {
      id: "wt-forage", legs: [4], title: "Hungry Oxen",
      text: "There is little grass in the thick forest along the Barlow Road. The oxen are hungry, and some of the leaves here can make cattle sick.",
      source: "Oregon Encyclopedia, \"Barlow Road\", https://www.oregonencyclopedia.org/articles/barlow_road/",
      choices: [
        { label: "Stop at a meadow and cut grass for them", effect: { days: 1 }, outcome: "The oxen eat their fill of meadow grass." },
        { label: "Share some of your flour with the oxen", effect: { food: -40 }, outcome: "Flour mixed with water keeps the team going." },
        { label: "Push on and hope for grass ahead", effect: { morale: -3 }, minBand: 1, outcome: "The oxen plod on, slow and weak.", later: { days: 3, effect: { days: 1 }, text: "The weak oxen need a full day of rest before the last climb." } },
      ],
    },
    {
      id: "wt-snow", legs: [4], title: "Snow on the Pass",
      text: "Wet snow starts falling near the top of the Barlow Road. The oxen are tired and the grass is buried.",
      source: "Oregon Encyclopedia, \"Barlow Road\", https://www.oregonencyclopedia.org/articles/barlow_road/",
      choices: [
        { label: "Hurry over the pass before it gets deeper", effect: { morale: -3 }, outcome: "Cold, wet and tired, you make it over." },
        { label: "Wait out the storm in camp", effect: { days: 2 }, outcome: "The snow stops. You go on carefully." },
      ],
    },
  ],
  transmissions: [
    { kind: "LETTER FROM MISSOURI", from: "Aunt Ruth, Independence", text: "We miss you already. The newspapers say Congress has declared war with Mexico. Write from Fort Laramie if you can." },
    { kind: "NOTE AT THE FORT", from: "A trader at Fort Laramie", text: "Wagons that reach the Sweetwater by the Fourth are in good time. Do not tarry." },
    { kind: "LETTER CARRIED WEST", from: "Your cousin in Ohio", text: "Big news! Britain and the United States have signed a treaty to divide the Oregon Country." },
    { kind: "WORD ON THE TRAIL", from: "An eastbound mountain man", text: "The new Barlow Road around Mount Hood is open this year. Save five dollars for the toll." },
    { kind: "LETTER FROM OREGON CITY", from: "Friends who came west in 1845", text: "We have a cabin ready for you. Come before the rains. The valley is green even in winter." },
  ],
  guide: {
    intro: "Next exhibit: 1846! Families packed a wagon and walked about 2,000 miles from Missouri to Oregon. You'll keep their Ledger, trade with the nations whose lands the trail crossed, and try to beat the snow.",
    outro: "You reached the Willamette Valley! Diaries, letters and guidebooks let us follow this road, and Native nations' own histories tell the rest. Let's look at your Ledger.",
  },
  motif: [[330, 1], [392, 1], [440, 1], [392, 1], [523, 2], [440, 1], [392, 1], [330, 2]],
  topic: /oregon|trail|westward|frontier|gold rush|manifest|emigra|migrat|pioneer/i,
};
