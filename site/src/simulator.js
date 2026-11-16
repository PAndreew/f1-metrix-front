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
  return `<h3>Qualifying — this same weekend</h3><p>Observed teammate time gaps, not race-driving ratings. Negative means driver A was faster. Season estimates appear in the season section below.</p><div class="table-wrap"><table><thead><tr><th>Driver A</th><th>Driver B</th><th>Segment</th><th>Observed log gap (%)</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(names.get(r.driverA) ?? r.driverA)}</td><td>${esc(names.get(r.driverB) ?? r.driverB)}</td><td>${esc(r.segment)}</td><td>${Number(r.observedLogGapPct).toFixed(3)}</td></tr>`).join("")}</tbody></table></div>`;
}
export function simulatorView(main, s, charts, qualifying = null) {
  if (!s) {
    main.innerHTML =
      "<h1>Race simulator</h1><p>No simulator export available.</p>";
    return;
  }
  main.innerHTML = `<h1>2026 race <em>results vs expectation</em></h1><p><strong>Not a pre-race forecast.</strong> Retrospective career-based simulation, conditional on eligible finishers—not current-season form or a driving grade.</p><div class="controls"><label>2026 race<select id="simulation-race">${s.races.map((r, i) => `<option value="${i}">Round ${r.round} · ${esc(r.name)}</option>`).join("")}</select></label></div>${s.races.map((r, i) => `<details class="race-accordion" data-race="${i}"><summary>Round ${r.round} · ${esc(r.name)} <span>${r.eligibleCount} eligible finishers</span></summary><div class="accordion-body"><p><strong>Actual finish is what happened. Model order ranks drivers by their mean simulated finish, so someone is always ranked first. The mean averages all simulated outcomes; it need not be an integer or equal 1.</strong> *Both use the same comparison field: ${r.eligibleCount} eligible finishers; ${r.excluded.length} participants excluded. This is not a full-grid prediction.</p><div class="table-wrap"><table><thead><tr><th>Driver</th><th>Actual finish*</th><th>Model order*</th><th>Mean simulated finish*</th><th>80% predictive range</th><th>Result vs baseline (places)</th><th>This good or better</th><th>This bad or worse</th></tr></thead><tbody>${r.drivers.map((d) => `<tr><td>${esc(d.name)}</td><td>${d.actualEligibleRank}</td><td><strong>${modelOrder(r).get(d.driverId)}</strong></td><td>${fixed(d.expectedEligibleRank)}</td><td>${d.predictive80[0]}–${d.predictive80[1]}</td><td>${d.positionsAboveExpectation > 0 ? "+" : ""}${fixed(d.positionsAboveExpectation)}</td><td>${pct(d.probabilityAtLeastAsGood)}</td><td>${pct(d.probabilityAtLeastAsBad)}</td></tr>`).join("")}</tbody></table></div>${qualifyingForRace(r, qualifying)}<h3>Actual finish versus model order</h3><div class="chart-card"><div style="position:relative;height:${Math.max(320, r.drivers.length * 25)}px"><canvas data-comparison="${i}" role="img" aria-label="Actual finish compared with model expected finish for every eligible driver"></canvas></div></div><div class="controls"><label>Driver distribution<select data-driver="${i}">${r.drivers.map((d, j) => `<option value="${j}">${esc(d.name)}</option>`).join("")}</select></label></div><div class="chart-card"><div style="position:relative;height:320px"><canvas data-chart="${i}" role="img" aria-label="Simulated eligible finishing position probabilities"></canvas></div></div><details><summary>Excluded participants</summary><ul>${r.excluded.map((e) => `<li>${esc(e.name)}: ${esc(e.reason)}. No simulated grade assigned.</li>`).join("") || "<li>None</li>"}</ul></details></div></details>`).join("")}<details class="simulation-notes"><summary>How to read these results · model limitations</summary><h2>Interpretation and limitations</h2><p>Result vs baseline = mean simulated finish minus actual finish. Model order is only an ordering of the averages, not another simulation or a certain finishing position. Positive means a better result than the model average, not necessarily better driving. “This good or better” counts simulated ranks ≤ actual; “this bad or worse” counts ranks ≥ actual. They overlap at the actual rank and do not sum to 100%.</p><ul>${s.limitations.map((l) => `<li>${esc(l)}</li>`).join("")}</ul><p>Simulations combine posterior uncertainty with Plackett–Luce outcome variability. More simulations reduce Monte Carlo noise, not model uncertainty. These are exploratory retrospective comparisons, not calibrated forecasts or pure driving grades.</p></details>`;
  main.querySelectorAll(".race-accordion").forEach((details) => {
    const i = Number(details.dataset.race),
      race = s.races[i],
      select = details.querySelector("select"),
      canvas = details.querySelector("canvas[data-chart]");
    let chart, comparison;
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
              label: `${d.name} · position probability (%)`,
              data: d.positionProbabilities.map((p) => 100 * p),
              backgroundColor: d.positionProbabilities.map((_, j) =>
                j + 1 === d.actualEligibleRank ? "#ad472b" : "#8b9188",
              ),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: "Rank among eligible finishers · red = actual",
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
    details.addEventListener("toggle", () => {
      if (details.open) {
        if (!comparison) {
          comparison = createChart(details.querySelector("[data-comparison]"), {
            type: "bar",
            data: {
              labels: race.drivers.map((d) => d.name),
              datasets: [
                {
                  label: "Actual finish",
                  data: race.drivers.map((d) => d.actualEligibleRank),
                  backgroundColor: "#ad472b",
                },
                {
                  label: "Model order (rank of mean simulated finish)",
                  data: race.drivers.map((d) =>
                    modelOrder(race).get(d.driverId),
                  ),
                  backgroundColor: "#8b9188",
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
                  title: {
                    display: true,
                    text: "Position among eligible finishers · lower is better",
                  },
                },
              },
            },
          });
          charts.push(comparison);
        } else comparison.resize();
        if (!chart) draw();
        else chart.resize();
      }
    });
    select.addEventListener("change", draw);
  });
  const selector = main.querySelector("#simulation-race");
  const showSelected = () => {
    main.querySelectorAll(".race-accordion").forEach((panel) => {
      const selected = panel.dataset.race === selector.value;
      panel.hidden = !selected;
      panel.open = selected;
    });
  };
  selector.value = String(s.races.length - 1);
  selector.addEventListener("change", showSelected);
  showSelected();
}
