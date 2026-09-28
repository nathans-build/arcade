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
     subjects: ["Math"],
     grade: "Grade 6",
     url: "https://<game>.azurestaticapps.net/",
     image: "img/space-racer.png",
     year: 2026,
   },
   ```

4. Push to `main`. The arcade redeploys automatically and the new cabinet and credits line appear.

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
