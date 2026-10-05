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
     grades: ["5", "6", "7", "8"],  // omit for K-12; used by the "Fits my grade" filter
     url: "/space-racer/",
     image: "img/space-racer.png",
     year: 2026,
     added: "2026-10-15",           // shows in the NEW row for 30 days
   },
   ```

4. Push to `main` (or merge its PR). The arcade redeploys automatically; the new cabinet appears
   under its subject tabs and in NEW, and its line appears on the credits page (`site/credits.html`).

## Games hosted inside the arcade

Every game lives in this repository and is served by the arcade's single Azure app (the Free tier
on this subscription allows only a few apps). Each one is a complete Vite project in
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

The marquee hero is an original pixel-art character drawn in code (`site/app.js`), not affiliated
with Marvel or any game studio.

## Dev site and production (nzdogames.com)

| Site | Address | Deployed from | Workflow |
|---|---|---|---|
| **Production** (the real arcade) | https://nzdogames.com | the `production` branch | `.github/workflows/deploy-production.yml` (secret `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD`) |
| **Dev / test** | https://icy-smoke-05363610f.3.azurestaticapps.net | `main` (plus a preview per pull request) | `.github/workflows/azure-static-web-apps.yml` (secret `AZURE_STATIC_WEB_APPS_API_TOKEN`) |

- Work lands on `main` first and shows up on the dev site, which has a striped **DEV** ribbon, a
  `[DEV]` tab title and a `robots.txt` that keeps search engines out.
- **To publish to production:** open a pull request from `main` into `production` and merge it.
- `scripts/build-site.sh` reads `ARCADE_ENV` (`dev` by default, or `production`) and writes
  `env.js` and `robots.txt` for that site.
- Games link back to the menu with a relative `/` link (`ARCADE_URL` in `kit/grades.ts`), so each
  site's games stay on that site.
