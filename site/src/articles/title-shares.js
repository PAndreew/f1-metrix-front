// For every title since 1954: the champion's level that season above the
// race-weighted field average (driver edge), their car's level above the
// season's average car (car edge), and the driver's part of the positive edge.
export function titleShares(model, facts) {
  const years = new Map(
      model.driverYears.map((r) => [`${r.driverId}:${r.year}`, r]),
    ),
    teams = new Map(model.teams.map((t) => [t.id, t])),
    names = new Map(model.drivers.map((d) => [d.id, d.name])),
    field = new Map();
  for (const r of model.driverYears) {
    const f = field.get(r.year) ?? { sum: 0, races: 0 };
    f.sum += r.median * r.races;
    f.races += r.races;
    field.set(r.year, f);
  }
  return (facts?.titles ?? []).flatMap((t) => {
    const level = years.get(`${t.driverId}:${t.year}`),
      car = teams.get(`${t.constructorId}:${t.year}`),
      f = field.get(t.year);
    if (!level || !car || !f) return [];
    const driver = level.median - f.sum / f.races,
      d = Math.max(driver, 0),
      c = Math.max(car.skill, 0),
      mate = t.teammates
        .map((id) => years.get(`${id}:${t.year}`))
        .find(Boolean);
    return [
      {
        year: t.year,
        driverId: t.driverId,
        name: names.get(t.driverId) ?? t.driverId,
        constructor: t.constructor,
        driver,
        car: car.skill,
        share: d + c > 0 ? d / (d + c) : null,
        teammate: mate
          ? {
              name: names.get(mate.driverId) ?? mate.driverId,
              gap: level.median - mate.median,
            }
          : null,
      },
    ];
  });
}

export function byChampion(titles) {
  const map = new Map();
  for (const t of titles) {
    const c = map.get(t.driverId) ?? { name: t.name, titles: [] };
    c.titles.push(t);
    map.set(t.driverId, c);
  }
  const mean = (list, key) =>
    list.reduce((s, t) => s + t[key], 0) / list.length;
  return [...map]
    .map(([id, c]) => ({
      id,
      name: c.name,
      titles: c.titles,
      share: mean(c.titles, "share"),
      driver: mean(c.titles, "driver"),
      car: mean(c.titles, "car"),
    }))
    .sort((a, b) => b.share - a.share);
}
