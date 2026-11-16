const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE || "/usr/bin/chromium-browser",
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      (process.env.BASE_URL || "http://localhost:5178") + "/#/results",
    );
    await page.waitForSelector(".race-accordion", { state: "attached" });
    assert.equal(await page.locator(".results-section").count(), 5);
    assert.equal(
      await page.locator("#section-simulations").evaluate((e) => e.open),
      false,
    );
    await page.click("#section-simulations > summary");
    assert.equal(await page.locator(".race-accordion").count(), 20);
    assert.match(
      await page.locator("main").innerText(),
      /Not a pre-race forecast/,
    );
    for (let i = 0; i < 20; i++) {
      const panel = page.locator(".race-accordion").nth(i);
      await page.selectOption("#simulation-race", String(i));
      assert.equal(await page.locator(".race-accordion:visible").count(), 1);
      assert(await panel.isVisible());
      const select = panel.locator("select");
      const count = await select.locator("option").count();
      assert(count >= 2);
      await select.selectOption(String(count - 1));
      assert.equal(
        await panel.locator("table").first().locator("tbody tr").count(),
        count,
      );
    }
    assert.equal(await page.locator(".race-accordion[open]").count(), 1);
    assert.equal(await page.locator("#simulation-race option").count(), 20);
    assert.equal(
      await page.locator("main > .intro").innerText(),
      "An homage to f1metrics by Andrew Phillips.",
    );
    await page.waitForSelector("#rankings tbody tr");
    await page.evaluate(() => document.fonts.ready);
    assert.match(
      await page
        .locator(".brand")
        .evaluate((e) => getComputedStyle(e).fontFamily),
      /Orbitron/,
    );
    assert(
      await page.evaluate(() => document.fonts.check("400 16px Orbitron")),
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile overflow",
    );
    const last = page.locator(".race-accordion").last();
    const cells = await last
      .locator("table")
      .first()
      .locator("tbody tr")
      .first()
      .locator("td")
      .allTextContents();
    assert.equal(cells[1], "1");
    assert.equal(cells[3], "6.09");
    assert.equal(await page.locator("#section-performance").count(), 0);
    assert(await page.locator("#section-career").evaluate((e) => e.open));
    for (const panel of await page.locator(".race-accordion").all()) {
      const order = await panel
        .locator("table")
        .first()
        .locator("tbody tr td:nth-child(3)")
        .allTextContents();
      assert.deepEqual(
        order.map(Number).sort((a, b) => a - b),
        Array.from({ length: order.length }, (_, i) => i + 1),
      );
    }
    assert.match(await last.innerText(), /Qualifying — this same weekend/);
    assert.equal(await last.locator("canvas[data-comparison]").count(), 1);
    for (const route of [
      "",
      "qualifying",
      "rankings",
      "simulator",
      "performance",
    ]) {
      await page.goto(
        (process.env.BASE_URL || "http://localhost:5178") + "/#/" + route,
      );
      await page.waitForSelector(".race-accordion", { state: "attached" });
      assert.equal(await page.locator(".race-accordion").count(), 20);
      assert.equal(await page.locator("#section-career").count(), 1);
      assert.equal(await page.locator("#section-qualifying").count(), 1);
      assert.match(await page.locator("h1").innerText(), /F1.*Metrix/);
    }
    assert.deepEqual(errors, []);
    console.log(
      "Unified results, 20 independent accordions, Orbitron, charts, mobile and runtime checks passed",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
