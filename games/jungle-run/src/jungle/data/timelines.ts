/*
 * Timeline gates: four stone tablets that must be opened from EARLIEST to LATEST.
 * Each set holds more than four events; a gate deals four of them. Within a set every
 * event has a different year (or, for K–2 sequences, a different step number), so any
 * four always have exactly one correct order. Years below zero are BCE.
 * scripts/check-data.ts checks every date against an independent truth table.
 */
import type { Grade } from "@/kit";
import { resolveStandard } from "./maps";

export interface TimelineEvent {
  id: string;
  /** Full text shown in the banner. */
  text: string;
  /** Short label carved on the tablet (≤ 3 lines of the bitmap font; "|" forces a break). */
  tablet: string;
  /** Exact year (negative = BCE). Omitted for K–2 everyday sequences, which use `step`. */
  year?: number;
  /** K–2 sequences: position in the sequence (1 = first). */
  step?: number;
}

export interface TimelineSet {
  id: string;
  grades: Grade[];
  /** NC code; a string with {g}, or one code per grade. */
  standard: string | Partial<Record<Grade, string>>;
  skill: string;
  /** What the tablets are about, e.g. "North Carolina history". */
  title: string;
  events: TimelineEvent[];
}

const K2: Grade[] = ["K", "1", "2"];

