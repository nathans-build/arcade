/*
 * Expedition 4: Northbound, 1917 (the Great Migration). Durham, North Carolina by rail through
 * Richmond and Washington to Baltimore and Philadelphia, and on to New York if you choose.
 *
 * Tone: serious throughout, no comedy. Segregation is described accurately and without graphic
 * detail. When the player meets it, the choices are only responses that are historically
 * documented (packing food, writing to the press, mutual aid, churches and the Urban League,
 * savings banks, boycotts as history); the player never enforces segregation.
 *
 * Rail distances are rounded game distances. Fares, wages and prices are game numbers.
 */
import type { Expedition } from "./types";

const SCOTT_1919 = "Scott, Emmett J., ed. \"Letters of Negro Migrants of 1916–1918\" and \"Additional Letters of Negro Migrants of 1916–1918\", Journal of Negro History 4, nos. 3–4 (July and October 1919)";
const EGP = "Encyclopedia of Greater Philadelphia, \"African American Migration\", https://philadelphiaencyclopedia.org/essays/african-american-migration/";
const SOUTHERN_SPACES = "Bay, Mia. \"Jim Crow Journeys: An Excerpt from Traveling Black\", Southern Spaces (2021), https://southernspaces.org/2021/jim-crow-journeys-excerpt-traveling-black/ (retold)";
const NMAAHC = "National Museum of African American History and Culture, \"Millions Move North\", https://nmaahc.si.edu/explore/stories/millions-move-north";
const UPENN = "West Philadelphia Collaborative History, \"Why Leave the South for West Philadelphia?\", https://collaborativehistory.gse.upenn.edu/stories/why-leave-south-west-philadelphia";

