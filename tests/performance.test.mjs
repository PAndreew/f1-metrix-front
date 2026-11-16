import test from "node:test";
import assert from "node:assert/strict";
import { validatePerformance } from "../scripts/validate-performance.mjs";
const interval = { median: 0, low95: -1, high95: 1 };
function fixture() {
  return {
    metadata: {
      performanceExtension: true,
      performanceInterpretation: "Retrospective",
      lastRaceDate: "2026-03-01",
    },
    drivers: [{ id: "a" }],
    driverYears: [
      { driverId: "a", year: 2026, races: 1, consistency: null, ...interval },
    ],
    racePerformances: [
      {
        driverId: "a",
        year: 2026,
        raceId: "1",
        round: 1,
        date: "2026-03-01",
        raceName: "Test race",
        ...interval,
        versusSeason: { median: 0, low95: 0, high95: 0 },
      },
    ],
  };
}
test("accepts legacy and complete performance publications", () => {
  validatePerformance({ metadata: {} });
  validatePerformance(fixture());
});
for (const [name, mutate] of Object.entries({
  duplicate: (m) => m.racePerformances.push(m.racePerformances[0]),
  missing: (m) => (m.racePerformances = []),
  interval: (m) => (m.racePerformances[0].low95 = 2),
  self: (m) => (m.racePerformances[0].versusSeason = null),
  driver: (m) => (m.racePerformances[0].driverId = "unknown"),
  count: (m) => (m.driverYears[0].races = 2),
  date: (m) => (m.racePerformances[0].date = "2027-01-01"),
  flag: (m) => (m.metadata.performanceExtension = false),
}))
  test(`rejects ${name}`, () => {
    const m = fixture();
    mutate(m);
    assert.throws(() => validatePerformance(m));
  });
