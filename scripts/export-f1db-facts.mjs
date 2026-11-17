// Extract the small set of F1DB facts the site shows beside the model results:
// the current season calendar with circuit details, and world champions.
//
//   node scripts/export-f1db-facts.mjs path/to/f1db.db v2026.20.0
//
// Writes publication/f1db-facts.json. Use the same F1DB release as the model.
import { DatabaseSync } from "node:sqlite";
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function extractFacts(db, sourceRelease) {
  const all = (sql, ...params) => db.prepare(sql).all(...params);
  const get = (sql, ...params) => db.prepare(sql).get(...params);
  const { year } = get("SELECT max(year) AS year FROM race");
  const races = all(
    `SELECT r.id, r.round, r.date, r.time, r.official_name, r.circuit_id,
            r.circuit_layout_id, r.course_length, r.turns, r.laps,
            g.full_name AS grand_prix, g.id AS grand_prix_id,
            c.full_name AS circuit, c.place_name, k.name AS country
       FROM race r
       JOIN grand_prix g ON g.id = r.grand_prix_id
       JOIN circuit c ON c.id = r.circuit_id
       JOIN country k ON k.id = c.country_id
      WHERE r.year = ? ORDER BY r.round`,
    year,
  ).map((r) => {
    const earlier = (column) =>
      get(
        `SELECT min(year) AS first, count(*) AS n FROM race
          WHERE ${column} = ? AND date < ?`,
        column === "circuit_id" ? r.circuit_id : r.grand_prix_id,
        r.date,
      );
    const here = earlier("circuit_id"),
      grandPrix = earlier("grand_prix_id");
    // Lap times come from the latest earlier race on the same layout.
    const winner = get(
      `SELECT r.year, rd.race_time_millis AS ms, rd.race_laps AS laps
         FROM race_data rd JOIN race r ON r.id = rd.race_id
        WHERE r.circuit_layout_id = ? AND r.date < ? AND rd.type = 'RACE_RESULT'
          AND rd.position_number = 1 AND rd.race_time_millis > 0 AND rd.race_laps > 0
        ORDER BY r.date DESC LIMIT 1`,
      r.circuit_layout_id,
      r.date,
    );
    const fastest = get(
      `SELECT r.year, rd.fastest_lap_time_millis AS ms, d.name AS driver
         FROM race_data rd JOIN race r ON r.id = rd.race_id
         JOIN driver d ON d.id = rd.driver_id
        WHERE r.circuit_layout_id = ? AND r.date < ? AND rd.type = 'FASTEST_LAP'
          AND rd.position_number = 1 AND rd.fastest_lap_time_millis > 0
        ORDER BY r.date DESC LIMIT 1`,
      r.circuit_layout_id,
      r.date,
    );
    return {
      round: r.round,
      name: r.grand_prix,
      officialName: r.official_name,
      // F1DB race times are UTC; a missing time means it is not yet announced.
      start: r.time ? `${r.date}T${r.time}:00Z` : null,
      date: r.date,
      circuit: r.circuit,
      place: r.place_name,
      country: r.country,
      lengthKm: r.course_length,
      turns: r.turns,
      laps: r.laps,
      firstRaceHere: here.first,
      racesHeldHere: here.n,
      grandPrixFirstHeld: grandPrix.first,
      typicalLap: winner
        ? { ms: Math.round(winner.ms / winner.laps), year: winner.year }
        : null,
      fastestLap: fastest
        ? { ms: fastest.ms, year: fastest.year, driver: fastest.driver }
        : null,
    };
  });
  const champions = {};
  for (const { driver_id, year: y } of all(
    "SELECT driver_id, year FROM season_driver_standing WHERE championship_won = 1 ORDER BY year",
  ))
    (champions[driver_id] ||= []).push(y);
  return { sourceRelease, season: year, races, champions };
}

export function validateFacts(facts) {
  if (
    !facts ||
    !Number.isInteger(facts.season) ||
    !Array.isArray(facts.races) ||
    !facts.races.length ||
    typeof facts.champions !== "object"
  )
    throw new Error("Invalid F1DB facts");
  for (const r of facts.races)
    if (
      !Number.isInteger(r.round) ||
      !r.name ||
      !r.country ||
      !(r.lengthKm > 0) ||
      (r.start !== null && Number.isNaN(Date.parse(r.start)))
    )
      throw new Error(`Invalid race in F1DB facts: ${r.name ?? r.round}`);
  for (const years of Object.values(facts.champions))
    if (!Array.isArray(years) || !years.every(Number.isInteger))
      throw new Error("Invalid champion years in F1DB facts");
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === here) {
  const [path, release] = process.argv.slice(2);
  if (!path || !release) {
    console.error(
      "Usage: node scripts/export-f1db-facts.mjs <f1db.db> <release>",
    );
    process.exit(1);
  }
  const db = new DatabaseSync(path, { readOnly: true });
  const facts = extractFacts(db, release);
  db.close();
  validateFacts(facts);
  const out = join(dirname(dirname(here)), "publication", "f1db-facts.json");
  writeFileSync(out, JSON.stringify(facts, null, 1) + "\n");
  console.log(
    `Wrote ${facts.races.length} ${facts.season} races and ${Object.keys(facts.champions).length} champions to ${out}`,
  );
}
