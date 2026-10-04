import type { Case } from "@/game/types";

/*
 * Case 6: The Great Exchange. Andes potato -> Seville -> maize in Kongo -> horses on the Plains -> Ireland 1845.
 * Fact note: maize appears in Chinese gazetteers by 1551–1555, before Seville's 1573 potato record, so
 * the "maize in Africa and China" bead is placed in Kongo (1580s) and China is mentioned on the fact card.
 */
export const EXCHANGE: Case = {
  id: "exchange",
  n: 6,
  title: "The Great Exchange",
  thread: "crops and animals between the hemispheres",
  grades: ["5", "7", "8", "9", "10", "11", "12"],
  color: "#ff55ff",
  brief: {
    b5: "Knot mixed up the GREAT EXCHANGE thread! After 1492, ships carried plants and animals both ways across the Atlantic. Follow potatoes and horses.",
    b68: "Knot scrambled the GREAT EXCHANGE thread! After 1492, crops and animals crossed the oceans in both directions. Follow potatoes, maize and horses around the world.",
    b912: "Knot scattered the GREAT EXCHANGE (Columbian Exchange) thread. Follow crops and animals between hemispheres, and the empires, forced labor and resistance that moved with them.",
  },
  woven: "Potatoes, maize and horses moved between the hemispheres after 1492, feeding and reshaping societies on every continent, through empires, slavery and resistance.",
  beads: [
    {
      id: "exchange-andes",
      place: "titicaca",
      year: 1540,
      era: "1540s",
      title: "Potatoes of the Andes",
      scene: "fields",
      sensitive: true,
      bands: ["b5", "b68", "b912"],
      what: "Spanish writers recording Andean potatoes",
      sources: ["whc-cieza", "markham-1864", "wiki-potato"],
      fact: {
        b5: "People in the Andes had grown potatoes for thousands of years. They freeze-dried them into chuño to store for years.",
        b68: "Andean farmers domesticated potatoes thousands of years ago near Lake Titicaca and grew hundreds of kinds. After Spanish invaders toppled the Inca state in the 1530s, Spanish writers recorded the potato and chuño.",
        b912: "Pedro de Cieza de León, traveling in the 1540s after the Spanish conquest of the Inca, described potatoes and freeze-dried chuño (published 1553): knowledge Andean farmers had built over thousands of years.",
      },
    },
    {
      id: "exchange-seville",
      place: "seville",
      year: 1573,
      era: "1573",
      title: "Potatoes in Seville",
      scene: "market",
      bands: ["b5", "b68", "b912"],
      what: "potatoes in Seville",
      sources: ["hawkes-1992", "wiki-potato", "historyireland-potato"],
      fact: {
        b5: "In 1573 a hospital in Seville, Spain, bought potatoes for its patients. That's one of the first records of potatoes in Europe.",
        b68: "Seville was Spain's port for American trade. In 1573 its Hospital de la Sangre bought potatoes, one of the earliest records in Europe (the Canary Islands shipped them by 1567).",
        b912: "Seville's monopoly on American trade made it the Atlantic gateway. The Hospital de la Sangre's accounts show potato purchases from 1573; potatoes were already shipped from the Canaries in 1567.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'Bought by a hospital in a Spanish river port.'",
          b68: "Plaque: 'Account book of a hospital in a Spanish river port, 1570s: potatoes bought.'",
          b912: "Plaque: an account book from a hospital in the city that held Spain's monopoly on American trade, 1570s.",
        },
        witnesses: [
          {
            who: "Ship's purser",
            look: "sailor",
            kind: "where",
            text: {
              b5: "Ships sail to Spain, up the river to Seville.",
              b68: "Fleets cross the Atlantic to Spain and sail up the Guadalquivir River to Seville.",
              b912: "Every legal ship from the Americas must unload at one river port in Andalusia, home of the House of Trade (1503).",
            },
          },
          {
            who: "Farmer",
            look: "farmer",
            kind: "when",
            text: {
              b5: "Look about 30 years later, in the 1570s.",
              b68: "About 30 years later, in the 1570s, a hospital there buys potatoes for its patients.",
              b912: "Look at the 1570s: within a generation of the conquest, potatoes appear in Spanish account books.",
            },
          },
        ],
        herring: { who: "Llama herder", look: "farmer", text: "My llamas carry loads up the mountain paths.", note: "Strong llamas, but no clue." },
        unreliable: {
          who: "Courtier",
          look: "official",
          text: "Potatoes reached Europe because Sir Walter Raleigh brought them to England!",
          note: "A popular legend. Spanish records show potatoes in the Canaries and Seville years earlier.",
        },
        wrongPlaces: [
          { place: "lisbon", kind: "near", why: "Lisbon is Portugal's port. Spain's American ships had to unload at Seville." },
          { place: "amsterdam", kind: "place", why: "Amsterdam's big Atlantic trade comes later. Potatoes show up first in Spain." },
          { place: "dublin", kind: "place", why: "Potatoes reach Ireland later, around the 1590s or after. First: Seville." },
        ],
        wrongEras: [
          { era: "c. 1400", year: 1400, why: "In 1400 no ship has crossed the Atlantic from Spain. No potatoes here yet." },
          { era: "1820s", year: 1820, why: "By the 1820s potatoes were common all over Europe. Too late!" },
        ],
      },
    },
    {
      id: "exchange-kongo",
      place: "mbanza",
      year: 1583,
      era: "1580s",
      title: "Maize in Kongo",
      scene: "fields",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "maize growing in Kongo",
      sources: ["wiki-pigafetta", "cambridge-maize", "slavevoyages-est", "wiki-afonso"],
      fact: {
        b68: "In the 1580s a Portuguese trader, Duarte Lopes, saw maize growing in the Kingdom of Kongo, where people called it 'Portuguese grain.' The same ships carried millions of enslaved Africans to the Americas.",
        b912: "Lopes's account (printed 1591) shows American maize already farmed in Kongo; maize was in China's gazetteers by the 1550s too. SlaveVoyages estimates about 12.5 million people were embarked from Africa and about 10.7 million survived the crossing. Kongo's King Afonso I protested to Portugal in 1526.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'Maize cobs from a central African royal city, 1580s.'",
          b912: "Plaque: a merchant's report: maize growing near a royal city south of the Congo River, 1580s.",
        },
        witnesses: [
          {
            who: "Portuguese pilot",
            look: "captain",
            kind: "where",
            text: {
              b68: "Portuguese ships carry maize south, to the Kingdom of Kongo, near the great Congo River.",
              b912: "Ships from Lisbon and São Tomé carry American maize to a central African kingdom whose capital lies south of the Congo River.",
            },
          },
          {
            who: "Merchant",
            look: "merchant",
            kind: "when",
            text: {
              b68: "Look about 10 years after the hospital's potatoes, in the 1580s.",
              b912: "In the 1580s a Portuguese trader living there notes the new grain; his account is printed in Rome in 1591.",
            },
          },
        ],
        herring: { who: "Olive seller", look: "merchant", text: "Seville's olives are the best in Spain!", note: "Tasty, but no clue." },
        unreliable: {
          who: "Map dealer",
          look: "scholar",
          text: "Africans brought maize home from America long before 1492.",
          note: "No evidence supports that. Maize reached Africa with Atlantic shipping after 1492.",
        },
        wrongPlaces: [
          { place: "capetown", kind: "near", why: "In the 1580s there is no colony at the Cape; Khoekhoe herders live there. Dutch settlers arrive in 1652." },
          { place: "rome", kind: "place", why: "Lopes's account was printed in Rome in 1591, but the maize grew in Kongo." },
          { place: "lisbon", kind: "place", why: "Lisbon is where the ships came from. The maize report is from Kongo." },
        ],
        wrongEras: [
          { era: "c. 1300", year: 1300, why: "In 1300 maize hasn't left the Americas. Kongo grows millet and sorghum." },
          { era: "1950s", year: 1950, why: "By the 1950s maize was a main food across Africa. Too late!" },
        ],
      },
    },
    {
      id: "exchange-plains",
      place: "plains",
      year: 1700,
      era: "c. 1700",
      title: "Horses on the Plains",
      scene: "steppe",
      bands: ["b5", "b68", "b912"],
      what: "horses spreading on the Plains",
      sources: ["plains-horse", "science-horses", "wiki-comanche"],
      fact: {
        b5: "Spanish horses spread north after 1680. Plains peoples like the Comanche became expert riders and hunted bison on horseback.",
        b68: "Spanish colonists brought horses to New Mexico. After the Pueblo Revolt of 1680 drove the Spanish out, horses spread by trade across the Plains. By about 1700 Comanche riders hunted bison on horseback.",
        b912: "The 1680 Pueblo Revolt, a Native uprising, expelled Spanish colonists and put horses into Native trade networks. Comanche, Kiowa, Lakota and others built new horse cultures over the 1700s (new archaeology suggests some had horses even earlier).",
      },
      find: {
        plaque: {
          b5: "Plaque: 'A horse bridle from North America's grasslands.'",
          b68: "Plaque: 'A Spanish-style bit, traded north to the grasslands around 1700.'",
          b912: "Plaque: a Spanish iron bit found far north of Santa Fe, traded after a Native uprising in 1680.",
        },
        witnesses: [
          {
            who: "Sailor",
            look: "sailor",
            kind: "where",
            text: {
              b5: "Horses go to America and spread onto the Great Plains.",
              b68: "Spanish ships carry horses to the Americas. They spread north from New Mexico onto the Great Plains.",
              b912: "Horses travel from Spain to Mexico, north to New Mexico, then by Native trade onto the southern Plains of today's Oklahoma and Texas.",
            },
          },
          {
            who: "Traveler",
            look: "pilgrim",
            kind: "when",
            text: {
              b5: "Look around the year 1700.",
              b68: "Look about 120 years later, after the Pueblo Revolt of 1680.",
              b912: "After the 1680 revolt, horses move north by trade. By about 1700 Comanche riders hunt bison on horseback.",
            },
          },
        ],
        herring: { who: "Basket weaver", look: "weaver", text: "My raffia cloth is fine enough for a king.", note: "Beautiful work, but no clue." },
        unreliable: {
          who: "European visitor",
          look: "envoy",
          text: "Plains peoples got horses because Spanish officials handed them out as gifts.",
          note: "Spanish rules tried to keep horses from Native people. The 1680 revolt and Native trade spread them.",
        },
        wrongPlaces: [
          { place: "stlouis", kind: "near", why: "In 1700 there is no St. Louis (founded 1764). Horses reach the Missouri River country in the 1730s." },
          { place: "quebec", kind: "place", why: "New France has few horses in 1700. The great horse cultures grow on the southern Plains." },
          { place: "lima", kind: "place", why: "Lima is Spain's capital in South America. Our horse thread goes to North America's Plains." },
        ],
        wrongEras: [
          { era: "c. 1400", year: 1400, why: "In 1400 there are no horses in the Americas. They had died out here over 10,000 years before." },
          { era: "1890s", year: 1890, why: "By the 1890s the bison herds had been nearly destroyed and Plains nations forced onto reservations. Too late for this bead." },
        ],
      },
    },
    {
      id: "exchange-ireland",
      place: "cork",
      year: 1845,
      era: "1845",
      title: "The Great Hunger",
      scene: "fields",
      sensitive: true,
      bands: ["b5", "b68", "b912"],
      what: "the potato blight in Ireland",
      sources: ["wiki-irishfamine", "ebsco-irishfamine", "duke-gortamor"],
      fact: {
        b5: "Many poor families in Ireland lived mostly on potatoes. In 1845 a plant disease ruined the crop. About a million people died, and many more left Ireland.",
        b68: "By the 1840s many poor Irish families depended on potatoes. In 1845 blight, a plant disease, struck. About a million people died and perhaps 1.5 to 2 million emigrated, while some food was still shipped out.",
        b912: "Potato blight struck in 1845. Estimates: about 1 million deaths and 1.5 to 2 million emigrants. Historians stress that land laws, British relief policy and continued food exports turned crop failure into catastrophe.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'A potato basket from an island west of Britain.'",
          b68: "Plaque: 'A farm record from an island west of Britain, 1845: potatoes blackened.'",
          b912: "Plaque: a relief committee's note from a port in the south of the island west of Britain, 1845–1847.",
        },
        witnesses: [
          {
            who: "Fur trader",
            look: "merchant",
            kind: "where",
            text: {
              b5: "Across the ocean, potatoes became the main food of Ireland.",
              b68: "Across the Atlantic, potatoes became the main food of the poor on the island west of Britain.",
              b912: "On the island west of Britain, small tenant farmers came to depend on one potato variety, the 'Lumper.'",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b5: "Look in the 1840s, when a plant disease comes.",
              b68: "Look about 145 years later, in 1845, when a plant disease arrives.",
              b912: "In 1845 a blight that crossed from the Americas reaches Europe and ruins the potato crop for several years.",
            },
          },
        ],
        herring: { who: "Bison hunter", look: "rider", text: "One bison feeds many families, and we use every part.", note: "True on the Plains, but not where the potato thread goes." },
        unreliable: {
          who: "Official",
          look: "official",
          text: "There is plenty of food over there. The hunger is just a rumor.",
          note: "Contradicted by records of deaths, relief committees and emigration. Some officials did play down the crisis.",
        },
        wrongPlaces: [
          { place: "london", kind: "near", why: "London is the government's capital. The famine struck in Ireland." },
          { place: "boston", kind: "place", why: "Many Irish families escaped to Boston, but the blight and famine struck in Ireland." },
          { place: "newyork", kind: "place", why: "Many Irish emigrants arrived in New York, but the famine was in Ireland." },
        ],
        wrongEras: [
          { era: "c. 1500", year: 1500, why: "In 1500 there are no potatoes in Ireland. They haven't crossed the Atlantic yet." },
          { era: "1990s", year: 1995, why: "In the 1990s Ireland built memorials for the famine's 150th anniversary. Too late!" },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "exchange-sc-cieza",
      bands: ["b68", "b912"],
      bead: "exchange-andes",
      kind: "quoted",
      cite: "Pedro de Cieza de León, Chronicle of Peru (1553), translated by Clements Markham (1864, public domain)",
      passage:
        "A kind of earth nut, which, after it has been boiled, is as tender as a cooked chestnut, but it has no more skin than a truffle, and it grows under the earth in the same way. … They dry these potatoes in the sun, and keep them from one harvest to another. After they are dried they call these potatoes chuños.",
      prompt: "Cieza compares the potato to a chestnut and a truffle. Why?",
      choices: [
        "To explain a new food using foods his readers knew",
        "Because potatoes are a kind of nut",
        "Because Andean farmers called them chestnuts",
        "To prove that potatoes came from Spain",
      ],
      explanation:
        "Writers describe the unfamiliar through the familiar. Notice whose knowledge it is: Andean farmers had grown and freeze-dried potatoes for thousands of years.",
    },
    {
      id: "exchange-sc-afonso",
      bands: ["b912"],
      bead: "exchange-kongo",
      kind: "retold",
      cite: "Retold from letters of King Afonso I of Kongo to King João III of Portugal (1526)",
      passage:
        "Every day traders seize our people: children of this country, sons of our nobles, even members of our own family, and sell them. This corruption is spreading so far that our land is being emptied. We need no goods from you except priests and teachers. We ask that no more enslaved people be sent from here.",
      prompt: "What does Afonso's letter show?",
      choices: [
        "An African ruler protesting the Portuguese slave trade",
        "That Kongo welcomed every Portuguese trader",
        "That Portugal had no part in the trade",
        "That Kongo had no government of its own",
      ],
      explanation:
        "Afonso was a powerful Christian king who wrote to Portugal as an equal and protested the kidnapping of free people. His letters show African agency and resistance, even as the trade grew.",
    },
  ],
  why: [
    {
      bands: ["b5"],
      prompt: "How did horses spread across the Great Plains?",
      choices: ["People traded them after the Spanish brought them", "They swam from Europe", "They had always lived there", "Kings mailed them"],
      explanation: "Spanish colonists brought horses. After the Pueblo Revolt of 1680, Native peoples traded them north and became expert riders.",
    },
    {
      bands: ["b68"],
      prompt: "Why did potatoes, maize and horses spread around the world after 1492?",
      choices: ["Ships linked the hemispheres for trade and empire", "Birds carried them", "They had always grown everywhere", "One king ordered it"],
      explanation: "Once ships crossed the Atlantic regularly, crops and animals moved in both directions, through trade, colonization and forced migration.",
    },
    {
      bands: ["b912"],
      prompt: "Why did a crop disease become a famine that killed about a million people in Ireland?",
      choices: [
        "Dependence on one crop plus land laws and relief policy",
        "Only bad weather",
        "Potatoes are poisonous",
        "No one in Ireland knew how to farm",
      ],
      explanation:
        "The blight was natural, but poverty, a land system that left tenants with tiny plots, a single potato variety and inadequate British relief made it a catastrophe.",
    },
  ],
};
