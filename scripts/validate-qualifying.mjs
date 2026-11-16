export function validateQualifying(q) {
  if (
    !q ||
    q.reviewStatus !== "experimental_qualifying_only" ||
    q.qualifyingOnly !== true ||
    !q.publicationReady ||
    q.year !== 2026 ||
    !q.comparisons?.length ||
    !q.rounds?.length ||
    !q.limitations?.length
  )
    throw Error("Invalid qualifying publication scope");
  const d = q.diagnostics;
  if (
    !d ||
    ![
      d.maxRhat,
      d.minEss,
      d.minBfmi,
      d.divergences,
      d.treeDepthSaturations,
    ].every(Number.isFinite) ||
    d.maxRhat > 1.01 ||
    d.minEss < 400 ||
    d.minBfmi < 0.3 ||
    d.divergences !== 0 ||
    d.treeDepthSaturations !== 0
  )
    throw Error("Qualifying diagnostics failed");
  const keys = new Set();
  for (const c of q.comparisons) {
    const key = `${c.driverA}:${c.driverB}`;
    if (
      !c.driverA ||
      !c.driverB ||
      c.driverA === c.driverB ||
      keys.has(key) ||
      !c.nameA ||
      !c.nameB ||
      !Number.isInteger(c.sessions) ||
      c.sessions < 1 ||
      ![c.meanLogGapPct, ...c.interval95LogGapPct, c.probabilityAFaster].every(
        Number.isFinite,
      ) ||
      c.interval95LogGapPct.length !== 2 ||
      c.interval95LogGapPct[0] > c.interval95LogGapPct[1] ||
      c.probabilityAFaster < 0 ||
      c.probabilityAFaster > 1
    )
      throw Error("Invalid qualifying contrast");
    keys.add(key);
  }
  const observations = new Set();
  for (const r of q.rounds) {
    const key = `${r.round}:${r.driverA}:${r.driverB}`;
    if (
      observations.has(key) ||
      !keys.has(`${r.driverA}:${r.driverB}`) ||
      !Number.isInteger(r.round) ||
      r.round < 1 ||
      !Number.isFinite(r.observedLogGapPct)
    )
      throw Error("Invalid qualifying observation");
    observations.add(key);
  }
  for (const c of q.comparisons)
    if (
      q.rounds.filter((r) => r.driverA === c.driverA && r.driverB === c.driverB)
        .length !== c.sessions
    )
      throw Error("Qualifying session counts disagree");
}
