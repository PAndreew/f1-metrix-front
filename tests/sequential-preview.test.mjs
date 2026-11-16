import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSequentialPreview } from "../scripts/validate-sequential-preview.mjs";
const load = () =>
  JSON.parse(
    readFileSync(
      new URL("../publication/sequential-preview.json", import.meta.url),
    ),
  );
test("completed four-round preview passes with sixteen explicitly pending rounds", () => {
  const s = load();
  validateSequentialPreview(s);
  assert.equal(s.races.filter((r) => r.status === "ready").length, 4);
  assert.equal(s.races.filter((r) => r.status === "pending").length, 16);
});
for (const [name, change] of [
  ["target-round leakage", (s) => (s.races[0].trainingThroughRound = 1)],
  [
    "future-date leakage",
    (s) => (s.races[0].trainingThroughDate = s.races[0].date),
  ],
  ["failed inference", (s) => (s.races[1].originDiagnostics.passed = false)],
  ["bad convergence", (s) => (s.races[0].originDiagnostics.maxRhat = 1.1)],
  [
    "pending old prediction",
    (s) => s.races[4].drivers.push(s.races[0].drivers[0]),
  ],
  ["claimed full validation", (s) => (s.validatedForecast = true)],
  ["noncontiguous preview", (s) => (s.availableRounds = [1, 2, 4, 5])],
  ["unknown status", (s) => (s.races[4].status = "ready-ish")],
  ["bad approximation", (s) => (s.priorApproximationCheck.passed = false)],
])
  test(`rejects sequential preview ${name}`, () => {
    const s = load();
    change(s);
    assert.throws(() => validateSequentialPreview(s));
  });
