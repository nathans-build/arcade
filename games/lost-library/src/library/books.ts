import type { BookId, WingId } from "./world";

/*
 * The nine lost books. Returning one puts it back on the bookshelf (title screen and hub), with a
 * short fun-fact card. Every fact is a well-known, checkable one.
 */
export interface Book {
  id: BookId;
  title: string;
  wing: WingId | "reading";
  /** Spine color on the shelf. */
  color: string;
  fact: string;
}

export const BOOKS: Book[] = [
  { id: "math", title: "The Big Book of Numbers", wing: "math", color: "#e3262f",
    fact: "The equals sign (=) was invented in 1557 by Robert Recorde. He used two matching lines because \"no two things can be more equal.\"" },
  { id: "math-bonus", title: "Googol and Friends", wing: "math", color: "#ff8a3d",
    fact: "A googol is a 1 followed by 100 zeros. The name was made up by a 9-year-old boy, the nephew of a mathematician." },
  { id: "science", title: "Wonders of Nature", wing: "science", color: "#2fbf71",
    fact: "An octopus has three hearts and blue blood." },
  { id: "science-bonus", title: "Light Travels Fast", wing: "science", color: "#3ad6c6",
    fact: "Sunlight takes about 8 minutes to travel from the Sun to Earth." },
  { id: "story", title: "Tales and Tellers", wing: "story", color: "#b05cff",
    fact: "Dr. Seuss wrote Green Eggs and Ham using only 50 different words." },
  { id: "story-bonus", title: "A Is for Alpha", wing: "story", color: "#ff6fb5",
    fact: "The word alphabet comes from alpha and beta, the first two letters of the Greek alphabet." },
  { id: "history", title: "Maps of the World", wing: "history", color: "#2456e8",
    fact: "In 1903 the Wright brothers made the first powered airplane flights near Kitty Hawk, North Carolina." },
  { id: "history-bonus", title: "Mountains of North Carolina", wing: "history", color: "#8a5a2b",
    fact: "Mount Mitchell in North Carolina is the highest mountain east of the Mississippi River." },
  { id: "reading", title: "The Never-Ending Story Book", wing: "reading", color: "#ffd23f",
    fact: "The Library of Congress in Washington, D.C. is one of the largest libraries in the world, with millions of books." },
];

export const BOOK_BY_ID = new Map(BOOKS.map((b) => [b.id, b]));
export const WING_BOOK: Record<WingId, BookId> = { math: "math", science: "science", story: "story", history: "history" };
export const BONUS_BOOK: Record<WingId, BookId> = { math: "math-bonus", science: "science-bonus", story: "story-bonus", history: "history-bonus" };
