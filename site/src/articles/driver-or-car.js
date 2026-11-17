import { Chart } from "chart.js";
import { createChart } from "../chart-lifecycle.js";
import { createCombobox } from "../combobox.js";
import { info } from "../hints.js";
import { titleShares, byChampion } from "./title-shares.js";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const pct = (v) => `${Math.round(v * 100)}%`;
const signed = (v) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(2)}`;
const surname = (name) => name.split(" ").at(-1);

// Blue for car-led titles through to red for driver-led ones.
const shade = (share, alpha = 1) => {
  const s = Math.min(Math.max(share ?? 0, 0), 1),
    mix = (a, b) => Math.round(a + (b - a) * s);
  return `rgba(${mix(77, 225)}, ${mix(141, 6)}, ${mix(255, 0)}, ${alpha})`;
};

export const driverOrCar = {
  id: "driver-or-car",
  title: "Driver or car? How much of each world title was down to the champion",
  date: "2026-11-17",
  summary:
    "The model scores drivers and cars separately, so every championship since 1954 can be split into the driver’s part and the car’s part. Jim Clark and Jochen Rindt won almost on their own; Jacques Villeneuve, Phil Hill and Damon Hill were carried.",
  render(target, { model, facts, charts }) {
    const titles = titleShares(model, facts),
      champions = byChampion(titles),
      find = (year) => titles.find((t) => t.year === year),
      line = (year) => {
        const t = find(year);
        return t
          ? `${pct(t.share)}; driver ${signed(t.driver)}, car ${signed(t.car)}`
          : "";
      };
    const behind = titles
      .filter((t) => t.teammate && t.teammate.gap < 0)
      .sort((a, b) => a.year - b.year);
    target.innerHTML = `<p class="lead">${esc(this.summary)}</p>
