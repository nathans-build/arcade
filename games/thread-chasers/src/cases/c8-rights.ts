import type { Case } from "@/game/types";

/*
 * Case 8: Rights on the Move. Magna Carta -> Locke -> the 1789 Declaration -> Haiti -> Bolívar -> the UDHR -> South Africa 1994.
 * Fact correction: the 1789 Declaration was adopted at Versailles (the Assembly moved to Paris in October 1789).
 * The UDHR bead states, as a fact, that it followed the Second World War and the Holocaust (no Holocaust stop in the chase).
 */
export const RIGHTS: Case = {
  id: "rights",
  n: 8,
  title: "Rights on the Move",
  thread: "ideas about rights",
  grades: ["7", "8", "9", "10", "11", "12"],
  color: "#e3262f",
  brief: {
    b68: "Knot frayed the RIGHTS thread! Follow the idea that rulers must obey laws and that people have rights, from a meadow in England to a ballot box in South Africa.",
    b912: "Knot pulled the RIGHTS thread apart. Trace limited government and natural rights from Magna Carta to 1994, and see how people the first declarations left out claimed those rights for themselves.",
  },
  woven: "Ideas about limits on rulers and rights for all moved from Runnymede and Locke to France, Haiti, South America, the UN and South Africa, each time widened by people who had been left out.",
  beads: [
    {
      id: "rights-runnymede",
      place: "runnymede",
      year: 1215,
      era: "1215",
      title: "Magna Carta",
      scene: "fields",
      bands: ["b68", "b912"],
      what: "Magna Carta",
      sources: ["magnacarta-project", "bl-magnacarta", "consource-magnacarta"],
      fact: {
        b68: "In June 1215, at Runnymede, rebel barons forced King John to agree to Magna Carta. It said even the king must follow the law; clause 39 promised no free man would be jailed without lawful judgment.",
        b912: "Magna Carta (15 June 1215) was a peace deal between King John and rebel barons, cancelled by the pope within months. Reissued later, its promise of lawful judgment (clause 39) became a symbol of limited government, though at first it protected mainly free men.",
      },
    },
    {
      id: "rights-locke",
      place: "london",
      year: 1689,
      era: "1689",
      title: "Locke's Two Treatises",
      scene: "library",
      bands: ["b912"],
      what: "Locke's Two Treatises of Government",
      sources: ["wiki-twotreatises", "brit-twotreatises", "gutenberg-locke"],
      fact: {
        b912: "John Locke's Two Treatises of Government (published without his name in late 1689, dated 1690) argued people have natural rights to life, liberty and property, and may replace a government that breaks their trust. It followed the Glorious Revolution and the 1689 Bill of Rights.",
      },
      find: {
        plaque: {
          b912: "Plaque: an anonymous book printed by Awnsham Churchill, after a revolution that crowned William and Mary.",
        },
        witnesses: [
          {
            who: "Law clerk",
            look: "scribe",
            kind: "where",
            text: {
              b912: "Ideas of limited government return to the capital on the Thames, where Parliament has just offered the crown to William and Mary.",
            },
          },
          {
            who: "Bookseller",
            look: "merchant",
            kind: "when",
            text: {
              b912: "Almost 475 years after Runnymede, in the winter of 1689, a philosopher back from exile in Holland publishes without his name.",
            },
          },
        ],
        unreliable: {
          who: "Royal courtier",
          look: "official",
          text: "Kings rule by God's will alone. No book will ever change that.",
          note: "An opinion (the 'divine right' of kings, argued by Robert Filmer), which Locke's book was written to refute.",
        },
        wrongPlaces: [
          { place: "oxford", kind: "near", why: "Locke studied and taught at Oxford, but in 1689 he published in London." },
          { place: "amsterdam", kind: "place", why: "Locke lived in exile in Holland, but he came home in 1689 to publish in London." },
          { place: "paris", kind: "place", why: "Paris in 1689 is ruled by Louis XIV, an absolute king. Not here!" },
        ],
        wrongEras: [
          { era: "c. 1300", year: 1300, why: "In 1300 Locke won't be born for over 300 years." },
          { era: "1850s", year: 1850, why: "By the 1850s Locke's ideas were 160 years old. Too late!" },
        ],
      },
    },
    {
      id: "rights-1789",
      place: "versailles",
      year: 1789,
      era: "1789",
      title: "The Rights of Man",
      scene: "assembly",
      bands: ["b68", "b912"],
      what: "the Declaration of the Rights of Man",
      sources: ["wiki-drmc", "oregon-drmc", "brit-gouges"],
      fact: {
        b68: "On 26 August 1789, at Versailles, France's National Assembly adopted the Declaration of the Rights of Man and of the Citizen: 'Men are born and remain free and equal in rights.' It left out women and enslaved people.",
        b912: "The 1789 Declaration drew on Enlightenment ideas (Locke, Rousseau) and the American example. Olympe de Gouges answered in 1791 with a Declaration of the Rights of Woman; enslaved people in France's colonies took the words even more seriously.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A printed declaration from a revolution, just outside Paris, 1789.'",
          b912: "Plaque: a broadside of 17 articles adopted in August 1789 by a National Assembly sitting in the king's palace town.",
        },
        witnesses: [
          {
            who: "Traveler",
            look: "pilgrim",
            kind: "where",
            text: {
              b68: "Ideas about rights cross to France, where an assembly meets in the king's palace town near Paris.",
              b912: "Locke's ideas, through the Enlightenment and the American Revolution, reach a National Assembly sitting at the royal palace outside Paris.",
            },
          },
          {
            who: "Scholar",
            look: "scholar",
            kind: "when",
            text: {
              b68: "Look at 1789, the year a Paris crowd stormed the Bastille.",
              b912: "A century after Locke, in summer 1789, weeks after the fall of the Bastille, deputies write a declaration.",
            },
          },
        ],
        herring: { who: "Wool merchant", look: "merchant", text: "English wool sells across Europe!", note: "Good for business, but no clue." },
        unreliable: {
          who: "Pamphlet seller",
          look: "citizen",
          text: "The French will copy England exactly and keep a king with full power.",
          note: "A prediction that proved wrong: the French Revolution went much further.",
        },
        wrongPlaces: [
          { place: "paris", kind: "near", why: "Paris is next door, and its crowd stormed the Bastille, but in August 1789 the Assembly sat at Versailles." },
          { place: "london", kind: "place", why: "London watches; Edmund Burke will attack the revolution in 1790. The Declaration is French." },
          { place: "philadelphia", kind: "place", why: "Philadelphia had its Declaration in 1776. In 1789 the rights debate we want is in France." },
        ],
        wrongEras: [
          { era: "c. 1500", year: 1500, why: "In 1500 France's kings are growing stronger, and there is no national assembly of citizens." },
          { era: "1905", year: 1905, why: "By 1905 France was a republic and the 1789 Declaration was over a century old." },
        ],
      },
    },
    {
      id: "rights-haiti",
      place: "capfrancais",
      year: 1791,
      era: "1791",
      title: "The Haitian Revolution",
      scene: "fields",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "the Haitian Revolution",
      sources: ["blackpast-haiti", "slaveryremembrance-haiti", "wiki-haitidecl"],
      fact: {
        b68: "In August 1791 enslaved people in Saint-Domingue (now Haiti) rose up, after a ceremony at Bois Caïman. Led by people such as Toussaint Louverture and Jean-Jacques Dessalines, they won: in 1804 Haiti became the first nation founded by formerly enslaved people.",
        b912: "The Haitian Revolution (1791–1804) took the Declaration's words further than France had: enslaved people freed themselves, pushed France to abolish slavery (1794), then defeated Napoleon's army. Haiti declared independence on 1 January 1804.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A drum and the words liberty and equality, from a Caribbean colony, 1791.'",
          b912: "Plaque: a decree printed in Le Cap, the chief city of France's richest Caribbean colony, 1790s.",
        },
        witnesses: [
          {
            who: "Ship's clerk",
            look: "sailor",
            kind: "where",
            text: {
              b68: "The Declaration's news sails to France's richest Caribbean colony, where enslaved people grow sugar.",
              b912: "The Declaration reaches Saint-Domingue, the western third of Hispaniola, where about half a million enslaved people grow sugar and coffee.",
            },
          },
          {
            who: "Deputy",
            look: "official",
            kind: "when",
            text: {
              b68: "Only two years later, in August 1791, a great uprising begins.",
              b912: "Two summers after the Declaration, in August 1791, the uprising begins on the northern plain.",
            },
          },
        ],
        herring: { who: "Baker", look: "worker", text: "Bread prices in Paris are terrible this year!", note: "Bread prices mattered to the Revolution, but not to this clue." },
        unreliable: {
          who: "Planter",
          look: "official",
          text: "The Declaration doesn't apply to the colonies, so nothing will change there.",
          note: "Self-serving and wrong. Enslaved people claimed those rights and won them.",
        },
        wrongPlaces: [
          { place: "santodomingo", kind: "near", why: "Santo Domingo is the Spanish side of the same island. The uprising begins in French Saint-Domingue." },
          { place: "havana", kind: "place", why: "Cuba's sugar boom grew after 1791, partly because Saint-Domingue's collapsed. The revolution is in Saint-Domingue." },
          { place: "philadelphia", kind: "place", why: "Some refugees fled to Philadelphia, but the revolution happened in Saint-Domingue." },
        ],
        wrongEras: [
          { era: "c. 1650", year: 1650, why: "In 1650 Saint-Domingue isn't a French colony yet. Spain gave up the western part in 1697." },
          { era: "1915", year: 1915, why: "In 1915 US troops occupied Haiti. The revolution was over a century earlier." },
        ],
      },
    },
    {
      id: "rights-bolivar",
      place: "angostura",
      year: 1819,
      era: "1819",
      title: "Bolívar at Angostura",
      scene: "assembly",
      bands: ["b912"],
      what: "Bolívar's Angostura Address",
      sources: ["jstor-bolivarhaiti", "wiki-angostura", "iberoamericana-angostura"],
      fact: {
        b912: "In 1816 Haiti's president Alexandre Pétion gave Simón Bolívar ships, guns and a printing press on one condition: free the enslaved. In his 1819 Angostura Address, Bolívar urged Congress to confirm abolition, though full abolition in his lands took until the 1850s.",
      },
      find: {
        plaque: {
          b912: "Plaque: a copy of a speech to a congress meeting in a river town on the Orinoco, February 1819.",
        },
        witnesses: [
          {
            who: "Haitian sailor",
            look: "sailor",
            kind: "where",
            text: {
              b912: "Haitian ships carry Bolívar back to the mainland. His new republic's congress meets in a town on the Orinoco River.",
            },
          },
          {
            who: "Printer",
            look: "worker",
            kind: "when",
            text: {
              b912: "Three years after Pétion's help, in February 1819, Bolívar addresses the congress.",
            },
          },
        ],
        unreliable: {
          who: "Royal officer",
          look: "official",
          text: "The colonies love the Spanish king. No one there wants independence.",
          note: "Contradicted by years of independence wars across Spanish America.",
        },
        wrongPlaces: [
          { place: "caracas", kind: "near", why: "Caracas was Bolívar's birthplace, but in 1819 Spanish forces held it. Congress met at Angostura." },
          { place: "bogota", kind: "place", why: "Bolívar will free Bogotá later in 1819, after Boyacá. The February congress was at Angostura." },
          { place: "buenosaires", kind: "place", why: "The provinces around Buenos Aires declared independence in 1816, but this is Bolívar's congress." },
        ],
        wrongEras: [
          { era: "c. 1600", year: 1600, why: "In 1600 there is no Angostura (founded 1764) and no republic." },
          { era: "1950s", year: 1950, why: "By the 1950s the town had long been renamed Ciudad Bolívar (in 1846). Too late!" },
        ],
      },
    },
    {
      id: "rights-udhr",
      place: "paris",
      year: 1948,
      era: "1948",
      title: "The Universal Declaration",
      scene: "assembly",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "the Universal Declaration of Human Rights",
      sources: ["un-udhrhistory", "ohchr-women", "wiki-udhr"],
      fact: {
        b68: "On 10 December 1948, in Paris, the United Nations adopted the Universal Declaration of Human Rights, written after the Second World War and the Holocaust. India's Hansa Mehta helped change 'All men are born free' to 'All human beings are born free and equal.'",
        b912: "Drafted after the Second World War and the Holocaust, the UDHR was adopted in Paris: 48 votes for, none against, 8 abstentions, including South Africa's new apartheid government. Hansa Mehta of India won the words 'all human beings' in Article 1.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'Thirty articles, adopted at a palace in a European capital, December 1948.'",
          b912: "Plaque: a UN press pass for the Palais de Chaillot, December 1948, across the river from the Eiffel Tower.",
        },
        witnesses: [
          {
            who: "Diplomat",
            look: "envoy",
            kind: "where",
            text: {
              b68: "After a terrible world war, the new United Nations meets in Paris to write rights for everyone.",
              b912: "The UN General Assembly meets not in New York but at a palace in the French capital, facing the Seine.",
            },
          },
          {
            who: "Teacher",
            look: "teacher",
            kind: "when",
            text: {
              b68: "Look at 1948, three years after the Second World War ended.",
              b912: "Three years after the war and the Holocaust, in December 1948, the vote is taken.",
            },
          },
        ],
        herring: { who: "Coffee farmer", look: "farmer", text: "Our mountain coffee is among the best in the world!", note: "Maybe so, but no clue." },
        unreliable: {
          who: "Cynic",
          look: "citizen",
          text: "'Human rights' will only ever mean rights for men.",
          note: "Hansa Mehta made sure Article 1 says 'all human beings,' and women helped draft the whole text.",
        },
        wrongPlaces: [
          { place: "geneva", kind: "near", why: "Geneva hosts many UN offices, but the 1948 vote was in Paris." },
          { place: "newyork", kind: "place", why: "The UN's home is New York, but this 1948 vote happened in Paris." },
          { place: "london", kind: "place", why: "London hosted the first UN General Assembly in 1946. The 1948 vote was in Paris." },
        ],
        wrongEras: [
          { era: "1919", year: 1919, why: "In 1919 leaders met near Paris to make peace after World War I. The UN didn't exist yet." },
          { era: "2008", year: 2008, why: "In 2008 the world marked the Declaration's 60th birthday. Too late!" },
        ],
      },
    },
    {
      id: "rights-1994",
      place: "pretoria",
      year: 1994,
      era: "1994",
      title: "Freedom Day",
      scene: "assembly",
      sensitive: true,
      bands: ["b68", "b912"],
      what: "South Africa's first democratic election",
      sources: ["sahistory-1994", "sahistory-mandela", "wiki-freedomday"],
      fact: {
        b68: "On 27 April 1994 South Africans of all races voted together for the first time, ending apartheid's whites-only rule. On 10 May, in Pretoria, Nelson Mandela was sworn in as president.",
        b912: "Apartheid (from 1948) denied most South Africans' rights. After decades of resistance and negotiation, the 27 April 1994 election, with about 22 million voters, made Nelson Mandela president; the 1996 constitution includes a Bill of Rights.",
      },
      find: {
        plaque: {
          b68: "Plaque: 'A ballot with photos of party leaders, 1994.'",
          b912: "Plaque: a 1994 ballot listing 19 parties, each with its leader's photo.",
        },
        witnesses: [
          {
            who: "Diplomat",
            look: "envoy",
            kind: "where",
            text: {
              b68: "These ideas inspire freedom movements, including in South Africa, at Africa's southern tip.",
              b912: "The state that abstained in 1948 will be transformed: freedom movements at Africa's southern tip fight apartheid for decades.",
            },
          },
          {
            who: "Teacher",
            look: "teacher",
            kind: "when",
            text: {
              b68: "Look 46 years after 1948, when long lines of voters wait for hours.",
              b912: "Look at 1994, after Mandela's release from prison (1990) and years of negotiation.",
            },
          },
        ],
        herring: { who: "Tour guide", look: "citizen", text: "That palace has a lovely view of the Eiffel Tower!", note: "Nice view, but no clue." },
        unreliable: {
          who: "Old official",
          look: "official",
          text: "Apartheid will last forever. Nothing can change it.",
          note: "Wrong: resistance at home and pressure from abroad ended it.",
        },
        wrongPlaces: [
          { place: "capetown", kind: "near", why: "Cape Town voted too, and Mandela spoke there on his release in 1990, but he was sworn in at Pretoria." },
          { place: "nairobi", kind: "place", why: "Kenya won independence in 1963. The 1994 story we're following is in South Africa." },
          { place: "lagos", kind: "place", why: "Nigeria is a big African nation, but this 1994 story is in South Africa." },
        ],
        wrongEras: [
          { era: "1948", year: 1948, why: "In 1948 apartheid begins here. The thread arrives when it ends." },
          { era: "c. 1800", year: 1800, why: "In 1800 the Cape is a colony. There is no South Africa yet (the Union formed in 1910)." },
        ],
      },
    },
  ],
  sourceChecks: [
    {
      id: "rights-sc-article1",
      bands: ["b68", "b912"],
      bead: "rights-udhr",
      kind: "quoted",
      cite: "Article 1 of the Declaration of the Rights of Man and of the Citizen (1789) and of the Universal Declaration of Human Rights (1948), both public domain",
      passage:
        "1789: 'Men are born and remain free and equal in rights.' 1948: 'All human beings are born free and equal in dignity and rights. They are endowed with reason and conscience and should act towards one another in a spirit of brotherhood.'",
      prompt: "Compare the two first articles. What important change do you see?",
      choices: ["'Men' became 'all human beings'", "Rights were taken away", "Only France is mentioned", "Nothing changed"],
      explanation: "The 1948 wording includes everyone. Hansa Mehta of India argued that 'all men' could be read to leave women out.",
    },
    {
      id: "rights-sc-locke",
      bands: ["b912"],
      bead: "rights-locke",
      kind: "quoted",
      cite: "John Locke, Second Treatise of Government, section 95 (1690, public domain)",
      passage:
        "Men being, as has been said, by nature all free, equal, and independent, no one can be put out of this estate, and subjected to the political power of another, without his own consent.",
      prompt: "According to Locke, what makes a government's power legitimate?",
      choices: ["The consent of the governed", "God's choice of the king", "The army's strength", "The nobles' wealth"],
      explanation: "Locke grounds political power in consent. Later revolutionaries, in America, France and Haiti, used that idea against rulers who had not earned it.",
    },
  ],
  why: [
    {
      bands: ["b68"],
      prompt: "Why did ideas about rights keep spreading to new places?",
      choices: ["People read, argued and struggled for them", "Kings handed them out freely", "They were carved on one stone", "One country forced everyone"],
      explanation: "Books, pamphlets, news and movements carried the ideas; each time, people who had been left out claimed the rights for themselves.",
    },
    {
      bands: ["b912"],
      prompt: "Which best explains why the Haitian Revolution went further than the French one?",
      choices: [
        "Enslaved people claimed the Declaration's rights for themselves",
        "France invited them to do it",
        "Spain ordered it",
        "It happened by accident",
      ],
      explanation:
        "The Declaration's words, wartime chaos and above all the organization and courage of enslaved people combined. They turned universal rights into actual freedom.",
    },
  ],
};
