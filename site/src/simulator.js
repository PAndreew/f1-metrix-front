import { createChart } from "./chart-lifecycle.js";
import { info } from "./hints.js";
const esc = (v) =>
  String(v ?? "—").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fixed = (v) => Number(v).toFixed(2);
const pct = (v) => (100 * v).toFixed(1) + "%";
function modelOrder(race) {
  return new Map(
    [...race.drivers]
      .sort(
        (a, b) =>
          a.expectedEligibleRank - b.expectedEligibleRank ||
          a.driverId.localeCompare(b.driverId),
      )
      .map((d, i) => [d.driverId, i + 1]),
  );
}
function qualifyingForRace(race, q) {
  if (!q) return "";
  const names = new Map(
    q.comparisons.flatMap((c) => [
      [c.driverA, c.nameA],
      [c.driverB, c.nameB],
    ]),
  );
  const rows = q.rounds.filter((r) => r.round === race.round);
  if (!rows.length) return "";
  // Negative gaps mean driver A was faster; name the faster driver explicitly.
  const name = (id) => esc(names.get(id) ?? id);
  return `<h3>Qualifying gaps this weekend</h3><div class="table-wrap"><table><thead><tr><th>Faster</th><th>Slower teammate</th><th>Session</th><th class="num">Gap${info("the gap", "How much quicker the faster driver’s best lap was, roughly in percent of lap time, in the last session both drivers set a time.")}</th></tr></thead><tbody>${rows
    .map((r) => {
      const [fast, slow] =
        r.observedLogGapPct < 0
          ? [r.driverA, r.driverB]
          : [r.driverB, r.driverA];
      return `<tr><td class="name">${name(fast)}</td><td>${name(slow)}</td><td>${esc(r.segment)}</td><td class="num">${Math.abs(r.observedLogGapPct).toFixed(2)}%</td></tr>`;
    })
    .join("")}</tbody></table></div>`;
}
const red = "#e10600",
  blue = "#4d8dff";
