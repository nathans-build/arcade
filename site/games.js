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
    url: "https://purple-meadow-0f28d7a0f.5.azurestaticapps.net/",
    image: "img/lunar-patrol.png",
    year: 2026,
  },
  {
    id: "web-invaders",
    title: "Web Invaders",
    tagline: "Invaders carry the answers. Web the right one before the formation lands.",
    subjects: ["Math", "Science", "ELA"],
    url: "https://polite-grass-0e34fa60f.5.azurestaticapps.net/",
    image: "img/web-invaders.png",
    year: 2026,
  },
  {
    id: "factor-blaster",
    title: "Factor Blaster",
    tagline: "Blast number rocks and watch them split into their factors.",
    subjects: ["Math"],
    url: "https://victorious-mushroom-00cefef0f.2.azurestaticapps.net/",
    image: "img/factor-blaster.png",
    year: 2026,
  },
  {
    id: "sum-stack",
    title: "Sum Stack",
    tagline: "Stack falling number blocks so every row hits the target.",
    subjects: ["Math"],
    url: "https://nice-cliff-076d7030f.5.azurestaticapps.net/",
    image: "img/sum-stack.png",
    year: 2026,
  },
  {
    id: "route-runner",
    title: "Route Runner",
    tagline: "Ride the street and deliver only to houses that fit the rule.",
    subjects: ["Science", "Math", "ELA"],
    url: "/route-runner/",
    image: "img/route-runner.png",
    year: 2026,
  },
  {
    id: "city-shield",
    title: "City Shield",
    tagline: "Stop the missiles whose math equals the target before they hit the city.",
    subjects: ["Math"],
    url: "/city-shield/",
    image: "img/city-shield.png",
    year: 2026,
  },
  {
    id: "rock-driller",
    title: "Rock Driller",
    tagline: "Drill through real rock layers and collect the fossils and gems buried inside.",
    subjects: ["Science"],
    url: "/rock-driller/",
    image: "img/rock-driller.png",
    year: 2026,
  },
];
