export function validateSimulations(s) {
  if (
    s?.kind !== "retrospective-eligible-finisher-simulation" ||
    s.validatedForecast !== false ||
    !s.limitations?.length ||
    !s.races?.length ||
    !Number.isInteger(s.simulationsPerRace) ||
    s.simulationsPerRace < 1000
  )
    throw Error("Invalid simulator scope");
  const ids = new Set();
  for (const r of s.races) {
    if (
      ids.has(r.id) ||
      r.drivers.length !== r.eligibleCount ||
      r.eligibleCount < 2
    )
      throw Error("Invalid simulation race");
    ids.add(r.id);
    const n = r.eligibleCount;
    const drivers = new Set();
    const ranks = [];
    for (const d of r.drivers) {
      if (drivers.has(d.driverId)) throw Error("Duplicate simulated driver");
      drivers.add(d.driverId);
      ranks.push(d.actualEligibleRank);
      if (
        ![
          d.expectedEligibleRank,
          d.positionsAboveExpectation,
          d.probabilityAtLeastAsGood,
          d.probabilityAtLeastAsBad,
          ...d.positionProbabilities,
          ...d.predictive80,
        ].every(Number.isFinite) ||
        d.positionProbabilities.length !== n ||
        d.positionProbabilities.some((p) => p < 0 || p > 1) ||
        Math.abs(d.positionProbabilities.reduce((a, b) => a + b, 0) - 1) >
          1e-6 ||
        d.expectedEligibleRank < 1 ||
        d.expectedEligibleRank > n ||
        d.predictive80.length !== 2 ||
        d.predictive80[0] < 1 ||
        d.predictive80[1] > n ||
        d.predictive80[0] > d.predictive80[1]
      )
        throw Error("Invalid simulated distribution");
      const expected = d.positionProbabilities.reduce(
        (sum, p, i) => sum + p * (i + 1),
        0,
      );
      const good = d.positionProbabilities
        .slice(0, d.actualEligibleRank)
        .reduce((a, b) => a + b, 0);
      const bad = d.positionProbabilities
        .slice(d.actualEligibleRank - 1)
        .reduce((a, b) => a + b, 0);
      if (
        Math.abs(expected - d.expectedEligibleRank) > 1e-6 ||
        Math.abs(
          d.expectedEligibleRank -
            d.actualEligibleRank -
            d.positionsAboveExpectation,
        ) > 1e-6 ||
        Math.abs(good - d.probabilityAtLeastAsGood) > 1e-6 ||
        Math.abs(bad - d.probabilityAtLeastAsBad) > 1e-6
      )
        throw Error("Simulation summaries disagree");
    }
    if (ranks.sort((a, b) => a - b).some((v, i) => v !== i + 1))
      throw Error("Actual ranks not a permutation");
    for (let i = 0; i < n; i++)
      if (
        Math.abs(
          r.drivers.reduce((sum, d) => sum + d.positionProbabilities[i], 0) - 1,
        ) > 1e-6
      )
        throw Error("Simulations are not joint orders");
    if (r.excluded.some((e) => drivers.has(e.driverId)))
      throw Error("Excluded driver simulated");
  }
}
