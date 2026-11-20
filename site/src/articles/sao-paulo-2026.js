import { createChart } from "../chart-lifecycle.js";
import { catalog } from "./catalog.js";
import { lapNotes } from "./sao-paulo-2026-laps.js";
import timing from "./sao-paulo-2026-timing.json";

const raceDate = "2026-11-08";
const signed = (n) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}`;
const lapTime = (seconds) =>
  seconds == null ? "—" : `${Math.floor(seconds / 60)}:${(seconds % 60).toFixed(3).padStart(6, "0")}`;

export const saoPaulo2026 = {
  ...catalog.find((a) => a.id === "sao-paulo-2026"),
  render(target, { simulations, charts }) {
    const sequential = simulations?.kind === "sequential-preview-eligible-finisher"
      ? simulations.races.find((r) => r.date === raceDate)
      : null;
    const modelRows = sequential?.drivers.slice(0, 10).map((d) =>
      `<tr><td>${d.officialPosition}</td><td>${d.name}</td><td class="mono">${d.expectedEligibleRank.toFixed(2)}</td><td>${d.predictive80.join("–")}</td><td class="mono">${signed(d.positionsAboveExpectation)}</td></tr>`,
    );
    const colors = ["#c45300", "#2455a4", "#78589c"];
    target.innerHTML = `<p class="lead">${this.summary}</p>
