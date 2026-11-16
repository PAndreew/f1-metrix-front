// Reject incomplete experimental outputs rather than displaying career ratings as race ratings.
export function validatePerformance(model) {
  const enabled = model.metadata?.performanceExtension === true;
  if (!enabled && model.racePerformances?.length)
    throw Error("Race estimates require performanceExtension metadata");
  if (!enabled) return;
  const fail = () => {
    throw Error("Invalid performance publication");
  };
  const interval = (r) =>
    r &&
    [r.low95, r.median, r.high95].every(Number.isFinite) &&
    r.low95 <= r.median &&
    r.median <= r.high95;
  if (
    !model.metadata.performanceInterpretation ||
    !model.racePerformances?.length
  )
    fail();
  const drivers = new Set(model.drivers.map((d) => d.id));
  const seasons = new Map();
  for (const r of model.driverYears ?? []) {
    const key = JSON.stringify([r.driverId, r.year]);
    if (
      !drivers.has(r.driverId) ||
      !Number.isInteger(r.year) ||
      !interval(r) ||
      !Number.isInteger(r.races) ||
      r.races < 1 ||
      seasons.has(key)
    )
      fail();
    if (
      r.races === 1
        ? r.consistency !== null
        : !interval(r.consistency) || r.consistency.low95 < 0
    )
      fail();
    seasons.set(key, { row: r, count: 0 });
  }
  const seen = new Set(),
    races = new Map();
  for (const r of model.racePerformances) {
    const key = JSON.stringify([r.driverId, r.raceId]);
    const season = seasons.get(JSON.stringify([r.driverId, r.year]));
    if (
      !season ||
      typeof r.raceId !== "string" ||
      !r.raceId ||
      seen.has(key) ||
      !interval(r) ||
      !interval(r.versusSeason) ||
      !Number.isInteger(r.round) ||
      r.round < 1 ||
      !r.raceName ||
      !/^\d{4}-\d{2}-\d{2}$/.test(r.date) ||
      !Number.isFinite(Date.parse(r.date)) ||
      Number(r.date.slice(0, 4)) !== r.year ||
      r.date > model.metadata.lastRaceDate
    )
      fail();
    const raceMetadata = JSON.stringify([r.year, r.round, r.date, r.raceName]);
    if (races.has(r.raceId) && races.get(r.raceId) !== raceMetadata) fail();
    races.set(r.raceId, raceMetadata);
    seen.add(key);
    season.count++;
  }
  for (const { row, count } of seasons.values())
    if (row.races !== count) fail();
}
