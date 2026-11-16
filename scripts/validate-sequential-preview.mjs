import { validateSimulations } from "./validate-simulations.mjs";
export function validateSequentialPreview(s) {
  if (
    s?.kind !== "sequential-preview-eligible-finisher" ||
    s.researchPreview !== true ||
    s.validatedForecast !== false ||
    s.year !== 2026 ||
    !s.priorApproximationCheck?.passed ||
    !s.sourceResultSha256 ||
    !s.availableRounds?.length
  )
    throw Error("Invalid sequential preview");
  const ready = s.races.filter((r) => r.status === "ready");
  if (
    ready.length !== s.availableRounds.length ||
    ready.some((r, i) => r.round !== i + 1 || r.round !== s.availableRounds[i])
  )
    throw Error("Non-contiguous sequential preview");
  for (const r of s.races) {
    if (r.status === "pending") {
      if (
        r.drivers.length ||
        !r.observedDrivers?.length ||
        r.observedDrivers.length !== r.eligibleCount
      )
        throw Error("Pending rounds must not contain old predictions");
    } else if (r.status === "ready") {
      const d = r.originDiagnostics;
      if (
        r.trainingThroughRound !== r.round - 1 ||
        !r.trainingThroughDate ||
        r.trainingThroughDate >= r.date ||
        !d?.passed ||
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
        throw Error("Failed sequential forecast cutoff or inference");
    } else throw Error("Unknown sequential round status");
  }
  validateSimulations({
    ...s,
    kind: "retrospective-eligible-finisher-simulation",
    races: ready,
  });
}
