import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateFacts } from "../scripts/export-f1db-facts.mjs";
import { nextRace } from "../site/src/next-gp.js";

const facts = JSON.parse(
  readFileSync(new URL("../publication/f1db-facts.json", import.meta.url)),
);

test("published F1DB facts are valid", () => {
  validateFacts(facts);
  assert.deepEqual(
    facts.champions["juan-manuel-fangio"],
    [1951, 1954, 1955, 1956, 1957],
  );
});

test("invalid F1DB facts are rejected", () => {
  for (const bad of [
    null,
    { ...facts, races: [] },
    { ...facts, races: [{ ...facts.races[0], lengthKm: 0 }] },
    { ...facts, races: [{ ...facts.races[0], start: "not a date" }] },
    { ...facts, champions: { x: ["1950"] } },
  ])
    assert.throws(() => validateFacts(bad));
});

test("next race stays current until two hours after lights out", () => {
  const races = [
    { name: "A", start: "2026-11-22T04:00:00Z" },
    { name: "B", start: "2026-11-29T16:00:00Z" },
  ];
  const at = (iso) => nextRace(races, Date.parse(iso))?.name;
  assert.equal(at("2026-11-17T00:00:00Z"), "A");
  assert.equal(at("2026-11-22T05:59:00Z"), "A");
  assert.equal(at("2026-11-22T06:01:00Z"), "B");
  assert.equal(at("2026-12-01T00:00:00Z"), undefined);
});
