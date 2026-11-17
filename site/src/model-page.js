const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// Inline and display maths are written as TeX and typeset by KaTeX after load.
const tex = (s) => `<span class="tex" data-tex="${esc(s)}"></span>`;
const block = (s) =>
  `<div class="tex-block" data-tex="${esc(s)}" data-display></div>`;
const fixed = (v, digits) => (Number.isFinite(v) ? v.toFixed(digits) : "–");

const layman = [
  "A Formula One result mixes two things: how good the driver is and how good their car is.",
  "The model tries to pull these apart, using every classified finish since 1954.",
  "Each driver gets one strength number for their whole career, and each team gets a separate number for its car in every season.",
  "In a race, a driver’s pace is their own strength plus their car’s strength that year.",
  "The finishing order is treated like a weighted draw: the strongest entry is most likely to finish first, the strongest of the rest is most likely to be second, and so on down the order.",
  "Teammates share a car, so beating a teammate tells the model about the drivers; drivers also move between teams, so their results in different cars tell it about the cars.",
  "These moves link the grid together across the decades, so drivers who never raced each other can still be compared through chains of shared teammates.",
  "Drivers usually improve while young, gain from recent racing and fade later on, so the model learns one typical age curve and experience effect from all drivers at once.",
  "Retirements and breakdowns are left out, because they say more about reliability and luck than about pace.",
  "The answer is not one number but a range of plausible values for every driver and team, and drivers with few races get wide ranges.",
  "A score difference of 1 means the stronger driver would finish ahead about 73% of the time in equal cars.",
];

export function modelPage(target, metadata) {
  const d = metadata.diagnostics ?? {},
    interval = metadata.intervalPercent ?? 95;
  target.innerHTML = `<div class="page-head"><h1>The model</h1><span class="pill">LLM generated</span></div><div class="prose model-page"><p class="lead">${layman.join(" ")}</p>
<h2>Mathematical description</h2>
<h3>Data</h3>
<p>Each race ${tex("r")} contributes the completion order of its ${tex("n_r")} eligible classified finishers, ${tex(String.raw`\pi_r = (\pi_r(1), \dots, \pi_r(n_r))`)}, where ${tex(String.raw`\pi_r(k)`)} is the driver classified ${tex("k")}-th. Non-finishers are dropped, so the likelihood is conditional on finishing. The fit uses ${esc(metadata.raceCount)} races and ${esc(metadata.observations)} observations from 1954 to ${esc(metadata.lastRaceDate)} (F1DB ${esc(metadata.sourceRelease)}).</p>
<h3>Strength</h3>
<p>Driver ${tex("i")} racing for constructor ${tex("k")} in season ${tex("t")} has a log-strength</p>
${block(String.raw`\lambda_{itk} = \theta_i + f(a_{it}) + g(e_{it}) + c_{kt}`)}
<p>where ${tex(String.raw`\theta_i`)} is the driver’s career level (the published score), ${tex(String.raw`f`)} is a spline in age ${tex(String.raw`a_{it}`)} shared by all drivers, ${tex("g")} is a shared adjustment for recent experience ${tex(String.raw`e_{it}`)}, and ${tex(String.raw`c_{kt}`)} is the constructor-season effect. The career curve on the rankings page plots ${tex(String.raw`\theta_i + f(a_{it}) + g(e_{it})`)} season by season.</p>
<h3>Likelihood</h3>
<p>Finishing orders follow a Plackett–Luce model: positions are filled from the front, each time choosing among the drivers not yet placed with probability proportional to ${tex(String.raw`e^{\lambda}`)}:</p>
${block(String.raw`P(\pi_r \mid \lambda) = \prod_{k=1}^{n_r} \frac{\exp\big(\lambda_{\pi_r(k)}\big)}{\sum_{m=k}^{n_r} \exp\big(\lambda_{\pi_r(m)}\big)}`)}
<p>All races enter one joint likelihood, ${tex(String.raw`\prod_r P(\pi_r \mid \lambda)`)}.</p>
<h3>Partial pooling</h3>
<p>Driver and constructor-season effects are drawn from shared distributions whose spreads are estimated from the data:</p>
${block(String.raw`\theta_i \sim \mathcal{N}(0, \sigma_\theta^2), \qquad c_{kt} \sim \mathcal{N}(0, \sigma_c^2)`)}
<p>Drivers with few races are pulled towards the average, so a short lucky career cannot top the table. Constructor-season effects are independent from one season to the next; a model where car strength evolves smoothly over time was tested but not adopted.</p>
<h3>Identification</h3>
<p>Plackett–Luce probabilities only depend on differences in ${tex(String.raw`\lambda`)} within a race, so adding a constant to everyone changes nothing. Constructor effects are therefore centred within each season, ${tex(String.raw`\sum_k c_{kt} = 0`)}, which is why team scores cannot be compared across seasons. Driver levels are anchored by their zero-mean prior, so ${tex(String.raw`\theta = 0`)} is roughly an average driver.</p>
<h3>Reading the scores</h3>
<p>For two drivers in the same car, the probability that ${tex("i")} finishes ahead of ${tex("j")} is a logistic function of the score difference:</p>
${block(String.raw`P(i \succ j) = \frac{e^{\lambda_i}}{e^{\lambda_i} + e^{\lambda_j}} = \frac{1}{1 + e^{-(\lambda_i - \lambda_j)}}`)}
<p>A gap of 1 gives 73%, 2 gives 88% and 3 gives 95%. The scale is log-strength, not standard deviations.</p>
<h3>Inference</h3>
<p>The posterior is sampled with Hamiltonian Monte Carlo (NUTS). Published values are posterior medians with central ${interval}% intervals, and drivers are ranked by median. The final fit had a maximum ${tex(String.raw`\hat R`)} of ${fixed(d.maxRhat, 4)}, a minimum bulk effective sample size of ${fixed(d.minEssBulk, 0)}, a minimum BFMI of ${fixed(d.minBfmi, 2)} and ${esc(d.divergences ?? "–")} divergent transitions.</p>
<h3>Not covered here</h3>
<ul><li>Exact prior scales, spline knots and the definition of recent experience live in the fitting code, which is not part of this repository.</li><li>Reliability (who retires) is modelled separately and not shown.</li><li>Customer-car arrangements are not adjusted for.</li><li>Seasons 1950–1953 are excluded because the drivers’ earlier careers are missing.</li></ul>
<h3>References</h3>
<p><a href="https://doi.org/10.1515/jqas-2015-0050">Bell, Smith, Sabel and Jones (2016)</a>, Formula for success: multilevel modelling of Formula One driver and constructor performance, 1950–2014. <a href="https://doi.org/10.1515/jqas-2013-0031">Phillips (2014)</a>, Uncovering Formula One driver performances from 1950 to 2013 by adjusting for team and competition effects.</p></div>`;
  typeset(target);
}

async function typeset(target) {
  const [{ default: katex }] = await Promise.all([
    import("katex"),
    import("katex/dist/katex.min.css"),
  ]);
  target.querySelectorAll("[data-tex]").forEach((el) =>
    katex.render(el.dataset.tex, el, {
      displayMode: el.hasAttribute("data-display"),
      throwOnError: false,
    }),
  );
}
