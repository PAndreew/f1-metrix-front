import { installStickyColumns } from "./sticky-columns.js";
import { createChart } from "./chart-lifecycle.js";
import "./style.css";
import { qualifyingView } from "./qualifying.js";
import { simulatorView } from "./simulator.js";
import { info } from "./hints.js";
import { initNextGrandPrix } from "./next-gp.js";
import { createCombobox } from "./combobox.js";
import { modelPage, postsPage } from "./model-page.js";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
Chart.defaults.font.family = "system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#1f1f1f";
// Only change the duration: Chart.js copies just the keys present in
// defaults.animation into each animation, so replacing the object drops
// "type" and hover colour animations crash ("this._fn is not a function").
Chart.defaults.animation.duration = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches
  ? 0
  : 350;
const main = document.querySelector("main");
installStickyColumns(main);
main.tabIndex = -1;
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
  main.scrollIntoView();
});
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const number = (n, d = 2) =>
  Number.isFinite(Number(n)) ? Number(n).toFixed(d) : "—";
const date = (value) =>
  new Date(value + "T12:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
let publication,
  charts = [],
  worker,
  queryId = 0,
  renderVersion = 0;
const red = "#e10600",
  blue = "#4d8dff";
const chartCard = (id, title, subtitle, tall = false) =>
  `<div class="chart-card"><div class="chart-head"><h3>${escape(title)}</h3><span>${escape(subtitle)}</span></div><div class="chart-wrap ${tall ? "tall" : ""}"><canvas id="${id}" role="img" aria-label="${escape(title)}"></canvas></div><div id="${id}-details"></div></div>`;
function tableDetails(id, headers, rows, caption) {
  document.getElementById(id + "-details").innerHTML =
    `<p class="caption">${escape(caption)}</p><details><summary>View chart data</summary><div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${escape(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((v) => `<td>${escape(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}
function addChart(id, config) {
  const el = document.getElementById(id);
  if (el) charts.push(createChart(el, config));
}
const titleYears = (id) => publication.facts?.champions?.[id] ?? [];
const trophy = (id) => {
  const years = titleYears(id);
  if (!years.length) return "";
  const text = `World champion ${years.length > 1 ? `${years.length}× · ` : ""}${years.join(", ")}`;
  return `<span class="trophy" role="img" aria-label="${escape(text)}" title="${escape(text)}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span>`;
};
function intervalChart(id, rows, label) {
  addChart(id, {
    type: "bar",
    data: {
      labels: rows.map((r) => r.name),
      datasets: [
        {
          label: `${publication.model.metadata.intervalPercent ?? 94}% posterior interval`,
          data: rows.map((r) => [r.low, r.high]),
          backgroundColor: blue,
          barThickness: 12,
          borderRadius: 2,
          order: 1,
        },
        {
          type: "scatter",
          label: "Posterior median",
          data: rows.map((r) => ({ x: r.score, y: r.name })),
          pointBackgroundColor: red,
          pointBorderColor: "#fff",
          pointBorderWidth: 1.5,
          pointStyle: "rectRot",
          pointRadius: 6,
          pointHoverRadius: 7,
          // Lower order draws on top, so medians stay visible over the bars.
          order: 0,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) =>
              `${label}: ${number(rows[c.dataIndex].score)} · ${publication.model.metadata.intervalPercent ?? 94}% interval ${number(rows[c.dataIndex].low)} to ${number(rows[c.dataIndex].high)}`,
          },
        },
      },
      scales: {
        x: {
          position: "top",
          grid: { color: "#e6e6e6" },
          border: { display: false },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { autoSkip: false },
        },
      },
    },
  });
}
function rankings(target = main) {
  const m = publication.model,
    interval = m.metadata.intervalPercent ?? 94,
    year = Math.max(...m.drivers.map((d) => d.lastYear));
  target.innerHTML = `<div class="controls"><input id="search" type="search" placeholder="Search drivers…" aria-label="Search drivers" maxlength="100"><select id="minimum" aria-label="Minimum races"><option value="0">All experience levels</option><option value="25">25+ races</option><option value="100">100+ races</option><option value="200">200+ races</option></select><select id="era" aria-label="Era"><option value="all">All years</option><option value="active">Active in ${year}</option></select><select id="champions" aria-label="Champions"><option value="all">All drivers</option><option value="champions">World champions</option></select><button class="quiet" id="download">Download CSV</button></div><div class="tabs" role="tablist"><button role="tab" id="tab-table" aria-controls="panel-table" aria-selected="true">Table</button><button role="tab" id="tab-plot" aria-controls="panel-plot" aria-selected="false">Plot</button><button role="tab" id="tab-trend" aria-controls="panel-trend" aria-selected="false">Trend</button><button role="tab" id="tab-career" aria-controls="panel-career" aria-selected="false">Career</button></div><div role="tabpanel" id="panel-table" aria-labelledby="tab-table"><div class="table-wrap"><table id="rankings"><thead><tr><th class="num"><button data-sort="rank">#</button></th><th><button data-sort="name">Driver</button></th><th class="num"><button data-sort="skill">Score</button>${info("Score", "A driver’s career strength estimated by the model, after taking out the effect of the car, age and experience. Higher is better and 0 is about average. It is not seconds, points or standard deviations: what matters is the difference between two drivers. In equal cars, a driver 1 point higher would finish ahead of the other about 73% of the time, 2 points higher 88%, 3 points higher 95%.")}</th><th class="num">${interval}% range${info(`the ${interval}% range`, `The model is ${interval}% sure the true score lies in this range. Few races means a wide range. When two drivers’ ranges overlap a lot, the data can’t really tell them apart.`)}</th><th class="num"><button data-sort="races">Races</button>${info("Races", "Races the model could use for this driver: those where they were classified as finishing. Retirements and other non-finishes are not counted, so this can be lower than their number of starts.")}</th><th><button data-sort="last_year">Seasons</button></th></tr></thead><tbody id="rows"><tr><td colspan="6">Loading…</td></tr></tbody></table></div><div class="pagination"><span id="count" aria-live="polite"></span><div id="pages" role="navigation" aria-label="Driver result pages"></div></div></div><div role="tabpanel" id="panel-plot" aria-labelledby="tab-plot" hidden><div class="chart-card"><p class="legend"><span class="swatch" style="background:${blue}"></span>${interval}% range<span class="swatch diamond" style="background:${red}"></span>Score${info("this plot", "Each bar is a driver’s range of likely scores and the diamond is the best estimate. It shows the same drivers as the table, so search, filters and page selection apply here too.")}</p><div class="chart-wrap" id="drivers-plot"></div></div></div><div role="tabpanel" id="panel-trend" aria-labelledby="tab-trend" hidden><div class="chart-card"><p class="legend" id="trend-summary"></p><div class="chart-wrap tall" id="trend-plot"></div></div></div><div role="tabpanel" id="panel-career" aria-labelledby="tab-career" hidden><div class="controls"><div id="career-driver"></div><div id="career-compare"></div></div><div class="chart-card"><p class="legend" id="career-legend"></p><div class="chart-wrap tall" id="career-plot"></div></div></div>`;
  let state = {
      search: "",
      minimum: 0,
      active: false,
      champions: false,
      year,
      sort: "rank",
      direction: "asc",
      limit: 25,
      page: 0,
    },
    plot = null,
    trend = null;
  const version = renderVersion;
  const selectTab = (tab) =>
    target.querySelectorAll('[role="tab"]').forEach((t) => {
      const selected = t === tab;
      t.setAttribute("aria-selected", String(selected));
      document.getElementById(t.getAttribute("aria-controls")).hidden =
        !selected;
    });
  target
    .querySelectorAll('[role="tab"]')
    .forEach((tab) => (tab.onclick = () => selectTab(tab)));
  function fallback(limit = state.limit) {
    const rows = m.drivers
      .map((d) => ({ ...d, first_year: d.firstYear, last_year: d.lastYear }))
      .filter(
        (d) =>
          (d.name + " " + d.nationality)
            .toLowerCase()
            .includes(state.search.toLowerCase()) &&
          d.races >= state.minimum &&
          (!state.active || d.last_year >= year) &&
          (!state.champions || titleYears(d.id).length > 0),
      )
      .sort((a, b) => {
        const x = a[state.sort],
          y = b[state.sort];
        return (
          (typeof x === "string" ? x.localeCompare(y) : x - y) *
          (state.direction === "asc" ? 1 : -1)
        );
      });
    const offset = limit === Infinity ? 0 : state.page * state.limit;
    return { total: rows.length, rows: rows.slice(offset, offset + limit) };
  }
  function drawPlot(rows) {
    if (plot) {
      plot.destroy();
      charts.splice(charts.indexOf(plot), 1);
    }
    const host = document.getElementById("drivers-plot");
    host.style.height = `${Math.max(160, rows.length * 24 + 50)}px`;
    host.innerHTML = `<canvas id="drivers-chart" role="img" aria-label="Driver score medians with ${interval}% intervals"></canvas>`;
    intervalChart(
      "drivers-chart",
      rows.map((d) => ({
        name: `${d.rank}. ${d.name}`,
        score: d.skill,
        low: d.low,
        high: d.high,
      })),
      "Score",
    );
    plot = charts.at(-1);
  }
  function drawTrend() {
    if (trend) {
      trend.destroy();
      charts.splice(charts.indexOf(trend), 1);
      trend = null;
    }
    const drivers = fallback(Infinity).rows.map((d) => ({
      x: (d.first_year + d.last_year) / 2,
      y: d.skill,
      d,
    }));
    const summary = document.getElementById("trend-summary");
    if (drivers.length < 2) {
      summary.textContent = "Not enough drivers match the filters.";
      document.getElementById("trend-plot").innerHTML = "";
      return;
    }
    const n = drivers.length,
      mx = drivers.reduce((a, p) => a + p.x, 0) / n,
      my = drivers.reduce((a, p) => a + p.y, 0) / n,
      slope =
        drivers.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) /
        (drivers.reduce((a, p) => a + (p.x - mx) ** 2, 0) || 1),
      xs = drivers.map((p) => p.x),
      ends = [Math.min(...xs), Math.max(...xs)];
    const perDecade = slope * 10;
    summary.innerHTML = `<span class="swatch" style="background:${blue}"></span>Driver (middle of career)<span class="swatch line" style="border-color:${red}"></span>Trend: scores ${perDecade >= 0 ? "rise" : "fall"} by ${Math.abs(perDecade).toFixed(2)} per decade${info("this trend", `Each dot is one driver: their career score against the middle year of their career. The line is the straight-line trend through all ${n} drivers shown, so it tells you whether later eras produced higher or lower scores on average. Scores are relative to the model, so comparing eras depends on its assumptions. Use the minimum races filter to leave out drivers with very few races.`)}`;
    document.getElementById("trend-plot").innerHTML =
      `<canvas id="trend-chart" role="img" aria-label="Driver scores by career midpoint with a trend line"></canvas>`;
    addChart("trend-chart", {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "Drivers",
            data: drivers,
            backgroundColor: "rgba(77, 141, 255, 0.55)",
            pointRadius: 3.5,
            pointHoverRadius: 6,
          },
          {
            type: "line",
            label: "Trend",
            data: ends.map((x) => ({ x, y: my + slope * (x - mx) })),
            borderColor: red,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHitRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        // Tooltips only for the dot under the pointer, never the trend line.
        interaction: {
          mode: "point",
          intersect: true,
          includeInvisible: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => {
                const d = item.raw.d;
                if (!d) return "";
                const titles = titleYears(d.id).length;
                return `${d.rank}. ${d.name} · ${d.first_year}–${d.last_year} · score ${number(d.skill)}${titles ? ` · world champion ×${titles}` : ""}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Middle of career (year)" },
            ticks: { callback: (v) => String(v) },
            grid: { color: "#e6e6e6" },
          },
          y: {
            title: { display: true, text: "Score" },
            grid: { color: "#e6e6e6" },
          },
        },
      },
    });
    trend = charts.at(-1);
  }
  const careers = new Map();
  for (const r of m.driverYears ?? [])
    (
      careers.get(r.driverId) ?? careers.set(r.driverId, []).get(r.driverId)
    ).push(r);
  for (const rows of careers.values()) rows.sort((a, b) => a.year - b.year);
  let career = null,
    careerIds = [];
  function drawCareer() {
    if (career) {
      career.destroy();
      charts.splice(charts.indexOf(career), 1);
      career = null;
    }
    const drivers = careerIds
      .map((id) => m.drivers.find((d) => d.id === id))
      .filter((d) => d && careers.has(d.id));
    const legend = document.getElementById("career-legend");
    if (!drivers.length) {
      legend.textContent = "Pick a driver to see their career curve.";
      document.getElementById("career-plot").innerHTML = "";
      return;
    }
    const colors = [blue, red];
    legend.innerHTML =
      drivers
        .map(
          (d, i) =>
            `<span class="swatch" style="background:${colors[i]}"></span>${escape(d.name)}${trophy(d.id)}`,
        )
        .join("") +
      `<span class="swatch band"></span>${interval}% range` +
      info(
        "the career curve",
        "The model gives each driver one career level and adjusts it for their age and experience each season, so the curve is smooth. It shows how the model thinks the driver’s ability changed over their career; it does not capture good or bad individual seasons. Gaps are seasons they did not race.",
      );
    // Points per season, with a null where a driver skipped a year so the line breaks.
    const series = (d, key) => {
      const rows = careers.get(d.id),
        points = [];
      rows.forEach((r, i) => {
        if (i && r.year - rows[i - 1].year > 1)
          points.push({ x: r.year - 1, y: null });
        points.push({ x: r.year, y: r[key], r });
      });
      return points;
    };
    document.getElementById("career-plot").innerHTML =
      `<canvas id="career-chart" role="img" aria-label="Career curve by season for ${escape(drivers.map((d) => d.name).join(" and "))}"></canvas>`;
    addChart("career-chart", {
      type: "line",
      data: {
        datasets: drivers.flatMap((d, i) => [
          {
            label: `${d.name} lower`,
            data: series(d, "low95"),
            borderWidth: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0,
          },
          {
            label: `${d.name} upper`,
            data: series(d, "high95"),
            borderWidth: 0,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 0,
            backgroundColor: i
              ? "rgba(225, 6, 0, 0.12)"
              : "rgba(77, 141, 255, 0.18)",
            fill: "-1",
          },
          {
            label: d.name,
            data: series(d, "median"),
            borderColor: colors[i],
            backgroundColor: colors[i],
            borderWidth: 2.5,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
        ]),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        spanGaps: false,
        // Hovering anywhere over a season shows every plotted driver for it.
        interaction: { mode: "nearest", axis: "x", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: (item) => item.datasetIndex % 3 === 2 && !!item.raw?.r,
            callbacks: {
              title: (items) => (items.length ? String(items[0].raw.x) : ""),
              label: (item) => {
                const r = item.raw.r;
                return `${item.dataset.label}: ${number(r.median)} (${number(r.low95)} to ${number(r.high95)}) · ${r.races} races`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "linear",
            ticks: { stepSize: 1, precision: 0, callback: (v) => String(v) },
            grid: { color: "#e6e6e6" },
          },
          y: {
            title: { display: true, text: "Score" },
            grid: {
              color: (ctx) => (ctx.tick.value === 0 ? "#1f1f1f" : "#e6e6e6"),
            },
          },
        },
      },
    });
    career = charts.at(-1);
  }
  const ranked = [...m.drivers].sort((a, b) => a.rank - b.rank);
  const driverOptions = ranked.map((d) => ({
    value: d.id,
    label: `${d.rank}. ${d.name}`,
  }));
  const pick = () =>
    showCareer([
      careerIds[0],
      careerIds[1] !== careerIds[0] ? careerIds[1] : null,
    ]);
  const careerDriver = createCombobox(
    document.getElementById("career-driver"),
    {
      label: "Driver",
      options: driverOptions,
      onChange: (id) => ((careerIds[0] = id), pick()),
    },
  );
  const careerCompare = createCombobox(
    document.getElementById("career-compare"),
    {
      label: "Compare with",
      options: [{ value: "", label: "Compare with: none" }, ...driverOptions],
      onChange: (id) => ((careerIds[1] = id || null), pick()),
    },
  );
  const showCareer = (ids) => {
    careerIds = ids.filter(Boolean);
    careerDriver.set(careerIds[0]);
    careerCompare.set(careerIds[1]);
    drawCareer();
  };
  document.getElementById("rows").onclick = (event) => {
    const link = event.target.closest(".driver-link");
    if (!link) return;
    showCareer([link.dataset.driver]);
    selectTab(document.getElementById("tab-career"));
  };
  showCareer([ranked[0]?.id]);
  function draw({ rows, total }) {
    if (version !== renderVersion) return;
    document.getElementById("rows").innerHTML = rows.length
      ? rows
          .map(
            (d) =>
              `<tr><td class="num rank">${escape(d.rank)}.</td><td class="name"><button type="button" class="driver-link" data-driver="${escape(d.id)}" title="Show career curve">${escape(d.name)}</button>${trophy(d.id)}</td><td class="num">${number(d.skill)}</td><td class="num">${number(d.low)} – ${number(d.high)}</td><td class="num">${escape(d.races)}</td><td>${escape(d.first_year)}–${escape(d.last_year)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6">No matching drivers.</td></tr>';
    document.getElementById("count").textContent = total
      ? `Showing ${state.page * state.limit + 1}–${state.page * state.limit + rows.length} of ${total} drivers`
      : "No matching drivers";
    const pageHadFocus = document.activeElement?.closest("#pages");
    const pageCount = Math.ceil(total / state.limit);
    document.getElementById("pages").innerHTML = pageCount
      ? `<button class="quiet" type="button" data-page="${state.page - 1}" aria-label="Previous page" ${state.page === 0 ? "disabled" : ""}>Previous</button>` +
        `<select id="page-select" aria-label="Driver results page">${Array.from({ length: pageCount }, (_, page) => `<option value="${page}" ${page === state.page ? "selected" : ""}>${page + 1}</option>`).join("")}</select>` +
        `<button class="quiet" type="button" data-page="${state.page + 1}" aria-label="Next page" ${state.page === pageCount - 1 ? "disabled" : ""}>Next</button>`
      : "";
    if (pageHadFocus)
      document.querySelector("#page-select")?.focus({ preventScroll: true });
    target
      .querySelectorAll("th")
      .forEach((th) => th.removeAttribute("aria-sort"));
    target
      .querySelector(`[data-sort="${state.sort}"]`)
      .closest("th")
      .setAttribute(
        "aria-sort",
        state.direction === "asc" ? "ascending" : "descending",
      );
    drawPlot(rows);
    drawTrend();
  }
  function query() {
    const id = ++queryId;
    if (!worker) {
      draw(fallback());
      return;
    }
    worker.onmessage = ({ data }) => {
      if (data.id !== id) return;
      draw(data.error ? fallback() : data);
    };
    worker.postMessage({ ...state, offset: state.page * state.limit, id });
  }
  try {
    worker ||= new Worker(new URL("./db.worker.js", import.meta.url), {
      type: "module",
    });
    worker.onerror = () => {
      worker.terminate();
      worker = null;
      if (version === renderVersion) draw(fallback());
    };
  } catch {
    worker = null;
  }
  let timer;
  document.getElementById("search").oninput = (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = e.target.value;
      state.page = 0;
      query();
    }, 120);
  };
  document.getElementById("pages").onclick = (event) => {
    const button = event.target.closest("[data-page]");
    if (!button || Number(button.dataset.page) === state.page) return;
    state.page = Number(button.dataset.page);
    query();
  };
  document.getElementById("pages").onchange = (event) => {
    if (event.target.id !== "page-select") return;
    state.page = Number(event.target.value);
    query();
  };
  const refilter = (change) => {
    change();
    state.page = 0;
    query();
  };
  document.getElementById("minimum").onchange = (e) =>
    refilter(() => (state.minimum = Number(e.target.value)));
  document.getElementById("era").onchange = (e) =>
    refilter(() => (state.active = e.target.value === "active"));
  document.getElementById("champions").onchange = (e) =>
    refilter(() => (state.champions = e.target.value === "champions"));
  target.querySelectorAll("[data-sort]").forEach(
    (b) =>
      (b.onclick = () =>
        refilter(() => {
          state.direction =
            state.sort === b.dataset.sort && state.direction === "asc"
              ? "desc"
              : "asc";
          state.sort = b.dataset.sort;
        })),
  );
  document.getElementById("download").onclick = () => {
    const fields = [
      "rank",
      "name",
      "skill",
      "low",
      "high",
      "races",
      "first_year",
      "last_year",
      "titles",
    ];
    const csv = [
      fields,
      ...fallback(Infinity).rows.map((d) =>
        fields.map((k) => (k === "titles" ? titleYears(d.id).length : d[k])),
      ),
    ]
      .map((r) =>
        r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "f1metrix-filtered-drivers.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  query();
}
function method(target = main) {
  const m = publication.model.metadata,
    interval = m.intervalPercent ?? 95;
  target.innerHTML = `<div class="prose"><h3>What this site does</h3><p>In Formula One the car matters as much as the driver, so race results alone can’t tell you who the best drivers are. F1 Metrix uses a statistical model to separate the two. Every race result counts as evidence about the driver and about how good that team’s car was that season. Fitting all races since 1954 together lets the model tell driver from car, much like comparing a driver with their teammate, but across whole careers.</p><h3>Driver rankings</h3><p>Each driver gets a score for their whole career. Higher is better. The score is a relative strength on the model’s own scale, not seconds, points or standard deviations; 0 is about average. What matters is the difference between two drivers: in equal cars, a driver 1 point higher would finish ahead of the other about 73% of the time, 2 points higher 88%, 3 points higher 95%. The range next to it shows the uncertainty: the model is ${interval}% sure the true value lies inside it. Drivers with few races have wide ranges. If two drivers’ ranges overlap a lot, the data can’t really separate them. The model also allows for age and experience.</p><h3>Constructors by season</h3><p>Each team gets a separate score for every season, measuring how good its car was that year relative to the other teams that year. Scores from different seasons should not be compared.</p><h3>2026 race simulations</h3><p>The experimental sequential preview starts with a prior fitted before 2026 and updates expectations using only earlier Grand Prix results. Completed rounds show their training cutoff; later rounds stay pending. The historical prior is approximated by a joint Gaussian, with age uncertainty propagated through the sequential updates. Remaining rounds stay pending until their checks pass. Only the actual eligible finishers are compared, making this a retrospective finisher-field assessment rather than a full-grid pre-race forecast. Beating the model can reflect driving, luck or model error.</p><h3>2026 qualifying</h3><p>Teammates share the same car, so their qualifying lap times are a fair comparison. Every gap names the faster driver and shows roughly how much quicker their lap was, in percent. On the chart, bars above the line mean the first-named driver was faster and bars below mean their teammate was. The season average combines every weekend; “too close to call” means the data can’t say for sure who is quicker. A single weekend’s gap can also come from conditions, mistakes or incidents.</p><h3>Limitations</h3><ul><li>This is a research preview. The model fits the past well, but it has not yet been tested on predicting future races.</li><li>Comparing drivers from very different eras depends on the model’s assumptions.</li><li>Only finishing order is used; retirements and car failures are left out.</li><li>Seasons before 1954 are not included.</li></ul><h3>Data</h3><p>Race data comes from <a href="https://github.com/f1db/f1db">F1DB</a> ${escape(m.sourceRelease)}, up to ${escape(m.lastRaceDate)}. The full results and diagnostics are <a href="https://github.com/PAndreew/f1-metrix-front/tree/master/publication">on GitHub</a>.</p></div>`;
}
function article(id) {
  const a = publication.articles.find((a) => a.id === id);
  if (!a) {
    main.innerHTML =
      '<h1>Article not found.</h1><a href="#/">Back to the journal</a>';
    return;
  }
  const refs = (ids) =>
    `<span class="sources">${ids
      .map((id) => {
        const s = a.sources.find((s) => s.id === id);
        return s
          ? `<a href="${escape(s.url)}" rel="noopener noreferrer">${escape(id)}</a>`
          : "";
      })
      .join(" · ")}</span>`;
  main.innerHTML = `<a class="back" href="#/">Home</a><p class="eyebrow">${date(a.date)} · ${escape(a.status)} · AI analysis</p><h1>${escape(a.title)}</h1><p class="intro">${escape(a.summary)}</p><aside class="notice">Retrospective held-out reconstruction, conditional on no technical retirement. A better-than-expected result is not an isolated measure of driver skill. Classification and analysis may be revised.</aside>${chartCard("expectation", "What happened vs. the model", "Position · lower is better", true)}<div class="prose">${a.sections.map((s) => `<section><h2>${escape(s.heading)}</h2><p>${escape(s.text)}</p>${refs(s.sources)}</section>`).join("")}</div><h2 style="margin-top:40px">Every driver, in context</h2>${a.drivers
    .map((d) => {
      const r = a.evaluations.find((r) => r.driverId === d.driverId);
      return `<section class="driver-note"><span class="tag">P${r.position} · expected ${number(r.expectedPosition, 1)}</span><h3>${escape(r.name)}</h3><p>${escape(d.assessment)}</p>${refs(d.sources)}</section>`;
    })
    .join(
      "",
    )}<details><summary>Evidence limitations and provenance</summary><ul>${a.evidence.limitations.map((l) => `<li>${escape(l)}</li>`).join("")}</ul><p>Generated with ${escape(a.generation.model)} · prompt ${escape(a.generation.promptVersion)}</p></details><div class="sources"><h3>Sources</h3>${a.sources.map((s) => `<p><a href="${escape(s.url)}" rel="noopener noreferrer">${escape(s.id)}</a></p>`).join("")}</div>`;
  const rows = a.evaluations;
  addChart("expectation", {
    type: "bar",
    data: {
      labels: rows.map((r) => r.name.split(" ").at(-1)),
      datasets: [
        {
          label: "Expected position (held-out)",
          data: rows.map((r) => r.expectedPosition),
          backgroundColor: "#b9b0a3",
          borderRadius: 2,
        },
        {
          label: "Actual classification",
          data: rows.map((r) => r.position),
          backgroundColor: red,
          borderRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { maxRotation: 70, minRotation: 45 },
          grid: { display: false },
        },
        y: {
          min: 0,
          title: { display: true, text: "Position · smaller is better" },
          ticks: { stepSize: 5 },
        },
      },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const r = rows[items[0].dataIndex];
              return `94% predicted range: ${r.low}–${r.high}\nNot adjusted for technical retirement`;
            },
          },
        },
      },
    },
  });
  tableDetails(
    "expectation",
    ["Driver", "Actual", "Expected", "Lower", "Upper"],
    rows.map((r) => [
      r.name,
      r.position,
      number(r.expectedPosition, 1),
      r.low,
      r.high,
    ]),
    "Expected positions come from joint simulations fitted strictly before the race date. Retirement and incident context must be considered separately.",
  );
}
function constructorResults(target) {
  const years = [...new Set(publication.model.teams.map((t) => t.year))].sort(
    (a, b) => b - a,
  );
  target.innerHTML = `<div class="controls"><select id="constructor-year" aria-label="Season">${years.map((y) => `<option>${y}</option>`).join("")}</select>${info("the team score", "How good each team’s car was that season compared with the other teams that year, after taking out the effect of its drivers. The diamond is the best estimate and the bar the range of likely values. Scores from different seasons should not be compared.")}</div><div class="chart-card"><div class="chart-wrap" id="constructor-chart-host"></div></div>`;
  let chart = null;
  const draw = () => {
    if (chart) {
      chart.destroy();
      charts.splice(charts.indexOf(chart), 1);
    }
    const year = Number(document.getElementById("constructor-year").value);
    const rows = publication.model.teams
      .filter((t) => t.year === year)
      .sort((a, b) => b.skill - a.skill)
      .map((t) => ({ ...t, score: t.skill }));
    const host = document.getElementById("constructor-chart-host");
    host.style.height = `${rows.length * 30 + 50}px`;
    host.innerHTML = `<canvas id="teams-chart" role="img" aria-label="Constructor scores for ${year}"></canvas>`;
    intervalChart("teams-chart", rows, "Score");
    chart = charts.at(-1);
  };
  document.getElementById("constructor-year").addEventListener("change", draw);
  draw();
}

const sections = [
  ["career", "All time historical driver rankings"],
  ["constructors", "Constructor strength by season"],
  ["simulations", "2026 race simulations"],
  ["qualifying", "2026 qualifying: teammate gaps"],
  ["method", "Method and limitations"],
];
function allResults() {
  main.innerHTML = `<h1 class="visually-hidden">F1 Metrix</h1><p class="intro">Welcome to F1Metrix. The site’s goal is to provide data-driven, unbiased analysis of Formula 1© drivers and teams throughout the sport’s history. It is inspired by Dr. Andrew Phillips’ synonymous <a href="https://f1metrics.wordpress.com/">f1metrics</a> blog, which was sadly discontinued around 2020.</p><details class="disclaimer"><summary><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>A few disclaimers…</summary><div class="disclaimer-body"><p>I’m not a mathematician; I fed Dr. Andrew Bell et al.’s paper and Dr. Phillips’ updated model writeup from his blog to GPT-6 Astra, which devised this hybrid model. I’d very much welcome it if someone could review it. Nevertheless, I’d like to explicitly reinforce the fact that even these sophisticated models cannot fully cover every nuance in this highly complex sport, therefore these results do not represent absolute truth.</p><p>Also, the site’s codebase was written by the same LLMs with their usual “ai-isms”. I’m gradually trying to improve the UX of the site, but since I’m on a 20 bucks Plus plan and have to tend to other codebases, I can only pour a limited number of tokens into this project. The source code is available on <a href=\"https://github.com/PAndreew/f1-metrix-front\" rel=\"noopener noreferrer\">GitHub</a>, so everyone can scrutinise it and submit issues or ideas if they wish.</p><p>I have several upcoming features which will hopefully materialise during the upcoming days and weeks. The most important is that I intend to wire together a pipeline that will automatically assess the outcome of every Grand Prix with the aid of Astra and publish an analysis article, with me occasionally chiming in. As I mentioned, one of the goals of the site is to stay neutral, and though generally I avoid LLM slop disguised as human writing, I think for a project like this, the inhuman nature of the model can actually be a boon. We’ll see.</p><p>I hope you’ll enjoy digging through the data, and please contact me with any concerns or ideas.</p></div></details>${sections
    .map(
      ([id, title]) =>
        `<details class="results-section" id="section-${id}"${id === "career" ? " open" : ""}><summary>${title}</summary><section id="results-${id}" class="accordion-body"></section></details>`,
    )
    .join("")}`;
  simulatorView(
    document.getElementById("results-simulations"),
    publication.simulations,
    charts,
    publication.qualifying,
  );
  qualifyingView(
    document.getElementById("results-qualifying"),
    publication.qualifying,
    charts,
  );
  rankings(document.getElementById("results-career"));
  constructorResults(document.getElementById("results-constructors"));
  method(document.getElementById("results-method"));
}
main.addEventListener(
  "toggle",
  (event) => {
    if (event.target.open)
      requestAnimationFrame(() =>
        event.target
          .querySelectorAll("canvas")
          .forEach((c) => Chart.getChart(c)?.resize()),
      );
  },
  true,
);

const routes = {
  rankings: "career",
  constructors: "constructors",
  simulations: "simulations",
  simulator: "simulations",
  qualifying: "qualifying",
  method: "method",
};
function openSection(route) {
  const panel = document.getElementById("section-" + routes[route]);
  if (!panel) return;
  panel.open = true;
  requestAnimationFrame(() => panel.scrollIntoView());
}
// A reload always starts at the top with only the rankings open, even if the
// URL still carries a section link or the browser remembers a scroll position.
history.scrollRestoration = "manual";
let firstRender = true;
function render() {
  renderVersion++;
  charts.forEach((c) => c.destroy());
  charts = [];
  const route = location.hash.slice(2) || "";
  if (route.startsWith("article/")) {
    article(decodeURIComponent(route.slice(8)));
    document.title = "Article — F1 Metrix";
  } else if (route === "model") {
    modelPage(main, publication.model.metadata);
    document.title = "The model — F1 Metrix";
  } else if (route === "posts") {
    postsPage(main);
    document.title = "Posts — F1 Metrix";
  } else {
    allResults();
    const reloaded =
      firstRender &&
      performance.getEntriesByType("navigation")[0]?.type === "reload";
    if (reloaded && routes[route])
      history.replaceState(null, "", location.pathname + location.search);
    else openSection(route);
    // Legacy comparison bookmarks render the same complete page, never separate views.
    document.title = "F1 Metrix";
  }
  firstRender = false;
}
const menu = document.getElementById("menu"),
  menuToggle = document.querySelector(".menu-toggle");
const setMenu = (open) => {
  menu.hidden = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
};
menuToggle.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (!link) return;
  setMenu(false);
  // Section links open and scroll without putting the section in the URL.
  const route = link.hash.slice(2);
  if (routes[route] && document.getElementById("section-career")) {
    event.preventDefault();
    openSection(route);
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".topbar")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menu.hidden) {
    setMenu(false);
    menuToggle.focus();
  }
});
fetch("/data/publication.json")
  .then((r) => {
    if (!r.ok) throw Error("Publication unavailable");
    return r.json();
  })
  .then((data) => {
    publication = data;
    initNextGrandPrix(data.facts);
    render();
    window.addEventListener("hashchange", () => {
      const route = location.hash.slice(2) || "";
      // Section links only open and scroll; keep the page and its charts intact.
      if (document.getElementById("section-career") && routes[route])
        openSection(route);
      else {
        render();
        window.scrollTo(0, 0);
      }
    });
  })
  .catch(() => {
    main.innerHTML =
      "<h1>Taking a pit stop.</h1><p>The publication could not be loaded. Please try again shortly.</p>";
  });
