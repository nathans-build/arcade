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

## Deploying

Lunar Patrol Academy lives in SpiderBen10's Arcade repository (`games/lunar-patrol/`). The arcade's deploy workflow
builds and tests it and publishes it at `/lunar-patrol/` on the arcade's Azure app. (It used to have its
own repository and Azure app; the repository is archived.)

