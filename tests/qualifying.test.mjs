import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateQualifying } from "../scripts/validate-qualifying.mjs";
const load = () =>
  JSON.parse(
    readFileSync(new URL("../publication/qualifying.json", import.meta.url)),
  );
test("reviewed qualifying artifact passes scope, diagnostics and observation counts", () =>
  validateQualifying(load()));
for (const [name, change] of [
  ["global scope", (q) => (q.qualifyingOnly = false)],
  ["unreviewed", (q) => (q.publicationReady = false)],
  ["divergences", (q) => (q.diagnostics.divergences = 1)],
  ["rhat", (q) => (q.diagnostics.maxRhat = 1.1)],
  ["ess", (q) => (q.diagnostics.minEss = 10)],
  ["bfmi", (q) => (q.diagnostics.minBfmi = 0.1)],
  ["depth saturation", (q) => (q.diagnostics.treeDepthSaturations = 1)],
  ["duplicate observation", (q) => q.rounds.push(q.rounds[0])],
  ["nonfinite", (q) => (q.rounds[0].observedLogGapPct = NaN)],
  ["session counts", (q) => q.comparisons[0].sessions++],
  [
    "reversed interval",
    (q) => (q.comparisons[0].interval95LogGapPct = [1, -1]),
  ],
])
  test(`rejects qualifying ${name}`, () => {
    const q = load();
    change(q);
    assert.throws(() => validateQualifying(q));
  });
