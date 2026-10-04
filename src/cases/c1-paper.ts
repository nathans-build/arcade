import type { Case } from "@/game/types";

/* Case 1: Paper's Road. Han China -> Samarkand -> Baghdad -> Xàtiva -> Mainz. */
export const PAPER: Case = {
  id: "paper",
  n: 1,
  title: "Paper's Road",
  thread: "paper",
  grades: ["5", "6", "7", "8", "9", "10", "11", "12"],
  color: "#f5e6c8",
  brief: {
    b5: "Knot pulled the PAPER thread loose! Paper started in China. Follow it west, bead by bead, until books are printed on it.",
    b68: "Knot tugged the PAPER thread loose! Follow paper from a Han court in China, west across Asia and into Europe, until it meets the printing press.",
    b912: "Knot unravelled the PAPER thread. Trace how a Han Chinese craft crossed Central Asia and the Islamic world into Europe, and weigh a famous story historians still debate.",
  },
  woven: "Paper moved from Han China through Central Asia and the Abbasid world into Europe, where cheap paper made printed books possible.",
  beads: [
    {
      id: "paper-luoyang",
      place: "luoyang",
      year: 105,
      era: "105 CE",
      title: "Cai Lun's paper",
      scene: "court",
      bands: ["b5", "b68", "b912"],
      what: "Cai Lun's report on paper",
      sources: ["brit-cailun", "wiki-cailun", "bloom-paper"],
      fact: {
        b5: "Cai Lun showed Emperor He a better paper, made of bark, hemp, rags and old fishing nets.",
        b68: "In 105 CE the court official Cai Lun reported a better paper to Emperor He: bark, hemp, rags and old nets beaten to pulp. Paper existed before him; he improved it and made it official.",
        b912: "Han records credit the official Cai Lun (105 CE) with presenting paper of bark, hemp, rags and nets to Emperor He. Archaeologists have found older paper, so he refined and promoted it rather than inventing it.",
      },
    },
    {
      id: "paper-samarkand",
      place: "samarkand",
      year: 751,
      era: "750s",
      title: "Samarkand paper",
      scene: "market",
      bands: ["b68", "b912"],
      what: "paper workshops in Samarkand",
      sources: ["wiki-talas", "bloom-paper", "hoi-talas"],
      fact: {
        b68: "By the 700s Samarkand's workshops made fine paper. A famous story says Chinese prisoners from the Battle of Talas (751) taught them, but historians debate it.",
        b912: "'Samarkand paper' became famous across the Islamic world. Al-Tha'alibi, writing over 250 years later, credited Chinese prisoners taken at Talas (751); historians such as Jonathan Bloom think paper was already known there.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'This sheet crossed the Pamir mountains about 650 years after Cai Lun.'",
          b912: "Plaque: a sheet from the first decade of Abbasid rule, about 750 to 760 CE, with a Sogdian merchant's mark.",
        },
        witnesses: [
          {
            who: "Caravan merchant",
            look: "merchant",
            kind: "where",
            text: {
              b68: "I take silk west, past the Tian Shan mountains, to the great oasis city of the Sogdians.",
              b912: "Our caravans cross the Tian Shan to the Sogdian oasis city on the Zeravshan River, where roads split for Persia and India.",
            },
          },
          {
            who: "Old scribe",
            look: "scribe",
            kind: "when",
            text: {
              b68: "Paper moves west slowly. Look for it when Tang and Abbasid armies clash, in 751.",
              b912: "The Tang and the new Abbasid caliphate will meet at the Talas River in 751. The famous paper city lies nearby.",
            },
          },
        ],
        herring: { who: "Silk weaver", look: "weaver", text: "Our silk is the finest in the world. Everyone wants it!", note: "True, but it tells you nothing about where paper went." },
        unreliable: {
          who: "Rumor-teller",
          look: "storyteller",
          text: "Paper skipped Central Asia and sailed straight from China to Baghdad. Everyone says so!",
          note: "'Everyone says so' is not evidence, and it contradicts the others: Baghdad's paper came overland, through Central Asia.",
        },
        wrongPlaces: [
          { place: "bukhara", kind: "near", why: "Bukhara is Samarkand's neighbour, but the paper famous in this age was called 'Samarkand paper.' Wrong oasis!" },
          { place: "rome", kind: "place", why: "In the 750s Rome writes on parchment and papyrus. Paper won't reach Italy for about 500 years." },
          { place: "constantinople", kind: "place", why: "Constantinople still writes on parchment and papyrus in the 750s. Paper is far to the east." },
        ],
        wrongEras: [
          { era: "200s BCE", year: -250, why: "In the 200s BCE no one here makes paper. Even Cai Lun is 350 years in the future!" },
          { era: "1500s", year: 1500, why: "By the 1500s Samarkand's paper had been famous for 700 years. You're far too late!" },
        ],
      },
    },
    {
      id: "paper-baghdad",
      place: "baghdad",
      year: 794,
      era: "c. 794",
      title: "Baghdad's paper mill",
      scene: "library",
      bands: ["b5", "b68", "b912"],
      what: "the paper mill in Baghdad",
      sources: ["wiki-papermill", "bloom-paper", "brit-paper"],
      fact: {
        b5: "Around 794, Baghdad opened a paper mill. Soon a whole street sold paper and books.",
        b68: "Around 794–795, under Caliph Harun al-Rashid, Baghdad's first paper mill opened. Government offices switched to paper, and a street of paper and book sellers grew.",
        b912: "Sources credit the vizier Ja'far al-Barmaki (c. 794) with Baghdad's first paper mill. Abbasid offices liked paper because changes showed; booksellers filled a market street, feeding the city's scholarship.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'Made in a round city on a river, 790s.'",
          b68: "Plaque: 'Paper from the round city on the Tigris, made when Harun al-Rashid was caliph.'",
          b912: "Plaque: an Arabic receipt for paper for the caliph's offices, in a capital founded as a round city in 762.",
        },
        witnesses: [
          {
            who: "Caravan merchant",
            look: "merchant",
            kind: "where",
            text: {
              b5: "Go west to the caliph's city on the Tigris River.",
              b68: "West! The caliph's new capital sits on the Tigris River, where it runs close to the Euphrates.",
              b912: "Follow the Khurasan Road west to the Abbasid capital, built in 762 where the Tigris and Euphrates run closest.",
            },
          },
          {
            who: "Court scribe",
            look: "scribe",
            kind: "when",
            text: {
              b5: "It happens in the 790s, when Harun al-Rashid rules.",
              b68: "In the 790s, when Harun al-Rashid rules, officials there will ask for paper, not parchment.",
              b912: "Within about 45 years of Talas, the caliph's offices adopt paper: scraped-out words show on it, so it's harder to forge.",
            },
          },
        ],
        herring: { who: "Camel driver", look: "rider", text: "My camel can go many days without water. Well, almost!", note: "Fun, but no clue about paper." },
        unreliable: {
          who: "Boastful trader",
          look: "merchant",
          text: "Paper went to Constantinople first. The Byzantine emperor kept it secret for a hundred years!",
          note: "No evidence at all: Byzantium kept using parchment and papyrus. The other clues agree on the Tigris.",
        },
        wrongPlaces: [
          { place: "damascus", kind: "near", why: "Damascus was the old Umayyad capital. In the 790s the caliph's offices and new paper mill are in the new capital." },
          { place: "alexandria", kind: "place", why: "Egypt still makes papyrus in the 790s. Paper will replace it there later." },
          { place: "cordoba", kind: "place", why: "Córdoba writes on parchment in the 790s. Paper reaches Spain about 150 years later." },
        ],
        wrongEras: [
          { era: "c. 600", year: 600, why: "In 600 there is no Baghdad yet. The city is founded in 762." },
          { era: "1400s", year: 1400, why: "By the 1400s paper had been made here for 600 years. Too late!" },
        ],
      },
    },
    {
      id: "paper-xativa",
      place: "xativa",
      year: 1150,
      era: "c. 1150",
      title: "Xàtiva paper",
      scene: "mill",
      bands: ["b5", "b68", "b912"],
      what: "the paper of Xàtiva",
      sources: ["hoi-xativa", "wiki-xativa", "wiki-ragpaper"],
      fact: {
        b5: "By 1150, Xàtiva in Muslim-ruled Spain (al-Andalus) made famous paper.",
        b68: "About 1150 the geographer al-Idrisi praised Xàtiva's paper, sent 'to the East and to the West.' Xàtiva was in al-Andalus, Muslim-ruled Spain: paper's door into Europe.",
        b912: "Rag paper was made in al-Andalus by the 900s–1000s. Around 1150 al-Idrisi wrote that Xàtiva's paper had no equal and was exported east and west: Europe's first big supply.",
      },
      find: {
        plaque: {
          b5: "Plaque: 'From a canal town in Muslim Spain.'",
          b68: "Plaque: 'Paper from a hill town near Valencia, praised by al-Idrisi, c. 1150.'",
          b912: "Plaque: a charter on Andalusi paper, 1100s, from a town in eastern al-Andalus whose mills used irrigation canals.",
        },
        witnesses: [
          {
            who: "Sailor",
            look: "sailor",
            kind: "where",
            text: {
              b5: "Sail west, all the way to Spain, near Valencia.",
              b68: "Paper sails west along North Africa to al-Andalus, Muslim Spain, near the city of Valencia.",
              b912: "Ships carry the papermakers' craft west through North Africa to Sharq al-Andalus, to a town above Valencia's plain.",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b5: "Go about 350 years after Baghdad's mill.",
              b68: "About 350 years after Baghdad's first mill, a town there is famous for its paper.",
              b912: "Look around 1150, when the geographer al-Idrisi, working for King Roger II of Sicily, praises it.",
            },
          },
        ],
        herring: { who: "Spice seller", look: "merchant", text: "Saffron is the costliest spice in my stall. Smell it!", note: "Nice, but not about paper." },
        unreliable: {
          who: "Traveling monk",
          look: "monk",
          text: "Paper is a passing fad. Every proper book in Europe will always be parchment, made in Rome!",
          note: "An opinion, not evidence, and wrong: paper took over. The other clues point to al-Andalus.",
        },
        wrongPlaces: [
          { place: "albelda", kind: "near", why: "Albelda's monks may buy a few sheets, but paper is MADE in the Muslim-ruled towns to the south." },
          { place: "genoa", kind: "place", why: "Genoa trades by sea in 1150, but Italy's paper mills start at Fabriano about a century later." },
          { place: "paris", kind: "place", why: "Paris writes on parchment in 1150. France's own paper mills come about 200 years later." },
        ],
        wrongEras: [
          { era: "c. 800", year: 800, why: "In 800 paper is only just reaching Baghdad. Spain has none yet." },
          { era: "1750s", year: 1750, why: "By the 1750s Xàtiva's paper had been famous for 600 years. Too late!" },
        ],
      },
    },
    {
      id: "paper-mainz",
      place: "mainz",
      year: 1455,
      era: "c. 1455",
      title: "Gutenberg's Bible",
      scene: "workshop",
      bands: ["b5", "b68", "b912"],
      what: "Gutenberg's printed Bible",
      sources: ["wiki-gutenbergbible", "loc-gutenberg", "wiki-jikji"],
      fact: {
        b5: "In Mainz, about 1455, Gutenberg printed Bibles. Most copies were on paper.",
        b68: "In Mainz in the 1450s, Gutenberg printed with metal movable type. About 180 Bibles were made, most on paper. Cheap paper made cheap books possible.",
        b912: "Gutenberg's Bible (c. 1454–55) used metal movable type; about three-quarters of some 180 copies were on paper. Movable type was older in East Asia: Bi Sheng (c. 1040) and Korea's Jikji (1377).",
      },
      find: {
        plaque: {
          b5: "Plaque: 'A press by the Rhine River, 1450s.'",
          b68: "Plaque: 'Ink, metal letters and a wine-press screw. Rhine River, 1450s.'",
          b912: "Plaque: a metal type piece cast in an archbishop's city on the Rhine, c. 1450–1455.",
        },
        witnesses: [
          {
            who: "Merchant",
            look: "merchant",
            kind: "where",
            text: {
              b5: "Paper goes north over the Alps to Germany.",
              b68: "Paper mills spread to Italy, then north over the Alps to the cities on the Rhine River.",
              b912: "From Italian mills like Fabriano, paper spreads north to the Rhineland, where goldsmiths know how to cast metal.",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b5: "About 300 years after Xàtiva, books get printed.",
              b68: "About 300 years after Xàtiva's paper, someone prints whole books on it.",
              b912: "Three centuries on, in the 1450s: the same decade the Ottomans take Constantinople (1453).",
            },
          },
        ],
        herring: { who: "Mule driver", look: "farmer", text: "The Alps are cold. Pack a warm cloak!", note: "Good advice, but no clue." },
        unreliable: {
          who: "Traveler from the Rhine",
          look: "citizen",
          text: "My city invented movable type. Nobody anywhere ever printed with it before us!",
          note: "Wrong: Bi Sheng in China (c. 1040) and Korea's Jikji (1377) came first. Notice the bias, but the Rhine clue still holds.",
        },
        wrongPlaces: [
          { place: "nuremberg", kind: "near", why: "Nuremberg got a paper mill in 1390, but the first big printed Bible comes from Mainz." },
          { place: "venice", kind: "place", why: "Venice becomes a printing capital, but printing only arrives there in 1469." },
          { place: "lisbon", kind: "place", why: "Portugal's first printed books come in the 1480s. Too far, too soon!" },
        ],
        wrongEras: [
          { era: "c. 1250", year: 1250, why: "In 1250 paper mills are only starting in Italy. No press yet!" },
          { era: "1650s", year: 1650, why: "By the 1650s Mainz's presses were 200 years old. Too late!" },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "paper-sc-talas",
      bands: ["b68", "b912"],
      bead: "paper-samarkand",
      kind: "retold",
      cite: "Retold from al-Tha'alibi, Lata'if al-ma'arif (early 1000s)",
      passage:
        "Among the specialties of Samarkand is paper. It pushed aside the papyrus and parchment that people wrote on before, because it is finer, smoother and easier to use. It came to Samarkand from China with prisoners of war, and its making spread from them.",
      prompt: "This was written more than 250 years after the Battle of Talas (751). How should a historian use it?",
      choices: [
        "Compare it with older evidence before trusting it",
        "Trust it because it is very old",
        "Throw it out because the author was not Chinese",
        "Trust it because it is a famous story",
      ],
      explanation:
        "Later writers can pass on real traditions, but historians check them. Paper had already been used in Central Asia before 751, so many now doubt the prisoner story. It is a debate.",
    },
    {
      id: "paper-sc-pius",
      bands: ["b912"],
      bead: "paper-mainz",
      kind: "retold",
      cite: "Retold from a letter by Enea Silvio Piccolomini (later Pope Pius II), March 1455",
      passage:
        "At Frankfurt I saw a remarkable man showing sections of whole Bibles, printed in very neat, clear letters without a single mistake. You could read them without your glasses. I was told some 158 or 180 copies were made, and every one had a buyer already.",
      prompt: "Why is this letter strong evidence that printed Bibles existed by early 1455?",
      choices: [
        "He saw the pages himself and wrote at the time",
        "He later became pope",
        "He wrote in Latin, like the Bible",
        "He liked the Bible a lot",
      ],
      explanation:
        "An eyewitness writing at the time is strong evidence for what he saw. Notice he only HEARD the number of copies, so that part is weaker.",
    },
  ],
  why: [
    {
      bands: ["b5"],
      prompt: "Why did paper move from China all the way to Spain?",
      choices: ["Traders and scholars carried it", "A storm blew it there", "Explorers from Europe took it", "Roman armies marched it west"],
      explanation: "Merchants on the Silk Roads and scholars in Baghdad and Spain spread the skill of papermaking, step by step.",
    },
    {
      bands: ["b68"],
      prompt: "Which best explains why papermaking moved west from China to Spain?",
      choices: [
        "Trade routes and learning in the Islamic world",
        "Roman legions carried it",
        "Vikings sailed it to Spain",
        "One inventor walked it there",
      ],
      explanation: "Silk Road trade brought paper to Central Asia; Abbasid offices and scholars made Baghdad a paper city; the craft spread west across North Africa to al-Andalus.",
    },
    {
      bands: ["b912"],
      prompt: "Which combination best explains paper's spread from Samarkand to Xàtiva?",
      choices: [
        "Government demand, trade routes and scholarship",
        "Only the Battle of Talas",
        "Crusaders bringing it home",
        "European explorers sailing east",
      ],
      explanation:
        "Many causes worked together: caravan trade, Abbasid offices that wanted paper, and a book-loving scholarly culture. The Talas story is at most one debated part.",
    },
  ],
};
