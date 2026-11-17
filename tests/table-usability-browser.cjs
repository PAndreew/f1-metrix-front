const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  });
  const base = process.env.BASE_URL || "http://localhost:5178";
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.waitForSelector("#pages button");
    const total = Number(
      (await page.locator("#count").innerText()).match(/of (\d+)/)[1],
    );
    assert.equal(
      await page.locator("#pages button").count(),
      Math.ceil(total / 25),
    );
    await page.click('#pages [data-page="1"]');
    await page.waitForFunction(
      () => document.querySelector("#rows tr td")?.textContent === "26.",
    );
    assert.equal(await page.locator("#rows tr").count(), 25);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#download"),
    ]);
    const stream = await download.createReadStream();
    let csv = "";
    for await (const chunk of stream) csv += chunk;
    assert.equal(
      csv.trim().split("\n").length,
      total + 1,
      "CSV must include all filtered drivers, not only current page",
    );
    await page.click(`#pages [data-page="${Math.ceil(total / 25) - 1}"]`);
    await page.waitForFunction(
      (total) =>
        document
          .querySelector("#count")
          ?.textContent.endsWith(`–${total} of ${total} drivers`),
      total,
    );
    assert.equal(await page.locator("#rows tr").count(), total % 25 || 25);
    await page.fill("#search", "alonso");
    await page.waitForFunction(
      () =>
        document.querySelector("#count")?.textContent ===
        "Showing 1–1 of 1 drivers",
    );
    assert.equal(await page.locator("#pages button").count(), 1);
    await page.fill("#search", "");
    await page.waitForFunction(
      () => document.querySelector("#rows tr td")?.textContent === "1.",
    );
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 850 });
      await page.waitForTimeout(100);
      assert(
        await page
          .locator("#search")
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize) >= 16),
      );
      const heights = await page
        .locator("#results-career .controls")
        .first()
        .locator("input,select,#download")
        .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
      assert(
        heights.every((h) => h === heights[0]),
        `control heights differ: ${heights}`,
      );
    }
    async function assertFrozen(table, indices) {
      await table.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
      const wrap = table.locator("..");
      await wrap.evaluate((e) => (e.scrollLeft = 0));
      const cells = table.locator("tbody tr").first().locator("td");
      const before = [];
      for (const i of indices)
        before.push(
          await cells.nth(i).evaluate((e) => e.getBoundingClientRect().left),
        );
      await wrap.evaluate((e) => (e.scrollLeft = e.scrollWidth));
      await page.waitForTimeout(80);
      for (let j = 0; j < indices.length; j++) {
        const position = await cells
          .nth(indices[j])
          .evaluate((e) => ({
            x: e.getBoundingClientRect().left,
            mode: getComputedStyle(e).position,
          }));
        assert.equal(position.mode, "sticky");
        const expected = await cells
          .nth(indices[j])
          .evaluate(
            (e) =>
              e.closest(".table-wrap").getBoundingClientRect().left +
              parseFloat(
                getComputedStyle(e.closest(".table-wrap")).borderLeftWidth,
              ) +
              parseFloat(getComputedStyle(e).left),
          );
        assert(
          Math.abs(position.x - expected) < 2,
          `frozen column is not pinned: ${position.x} vs ${expected}`,
        );
      }
    }
    await assertFrozen(page.locator("#rankings"), [0, 1]);
    await page.click("#section-simulations > summary");
    await assertFrozen(
      page.locator(".race-panel:visible table").first(),
      [0, 1],
    );
    await page.click("#section-qualifying > summary");
    await assertFrozen(page.locator("#qualifying-rounds table"), [0, 1]);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(errors, []);
    const fallback = await browser.newPage();
    await fallback.route("**/sql-wasm.wasm", (route) => route.abort());
    await fallback.goto(base);
    await fallback.waitForSelector("#pages button");
    await fallback.click('#pages [data-page="1"]');
    await fallback.waitForFunction(
      () => document.querySelector("#rows tr td")?.textContent === "26.",
    );
    assert.equal(await fallback.locator("#rows tr").count(), 25);
    await fallback.close();
    console.log(
      "16px search, equal control heights, all page buttons, complete CSV, frozen identities and fallback pagination pass",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
