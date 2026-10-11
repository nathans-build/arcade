import type { Grade, Question } from "../kit/types";
import { makeQ, type Band } from "./qmake";

/*
 * Dojo Tower's own civics bank (Floor 3, "Judge Gavel-Fist"), written for this game.
 * NC Standard Course of Study for Social Studies (2021), Civics & Government strand:
 *   K.C&G.1, 1.C&G.1, 2.C&G.1   rules, community helpers, leaders, voting
 *   3.C&G.1, 4.C&G.1, 5.C&G.1   local and state government; the three branches
 *   7.C&G.1, 8.C&G.1            government, the Constitution and the Bill of Rights
 *   CL.C&G.2, CL.C&G.3          (Civic Literacy) how a bill becomes law; rights and responsibilities
 * Codes are standard-level (no objective number) because only the standard is certain.
 * Every item is authored with the correct choice first (answer 0); decks shuffle at runtime.
 * `quick` is computed (prompt ≤ 100 characters, every choice ≤ 14).
 */

type Row = [grade: Grade, standard: string, skill: string, prompt: string, choices: [string, string, string, string], explanation: string];

const K2: Row[] = [
  ["K", "K.C&G.1", "Why we have rules", "Why do we have rules?", ["Keep us safe", "Make us sad", "Waste time", "Stop all fun"],
    "Rules keep us safe and help everyone be treated fairly."],
  ["K", "K.C&G.1", "Following rules", "The class rule is to raise your hand to talk. What do you do?", ["Raise my hand", "Shout it out", "Run around", "Hide my words"],
    "Following the rule lets everyone get a turn to talk and be heard."],
  ["K", "K.C&G.1", "Consequences", "What can happen when someone breaks a rule?", ["A consequence", "A parade", "A free toy", "A birthday"],
    "Breaking a rule has a consequence, like losing a turn. It helps us remember the rule."],
  ["K", "K.C&G.1", "Community helpers", "Who helps put out fires?", ["Firefighter", "Baker", "Pilot", "Farmer"],
    "Firefighters are community helpers. They put out fires and keep people safe."],
  ["K", "K.C&G.1", "Community helpers", "Who brings letters to your mailbox?", ["Mail carrier", "Dentist", "Chef", "Lifeguard"],
    "A mail carrier delivers letters and packages to homes and businesses."],
  ["K", "K.C&G.1", "Community helpers", "A crossing guard helps kids...", ["Cross safely", "Bake bread", "Fix teeth", "Fly planes"],
    "Crossing guards stop traffic so kids can cross the street safely on the way to school."],
  ["1", "1.C&G.1", "Community helpers", "Who helps keep a town safe and makes sure people follow laws?", ["Police officer", "Painter", "Florist", "Baker"],
    "Police officers help keep the community safe and make sure laws are followed."],
  ["1", "1.C&G.1", "Good citizens", "Which one shows a good citizen?", ["Helps others", "Drops litter", "Breaks rules", "Takes toys"],
    "Good citizens help others, follow rules and take care of their community."],
  ["1", "1.C&G.1", "Fair play", "Which helps keep the playground fair?", ["Taking turns", "Cutting line", "Grabbing toys", "Yelling"],
    "Taking turns is fair. Everyone gets a chance to play."],
  ["1", "1.C&G.1", "Voting", "Your class votes on a game. Which game do you play?", ["Most votes", "Fewest votes", "Loudest kid", "Last idea"],
    "In a vote, the choice with the most votes wins. That is called majority rule."],
  ["1", "1.C&G.1", "Local leaders", "Who is the leader of a city or town?", ["The mayor", "The pilot", "The chef", "The coach"],
    "A mayor leads a city or town. Many towns choose their mayor by voting."],
  ["2", "2.C&G.1", "National leaders", "Who is the leader of our whole country?", ["The President", "The mayor", "A teacher", "The sheriff"],
    "The President of the United States leads our country. Voters choose a President every 4 years."],
  ["2", "2.C&G.1", "Laws", "A law is...", ["A rule for all", "A kind of food", "A song", "A game piece"],
    "Laws are rules that everyone in a town, state or country has to follow."],
  ["2", "2.C&G.1", "Voting", "Grown-up citizens choose leaders by...", ["Voting", "Arm wrestling", "Coin tossing", "Shouting"],
    "In our democracy, citizens vote to choose their leaders."],
  ["2", "2.C&G.1", "U.S. symbols", "How many stars are on the U.S. flag?", ["50", "13", "10", "100"],
    "The flag has 50 stars, one for each state. Its 13 stripes stand for the first 13 colonies."],
];

