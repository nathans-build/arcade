import type { Case } from "@/game/types";

/* Case 7: Steam and Cotton. Watt (Glasgow) -> Manchester -> the cotton South -> Liverpool–Manchester railway -> Bombay -> Tomioka. */
export const STEAM: Case = {
  id: "steam",
  n: 7,
  title: "Steam and Cotton",
  thread: "steam power and cotton",
  grades: ["7", "8", "9", "10", "11", "12"],
  color: "#aaaaaa",
  brief: {
    b68: "Knot jammed the STEAM AND COTTON thread! Follow the steam engine and the cotton it spun, from a Scottish workshop to a mill in Japan, and the people whose labor fed it.",
    b912: "Knot snarled the STEAM AND COTTON thread. Trace how steam power, slave-grown cotton, railways and global markets linked Glasgow, Mississippi, Bombay and Meiji Japan.",
  },
  woven: "Steam power and cotton tied Britain's mills to enslaved labor in the US South, to India's farms and to Japan's new factories: industry made the world more connected and more unequal.",
  beads: [
    {
      id: "steam-glasgow",
      place: "glasgow",
      year: 1769,
      era: "1769",
      title: "Watt's separate condenser",
      scene: "workshop",
      bands: ["b68", "b912"],
      what: "Watt's steam engine patent",
      sources: ["sciencemuseum-watt", "brit-watt", "inverclyde-watt"],
      fact: {
        b68: "In 1765, walking on Glasgow Green, James Watt had the idea of a separate condenser for steam engines. His 1769 patent made engines use far less coal, which helped power factories.",
        b912: "Watt's separate condenser (idea 1765, patent January 1769) cut the fuel waste of Newcomen engines. With Matthew Boulton in Birmingham he later built engines that could turn machinery, not just pump water.",
      },
    },
    {
      id: "steam-manchester",
      place: "manchester",
      year: 1782,
      era: "1782",
      title: "Cottonopolis",
      scene: "mill",
      bands: ["b68", "b912"],
      what: "Manchester's first steam cotton mill",
      sources: ["wiki-shudehill", "tandf-shudehill", "wiki-cottonopolis"],
      fact: {
        b68: "In 1782 Richard Arkwright built Manchester's first steam-powered cotton mill at Shudehill. Manchester grew into 'Cottonopolis,' with mills full of workers, including many children.",
        b912: "Arkwright's Shudehill Mill (1782) used a steam engine to raise water for its wheel: the start of Manchester's mill boom. Hours were long and child labor common until reform laws, starting in 1833.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A bobbin from a five-storey cotton mill, 1780s.'",
          b912: "Plaque: a mill wage book from a Lancashire town on the River Irwell, 1780s.",
        },
        witnesses: [
          {
            who: "Engineer",
            look: "worker",
            kind: "where",
            text: {
              b68: "Steam power moves south to the cotton towns of Lancashire, in northern England.",
              b912: "South to Lancashire's damp valleys, ideal for spinning cotton thread, to the town on the River Irwell.",
            },
          },
          {
            who: "Instrument maker",
            look: "scholar",
            kind: "when",
            text: {
              b68: "About 13 years after Watt's patent, a steam-powered cotton mill opens there.",
              b912: "In the early 1780s Richard Arkwright, inventor of the water frame, builds a mill there, away from any fast river.",
            },
          },
        ],
        herring: { who: "Fishmonger", look: "worker", text: "Fresh herring from the Clyde!", note: "Fresh fish, but no clue." },
        unreliable: {
          who: "Rival inventor",
          look: "citizen",
          text: "Steam engines will never beat waterwheels for running mills.",
          note: "An opinion that proved wrong: steam soon powered mills everywhere.",
        },
        wrongPlaces: [
          { place: "leeds", kind: "near", why: "Leeds becomes a wool town. The first steam cotton mill we want is in Manchester." },
          { place: "birmingham", kind: "place", why: "Watt's engines were built in Birmingham, but the cotton mill boom is in Manchester." },
          { place: "lowell", kind: "place", why: "Lowell's cotton mills open in the 1820s, in the United States. Too far, too soon!" },
        ],
        wrongEras: [
          { era: "c. 1600", year: 1600, why: "In 1600 there are no steam engines, and Manchester is a small market town." },
          { era: "1950s", year: 1950, why: "By the 1950s Manchester's cotton mills were closing. Too late!" },
        ],
      },
    },
    {
      id: "steam-south",
      place: "natchez",
      year: 1825,
      era: "1820s",
      title: "Cotton and slavery",
      scene: "fields",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "slave-grown cotton in the Mississippi Valley",
      sources: ["loc-mappingslavery", "census-1860", "wiki-antebellum"],
      fact: {
        b68: "British mills needed raw cotton. By the 1820s most of it came from the US South, grown and picked by enslaved African Americans, who resisted however they could. By 1860 about 4 million people were enslaved in the US.",
        b912: "After the cotton gin (1793), cotton spread across Mississippi and Alabama on land taken from Native nations. Enslaved people were forced west to grow it and resisted by escape, slowdowns and keeping their culture. The 1860 census counted about 3.95 million enslaved people.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A cotton bale tag: shipped from a river port on the Mississippi, 1820s.'",
          b912: "Plaque: a bale tag from a bluff-top river town in the cotton South, 1820s, bound for Liverpool.",
        },
        witnesses: [
          {
            who: "Cotton broker",
            look: "merchant",
            kind: "where",
            text: {
              b68: "The mills' raw cotton comes from plantations along the Mississippi River in the US South.",
              b912: "It is grown in the lower Mississippi Valley, on land taken from the Choctaw and Chickasaw nations, by enslaved people.",
            },
          },
          {
            who: "Mill clerk",
            look: "scribe",
            kind: "when",
            text: {
              b68: "Look in the 1820s, when the US South grows most of Britain's cotton.",
              b912: "By the 1820s, a generation after the cotton gin, the US South supplies most of Britain's raw cotton.",
            },
          },
        ],
        herring: { who: "Mill mechanic", look: "worker", text: "Oil the gears and the machines run smooth!", note: "Good advice, but no clue." },
        unreliable: {
          who: "Mill owner",
          look: "official",
          text: "Our cotton comes from happy farms. Nobody there is forced to work.",
          note: "False and self-serving. Laws, records and the testimony of formerly enslaved people show cotton was grown by forced labor.",
        },
        wrongPlaces: [
          { place: "neworleans", kind: "near", why: "New Orleans is the port that ships the cotton. The plantations are upriver." },
          { place: "lowell", kind: "place", why: "Lowell spins cotton in the 1820s. It doesn't grow it." },
          { place: "washington", kind: "place", why: "Congress meets in Washington, but this cotton was grown in the Deep South." },
        ],
        wrongEras: [
          { era: "c. 1650", year: 1650, why: "In 1650 the cotton gin is 140 years away, and this valley is the homeland of Native nations." },
          { era: "1950s", year: 1950, why: "By the 1950s machines picked cotton here, and slavery had ended in 1865." },
        ],
      },
    },
    {
      id: "steam-railway",
      place: "liverpool",
      year: 1830,
      era: "1830",
      title: "The first inter-city railway",
      scene: "city",
      bands: ["b68", "b912"],
      what: "the Liverpool and Manchester Railway",
      sources: ["wiki-lmr-opening", "msi-liverpoolroad", "steamlocos-lmr"],
      fact: {
        b68: "On 15 September 1830 the Liverpool and Manchester Railway opened, the first inter-city steam railway. It carried cotton from Liverpool's docks to Manchester's mills, and passengers too.",
        b912: "The L&MR (1830), engineered by George Stephenson, linked Britain's main cotton port to its mill city with timetabled steam trains, double track and stations: the model for railways worldwide.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A ticket for a steam train between two English cities, 1830.'",
          b912: "Plaque: a first-class ticket for a steam line from the Mersey docks inland, opened in September 1830.",
        },
        witnesses: [
          {
            who: "Ship captain",
            look: "captain",
            kind: "where",
            text: {
              b68: "Cotton ships cross the Atlantic to the port of Liverpool, and a new railway runs inland.",
              b912: "Bales cross to the Mersey docks; a new steam railway carries them about 30 miles inland to the mills.",
            },
          },
          {
            who: "Steamboat pilot",
            look: "sailor",
            kind: "when",
            text: {
              b68: "Look at 1830, when the first inter-city steam trains run.",
              b912: "In 1830, the year a locomotive named Rocket helps open the line.",
            },
          },
        ],
        herring: { who: "Riverboat cook", look: "worker", text: "Catfish stew tonight! Come and get it!", note: "Sounds good, but no clue." },
        unreliable: {
          who: "Canal owner",
          look: "official",
          text: "Railways are a fad. Our canal will always carry the cotton.",
          note: "Self-interest: canal owners stood to lose business to the railway, and they did.",
        },
        wrongPlaces: [
          { place: "dublin", kind: "near", why: "Dublin's first railway opens in 1834. The first inter-city line joins Liverpool and Manchester." },
          { place: "london", kind: "place", why: "London's first railway opens in 1836. This one starts at Liverpool's docks." },
          { place: "boston", kind: "place", why: "Boston's first railways come in the mid-1830s. The first inter-city steam line is in England." },
        ],
        wrongEras: [
          { era: "c. 1700", year: 1700, why: "In 1700 no steam locomotive exists. Cotton moves by cart and river." },
          { era: "1960s", year: 1960, why: "By the 1960s diesel trains ran here. Too late!" },
        ],
      },
    },
    {
      id: "steam-bombay",
      place: "bombay",
      year: 1863,
      era: "1860s",
      title: "Bombay's cotton boom",
      scene: "port",
      bands: ["b912"],
      what: "Bombay's cotton boom",
      sources: ["wiki-cottonfamine", "revealing-cottonfamine", "nyfed-cottonfamine"],
      fact: {
        b912: "When the US Civil War (1861–65) cut off Southern cotton, Lancashire mills turned to India and Egypt. Bombay's cotton exports more than doubled, sparking a boom and then a crash when the war ended. Lancashire workers faced the 'Cotton Famine.'",
      },
      find: {
        plaque: {
          b912: "Plaque: a Liverpool broker's note: 'American bales blocked. Buy Surat cotton,' 1860s.",
        },
        witnesses: [
          {
            who: "Cotton broker",
            look: "merchant",
            kind: "where",
            text: {
              b912: "With Southern ports blockaded, buyers turn to western India's cotton, shipped from its island port on the Arabian Sea.",
            },
          },
          {
            who: "Mill worker",
            look: "worker",
            kind: "when",
            text: {
              b912: "Look at 1861–1865, during the American Civil War, when Lancashire's mills fall silent.",
            },
          },
        ],
        unreliable: {
          who: "Speculator",
          look: "official",
          text: "Cotton prices will rise forever. Buy, buy, buy!",
          note: "Bubble talk: prices crashed when the war ended in 1865.",
        },
        wrongPlaces: [
          { place: "colombo", kind: "near", why: "Ceylon grows coffee in the 1860s, not the cotton the mills want." },
          { place: "calicut", kind: "place", why: "Calicut is on India's coast too, but the 1860s cotton boom centred on Bombay." },
          { place: "guangzhou", kind: "place", why: "China exports tea and silk. The mills' new cotton came from India." },
        ],
        wrongEras: [
          { era: "c. 1700", year: 1700, why: "In 1700 Bombay is a small East India Company base. No cotton boom yet." },
          { era: "1947", year: 1947, why: "In 1947 India won independence. The cotton boom was over 80 years before." },
        ],
      },
    },
    {
      id: "steam-tomioka",
      place: "tomioka",
      year: 1872,
      era: "1872",
      title: "Tomioka Silk Mill",
      scene: "mill",
      bands: ["b68", "b912"],
      what: "the Tomioka Silk Mill",
      sources: ["wiki-tomioka", "nippon-tomioka", "govjp-tomioka"],
      fact: {
        b68: "In 1872 Japan's new Meiji government opened the Tomioka Silk Mill with French machines and a French engineer, Paul Brunat. Young women trained there, then spread the skills across Japan.",
        b912: "Meiji Japan industrialized fast to stay independent of Western empires. Tomioka (1872), a state silk-reeling mill with French equipment, trained young women who carried factory methods home; silk became a top export.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'Raw silk reeled by machine in a brick mill northwest of Tokyo, 1872.'",
          b912: "Plaque: a brick from a state mill in Gunma, built in 1872 with French steam-powered reeling machines.",
        },
        witnesses: [
          {
            who: "Traveler",
            look: "envoy",
            kind: "where",
            text: {
              b68: "Steam factories spread to Japan, to a new silk mill in the hills northwest of Tokyo.",
              b912: "Industry leaps to East Asia: Japan's new government builds a model silk mill in Gunma, northwest of Tokyo.",
            },
          },
          {
            who: "Merchant",
            look: "merchant",
            kind: "when",
            text: {
              b68: "Look at 1872, a few years after Japan's Meiji Restoration in 1868.",
              b912: "Four years after the 1868 Meiji Restoration, while Japanese envoys tour Western factories.",
            },
          },
        ],
        herring: { who: "Tea seller", look: "merchant", text: "Strong tea keeps the night shift awake!", note: "Maybe, but no clue." },
        unreliable: {
          who: "Foreign visitor",
          look: "envoy",
          text: "Japanese workers could never run modern mills by themselves.",
          note: "Prejudice, not evidence. Japanese engineers and workers soon ran and improved the mills themselves.",
        },
        wrongPlaces: [
          { place: "osaka", kind: "near", why: "Osaka's big cotton-spinning mills come in the 1880s. The 1872 model silk mill is at Tomioka." },
          { place: "lyon", kind: "place", why: "Lyon was France's silk capital, but the 1872 mill was built in Japan." },
          { place: "guangzhou", kind: "place", why: "China's silk is famous too, but this 1872 model mill is in Japan." },
        ],
        wrongEras: [
          { era: "1600", year: 1600, why: "In 1600 Japan has no steam mills; it's the year of the Battle of Sekigahara." },
          { era: "2014", year: 2014, why: "In 2014 Tomioka became a UNESCO World Heritage Site: a museum, not a working mill. Too late!" },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "steam-sc-northup",
      bands: ["b68", "b912"],
      bead: "steam-south",
      kind: "retold",
      cite: "Retold from Solomon Northup, Twelve Years a Slave (1853)",
      passage:
        "The hands must be in the cotton field as soon as it is light in the morning. Except for a short rest at noon, they are not allowed to stop until it is too dark to see. Each person's cotton is weighed at night, and whoever brings in less than the set amount is punished.",
      prompt: "Northup was a free Black man from New York who was kidnapped and enslaved in Louisiana for 12 years. Why is his account so valuable?",
      choices: [
        "He describes cotton labor from his own experience",
        "He owned a cotton plantation",
        "He wrote it before the cotton gin",
        "It is a made-up story",
      ],
      explanation:
        "Narratives by people who were enslaved are first-hand evidence that planters' records leave out. Historians read them alongside other sources, but they center the voices of the people who did the work.",
    },
    {
      id: "steam-sc-tocqueville",
      bands: ["b912"],
      bead: "steam-manchester",
      kind: "retold",
      cite: "Retold from Alexis de Tocqueville's notes on visiting Manchester (1835)",
      passage:
        "From this filthy drain the greatest stream of human industry flows out to enrich the whole world. From this foul sewer pure gold flows. Here humanity reaches its most complete development and its most brutal; here civilization works its wonders, while the people who work here are worn down almost beyond recognition.",
      prompt: "Tocqueville praises and condemns Manchester in the same breath. What does that suggest?",
      choices: [
        "Industry brought great wealth and great misery together",
        "He never really visited",
        "Manchester was clean and quiet",
        "He only cared about gold",
      ],
      explanation:
        "Observers saw both sides of the Industrial Revolution: huge production and profit beside crowded, polluted, dangerous lives for workers.",
    },
  ],
  why: [
    {
      bands: ["b68"],
      prompt: "Why did cotton travel from the US South to Manchester?",
      choices: ["British mills needed raw cotton to spin", "Manchester grew no food", "The South had no ships", "It was a gift"],
      explanation: "Steam-powered mills could spin huge amounts of thread. Britain grew no cotton, so it bought slave-grown cotton from the US South.",
    },
    {
      bands: ["b912"],
      prompt: "What linked Mississippi plantations, Liverpool docks and Manchester mills?",
      choices: [
        "Demand for cotton, slavery, steam transport and finance",
        "Only Watt's engine",
        "Free trade with China",
        "The Meiji Restoration",
      ],
      explanation:
        "Industrialization was a global system: forced labor grew the cotton, ships and railways moved it, banks financed it and mills turned it into cloth sold worldwide.",
    },
  ],
};
