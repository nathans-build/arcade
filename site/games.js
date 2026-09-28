// The arcade's game list. To add a game, add one entry here and put a 16:10
// screenshot in img/. Order here is the order of the cabinets on the menu.
// `url: null` shows a "coming soon" cabinet. `grades` lists supported grades
// (omit it for games that cover K-12); the chosen grade is sent as ?grade=.
window.GAMES = [
  {
    id: "lunar-patrol",
    title: "Lunar Patrol Academy",
    tagline: "Jump craters, blast UFOs, and answer questions to refuel your moon rover.",
    subjects: ["Math", "Science", "ELA"],
    grades: ["6"], // which grades have questions; omit for K-12
    url: "https://purple-meadow-0f28d7a0f.5.azurestaticapps.net/",
    image: "img/lunar-patrol.png",
    year: 2026,
  },
  {
    id: "web-invaders",
    title: "Web Invaders",
    tagline: "Invaders carry the answers. Web the right one before the formation lands.",
    subjects: ["Math", "Science", "ELA"],
    url: null,
    image: null,
    year: 2026,
  },
  {
    id: "factor-blaster",
    title: "Factor Blaster",
    tagline: "Blast number rocks and watch them split into their factors.",
    subjects: ["Math"],
    url: null,
    image: null,
    year: 2026,
  },
  {
    id: "sum-stack",
    title: "Sum Stack",
    tagline: "Stack falling number blocks so every row hits the target.",
    subjects: ["Math"],
    url: null,
    image: null,
    year: 2026,
  },
];
