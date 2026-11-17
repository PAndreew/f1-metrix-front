const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
// A race counts as "next" until two hours after its start, shown as live.
const RACE_WINDOW = 2 * 60 * 60 * 1000;
const lap = (ms) => {
  const minutes = Math.floor(ms / 60000),
    seconds = (ms % 60000) / 1000;
  return `${minutes}:${seconds.toFixed(3).padStart(6, "0")}`;
};
const pad = (n) => String(n).padStart(2, "0");
function countdown(ms) {
  const s = Math.floor(ms / 1000),
    days = Math.floor(s / 86400);
  return `${days}d ${pad(Math.floor(s / 3600) % 24)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
}
export function nextRace(races, now = Date.now()) {
  return races.find((r) => r.start && Date.parse(r.start) + RACE_WINDOW > now);
}
function details(race) {
  const start = new Date(race.start);
  const local = start.toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const first =
    race.firstRaceHere == null
      ? `${race.grandPrixFirstHeld ?? "This season"} · first race at this circuit`
      : race.grandPrixFirstHeld != null &&
          race.grandPrixFirstHeld < race.firstRaceHere
        ? `${race.grandPrixFirstHeld} · at this circuit since ${race.firstRaceHere}`
        : String(race.firstRaceHere);
  const rows = [
    ["Country", esc(race.country)],
    [
      "Track length",
      `${race.lengthKm.toFixed(3)} km<span class="sub">${race.turns ? `${race.turns} turns · ` : ""}${race.laps} laps</span>`,
    ],
    [
      "Typical race lap",
      race.typicalLap
        ? `${lap(race.typicalLap.ms)}<span class="sub">winner’s average lap, ${race.typicalLap.year}</span>`
        : "No earlier race on this layout",
    ],
    [
      "Fastest race lap",
      race.fastestLap
        ? `${lap(race.fastestLap.ms)}<span class="sub">${esc(race.fastestLap.driver)}, ${race.fastestLap.year}</span>`
        : "No earlier race on this layout",
    ],
    ["First held", first],
  ];
  return `<header><p class="gp-round">Round ${race.round}</p><h2>${esc(race.name)}</h2><p class="gp-place">${esc(race.circuit)} · ${esc(race.place)}</p></header><p class="gp-start">Lights out <strong>${esc(local)}</strong> your time · <span class="mono" data-countdown></span></p><dl>${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}
export function initNextGrandPrix(facts) {
  const button = document.querySelector(".next-gp"),
    label = button?.querySelector(".countdown"),
    dialog = document.getElementById("gp-dialog");
  if (!button || !dialog || !facts?.races?.length) return;
  const body = dialog.querySelector(".gp-body");
  let race = null;
  const tick = () => {
    const now = Date.now(),
      upcoming = nextRace(facts.races, now);
    if (!upcoming) {
      button.hidden = true;
      return;
    }
    if (upcoming !== race) {
      race = upcoming;
      body.innerHTML = details(race);
      button.setAttribute(
        "aria-label",
        `Next Grand Prix: ${race.name}. Show details`,
      );
    }
    const left = Date.parse(race.start) - now,
      text = left > 0 ? countdown(left) : "LIVE";
    label.textContent = text;
    dialog.querySelector("[data-countdown]").textContent =
      left > 0 ? `in ${text}` : "racing now";
    button.hidden = false;
  };
  tick();
  setInterval(tick, 1000);
  button.addEventListener("click", () => dialog.showModal());
  dialog
    .querySelector(".gp-close")
    .addEventListener("click", () => dialog.close());
  // Clicking the backdrop (outside the panel) closes the dialog.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
