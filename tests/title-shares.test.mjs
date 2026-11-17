import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { titleShares, byChampion } from "../site/src/articles/title-shares.js";

const read = (path) =>
  JSON.parse(readFileSync(new URL(`../publication/${path}`, import.meta.url)));
const model = read("model.json"),
  facts = read("f1db-facts.json");

test("every title since 1954 gets a driver and car edge", () => {
  const titles = titleShares(model, facts);
  assert.equal(
    titles.length,
    facts.titles.filter((t) => t.year >= 1954).length,
  );
  for (const t of titles) {
    assert.ok(Number.isFinite(t.driver) && Number.isFinite(t.car));
    assert.ok(t.share >= 0 && t.share <= 1, `${t.year} share ${t.share}`);
  }
});

test("driver share counts only the positive part of each edge", () => {
  const model = {
    drivers: [{ id: "a", name: "A" }],
    driverYears: [
      { driverId: "a", year: 2000, median: 2, races: 10 },
      { driverId: "b", year: 2000, median: 0, races: 10 },
    ],
    teams: [{ id: "x:2000", skill: -0.5 }],
  };
  const facts = {
    titles: [
      {
        year: 2000,
        driverId: "a",
        constructorId: "x",
        constructor: "X",
        teammates: ["b"],
      },
    ],
  };
  const [t] = titleShares(model, facts);
  assert.equal(t.driver, 1); // 2 minus the race-weighted field average of 1
  assert.equal(t.share, 1);
  assert.deepEqual(t.teammate, { name: "b", gap: 2 });
  assert.equal(byChampion([t])[0].share, 1);
});
