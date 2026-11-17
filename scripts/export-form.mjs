import { DatabaseSync } from "node:sqlite";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Measured season form: for each driver-season, the shift to the model's career
// curve that best explains that season's finishing orders, holding the car scores
// and every other driver's curve at the published medians. It is a check on the
// model, not part of it. A normal prior with sd `tau` keeps short seasons finite.
export function seasonForm(races, curve, team, { tau = 1 } = {}) {
  // Strengths for each race, dropping entries the model has no score for.
  const fields = races
    .map((race) => ({
      year: race.year,
      entries: race.order
        .map(({ driverId, constructorId }) => ({
          driverId,
          lambda: curve(driverId, race.year) + team(constructorId, race.year),
        }))
        .filter((e) => Number.isFinite(e.lambda)),
    }))
    .filter((f) => f.entries.length > 1);
  const seasons = new Map();
  for (const field of fields)
    field.entries.forEach((e, position) => {
      const key = `${e.driverId}:${field.year}`;
      (
        seasons.get(key) ??
        seasons
          .set(key, { driverId: e.driverId, year: field.year, races: [] })
          .get(key)
      ).races.push({ field, position });
    });
  const out = [];
  for (const s of seasons.values()) {
    let delta = 0,
      hessian = -1 / tau ** 2;
    for (let step = 0; step < 50; step++) {
      let gradient = -delta / tau ** 2;
      hessian = -1 / tau ** 2;
      for (const { field, position } of s.races) {
        const weights = field.entries.map((e, j) =>
          Math.exp(e.lambda + (j === position ? delta : 0)),
        );
        // Plackett–Luce: at each place k up to the driver's own, they were still
        // in the running with probability weight / remaining weight.
        let remaining = weights.reduce((a, b) => a + b, 0);
        for (let k = 0; k <= position; k++) {
          const p = weights[position] / remaining;
          gradient += (k === position ? 1 : 0) - p;
          hessian -= p * (1 - p);
          remaining -= weights[k];
        }
      }
      const change = gradient / hessian;
      delta -= change;
      if (Math.abs(change) < 1e-7) break;
    }
    const level = curve(s.driverId, s.year);
    out.push({
      driverId: s.driverId,
      year: s.year,
      form: level + delta,
      delta,
      se: 1 / Math.sqrt(-hessian),
      races: s.races.length,
    });
  }
  return out.sort(
    (a, b) => a.driverId.localeCompare(b.driverId) || a.year - b.year,
  );
}

// Finishing orders since 1954: classified finishers only, leaving out shared
// cars, the Indianapolis 500 and anyone classified despite retiring.
export function extractRaces(db, lastRaceDate) {
  const rows = db
    .prepare(
      `select r.id race, r.year, rr.driver_id, rr.constructor_id
       from race_result rr join race r on r.id = rr.race_id
       where r.year >= 1954 and r.grand_prix_id <> 'indianapolis'
         and r.date <= ? and rr.position_number is not null
         and rr.reason_retired is null and rr.shared_car = 0
       order by r.id, rr.position_number`,
    )
    .all(lastRaceDate);
  const races = new Map();
  for (const r of rows)
    (
      races.get(r.race) ??
      races.set(r.race, { year: r.year, order: [] }).get(r.race)
    ).order.push({ driverId: r.driver_id, constructorId: r.constructor_id });
  return [...races.values()];
}

export function validateForm(form) {
  if (
    !form ||
    !Array.isArray(form.seasons) ||
    !form.seasons.length ||
    !form.seasons.every(
      (s) =>
        s.driverId &&
        Number.isInteger(s.year) &&
        [s.form, s.delta, s.se].every(Number.isFinite) &&
        Number.isInteger(s.races) &&
        s.races > 0,
    )
  )
    throw new Error("Invalid season form");
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === here) {
  const [path] = process.argv.slice(2);
  if (!path) {
    console.error("Usage: node scripts/export-form.mjs <f1db.db>");
    process.exit(1);
  }
  const root = dirname(dirname(here));
  const model = JSON.parse(
    readFileSync(join(root, "publication", "model.json"), "utf8"),
  );
  const curves = new Map(
      model.driverYears.map((y) => [`${y.driverId}:${y.year}`, y.median]),
    ),
    teams = new Map(model.teams.map((t) => [t.id, t.skill]));
  const db = new DatabaseSync(path, { readOnly: true });
  const races = extractRaces(db, model.metadata.lastRaceDate);
  db.close();
  const tau = 1;
  const form = {
    model: model.metadata.model,
    sourceRelease: model.metadata.sourceRelease,
    tau,
    seasons: seasonForm(
      races,
      (d, y) => curves.get(`${d}:${y}`),
      (c, y) => teams.get(`${c}:${y}`),
      { tau },
    ).map((s) => ({
      ...s,
      form: +s.form.toFixed(4),
      delta: +s.delta.toFixed(4),
      se: +s.se.toFixed(4),
    })),
  };
  validateForm(form);
  const out = join(root, "publication", "form.json");
  writeFileSync(out, JSON.stringify(form) + "\n");
  console.log(
    `Wrote ${form.seasons.length} driver-seasons from ${races.length} races to ${out}`,
  );
}