<h2>Seven seconds down, fourteen seconds clear</h2>
<p>Lando Norris started from pole at Interlagos on 8 November, but was third by the time he came out of the Senna S. Kimi Antonelli had beaten him off the line and Liam Lawson went around the outside at Turn 1 to take second. By the time Lewis Hamilton pitted for slicks on lap 14, Norris was back in second but still about seven seconds behind Antonelli.</p>
<p>Norris switched from intermediates to softs at the end of lap 16. Antonelli stopped a lap later and held the lead, but Norris was within a second at the end of lap 18. When Antonelli spun at Turn 1 on lap 20, Norris took over. The stop brought him close enough to take advantage; it did not put him ahead on its own.</p>
<p>Max Verstappen had started 21st and was already eighth by lap 5. On lap 38 he passed Isack Hadjar for second, leaving both Red Bulls to chase Norris. Their second slick stops were five laps apart: Verstappen on lap 45, Hadjar on lap 50. Norris stopped between them on lap 49 and was back in front after Antonelli stopped on lap 53. He won by <strong>14.602 seconds</strong>, with Hadjar third. George Russell and Antonelli finished fourth and fifth, enough for Mercedes to seal the constructors’ championship.</p>
<h2>What the timing shows</h2>
<div class="chart-card"><p class="legend">${timing.columns.slice(1).map((label, i) => `<span class="swatch line" style="background:${colors[i]}"></span>${label}`).join("")}</p><div class="chart-wrap"><canvas id="sp26-pace" role="img" aria-label="Lap times for Norris, Verstappen and Hadjar. The full timing table follows below."></canvas></div></div>
<p class="caption">OpenF1 race timing. Lower is faster. Pit laps are included and missing lap times are left blank.</p>
<p>Antonelli set the official fastest lap, <strong>1:12.689</strong> on lap 55, but the rain made slicks the wrong tyre within a few laps. Norris went from <strong>1:16.066 on lap 61 to 1:27.224 on lap 62</strong>, before switching back to intermediates. In OpenF1’s sampled car-speed feed, his median speed fell from <strong>199 to 172 km/h</strong> across those two laps (281 and 333 samples, split at his recorded lap-start timestamps). The highest sample was 328 km/h on both laps: the biggest change shows up in how much of the lap he could spend at speed, not in the top reading. Lap 62 was also his pit in-lap, so the speed change is not a clean measure of grip loss.</p>
<p>Russell and Fernando Alonso were a lap ahead of the podium finishers in making the switch back to intermediates. Russell had lost time with a spin at his first pit exit; this time he gained on Antonelli and Mercedes swapped their cars back. At Ferrari, Charles Leclerc crossed the line seventh, but a five-second penalty for contact with Lawson reversed their order.</p>
<h2>What the model expected</h2>
<p>The sequential research preview uses race orders through Mexico City on 1 November, before São Paulo. It simulates finishing order among the <strong>20 drivers who actually finished and were eligible</strong>; Lance Stroll retired and Valtteri Bottas did not start. It does not account for the grid, weather, stops or retirements, so it is not a full-grid race forecast. The 80% range spans the 10th to 90th percentiles of simulated finishes; it is not a guarantee about real-world results.</p>
${modelRows ? `<div class="table-wrap"><table><caption class="caption">Official top ten versus simulated eligible-finisher ranks</caption><thead><tr><th scope="col">Finish</th><th scope="col">Driver</th><th scope="col">Sequential mean</th><th scope="col">80% range</th><th scope="col">Places gained vs mean</th></tr></thead><tbody>${modelRows.join("")}</tbody></table></div>` : ""}
<p>Norris was the biggest positive surprise in the sequential model: first against a mean rank of <strong>6.33</strong>, with a win in <strong>7.65%</strong> of the 40,000 simulations. Hadjar gained <strong>4.26</strong> places against his mean. Verstappen gained just <strong>2.07</strong> by the same measure, despite making up 19 places from the grid. The difference matters: the model already rated him highly and never knew he was starting 21st. The same distinction works in reverse for Hamilton, who gained 11 grid places but finished roughly four places below his model mean.</p>
<h2>Lap by lap</h2>
<p>Lap numbers refer to each driver’s own lap for pit stops and to the race lap for on-track events.</p>
<details><summary>Read all 71 laps and compare the podium’s times</summary><div class="table-wrap"><table><caption class="caption">Race notes and recorded lap times</caption><thead><tr><th scope="col">Lap</th><th scope="col">Race notes</th><th scope="col">NOR</th><th scope="col">VER</th><th scope="col">HAD</th></tr></thead><tbody>${timing.lapSeconds.map(([lap, ...times]) => `<tr><th scope="row">${lap}</th><td>${lapNotes[lap - 1]}</td>${times.map((s) => `<td class="mono">${lapTime(s)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>
<h2>Sources</h2>
<p class="caption">Formula 1: <a href="https://www.formula1.com/en/results/2026/races/1299/brazil/race-result">classification</a>, <a href="https://www.formula1.com/en/results/2026/races/1299/brazil/starting-grid">grid</a>, <a href="https://www.formula1.com/en/results/2026/races/1299/brazil/fastest-laps">fastest laps</a>, <a href="https://www.formula1.com/en/latest/article/norris-beats-verstappen-in-wet-sao-paulo-gp-thriller-as-mercedes-win-constructors-championship.7JN7MXLZf5lk5l0C3gfKGI">race report</a> and <a href="https://www.formula1.com/en/latest/article/live-coverage-formula-1-msc-cruises-grande-premio-de-sao-paulo-2026.1yG2rNPUND8MpWa1F0mFES">live coverage</a>. OpenF1 session 11412: <a href="https://api.openf1.org/v1/laps?session_key=11412">laps</a>, <a href="https://api.openf1.org/v1/pit?session_key=11412">pit stops</a>, <a href="https://api.openf1.org/v1/stints?session_key=11412">tyre stints</a>, <a href="https://api.openf1.org/v1/race_control?session_key=11412">race control</a> and <a href="https://api.openf1.org/v1/car_data?session_key=11412&amp;driver_number=1&amp;date%3E2026-11-08T18%3A22%3A55.337&amp;date%3C2026-11-08T18%3A25%3A38.610">Norris’s car data on laps 61–62</a>. Model: <a href="#/simulations">F1 Metrix race simulations</a> (F1DB v2026.20.0).</p>`;
    charts.push(createChart(target.querySelector("#sp26-pace"), {
      type: "line",
      data: {
        labels: timing.lapSeconds.map(([lap]) => lap),
        datasets: timing.columns.slice(1).map((label, i) => ({
          label,
          data: timing.lapSeconds.map((row) => row[i + 1]),
          borderColor: colors[i],
          borderWidth: 2,
          pointRadius: 0,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { title: ([item]) => `Lap ${item.label}`, label: (item) => `${item.dataset.label}: ${lapTime(item.raw)}` } },
        },
        scales: {
          x: { title: { display: true, text: "Lap" }, ticks: { maxTicksLimit: 12 } },
          y: { title: { display: true, text: "Lap time (seconds)" } },
        },
      },
    }));
  },
};
