# F1 Metrix — frontend

The existing `PAndreew/f1-metrix-front` repository, updated into a static analytical journal. No new GitHub repository was created for this implementation.

## Deployment boundary

- **Vercel:** HTML, CSS, Chart.js, browser-local SQLite/WASM and published articles.
- **Existing F1 Metrix VPS backend:** F1DB watcher, source validation, full PyMC fits, held-out simulations, evidence collection and LLM generation.
- **GitHub Actions:** frontend tests only. No production fitting or editorial generation.

The previous Next.js/Supabase frontend is retained under `legacy/next-app/` and in Git history. The active site no longer needs Supabase, Prisma, a live SQL server or serverless functions. Its Bearblog-inspired design uses system typography, muted backgrounds and red accents.

## Development

Node 22 is required. Standard-library `node:sqlite` builds the small read-only browser database; no Python installation is required on Vercel.

```sh
npm ci --include=dev
npm test
npm run dev
npm run build
npm run preview
```

The explorer runs SQLite in a Web Worker. It supports search, minimum-race and active-era filters, sortable columns, pagination and CSV export. If WASM fails it falls back to the same published JSON dataset. Charts include numerical data tables and uncertainty captions.

For browser tests, first install Chromium with `npx playwright install chromium`, start the production preview on port 5178, then run `npm run test:browser`. `BASE_URL` can select another preview URL.

## Publication contract

The VPS publishes a consistent commit containing:

- `publication/model.json`: validated model snapshot, including diagnostics and provenance.
- `publication/articles/<race-id>.json`: source-linked, validated article documents and deterministic numerical chart data.

The frontend build converts those files into static artifacts and a small SQLite database. Bad model diagnostics fail the build; they do not silently fall back to legacy rankings. In the absence of any validated publication, `data/bootstrap.json` supplies an explicitly labelled, non-converged historical **preview**, not current scientific results.

The worker must finish validating every file before committing a publication. Vercel deploys the complete commit, so visitors do not see mixed releases. This repo does not poll F1DB or call an LLM during a build or visitor request.

Model gate: finite R-hat at most 1.01, bulk ESS at least 400, zero divergences. These diagnostics do not establish predictive calibration. Race simulations are retrospective held-out reconstructions conditional on avoiding technical retirement, not live forecasts or pure driver-skill ratings.

## Vercel

Import this existing repository, using its root. `vercel.json` configures `npm run build` and `site/dist`, with the Vite framework. No database environment variables are needed. The initial version uses hash routes. Per-article prerendering, RSS and richer social metadata remain follow-up work.

Vercel authentication is managed outside the repository. Never commit API credentials or deployment hooks. Worker credentials belong on the VPS, not Vercel or the browser.

## Data and legacy material

Code licensing does not relicense third-party timing, journalism, branding or radio. The legacy database/articles are preserved as historical material, not presented as a validated current publication. No journalism scraping or radio transcription is implied by the UI. Nothing from the legacy database is sent to visitors unless deliberately exported into the publication contract.