export const TIMELINES: TimelineSet[] = [
  /* ------------------------------------------------------------------ K–2: sequences (first, next, last) */
  {
    id: "k2-day", grades: K2, standard: "{g}.H.1", skill: "Sequence of events", title: "a school day",
    events: [
      { id: "day-wake", text: "Wake up", tablet: "WAKE UP", step: 1 },
      { id: "day-breakfast", text: "Eat breakfast", tablet: "EAT|BREAKFAST", step: 2 },
      { id: "day-bus", text: "Ride to school", tablet: "RIDE TO|SCHOOL", step: 3 },
      { id: "day-lunch", text: "Eat lunch at school", tablet: "EAT LUNCH", step: 4 },
      { id: "day-dinner", text: "Eat dinner at home", tablet: "EAT DINNER", step: 5 },
      { id: "day-bed", text: "Go to bed", tablet: "GO TO BED", step: 6 },
    ],
  },
  {
    id: "k2-grow", grades: K2, standard: "{g}.H.1", skill: "Past, present and future", title: "growing up",
    events: [
      { id: "grow-baby", text: "Baby", tablet: "BABY", step: 1 },
      { id: "grow-toddler", text: "Toddler", tablet: "TODDLER", step: 2 },
      { id: "grow-kinder", text: "Kindergartner", tablet: "KINDER-|GARTNER", step: 3 },
      { id: "grow-teen", text: "Teenager", tablet: "TEENAGER", step: 4 },
      { id: "grow-adult", text: "Grown-up", tablet: "GROWN-UP", step: 5 },
      { id: "grow-grandparent", text: "Grandparent", tablet: "GRAND-|PARENT", step: 6 },
    ],
  },
  {
    id: "k2-travel", grades: K2, standard: "{g}.H.1", skill: "Long ago and today", title: "how people traveled (long ago to today)",
    events: [
      { id: "tr-wagon", text: "Covered wagons pulled by horses", tablet: "COVERED|WAGON", step: 1 },
      { id: "tr-train", text: "Steam trains", tablet: "STEAM|TRAIN", step: 2 },
      { id: "tr-car", text: "The first cars", tablet: "FIRST CARS", step: 3 },
      { id: "tr-plane", text: "The first airplanes", tablet: "FIRST|AIRPLANE", step: 4 },
      { id: "tr-jet", text: "Jet airliners", tablet: "JET PLANES", step: 5 },
    ],
  },
  {
    id: "k2-seasons", grades: K2, standard: "{g}.H.1", skill: "Sequence of events", title: "a school year (starting in fall)",
    events: [
      { id: "ssn-fall", text: "Fall: school starts", tablet: "FALL", step: 1 },
      { id: "ssn-winter", text: "Winter", tablet: "WINTER", step: 2 },
      { id: "ssn-spring", text: "Spring", tablet: "SPRING", step: 3 },
      { id: "ssn-summer", text: "Summer vacation", tablet: "SUMMER", step: 4 },
    ],
  },

  /* ------------------------------------------------------------------ 3–5 */
  {
    id: "nc-history", grades: ["3", "4", "5"], standard: "{g}.H.1", skill: "NC history timeline", title: "North Carolina history",
    events: [
      { id: "nc-roanoke", text: "John White's colonists land on Roanoke Island (the Lost Colony)", tablet: "LOST|COLONY", year: 1587 },
      { id: "nc-charter", text: "King Charles II grants the Carolina charter", tablet: "CAROLINA|CHARTER", year: 1663 },
      { id: "nc-blackbeard", text: "The pirate Blackbeard is killed at Ocracoke Inlet", tablet: "BLACKBEARD|DEFEATED", year: 1718 },
      { id: "nc-halifax", text: "The Halifax Resolves: NC is first to call for independence", tablet: "HALIFAX|RESOLVES", year: 1776 },
      { id: "nc-12th", text: "NC ratifies the U.S. Constitution and becomes the 12th state", tablet: "NC BECOMES|12TH STATE", year: 1789 },
      { id: "nc-raleigh", text: "Raleigh is founded as NC's capital city", tablet: "RALEIGH|FOUNDED", year: 1792 },
      { id: "nc-unc", text: "The University of North Carolina welcomes its first students", tablet: "UNC|OPENS", year: 1795 },
      { id: "nc-secede", text: "NC secedes from the Union at the start of the Civil War", tablet: "NC|SECEDES", year: 1861 },
      { id: "nc-flight", text: "The Wright brothers make the first powered flight at Kitty Hawk", tablet: "FIRST|FLIGHT", year: 1903 },
      { id: "nc-sitin", text: "The Greensboro sit-ins begin at a Woolworth's lunch counter", tablet: "GREENSBORO|SIT-INS", year: 1960 },
    ],
  },
  {
    id: "us-history", grades: ["3", "4", "5"], standard: "{g}.H.1", skill: "U.S. history timeline", title: "United States history",
    events: [
      { id: "us-columbus", text: "Columbus reaches the Americas", tablet: "COLUMBUS|ARRIVES", year: 1492 },
      { id: "us-jamestown", text: "Jamestown is founded in Virginia", tablet: "JAMESTOWN", year: 1607 },
      { id: "us-plymouth", text: "The Pilgrims land at Plymouth", tablet: "PILGRIMS|LAND", year: 1620 },
      { id: "us-declaration", text: "The Declaration of Independence is signed", tablet: "DECLARATION|OF INDEP.", year: 1776 },
      { id: "us-constitution", text: "The U.S. Constitution is written in Philadelphia", tablet: "CONSTITUTION|WRITTEN", year: 1787 },
      { id: "us-louisiana", text: "The Louisiana Purchase doubles the size of the U.S.", tablet: "LOUISIANA|PURCHASE", year: 1803 },
      { id: "us-civilwar", text: "The Civil War begins at Fort Sumter", tablet: "CIVIL WAR|BEGINS", year: 1861 },
      { id: "us-railroad", text: "The transcontinental railroad is completed", tablet: "RAILROAD|COAST TO|COAST", year: 1869 },
      { id: "us-19th", text: "The 19th Amendment gives women the right to vote", tablet: "WOMEN WIN|THE VOTE", year: 1920 },
      { id: "us-moon", text: "Apollo 11 astronauts walk on the Moon", tablet: "MOON|LANDING", year: 1969 },
    ],
  },

  /* ------------------------------------------------------------------ 6–8 */
  {
    id: "ancient", grades: ["6"], standard: "6.H.1", skill: "World history timeline", title: "the ancient and medieval world",
    events: [
      { id: "an-olympics", text: "First recorded Olympic Games in Greece", tablet: "FIRST|OLYMPICS", year: -776 },
      { id: "an-qin", text: "Qin Shi Huang unifies China", tablet: "QIN UNIFIES|CHINA", year: -221 },
      { id: "an-caesar", text: "Julius Caesar is assassinated", tablet: "CAESAR|KILLED", year: -44 },
      { id: "an-augustus", text: "Augustus becomes the first Roman emperor", tablet: "AUGUSTUS|EMPEROR", year: -27 },
      { id: "an-rome", text: "The last Western Roman emperor is overthrown", tablet: "WESTERN|ROME FALLS", year: 476 },
      { id: "an-hijra", text: "Muhammad's Hijra from Mecca to Medina", tablet: "THE HIJRA", year: 622 },
      { id: "an-hastings", text: "The Normans win the Battle of Hastings", tablet: "BATTLE OF|HASTINGS", year: 1066 },
      { id: "an-magna", text: "King John agrees to Magna Carta", tablet: "MAGNA|CARTA", year: 1215 },
      { id: "an-const", text: "Constantinople falls to the Ottoman Turks", tablet: "FALL OF|CONSTANT-|INOPLE", year: 1453 },
    ],
  },
  {
    id: "modern", grades: ["7"], standard: "7.H.1.1", skill: "World history timeline", title: "the modern world",
    events: [
      { id: "mo-columbus", text: "Columbus reaches the Americas", tablet: "COLUMBUS|ARRIVES", year: 1492 },
      { id: "mo-luther", text: "Martin Luther posts his 95 Theses", tablet: "95 THESES", year: 1517 },
      { id: "mo-magellan", text: "Magellan's expedition sets sail to circle the globe", tablet: "MAGELLAN|SETS SAIL", year: 1519 },
      { id: "mo-bastille", text: "The French Revolution begins with the storming of the Bastille", tablet: "FRENCH|REVOLUTION", year: 1789 },
      { id: "mo-waterloo", text: "Napoleon is defeated at Waterloo", tablet: "WATERLOO", year: 1815 },
      { id: "mo-ww1", text: "World War I begins", tablet: "WORLD WAR I|BEGINS", year: 1914 },
      { id: "mo-ww2", text: "World War II begins", tablet: "WORLD WAR|II BEGINS", year: 1939 },
      { id: "mo-india", text: "India wins independence from Britain", tablet: "INDIA|INDEPENDENT", year: 1947 },
      { id: "mo-wall", text: "The Berlin Wall falls", tablet: "BERLIN WALL|FALLS", year: 1989 },
      { id: "mo-ussr", text: "The Soviet Union breaks up", tablet: "USSR|BREAKS UP", year: 1991 },
    ],
  },
  {
    id: "nc-us-8", grades: ["8"], standard: "8.H.1", skill: "NC and U.S. history timeline", title: "North Carolina and U.S. history",
    events: [
      { id: "e8-roanoke", text: "The Lost Colony settles on Roanoke Island", tablet: "LOST|COLONY", year: 1587 },
      { id: "e8-charter", text: "The Carolina charter is granted", tablet: "CAROLINA|CHARTER", year: 1663 },
      { id: "e8-halifax", text: "NC's Halifax Resolves back independence", tablet: "HALIFAX|RESOLVES", year: 1776 },
      { id: "e8-constitution", text: "Delegates write the U.S. Constitution", tablet: "CONSTITUTION|WRITTEN", year: 1787 },
      { id: "e8-ratify", text: "NC ratifies the Constitution", tablet: "NC RATIFIES", year: 1789 },
      { id: "e8-secede", text: "NC secedes as the Civil War begins", tablet: "NC|SECEDES", year: 1861 },
      { id: "e8-13th", text: "The 13th Amendment abolishes slavery", tablet: "13TH|AMENDMENT", year: 1865 },
      { id: "e8-wilmington", text: "The Wilmington coup overthrows an elected city government", tablet: "WILMINGTON|COUP", year: 1898 },
      { id: "e8-flight", text: "The Wright brothers fly at Kitty Hawk", tablet: "FIRST|FLIGHT", year: 1903 },
      { id: "e8-sitin", text: "The Greensboro sit-ins begin", tablet: "GREENSBORO|SIT-INS", year: 1960 },
      { id: "e8-cra", text: "The Civil Rights Act becomes law", tablet: "CIVIL|RIGHTS ACT", year: 1964 },
    ],
  },

  /* ------------------------------------------------------------------ 9–12 */
  {
    id: "world-hs", grades: ["9"], standard: "WH.H.1", skill: "World history chronology", title: "world history",
    events: [
      { id: "wh-magna", text: "Magna Carta limits the English king's power", tablet: "MAGNA|CARTA", year: 1215 },
      { id: "wh-plague", text: "The Black Death reaches Europe", tablet: "BLACK DEATH|REACHES|EUROPE", year: 1347 },
      { id: "wh-const", text: "Constantinople falls to the Ottomans", tablet: "FALL OF|CONSTANT-|INOPLE", year: 1453 },
      { id: "wh-luther", text: "Luther's 95 Theses start the Reformation", tablet: "95 THESES", year: 1517 },
      { id: "wh-westphalia", text: "The Peace of Westphalia ends the Thirty Years' War", tablet: "PEACE OF|WESTPHALIA", year: 1648 },
      { id: "wh-bastille", text: "The French Revolution begins", tablet: "FRENCH|REVOLUTION", year: 1789 },
      { id: "wh-haiti", text: "Haiti declares independence from France", tablet: "HAITI|INDEPENDENT", year: 1804 },
      { id: "wh-suez", text: "The Suez Canal opens", tablet: "SUEZ CANAL|OPENS", year: 1869 },
      { id: "wh-russia", text: "The Russian Revolution", tablet: "RUSSIAN|REVOLUTION", year: 1917 },
      { id: "wh-prc", text: "The People's Republic of China is founded", tablet: "PEOPLE'S|REPUBLIC OF|CHINA", year: 1949 },
      { id: "wh-mandela", text: "Nelson Mandela is elected president of South Africa", tablet: "MANDELA|ELECTED", year: 1994 },
    ],
  },
  {
    id: "american-hs", grades: ["11"], standard: "AH.H.1", skill: "U.S. history chronology", title: "American history",
    events: [
      { id: "ah-billofrights", text: "The Bill of Rights is ratified", tablet: "BILL OF|RIGHTS", year: 1791 },
      { id: "ah-louisiana", text: "The Louisiana Purchase", tablet: "LOUISIANA|PURCHASE", year: 1803 },
      { id: "ah-seneca", text: "The Seneca Falls Convention for women's rights", tablet: "SENECA|FALLS", year: 1848 },
      { id: "ah-emancipation", text: "The Emancipation Proclamation takes effect", tablet: "EMANCI-|PATION", year: 1863 },
      { id: "ah-plessy", text: "Plessy v. Ferguson upholds 'separate but equal'", tablet: "PLESSY V.|FERGUSON", year: 1896 },
      { id: "ah-19th", text: "The 19th Amendment: women's suffrage", tablet: "19TH|AMENDMENT", year: 1920 },
      { id: "ah-crash", text: "The stock market crash starts the Great Depression", tablet: "STOCK|MARKET|CRASH", year: 1929 },
      { id: "ah-pearl", text: "Japan attacks Pearl Harbor", tablet: "PEARL|HARBOR", year: 1941 },
      { id: "ah-brown", text: "Brown v. Board of Education rules school segregation unconstitutional", tablet: "BROWN V.|BOARD", year: 1954 },
      { id: "ah-vra", text: "The Voting Rights Act becomes law", tablet: "VOTING|RIGHTS ACT", year: 1965 },
    ],
  },
  {
    id: "civics-hs", grades: ["10"], standard: "CL.C&G.1", skill: "Founding documents and rights", title: "documents and rights",
    events: [
      { id: "cl-magna", text: "Magna Carta", tablet: "MAGNA|CARTA", year: 1215 },
      { id: "cl-ebor", text: "The English Bill of Rights", tablet: "ENGLISH|BILL OF|RIGHTS", year: 1689 },
      { id: "cl-declaration", text: "The Declaration of Independence", tablet: "DECLARATION|OF INDEP.", year: 1776 },
      { id: "cl-articles", text: "The Articles of Confederation take effect", tablet: "ARTICLES OF|CONFED.", year: 1781 },
      { id: "cl-constitution", text: "The Constitution is signed in Philadelphia", tablet: "CONSTITUTION|SIGNED", year: 1787 },
      { id: "cl-bor", text: "The Bill of Rights is ratified", tablet: "BILL OF|RIGHTS", year: 1791 },
      { id: "cl-marbury", text: "Marbury v. Madison establishes judicial review", tablet: "MARBURY V.|MADISON", year: 1803 },
      { id: "cl-14th", text: "The 14th Amendment guarantees equal protection", tablet: "14TH|AMENDMENT", year: 1868 },
      { id: "cl-miranda", text: "Miranda v. Arizona", tablet: "MIRANDA V.|ARIZONA", year: 1966 },
      { id: "cl-26th", text: "The 26th Amendment lowers the voting age to 18", tablet: "26TH|AMENDMENT", year: 1971 },
    ],
  },
  {
    id: "econ-hs", grades: ["12"], standard: "EPF.E.1", skill: "Economic history", title: "economic history",
    events: [
      { id: "ec-smith", text: "Adam Smith publishes The Wealth of Nations", tablet: "WEALTH OF|NATIONS", year: 1776 },
      { id: "ec-buttonwood", text: "The Buttonwood Agreement starts the New York Stock Exchange", tablet: "NY STOCK|EXCHANGE|BEGINS", year: 1792 },
      { id: "ec-fed", text: "The Federal Reserve Act creates the Fed", tablet: "FEDERAL|RESERVE", year: 1913 },
      { id: "ec-crash", text: "The stock market crash", tablet: "STOCK|MARKET|CRASH", year: 1929 },
      { id: "ec-fdic", text: "The FDIC is created to insure bank deposits", tablet: "FDIC|CREATED", year: 1933 },
      { id: "ec-ssa", text: "The Social Security Act", tablet: "SOCIAL|SECURITY", year: 1935 },
      { id: "ec-bretton", text: "The Bretton Woods conference", tablet: "BRETTON|WOODS", year: 1944 },
      { id: "ec-gold", text: "The U.S. ends converting dollars to gold", tablet: "DOLLAR|LEAVES GOLD", year: 1971 },
      { id: "ec-euro", text: "The euro is launched", tablet: "EURO|LAUNCHED", year: 1999 },
      { id: "ec-crisis", text: "The global financial crisis", tablet: "FINANCIAL|CRISIS", year: 2008 },
    ],
  },
];

/** "44 BCE", "1492", "STEP 3". */
export function dateLabel(e: TimelineEvent): string {
  if (e.year === undefined) return `STEP ${e.step}`;
  return e.year < 0 ? `${-e.year} BCE` : e.year < 1000 ? `${e.year} CE` : String(e.year);
}

/** Sort key: the year, or the step for K–2 sequences. */
export function orderKey(e: TimelineEvent): number {
  return e.year ?? e.step ?? 0;
}

export function timelinesFor(grade: Grade): TimelineSet[] {
  return TIMELINES.filter((t) => t.grades.includes(grade)).map((t) => ({ ...t, standard: resolveStandard(t.standard, grade) }));
}

/** Deal four events from a set in a shuffled (display) order. */
export function dealGate(set: TimelineSet, rnd: () => number = Math.random): TimelineEvent[] {
  const pool = [...set.events];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const four = pool.slice(0, 4);
  // Never deal them already in order (that would make the gate a freebie).
  const sorted = [...four].sort((a, b) => orderKey(a) - orderKey(b));
  if (four.every((e, i) => e === sorted[i])) [four[0], four[3]] = [four[3], four[0]];
  return four;
}