export function simulatorView(main, s, charts, qualifying = null) {
  if (!s) {
    main.innerHTML = "<p>No simulation data available.</p>";
    return;
  }
  const sequential = s.kind === "sequential-preview-eligible-finisher";
  main.innerHTML = `${sequential ? `<p class="caption">Experimental sequential results · ${s.availableRounds.length} rounds available${info("Sequential results", "Expectations use earlier race results only. This early pilot uses an approximate preseason prior and conditions on the actual eligible finishers; it is not a full-grid forecast or a driving grade. Later rounds are pending, not filled with old predictions.")}</p>` : ""}<div class="controls"><select id="simulation-race" aria-label="Race">${s.races.map((r, i) => `<option value="${i}">Round ${r.round} · ${esc(r.name)}${r.status === "pending" ? " · expectations pending" : ""}</option>`).join("")}</select></div>${s.races
    .map((r, i) => {
      if (r.status === "pending") return `<div class="race-panel" data-race="${i}" data-status="pending" hidden><p class="caption">Sequential expectations are not published for this round yet. No old predictions have been substituted.</p><div class="table-wrap"><table><thead><tr><th>Driver</th><th class="num">Finish</th></tr></thead><tbody>${r.observedDrivers.map(d => `<tr><td>${esc(d.name)}</td><td class="num">${d.actualEligibleRank}</td></tr>`).join("")}</tbody></table></div>${qualifyingForRace(r, qualifying)}</div>`;
      const order = modelOrder(r);
      return `<div class="race-panel" data-race="${i}" hidden>${sequential ? `<p class="caption">Expectation trained through ${esc(r.trainingThroughDate)}${r.trainingThroughRound ? ` · after round ${r.trainingThroughRound}` : " · preseason"}.</p>` : ""}<div class="table-wrap"><table><thead><tr><th>Driver</th><th class="num">Finish${info("Finish", "Where the driver actually finished, counting only drivers who finished the race.")}</th><th class="num">Model order${info("Model order", "The order the model expected: drivers ranked by their average finish across all simulations.")}</th><th class="num">Average simulated finish${info("Average simulated finish", "The model replayed the race thousands of times. This is the driver’s average finishing position across those replays.")}</th><th class="num">80% range${info("the 80% range", "In 80% of the simulated races the driver finished within this range of positions.")}</th><th class="num">vs model (places)${info("vs model", "How many places better (+) or worse (−) the driver finished than their average simulated finish. It includes luck as well as driving.")}</th><th class="num">This good or better${info("This good or better", "How often the driver finished at least this well in the simulations. A low number means a surprisingly good result.")}</th><th class="num">This bad or worse${info("This bad or worse", "How often the driver finished this badly or worse in the simulations. A low number means a surprisingly poor result.")}</th></tr></thead><tbody>${r.drivers.map((d) => `<tr><td>${esc(d.name)}</td><td class="num">${d.actualEligibleRank}</td><td class="num"><strong>${order.get(d.driverId)}</strong></td><td class="num">${fixed(d.expectedEligibleRank)}</td><td class="num">${d.predictive80[0]}–${d.predictive80[1]}</td><td class="num">${d.positionsAboveExpectation > 0 ? "+" : ""}${fixed(d.positionsAboveExpectation)}</td><td class="num">${pct(d.probabilityAtLeastAsGood)}</td><td class="num">${pct(d.probabilityAtLeastAsBad)}</td></tr>`).join("")}</tbody></table></div>${r.excluded.length ? `<p class="caption">Not included: ${r.excluded.map((e) => `${esc(e.name)} (${esc(e.reason)})`).join(", ")}.</p>` : ""}${qualifyingForRace(r, qualifying)}<h3>Finish vs model order</h3><div class="chart-card"><div style="position:relative;height:${Math.max(320, r.drivers.length * 25)}px"><canvas data-comparison="${i}" role="img" aria-label="Actual finish compared with model order"></canvas></div></div><h3>Simulated finishing positions</h3><div class="controls"><select data-driver="${i}" aria-label="Driver">${r.drivers.map((d, j) => `<option value="${j}">${esc(d.name)}</option>`).join("")}</select></div><div class="chart-card"><div style="position:relative;height:320px"><canvas data-chart="${i}" role="img" aria-label="Simulated finishing position probabilities"></canvas></div></div></div>`;
    })
    .join("")}`;
  main.querySelectorAll(".race-panel").forEach((panel) => {
    if (panel.dataset.status === "pending") return;
    const race = s.races[Number(panel.dataset.race)],
      order = modelOrder(race),
      select = panel.querySelector("select"),
      canvas = panel.querySelector("canvas[data-chart]");
    let chart;
    const draw = () => {
      if (chart) {
        chart.destroy();
        const index = charts.indexOf(chart);
        if (index >= 0) charts.splice(index, 1);
      }
      const d = race.drivers[Number(select.value)];
      chart = createChart(canvas, {
        type: "bar",
        data: {
          labels: d.positionProbabilities.map((_, j) => String(j + 1)),
          datasets: [
            {
              label: `${d.name} · probability (%)`,
              data: d.positionProbabilities.map((p) => 100 * p),
              backgroundColor: d.positionProbabilities.map((_, j) =>
                j + 1 === d.actualEligibleRank ? red : blue,
              ),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              title: {
                display: true,
                text: "Finishing position · red = actual",
              },
            },
            y: {
              beginAtZero: true,
              title: { display: true, text: "Probability (%)" },
            },
          },
        },
      });
      charts.push(chart);
    };
    charts.push(
      createChart(panel.querySelector("[data-comparison]"), {
        type: "bar",
        data: {
          labels: race.drivers.map((d) => d.name),
          datasets: [
            {
              label: "Actual finish",
              data: race.drivers.map((d) => d.actualEligibleRank),
              backgroundColor: red,
            },
            {
              label: "Model order",
              data: race.drivers.map((d) => order.get(d.driverId)),
              backgroundColor: blue,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              title: { display: true, text: "Position · lower is better" },
            },
            y: { ticks: { autoSkip: false } },
          },
        },
      }),
    );
    select.addEventListener("change", draw);
    draw();
  });
  const selector = main.querySelector("#simulation-race");
  const showSelected = () =>
    main
      .querySelectorAll(".race-panel")
      .forEach(
        (panel) => (panel.hidden = panel.dataset.race !== selector.value),
      );
  selector.value = String(s.races.map((r, i) => r.status === "pending" ? -1 : i).filter(i => i >= 0).at(-1) ?? 0);
  selector.addEventListener("change", showSelected);
  showSelected();
}
