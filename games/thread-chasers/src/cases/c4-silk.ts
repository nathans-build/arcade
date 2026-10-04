import type { Case } from "@/game/types";

/* Case 4: Silk and Steppe. Chang'an -> Samarkand -> Karakorum -> Florence -> Caffa. */
export const SILK: Case = {
  id: "silk",
  n: 4,
  title: "Silk and Steppe",
  thread: "silk and the overland roads",
  grades: ["6", "8", "9", "10", "11", "12"],
  color: "#ff8a2a",
  brief: {
    b68: "Knot tangled the SILK thread! Follow the overland roads west from Han China, through Sogdian merchants and the Mongol steppe, all the way to Italy and the Black Sea.",
    b912: "Knot snarled the SILK AND STEPPE thread. Follow the overland routes from Zhang Qian to the Mongol peace, and see how the same roads that carried silk carried plague in the 1340s.",
  },
  woven: "Silk and news moved west from Han China through Sogdian middlemen and Mongol relay posts to Italian bankers; in the 1340s plague moved along the same routes.",
  beads: [
    {
      id: "silk-changan",
      place: "changan",
      year: -138,
      era: "138 BCE",
      title: "Zhang Qian rides west",
      scene: "court",
      bands: ["b68", "b912"],
      what: "Zhang Qian's mission west",
      sources: ["wiki-zhangqian", "whe-silkroad", "ebsco-silkroad"],
      fact: {
        b68: "In 138 BCE Emperor Wu of Han sent Zhang Qian west from Chang'an to find allies. Captured and gone 13 years, he came back with news of rich lands, and Han trade with Central Asia grew.",
        b912: "Zhang Qian's mission (138–126 BCE) failed to win an alliance against the Xiongnu, but his reports on Ferghana, Bactria and their horses led Han emperors to open routes west, where Chinese silk became a prized trade good.",
      },
    },
    {
      id: "silk-samarkand",
      place: "samarkand",
      year: 660,
      era: "c. 660",
      title: "The Hall of the Ambassadors",
      scene: "court",
      bands: ["b68", "b912"],
      what: "the Sogdian court at Samarkand",
      sources: ["wiki-afrasiab", "bm-sogdians", "iranica-samarqand"],
      fact: {
        b68: "Around 660 King Varkhuman of Samarkand had a hall painted with visitors from China, Korea and beyond. Sogdian merchants from Samarkand carried silk along the whole Silk Road.",
        b912: "The Afrasiab 'Ambassadors' Painting' (c. 660) shows envoys from Tang China and Korea at Varkhuman's Sogdian court. Sogdians were the Silk Road's great middlemen, with communities from Samarkand to Chang'an.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'Painted envoys in silk robes, about 800 years after Zhang Qian.'",
          b912: "Plaque: a mural fragment of envoys in silk robes, from a Sogdian king's reception hall, mid-600s CE.",
        },
        witnesses: [
          {
            who: "Silk merchant",
            look: "merchant",
            kind: "where",
            text: {
              b68: "The silk goes west over the mountains to the Sogdians' oasis city on the Zeravshan River.",
              b912: "Bales go west past Dunhuang and the Pamirs to Sogdiana's chief city, home of the road's greatest merchants.",
            },
          },
          {
            who: "Envoy",
            look: "envoy",
            kind: "when",
            text: {
              b68: "Look about 800 years later, when the Tang dynasty rules China and sends envoys west.",
              b912: "Eight centuries on, in the 600s, a Sogdian king paints Tang envoys on the walls of his hall.",
            },
          },
        ],
        herring: { who: "Horse trader", look: "rider", text: "The 'heavenly horses' of Ferghana run like the wind!", note: "Famous horses, but not where the silk goes next." },
        unreliable: {
          who: "Court poet",
          look: "scholar",
          text: "Silk only ever went to the west by sea. The land roads never mattered.",
          note: "Some silk went by sea, but overland routes through Central Asia mattered greatly. The others agree.",
        },
        wrongPlaces: [
          { place: "bukhara", kind: "near", why: "Bukhara is a Sogdian city too, but the famous painted hall of envoys is in Samarkand." },
          { place: "baghdad", kind: "place", why: "In 660 there is no Baghdad. It will be founded in 762." },
          { place: "rome", kind: "place", why: "In 660 Rome is a shrunken city. Silk reaches Europe mainly through Constantinople." },
        ],
        wrongEras: [
          { era: "300 BCE", year: -300, why: "In 300 BCE no Chinese emperor has sent anyone west yet. Too early!" },
          { era: "c. 1400", year: 1400, why: "By 1400 Samarkand is Timur's capital, and the Sogdian merchants and their language have faded." },
        ],
      },
    },
    {
      id: "silk-karakorum",
      place: "karakorum",
      year: 1254,
      era: "1254",
      title: "Relay posts to Karakorum",
      scene: "steppe",
      bands: ["b68", "b912"],
      what: "Rubruck's visit to Karakorum",
      sources: ["wiki-rubruck", "zilivinskaia-yam", "rockhill-1900"],
      fact: {
        b68: "In 1254 the friar William of Rubruck reached Karakorum, the Mongol capital, riding the yam: relay posts with fresh horses. Mongol rule made the steppe roads safer for trade.",
        b912: "Rubruck (1254) found Karakorum smaller than a French village yet home to Chinese, Muslim, Christian and Buddhist people. The yam relay system linked the empire; merchants and envoys moved under Mongol protection.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A paiza: a metal pass for the relay posts, 1250s.'",
          b912: "Plaque: a paiza travel tablet letting its holder take fresh horses at relay stations, issued in the 1250s.",
        },
        witnesses: [
          {
            who: "Rider",
            look: "rider",
            kind: "where",
            text: {
              b68: "Ride northeast across the steppe to the Great Khan's capital, by the Orkhon River.",
              b912: "Northeast past the Altai to the Great Khan's capital in the Orkhon valley, where envoys arrive from Europe to Korea.",
            },
          },
          {
            who: "Envoy",
            look: "envoy",
            kind: "when",
            text: {
              b68: "Go about 600 years later, to the 1250s, when the Mongols rule from China to Russia.",
              b912: "About six centuries on: the 1250s, after the Mongol conquests, when Möngke is Great Khan.",
            },
          },
        ],
        herring: { who: "Melon seller", look: "farmer", text: "Samarkand melons are the sweetest. Try one!", note: "Sweet, but no clue." },
        unreliable: {
          who: "Frightened traveler",
          look: "pilgrim",
          text: "The Mongols wrecked every road. No one can travel east anymore.",
          note: "The conquests were terribly destructive, but afterwards Mongol relay posts made long trips easier. The others agree on the khan's capital.",
        },
        wrongPlaces: [
          { place: "beijing", kind: "near", why: "Beijing becomes Kublai Khan's capital later, in the 1260s–1270s. In 1254 the Great Khan rules from Karakorum." },
          { place: "sarai", kind: "place", why: "Sarai is the Golden Horde's camp-city in the west. Rubruck passed by, but the Great Khan was at Karakorum." },
          { place: "dunhuang", kind: "place", why: "Dunhuang is a Silk Road oasis, but the Great Khan's court is far to the north." },
        ],
        wrongEras: [
          { era: "c. 500", year: 500, why: "In 500 there is no Mongol Empire and no Karakorum. It is founded around 1220." },
          { era: "1850s", year: 1850, why: "By the 1850s Karakorum was ruins, beside the Erdene Zuu monastery built from its stones." },
        ],
      },
    },
    {
      id: "silk-florence",
      place: "florence",
      year: 1340,
      era: "c. 1340",
      title: "A banker's handbook",
      scene: "city",
      bands: ["b68", "b912"],
      what: "Pegolotti's merchant handbook",
      sources: ["wiki-pegolotti", "yule-1866", "mdpi-silkroute"],
      fact: {
        b68: "Around 1340 the Florentine banker Francesco Pegolotti wrote a merchant's handbook. It said the road from Tana to China was 'perfectly safe,' by day or night, while the Mongols ruled it.",
        b912: "Pegolotti, an agent of Florence's Bardi bank, compiled the Pratica della mercatura (c. 1335–43): routes, money and weights from Tana on the Sea of Azov to Cathay. He reported, from merchants, that the road was 'perfectly safe.'",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A banker's handbook in Italian, about 85 years after Rubruck.'",
          b912: "Plaque: a page of a Tuscan banker's handbook converting Genoese and Cathay money, 1330s–1340s.",
        },
        witnesses: [
          {
            who: "Italian merchant",
            look: "merchant",
            kind: "where",
            text: {
              b68: "News of the safe road reaches the bankers of Florence, a wool and banking city inland in Tuscany.",
              b912: "Reports flow back through Tana and Genoa's colonies to the great banks of an inland Tuscan city on the Arno, like the Bardi.",
            },
          },
          {
            who: "Envoy",
            look: "envoy",
            kind: "when",
            text: {
              b68: "About 85 years after Rubruck, while the Mongol peace still holds.",
              b912: "In the 1330s–1340s, the last years of the Mongol peace, before plague and civil wars break the road.",
            },
          },
        ],
        herring: { who: "Yak herder", look: "farmer", text: "My yaks give milk, wool and good company.", note: "Lovely yaks, but no clue." },
        unreliable: {
          who: "Venetian rival",
          look: "merchant",
          text: "Only Venetians know the road to Cathay. Marco Polo's family kept it secret!",
          note: "Many Italians traveled it, and a Florentine wrote a whole guide to it. Rivals exaggerate.",
        },
        wrongPlaces: [
          { place: "pisa", kind: "near", why: "Pisa sits on the Arno too, but Pegolotti worked for Florence's Bardi bank." },
          { place: "venice", kind: "place", why: "Venetians traded east too, but this handbook is by a Florentine banker." },
          { place: "genoa", kind: "place", why: "Genoa runs the colonies at Caffa and Tana, but this handbook comes from a Florentine banker." },
        ],
        wrongEras: [
          { era: "c. 800", year: 800, why: "In 800 Florence's great banks don't exist, and the Mongols are 400 years away." },
          { era: "1490s", year: 1495, why: "By the 1490s the Mongol road had broken up. Merchants were looking for sea routes." },
        ],
      },
    },
    {
      id: "silk-caffa",
      place: "caffa",
      year: 1346,
      era: "1346",
      title: "Plague at Caffa",
      scene: "port",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "the siege of Caffa",
      sources: ["wiki-caffa", "cdc-wheelis", "bulletin-caffa"],
      fact: {
        b68: "In 1346 an army of the Golden Horde besieged Caffa, a Genoese trading port on the Black Sea. Plague broke out, and ships from the region carried it toward the Mediterranean: the Black Death.",
        b912: "During the Golden Horde's siege of Genoese Caffa (1346), plague struck. Gabriele de' Mussi's famous story of how it entered the city was written by someone who was not there, and historians doubt it. Trade ships helped spread the Black Death.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A Genoese trading seal from a Black Sea port, 1340s.'",
          b912: "Plaque: a Genoese consul's seal from a walled port on the Crimean coast, mid-1340s.",
        },
        witnesses: [
          {
            who: "Genoese sailor",
            look: "sailor",
            kind: "where",
            text: {
              b68: "Follow the trade back east, to Genoa's walled port on the Crimea, on the Black Sea.",
              b912: "East past Constantinople to Genoa's chief colony on the Crimean coast, where steppe caravans meet Black Sea ships.",
            },
          },
          {
            who: "Merchant",
            look: "merchant",
            kind: "when",
            text: {
              b68: "Just a few years after the banker's handbook, in the mid-1340s.",
              b912: "Within a decade of the handbook, in 1346, the Golden Horde's khan Janibeg lays siege there.",
            },
          },
        ],
        herring: { who: "Wool merchant", look: "merchant", text: "Florence's wool cloth sells everywhere!", note: "True, but no clue." },
        unreliable: {
          who: "Notary from Piacenza",
          look: "scribe",
          text: "I can tell you exactly what happened inside those walls!",
          note: "Gabriele de' Mussi stayed in Piacenza; he was not there. Treat his story as secondhand.",
        },
        wrongPlaces: [
          { place: "tana", kind: "near", why: "Tana was attacked in 1343, but the famous 1346 siege was at Caffa." },
          { place: "constantinople", kind: "place", why: "Constantinople is a stop on the way. The 1346 siege was at Caffa." },
          { place: "messina", kind: "place", why: "Plague reached Messina in Sicily in 1347, the next year. First came the siege at Caffa." },
        ],
        wrongEras: [
          { era: "c. 1100", year: 1100, why: "In 1100 there is no Genoese Caffa. It was founded in the late 1200s." },
          { era: "1600s", year: 1600, why: "By 1600 Caffa had been an Ottoman port for over a century." },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "silk-sc-pegolotti",
      bands: ["b68", "b912"],
      bead: "silk-florence",
      kind: "quoted",
      cite: "Pegolotti, Pratica della mercatura (c. 1340), in Henry Yule's translation, Cathay and the Way Thither (1866, public domain)",
      passage:
        "The road you travel from Tana to Cathay is perfectly safe, whether by day or by night, according to what the merchants say who have used it.",
      prompt: "Pegolotti says the road is safe 'according to what the merchants say.' What does that tell you?",
      choices: [
        "He reports other people's experience, not his own trip",
        "He rode the whole road himself",
        "He invented the road",
        "No merchant had ever used it",
      ],
      explanation: "Pegolotti gathered information from merchants. That is useful evidence of what traders believed, but it is secondhand: historians look for other sources too.",
    },
    {
      id: "silk-sc-rubruck",
      bands: ["b912"],
      bead: "silk-karakorum",
      kind: "retold",
      cite: "Retold from William of Rubruck's report to King Louis IX (1255)",
      passage:
        "As for the city of Karakorum, apart from the khan's palace it is not as big as the village of Saint-Denis. There are two quarters: one of the Muslims, where the markets are, and one of the Chinese, who are all craftsmen. There are twelve temples of different peoples, two mosques and one church.",
      prompt: "Rubruck compares Karakorum with Saint-Denis, a place near Paris. What does that show about his account?",
      choices: [
        "He measures the Mongol capital by what he knew at home",
        "He had never seen any town before",
        "Karakorum was in France",
        "He invented the whole city",
      ],
      explanation:
        "Travelers explain new places through familiar ones, so 'small' means small to a Frenchman. His details about many peoples and faiths still show how connected the capital was.",
    },
  ],
  why: [
    {
      bands: ["b68"],
      prompt: "Why did silk keep moving west along the Silk Road for centuries?",
      choices: ["Merchants could sell it far away for a profit", "Pilgrims carried it to Mecca", "It floated down the rivers", "Farmers planted it everywhere"],
      explanation: "Silk was light, valuable and made in China. Sogdian, Persian and later Italian merchants passed it west because buyers far away paid high prices.",
    },
    {
      bands: ["b912"],
      prompt: "Which combination best explains why plague moved along the same roads as silk in the 1340s?",
      choices: [
        "Busy trade routes, ships and an army camped at a port",
        "Only the Mongols' cruelty",
        "Marco Polo's book",
        "Silk cloth itself caused the disease",
      ],
      explanation:
        "Plague bacteria travel with fleas, rats and people. The connected trade network, a siege at a busy port and ships to the Mediterranean all helped it spread.",
    },
  ],
};
