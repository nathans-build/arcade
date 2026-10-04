import type { Case } from "@/game/types";

/* Case 3: Zero's Journey. Bhinmal -> Baghdad -> Albelda -> Béjaïa -> Pisa. The Maya pin is a dead end that teaches independent invention. */
export const ZERO: Case = {
  id: "zero",
  n: 3,
  title: "Zero's Journey",
  thread: "zero and the Indian numerals",
  grades: ["6", "8", "9", "10", "11", "12"],
  color: "#6ea0ff",
  brief: {
    b68: "Knot rolled away the ZERO thread! Follow the numerals we use today, zero included, from an astronomer in India to a merchant's book in Italy.",
    b912: "Knot unwound the ZERO thread. Trace the Indian place-value numerals from Brahmagupta to Fibonacci, and learn why another civilization's zero is not on this thread.",
  },
  woven: "Zero and the nine Indian figures moved from India to Baghdad's translators, through al-Andalus and North Africa, into a Pisan merchant's book.",
  beads: [
    {
      id: "zero-bhinmal",
      place: "bhinmal",
      year: 628,
      era: "628",
      title: "Brahmagupta's rules for zero",
      scene: "library",
      bands: ["b68", "b912"],
      what: "Brahmagupta's rules for zero",
      sources: ["mactutor-brahmagupta", "wiki-brahmagupta", "colebrooke-1817"],
      fact: {
        b68: "In 628 Brahmagupta, an astronomer in Bhinmal, wrote rules for zero: a number minus itself is zero, and any number times zero is zero.",
        b912: "Brahmagupta's Brahmasphutasiddhanta (628) gave the first known rules for calculating with zero and with negative numbers ('fortunes' and 'debts'). He got one rule wrong: 0 ÷ 0.",
      },
    },
    {
      id: "zero-baghdad",
      place: "baghdad",
      year: 825,
      era: "c. 825",
      title: "Al-Khwarizmi's book",
      scene: "library",
      bands: ["b68", "b912"],
      what: "al-Khwarizmi's book on Indian numerals",
      sources: ["wiki-khwarizmi", "mactutor-khwarizmi", "ebsco-arabicnumerals"],
      fact: {
        b68: "About 825 al-Khwarizmi, a scholar at Baghdad's House of Wisdom, wrote a book on calculating with Indian numerals, zero included. His name gave us the word 'algorithm.'",
        b912: "Al-Khwarizmi's book on the Hindu numerals (c. 825), written under Caliph al-Ma'mun, survives only in later Latin versions ('Algoritmi de numero Indorum'), which spread place value and zero.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A table of Indian numerals, copied about 200 years after Brahmagupta.'",
          b912: "Plaque: a translator's note: 'Indian astronomy tables, put into Arabic under Caliph al-Ma'mun (ruled 813–833).'",
        },
        witnesses: [
          {
            who: "Merchant",
            look: "merchant",
            kind: "where",
            text: {
              b68: "Indian astronomy books travel west to the Abbasid capital on the Tigris, full of translators.",
              b912: "Sanskrit astronomy reaches the Abbasid court on the Tigris, where translators turn Indian, Persian and Greek works into Arabic.",
            },
          },
          {
            who: "Astronomer",
            look: "scholar",
            kind: "when",
            text: {
              b68: "Look about 200 years after Brahmagupta, when Caliph al-Ma'mun pays scholars to translate.",
              b912: "Two centuries on, in the 820s, a scholar from Khwarazm writes a short book on 'calculating with the Hindu numerals.'",
            },
          },
        ],
        herring: { who: "Elephant keeper", look: "farmer", text: "Our elephants are the strongest in the land!", note: "Impressive, but not about numbers." },
        unreliable: {
          who: "Proud teacher",
          look: "teacher",
          text: "Zero was invented by the Greeks. Everyone else just copied them.",
          note: "Greek astronomers sometimes used a placeholder sign, but rules for zero as a number come from Indian sources like Brahmagupta.",
        },
        wrongPlaces: [
          { place: "damascus", kind: "near", why: "Damascus is a great city, but in the 820s the caliph's translators work in the capital on the Tigris." },
          {
            place: "uaxactun",
            kind: "independent",
            era: "357 CE",
            year: 357,
            why: "The Maya used a zero too, in their Long Count calendar (here by 357 CE). They invented it on their own; no thread links them to India. Great discovery, wrong thread!",
          },
          { place: "constantinople", kind: "place", why: "Byzantine scholars in the 820s still write numbers with Greek letters." },
        ],
        wrongEras: [
          { era: "300 BCE", year: -300, why: "In 300 BCE there is no Baghdad, and Brahmagupta's rules are 900 years away." },
          { era: "1550s", year: 1550, why: "By the 1550s Indian numerals had been used here for 700 years. Too late!" },
        ],
      },
    },
    {
      id: "zero-albelda",
      place: "albelda",
      year: 976,
      era: "976",
      title: "The Codex Vigilanus",
      scene: "library",
      bands: ["b68", "b912"],
      what: "the Codex Vigilanus",
      sources: ["wiki-vigilanus", "ebsco-arabicnumerals", "wiki-arabicnumerals"],
      fact: {
        b68: "In 976 monks at Albelda in northern Spain copied the Codex Vigilanus. It shows the numerals 1 to 9, the first dated ones in Europe, but no zero yet!",
        b912: "The Codex Vigilanus (976), copied by the monks Vigila, Sarracino and García at Albelda, records the nine 'Indian figures' learned through al-Andalus, without zero, which Europeans took up later.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'Nine numerals in a Latin book, about 150 years after al-Khwarizmi.'",
          b912: "Plaque: a monk's note in Latin praising 'the figures of the Indians,' copied in a Christian kingdom in 976.",
        },
        witnesses: [
          {
            who: "Traveler",
            look: "pilgrim",
            kind: "where",
            text: {
              b68: "The numerals travel west through al-Andalus to Christian monks in the hills of northern Spain.",
              b912: "Through al-Andalus, the numerals cross the frontier to a monastery in the Christian kingdom of Pamplona, near the Ebro River.",
            },
          },
          {
            who: "Librarian",
            look: "scribe",
            kind: "when",
            text: {
              b68: "About 150 years after al-Khwarizmi, monks copy the numbers into a big Latin book.",
              b912: "A century and a half later, in the 970s, monks finish a giant book of laws and church councils with the nine figures inside.",
            },
          },
        ],
        herring: { who: "Shepherd", look: "farmer", text: "My sheep find their way home even in fog.", note: "Clever sheep, but no clue." },
        unreliable: {
          who: "Gossip",
          look: "storyteller",
          text: "The numerals came to Europe with Viking traders, up in the far north.",
          note: "No source supports that. The earliest dated European numerals are in Spain, next to al-Andalus.",
        },
        wrongPlaces: [
          { place: "paris", kind: "near", why: "In 976 Paris's scholars still write numbers in Roman numerals." },
          { place: "rome", kind: "place", why: "Rome counts in Roman numerals in 976. The new figures haven't arrived." },
          { place: "london", kind: "place", why: "In 976 English monks count in Roman numerals too." },
        ],
        wrongEras: [
          { era: "c. 500", year: 500, why: "In 500 the numerals haven't left India, and Albelda's monastery won't exist for 400 years." },
          { era: "1600s", year: 1600, why: "By 1600 Europe used these numerals, zero and all. Too late!" },
        ],
      },
    },
    {
      id: "zero-bejaia",
      place: "bejaia",
      year: 1192,
      era: "c. 1192",
      title: "Leonardo learns in Bugia",
      scene: "port",
      bands: ["b68", "b912"],
      what: "Leonardo learning the numerals in Bugia",
      sources: ["mactutor-fibonacci", "wiki-fibonacci", "brit-liberabaci"],
      fact: {
        b68: "Around the 1190s a Pisan boy, Leonardo (later called Fibonacci), lived in Bugia, now Béjaïa, where his father worked for Pisa's merchants. There he learned the Indian numerals, zero included.",
        b912: "Leonardo of Pisa wrote that in Bugia, where his father was a customs notary for Pisan merchants, a teacher introduced him to 'the nine figures of the Indians' and zero. He went on to study them around the Mediterranean.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A merchant's tally in Indian figures, from a North African port, 1190s.'",
          b912: "Plaque: a customs receipt for Pisan cloth, from a port in the Almohad realm, 1190s.",
        },
        witnesses: [
          {
            who: "Sailor",
            look: "sailor",
            kind: "where",
            text: {
              b68: "Italian merchants trade in a busy port on the North African coast, in today's Algeria.",
              b912: "Pisa keeps a customs house in a Maghreb port east of Algiers, under the Almohads; merchants' sons learn to reckon there.",
            },
          },
          {
            who: "Merchant",
            look: "merchant",
            kind: "when",
            text: {
              b68: "Look about 215 years after the monks' book, in the 1190s.",
              b912: "In the 1190s, while Crusaders and Saladin fight in the east, Pisan merchants still trade in this western port.",
            },
          },
        ],
        herring: { who: "Fisher", look: "sailor", text: "The tuna are running! Big ones this year.", note: "Good fishing, but no clue." },
        unreliable: {
          who: "Know-it-all",
          look: "citizen",
          text: "Pisan merchants never trade with Muslim ports. It simply isn't done.",
          note: "Wrong: Pisa had treaties and a customs house in North Africa. Trade crossed religious lines all the time.",
        },
        wrongPlaces: [
          { place: "tunis", kind: "near", why: "Tunis has Italian merchants too, but Leonardo's father worked at the customs house in Bugia." },
          { place: "rome", kind: "place", why: "In the 1190s Rome's clerks count with Roman numerals and the abacus." },
          { place: "venice", kind: "place", why: "Venice's merchants trade in the east, but our Pisan boy learns in North Africa." },
        ],
        wrongEras: [
          { era: "c. 700", year: 700, why: "In 700 there's no Pisan customs house here, and the Indian numerals haven't reached North Africa." },
          { era: "1530s", year: 1530, why: "In the 1500s Spain and the Ottomans fought over Béjaïa. Leonardo lived 300 years before." },
        ],
      },
    },
    {
      id: "zero-pisa",
      place: "pisa",
      year: 1202,
      era: "1202",
      title: "Liber Abaci",
      scene: "library",
      bands: ["b68", "b912"],
      what: "Liber Abaci",
      sources: ["brit-liberabaci", "mactutor-fibonacci", "maa-liberabaci"],
      fact: {
        b68: "In 1202 Leonardo of Pisa (Fibonacci) wrote Liber Abaci, teaching Europeans to calculate with the nine Indian figures and zero. Merchants loved it for accounts and interest.",
        b912: "Liber Abaci (1202, revised 1228) taught Hindu-Arabic numerals and zero through merchants' problems. Its 'rabbit problem' later gave the Fibonacci sequence, which Indian scholars had described much earlier.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A Latin book of reckoning, from a Tuscan sea-trading city, 1202.'",
          b912: "Plaque: a copy of a 1202 Latin manual, revised in 1228, from a Tuscan republic on the Arno River.",
        },
        witnesses: [
          {
            who: "Ship's captain",
            look: "captain",
            kind: "where",
            text: {
              b68: "Leonardo sails home, north to his Italian sea-trading city on the Arno River.",
              b912: "He returns across the Tyrrhenian Sea to his home republic on the Arno, a rival of Genoa and Venice.",
            },
          },
          {
            who: "Merchant",
            look: "merchant",
            kind: "when",
            text: {
              b68: "About ten years after learning in Bugia, he writes his big book, in 1202.",
              b912: "After about a decade of travel and study, Leonardo finishes his book of reckoning in 1202.",
            },
          },
        ],
        herring: { who: "Tower builder", look: "worker", text: "Our new bell tower leans a little. It'll be fine!", note: "True (Pisa's tower began leaning while it was built), but no clue." },
        unreliable: {
          who: "Banker",
          look: "official",
          text: "These Indian numerals are too easy to forge. No banker will ever use them!",
          note: "An opinion. Some cities did restrict them in account books (Florence, 1299), but merchants adopted them anyway.",
        },
        wrongPlaces: [
          { place: "florence", kind: "near", why: "Florence is close by, but Leonardo came from Pisa and wrote there." },
          { place: "genoa", kind: "place", why: "Genoa is Pisa's rival, but Liber Abaci was written in Pisa." },
          { place: "paris", kind: "place", why: "In 1202 Paris's scholars still use the abacus and Roman numerals." },
        ],
        wrongEras: [
          { era: "c. 900", year: 900, why: "In 900 no Pisan has learned the numerals in North Africa. Leonardo isn't born until about 1170." },
          { era: "1750s", year: 1750, why: "By the 1750s Europe used these numerals everywhere. Too late!" },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "zero-sc-leonardo",
      bands: ["b68", "b912"],
      bead: "zero-pisa",
      kind: "retold",
      cite: "Retold from the opening of Leonardo of Pisa's Liber Abaci (1202)",
      passage:
        "My father was a notary at the customs house in Bugia, working for the Pisan merchants there. He had me study arithmetic, and I was taught the nine figures of the Indians. Later I studied them in Egypt, Syria, Greece, Sicily and Provence, and found this method better than any other.",
      prompt: "What does Leonardo's own account tell us about how the numerals spread?",
      choices: [
        "Trade and travel around the Mediterranean spread them",
        "A king ordered everyone to use them",
        "They were invented in Pisa",
        "He learned them from old Roman books",
      ],
      explanation: "Leonardo learned because his family traded in North Africa, then studied in many ports. Merchants' travel carried the numerals.",
    },
    {
      id: "zero-sc-latin",
      bands: ["b912"],
      bead: "zero-baghdad",
      kind: "retold",
      cite: "Retold from the Latin 'Algoritmi de numero Indorum' (1100s copy of al-Khwarizmi)",
      passage:
        "Algoritmi said: the Indians made nine letters for their numbers, and a tenth, a little circle, for a place where there is nothing, so that every number, however large, can be written with these ten.",
      prompt: "The Arabic original of al-Khwarizmi's book is lost. We know it from Latin copies made about 300 years later. What follows?",
      choices: [
        "Copyists may have changed it, so historians compare versions",
        "The book never existed",
        "The Latin copies must be perfect",
        "Al-Khwarizmi must have written in Latin",
      ],
      explanation:
        "Translations and copies can add or change words. Historians compare the surviving Latin versions with other Arabic works to judge what al-Khwarizmi really wrote.",
    },
  ],
  why: [
    {
      bands: ["b68", "b912"],
      prompt: "Which best explains how the Indian numerals reached Europe?",
      choices: ["Translation, scholarship and trade", "One army carried them", "They were found in a cave", "Europeans sailed to India in 1200"],
      explanation: "Baghdad's scholars translated Indian works, the knowledge spread through the Islamic world, and merchants like Leonardo brought it to Italy.",
    },
    {
      bands: ["b912"],
      prompt: "The Maya also used a zero. Why is it NOT a bead on this thread?",
      choices: [
        "They invented it independently, with no link to India",
        "The Maya copied it from India",
        "Fibonacci learned it from the Maya",
        "The Maya zero came after Fibonacci",
      ],
      explanation: "The same idea can be invented separately. The Maya zero (by 36 BCE at Chiapa de Corzo, by some readings) grew on its own; a thread needs a real path of contact.",
    },
  ],
};