export const NORTHBOUND: Expedition = {
  id: "northbound",
  title: "Northbound",
  year: 1917,
  route: "Durham, NC → Washington → Philadelphia (or New York) by rail · about 410–500 miles",
  role: "You are seventeen, traveling north alone by train and writing letters home to your family in Durham.",
  recommended: [5, 12],
  start: "1917-05-15",
  historicalDays: 2,
  historicalNote: "A through train could make this trip in about a day. Many migrants went step by step, stopping to work and save for the next fare.",
  deadline: [50, 45, 42],
  lateLabel: "JOB FILLED",
  lateText: "The job your cousin found for you was filled before you arrived. You can retry the last leg from the checkpoint and plan your money and days more carefully.",
  party: 1,
  partyLabel: "just you",
  mode: "rail",
  units: { food: "meals", parts: "good clothes", trade: "letters of introduction", money: "dollars" },
  startRes: { food: 0, money: 0, parts: 0, morale: 70, trade: 0 },
  budget: [1600, 1700, 1700],
  weightLimit: 60,
  store: [
    { id: "shoebox", name: "Shoebox lunch from home", unit: "box (3 meals)", price: 30, weight: 2, gives: { food: 3 }, rec: [8, 8, 8], max: 12 },
    { id: "clothes", name: "Good clothes for job interviews", unit: "outfit", price: 250, weight: 6, gives: { parts: 1 }, rec: [0, 1, 1], max: 3, minBand: 1 },
    { id: "pastor", name: "Letter of introduction from your pastor", unit: "letter", price: 0, weight: 0, gives: { trade: 1 }, rec: [0, 0, 1], max: 1, minBand: 2 },
    { id: "pen", name: "Paper, pen and stamps for letters home", unit: "set", price: 25, weight: 1, gives: { morale: 4 }, rec: [1, 1, 1], max: 2 },
  ],
  paces: [{ id: "coach", label: "Day coach", note: "The train sets the pace", speed: 1, morale: 0, wear: 0 }],
  rations: [
    { id: "two", label: "Two meals", perPerson: 2, morale: -1 },
    { id: "three", label: "Three meals", perPerson: 3, morale: 0 },
  ],
  resupply: {
    label: "Buy meals",
    days: 1,
    money: 100,
    food: 9,
    text: "You buy meals for a few days at a lunch counter and a boarding house that serve Black travelers.",
    source: NMAAHC,
  },
  work: {
    label: "Stop and work",
    days: 5,
    money: 600,
    food: 12,
    text: "You take day work (hauling, cleaning, a factory shift) and pay for room and board where you stay. It costs days, but your savings grow.",
    source: UPENN,
  },
  legs: [
    { miles: 160, mpd: 200, terrain: "rail", cost: { money: 320, label: "Train fare to Richmond (game number)" } },
    { miles: 115, mpd: 200, terrain: "rail", cost: { money: 230, label: "Train fare to Washington (game number)" } },
    { miles: 40, mpd: 200, terrain: "rail", cost: { money: 80, label: "Train fare to Baltimore (game number)" } },
    { miles: 95, mpd: 200, terrain: "rail", cost: { money: 190, label: "Train fare to Philadelphia (game number)" } },
    { miles: 90, mpd: 200, terrain: "rail", cost: { money: 180, label: "Train fare to New York (game number)" } },
  ],
  landmarks: [
    {
      id: "durham",
      name: "Durham",
      place: "North Carolina · Hayti and Parrish Street",
      mile: 0,
      scene: "durham",
      stay: 0,
      source: "NCpedia, \"Black Wall Street\", https://www.ncpedia.org/black-wall-street-student; Chicago Defender, \"History of the Chicago Defender\", https://chicagodefender.com/history-of-the-chicago-defender/",
      read: [
        {
          text: "Durham has a strong Black business district on Parrish Street. North Carolina Mutual, a Black-owned insurance company, started here in 1898. But Jim Crow laws keep Black people out of many jobs and schools, and most cannot vote. Factories in the North are hiring. You decide to go north.",
        },
        {
          text: "Durham was famous for its Black business district on Parrish Street, later called Black Wall Street, and for the Hayti neighborhood. North Carolina Mutual Life Insurance, founded in 1898 by John Merrick and Aaron Moore, became the largest Black-owned insurance company in the country. Yet Jim Crow laws still limited Black North Carolinians. A 1900 amendment to the state constitution had taken the vote from most Black men, and many jobs paid Black workers far less. When World War I cut off immigration from Europe, Northern factories began hiring Black Southerners. The Chicago Defender, a Black newspaper, urged readers to come north.",
          gloss: [["amendment", "a change to a constitution"]],
        },
        {
          text: "Durham demonstrates why historians describe the Great Migration as considerably more than an escape from poverty. Parrish Street held banks and businesses so successful that Booker T. Washington and W. E. B. Du Bois both praised the city, and North Carolina Mutual, founded in 1898, was the largest Black-owned insurance company in the nation. Still, success did not bring citizenship. North Carolina's 1900 suffrage amendment used a literacy test and a grandfather clause to remove most Black men from the voter rolls, and segregation laws governed schools, streetcars and trains. In 1917 the war in Europe stopped the flow of immigrant workers, and Northern employers needed labor. The Chicago Defender, carried south by Pullman porters, called May 15, 1917 the date of a Great Northern Drive. People left for wages, for schools and for dignity, and they also left communities they loved.",
          gloss: [["suffrage", "the right to vote"], ["grandfather clause", "a rule that let men vote if their grandfathers could, which shielded most white voters"]],
        },
      ],
    },
    {
      id: "richmond",
      name: "Richmond",
      place: "Virginia · Jackson Ward",
      mile: 160,
      scene: "richmond",
      stay: 1,
      source: "Encyclopedia Virginia, \"Maggie Lena Walker (1864–1934)\", https://encyclopediavirginia.org/entries/walker-maggie-lena-1864-1934/; Library of Virginia, \"John Mitchell Jr.\", https://www.lva.virginia.gov/events/exhibitions/jmj/",
      read: [
        {
          text: "In Richmond, the train stops near Jackson Ward, a busy Black neighborhood. Here Maggie Lena Walker started a bank in 1903. She was the first woman in the United States to start a bank. Black families saved their money there and bought homes.",
        },
        {
          text: "Jackson Ward was the center of Black business in Richmond. In 1903 Maggie Lena Walker opened the St. Luke Penny Savings Bank there and became the first woman in the United States to charter a bank. On its first day almost 300 customers deposited about $8,000. The bank made loans so Black families could buy homes. In 1904, when the streetcar company began to segregate its cars, Walker and newspaper editor John Mitchell Jr. led a boycott. Most Black riders chose to walk instead.",
          gloss: [["charter", "to start officially, with the government's permission"], ["boycott", "refusing to buy or use something as a protest"]],
        },
        {
          text: "Richmond's Jackson Ward was sometimes called the Harlem of the South, a district of Black-owned banks, insurance companies, newspapers and theaters. Maggie Lena Walker founded the St. Luke Penny Savings Bank there in 1903, the first bank chartered by a woman in the United States, and by 1920 it had issued more than 600 mortgage loans to Black homebuyers. Richmonders also organized against Jim Crow. When the Virginia Passenger and Power Company segregated its streetcars in April 1904, Walker and John Mitchell Jr., editor of the Richmond Planet, led a boycott that helped push the company toward bankruptcy. Segregation still won: in 1906 Virginia required separate seating by state law. Historians weigh both facts. Self-help institutions and protest built real power, but they could not by themselves defeat laws backed by the state.",
          gloss: [["mortgage", "a loan to buy a home"]],
        },
      ],
    },
    {
      id: "washington",
      name: "Washington, D.C.",
      place: "Union Station · the line on the rails",
      mile: 275,
      scene: "washington",
      stay: 1,
      source: SOUTHERN_SPACES + "; " + NMAAHC,
      read: [
        {
          text: "Union Station in Washington is huge, with tall arches. On trains in the South, Black passengers had to ride in separate cars. Washington was where that rule stopped for trains going north. From here on, you can sit in any seat you paid for.",
        },
        {
          text: "Washington's Union Station opened in 1907, one of the grandest train stations in the country. For Black travelers it marked a line. On trains heading south, conductors moved Black passengers into separate Jim Crow cars at Washington, because Virginia law required it. On trains heading north, travelers could leave those cars here and take any seat. The capital itself was not free of segregation: in 1913 President Woodrow Wilson's administration began separating Black and white workers in federal offices. Howard University, founded in 1867, made the city a center of Black education.",
          gloss: [["Jim Crow car", "a separate, often worse, train car Black passengers were forced to use"]],
        },
        {
          text: "For migrants traveling north, Washington's Union Station was where the rules of travel changed. Historian Mia Bay describes how, on southbound trains, conductors at Washington moved Black passengers into Jim Crow cars, often placed right behind the smoky engine; northbound passengers could leave them there. The city was a crossroads in another sense. It had one of the largest and best-educated Black communities in the nation, anchored by Howard University and the U Street neighborhood, yet in 1913 the Wilson administration segregated federal offices that had been integrated for decades, and civil rights leaders protested in person at the White House. Washington shows that the line between South and North was not simple. Freedom of movement on a train did not mean equality in jobs, housing or government. (This reading is retold from modern histories, not quoted.)",
        },
      ],
    },
    {
      id: "baltimore",
      name: "Baltimore",
      place: "Maryland · harbor city",
      mile: 315,
      scene: "baltimore",
      stay: 1,
      source: "Baltimore Heritage, \"1885–1929: Segregation and the Fourteenth Amendment\", https://baltimoreheritage.github.io/civil-rights-heritage/1885-1929/; Oyez, \"Buchanan v. Warley\", https://www.oyez.org/cases/1900-1940/245us60",
      read: [
        {
          text: "Baltimore is a busy harbor city. Black families here read the Afro-American, a newspaper started in 1892. In 1910 Baltimore passed a law to keep Black and white families on separate blocks. Lawyers and the NAACP fought laws like it in court.",
        },
        {
          text: "Baltimore had a large, long-established Black community, with its own churches, schools and a newspaper, the Afro-American, founded in 1892. It also had the country's first citywide housing segregation law. In 1910, after a Black lawyer bought a house on an all-white block, the city passed an ordinance to keep Black and white residents on separate blocks. Black lawyers and the young NAACP fought these laws. In November 1917 the U.S. Supreme Court ruled, in Buchanan v. Warley, that a similar law in Louisville, Kentucky, was unconstitutional.",
          gloss: [["ordinance", "a city law"], ["unconstitutional", "against the Constitution, so not allowed"]],
        },
        {
          text: "Baltimore shows how segregation moved from trains and schools into housing. On December 19, 1910, the mayor signed the first municipal ordinance in the United States requiring racially separate residential blocks, passed after a Black Yale-trained lawyer bought a home on an all-white street. Similar laws spread to other cities. The NAACP, founded in 1909, chose a Louisville case to challenge them: a white seller and William Warley, a Black buyer and NAACP member, arranged a sale to test the law. On November 5, 1917, the Supreme Court ruled unanimously in Buchanan v. Warley that the ordinance violated property rights protected by the Fourteenth Amendment. The victory was real but limited. Cities and real estate groups turned to private covenants and lending rules that kept neighborhoods segregated for decades. Migrants arriving in Northern cities would meet those barriers too.",
          gloss: [["covenant", "a written promise in a deed, here used to keep buyers out"]],
        },
      ],
    },
    {
      id: "philadelphia",
      name: "Philadelphia",
      place: "Pennsylvania · Broad Street Station",
      mile: 410,
      scene: "philadelphia",
      stay: 1,
      canEnd: true,
      source: EGP + "; " + UPENN + "; " + SCOTT_1919,
      read: [
        {
          text: "In Philadelphia, more than 800 newcomers a week arrive from the South in the summer of 1917. Churches like Mother Bethel help them find meals, rooms and jobs. Many people wrote letters home. One man wrote that he felt like a new person in the North.",
          excerpt: { quote: "I should have been here 20 years ago. I just begin to feel like a man.", cite: "Letter from a migrant, 1917, in Journal of Negro History (Oct. 1919)", status: "public domain" },
        },
        {
          text: "By the summer of 1917, more than 800 Southern migrants a week were arriving in Philadelphia. The Pennsylvania Railroad had carried thousands of Black workers north for free to work on its tracks. Black churches such as Mother Bethel AME, founded by Richard Allen in 1794, opened their doors with meals, rooms and advice. The Armstrong Association, part of the National Urban League, helped newcomers find jobs and housing. Housing was crowded and rents were high. Migrants wrote home about wages, schools and the freedom to vote.",
          excerpt: { quote: "I should have been here 20 years ago. I just begin to feel like a man. My children are going to the same school with the whites.", cite: "Letter from a migrant, 1917, in Journal of Negro History (Oct. 1919)", status: "public domain" },
        },
        {
          text: "Between 1916 and 1920, some 35,000 to 40,000 Black Southerners moved to Philadelphia, and in the summer of 1917 more than 800 arrived each week. Some came on the Pennsylvania Railroad, which carried more than 13,000 people north for free between May 1916 and July 1917 to fill track jobs. Mother Bethel AME and other churches, the Armstrong Association and new migrant committees found newcomers jobs, lodging and medical care. The city's welcome had limits: housing was scarce, some unions refused Black members, and white resentment would break into violence in South Philadelphia in July 1918. The letters migrants sent home, which Emmett J. Scott collected and published in 1919, are powerful primary sources. Read them as historians do: who wrote them, to whom, and why might a letter meant to persuade relatives emphasize some things and leave out others?",
          excerpt: { quote: "I should have been here 20 years ago. I just begin to feel like a man. It's a great deal of pleasure in knowing that you have got some privilege. My children are going to the same school with the whites.", cite: "Letter from a migrant, 1917, in Scott, \"Additional Letters of Negro Migrants of 1916–1918\", Journal of Negro History (Oct. 1919)", status: "public domain" },
        },
      ],
    },
    {
      id: "newyork",
      name: "New York",
      place: "Harlem · journey's end",
      mile: 500,
      scene: "newyork",
      stay: 0,
      source: "New-York Historical Society, \"Remembering the NAACP's 1917 Silent Protest Parade\", https://www.nyhistory.org/blogs/remembering-the-naacps-1917-silent-protest-parade-and-the-refusal-to-accept-barbaric-acts; Library of Congress, \"Silent Protest Parade\", https://guides.loc.gov/chronicling-america-silent-protest-parade",
      read: [
        {
          text: "Harlem is a big Black neighborhood in New York. People come here from the South and from islands in the Caribbean. They find churches, newspapers and clubs. This summer, about ten thousand people will march down Fifth Avenue. They will walk in silence to protest violence against Black Americans.",
        },
        {
          text: "Harlem was fast becoming the center of Black New York, home to migrants from the South and immigrants from the Caribbean. Its churches, newspapers and political clubs gave newcomers a community. On July 28, 1917, the NAACP led the Silent Protest Parade down Fifth Avenue. Nearly ten thousand people marched without speaking, to the beat of muffled drums, to protest violence against Black Americans. Children led the parade, and women and children wore white. Men in dark suits followed, carrying signs that asked the nation to live up to its own ideals.",
        },
        {
          text: "Harlem in 1917 was turning into the capital of Black America, a place where Southern migrants, Caribbean immigrants and longtime New Yorkers built churches, businesses, newspapers and political organizations. Its 15th New York Infantry, a Black National Guard regiment formed in 1916, would fight in France as the 369th Infantry. On July 28, 1917, the NAACP organized the Silent Protest Parade after the deadly attacks on Black residents of East St. Louis earlier that month. Nearly ten thousand marchers walked down Fifth Avenue in silence, with children in front, women and children in white, and men in dark suits, carrying signs that appealed to the nation's ideals. The march was a new kind of protest: disciplined, public and aimed at the conscience of the country. The Great Migration did not end discrimination, but it gathered people, votes and voices in Northern cities that would shape the civil rights movement.",
        },
      ],
    },
  ],
  events: [
    {
      id: "nb-defender", legs: [0], title: "The Chicago Defender",
      text: "A Pullman porter on the Durham line leaves a copy of the Chicago Defender with your uncle. It is full of job ads, train times and stories about life in the North.",
      source: "Chicago Defender, \"History of the Chicago Defender\", https://chicagodefender.com/history-of-the-chicago-defender/",
      choices: [
        { label: "Read the job ads closely and copy addresses", effect: { morale: 3 }, outcome: "You copy three addresses into your notebook." },
        { label: "Pass it on to your neighbors", effect: { morale: 2 }, outcome: "The paper goes from house to house down the street." },
      ],
    },
    {
      id: "nb-agent", legs: [0, 1], title: "A Labor Agent",
      text: "A labor agent says a railroad will pay your fare north if you sign up to work on its tracks. Some Southern towns tried to stop agents like him with high license fees.",
      source: UPENN + "; " + NMAAHC,
      choices: [
        { label: "Buy your own ticket and choose your own job", effect: {}, outcome: "You keep your plan and your freedom to choose." },
        { label: "Sign up for the free ride north", effect: { money: 300, morale: -2 }, outcome: "The agent gives you a pass worth one fare.", later: { days: 6, effect: { days: 3 }, text: "The railroad sends new workers to a track camp first. It takes three days to get back on your own route." } },
      ],
    },
    {
      id: "nb-waiting", legs: [0, 1], title: "Separate Waiting Rooms",
      text: "At the station, signs divide the waiting rooms by race. The waiting room Black travelers must use is small and crowded. Virginia law also requires separate coaches.",
      source: SOUTHERN_SPACES,
      choices: [
        { label: "Wait with the church members who came to see you off", effect: { morale: 2 }, outcome: "They pray with you and hand you a packet of letters for friends up north." },
        { label: "Write down what you see for a letter to the Defender", effect: { morale: 1 }, outcome: "Many travelers wrote to Black newspapers to make these conditions known. Your notes go in the envelope." },
        { label: "Ask the porter which coach has room", effect: { morale: 1 }, minBand: 1, outcome: "The porter, who rides this line every week, finds you a seat by a window." },
      ],
    },
    {
      id: "nb-dining", legs: [0, 1], title: "No Seat in the Dining Car",
      text: "On Southern trains, Black passengers were often refused service in the dining car or served only after everyone else. Many families packed a shoebox lunch for the trip.",
      source: NMAAHC + "; " + SOUTHERN_SPACES,
      choices: [
        { label: "Eat from the shoebox lunch your mother packed", effect: { morale: 2 }, outcome: "Fried chicken, biscuits and pound cake, wrapped in wax paper. It tastes like home." },
        { label: "Buy food from a vendor at a station stop", effect: { money: -25, food: 1 }, needs: { money: 25 }, outcome: "A vendor sells sandwiches through the open window." },
      ],
    },
    {
      id: "nb-coach", legs: [0, 1], title: "The Coach by the Engine",
      text: "The coach for Black passengers is right behind the engine. Smoke and cinders blow in through the windows, and the seats are full.",
      source: SOUTHERN_SPACES,
      choices: [
        { label: "Help an older woman with her bags and share the seat", effect: { morale: 2 }, outcome: "She is going to Baltimore to join her son. You talk the whole way." },
        { label: "Close the window and try to rest", effect: { morale: -2 }, outcome: "It is hot and stuffy, but you get some sleep." },
      ],
    },
    {
      id: "nb-delay", legs: [0, 1, 2, 3, 4], title: "Train Delayed",
      text: "Your train is held for hours, then canceled for the day. The next one leaves tomorrow morning.",
      source: NMAAHC,
      choices: [
        { label: "Stay with a family the church recommended", effect: { days: 1, morale: 1 }, outcome: "They feed you and give you a cot for the night." },
        { label: "Wait in the station overnight", effect: { days: 1, morale: -2 }, outcome: "A long, uncomfortable night on a bench." },
      ],
    },
    {
      id: "nb-tobacco", legs: [1], title: "Work in Richmond",
      text: "A Richmond tobacco factory is hiring for a few days. The pay is low, but it would help with the fares ahead.",
      source: "Encyclopedia Virginia, \"Maggie Lena Walker (1864–1934)\", https://encyclopediavirginia.org/entries/walker-maggie-lena-1864-1934/",
      choices: [
        { label: "Work four days at the factory", effect: { days: 4, money: 400 }, outcome: "Long days stemming tobacco. You earn four dollars." },
        { label: "Keep going north", effect: {}, outcome: "You decide to save your days instead." },
      ],
    },
    {
      id: "nb-bank", legs: [1], title: "The Penny Savings Bank",
      text: "A friend in Jackson Ward says you can open an account at Maggie Walker's St. Luke Penny Savings Bank with a small deposit. Your money would be safer than in your pocket.",
      source: "Federal Reserve Bank of Richmond, \"Maggie Lena Walker\", https://www.richmondfed.org/publications/research/econ_focus/2022/q4_economic_history",
      choices: [
        { label: "Deposit a dollar and keep the bankbook", effect: { morale: 3 }, outcome: "You have a bank account. It feels like the start of something." },
        { label: "Keep your cash with you", effect: {}, outcome: "You sew your bills into your coat lining." },
      ],
    },
    {
      id: "nb-mama", legs: [2, 3, 4], title: "A Letter from Mama",
      text: "A letter from home catches up with you. Your little sister needs shoes for school, and money is tight.",
      source: SCOTT_1919,
      choices: [
        { label: "Send a dollar home", effect: { money: -100, morale: 4 }, needs: { money: 100 }, outcome: "You mail the dollar with a long letter. Many migrants sent money home." },
        { label: "Write back and promise money from your first pay", effect: { morale: 1 }, outcome: "You write about everything you have seen." },
      ],
    },
    {
      id: "nb-room", legs: [2, 3, 4], title: "A Place to Stay",
      text: "A church member gives you two addresses: a clean boarding house that costs more, and a crowded shared room.",
      source: EGP,
      choices: [
        { label: "Take the shared room and save money", effect: { morale: -1 }, outcome: "Six people share the room, but they share advice too." },
        { label: "Pay more for the boarding house", effect: { money: -150, morale: 3 }, needs: { money: 150 }, outcome: "A real bed, a good meal and a landlady who knows every employer in town." },
      ],
    },
    {
      id: "nb-trunk", legs: [1, 2, 3], title: "The Trunk Went On",
      text: "When you change trains, your trunk is put on the wrong car. The baggage agent says it went on to the next city.",
      source: NMAAHC,
      choices: [
        { label: "Wait a day for it to come back", effect: { days: 1 }, outcome: "The trunk arrives on the morning train." },
        { label: "Go on and send for it later", effect: { parts: -1, morale: -2 }, outcome: "You go on without your good clothes for now." },
      ],
    },
    {
      id: "nb-strike", legs: [3, 4], minBand: 2, title: "Work at a Struck Plant",
      text: "A recruiter offers high pay at a plant where workers are on strike. Some employers hired Southern migrants as strikebreakers, and many unions then kept Black workers out.",
      source: EGP,
      choices: [
        { label: "Ask the Armstrong Association for other leads", effect: { days: 2, morale: 1 }, outcome: "The Urban League office finds you a steady job at a shipyard." },
        { label: "Take the job for the pay", effect: { money: 500, morale: -3 }, outcome: "The pay is good, and the picket line is tense.", later: { days: 7, effect: { morale: -5 }, text: "When the strike ends, the company lets the new workers go." } },
      ],
    },
    {
      id: "nb-school", legs: [3, 4], title: "Night School",
      text: "A church runs a free night school for newcomers: reading, arithmetic and how to apply for jobs in the city.",
      source: EGP,
      choices: [
        { label: "Sign up and go tonight", effect: { days: 1, morale: 4 }, outcome: "The teacher shows you how to read a city map and the help-wanted pages." },
        { label: "Save your evenings for rest", effect: {}, outcome: "Maybe next month." },
      ],
    },
    {
      id: "nb-church", legs: [3, 4], title: "A Church Supper",
      text: "Black churches in Northern cities opened their doors to newcomers with meals, rooms and advice about jobs.",
      source: EGP,
      choices: [
        { label: "Go to the supper for newcomers", effect: { food: 3, morale: 3 }, outcome: "You meet two people from Durham and a deacon who knows a foreman at the shipyard." },
        { label: "Keep looking for work instead", effect: { morale: -1 }, outcome: "A long day of knocking on doors." },
      ],
    },
    {
      id: "nb-draft", legs: [1, 2], title: "Registration Day",
      text: "On June 5, 1917, men aged 21 to 30 must register for the World War I draft. Your older cousin in Washington is going to register.",
      source: "National Archives, \"World War I Draft Registration Cards\", https://www.archives.gov/research/military/ww1/draft-registration",
      choices: [
        { label: "Go with him to the registration office", effect: { days: 1, morale: 1 }, outcome: "Hundreds of men stand in line. Many say they hope to serve and come home to equal rights." },
        { label: "Write him a letter instead", effect: {}, outcome: "You promise to write while he serves." },
      ],
    },
    {
      id: "nb-heat", legs: [3, 4], title: "City Heat",
      text: "The summer heat in the crowded city is hard. You have walked to job offices all week.",
      source: EGP,
      choices: [
        { label: "Rest a day", effect: { days: 1, morale: 2 }, outcome: "You rest in the shade of the church yard." },
        { label: "Keep looking for work", effect: { morale: -2 }, outcome: "Hot, tired, and still determined." },
      ],
    },
  ],
  transmissions: [
    { kind: "LETTER FROM HOME", from: "Mama, in Durham", text: "Baby, we pray for you every night. Remember to write, and keep your money sewn in your coat." },
    { kind: "WIRE FROM PHILADELPHIA", from: "Your cousin Lucille", text: "SHIPYARD STILL HIRING STOP COME BEFORE THE JOB IS FILLED STOP ROOM WAITING STOP" },
    { kind: "LETTER FROM HOME", from: "Your little sister", text: "Teacher read us a letter from someone in Chicago in the newspaper. Is it true you can sit anywhere on the streetcar?" },
    { kind: "WIRE FROM PHILADELPHIA", from: "Your cousin Lucille", text: "FOREMAN ASKS FOR YOU BY NAME STOP BRING YOUR LETTER STOP" },
    { kind: "LETTER FROM HOME", from: "Pastor Jones, White Rock Baptist Church", text: "The whole congregation is proud of you. Write us about the churches up north." },
  ],
  guide: {
    intro: "This exhibit is about the Great Migration. Between 1916 and 1918, hundreds of thousands of Black Southerners moved north. You'll travel by train from Durham, write letters home, and keep the Ledger of the journey.",
    outro: "You've arrived. Millions more would follow between 1910 and 1970, changing American cities, music, politics and civil rights. Migrants' own letters let us hear their voices. Let's look at your Ledger.",
  },
  motif: [[262, 2], [311, 1], [349, 1], [392, 2], [349, 1], [311, 1], [262, 3]],
  topic: /great migration|migrat|chicago|harlem|jim crow|defender|segregat|civil rights|naacp/i,
};