<h2>How it is measured</h2>
<p>The model gives every driver a level for each season and every team a score for its car in each season, on the same scale. For each champion we take two numbers:</p>
<ul><li><strong>Driver edge</strong>: how far the champion’s level that season was above the average driver on the grid that year.</li><li><strong>Car edge</strong>: how far their car was above the average car that year.</li></ul>
<p>Because the two are on the same scale they add up to the champion’s total advantage over the field. The <strong>driver share</strong> is the driver’s part of that advantage. If either edge was below zero it counts as zero, so a champion in a below-average car gets 100% and a champion who was below the average driver gets 0%.</p>
<div class="chart-card"><div class="controls"><div id="doc-pick"></div>${info("the chart", "Each dot is one title. Higher means the champion was further above the average driver; further right means the car was further above the average car. Above the dashed line the driver contributed more than the car. Pick a champion to highlight their titles.")}</div><p class="legend"><span class="swatch" style="background:${shade(1)}"></span>Driver-led<span class="swatch" style="background:${shade(0.5)}"></span>Even<span class="swatch" style="background:${shade(0)}"></span>Car-led<span class="swatch line"></span>Equal parts</p><div class="chart-wrap tall"><canvas id="doc-scatter" role="img" aria-label="Driver edge against car edge for every world title since 1954"></canvas></div></div>
<h2>Titles the drivers won</h2>
<p>At the top are Jim Clark’s titles. The model rates his 1963 and 1965 Lotus as slightly below the average car, so both count as 100% Clark (driver ${signed(find(1963)?.driver ?? 0)}, car ${signed(find(1963)?.car ?? 0)} in 1963; driver ${signed(find(1965)?.driver ?? 0)}, car ${signed(find(1965)?.car ?? 0)} in 1965). Few historians would call the Lotus 25 an average car; Clark won seven of the ten races in 1963. The model sees it that way partly because his teammates were far behind him, so it puts the speed on Clark rather than the car.</p>
<p>Next come Jochen Rindt in 1970 (${line(1970)}), Juan Manuel Fangio’s 1956 Ferrari title (${line(1956)}) and Jackie Stewart in 1971 (${line(1971)}). Most of the clearly driver-led titles are from the 1950s to the 1970s.</p>
<h2>Titles the cars won</h2>
<p>At the other end, Jacques Villeneuve in 1997 and Phil Hill in 1961 come out at about 0%: the model rates both close to or below that season’s average driver, while their Williams and Ferrari were the best cars. Damon Hill in 1996 (${line(1996)}), Nico Rosberg in 2016 (${line(2016)}) and Sebastian Vettel in 2011 (${line(2011)}) follow. Nigel Mansell’s 1992 Williams has the biggest car edge of any title, ${signed(find(1992)?.car ?? 0)}.</p>
<p>Kimi Antonelli’s 2026 title also lands at 0%, but treat it with care: the season was still running when the data was taken, and young drivers start low on the model’s age curve.</p>
<div class="tabs" role="tablist" aria-label="View"><button role="tab" id="doc-tab-champions" aria-controls="doc-panel-champions" aria-selected="true">Champions</button><button role="tab" id="doc-tab-titles" aria-controls="doc-panel-titles" aria-selected="false">Every title</button></div>
<div role="tabpanel" id="doc-panel-champions" aria-labelledby="doc-tab-champions"><div class="chart-card"><p class="legend">Average driver share across each champion’s titles${info("the average share", "The mean driver share of all of a champion’s titles since 1954. Fangio’s 1951 title and Farina’s 1950 title are before the model’s first season.")}</p><div class="chart-wrap" id="doc-champions-host"><canvas id="doc-champions" role="img" aria-label="Average driver share by champion"></canvas></div></div></div>
<div role="tabpanel" id="doc-panel-titles" aria-labelledby="doc-tab-titles" hidden><div class="chart-card"><p class="legend"><span class="swatch" style="background:${shade(1)}"></span>Driver edge<span class="swatch" style="background:${shade(0)}"></span>Car edge${info("the bars", "Each bar is one title, sorted by driver share. The red part is how far the champion was above the average driver, the blue part how far the car was above the average car. Parts below zero point left.")}</p><div class="chart-wrap" id="doc-titles-host"><canvas id="doc-titles" role="img" aria-label="Driver and car edge for every title"></canvas></div></div></div>
<h2>The greats</h2>
<p><strong>Michael Schumacher</strong> has the largest driver edge of any champion, ${signed(find(1994)?.driver ?? 0)} in 1994, and his Benetton titles were roughly even (${pct(find(1994)?.share ?? 0)} and ${pct(find(1995)?.share ?? 0)}). At Ferrari the car grew stronger and his share fell to around 40%, apart from 2003 at ${pct(find(2003)?.share ?? 0)}.</p>
<p><strong>Ayrton Senna</strong> has the highest average driver edge of any champion, yet his share is only ${pct(champions.find((c) => c.id === "ayrton-senna")?.share ?? 0)}, because his McLaren-Hondas are among the strongest cars the model has seen. Being great and having a great car are not mutually exclusive.</p>
<p><strong>Max Verstappen</strong> averages ${pct(champions.find((c) => c.id === "max-verstappen")?.share ?? 0)}. His 2021 and 2024 titles were driver-led (${pct(find(2021)?.share ?? 0)} and ${pct(find(2024)?.share ?? 0)}; the model rates the 2024 Red Bull only the fourth-best car), while 2022 and 2023 leaned on the car.</p>
<p><strong>Fernando Alonso</strong>’s Renault titles are often called driver titles. The model splits 2005 evenly at ${pct(find(2005)?.share ?? 0)} and calls 2006 car-led at ${pct(find(2006)?.share ?? 0)}: it rates that Renault as the best car of 2006.</p>
<p><strong>Lewis Hamilton</strong> (${pct(champions.find((c) => c.id === "lewis-hamilton")?.share ?? 0)}) and <strong>Sebastian Vettel</strong> (${pct(champions.find((c) => c.id === "sebastian-vettel")?.share ?? 0)}) are near the bottom. Vettel’s four titles all came in what the model rates as the season’s best car, and six of Hamilton’s seven in the best or second-best; a car that strong leaves little of the advantage for the driver to explain. Hamilton’s 2008 McLaren, only the fourth-best car in the model, is his most driver-led title at ${pct(find(2008)?.share ?? 0)}.</p>
<h2>A cross-check: the teammate</h2>
<p>A teammate drives the same car, so a champion rated below their teammate is a warning sign for the share. That happens in ${behind.length} titles. These compare the two drivers’ levels in the model, not that season’s head-to-head:</p>
<div class="table-wrap"><table><thead><tr><th>Season</th><th>Champion</th><th>Teammate</th><th>Gap</th></tr></thead><tbody>${behind.map((t) => `<tr><td>${t.year}</td><td>${esc(t.name)}</td><td>${esc(t.teammate.name)}</td><td class="mono">${signed(t.teammate.gap)}</td></tr>`).join("")}</tbody></table></div>
<h2>Caveats</h2>
<ul><li>The driver level is the model’s career curve: one career level adjusted for age and experience. It does not know that a driver had a particularly good or bad season, so a champion’s best year is not credited as such.</li><li>Each driver level is uncertain by about ±0.4 and each car score by about ±0.6, so shares within roughly 15 points of each other cannot be told apart.</li><li>Points systems, reliability and luck are not part of the model; only finishing order among classified finishers is.</li><li>The model starts in 1954, so Giuseppe Farina’s 1950 title and Fangio’s 1951 title are not included.</li></ul>
<p class="caption">Model ${esc(model.metadata.model)}, F1DB ${esc(model.metadata.sourceRelease)}, races up to ${esc(model.metadata.lastRaceDate)}.</p>`;

    // Scatter of every title, with a champion picker that highlights their dots.
    let picked = "";
    const scatter = document.getElementById("doc-scatter"),
      span = [
        Math.min(0, ...titles.map((t) => Math.min(t.car, t.driver))),
        Math.max(...titles.map((t) => Math.max(t.car, t.driver))),
      ],
      dim = (t) => picked && t.driverId !== picked;
    // Year labels beside the highlighted champion's dots.
    const yearLabels = {
      id: "yearLabels",
      afterDatasetsDraw(chart) {
        if (!picked) return;
        const { ctx } = chart,
          meta = chart.getDatasetMeta(1);
        ctx.save();
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillStyle = "#1f1f1f";
        meta.data.forEach((point, i) => {
          const t = titles[i];
          if (t.driverId === picked)
            ctx.fillText(String(t.year), point.x + 8, point.y + 4);
        });
        ctx.restore();
      },
    };
    charts.push(
      createChart(scatter, {
        type: "scatter",
        data: {
          datasets: [
            {
              type: "line",
              label: "Equal parts",
              data: [
                { x: span[0], y: span[0] },
                { x: span[1], y: span[1] },
              ],
              borderColor: "#9a948c",
              borderDash: [5, 5],
              borderWidth: 1.5,
              pointRadius: 0,
              pointHitRadius: 0,
            },
            {
              label: "Titles",
              data: titles.map((t) => ({ x: t.car, y: t.driver })),
              pointRadius: (c) =>
                picked && titles[c.dataIndex]?.driverId === picked ? 7 : 5,
              pointHoverRadius: 8,
              pointBackgroundColor: (c) =>
                shade(
                  titles[c.dataIndex]?.share,
                  dim(titles[c.dataIndex] ?? {}) ? 0.12 : 0.85,
                ),
              pointBorderColor: (c) =>
                dim(titles[c.dataIndex] ?? {})
                  ? "rgba(0,0,0,0)"
                  : "rgba(255,255,255,0.9)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "nearest", intersect: true },
          plugins: {
            legend: { display: false },
            tooltip: {
              filter: (item) => item.datasetIndex === 1,
              callbacks: {
                title: (items) => {
                  const t = titles[items[0]?.dataIndex];
                  return t ? `${t.year} ${t.name} · ${t.constructor}` : "";
                },
                label: (item) => {
                  const t = titles[item.dataIndex];
                  return `Driver ${signed(t.driver)}, car ${signed(t.car)} · driver share ${pct(t.share)}`;
                },
              },
            },
          },
          scales: {
            x: {
              title: { display: true, text: "Car edge" },
              grid: {
                color: (c) => (c.tick.value === 0 ? "#1f1f1f" : "#e6e6e6"),
              },
            },
            y: {
              title: { display: true, text: "Driver edge" },
              grid: {
                color: (c) => (c.tick.value === 0 ? "#1f1f1f" : "#e6e6e6"),
              },
            },
          },
        },
        plugins: [yearLabels],
      }),
    );
    const byFirstTitle = [...champions].sort(
      (a, b) => a.titles[0].year - b.titles[0].year,
    );
    createCombobox(document.getElementById("doc-pick"), {
      label: "Highlight a champion",
      options: [
        { value: "", label: "Highlight a champion: none" },
        ...byFirstTitle.map((c) => ({
          value: c.id,
          label: `${c.name} (${c.titles.map((t) => t.year).join(", ")})`,
        })),
      ],
      onChange: (id) => {
        picked = id;
        Chart.getChart(scatter)?.update();
      },
    });

    // Average share per champion.
    const championsHost = document.getElementById("doc-champions-host");
    championsHost.style.height = `${champions.length * 22 + 60}px`;
    charts.push(
      createChart(document.getElementById("doc-champions"), {
        type: "bar",
        data: {
          labels: champions.map((c) => c.name),
          datasets: [
            {
              label: "Average driver share",
              data: champions.map((c) => c.share * 100),
              backgroundColor: champions.map((c) => shade(c.share, 0.85)),
              borderRadius: 2,
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
                label: (item) => {
                  const c = champions[item.dataIndex];
                  return `${pct(c.share)} · ${c.titles.map((t) => `${t.year} ${pct(t.share)}`).join(", ")}`;
                },
              },
            },
          },
          scales: {
            x: {
              min: 0,
              max: 100,
              ticks: { callback: (v) => `${v}%` },
              grid: { color: "#e6e6e6" },
            },
            y: { grid: { display: false }, ticks: { autoSkip: false } },
          },
        },
      }),
    );

    // Every title as stacked driver and car edges.
    const sorted = [...titles].sort((a, b) => b.share - a.share),
      titlesHost = document.getElementById("doc-titles-host");
    titlesHost.style.height = `${sorted.length * 17 + 60}px`;
    charts.push(
      createChart(document.getElementById("doc-titles"), {
        type: "bar",
        data: {
          labels: sorted.map((t) => `${t.year} ${surname(t.name)}`),
          datasets: [
            {
              label: "Driver edge",
              data: sorted.map((t) => t.driver),
              backgroundColor: shade(1, 0.85),
            },
            {
              label: "Car edge",
              data: sorted.map((t) => t.car),
              backgroundColor: shade(0, 0.85),
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
                title: (items) => {
                  const t = sorted[items[0]?.dataIndex];
                  return t ? `${t.year} ${t.name} · ${t.constructor}` : "";
                },
                label: (item) => `${item.dataset.label} ${signed(item.raw)}`,
                footer: (items) => {
                  const t = sorted[items[0]?.dataIndex];
                  return t ? `Driver share ${pct(t.share)}` : "";
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                color: (c) => (c.tick.value === 0 ? "#1f1f1f" : "#e6e6e6"),
              },
            },
            y: {
              stacked: true,
              grid: { display: false },
              ticks: { autoSkip: false, font: { size: 10 } },
            },
          },
        },
      }),
    );
    target.querySelectorAll('.tabs [role="tab"]').forEach(
      (tab) =>
        (tab.onclick = () =>
          target.querySelectorAll('.tabs [role="tab"]').forEach((t) => {
            const selected = t === tab;
            t.setAttribute("aria-selected", String(selected));
            document.getElementById(t.getAttribute("aria-controls")).hidden =
              !selected;
          })),
    );
  },
};
