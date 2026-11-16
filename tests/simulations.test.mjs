import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateSimulations } from "../scripts/validate-simulations.mjs";
const load = () =>
  JSON.parse(
    readFileSync(new URL("../publication/simulations.json", import.meta.url)),
  );
test("20 retrospective race exports pass joint distribution and scope checks", () => {
  const s = load();
  assert.equal(s.races.length, 20);
  validateSimulations(s);
});
for (const [name, change] of [
  ["forecast claim", (s) => (s.validatedForecast = true)],
  ["duplicate race", (s) => s.races.push(s.races[0])],
  [
    "duplicate driver",
    (s) => (s.races[0].drivers[1].driverId = s.races[0].drivers[0].driverId),
  ],
  ["probability", (s) => (s.races[0].drivers[0].positionProbabilities[0] = 2)],
  ["nonfinite", (s) => (s.races[0].drivers[0].expectedEligibleRank = NaN)],
  ["comparison", (s) => s.races[0].drivers[0].positionsAboveExpectation++],
  ["actual ranks", (s) => (s.races[0].drivers[1].actualEligibleRank = 1)],
  [
    "exclusion",
    (s) =>
      s.races[0].excluded.push({ driverId: s.races[0].drivers[0].driverId }),
  ],
  [
    "tail probability",
    (s) => (s.races[0].drivers[0].probabilityAtLeastAsGood = 0.999999),
  ],
])
  test(`rejects simulation ${name}`, () => {
    const s = load();
    change(s);
    assert.throws(() => validateSimulations(s));
  });
