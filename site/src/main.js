import { createChart } from "./chart-lifecycle.js";
import "./style.css";
import { qualifyingView } from "./qualifying.js";
import { simulatorView } from "./simulator.js";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
Chart.defaults.font.family = "system-ui, sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = "#76716b";
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
const red = "#b52c2a",
  neutral = "#a69e92";
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
function intervalChart(id, rows, label) {
  addChart(id, {
    type: "bar",
    data: {
      labels: rows.map((r) => r.name),
      datasets: [
        {
          label: `${publication.model.metadata.intervalPercent ?? 94}% posterior interval`,
          data: rows.map((r) => [r.low, r.high]),
          backgroundColor: "#d9b8b1",
          barThickness: 10,
          borderRadius: 2,
        },
        {
          type: "scatter",
          label: "Posterior median",
          data: rows.map((r) => ({ x: r.score, y: r.name })),
          pointBackgroundColor: red,
          pointBorderColor: red,
          pointStyle: "rect",
          pointRadius: 4,
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
          title: { display: true, text: "Latent outcome score · not seconds" },
          grid: { color: "#eeeae3" },
          border: { display: false },
        },
        y: { grid: { display: false }, border: { display: false } },
      },
    },
  });
  tableDetails(
    id,
    ["Name", "Median", "Lower bound", "Upper bound"],
    rows.map((r) => [r.name, number(r.score), number(r.low), number(r.high)]),
    `Bars show ${publication.model.metadata.intervalPercent ?? 94}% posterior intervals; red marks show medians. Overlap matters. Scores are model units, not lap times.`,
  );
}
function rankingRows() {
  return [...publication.model.drivers]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
    .map((d) => ({ name: d.name, score: d.skill, low: d.low, high: d.high }));
}
function journal() {
  const m = publication.model;
  main.innerHTML = `<h1>F1 <em>Metrix</em></h1><p class="intro">An homage to <a href="https://f1metrics.wordpress.com/">f1metrics</a> and Andrew Phillips’s work on separating driver performance from the car.</p><p>Independent work, inspired by the original. Not affiliated with f1metrics.</p><p><a class="link" href="#/results">Explore all results</a></p>${note()}${chartCard("overview", "Driver estimates", "Career baseline")}<div class="stats"><div class="stat"><b>${m.drivers.length}</b><span>drivers</span></div><div class="stat"><b>${Number(m.metadata.observations).toLocaleString()}</b><span>eligible race observations</span></div><div class="stat"><b>${m.metadata.intervalPercent ?? 94}%</b><span>posterior intervals</span></div></div>`;
  intervalChart("overview", rankingRows(), "Median");
}
function rankings(target = main) {
  const m = publication.model,
    year = Math.max(...m.drivers.map((d) => d.lastYear));
  target.innerHTML = `<p class="eyebrow">The model / driver explorer</p><h1>Model <em>results</em></h1>${note()}<div class="section-label"><span>${escape(m.metadata.model)}</span><span>Through ${escape(m.metadata.lastRaceDate)}</span></div><p>All-time driver career baselines across historical seasons—not 2026 driver form. Constructor estimates are separate, season-specific results in the section below.</p>${chartCard("drivers-chart", "All-time driver career estimates", "Historical career baseline · not a season ranking", true)}<div class="controls"><label>Search drivers or nationality<input id="search" type="search" placeholder="e.g. Alonso, British…" maxlength="100"></label><label>Minimum races<select id="minimum"><option value="0">All experience levels</option><option value="25">25+ races</option><option value="100">100+ races</option><option value="200">200+ races</option></select></label><label>Era<select id="era"><option value="all">All years</option><option value="active">Active in ${year}</option></select></label><button class="quiet" id="download">Download CSV</button></div><div class="table-wrap"><table id="rankings"><thead><tr><th><button data-sort="rank">Rank</button></th><th><button data-sort="name">Driver</button></th><th class="num"><button data-sort="skill">Median</button></th><th class="num">${m.metadata.intervalPercent ?? 94}% interval</th><th class="num"><button data-sort="races">Races</button></th><th><button data-sort="last_year">Seasons</button></th></tr></thead><tbody id="rows"><tr><td colspan="6">Loading explorer…</td></tr></tbody></table></div><div class="pagination"><span id="count" aria-live="polite"></span><div><button class="quiet" id="previous">Previous</button><button class="quiet" id="next">Next</button></div></div><p class="caption" id="db-status">SQLite runs locally in your browser. No queries leave your device.</p><details><summary>How to read this table</summary>Career baseline skill is a latent log-strength in the joint Plackett–Luce ordering model, not seconds or points. Ranks sort posterior medians. Ages, experience and constructor-season effects are adjusted for; these values are career baselines, not season performance. Races count eligible completion-order observations, not every start. Rankings remain exploratory pending predictive validation.</details>`;
  intervalChart("drivers-chart", rankingRows(), "Median");
  let state = {
      search: "",
      minimum: 0,
      active: false,
      year,
      page: 0,
      sort: "rank",
      direction: "asc",
    },
    currentRows = [],
    total = 0;
  const version = renderVersion;
  function fallback() {
    let rows = m.drivers
      .map((d) => ({ ...d, first_year: d.firstYear, last_year: d.lastYear }))
      .filter(
        (d) =>
          (d.name + " " + d.nationality)
            .toLowerCase()
            .includes(state.search.toLowerCase()) &&
          d.races >= state.minimum &&
          (!state.active || d.last_year >= year),
      );
    rows.sort((a, b) => {
      const x = a[state.sort],
        y = b[state.sort];
      return (
        (typeof x === "string" ? x.localeCompare(y) : x - y) *
        (state.direction === "asc" ? 1 : -1)
      );
    });
    return {
      total: rows.length,
      rows: rows.slice(state.page * 25, state.page * 25 + 25),
    };
  }
  function draw(response) {
    if (version !== renderVersion) return;
    total = response.total;
    currentRows = response.rows;
    document.getElementById("rows").innerHTML = currentRows.length
      ? currentRows
          .map(
            (d) =>
              `<tr><td class="red">${escape(d.rank)}</td><td class="name">${escape(d.name)}<span class="sub">${escape(d.nationality || "Nationality unavailable")}</span></td><td class="num">${number(d.skill, 3)}</td><td class="num">${number(d.low, 3)} — ${number(d.high, 3)}</td><td class="num">${escape(d.races)}</td><td>${escape(d.first_year)}–${escape(d.last_year)}</td></tr>`,
          )
          .join("")
      : '<tr><td colspan="6">No matching drivers. Try fewer filters.</td></tr>';
    document.getElementById("count").textContent =
      `${total ? state.page * 25 + 1 : 0}–${Math.min((state.page + 1) * 25, total)} of ${total} drivers`;
    document.getElementById("previous").disabled = state.page === 0;
    document.getElementById("next").disabled = (state.page + 1) * 25 >= total;
    document
      .querySelectorAll("th")
      .forEach((th) => th.removeAttribute("aria-sort"));
    document
      .querySelector(`[data-sort="${state.sort}"]`)
      .closest("th")
      .setAttribute(
        "aria-sort",
        state.direction === "asc" ? "ascending" : "descending",
      );
  }
  function query() {
    const id = ++queryId;
    if (!worker) {
      draw(fallback());
      return;
    }
    worker.onmessage = ({ data }) => {
      if (data.id !== id) return;
      if (data.error) {
        document.getElementById("db-status").textContent =
          "SQLite unavailable; using the identical published JSON dataset locally.";
        draw(fallback());
      } else draw(data);
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
      if (version === renderVersion) {
        document.getElementById("db-status").textContent =
          "Using local JSON fallback.";
        draw(fallback());
      }
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
  document.getElementById("minimum").onchange = (e) => {
    state.minimum = Number(e.target.value);
    state.page = 0;
    query();
  };
  document.getElementById("era").onchange = (e) => {
    state.active = e.target.value === "active";
    state.page = 0;
    query();
  };
  document.querySelectorAll("[data-sort]").forEach(
    (b) =>
      (b.onclick = () => {
        state.direction =
          state.sort === b.dataset.sort && state.direction === "asc"
            ? "desc"
            : "asc";
        state.sort = b.dataset.sort;
        state.page = 0;
        query();
      }),
  );
  document.getElementById("previous").onclick = () => {
    state.page--;
    query();
  };
  document.getElementById("next").onclick = () => {
    state.page++;
    query();
  };
  document.getElementById("download").onclick = () => {
    const old = state.page;
    state.page = 0;
    const rows = [];
    do {
      rows.push(...fallback().rows);
      state.page++;
    } while (state.page * 25 < total);
    state.page = old;
    const fields = [
      "rank",
      "name",
      "skill",
      "low",
      "high",
      "races",
      "first_year",
      "last_year",
    ];
    const csv = [fields, ...rows.map((d) => fields.map((k) => d[k]))]
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
  main.innerHTML = `<h1>F1 <em>Metrix</em></h1><p class="intro">An homage to <a href="https://f1metrics.wordpress.com/">f1metrics</a> by Andrew Phillips.</p><details class="results-section" id="section-career" open><summary>All-time historical driver rankings</summary><section id="results-career" class="accordion-body"></section></details><details class="results-section" id="section-constructors"><summary>Constructor strength by season</summary><section id="results-constructors" class="accordion-body"></section></details><details class="results-section" id="section-simulations"><summary>2026 race simulations and weekend comparisons</summary><section id="results-simulations" class="accordion-body"></section></details>${[
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
  document.querySelectorAll("nav a").forEach((a) => {
    a.removeAttribute("aria-current");
    if (a.hash === (location.hash || "#/"))
      a.setAttribute("aria-current", "page");
  });
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
