const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    headless: true,
  });
  try {
    const p = await b.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto((process.env.BASE_URL || "http://localhost:5178") + "/#/");
    await p.waitForSelector("#drivers-chart", { state: "attached" });
    const inspect = () =>
      p.evaluate(async () => {
        return [...document.querySelectorAll("canvas")].map((el) => {
          const hidden =
            !!el.closest("[hidden]") ||
            [
              ...(function* (e) {
                for (; e; e = e.parentElement) yield e;
              })(el),
            ].some((e) => e.tagName === "DETAILS" && !e.open);
          return {
            id: el.id,
            hidden,
            created: el.getAttribute("aria-busy") === "false",
            width: el.width / window.devicePixelRatio,
            height: el.height / window.devicePixelRatio,
            parentWidth: el.parentElement.clientWidth,
            painted:
              !hidden &&
              el.width > 0 &&
              el.height > 0 &&
              el.getAttribute("aria-busy") === "false" &&
              el
                .getContext("2d")
                .getImageData(0, 0, el.width, el.height)
                .data.some((value, i) => i % 4 === 3 && value > 0),
          };
        });
      });
    await p.waitForTimeout(200);
    let state = await inspect();
    assert.equal(
      state.find((c) => c.id === "teams-chart").created,
      false,
      "constructor chart must not initialise hidden",
    );
    assert.equal(
      state.find((c) => c.id === "qualifying-chart").created,
      false,
      "qualifying chart must not initialise hidden",
    );
    assert.equal(await p.locator("#section-career #teams-chart").count(), 0);
    assert.equal(
      state.find((c) => c.id === "drivers-chart").created,
      false,
      "driver plot must not initialise in its hidden tab",
    );
    for (const width of [1280, 375, 768]) {
      await p.setViewportSize({ width, height: 900 });
      for (const id of [
        "section-constructors",
        "section-simulations",
        "section-qualifying",
      ])
        await p.locator("#" + id).evaluate((e) => (e.open = true));
      await p.waitForTimeout(300);
      for (const y of ["2026", "1990", "2022"]) {
        await p.selectOption("#constructor-year", y);
        await p.waitForTimeout(80);
        assert.match(
          await p.locator("#constructor-chart-host h3").innerText(),
          new RegExp(y),
        );
      }
      for (const race of ["0", "19", "2"])
        await p.selectOption("#simulation-race", race);
      await p.waitForTimeout(200);
      state = await inspect();
      for (const c of state.filter((c) => !c.hidden)) {
        assert(c.created, `${c.id} missing`);
        assert(c.width > 0 && c.height > 0);
        assert(Math.abs(c.width - c.parentWidth) <= 2, `${c.id} stale width`);
        assert(c.painted, `${c.id} blank canvas`);
      }
      for (const id of [
        "section-constructors",
        "section-simulations",
        "section-qualifying",
      ])
        await p.locator("#" + id).evaluate((e) => (e.open = false));
    }
    assert.deepEqual(errors, []);
    console.log(
      "Hidden-chart initialisation, expand/collapse, three viewports, constructor years and race switching pass",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
