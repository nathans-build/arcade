# Lunar Patrol Academy

A *Moon Patrol*-style arcade game where K–12 players answer math, science and ELA questions
(NC Standard Course of Study) to keep their moon rover fueled.

- Jump craters and boulders, shoot UFOs, and reach checkpoints A → Z.
- Each checkpoint asks a question. Right answers refuel the rover.
- Mid-sector a **Quiz Squadron** of UFOs labelled A–D arrives: press the letter (or tap the answer)
  to fire at the UFO carrying the right answer.
- The rover gets a new paint job every run.

Game design, controls, question bank and how to add questions: [`docs/lunar-patrol.md`](docs/lunar-patrol.md).

## Run it locally

```sh
npm install
npm run dev        # http://localhost:8080
npm run build      # type-check + production build into dist/
```

## Deploying to Azure

Every push to `main` builds the game and publishes it to Azure Static Web Apps
(`.github/workflows/azure-static-web-apps.yml`). Pull requests get their own preview link.
The deploy step is skipped until the token below is added, so the build still runs and checks the code.

One-time setup, from any browser at https://shell.azure.com (Bash):

```sh
az group create -n rg-lunar-patrol -l eastus2
az deployment group create -g rg-lunar-patrol -f infra/main.bicep   # or: az staticwebapp create -n lunar-patrol-academy -g rg-lunar-patrol -l eastus2 --sku Free
az staticwebapp secrets list -n lunar-patrol-academy -g rg-lunar-patrol --query properties.apiKey -o tsv
```

Copy the printed token into this repository under
**Settings → Secrets and variables → Actions → New repository secret**, named
`AZURE_STATIC_WEB_APPS_API_TOKEN`. The next push to `main` publishes the game at
`https://<name>.azurestaticapps.net`.

The token can only publish to that one web app. Revoke or rotate it in the Azure portal at any time.
The Free tier covers this game (static files only, no server).
