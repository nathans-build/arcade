import type { Case } from "@/game/types";

/* Case 5: Monsoon Sea. Kilwa -> Calicut -> Malacca -> Nanjing (Zheng He) -> Calicut (da Gama). */
export const MONSOON: Case = {
  id: "monsoon",
  n: 5,
  title: "Monsoon Sea",
  thread: "Indian Ocean sea trade",
  grades: ["6", "7", "8", "9", "10", "11", "12"],
  color: "#2fd36a",
  brief: {
    b68: "Knot set the MONSOON thread adrift! Follow the sea trade of the Indian Ocean, riding the seasonal winds from East Africa to India, Malacca and China.",
    b912: "Knot cut the MONSOON thread. Follow a sea network that was busy long before Europeans arrived, and judge a famous story about Vasco da Gama's pilot.",
  },
  woven: "Monsoon winds linked Swahili, Indian, Malay, Arab and Chinese ports for centuries; the Portuguese reached an ocean that was already crowded with trade.",
  beads: [
    {
      id: "monsoon-kilwa",
      place: "kilwa",
      year: 1331,
      era: "1331",
      title: "Kilwa, Swahili city",
      scene: "port",
      bands: ["b68", "b912"],
      what: "Ibn Battuta's visit to Kilwa",
      sources: ["wiki-kilwa", "natgeo-kilwa", "gibb-1929"],
      fact: {
        b68: "In 1331 the traveler Ibn Battuta visited Kilwa, a Swahili city-state on an island off East Africa. It grew rich trading gold from inland Africa with merchants who sailed on the monsoon winds.",
        b912: "Kilwa's sultans controlled gold coming from the Zimbabwe plateau through Sofala. Ibn Battuta (1331) praised it as one of the finest, most solidly built towns; its coral-stone mosque still stands.",
      },
    },
    {
      id: "monsoon-calicut",
      place: "calicut",
      year: 1342,
      era: "c. 1342",
      title: "Chinese junks at Calicut",
      scene: "port",
      bands: ["b68", "b912"],
      what: "the Chinese junks at Calicut",
      sources: ["orias-delhi", "bridging-ib", "wiki-treasureship"],
      fact: {
        b68: "Around 1342 Ibn Battuta reached Calicut on India's southwest coast and saw 13 huge Chinese junks in the harbor. Pepper from Kerala drew traders from Arabia, Africa and China.",
        b912: "Calicut, ruled by the Zamorin, was a free port for pepper and cloth. Ibn Battuta (1340s) described big Chinese junks with several decks there, a sign of a sea network from China to East Africa.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A black peppercorn from India's Malabar coast, 1340s.'",
          b912: "Plaque: a pepper sack from a Malabar coast port whose Hindu ruler, the Zamorin, welcomed foreign merchants.",
        },
        witnesses: [
          {
            who: "Dhow sailor",
            look: "sailor",
            kind: "where",
            text: {
              b68: "When the monsoon wind turns, we sail northeast across the Arabian Sea to India's pepper coast.",
              b912: "Ride the southwest monsoon across the Arabian Sea to the Malabar coast: the Zamorin's free port is the pepper market of the world.",
            },
          },
          {
            who: "Merchant",
            look: "merchant",
            kind: "when",
            text: {
              b68: "Ibn Battuta gets there about 10 years after Kilwa, in the 1340s.",
              b912: "About a decade on, in the early 1340s, the same Moroccan traveler waits there for a Chinese junk to carry him to China.",
            },
          },
        ],
        herring: { who: "Pole cutter", look: "worker", text: "Our mangrove poles are straight and strong. Arabia buys them for roofs.", note: "True (a real export!), but no clue." },
        unreliable: {
          who: "Sailor with a yarn",
          look: "sailor",
          text: "Ships can't cross open ocean. Everyone hugs the coast all the way to China.",
          note: "Monsoon sailors crossed open sea for centuries. The others point straight across to India.",
        },
        wrongPlaces: [
          { place: "colombo", kind: "near", why: "Sri Lanka trades cinnamon and gems, but the 13 Chinese junks Ibn Battuta saw were at Calicut." },
          { place: "aden", kind: "place", why: "Aden is a key port, but the great pepper market is on India's Malabar coast." },
          { place: "mogadishu", kind: "place", why: "Mogadishu is a rich Swahili port too, but the pepper thread leads to India." },
        ],
        wrongEras: [
          { era: "300 BCE", year: -300, why: "In 300 BCE Calicut doesn't exist yet. It rises as a port much later." },
          { era: "1750s", year: 1750, why: "By the 1750s European trading companies fought over these waters. Too late!" },
        ],
      },
    },
    {
      id: "monsoon-malacca",
      place: "malacca",
      year: 1400,
      era: "c. 1400",
      title: "A port on the strait",
      scene: "port",
      bands: ["b68", "b912"],
      what: "the founding of Malacca",
      sources: ["wiki-malacca", "nwe-malacca", "brit-malacca"],
      fact: {
        b68: "Around 1400 Parameswara, a prince from Sumatra, founded Malacca on a narrow strait. Ships waited there for the monsoon winds to change, and it grew into a huge trading port.",
        b912: "Malacca (founded c. 1400 by Parameswara) controlled the strait between the Indian Ocean and the South China Sea. Monsoon timing meant long stopovers; its rulers adopted Islam and sought Ming protection.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A tin coin from a new port on a narrow strait, about 1400.'",
          b912: "Plaque: a tin ingot used as money in a port founded around 1400 by a prince from Palembang.",
        },
        witnesses: [
          {
            who: "Junk sailor",
            look: "sailor",
            kind: "where",
            text: {
              b68: "Sail east to the narrow strait between the Malay Peninsula and Sumatra, where the winds meet.",
              b912: "East to the strait between the Malay Peninsula and Sumatra: every ship between India and China must pass there.",
            },
          },
          {
            who: "Spice trader",
            look: "merchant",
            kind: "when",
            text: {
              b68: "Look about 60 years after Ibn Battuta's visit, around 1400.",
              b912: "Around 1400, about sixty years after Ibn Battuta, a prince from Palembang founds a new port there.",
            },
          },
        ],
        herring: { who: "Pepper picker", look: "farmer", text: "Pepper vines climb up trees. Watch your step!", note: "Fun fact, but no clue." },
        unreliable: {
          who: "Rival trader",
          look: "merchant",
          text: "Nobody stops at that strait. Ships sail straight from India to China without waiting.",
          note: "The monsoon schedule forced long waits. That's exactly why a port on the strait grew rich.",
        },
        wrongPlaces: [
          { place: "palembang", kind: "near", why: "Palembang was the old Srivijaya port, and Parameswara came from there, but he founded the new port at Malacca." },
          { place: "quanzhou", kind: "place", why: "Quanzhou is China's great port, but the new port of 1400 is on the Malay strait." },
          { place: "hormuz", kind: "place", why: "Hormuz controls the Persian Gulf, far to the west." },
        ],
        wrongEras: [
          { era: "c. 700", year: 700, why: "In 700 the strait is ruled from Srivijaya, and Malacca doesn't exist yet." },
          { era: "1824", year: 1824, why: "In 1824 Britain took Malacca by treaty. You're over 400 years late!" },
        ],
      },
    },
    {
      id: "monsoon-nanjing",
      place: "nanjing",
      year: 1405,
      era: "1405",
      title: "Zheng He's treasure fleet",
      scene: "port",
      bands: ["b68", "b912"],
      what: "Zheng He's first voyage",
      sources: ["wiki-treasurevoyages", "asia-zhenghe", "mariners-zhenghe"],
      fact: {
        b68: "In 1405 Admiral Zheng He sailed from Nanjing with over 250 ships, sent by the Ming emperor. His seven voyages (1405–1433) reached Malacca, Calicut, Arabia and East Africa.",
        b912: "Zheng He, a Muslim admiral, led seven Ming 'treasure fleet' voyages (1405–1433) for diplomacy and prestige, calling at Malacca, Calicut, Hormuz and Malindi. Then the Ming stopped them.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A giant rudder post from a treasure ship, early 1400s.'",
          b912: "Plaque: an 11-metre rudder post found at an old shipyard by the Yangtze, from fleets that sailed from 1405.",
        },
        witnesses: [
          {
            who: "Ming envoy",
            look: "official",
            kind: "where",
            text: {
              b68: "Go north to the Ming capital on the Yangtze River, where a giant fleet is being built.",
              b912: "North to the Ming capital on the lower Yangtze, where the Longjiang shipyards build the treasure fleet.",
            },
          },
          {
            who: "Shipwright",
            look: "worker",
            kind: "when",
            text: {
              b68: "Just a few years after Malacca begins, in 1405, the fleet sails.",
              b912: "In 1405, the third year of the Yongle emperor, the fleet departs. It will visit Malacca in 1409.",
            },
          },
        ],
        herring: { who: "Bird watcher", look: "scholar", text: "Look at the hornbills! Such big beaks!", note: "Great birds, but no clue." },
        unreliable: {
          who: "Boastful sailor",
          look: "sailor",
          text: "Zheng He's fleet sailed all the way around Africa to Europe!",
          note: "No good evidence. The fleets reached East Africa; claims of more are not supported.",
        },
        wrongPlaces: [
          { place: "beijing", kind: "near", why: "Beijing becomes the Ming capital in 1421. In 1405 the fleet sails from Nanjing." },
          { place: "kyoto", kind: "place", why: "Japan sends trade missions to the Ming, but the fleet starts from China's capital." },
          { place: "malindi", kind: "place", why: "Malindi sends a giraffe to the Ming court in 1415, but the fleet starts in China." },
        ],
        wrongEras: [
          { era: "c. 1300", year: 1300, why: "In 1300 the Yuan (Mongol) dynasty rules China. The Ming and Zheng He are still to come." },
          { era: "1650s", year: 1650, why: "By the 1650s the treasure fleets were long gone, and the Ming had fallen in 1644." },
        ],
      },
    },
    {
      id: "monsoon-gama",
      place: "calicut",
      year: 1498,
      era: "1498",
      title: "Da Gama reaches Calicut",
      scene: "port",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "da Gama reaching Calicut",
      sources: ["hs-gamapilot", "wiki-ibnmajid", "ravenstein-1898"],
      fact: {
        b68: "In 1498 Vasco da Gama reached Calicut after a pilot from Malindi guided his ships across the Arabian Sea. The Portuguese wanted pepper without middlemen; later fleets used cannons to force trade.",
        b912: "Da Gama reached Calicut (May 1498) with a Gujarati pilot hired at Malindi. Calicut's merchants found his gifts poor. Later Portuguese fleets bombarded ports and demanded passes; local rulers and traders resisted for decades.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A stone pillar marker, carried by ships from around Africa, 1490s.'",
          b912: "Plaque: a padrão, a stone cross the Portuguese set up on African coasts; this voyage left Lisbon in 1497.",
        },
        witnesses: [
          {
            who: "Gujarati pilot",
            look: "captain",
            kind: "where",
            text: {
              b68: "Strangers from Portugal round Africa. A pilot guides them from Malindi to India's pepper coast.",
              b912: "After rounding the Cape, the Portuguese hire a pilot at Malindi, who steers them to the Zamorin's port on the Malabar coast.",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b68: "Look about 65 years after the last treasure fleet: 1498.",
              b912: "Some 65 years after the Ming stop sailing, in 1498, ships from the far side of Africa arrive.",
            },
          },
        ],
        herring: { who: "Porcelain painter", look: "weaver", text: "Blue-and-white porcelain is all the fashion!", note: "Beautiful, but no clue." },
        unreliable: {
          who: "Storyteller",
          look: "storyteller",
          text: "The great navigator Ibn Majid himself guided those Portuguese ships!",
          note: "This story first appears around 1560, decades later. Portuguese sources call the pilot a Gujarati. Historians doubt it.",
        },
        wrongPlaces: [
          { place: "bombay", kind: "near", why: "Mumbai's islands are on the same coast, but da Gama landed at Calicut, the pepper port." },
          { place: "malindi", kind: "place", why: "Da Gama found his pilot at Malindi, but his goal was India's pepper port." },
          { place: "lisbon", kind: "place", why: "Lisbon is where he started in 1497, not where he arrived." },
        ],
        wrongEras: [
          { era: "c. 1150", year: 1150, why: "In 1150 no European ship has sailed around Africa." },
          { era: "1700s", year: 1700, why: "By 1700 Dutch, English and French companies competed here. Too late!" },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "monsoon-sc-kilwa",
      bands: ["b68", "b912"],
      bead: "monsoon-kilwa",
      kind: "quoted",
      cite: "Ibn Battuta, Travels in Asia and Africa, translated by H. A. R. Gibb (1929; public domain in the US)",
      passage:
        "The city of Kulwa is one of the finest and most substantially built towns; all the buildings are of wood, and the houses are roofed with dis reeds. The rains there are frequent.",
      prompt: "Archaeologists found that Kilwa's great buildings were made of coral stone, not wood. What should a historian do?",
      choices: [
        "Compare the account with the archaeology",
        "Trust the book and ignore the ruins",
        "Trust the ruins and throw the book away",
        "Decide Kilwa never existed",
      ],
      explanation:
        "Written sources and archaeology check each other. Ibn Battuta's praise fits the ruins, but the 'wood' detail may be a slip, a copying error or about ordinary houses.",
    },
    {
      id: "monsoon-sc-roteiro",
      bands: ["b912"],
      bead: "monsoon-gama",
      kind: "retold",
      cite: "Retold from the anonymous journal of da Gama's first voyage (1497–99)",
      passage:
        "At Calicut the captain sent one of our men ashore. He was taken to two Moors from Tunis who could speak Castilian and Genoese. Their first words were: 'What brought you here?' He answered that we came to look for Christians and spices.",
      prompt: "What does this meeting tell you about Calicut before the Portuguese arrived?",
      choices: [
        "It already had merchants from as far as North Africa",
        "No foreigner had ever visited",
        "Everyone there spoke Portuguese",
        "It had no trade at all",
      ],
      explanation:
        "The Portuguese walked into a busy, international port. They did not 'find' a new world: they joined, and then tried to control, a network that was centuries old.",
    },
  ],
  why: [
    {
      bands: ["b68"],
      prompt: "Why did ships cross the Indian Ocean at certain times of year?",
      choices: ["They rode the seasonal monsoon winds", "They followed whales", "Ice blocked the sea in summer", "Kings banned winter sailing"],
      explanation: "Monsoon winds blow from the southwest in summer and the northeast in winter. Sailors timed voyages to ride them out and back.",
    },
    {
      bands: ["b912"],
      prompt: "Which combination best explains why Malacca grew so quickly after 1400?",
      choices: [
        "Its strait location, monsoon waits and Ming protection",
        "Only Zheng He's giraffe",
        "European colonists built it",
        "It had huge gold mines",
      ],
      explanation:
        "Every ship had to pass the strait, waited there for the winds, and Malacca's rulers won Ming backing against rivals. Geography, climate and diplomacy worked together.",
    },
  ],
};
