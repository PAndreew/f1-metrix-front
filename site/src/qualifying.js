import { createChart } from "./chart-lifecycle.js";
import { Chart } from "chart.js";
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const n = (v) => Number(v).toFixed(3);
export function qualifyingView(main, q, charts) {
  if (!q) {
    main.innerHTML =
      "<h1>Qualifying evidence</h1><p>No qualifying publication available.</p>";
    return;
  }
  main.innerHTML = `<p class="eyebrow">2026 / Experimental qualifying evidence</p><h1>Qualifying <em>pace</em></h1><p class="intro">How did teammates compare in qualifying, weekend by weekend and over the season?</p><p>Through ${esc(q.throughDate)}. These are <strong>teammate comparisons, not a global ranking or race-driving grades</strong>. Negative gaps mean driver A was faster.</p><div class="controls"><label>Teammate pair<select id="qualifying-pair">${q.comparisons.map((c, i) => `<option value="${i}">${esc(c.nameA)} / ${esc(c.nameB)}</option>`).join("")}</select></label></div><div class="chart-card"><h2>Observed weekend gap vs estimated season pace</h2><div style="position:relative;height:320px"><canvas id="qualifying-chart" role="img" aria-label="Observed qualifying gaps by round and estimated season teammate difference"></canvas></div></div><p class="caption">Gap = 100 × log(A time / B time), approximately a percentage for small gaps. Compare the latest qualifying segment both teammates recorded a positive time in. Weekend gaps are observed evidence, not model-adjusted driver performance. The line is a retrospective season estimate using all available sessions, not a pre-weekend forecast.</p><div id="qualifying-rounds"></div><h2>Season teammate estimates</h2><p>Modelled typical qualifying gap, with 95% credible intervals. Listed alphabetically by pair, not ranked. Sparse pairings receive more shrinkage.</p><div class="table-wrap"><table><thead><tr><th>Driver A / Driver B</th><th>Sessions</th><th>Mean gap</th><th>95% interval</th></tr></thead><tbody>${q.comparisons.map((c) => `<tr><td>${esc(c.nameA)} / ${esc(c.nameB)}</td><td>${c.sessions}</td><td>${n(c.meanLogGapPct)}</td><td>${n(c.interval95LogGapPct[0])} to ${n(c.interval95LogGapPct[1])}</td></tr>`).join("")}</tbody></table></div><h2>Validation and limitations</h2><p>Retrospective held-out-pair evaluation across eight seasons: 302/322 observations (93.8%) inside nominal 95% predictive intervals. Mean absolute error improved in eight seasons and predictive log score in seven against a matched equal-pace baseline. Results vary by season; this is exploratory evidence, not universal calibration.</p><ul>${q.limitations.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><p>Student-t timing errors with shared weekend volatility. Session conditions are not weather measurements, and timing gaps do not establish incident responsibility. No independent equipment estimate or cross-team ranking is inferred.</p>`;
  let chart;
  const draw = () => {
    if (chart) {
      chart.destroy();
      const i = charts.indexOf(chart);
      if (i >= 0) charts.splice(i, 1);
    }
    const c =
      q.comparisons[Number(document.getElementById("qualifying-pair").value)];
    const rows = q.rounds
      .filter((r) => r.driverA === c.driverA && r.driverB === c.driverB)
      .sort((a, b) => a.round - b.round);
    chart = createChart(document.getElementById("qualifying-chart"), {
      type: "line",
      data: {
        labels: rows.map((r) => `R${r.round}`),
        datasets: [
          {
            label: "Observed weekend gap",
            data: rows.map((r) => r.observedLogGapPct),
            borderColor: "#ad472b",
            pointRadius: 4,
            showLine: false,
          },
          {
            label: "Estimated season gap",
            data: rows.map(() => c.meanLogGapPct),
            borderColor: "#302e2b",
            pointRadius: 0,
          },
          {
            label: "Season 95% lower",
            data: rows.map(() => c.interval95LogGapPct[0]),
            borderColor: "#a29a90",
            borderDash: [4, 4],
            pointRadius: 0,
          },
          {
            label: "Season 95% upper",
            data: rows.map(() => c.interval95LogGapPct[1]),
            borderColor: "#a29a90",
            borderDash: [4, 4],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            title: {
              display: true,
              text: "100 × log time ratio · negative = A faster",
            },
          },
        },
      },
    });
    charts.push(chart);
    document.getElementById("qualifying-rounds").innerHTML =
      `<h2>${esc(c.nameA)} / ${esc(c.nameB)} by round</h2><div class="table-wrap"><table><thead><tr><th>Round</th><th>Weekend</th><th>Segment</th><th>Observed gap</th><th>Difference from season estimate*</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${r.round}</td><td>${esc(r.race)}</td><td>${esc(r.segment)}</td><td>${n(r.observedLogGapPct)}</td><td>${n(r.observedLogGapPct - c.meanLogGapPct)}</td></tr>`).join("")}</tbody></table></div><p class="caption">*Arithmetic difference, not an inferred driver-race effect or a significance test. A negative value means A was relatively faster than the estimated season gap; conditions or incidents can also cause the difference.</p>`;
  };
  document.getElementById("qualifying-pair").addEventListener("change", draw);
  draw();
}
