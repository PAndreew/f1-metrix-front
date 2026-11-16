import { createChart } from "./chart-lifecycle.js";
import { Chart } from "chart.js";
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
  return `<h3>Qualifying gaps this weekend</h3><div class="table-wrap"><table><thead><tr><th>Driver A</th><th>Driver B</th><th>Session</th><th class="num">Gap (%)</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(names.get(r.driverA) ?? r.driverA)}</td><td>${esc(names.get(r.driverB) ?? r.driverB)}</td><td>${esc(r.segment)}</td><td class="num">${Number(r.observedLogGapPct).toFixed(3)}</td></tr>`).join("")}</tbody></table></div>`;
}
const red = "#e10600",
  blue = "#4d8dff";
export function simulatorView(main, s, charts, qualifying = null) {
  if (!s) {
    main.innerHTML = "<p>No simulation data available.</p>";
    return;
  }
  main.innerHTML = `<div class="controls"><select id="simulation-race" aria-label="Race">${s.races.map((r, i) => `<option value="${i}">Round ${r.round} · ${esc(r.name)}</option>`).join("")}</select></div>${s.races
    .map((r, i) => {
      const order = modelOrder(r);
      return `<div class="race-panel" data-race="${i}" hidden><div class="table-wrap"><table><thead><tr><th>Driver</th><th class="num">Finish</th><th class="num">Model order</th><th class="num">Average simulated finish</th><th class="num">80% range</th><th class="num">vs model (places)</th><th class="num">This good or better</th><th class="num">This bad or worse</th></tr></thead><tbody>${r.drivers.map((d) => `<tr><td>${esc(d.name)}</td><td class="num">${d.actualEligibleRank}</td><td class="num"><strong>${order.get(d.driverId)}</strong></td><td class="num">${fixed(d.expectedEligibleRank)}</td><td class="num">${d.predictive80[0]}–${d.predictive80[1]}</td><td class="num">${d.positionsAboveExpectation > 0 ? "+" : ""}${fixed(d.positionsAboveExpectation)}</td><td class="num">${pct(d.probabilityAtLeastAsGood)}</td><td class="num">${pct(d.probabilityAtLeastAsBad)}</td></tr>`).join("")}</tbody></table></div>${r.excluded.length ? `<p class="caption">Not included: ${r.excluded.map((e) => `${esc(e.name)} (${esc(e.reason)})`).join(", ")}.</p>` : ""}${qualifyingForRace(r, qualifying)}<h3>Finish vs model order</h3><div class="chart-card"><div style="position:relative;height:${Math.max(320, r.drivers.length * 25)}px"><canvas data-comparison="${i}" role="img" aria-label="Actual finish compared with model order"></canvas></div></div><h3>Simulated finishing positions</h3><div class="controls"><select data-driver="${i}" aria-label="Driver">${r.drivers.map((d, j) => `<option value="${j}">${esc(d.name)}</option>`).join("")}</select></div><div class="chart-card"><div style="position:relative;height:320px"><canvas data-chart="${i}" role="img" aria-label="Simulated finishing position probabilities"></canvas></div></div></div>`;
    })
    .join("")}`;
  main.querySelectorAll(".race-panel").forEach((panel) => {
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
  selector.value = String(s.races.length - 1);
  selector.addEventListener("change", showSelected);
  showSelected();
}
