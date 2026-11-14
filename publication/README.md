# HERA research-preview publication

These artifacts are actual saved-fit summaries, not bootstrap or illustrative values. No race article is included.

- Source: [F1DB v2026.20.0](https://github.com/f1db/f1db/releases/tag/v2026.20.0), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Changes to source: eligibility filtering and hierarchical Bayesian model transformation. Tables are posterior summaries, not raw race classifications.
- Coverage: eligible completion orders from 1954 through 8 November 2026; 1,130 races, 16,940 eligible observations, 604 drivers and 881 constructor-seasons.
- Model: HERA v1, joint Plackett–Luce ordering with partially pooled driver/constructor-season strengths, age spline and recent-experience adjustment.
- Intervals: central 95% posterior intervals. Driver rankings sort posterior medians. Race counts count eligible observations, not all starts. Constructor scores are centered within each season and not comparable as absolute equipment performance across years.
- Both historical ordering and separate reliability sampler gates passed. Reliability hazard estimates are not yet displayed.
- The pre-São Paulo held-out fit also passed diagnostics (R-hat 1.00873; minimum bulk ESS 980.99; zero divergences), but scoring stopped on an entrant absent from the training index. This is NOT completed predictive validation.

**Publication status: research preview.** Rolling backtests, predictive calibration, unseen-entrant support and sensitivity validation remain incomplete. Results do not isolate causal talent; cross-era comparisons depend on model assumptions. Customer-car support labels and dynamic equipment evolution are not included.

`model.json` contains the site-compatible artifact. `diagnostics.json`, `reliability-gate.json` and `run-manifest.json` record original fit checks and provenance. The latter's `modelSha256` identifies original fit code, not later export-recovery changes. The original source SHA256 identifies the downloaded source archive, not the extracted SQLite database.
