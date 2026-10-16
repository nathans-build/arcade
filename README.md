# SpiderBen10's Arcade

The menu for every game created by **SpiderBen10 (NZDO)**: a red-and-blue 80s arcade with an
animated night-city marquee and one cabinet per game.

It's plain HTML, CSS and JavaScript in `site/`, with no build step. Open `site/index.html` in a
browser to try it locally.

## Adding a game

1. Deploy the game from its own repository (for example `nathans-build/lunar-patrol`).
2. Add a 16:10 screenshot to `site/img/` (640×400 works well).
3. Add an entry to `site/games.js`:

   ```js
   {
     id: "space-racer",
     title: "Space Racer",
     tagline: "One sentence about the game.",
     subjects: ["Math"],            // decides which subject tabs show it ("ELA" = Reading & Writing)
     topics: ["numbers", "algebra"], // topic chips under each subject tab (ids from window.TOPICS)
     styles: ["racing", "action"],  // 1–2 play styles from window.STYLES; the first is its main one
     length: "quick",               // "quick" or "adventure" (saves progress / longer sessions)
     inspiredBy: "Spy Hunter",      // optional: the classic it plays like (only used by search)
     grades: ["5", "6", "7", "8"],  // omit for K-12; used by the "Fits my grade" filter
     url: "/space-racer/",
     image: "img/space-racer.png",
     year: 2026,
     added: "2026-10-15",           // shows in the NEW row for 30 days
   },
   ```

4. Push to `main` (or merge its PR). The dev site redeploys automatically; the new cabinet appears
   under its subject tabs and in NEW, and its line appears on the credits page (`site/credits.html`).
   It reaches nzdogames.com only after it's tested and marked `prod: true` (see
   [Publishing to production](#publishing-to-production)).

## Games hosted inside the arcade

Every game lives in this repository and is served by the arcade's own Azure app (one for the dev
site, one for production) rather than an app per game (the Free tier allows only a few apps). Each one is a complete Vite project in
`games/<name>/` (its own `package.json`, tests and `src/kit` copy). `scripts/build-site.sh` builds and
tests every game and publishes it at `/<name>/` next to the menu, e.g.
`https://nzdogames.com/word-worm/` (and on the dev site). To add one, drop its folder into
`games/` and add a cabinet in `site/games.js` with `url: "/<name>/"`.

All nine games live here, including the first four (Lunar Patrol, Web Invaders, Factor Blaster,
Sum Stack), which were moved in with their history from their original repositories.

## Deploying to Azure

`.github/workflows/azure-static-web-apps.yml` publishes `site/` on every push to `main`; pull
requests get a preview link. It checks that the scripts parse, and skips the deploy until the token
below exists.

One-time setup in https://shell.azure.com (Bash):

```sh
az staticwebapp create -n spiderben10-arcade -g rg-lunar-patrol -l eastus2 --sku Free
az staticwebapp secrets list -n spiderben10-arcade -g rg-lunar-patrol --query properties.apiKey -o tsv
```

Save the printed token in this repository under **Settings → Secrets and variables → Actions** as
`AZURE_STATIC_WEB_APPS_API_TOKEN`. If you add a custom domain later, put it on this arcade app.

## Shared kit

`kit/` is the canonical copy of the code every game shares: K–12 questions tagged with NC standards
(generated math; written science and ELA banks in `kit/banks/`), grade handling (`?grade=` from this
menu), read-aloud for K–2, saved progress and chip sounds. Games can also have original NES-style
4-channel chiptune soundtracks (songs, jingles, separate Music and Sound-effects switches); see
`kit/README.md`. Each game keeps an identical copy in
`src/kit/`. After changing it here, copy the folder into each game repository. The `NOTES.md` files
in `kit/banks/` list standard codes to double-check against WCPSS pacing guides.

## Artwork

## The menu

