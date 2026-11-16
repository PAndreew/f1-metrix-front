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
    main.innerHTML = "<p>No qualifying data available.</p>";
    return;
  }
  main.innerHTML = `<div class="controls"><select id="qualifying-pair" aria-label="Teammate pair">${q.comparisons.map((c, i) => `<option value="${i}">${esc(c.nameA)} / ${esc(c.nameB)}</option>`).join("")}</select></div><div class="chart-card"><div style="position:relative;height:320px"><canvas id="qualifying-chart" role="img" aria-label="Qualifying gap by round and season estimate"></canvas></div></div><div id="qualifying-rounds"></div><h3>Season estimates</h3><div class="table-wrap"><table><thead><tr><th>Driver A / Driver B</th><th class="num">Sessions</th><th class="num">Season gap (%)</th><th class="num">95% range</th></tr></thead><tbody>${q.comparisons.map((c) => `<tr><td>${esc(c.nameA)} / ${esc(c.nameB)}</td><td class="num">${c.sessions}</td><td class="num">${n(c.meanLogGapPct)}</td><td class="num">${n(c.interval95LogGapPct[0])} – ${n(c.interval95LogGapPct[1])}</td></tr>`).join("")}</tbody></table></div>`;
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
            label: "Weekend gap",
            data: rows.map((r) => r.observedLogGapPct),
            borderColor: "#e10600",
            backgroundColor: "#e10600",
            pointRadius: 4,
            showLine: false,
          },
          {
            label: "Season estimate",
            data: rows.map(() => c.meanLogGapPct),
            borderColor: "#4d8dff",
            pointRadius: 0,
          },
          {
            label: "95% range",
            data: rows.map(() => c.interval95LogGapPct[0]),
            borderColor: "#9db9f2",
            borderDash: [4, 4],
            pointRadius: 0,
          },
          {
            label: "95% range upper",
            data: rows.map(() => c.interval95LogGapPct[1]),
            borderColor: "#9db9f2",
            borderDash: [4, 4],
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { filter: (item) => item.datasetIndex !== 3 } },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: "Gap (%) · negative = A faster",
            },
          },
        },
      },
    });
    charts.push(chart);
    document.getElementById("qualifying-rounds").innerHTML =
      `<h3>By round</h3><div class="table-wrap"><table><thead><tr><th class="num">Round</th><th>Weekend</th><th>Session</th><th class="num">Gap (%)</th><th class="num">vs season estimate</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="num">${r.round}</td><td>${esc(r.race)}</td><td>${esc(r.segment)}</td><td class="num">${n(r.observedLogGapPct)}</td><td class="num">${n(r.observedLogGapPct - c.meanLogGapPct)}</td></tr>`).join("")}</tbody></table></div>`;
  };
  document.getElementById("qualifying-pair").addEventListener("change", draw);
  draw();
}
