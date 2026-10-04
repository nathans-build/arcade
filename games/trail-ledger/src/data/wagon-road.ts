/*
 * Expedition 1: Wagon Road South, 1753. Bethlehem, Pennsylvania to Wachovia (Bethabara),
 * North Carolina, with the fifteen Moravian Brethren who left on October 8 and arrived on
 * November 17, 1753 (about 520 miles in about 40 days; Historic Bethabara Park).
 *
 * Leg distances are game distances that add up to the published 520-mile total; the stops are
 * real places on the route (Susquehanna and Potomac crossings, Augusta Court House / Staunton,
 * the Dan River country). Prices are game numbers in Spanish dollars, the coin most used in
 * the colonies. See docs/sources.md.
 */
import type { Expedition } from "./types";

const FRIES = "Fries, Adelaide L., ed. Records of the Moravians in North Carolina, vol. 1, 1752–1771. Raleigh: Edwards & Broughton, 1922 (diary of the journey, Oct. 8–Nov. 17, 1753)";
const NCPEDIA_GWR = "NCpedia, \"Great Wagon Road\", https://www.ncpedia.org/great-wagon-road";
const BETHABARA = "Historic Bethabara Park, \"North Carolina, a New Home\", https://historicbethabara.org/our-history/north-carolina-a-new-home/";

