import test from "node:test";
import assert from "node:assert/strict";
import { seasonForm, validateForm } from "../scripts/export-form.mjs";

const curve = () => 0,
  team = () => 0;

test("a driver who keeps beating equal rivals measures above their curve", () => {
  const races = Array.from({ length: 10 }, () => ({
    year: 2000,
    order: ["a", "b", "c"].map((driverId) => ({
      driverId,
      constructorId: "t",
    })),
  }));
  const form = seasonForm(races, curve, team);
  const by = Object.fromEntries(form.map((s) => [s.driverId, s]));
  assert.ok(by.a.delta > 0.5 && by.c.delta < -0.5);
  assert.equal(by.a.races, 10);
  assert.ok(by.a.se > 0 && by.a.se < 1);
  assert.equal(by.a.form, by.a.delta);
});

test("mixed results stay near the curve and unknown entries are dropped", () => {
  const races = [
    {
      year: 2000,
      order: [{ driverId: "a" }, { driverId: "b" }, { driverId: "x" }],
    },
    { year: 2000, order: [{ driverId: "b" }, { driverId: "a" }] },
  ];
  const form = seasonForm(races, (d) => (d === "x" ? undefined : 0.5), team);
  assert.deepEqual(
    form.map((s) => s.driverId),
    ["a", "b"],
  );
  assert.ok(Math.abs(form[0].delta) < 1e-6);
  assert.ok(Math.abs(form[0].form - 0.5) < 1e-6);
});

test("validateForm rejects bad seasons", () => {
  assert.throws(() => validateForm({ seasons: [] }));
  assert.throws(() =>
    validateForm({
      seasons: [
        { driverId: "a", year: 2000, form: NaN, delta: 0, se: 1, races: 1 },
      ],
    }),
  );
});