const G35: Row[] = [
  ["5", "5.C&G.1", "Three branches", "Which branch of government makes the laws?", ["Legislative", "Executive", "Judicial", "Military"],
    "The legislative branch (Congress) writes and passes laws."],
  ["5", "5.C&G.1", "Three branches", "Which branch carries out the laws?", ["Executive", "Legislative", "Judicial", "Library"],
    "The executive branch, led by the President, carries out (enforces) the laws."],
  ["5", "5.C&G.1", "Three branches", "Which branch decides what laws mean?", ["Judicial", "Executive", "Legislative", "Weather"],
    "The judicial branch is the courts. Judges decide what laws mean and if they follow the Constitution."],
  ["5", "5.C&G.1", "Three branches", "Who leads the executive branch of the U.S.?", ["The President", "The governor", "Chief Justice", "The mayor"],
    "The President is the head of the executive branch of the national government."],
  ["5", "5.C&G.1", "Congress", "Congress has two parts: the Senate and the...", ["House of Reps", "Supreme Court", "Cabinet", "City council"],
    "Congress is the Senate plus the House of Representatives."],
  ["5", "5.C&G.1", "Congress", "How many U.S. senators does each state get?", ["2", "1", "10", "50"],
    "Every state gets 2 senators, no matter how many people live there."],
  ["5", "5.C&G.1", "Supreme Court", "How many justices sit on the U.S. Supreme Court?", ["9", "7", "12", "50"],
    "The Supreme Court has 9 justices: one Chief Justice and 8 associate justices."],
  ["5", "5.C&G.1", "Checks and balances", "When the President rejects a bill, it is called a...", ["Veto", "Vote", "Verdict", "Vow"],
    "A veto is the President saying no to a bill. Congress can still override it with a two-thirds vote."],
  ["5", "5.C&G.1", "Checks and balances", "Checks and balances keep one branch from having...", ["Too much power", "Any workers", "A building", "Holidays"],
    "Each branch can check, or limit, the others, so no single branch gets too much power."],
  ["4", "4.C&G.1", "Presidential term", "How many years is one term for a U.S. President?", ["4", "2", "6", "10"],
    "A President's term is 4 years, and a President can be elected at most two times."],
  ["3", "3.C&G.1", "State government", "Who leads North Carolina's state government?", ["The governor", "The mayor", "The President", "The sheriff"],
    "The governor is the head of the executive branch of North Carolina's state government."],
  ["3", "3.C&G.1", "State government", "Who chooses North Carolina's governor?", ["NC voters", "The President", "The mayor", "The Senate"],
    "North Carolina voters elect the governor for a 4-year term."],
  ["3", "3.C&G.1", "State government", "North Carolina's state lawmakers meet together in the...", ["General Assembly", "White House", "Town hall", "Supreme Court"],
    "North Carolina's legislature is called the General Assembly. It meets in Raleigh, the state capital."],
  ["3", "3.C&G.1", "State government", "In which city does NC's state government meet?", ["Raleigh", "Charlotte", "Asheville", "Wilmington"],
    "Raleigh is the capital of North Carolina, where the governor works and the General Assembly meets."],
  ["3", "3.C&G.1", "Local government", "Who makes local laws for a city?", ["City council", "The President", "Congress", "A museum"],
    "A city council makes local laws, called ordinances, and plans the city's budget."],
  ["3", "3.C&G.1", "Local government", "Local governments use tax money to pay for...", ["Fire trucks", "Movie stars", "Video games", "Pet parrots"],
    "Local taxes pay for services everyone shares, like fire departments, parks and libraries."],
  ["4", "4.C&G.1", "NC counties", "How many counties does North Carolina have?", ["100", "50", "13", "75"],
    "North Carolina is divided into 100 counties. Each county has its own local government."],
];