export const WAGON_ROAD: Expedition = {
  id: "wagon-road",
  title: "Wagon Road South",
  year: 1753,
  route: "Bethlehem, Pennsylvania → Wachovia, North Carolina · about 520 miles",
  role: "You travel with a Moravian settler party: fifteen men, one wagon and six horses.",
  recommended: [5, 8],
  start: "1753-10-08",
  historicalDays: 40,
  historicalNote: "The real party left Bethlehem on October 8 and reached the cabin on November 17, 1753.",
  deadline: [84, 80, 76],
  lateLabel: "WINTERED",
  lateText: "Winter set in before the party reached Wachovia. Snow closed the mountain road, so you spend the cold months at a farm along the way.",
  party: 15,
  partyLabel: "15 Brethren",
  mode: "wagon",
  units: { food: "lb", parts: "wagon parts", trade: "bolts of trade cloth", money: "Spanish dollars" },
  startRes: { food: 0, money: 0, parts: 0, morale: 70, trade: 0 },
  budget: [6000, 7800, 8600],
  weightLimit: 2000,
  store: [
    { id: "meal", name: "Corn meal and flour", unit: "100 lb sack", price: 150, weight: 100, gives: { food: 100 }, rec: [10, 10, 9], max: 30 },
    { id: "pork", name: "Salt pork", unit: "50 lb barrel", price: 300, weight: 55, gives: { food: 50 }, rec: [6, 6, 6], max: 16 },
    { id: "tools", name: "Axes, saws, hoes and seed", unit: "settler's kit", price: 2000, weight: 150, gives: { morale: 5 }, rec: [1, 1, 1], max: 2 },
    { id: "parts", name: "Spare wheel, axle or tongue", unit: "part", price: 400, weight: 60, gives: { parts: 1 }, rec: [0, 3, 3], max: 6, minBand: 1 },
    { id: "blankets", name: "Wool blankets", unit: "pair", price: 120, weight: 8, gives: { morale: 2 }, rec: [0, 4, 4], max: 10, minBand: 1 },
    { id: "cloth", name: "Trade cloth", unit: "bolt", price: 250, weight: 20, gives: { trade: 1 }, rec: [0, 0, 3], max: 8, minBand: 2 },
  ],
  paces: [
    { id: "easy", label: "Easy", note: "Rest the horses often", speed: 0.8, morale: 1, wear: 0.02 },
    { id: "steady", label: "Steady", note: "A normal day on the road", speed: 1, morale: 0, wear: 0.05 },
    { id: "hard", label: "Push hard", note: "Long days; tired horses", speed: 1.25, morale: -2, wear: 0.12 },
  ],
  rations: [
    { id: "lean", label: "Lean", perPerson: 1.5, morale: -1 },
    { id: "steady", label: "Steady", perPerson: 2, morale: 0 },
    { id: "filling", label: "Filling", perPerson: 2.5, morale: 1 },
  ],
  resupply: {
    label: "Buy meal and pork at a farm",
    days: 1,
    money: 200,
    food: 150,
    text: "The party stops at a farm and buys corn meal and salt pork. Prices are game numbers.",
    source: FRIES,
  },
  work: {
    label: "Help a farm family with the harvest",
    days: 3,
    money: 150,
    food: 240,
    text: "The party stops to help a farm family bring in corn and split firewood. They pay in meal, salt pork and a few coins.",
    source: FRIES,
  },
  legs: [
    { miles: 110, mpd: 16, terrain: "farms" },
    { miles: 75, mpd: 16, terrain: "river", cost: { money: 75, label: "Ferry over the Susquehanna (game number)" } },
    { miles: 130, mpd: 15, terrain: "valley", cost: { money: 50, label: "Ferry over the Potomac (game number)" } },
    { miles: 115, mpd: 12, terrain: "hills" },
    { miles: 90, mpd: 10, terrain: "forest" },
  ],
  landmarks: [
    {
      id: "bethlehem",
      name: "Bethlehem",
      place: "Pennsylvania · Moravian town on the Lehigh River",
      mile: 0,
      scene: "bethlehem",
      source: "Encyclopedia of Greater Philadelphia, \"Moravians\", https://philadelphiaencyclopedia.org/essays/moravians/; " + BETHABARA,
      read: [
        {
          text: "Bethlehem is a Moravian town in Pennsylvania. The Moravians are a church group from Europe. They bought a big piece of land in North Carolina and named it Wachovia. On October 8, 1753, fifteen men set out to start a new town there. They have one wagon and six horses. The Lenape people have lived in this valley for a very long time.",
        },
        {
          text: "Bethlehem sits on the Lehigh River, in the homeland of the Lenape people, who call it Lenapehoking. Moravians, a Protestant church from central Europe, started the town in 1741. In 1753 the church bought almost 100,000 acres in the North Carolina backcountry and named the land Wachovia. Fifteen single men, called the Brethren, were chosen for the first trip. They had to carry tools, seed and food for a winter in the woods. About thirty miles up the Lehigh, some 125 Lenape and Mohican people lived at the Moravian mission town of Gnadenhütten.",
          gloss: [["Brethren", "brothers; members of the church"], ["backcountry", "the frontier, far from the coast"]],
        },
        {
          text: "Bethlehem was founded in 1741 by the Moravian Church, a Protestant group from central Europe that ran its towns as close-knit religious communities. The town stands in Lenapehoking, the Lenape homeland. Only sixteen years earlier, in the Walking Purchase of 1737, Pennsylvania's leaders had used a disputed old deed and a staged walk by fast runners to claim about 1.2 million acres of Lenape land, and Lenape leaders protested the deal for decades. In 1753 the Moravians bought almost 100,000 acres in North Carolina from Lord Granville and called the tract Wachovia. The church planned the move with care: it chose fifteen single men with useful trades, packed one wagon pulled by six horses, and sent them south on the Great Wagon Road on October 8. As you read, ask who kept the records of this journey, and whose voices are missing from them.",
          gloss: [["deed", "a paper that says who owns land"], ["tract", "a large area of land"]],
        },
      ],
    },
    {
      id: "susquehanna",
      name: "Susquehanna River",
      place: "Pennsylvania · the great river crossing",
      mile: 110,
      scene: "susquehanna",
      source: "Susquehanna National Heritage Area, \"RiverRoots: Pontiac's War and the Paxton Boys\", https://susqnha.org/riverroots-pontiacs-war-and-the-paxton-boys/; Historical Marker Database, \"Native Nations of the Susquehanna Valley\", https://www.hmdb.org/m.asp?m=121989",
      read: [
        {
          text: "The Susquehanna is a wide river. The wagon must cross it on a ferry, a flat boat pulled across on a rope. The river is named for the Susquehannock people. In 1753 a small town of their descendants, called Conestoga, still stood nearby in Lancaster County.",
        },
        {
          text: "The Susquehanna River is about a mile wide in places, so wagons crossed on ferries: flat boats guided across by ropes and poles. The river carries the name of the Susquehannock, an Iroquoian-speaking nation that once controlled trade in this valley. By 1753 most Susquehannock families had joined other nations, but a small community of their descendants lived at Conestoga Town in Lancaster County, on land the colony had set aside for them. For travelers like the Brethren, the crossing was a slow and costly stop. Each crossing meant paying a ferry keeper.",
          gloss: [["Iroquoian", "a family of related languages, like Seneca and Oneida"], ["descendants", "children, grandchildren and later family"]],
        },
        {
          text: "The Susquehanna River is broad and shallow, and in 1753 wagons crossed it on ferries owned by colonists who charged a fee. The valley takes its name from the Susquehannock, an Iroquoian-speaking nation that had controlled trade here in the 1600s. War and disease broke up their towns, and many Susquehannock people joined the Seneca, Cayuga and Oneida. Others, together with some Seneca families, formed the Conestoga community in Lancaster County, on land the colony set aside in the early 1700s. Their position was fragile. In 1763, ten years after the Brethren passed, a mob of settlers called the Paxton Boys killed the last twenty Conestoga people living in the county, while the colony failed to protect them. Today descendants still work to tell their nation's history in their own words. The crossing reminds us that the Wagon Road ran through places that already had long histories.",
          gloss: [["fragile", "easily broken"]],
        },
      ],
    },
    {
      id: "potomac",
      name: "Potomac River",
      place: "Maryland–Virginia line · into the Valley",
      mile: 185,
      scene: "potomac",
      source: NCPEDIA_GWR + "; Wikipedia summary of the Great Wagon Road route via search excerpt (Evan Watkins Ferry), see docs/sources.md",
      read: [
        {
          text: "The party takes a ferry across the Potomac River. Now they are in Virginia. The road here follows an old trail called the Warriors' Path. Native nations made this trail. They used it to trade and travel long before wagons came.",
        },
        {
          text: "South of the Potomac River, the road turns up the Shenandoah Valley of Virginia, between the Blue Ridge and the Allegheny Mountains. This route was not new. It followed the Great Warriors' Path, a Native trail used for hunting, trade, diplomacy and war by nations such as the Haudenosaunee (Iroquois) to the north and the Catawba to the south. Colonists widened it for wagons. By the 1750s thousands of German and Scots-Irish families were moving down this road into the Valley and on toward the Carolina backcountry.",
          gloss: [["diplomacy", "talks between nations"]],
        },
        {
          text: "Crossing the Potomac put the Brethren on the busiest migration route in colonial America. NCpedia calls the Great Wagon Road the most important frontier road in the western Piedmont during the 1700s. It ran south from Pennsylvania through Winchester and the Shenandoah Valley to Roanoke and into North Carolina. Like many colonial roads, it was built on an older Native route, the Great Warriors' Path, which nations including the Haudenosaunee and the Catawba had used for trade, diplomacy and war. The Wagon Road shows the pattern of continuity and change: an old corridor, used for new purposes by new people. Each wave of families who came down it, German, Scots-Irish and English, pressed further onto land that Native nations still claimed, which helped set up conflicts in the decades to come.",
          gloss: [["corridor", "a long path or strip of land used for travel"]],
        },
      ],
    },
    {
      id: "augusta",
      name: "Augusta Court House",
      place: "Virginia · today's Staunton, in the Shenandoah Valley",
      mile: 315,
      scene: "augusta",
      source: FRIES + "; Walking Through Salem, \"The Great Philadelphia Wagon Road\" (quoting the 1753 diary), http://walkingthroughsalem.blogspot.com/2010/12/great-philadelphia-wagon-road.html",
      read: [
        {
          text: "Augusta Court House is a small town in the valley. Farm families here sell flour and hay. The Brethren wrote that the good road ended near Augusta. South of here, the way gets steep and rough, and the horses must work much harder.",
          excerpt: { quote: "The good road ended at Augusta.", cite: "1753 journey diary, retold from Fries (1922)", status: "retold" },
        },
        {
          text: "Augusta Court House (today's Staunton, Virginia) was the center of a county full of new farms. The Brethren could buy flour, meal and hay from Valley farmers, many of whom spoke German, as the Moravians did. The diary of the journey notes that the good road ended at Augusta. Past this point, the trail climbed over ridges and crossed many creeks. The travelers often had to walk beside the wagon and help the horses on the hills. Planning ahead mattered: food bought here had to last through the hardest part of the trip.",
          excerpt: { quote: "The good road ended at Augusta.", cite: "1753 journey diary, retold from Fries (1922)", status: "retold" },
        },
        {
          text: "Augusta Court House, now Staunton, was the seat of a huge frontier county that in 1753 stretched far to the west. The Shenandoah Valley's farms, many run by German-speaking and Scots-Irish families, sold grain and livestock to the steady stream of travelers heading south. The Moravian diary of the journey records that the good road ended at Augusta. Beyond it, the Brethren faced ridges, creek crossings and a track that was often too narrow for a wagon. A diary like this one is a primary source, but it was written in German by one traveler and later translated and shortened. Historians ask what the writer chose to record, what he left out, and how a translation might change the meaning. Notice that the line here is retold, not quoted: the exact words depend on the translation.",
          excerpt: { quote: "The good road ended at Augusta.", cite: "1753 journey diary, retold from Fries (1922)", status: "retold" },
        },
      ],
    },
    {
      id: "dan",
      name: "Dan River",
      place: "Virginia–North Carolina border country",
      mile: 430,
      scene: "dan",
      source: "NCpedia, \"Indian Trading Paths\", https://www.ncpedia.org/indian-trading-paths; " + FRIES + " (Spangenberg's 1752 survey diary)",
      read: [
        {
          text: "The party reaches the Dan River near North Carolina. Catawba and Cherokee people travel and trade in this land. The year before, Bishop Spangenberg's survey team met Cherokee hunters here. At first they were tense, but they soon became friendly.",
          excerpt: { quote: "Six Cherokees out hunting stopped the surveyors, but they soon became very friendly.", cite: "Spangenberg's 1752 diary, retold from Fries (1922)", status: "retold" },
        },
        {
          text: "The Dan River country lies along the border of Virginia and North Carolina. To the south, the Trading Path linked colonial Virginia with the towns of the Catawba Nation, who traded deerskins for cloth, knives, kettles and guns. To the west, the Cherokee Nation held the mountains and hunted across the Piedmont. When Bishop August Spangenberg surveyed Wachovia in 1752, a group of Cherokee hunters stopped his party. The meeting was tense at first, but it ended in friendship. The Moravians knew their new land was part of a larger Native world.",
          excerpt: { quote: "Six Cherokees out hunting stopped the surveyors, but they soon became very friendly.", cite: "Spangenberg's 1752 diary, retold from Fries (1922)", status: "retold" },
          gloss: [["Piedmont", "the rolling land between the coast and the mountains"]],
        },
        {
          text: "By the 1750s the Dan River country sat between two powerful Native nations. The Catawba, whose towns lay on the Catawba River to the south, were key partners in the deerskin trade; the Trading Path carried their deerskins north and colonial goods south, and it met the Wagon Road at the Trading Ford on the Yadkin River. The Cherokee Nation, with towns in the southern Appalachians, hunted across the Piedmont. When Bishop Spangenberg surveyed the Wachovia tract in 1752, his party was stopped by Cherokee hunters, and the encounter turned friendly. Colonists often described such lands as empty wilderness. Spangenberg's own diary shows otherwise: the Moravians were buying land that Native nations used and claimed. Both nations would soon face war, disease and pressure from the very settlers this road carried.",
          excerpt: { quote: "Six Cherokees out hunting stopped the surveyors, but they soon became very friendly.", cite: "Spangenberg's 1752 diary, retold from Fries (1922)", status: "retold" },
        },
      ],
    },
    {
      id: "bethabara",
      name: "Bethabara",
      place: "Wachovia, North Carolina · journey's end",
      mile: 520,
      scene: "bethabara",
      source: BETHABARA + "; NCpedia, \"Hans Wagner's cabin\", https://www.ncpedia.org/media/hans-wagners-cabin; Historic Bethabara Park, \"The Stories of Bethabara's Enslaved\", https://historicbethabara.org/the-stories-of-bethabaras-enslaved/",
      read: [
        {
          text: "On November 17, 1753, the Brethren reach an empty log cabin built by a hunter named Hans Wagner. They cut a road for the last two and a half miles. That night they hold a lovefeast, a simple meal of thanks. Their town will be called Bethabara.",
          excerpt: { quote: "The wolves howled loudly, but all was well with us.", cite: "Bethabara Diary, Nov. 17, 1753, in Fries (1922)", status: "public domain" },
        },
        {
          text: "The Brethren reached the edge of Wachovia on the afternoon of November 17, 1753. There was no road for the last two and a half miles, so they cut one to an abandoned cabin built by a hunter named Hans Wagner. That night they held a lovefeast, a Moravian service with a simple shared meal. The settlement they began was named Bethabara, meaning house of passage. Within a few years it had a mill, a pottery, a doctor and a store that drew customers from far away.",
          excerpt: { quote: "While we held our lovefeast the wolves howled loudly, but all was well with us.", cite: "Bethabara Diary, Nov. 17, 1753, in Fries (1922)", status: "public domain" },
          gloss: [["lovefeast", "a Moravian service with a simple shared meal"]],
        },
        {
          text: "Eleven of the fifteen Brethren stayed to build Bethabara, the first Moravian settlement in Wachovia. The diary of their first night describes a lovefeast in Hans Wagner's empty cabin while wolves howled outside, a scene later Moravian writers retold often. Bethabara grew quickly into a trading center, and later Salem became the main town of Wachovia. The Moravian records also show a harder history. In 1763 a Bethabara tavern keeper hired an enslaved woman named Franke, and in 1769 the church purchased its first enslaved person in Wachovia, a young man called Sam. Historians at Historic Bethabara Park now tell these stories alongside the founding story. A community's records can show both its ideals and the ways it fell short of them.",
          excerpt: { quote: "While we held our lovefeast the wolves howled loudly, but all was well with us, and our hearts were full of thanksgiving.", cite: "Bethabara Diary, Nov. 17, 1753, trans. in Fries (1922)", status: "public domain" },
        },
      ],
    },
  ],
  events: [
    {
      id: "wr-mud", legs: [0, 1, 2], title: "Autumn Rain",
      text: "Cold rain turns the road into deep mud. On a long hill the wagon sinks to its hubs, and the horses slip and strain.",
      source: FRIES,
      choices: [
        { label: "Everyone pushes while all six horses pull", effect: { days: 1, morale: -2 }, outcome: "It takes the whole day, but the wagon climbs the hill." },
        { label: "Wait for the road to drain", effect: { days: 2, morale: 1 }, outcome: "The rain stops. Two days later the road is firm again." },
        { label: "Cut brush and lay it under the wheels", effect: { days: 1, morale: 1 }, minBand: 1, outcome: "The brush gives the wheels a grip. Slow work, but no one is hurt." },
      ],
    },
    {
      id: "wr-hill", legs: [3, 4], title: "A Steep Ridge",
      text: "South of Augusta the road climbs a steep ridge. Going down the far side is even harder. A heavy wagon could run into the horses.",
      source: FRIES + "; Salem Academy and College, \"The Route\", https://journey.salem.edu/history-blog/the-route/",
      choices: [
        { label: "Lock a wheel with a chain and go down slowly", effect: { days: 1 }, outcome: "The locked wheel drags like a brake. The wagon reaches the bottom safely." },
        { label: "Carry half the load down by hand", effect: { days: 2, morale: -2 }, outcome: "Two trips on foot, but the light wagon is easy to control." },
        { label: "Hire a farmer's extra team to help", effect: { money: -100 }, needs: { money: 100 }, minBand: 1, outcome: "Eight horses make short work of the ridge.", later: { days: 6, effect: { morale: 3 }, text: "The farmer you paid sent word ahead; a family down the road gives you a warm welcome." } },
      ],
    },
    {
      id: "wr-axle", legs: [1, 2, 3], title: "Broken Axle",
      text: "Crack! The wagon lurches. A rock in the road has split the rear axle. Nobody is hurt, but the wagon cannot move.",
      source: FRIES,
      choices: [
        { label: "Put in the spare axle", effect: { parts: -1, days: 0 }, needs: { parts: 1 }, outcome: "The spare fits. You lose only an afternoon." },
        { label: "Cut a new axle from a hickory tree", effect: { days: 2, morale: -1 }, outcome: "Two days of chopping and shaping, but the new axle is strong." },
        { label: "Pay a blacksmith at the next farm", effect: { days: 1, money: -150 }, needs: { money: 150 }, outcome: "The smith fixes the axle with iron bands." },
      ],
    },
    {
      id: "wr-lenape", legs: [0], title: "Travelers on the Lehigh",
      text: "Near the Lehigh River you meet a Lenape family walking to Gnadenhütten, the mission town where Lenape and Mohican families live. They know every creek and path in this valley.",
      source: "Encyclopedia of Greater Philadelphia, \"Moravians\" and \"Lenape People (Continuing Presence)\", https://philadelphiaencyclopedia.org/essays/lenape-people-continuing-presence/",
      choices: [
        { label: "Ask them about the best road south", effect: { morale: 2, miles: 8 }, outcome: "They point out a dry way around a marsh that saves you hours." },
        { label: "Trade a bolt of cloth for dried corn", effect: { trade: -1, food: 60 }, needs: { trade: 1 }, minBand: 2, outcome: "They set a fair rate: one bolt of cloth for a large basket of dried corn." },
        { label: "Share news and keep going", effect: { morale: 1 }, outcome: "You trade news of Bethlehem for news of the mission town." },
      ],
    },
    {
      id: "wr-lame", legs: [1, 2, 3], title: "A Lame Horse",
      text: "One of the six horses is limping. A stone is lodged in its hoof, and the leg is sore.",
      source: FRIES,
      choices: [
        { label: "Rest the horse for a day", effect: { days: 1 }, outcome: "After a day of rest, the horse walks well again." },
        { label: "Lighten the load; the men walk more", effect: { morale: -3 }, outcome: "Everyone walks. Tired feet, but no lost time." },
        { label: "Buy a fresh horse at a farm", effect: { money: -600, morale: 2 }, needs: { money: 600 }, minBand: 1, outcome: "A strong horse joins the team. It was costly." },
      ],
    },
    {
      id: "wr-valley", legs: [2], title: "Valley Farms",
      text: "The Shenandoah Valley is full of new farms. A German-speaking farm family offers to sell flour, or to trade food for a day of work.",
      source: NCPEDIA_GWR,
      choices: [
        { label: "Buy 100 pounds of flour", effect: { money: -200, food: 100 }, needs: { money: 200 }, outcome: "You load a full sack into the wagon." },
        { label: "Work a day for food", effect: { days: 1, food: 90 }, outcome: "The Brethren split rails and get flour and apples in return." },
        { label: "Thank them and keep moving", effect: {}, outcome: "You keep your coins and your time." },
      ],
    },
    {
      id: "wr-sunday", legs: [0, 1, 2, 3, 4], title: "Sunday",
      text: "It is Sunday. The Brethren usually rest and worship together on Sundays, even on a journey.",
      source: FRIES,
      choices: [
        { label: "Rest and hold worship", effect: { days: 1, morale: 5 }, outcome: "Hymns and rest. Everyone feels stronger for the week ahead." },
        { label: "Travel, with a short service at night", effect: { morale: -1 }, outcome: "You keep moving and gather to sing after supper." },
      ],
    },
    {
      id: "wr-frost", legs: [2, 3, 4], title: "First Frost",
      text: "You wake to frost on the blankets. The nights are getting colder, and the mountains are still ahead.",
      source: FRIES,
      choices: [
        { label: "Buy extra blankets at a farm", effect: { money: -240, morale: 4 }, needs: { money: 240 }, outcome: "Warm wool for everyone." },
        { label: "Build bigger fires and sleep close", effect: { morale: -2 }, outcome: "A smoky, chilly night, but you keep your money." },
        { label: "Push on; the cold will pass", effect: { morale: -3 }, minBand: 2, outcome: "Nobody complains out loud.", later: { days: 5, effect: { days: 2 }, text: "Two of the Brethren catch bad colds and must rest in the wagon. You stop for two days." } },
      ],
    },
    {
      id: "wr-fever", legs: [1, 2, 3, 4], title: "A Fever",
      text: "One of the Brethren wakes with a fever. He is weak and cannot walk far today.",
      source: FRIES,
      choices: [
        { label: "Let him rest in the wagon and go slowly", effect: { days: 1 }, outcome: "He rests in the wagon. The fever breaks in a few days." },
        { label: "Stop for two days so he can rest", effect: { days: 2, morale: 3 }, outcome: "The rest helps. He thanks everyone for waiting." },
      ],
    },
    {
      id: "wr-stray", legs: [0, 1, 2, 3], title: "Horses Missing",
      text: "In the morning two horses are gone. They pulled loose in the night to look for grass.",
      source: FRIES,
      choices: [
        { label: "Search the woods all morning", effect: { days: 1 }, outcome: "You find them grazing by a creek." },
        { label: "Pay a local boy who knows the woods", effect: { money: -50 }, needs: { money: 50 }, outcome: "He finds them in an hour. Well worth it." },
      ],
    },
    {
      id: "wr-catawba", legs: [4], title: "Catawba Traders",
      text: "On the Trading Path near the Dan River, Catawba traders are carrying deerskins north. They also have corn. Their price is firm: one bolt of cloth, or a dollar and a half in coin, for two bushels.",
      source: "NCpedia, \"Indian Trading Paths\", https://www.ncpedia.org/indian-trading-paths; South Carolina Encyclopedia, \"Deerskin trade\", https://www.scencyclopedia.org/sce/entries/deerskin-trade/",
      choices: [
        { label: "Pay $1.50 in coin for two bushels of corn", effect: { money: -150, food: 110 }, needs: { money: 150 }, outcome: "The traders count the coins and help you load the corn." },
        { label: "Trade one bolt of cloth for the corn", effect: { trade: -1, food: 110 }, needs: { trade: 1 }, minBand: 2, outcome: "The traders check the cloth closely, then agree." },
        { label: "Thank them and move on", effect: {}, outcome: "They wish you a safe road and head north." },
      ],
    },
    {
      id: "wr-cherokee", legs: [3, 4], title: "Cherokee Hunters",
      text: "A party of Cherokee hunters is camped by a creek, far from their mountain towns. They have hunted this country for generations. They watch the wagon carefully.",
      source: FRIES + " (Spangenberg's 1752 diary records surveyors meeting Cherokee hunters)",
      choices: [
        { label: "Greet them and ask where to find good water", effect: { morale: 2, miles: 6 }, outcome: "They point to a spring and a shorter way over the next ridge." },
        { label: "Offer cloth as a gift of friendship", effect: { trade: -1, morale: 4 }, needs: { trade: 1 }, minBand: 2, outcome: "They accept, and share news about the road ahead.", later: { days: 4, effect: { miles: 10 }, text: "Following the hunters' advice, you avoid a washed-out creek bed." } },
        { label: "Nod and keep the wagon moving", effect: {}, outcome: "You pass by quietly." },
      ],
    },
    {
      id: "wr-cut", legs: [4], title: "The Road Runs Out",
      text: "The track gets fainter until it is barely a path. To bring the wagon through, someone has to cut a road.",
      source: BETHABARA,
      choices: [
        { label: "Take up axes and cut a road", effect: { days: 2, morale: 2 }, outcome: "Axes ring all day. Slowly, a road appears behind you." },
        { label: "Scout for an old hunters' trail first", effect: { days: 1 }, outcome: "The scouts find an old trail that needs only a little clearing." },
      ],
    },
    {
      id: "wr-letters", legs: [1, 2, 3], title: "A Rider Going North",
      text: "A rider heading north to Pennsylvania stops at your camp. He offers to carry letters back toward Bethlehem.",
      source: FRIES,
      choices: [
        { label: "Write letters tonight", effect: { morale: 3 }, outcome: "Everyone writes a few lines home. Spirits lift." },
        { label: "Keep moving; letters can wait", effect: {}, outcome: "The rider goes on without your letters." },
      ],
    },
    {
      id: "wr-ordinary", legs: [1, 2], title: "A Roadside Ordinary",
      text: "You pass an ordinary, an inn where travelers can buy hay and a hot meal. Its prices are high because so many wagons come this way.",
      source: NCPEDIA_GWR,
      choices: [
        { label: "Buy hay for the horses", effect: { money: -80, morale: 2 }, needs: { money: 80 }, outcome: "The horses eat well tonight." },
        { label: "Let the horses graze along the road", effect: { days: 1 }, outcome: "Grazing takes time, but costs nothing." },
      ],
    },
    {
      id: "wr-families", legs: [2, 3], title: "Families on the Road",
      text: "A line of Scots-Irish family wagons is heading south too, looking for land in the Carolina backcountry. Their leader suggests traveling together for a few days.",
      source: NCPEDIA_GWR,
      choices: [
        { label: "Travel together and share the work", effect: { morale: 3 }, outcome: "More hands at every hill. The days go faster." },
        { label: "Go ahead at your own pace", effect: { miles: 5 }, outcome: "You pull ahead of the slower group." },
        { label: "Help repair one of their wagons", effect: { days: 1, morale: 2 }, minBand: 1, outcome: "You lose a day but gain friends.", later: { days: 5, effect: { food: 60 }, text: "The family you helped catches up and shares a sack of meal." } },
      ],
    },
  ],
  transmissions: [
    { kind: "LETTER FROM BETHLEHEM", from: "The Elders at Bethlehem", text: "Dear Brethren, we pray for you every evening. Count your supplies with care and write when a rider can carry it." },
    { kind: "COURIER'S NOTE", from: "A rider on the Wagon Road", text: "News from the Valley: the farms ahead have a good harvest, but the creeks are high with autumn rain." },
    { kind: "LETTER FROM BETHLEHEM", from: "Bishop Spangenberg's office", text: "Remember the land is wide and the winter is near. Keep to the road the surveyors marked last year." },
    { kind: "COURIER'S NOTE", from: "A trader heading north", text: "The ridges south of here are steep. Rest your horses before the Dan River country." },
    { kind: "LETTER FROM BETHLEHEM", from: "The Elders at Bethlehem", text: "When you reach Wachovia, keep a diary, so those who come after you will know the way." },
  ],
  guide: {
    intro: "Welcome to the Trail Ledger gallery! I'm your museum guide. This exhibit is a real diary: in 1753, fifteen Moravian men walked a wagon 520 miles from Pennsylvania to North Carolina. You'll travel with them and keep the Ledger.",
    outro: "You made it to Wachovia! The Moravians' records, kept for more than 250 years, are why we can tell this story today. Let's look at your Ledger.",
  },
  motif: [[392, 2], [440, 1], [494, 1], [523, 2], [494, 1], [440, 1], [392, 3]],
  topic: /wagon road|moravian|backcountry|piedmont|catawba|cherokee|appalachian|migrat|settler/i,
};
