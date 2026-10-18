# Prototype Instructions

## Fit+ game decisions

- This is a standalone companion to Fit+; preserve the existing Fit+ app.
- Screen 1 is the light Food Detective welcome, screen 2 is the green two-choice question, screen 3 is the celebratory score and Fit+ link.
- All visible language is for visitors. Never use "Booth Challenge", "Next Visitor", internal setup descriptions or demo scores in the UI.
- Use natural food names. Do not use giveaway labels such as "milk tea with added sugar". Ask precise questions rather than calling foods good/bad.
- Store no names or health data. Voting stays separate from rewards.
- Use local photo assets and fonts; keep production offline caching working.

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
