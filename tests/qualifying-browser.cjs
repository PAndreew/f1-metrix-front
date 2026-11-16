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
      (process.env.BASE_URL || "http://localhost:5178") + "/#/qualifying",
    );
    await page.waitForSelector("#qualifying-pair");
    assert.match(
      await page.locator("#results-qualifying h2").first().innerText(),
      /Qualifying/,
    );
    const count = await page.locator("#qualifying-pair option").count();
    assert.equal(count, 15);
    for (let i = 0; i < count; i++) {
      await page.selectOption("#qualifying-pair", String(i));
      assert((await page.locator("#qualifying-rounds tbody tr").count()) > 0);
    }
    assert.match(
      await page.locator("main").innerText(),
      /not a global ranking/,
    );
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "mobile overflow",
    );
    await page.goto(
      (process.env.BASE_URL || "http://localhost:5178") + "/#/performance",
    );
    await page.waitForSelector('#section-qualifying');
    assert.equal(await page.locator('#section-performance').count(), 0);
    await page.click('#section-qualifying > summary');
    await page.waitForSelector("#qualifying-chart");
    assert.deepEqual(errors, []);
    console.log(
      "15 pair charts, tables, mobile, navigation and error checks passed",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