const G68: Row[] = [
  ["8", "8.C&G.1", "Bill of Rights", "The first ten amendments to the Constitution are called the...", ["Bill of Rights", "Preamble", "Articles", "Declaration"],
    "The first ten amendments, added in 1791, are the Bill of Rights. They protect people's basic freedoms."],
  ["8", "8.C&G.1", "First Amendment", "The First Amendment protects freedom of...", ["Speech", "Driving", "Free movies", "Owning pets"],
    "The First Amendment protects freedom of speech, religion, the press, assembly and petition."],
  ["8", "8.C&G.1", "The Constitution", "The opening part of the Constitution that starts \"We the People\" is the...", ["Preamble", "Bill of Rights", "Amendment", "Signature"],
    "The Preamble explains the goals of the Constitution. It begins with \"We the People.\""],
  ["8", "8.C&G.1", "The Constitution", "In what year was the U.S. Constitution written and signed?", ["1787", "1776", "1812", "1865"],
    "The Constitution was written at the Constitutional Convention and signed on September 17, 1787."],
  ["8", "8.C&G.1", "The Constitution", "In which city was the Constitution written?", ["Philadelphia", "Washington", "Boston", "Raleigh"],
    "Delegates met at the Constitutional Convention in Philadelphia in 1787."],
  ["8", "8.C&G.1", "The Constitution", "The Constitution replaced the Articles of Confederation because the national government was...", ["Too weak", "Too strong", "Too rich", "Too old"],
    "Under the Articles, the national government could not collect taxes or enforce laws well, so it was too weak."],
  ["8", "8.C&G.1", "Federalism", "Federalism shares power between the national government and the...", ["States", "Banks", "Schools", "Newspapers"],
    "In federalism, power is divided between the national government and the state governments."],
  ["8", "8.C&G.1", "Separation of powers", "Separation of powers splits the government into how many branches?", ["3", "2", "4", "5"],
    "The Constitution creates three branches: legislative, executive and judicial."],
  ["8", "8.C&G.1", "Amendments", "Which amendment protects against unreasonable searches?", ["4th", "1st", "10th", "19th"],
    "The 4th Amendment protects people from unreasonable searches and seizures."],
  ["8", "8.C&G.1", "Amendments", "Which amendment says you can't be forced to testify against yourself?", ["5th", "2nd", "13th", "26th"],
    "The 5th Amendment protects the right to remain silent instead of being a witness against yourself."],
  ["8", "8.C&G.1", "Amendments", "The 13th Amendment (1865) ended...", ["Slavery", "Voting", "Taxes", "Elections"],
    "The 13th Amendment, ratified in 1865, abolished slavery in the United States."],
  ["8", "8.C&G.1", "Amendments", "The 19th Amendment (1920) gave women the right to...", ["Vote", "Drive", "Own pets", "Sing"],
    "The 19th Amendment, ratified in 1920, protects women's right to vote."],
  ["8", "8.C&G.1", "Amendments", "The 26th Amendment lowered the voting age to...", ["18", "16", "21", "25"],
    "The 26th Amendment (1971) set the voting age at 18 for all elections."],
  ["8", "8.C&G.1", "Amending the Constitution", "How is the Constitution changed?", ["Amendments", "Vetoes", "Lawsuits", "Coin flips"],
    "The Constitution is changed by amendments. Most are proposed by two-thirds of Congress, then approved by three-fourths of the states."],
  ["8", "8.C&G.1", "Checks and balances", "Which branch has the power to declare war?", ["Congress", "The President", "Supreme Court", "The states"],
    "The Constitution gives Congress the power to declare war. The President is commander in chief of the military."],
  ["7", "7.C&G.1", "Types of government", "A government where citizens elect leaders to make laws for them is a...", ["Republic", "Monarchy", "Dictatorship", "Empire"],
    "In a republic, people elect representatives to make laws. The United States is a constitutional republic."],
];

