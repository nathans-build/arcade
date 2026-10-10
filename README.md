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
menu), read-aloud for K–2, saved progress and chip sounds. Each game keeps an identical copy in
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
  the device. A brand-new device opens the player menu with a welcome. A device that already had
  saved progress becomes "Player 1" with everything kept. Nothing leaves the device. Credits always
  say the games were created by SpiderBen10 (NZDO).
- **Subject and topic:** two dropdowns. Subject is All, Math, Science, Reading & Writing or Social
  Studies. Once a subject is picked, Topic narrows it (for example Math → Geometry & angles). Each
  option shows how many games it has. Topics are listed in `window.TOPICS` at the top of
  `site/games.js`, and each game lists its topic ids in `topics`. `scripts/check-games.js` (run by
  the build) fails if a game has a subject without a topic, or an unknown topic id. Keys: `,` `.`
  subject, `;` `'` topic.
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
