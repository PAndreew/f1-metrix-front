import { createChart } from "./chart-lifecycle.js";
import "./style.css";
import { qualifyingView } from "./qualifying.js";
import { simulatorView } from "./simulator.js";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
Chart.defaults.font.family = "system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#1f1f1f";
Chart.defaults.animation = window.matchMedia("(prefers-reduced-motion: reduce)")
  .matches
  ? false
  : { duration: 350 };
const main = document.querySelector("main");
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
const note = () =>
  publication.notice
    ? `<aside class="notice" role="note">${escape(publication.model.metadata.validationStatus === "research_preview" ? "Research preview. Fits converged; predictive validation is incomplete." : publication.notice)}</aside>`
    : "";
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
function intervalChart(id, rows, label, details = true) {
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
  if (details)
    tableDetails(
      id,
      ["Name", "Median", "Lower bound", "Upper bound"],
      rows.map((r) => [r.name, number(r.score), number(r.low), number(r.high)]),
      `Bars show ${publication.model.metadata.intervalPercent ?? 94}% posterior intervals; red marks show medians.`,
    );
}
function rankings(target = main) {
  const m = publication.model,
    interval = m.metadata.intervalPercent ?? 94;
  target.innerHTML = `<div class="tabs" role="tablist"><button role="tab" id="tab-table" aria-controls="panel-table" aria-selected="true">Table</button><button role="tab" id="tab-plot" aria-controls="panel-plot" aria-selected="false">Plot</button></div><div role="tabpanel" id="panel-table" aria-labelledby="tab-table"><div class="controls"><input id="search" type="search" placeholder="Search drivers…" aria-label="Search drivers" maxlength="100"></div><div class="table-wrap"><table id="rankings"><thead><tr><th class="num">#</th><th>Driver</th><th class="num">Score</th><th class="num">${interval}% range</th><th class="num">Races</th><th>Seasons</th></tr></thead><tbody id="rows"><tr><td colspan="6">Loading…</td></tr></tbody></table></div><div class="pagination"><span id="count" aria-live="polite"></span><button class="quiet" id="more">Load more drivers</button></div></div><div role="tabpanel" id="panel-plot" aria-labelledby="tab-plot" hidden><div class="chart-card"><div class="chart-wrap" id="drivers-plot"></div></div></div>`;
  let state = { search: "", limit: 25 },
    plot = null;
  const version = renderVersion;
  target.querySelectorAll('[role="tab"]').forEach(
    (tab) =>
      (tab.onclick = () =>
        target.querySelectorAll('[role="tab"]').forEach((t) => {
          const selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          document.getElementById(t.getAttribute("aria-controls")).hidden =
            !selected;
        })),
  );
  function fallback() {
    const rows = m.drivers
      .map((d) => ({ ...d, first_year: d.firstYear, last_year: d.lastYear }))
      .filter((d) =>
        (d.name + " " + d.nationality)
          .toLowerCase()
          .includes(state.search.toLowerCase()),
      )
      .sort((a, b) => a.rank - b.rank);
    return { total: rows.length, rows: rows.slice(0, state.limit) };
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
      false,
    );
    plot = charts.at(-1);
  }
  function draw({ rows, total }) {
    if (version !== renderVersion) return;
    document.getElementById("rows").innerHTML = rows.length
      ? rows
          .map(
            (d) =>
              `<tr><td class="num rank">${escape(d.rank)}.</td><td class="name">${escape(d.name)}</td><td class="num">${number(d.skill)}</td><td class="num">${number(d.low)} – ${number(d.high)}</td><td class="num">${escape(d.races)}</td><td>${escape(d.first_year)}–${escape(d.last_year)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6">No matching drivers.</td></tr>';
    document.getElementById("count").textContent =
      `Showing ${rows.length} of ${total} drivers`;
    document.getElementById("more").hidden = rows.length >= total;
    drawPlot(rows);
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
    worker.postMessage({ ...state, id });
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
      state.limit = 25;
      query();
    }, 120);
  };
  document.getElementById("more").onclick = () => {
    state.limit += 25;
    query();
  };
  query();
}
function method(target = main) {
  const m = publication.model.metadata;
  target.innerHTML = `<h1>About <em>F1 Metrix</em></h1><div class="prose"><p class="intro">An homage to <a href="https://f1metrics.wordpress.com/">f1metrics</a>, Andrew Phillips’s long-running project exploring Formula One driver performance beyond the machinery.</p><p>This is an independent continuation of that question, not a reproduction of his model or an affiliated project.</p>${note()}<h2>The model</h2><p>Joint finishing-order estimates with driver and constructor-season effects, adjusted for age and experience. Rankings sort career-baseline medians; bars show ${m.intervalPercent ?? 94}% posterior intervals. Only eligible completion-order observations are counted, not every start.</p><h2>The data</h2><p><a href="https://github.com/f1db/f1db">F1DB</a> ${escape(m.sourceRelease)}, through ${escape(m.lastRaceDate)}. Career fitting starts in 1954. Cross-era comparisons depend on model assumptions.</p><p><a href="https://github.com/PAndreew/f1-metrix-front/tree/master/publication">Results, diagnostics and limitations</a></p></div>`;
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
  target.innerHTML = `<h2>Constructor strength by season</h2><p>These are team-season equipment effects, not all-time constructor rankings and not driver rankings. Select a season; estimates are centred within that season.</p><div class="controls"><label>Constructor season<select id="constructor-year">${years.map((y) => `<option>${y}</option>`).join("")}</select></label></div><div id="constructor-chart-host"></div>`;
  const draw = () => {
    const prior = charts.find((c) => c.canvas?.id === "teams-chart");
    if (prior) {
      prior.destroy();
      charts.splice(charts.indexOf(prior), 1);
    }
    const year = Number(document.getElementById("constructor-year").value);
    document.getElementById("constructor-chart-host").innerHTML = chartCard(
      "teams-chart",
      `Constructor equipment estimates · ${year}`,
      `${year} only · not comparable to all-time driver ranks`,
      true,
    );
    const rows = publication.model.teams
      .filter((t) => t.year === year)
      .sort((a, b) => b.skill - a.skill)
      .map((t) => ({ ...t, score: t.skill }));
    intervalChart("teams-chart", rows, "Median");
  };
  document.getElementById("constructor-year").addEventListener("change", draw);
  draw();
}

function allResults() {
  main.innerHTML = `<h1>F1 <em>Metrix</em></h1><p class="intro">An homage to <a href="https://f1metrics.wordpress.com/">f1metrics</a> by Andrew Phillips.</p><details class="results-section" id="section-career" open><summary>All time historical driver rankings</summary><section id="results-career" class="accordion-body"></section></details><details class="results-section" id="section-constructors"><summary>Constructor strength by season</summary><section id="results-constructors" class="accordion-body"></section></details><details class="results-section" id="section-simulations"><summary>2026 race simulations and weekend comparisons</summary><section id="results-simulations" class="accordion-body"></section></details>${[
    ["qualifying", "Season qualifying comparisons"],
    ["method", "Method and limitations"],
  ]
    .map(
      ([id, title]) =>
        `<details class="results-section" id="section-${id}"><summary>${title}</summary><section id="results-${id}" class="accordion-body"></section></details>`,
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
  main.querySelectorAll("section > h1").forEach((h) => {
    const replacement = document.createElement("h2");
    replacement.innerHTML = h.innerHTML;
    h.replaceWith(replacement);
  });
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

function render() {
  renderVersion++;
  charts.forEach((c) => c.destroy());
  charts = [];
  const route = location.hash.slice(2) || "";
  if (route.startsWith("article/")) {
    article(decodeURIComponent(route.slice(8)));
    document.title = "Article — F1 Metrix";
  } else {
    allResults();
    const section = {
      rankings: "career",
      qualifying: "qualifying",

      method: "method",
    }[route];
    if (section) {
      const panel = document.getElementById("section-" + section);
      panel.open = true;
      requestAnimationFrame(() => panel.scrollIntoView());
    }
    // Legacy comparison bookmarks render the same complete page, never separate views.
    document.title = "All results — F1 Metrix";
  }
}
fetch("/data/publication.json")
  .then((r) => {
    if (!r.ok) throw Error("Publication unavailable");
    return r.json();
  })
  .then((data) => {
    publication = data;
    render();
    window.addEventListener("hashchange", () => {
      render();
      window.scrollTo(0, 0);
    });
  })
  .catch(() => {
    main.innerHTML =
      "<h1>Taking a pit stop.</h1><p>The publication could not be loaded. Please try again shortly.</p>";
  });