const HS: Row[] = [
  ["10", "CL.C&G.2", "How a bill becomes law", "After a bill is introduced in Congress, it is first sent to a...", ["Committee", "Judge", "Governor", "Jury"],
    "A new bill goes to a committee, which studies it, holds hearings and can change it before a full vote."],
  ["10", "CL.C&G.2", "How a bill becomes law", "Who can formally introduce a bill in Congress?", ["Member of Congress", "The President", "A governor", "A judge"],
    "Only a senator or representative can introduce a bill, though anyone (even the President) can suggest one."],
  ["10", "CL.C&G.2", "How a bill becomes law", "Bills to raise taxes (revenue bills) must start in the...", ["House", "Senate", "Supreme Court", "White House"],
    "The Constitution (Article I, Section 7) says revenue bills must start in the House of Representatives."],
  ["10", "CL.C&G.2", "How a bill becomes law", "The House and Senate pass different versions of a bill. Who works out one version?", ["Conference committee", "Grand jury", "Electoral College", "Cabinet"],
    "A conference committee of members from both chambers writes one version, which both must pass again."],
  ["10", "CL.C&G.2", "How a bill becomes law", "After both chambers pass the same bill, who can sign it into law?", ["The President", "Chief Justice", "Speaker", "Senate leader"],
    "The bill goes to the President, who can sign it into law or veto it."],
  ["10", "CL.C&G.2", "How a bill becomes law", "Congress is in session. The President doesn't sign or veto a bill for 10 days (not counting Sundays). It...", ["Becomes law", "Dies", "Goes to court", "Starts over"],
    "If Congress is in session, an unsigned bill becomes law after 10 days. If Congress has adjourned, it dies: a pocket veto."],
  ["10", "CL.C&G.2", "How a bill becomes law", "To override a President's veto, Congress needs a vote of...", ["Two-thirds", "One-half", "One-fourth", "Everyone"],
    "A veto is overridden when two-thirds of the House and two-thirds of the Senate vote for the bill."],
  ["10", "CL.C&G.2", "How a bill becomes law", "A senator talks for hours to delay a vote on a bill. This is a...", ["Filibuster", "Veto", "Recall", "Census"],
    "A filibuster delays or blocks a Senate vote. Ending one (cloture) usually takes 60 votes."],
  ["10", "CL.C&G.2", "Congress", "How many voting members does the U.S. House of Representatives have?", ["435", "100", "50", "538"],
    "The House has 435 voting members, divided among the states by population."],
  ["10", "CL.C&G.2", "Congress", "How long is one term for a U.S. senator?", ["6 years", "2 years", "4 years", "Life"],
    "Senators serve 6-year terms. Members of the House serve 2-year terms."],
  ["10", "CL.C&G.2", "State lawmaking", "In North Carolina, who can veto a bill passed by the General Assembly?", ["The governor", "The mayor", "Chief Justice", "The sheriff"],
    "NC's governor can veto most bills. NC was the last state to give its governor a veto, in 1996."],
  ["10", "CL.C&G.2", "Judicial review", "Judicial review, from Marbury v. Madison (1803), lets courts...", ["Overturn laws", "Write laws", "Veto bills", "Collect taxes"],
    "Judicial review lets courts strike down laws that go against the Constitution."],
  ["10", "CL.C&G.3", "Rights and responsibilities", "Which is a responsibility of U.S. citizens, not just a right?", ["Jury duty", "Free speech", "Free press", "Owning a pet"],
    "Serving on a jury when called is a citizen's duty. Free speech and a free press are rights."],
  ["10", "CL.C&G.3", "Rights and responsibilities", "Obeying laws and paying taxes are examples of civic...", ["Duties", "Rights", "Branches", "Amendments"],
    "Duties are things citizens must do, like obeying laws, paying taxes and serving on a jury."],
  ["10", "CL.C&G.3", "Rights and responsibilities", "What is the minimum age to vote in U.S. federal elections?", ["18", "16", "21", "25"],
    "The 26th Amendment set the voting age at 18. In NC you must also register before you vote."],
  ["10", "CL.C&G.3", "Rights and responsibilities", "\"Due process\" means the government must use fair ___ before taking life, liberty or property.", ["Procedures", "Weather", "Prices", "Music"],
    "The 5th and 14th Amendments promise due process: fair legal procedures, like a fair trial."],
  ["10", "CL.C&G.3", "Rights and responsibilities", "Young men ages 18 to 25 are required by law to register with the...", ["Selective Service", "Supreme Court", "Census Bureau", "Post office"],
    "Most men ages 18 through 25 must register with the Selective Service System."],
];

function build(band: Band, rows: Row[]): Question[] {
  return rows.map((r, i) => makeQ(`dt-civ-${band}-${String(i + 1).padStart(2, "0")}`, "social", ...r));
}

export const CIVICS: Record<Band, Question[]> = {
  k2: build("k2", K2),
  g35: build("g35", G35),
  g68: build("g68", G68),
  hs: build("hs", HS),
};