- **Players (👤 on the banner):** each device can have up to 6 players, for example siblings sharing
  an iPad. The **player menu** holds everything that belongs to one player:
  - name, and the **arcade name** shown in the banner and tab ("Nathan's Arcade"; it follows the
    name until it's changed by hand)
  - grade (a dropdown, K–12; `[` and `]` also change it, and it rides along to every game as
    `?grade=`), adaptive math, "Fits my grade", read aloud (Auto / On / Off)
  - the theme
  - favorites and recently played, and **every game's progress, scores and saves**, including
    Page Quest bookmarks and Writer's Desk books

  How it works (`site/profile.js`): the menu and the games keep using their usual localStorage
  keys (`arcade.*`, `pageQuest.*`, `lunarPatrol.*`), which always hold the *active* player's values.
  Switching players files those keys away under the old player in `arcade.profiles`, restores the
  new player's, and reloads the menu, so no game needed changes. `arcade.muted` stays shared by
  the device. A brand-new device (or **+ New player**) opens the setup wizard below. A device that already had
  saved progress becomes "Player 1" with everything kept. Nothing leaves the device. Credits always
  say the games were created by SpiderBen10 (NZDO).
- **Setup wizard and tour** (`site/welcome.js`): a new player gets a 3-step wizard: name, age (which
  suggests a grade, since NC kindergarten starts at 5: grade = age − 5, and can be changed), and a
  theme (or 🎲 Surprise me). **Skip setup** keeps the defaults. Then a 4-tip tour points at the
  player menu, the search box (mentioning subjects, topics, play styles and 🎲 Surprise me), the ☆
  favorite and a game cabinet. The tour shows once
  per player (`arcade.tourDone`), including for players who were already set up, and **Show the
  tour** in the player menu replays it.
- **Subject and topic:** two dropdowns. Subject is All, Math, Science, Reading & Writing or Social
  Studies. Once a subject is picked, Topic narrows it (for example Math → Geometry & angles). Each
  option shows how many games it has. Topics are listed in `window.TOPICS` at the top of
  `site/games.js`, and each game lists its topic ids in `topics`. `scripts/check-games.js` (run by
  the build) fails if a game has a subject without a topic, or an unknown topic id. Keys: `,` `.`
  subject, `;` `'` topic.
- **Search** (the box above the shelves; press `/` from anywhere, `Esc` clears): live filtering as
  you type, ignoring case and accents, matching the start of a word or anywhere inside one. It looks
  at the title, play styles, subjects and topic names, Quick/Adventure, `inspiredBy` (so "pac" finds
  Maze Muncher and "frog" finds Lane Leap) and the tagline. While searching, the shelves give way to
  one flat list ranked title match → style/topic/classic → tagline (the sort menu orders games
  within each rank). It respects "Fits my grade" and the subject/topic/style/length filters, and
  says when matches are hidden by them ("1 more for other grades — show them"). `↓` or `Enter` in
  the box jumps to the first result.
- **Play styles:** `window.STYLES` in `site/games.js` lists them (🕹️ Action, 🧩 Puzzle, 🗺️ Adventure,
  🏎️ Racing, 📖 Stories & Creative, ⌨️ Typing, 🧸 Little Learners K–2), and each game lists 1–2 in
  `styles` (the first is its main style). With **All styles**, the menu shows one row per style in
  that order (a game with two styles is in both; in Recommended order a row lists the games whose
  main style it is first). On wide screens each row is a sideways strip with ◀ ▶ buttons; phones get
  the compact list with the first 4 games. **See all ▶** (or a style chip) shows that style's full
  grid. The chosen chip is saved per player (`arcade.style`).
- **Length:** each game has `length: "quick"` (pick up and play) or `"adventure"` (saves progress or
  plays in longer sessions: Page Quest, Dojo Tower, Trail Ledger, Thread Chasers, Clue Compass,
  Silly Story Studio, Sidewalk Stand, Plants vs Undead). Cabinets show ⏱️ Quick / 💾 Adventure, and
  the **Length** dropdown filters by it (`arcade.length`).
- **Sort** (`arcade.sort`): Recommended (the order in `games.js`), A–Z, Newest (by `added`, then
  order) or Recently played. It orders the style rows, the style grid and search results.
- `scripts/check-games.js` fails the build if a live game is missing `styles` (1–2 known ids) or
  `length`, or has an empty `inspiredBy`.
- **Shelves on top**, in order: ✨ New games, ★ Favorites, Recently played, then:
  - **👉 Try next:** up to 6 games this player hasn't played that share a style or subject with
    their recent and favorite games and fit their grade (topped up with unplayed games in
    Recommended order). Worked out on the device from the player's own launch history
    (`arcade.played`); nothing is sent anywhere. Hidden until they've played or starred something.
  - **🔥 Most played this week:** the top 5 games from `GET /api/popular` (below) that are on this
    menu. Fetched once, only on production (or on dev with `localStorage nzdo.trackDev = "1"`), with
    a 4-second timeout; any failure just leaves the row out. Hidden if fewer than 3 games are left or
    every count is under 5 plays.
- **🎲 Surprise me!** picks a random live game that fits the player's grade and the subject, topic,
  style and length filters, preferring games they haven't played, never the same game twice in a
  row (`arcade.lastSurprise`). It shows the pick with **Play ▶** and **Another 🎲**, and flashes its
  cabinet on the shelves.
- **Keyboard:** `◀ ▶` move along a row (and on to the next), `▲ ▼` move to the row above or below,
  `Enter` plays, plus the grade/subject/topic/favorite keys above.
- **Themes:** picked in the player menu; each sets the banner scene and the page colors
  (`arcade.theme`, saved per player). `site/theme-boot.js` applies it before the page draws. The scenes are in
  `site/marquee.js`, and the colors are `[data-theme=...]` blocks at the top of `site/styles.css`.

  | Theme | Banner |
  |---|---|
  | Web Slinger (default) | The arcade's original hero swinging over a night city |
  | Stick Figure | A black-and-white stick man (two dot eyes, no mouth) on a white page; pick its hat and how it moves (swing, run, fly) |
  | Rocket Armor | A hero in red-and-gold rocket armor flying over a sunset city |
  | Lab Mice | Two lab mice crossing the bench, one dreaming of the whole world |
  | Unicorn Sky | A unicorn galloping past a rainbow, on a pastel page |
  | Idol Hunters | A pop trio on stage singing away goofy little demons |
  | Speed Streak | A lightning-fast runner racing along a city overpass with a lightning trail; pick the suit (scarlet, rival, junior, shadow or frost) |

  Every character is original pixel art drawn in code. The themes are *inspired by* kinds of
  heroes kids like, but use no characters, names or logos from Marvel, DC, Warner Bros., Netflix
  or anyone else.

## Support page and usage stats

### Support page (`site/support.html`)
- **💛 Support the arcade (grown-ups)** in the player menu and on the credits page opens the
  support page. It starts with a quick grown-up check (a times-table question), then shows two
  separate ways to help:
  - **Tip the arcade:** optional tips for hosting and new games (not tax-deductible).
  - **Give to a children's charity:** a link straight to the charity's own donation page. The
    money goes to the charity, not the arcade, so there's no "percentage of tips" promise to manage.
- Links go in `site/support-config.js` (`tips` and `charity`). Public links only, never keys.
  Until one is set, the button is hidden on nzdogames.com (the dev site shows a preview).

### Privacy Policy and Terms of Use
- `site/privacy.html` and `site/terms.html` (plain-language drafts, linked from the footers, the
  credits page and the support page). The owner and contact email come from `site/site-info.js`.
  Have a lawyer review them before relying on them.
- **Fonts are served from this site** (`site/fonts/`, SIL Open Font License), so no page contacts
  Google or any other third party. Every game's `index.html` uses `/fonts/fonts.css`.

### Usage stats (our own, private)
- `site/track.js` runs on the menu and on every game page (`scripts/build-site.sh` adds it to
  each game). It only sends on **production**, and not at all for browsers sending Global
  Privacy Control. Events: a menu **visit** (once a day per device it also sends grade, device
  type, time zone and theme), a game **play** (game and grade) and **time** (seconds a game was
  actually on screen).
- `api/` is a small Azure Functions app that Static Web Apps deploys with the site
  (`api_location: api`). `POST /api/track` adds the event to **daily totals** in Azure Table
  Storage. It never reads or stores IP addresses, user agents, names or IDs, and sets no cookies.
  `GET /api/stats?days=30` returns the report.
- `GET /api/popular` (public, `api/src/functions/popular.js`) returns only
  `{ games: [{ id, plays }] }`: the top 8 games by plays over the last 7 days, from the same daily
  totals (`popular()` in `api/src/lib/metrics.js`). Without storage it returns `{ games: [] }`. It is
  cached for 15 minutes (`cache-control: public, max-age=900`) and stays anonymous in
  `site/staticwebapp.config.json`. The menu's "🔥 Most played this week" row uses it.
- **`/stats.html`** shows the report: visits, devices, most-played games with total and average
  play time, plays by day, grades, device types, time zones and themes. It is locked to the
  `owner` role (`site/staticwebapp.config.json`); other visitors are sent to GitHub sign-in.
- Tests: `cd api && npm test`.

**One-time Azure setup (in the portal, by the owner):**
1. Create a **Storage account** (Standard, LRS; it costs cents a month) and copy its
   **connection string** (Security + networking → Access keys).
2. In the production Static Web App: **Settings → Environment variables** → add
   `ANALYTICS_STORAGE` = that connection string. (Until it exists, tracking quietly does nothing.)
3. **Settings → Role management → Invite**: your GitHub account, role `owner`. Open the invite
   link once, then visit https://nzdogames.com/stats.html.

## Dev site and production (nzdogames.com)

**Live since October 7, 2026.** The real arcade is at **https://nzdogames.com**.

| Site | Address | Azure app | Deployed from | Workflow |
|---|---|---|---|---|
| **Production** (the real arcade) | https://nzdogames.com (www redirects to it); Azure address https://gentle-tree-0a25b090f.6.azurestaticapps.net | `nzdogames-prod` | the `production` branch | `.github/workflows/deploy-production.yml` (secret `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD`) |
| **Dev / test** | https://icy-smoke-05363610f.3.azurestaticapps.net | the original arcade app | `main` (plus a preview per pull request) | `.github/workflows/azure-static-web-apps.yml` (secret `AZURE_STATIC_WEB_APPS_API_TOKEN`) |

- Work lands on `main` first and shows up on the dev site, which has a yellow **DEV** bar, a
  `[DEV]` tab title and a `robots.txt` that keeps search engines out.
- `scripts/build-site.sh` reads `ARCADE_ENV` (`dev` by default, or `production`) and writes
  `env.js` and `robots.txt` for that site.
- Games link back to the menu with a relative `/` link (`ARCADE_URL` in `kit/grades.ts`), so each
  site's games stay on that site.

### Only fully tested games go to production

A game reaches nzdogames.com only when its entry in `site/games.js` has `prod: true`. Production
builds skip every other game, and the production menu and credits list only the `prod: true` games.
The dev site shows every game, with a dashed **Dev only** chip on games that aren't on production
yet.

**On production now:** Page Quest, Sonar Squad.

### Publishing to production

1. Test the game on the dev site.
2. On `main`, add `prod: true` to its entry in `site/games.js` (by pull request, as usual).
3. Open a pull request from `main` into `production` and merge it. The production workflow builds
   and deploys in about a minute or two.
4. Check https://nzdogames.com: the game is listed and there is no DEV bar.

Don't commit to `production` directly; it should only ever receive merges from `main`.

### Domain and DNS (Porkbun)

nzdogames.com is registered at Porkbun. Its DNS points to the `nzdogames-prod` app:

| Type | Host | Value |
|---|---|---|
| ALIAS | *(root)* | `gentle-tree-0a25b090f.6.azurestaticapps.net` |
| CNAME | `www` | `gentle-tree-0a25b090f.6.azurestaticapps.net` |
| TXT | `_dnsauth` | Azure's domain validation code (safe to remove after validation) |

Azure provides the HTTPS certificate. `nzdogames.com` is the default domain in the app's
**Custom domains** settings. Email records (MX) are separate from the website; leave them alone
when changing the records above.
