import type { Case } from "@/game/types";

/*
 * Case 2: Gold and Salt. Ghana (Koumbi Saleh) -> Niani -> Cairo -> Timbuktu -> Taghaza -> Catalan Atlas.
 * Fact correction: the plan had Taghaza second, but Taghaza is first named about 1275 and its famous
 * description is Ibn Battuta's of 1352, so the bead sits in 1352 (date order).
 */
export const GOLD: Case = {
  id: "gold",
  n: 2,
  title: "Gold and Salt",
  thread: "gold and salt",
  grades: ["5", "6", "8", "9", "10", "11", "12"],
  color: "#ffd23f",
  brief: {
    b5: "Knot tangled the GOLD AND SALT thread! West Africa had gold; the Sahara had salt. Follow the gold until it shows up on a map in Europe.",
    b68: "Knot tangled the GOLD AND SALT thread! Follow West African gold from Ghana and Mali across the Sahara, to Cairo and onto a famous European map.",
    b912: "Knot snarled the GOLD AND SALT thread. Follow trans-Saharan trade from Ghana to Mali's height, weigh a debate about Mansa Musa's gold, and see how Europe came to picture Mali.",
  },
  woven: "Gold from West Africa and salt from the Sahara built Ghana and Mali; Mansa Musa's pilgrimage made Mali famous from Cairo to Majorca.",
  beads: [
    {
      id: "gold-koumbi",
      place: "koumbi",
      year: 1068,
      era: "1068",
      title: "Ghana's twin towns",
      scene: "market",
      bands: ["b5", "b68", "b912"],
      what: "al-Bakri's description of Ghana",
      sources: ["wiki-ghanaempire", "wiki-koumbisaleh", "lumen-ghana"],
      fact: {
        b5: "The kings of Ghana grew rich from the gold trade. (This old Ghana was north of today's Ghana!) In 1068 a writer said its capital had two towns.",
        b68: "In 1068 the scholar al-Bakri described Ghana's capital: a king's town and a Muslim merchants' town about 10 km apart. Gold from the south was traded for salt from the north.",
        b912: "Al-Bakri (1068), writing in al-Andalus from travelers' reports, described Ghana's twin-town capital, probably Koumbi Saleh, and a king who taxed the salt and gold that passed through.",
      },
    },
    {
      id: "gold-niani",
      place: "niani",
      year: 1235,
      era: "c. 1235",
      title: "Sundiata founds Mali",
      scene: "court",
      bands: ["b68", "b912"],
      what: "Sundiata founding Mali",
      sources: ["brit-niani", "brit-sundiata", "whe-mali"],
      fact: {
        b68: "Around 1235 Sundiata Keita founded the Mali Empire. Oral history says his capital was Niani, near the upper Niger; historians still debate where it really was.",
        b912: "After the battle of Kirina (c. 1235) Sundiata Keita founded Mali. Griots' oral epics keep his story. The capital's site is debated: Niani is one candidate, partly promoted by colonial-era scholars.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A griot's song: a lion-king rose by the upper Niger in the 1230s.'",
          b912: "Plaque: a kora string and a note: 'Epic of a ruler who united the Mande clans, c. 1235, near the Niger's gold fields.'",
        },
        witnesses: [
          {
            who: "Salt trader",
            look: "merchant",
            kind: "where",
            text: {
              b68: "Power is moving south, to the Mande lands on the upper Niger River, close to the gold fields.",
              b912: "The new power rises south of Ghana, in Mande country on the upper Niger, near the Bambuk and Bure gold fields.",
            },
          },
          {
            who: "Griot",
            look: "elder",
            kind: "when",
            text: {
              b68: "Our songs tell of Sundiata, who built a new empire about 170 years after al-Bakri wrote.",
              b912: "Count about 170 years after al-Bakri: Sundiata defeats the Sosso king and founds Mali, around 1235.",
            },
          },
        ],
        herring: { who: "Potter", look: "farmer", text: "This clay pot keeps water cool, even at noon.", note: "Useful, but not a clue." },
        unreliable: {
          who: "Foreign visitor",
          look: "envoy",
          text: "Mali's new capital is on the Atlantic coast. I'm sure of it, though I've never been.",
          note: "He admits he never went. The griot and the trader agree: inland, on the upper Niger.",
        },
        wrongPlaces: [
          { place: "djenne", kind: "near", why: "Djenné is a great Niger trading town, but Sundiata's royal capital lay farther up the river." },
          { place: "gao", kind: "place", why: "In the 1230s Gao is the Songhay capital, not Mali's royal city." },
          { place: "marrakesh", kind: "place", why: "Marrakesh is the Almohad capital, north of the Sahara. Mali rises far to the south." },
        ],
        wrongEras: [
          { era: "c. 500", year: 500, why: "In 500 there is no Mali Empire. Its founder comes about 700 years later." },
          { era: "1650s", year: 1650, why: "By the 1600s Mali had shrunk to a small kingdom. Too late!" },
        ],
      },
    },
    {
      id: "gold-cairo",
      place: "cairo",
      year: 1324,
      era: "1324",
      title: "Mansa Musa in Cairo",
      scene: "market",
      bands: ["b5", "b68", "b912"],
      what: "Mansa Musa's visit to Cairo",
      sources: ["whc-umari", "schultz-musa", "wiki-mansamusa"],
      fact: {
        b5: "In 1324 Mansa Musa of Mali passed through Cairo on his way to Mecca. He gave away lots of gold.",
        b68: "In 1324 Mansa Musa crossed Cairo on hajj (pilgrimage) to Mecca with a huge caravan. Al-Umari later reported his gifts made gold lose value there. Historians debate how much.",
        b912: "Al-Umari, who reached Cairo about 12 years later, reported that Musa's spending lowered gold's value for years. Historians such as Warren Schultz find some support, but the size of the effect is debated.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'A gold coin spent by the Nile in 1324.'",
          b68: "Plaque: 'A gold dinar, spent in the Mamluk capital on the Nile, 1324.'",
          b912: "Plaque: a Mamluk-era coin and a note: 'Gold weighed where the Nile fans into its delta, 1324.'",
        },
        witnesses: [
          {
            who: "Pilgrim",
            look: "pilgrim",
            kind: "where",
            text: {
              b5: "Our king goes to Mecca, through Egypt's big city.",
              b68: "Mansa Musa's pilgrims cross the Sahara east to Egypt's great city on the Nile, then on to Mecca.",
              b912: "The hajj caravan follows the Sahara routes east to the Mamluk sultan's capital at the head of the Nile delta, then to Mecca.",
            },
          },
          {
            who: "Royal scribe",
            look: "scribe",
            kind: "when",
            text: {
              b5: "He goes in 1324. Look in the 1300s.",
              b68: "Musa makes his pilgrimage in 1324, about 90 years after Sundiata founded Mali.",
              b912: "Cairo's scholars date the visit to the year 724 of the Islamic calendar, which is 1324 CE.",
            },
          },
        ],
        herring: { who: "Weaver", look: "weaver", text: "My cotton cloth is dyed with indigo. Pretty, isn't it?", note: "Pretty, but not a clue." },
        unreliable: {
          who: "Gossip",
          look: "storyteller",
          text: "Musa's caravan had a million camels, every one made of solid gold!",
          note: "Exaggeration. Sources mention thousands of people and lots of gold, but stories grow with retelling.",
        },
        wrongPlaces: [
          { place: "alexandria", kind: "near", why: "Alexandria is Egypt's port, but the sultan's court and Musa's famous stay were in Cairo." },
          { place: "damascus", kind: "place", why: "Damascus is a Mamluk city too, but Musa's road to Mecca went through Cairo." },
          { place: "venice", kind: "place", why: "Venice buys African gold through middlemen, but Musa never came to Europe." },
        ],
        wrongEras: [
          { era: "c. 800", year: 800, why: "In 800 Mali doesn't exist yet. Ghana runs the gold trade." },
          { era: "1850s", year: 1850, why: "By the 1850s Mali's empire was long gone. Too late!" },
        ],
      },
    },
    {
      id: "gold-timbuktu",
      place: "timbuktu",
      year: 1327,
      era: "1327",
      title: "Timbuktu's great mosque",
      scene: "library",
      bands: ["b5", "b68", "b912"],
      what: "the Djinguereber Mosque",
      sources: ["wiki-djinguereber", "whe-djinguereber", "wiki-timbuktu-univ"],
      fact: {
        b5: "Back home, Mansa Musa built the Djinguereber Mosque in Timbuktu (1327). Timbuktu became a city of scholars and books.",
        b68: "Returning from Mecca, Musa brought scholars, including the architect Abu Ishaq al-Sahili. The Djinguereber Mosque (finished 1327) helped make Timbuktu a center of learning.",
        b912: "Musa's return brought scholars such as al-Sahili of al-Andalus. The Djinguereber Mosque (1327) joined Sankore in Timbuktu's scholarly network; its manuscripts on law, astronomy and medicine survive today.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'A mud-brick mosque at the desert's edge.'",
          b68: "Plaque: 'Mud brick and palm wood. A mosque by the Niger bend, finished 1327.'",
          b912: "Plaque: a manuscript page: 'Copied in a desert-edge city at the Niger's northern bend, where camels met canoes.'",
        },
        witnesses: [
          {
            who: "Canoe trader",
            look: "sailor",
            kind: "where",
            text: {
              b5: "Go home to Mali, to the city at the Niger's bend.",
              b68: "Musa heads home to Mali and builds in the trading city at the northern bend of the Niger River.",
              b912: "Back across the Sahara to the Niger's northern bend, where camel caravans meet river canoes: Musa will build there.",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b5: "Just 3 years after Cairo, a big mosque is done.",
              b68: "Only about three years after the pilgrimage, a great mosque is finished there.",
              b912: "Within three years of the hajj, Musa's architect from al-Andalus finishes the work, in 1327.",
            },
          },
        ],
        herring: { who: "Cairo baker", look: "worker", text: "Since that big caravan came, my flour costs more!", note: "Interesting about Cairo's prices, but not where the thread goes." },
        unreliable: {
          who: "Rival merchant",
          look: "merchant",
          text: "Musa will stay in Mecca forever. He'll never go home to Mali.",
          note: "Wrong: Musa went home. The other witnesses agree on the Niger bend.",
        },
        wrongPlaces: [
          { place: "djenne", kind: "near", why: "Djenné's famous Great Mosque is a different building. Musa's 1327 mosque is in Timbuktu." },
          { place: "mecca", kind: "place", why: "Musa prayed in Mecca, but by 1327 he is home in Mali, building." },
          { place: "fez", kind: "place", why: "Fez has great schools in 1327, but that's Morocco. Musa built in Mali." },
        ],
        wrongEras: [
          { era: "c. 1100", year: 1100, why: "Around 1100 Timbuktu is just a young seasonal camp, and Mali doesn't rule here." },
          { era: "1950s", year: 1950, why: "By the 1950s the mosque was over 600 years old. Too late!" },
        ],
      },
    },
    {
      id: "gold-taghaza",
      place: "taghaza",
      year: 1352,
      era: "1352",
      title: "The salt mines of Taghaza",
      scene: "desert",
      sensitive: true,
      bands: ["b912"],
      what: "Ibn Battuta's visit to Taghaza",
      sources: ["wiki-taghaza", "orias-mali", "medslavery-ib"],
      fact: {
        b912: "In 1352 Ibn Battuta crossed Taghaza, a Saharan salt-mining village whose houses and mosque were built of salt slabs. He wrote that enslaved workers dug the salt, which was carried south and traded for gold.",
      },
      find: {
        plaque: {
          b912: "Plaque: a cracked slab of rock salt, half a camel load, and a note: 'Deep Sahara, about 25 years after the mosque.'",
        },
        witnesses: [
          {
            who: "Salt merchant",
            look: "merchant",
            kind: "where",
            text: {
              b912: "Our salt comes from mines deep in the desert, north of Timbuktu, halfway to Sijilmasa, where even houses are made of salt.",
            },
          },
          {
            who: "Caravan guide",
            look: "rider",
            kind: "when",
            text: {
              b912: "A traveler from Tangier crosses the mines in 1352, going south to visit Mansa Sulayman, Musa's brother.",
            },
          },
        ],
        unreliable: {
          who: "Stranger",
          look: "citizen",
          text: "Nobody mines salt in the Sahara. All salt here arrives by ship from the sea.",
          note: "Contradicted by an eyewitness (Ibn Battuta) and by the salt slabs themselves.",
        },
        wrongPlaces: [
          { place: "sijilmasa", kind: "near", why: "Sijilmasa is the caravan town at the north end of the route. It trades salt; the mines are far south." },
          { place: "gao", kind: "place", why: "Gao is a Niger river city that buys salt. It doesn't mine it." },
          { place: "marrakesh", kind: "place", why: "Marrakesh is a royal city in Morocco, not a salt mine." },
        ],
        wrongEras: [
          { era: "c. 500 BCE", year: -500, why: "No record of a mining village here then. Taghaza is first named around 1275." },
          { era: "1600s", year: 1600, why: "After a Moroccan attack in 1586, miners moved to Taoudenni. Taghaza was being abandoned." },
        ],
      },
    },
    {
      id: "gold-atlas",
      place: "palma",
      year: 1375,
      era: "1375",
      title: "The Catalan Atlas",
      scene: "library",
      bands: ["b5", "b68", "b912"],
      what: "the Catalan Atlas",
      sources: ["bl-africankings", "smarthistory-catalan", "carleton-catalan"],
      fact: {
        b5: "In 1375 a mapmaker on the island of Majorca drew Mansa Musa holding gold on a famous map.",
        b68: "The Catalan Atlas (1375), made on Majorca by Cresques Abraham, a Jewish mapmaker, shows Mansa Musa holding gold: proof that Europe had heard of Mali's wealth.",
        b912: "Cresques Abraham's Catalan Atlas (1375) pictured 'Musse Melly,' lord of a land of gold, crowned on a throne. European mapmakers knew Mali through North African and Jewish trade networks.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'Drawn on an island in the sea, 1375.'",
          b68: "Plaque: 'Ink and gold leaf on calfskin, from a Mediterranean island, 1375.'",
          b912: "Plaque: a compass rose and a note: 'Made in the Balearic Islands, under the Crown of Aragon, 1375.'",
        },
        witnesses: [
          {
            who: "Sailor",
            look: "sailor",
            kind: "where",
            text: {
              b5: "Go north across the sea to the island of Majorca.",
              b68: "Stories of Mali's gold sail north across the Mediterranean to Majorca, an island of mapmakers.",
              b912: "North African and Jewish merchants carry news of Mali across the sea to Majorca, an island famous for its chart-makers.",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b5: "About 50 years after Musa's trip, a map shows him.",
              b68: "About fifty years after Musa's hajj, a mapmaker paints him in gold.",
              b912: "Half a century after the hajj, in the 1370s, a map shows Musa, though he had died decades before.",
            },
          },
        ],
        herring: { who: "Cook", look: "worker", text: "Try my couscous! Best in the market.", note: "Tasty, but no clue." },
        unreliable: {
          who: "Know-it-all sailor",
          look: "sailor",
          text: "That famous map was drawn in Paris by men who sailed to Mali themselves.",
          note: "Wrong twice: it was drawn on Majorca from traders' reports. It was later kept in the French royal library, which may confuse people.",
        },
        wrongPlaces: [
          { place: "genoa", kind: "near", why: "Genoa's sailors made sea charts too, but the 1375 Catalan Atlas was made on Majorca." },
          { place: "lisbon", kind: "place", why: "Lisbon is a busy port in 1375, but the Catalan Atlas comes from Majorca." },
          { place: "paris", kind: "place", why: "The atlas ended up in the French king's library, but it was made on Majorca." },
        ],
        wrongEras: [
          { era: "c. 1150", year: 1150, why: "In 1150 Majorca is Muslim-ruled, and Mansa Musa won't be born for over 100 years." },
          { era: "1490s", year: 1492, why: "Majorca still made charts in the 1490s, but the Catalan Atlas was drawn over a century earlier." },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "gold-sc-umari",
      bands: ["b68", "b912"],
      bead: "gold-cairo",
      kind: "retold",
      cite: "Retold from al-Umari, Masalik al-absar (1330s–1340s)",
      passage:
        "When I came to Egypt, people told me how Mansa Musa and his followers spent and gave away gold. They exchanged so much gold that its value in Egypt fell. Before, a measure of gold was worth at least 25 silver coins; since then it has stayed cheap, about twelve years until today.",
      prompt: "Al-Umari did not see the visit himself. What is his account based on?",
      choices: [
        "What people in Cairo remembered",
        "His own diary from 1324",
        "Letters Mansa Musa sent him",
        "A song by a griot in Mali",
      ],
      explanation:
        "Al-Umari interviewed Cairenes about a decade later. Historians compare his account with price records: gold did get cheaper, but how much Musa caused is still debated.",
    },
    {
      id: "gold-sc-ibn",
      bands: ["b912"],
      bead: "gold-taghaza",
      kind: "retold",
      cite: "Retold from Ibn Battuta's Rihla (1350s)",
      passage:
        "We came to Taghaza, a village with nothing pleasant about it. Its houses and mosque are built of blocks of salt, roofed with camel skins, and there are no trees, only sand. The salt is dug in thick slabs. No one lives there except the enslaved workers of the Massufa, who dig the salt and live on dates and camel meat brought from far away. A camel carries two slabs south, where salt is traded like gold.",
      prompt: "Ibn Battuta saw Taghaza himself. What can his account tell us, and what can't it?",
      choices: [
        "What he saw and heard, but not the miners' own views",
        "Everything about the mine in every century",
        "Nothing, because he was only passing through",
        "The exact price of gold in Cairo",
      ],
      explanation:
        "An eyewitness is strong evidence for what he saw. But the enslaved miners left no written record of their own, so historians look for other evidence about their lives and remember whose voices are missing.",
    },
  ],
  why: [
    {
      bands: ["b5"],
      prompt: "Why did Mansa Musa travel through Cairo?",
      choices: ["He was on a pilgrimage to Mecca", "He wanted to conquer Egypt", "He was lost in the desert", "He was moving to Egypt"],
      explanation: "Musa was a Muslim making the hajj, the pilgrimage to Mecca. Cairo was on the way.",
    },
    {
      bands: ["b68"],
      prompt: "What kept gold moving north and salt moving south across the Sahara?",
      choices: ["Trade: each side had what the other needed", "Pilgrimage only", "Roman armies", "Ocean ships"],
      explanation: "West Africa had gold but needed salt; the Sahara had salt mines; North Africa and Europe wanted gold. Camel caravans linked them.",
    },
    {
      bands: ["b912"],
      prompt: "Which combination best explains how Mali's gold became famous in Europe by 1375?",
      choices: [
        "Trans-Saharan trade plus Musa's pilgrimage",
        "European explorers visiting Mali",
        "Only the Catalan Atlas",
        "Roman records about Mali",
      ],
      explanation: "Caravan trade carried gold north for centuries, and Musa's hajj spread his fame through Cairo; merchants and mapmakers passed the news to Europe.",
    },
  ],
};
