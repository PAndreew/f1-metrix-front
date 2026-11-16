import { createChart } from "./chart-lifecycle.js";
import { info } from "./hints.js";
const esc = (v) =>
  String(v).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pct = (v) => Math.abs(Number(v)).toFixed(2) + "%";
const colorA = "#e10600",
  colorB = "#4d8dff";
// Published gaps are 100 × log(A time / B time): negative means A was faster.
// Everything shown here names the faster driver instead of relying on a sign.
const faster = (c, gap) => (gap < 0 ? c.nameA : c.nameB);
function verdict(c, rows) {
  const ahead = rows.filter((r) => r.observedLogGapPct < 0).length,
    [low, high] = c.interval95LogGapPct,
    close = low < 0 && high > 0;
  return `<strong>${esc(faster(c, c.meanLogGapPct))}</strong> is faster on average, by ${pct(c.meanLogGapPct)}${close ? " (too close to call)" : ""}. ${esc(c.nameA)} was ahead in ${ahead} of ${rows.length} sessions, ${esc(c.nameB)} in ${rows.length - ahead}.`;
}
export function qualifyingView(main, q, charts) {
  if (!q) {
    main.innerHTML = "<p>No qualifying data available.</p>";
    return;
  }
  main.innerHTML = `<div class="controls"><select id="qualifying-pair" aria-label="Teammate pair">${q.comparisons.map((c, i) => `<option value="${i}">${esc(c.nameA)} vs ${esc(c.nameB)}</option>`).join("")}</select></div><p id="qualifying-verdict"></p><div class="chart-card"><p class="legend" id="qualifying-legend"></p><div style="position:relative;height:320px"><canvas id="qualifying-chart" role="img" aria-label="Qualifying gap by round, coloured by the faster driver"></canvas></div></div><div id="qualifying-rounds"></div><h3>Season averages</h3><div class="table-wrap"><table><thead><tr><th>Teammates</th><th>Faster on average</th><th class="num">Average gap${info("the average gap", "The model’s estimate of the typical qualifying gap between the two teammates over the season, roughly in percent of lap time.")}</th><th class="num">Chance faster${info("Chance faster", "How sure the model is that the named driver really is the faster qualifier. 50% means a coin flip.")}</th><th class="num">Sessions${info("Sessions", "Qualifying sessions where both teammates set a time.")}</th></tr></thead><tbody>${q.comparisons
    .map((c) => {
      const aFaster = c.meanLogGapPct < 0;
      return `<tr><td>${esc(c.nameA)} vs ${esc(c.nameB)}</td><td class="name">${esc(faster(c, c.meanLogGapPct))}</td><td class="num">${pct(c.meanLogGapPct)}</td><td class="num">${Math.round(100 * (aFaster ? c.probabilityAFaster : 1 - c.probabilityAFaster))}%</td><td class="num">${c.sessions}</td></tr>`;
    })
    .join("")}</tbody></table></div>`;
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
    document.getElementById("qualifying-verdict").innerHTML = verdict(c, rows);
    document.getElementById("qualifying-legend").innerHTML =
      `<span class="swatch" style="background:${colorA}"></span>${esc(c.nameA)} faster <span class="swatch" style="background:${colorB}"></span>${esc(c.nameB)} faster <span class="swatch line"></span>Season average`;
    // Plot A's advantage so bars above zero mean A was faster.
    chart = createChart(document.getElementById("qualifying-chart"), {
      type: "bar",
      data: {
        labels: rows.map((r) => `R${r.round}`),
        datasets: [
          {
            label: "Gap",
            data: rows.map((r) => -r.observedLogGapPct),
            backgroundColor: rows.map((r) =>
              r.observedLogGapPct < 0 ? colorA : colorB,
            ),
            borderRadius: 2,
          },
          {
            type: "line",
            label: "Season average",
            data: rows.map(() => -c.meanLogGapPct),
            borderColor: "#1f1f1f",
            borderDash: [5, 4],
            borderWidth: 1.5,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => rows[items[0].dataIndex].race,
              label: (item) =>
                item.datasetIndex === 0
                  ? `${faster(c, rows[item.dataIndex].observedLogGapPct)} faster by ${pct(rows[item.dataIndex].observedLogGapPct)} (${rows[item.dataIndex].segment})`
                  : `Season average: ${faster(c, c.meanLogGapPct)} by ${pct(c.meanLogGapPct)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: {
              color: (ctx) => (ctx.tick.value === 0 ? "#1f1f1f" : "#e6e6e6"),
            },
            ticks: { callback: (v) => Math.abs(v).toFixed(1) + "%" },
            title: {
              display: true,
              text: `Up: ${c.nameA} faster · Down: ${c.nameB} faster`,
            },
          },
        },
      },
    });
    charts.push(chart);
    document.getElementById("qualifying-rounds").innerHTML =
      `<h3>By round</h3><div class="table-wrap"><table><thead><tr><th class="num">Round</th><th>Weekend</th><th>Session</th><th>Faster</th><th class="num">Gap${info("the gap", "How much quicker the faster driver’s lap was, roughly in percent of lap time, in the last session both drivers set a time.")}</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="num">${r.round}</td><td>${esc(r.race)}</td><td>${esc(r.segment)}</td><td class="name">${esc(faster(c, r.observedLogGapPct))}</td><td class="num">${pct(r.observedLogGapPct)}</td></tr>`).join("")}</tbody></table></div>`;
  };
  document.getElementById("qualifying-pair").addEventListener("change", draw);
  draw();
}
