# Fit+ Food Detective

A visitor-friendly food discovery game: five picture questions, thirty seconds of answering time, and a new clue after every answer. Created for a Young Coder exhibition and connected to [Fit+](https://lauyanshen.github.io/fitplus/).

## Play locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 4173
```

Open the local address printed by Vite. Use the browser's full-screen mode for the laptop display. Click either picture or press **1** or **2** to answer.

## What works

- Start, question/answer and results screens matching the chosen visual flow.
- Fifteen questions across five topics. Each round draws one per topic and shuffles their order and answer positions.
- Thirty seconds of answering time; the timer pauses during explanations. Every answer must be submitted before time expires.
- Untimed play, optional sound, encouraging badges, replay and return to start.
- Genuine daily best score stored on the current device. Accuracy ranks before speed; untimed play is excluded. No names, accounts or analytics.
- Explore Fit+ opens the GitHub-hosted app in a separate tab. AI features reuse the original protected connection and require its authorized sign-in.
- Voting invitation is text only. The game does not cast or collect votes.
- Local images and fonts; production build includes an offline cache.

## GitHub Pages

The game is configured for **https://lauyanshen.github.io/fitboothchallenge/**.

In repository **Settings → Pages**, set **Source** to **GitHub Actions**. The workflow **Deploy game to GitHub Pages** builds and publishes `dist/client` on every push to `main`, or when manually run from **Actions**. No additional workflow template is needed.

The deployment sets `VITE_BASE_PATH=/fitboothchallenge/`. Local builds keep `/` by default. Images, scripts, fonts and offline caching respect the deployment path. If you rename the repository, update that path in `.github/workflows/deploy.yml`.

## Production and offline use

```sh
npm test
npm run build
npm run test:sites
npx playwright install chromium
npm run test:e2e
npm run preview -- --host 127.0.0.1 --port 4174
```

Open the production preview once while connected and let the page finish loading. The service worker caches the game and local assets for subsequent offline visits on the same browser and origin. Offline caching requires HTTPS or localhost. A local server still needs to run. The external Fit+ app and the sources need internet. The development server does not install the offline cache.

The project retains the Product Design starter's Sites-compatible build, but has not been published to Sites. `dist/client` contains static game files and `dist/server` contains the optional Sites Worker.

## Content

Question data is in `src/game.js`. Natural food names are used; ingredient clues appear only when necessary for an accurate comparison. Example nutrition labels are explicitly identified as examples, not claims about a real product. Food photographs are illustrative AI-generated assets.

Facts checked against:

- [USDA Food Buying Guide — Grains](https://foodbuyingguide.fns.usda.gov/FoodComponents/ResourceGrains)
- [USDA Food Buying Guide — Fruits](https://foodbuyingguide.fns.usda.gov/FoodComponents/ResourceFruits)
- [CDC — Water and Healthier Drinks](https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/)

## Design and privacy

Visitor screens contain no internal exhibition/setup wording. No personal health data is requested. Rewards and replay are independent of voting. Fonts are Nunito and Nunito Sans (SIL Open Font License); icons are Phosphor (MIT). Assets were generated for this project with OpenAI ImageGen.

To reset a daily best manually, remove `fit-detective-best-v1` from this origin's browser local storage. Records expire at local midnight. Local storage is not a tamper-proof competition ranking.
