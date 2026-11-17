/* Run with a dev/preview server listening. npx playwright install chromium first.
   BASE_URL=http://localhost:5178 node tests/browser-smoke.cjs
   PLAYWRIGHT_MODULE may point at an existing compatible installation.
*/
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  try {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const base = process.env.BASE_URL || "http://localhost:5178";
    await page.goto(base);
    await page
      .getByRole("heading", { name: "F1 Metrix", exact: true })
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
    const appearance = await page.evaluate(() => ({
      background: getComputedStyle(document.documentElement).backgroundColor,
      headingFont: getComputedStyle(document.querySelector("h1")).fontFamily,
      fontLoaded: document.fonts.check("16px Orbitron"),
      // The copyright sign is text, not an emoji.
      hasEmoji: /\p{Extended_Pictographic}/u.test(
        document.body.innerText.replace(/©/g, ""),
      ),
    }));
    assert.equal(appearance.background, "rgb(255, 255, 255)");
    assert.match(appearance.headingFont, /Orbitron/);
    assert.equal(appearance.fontLoaded, true);
    assert.equal(appearance.hasEmoji, false);
    await page
      .getByRole("link", { name: "f1metrics", exact: true })
      .first()
      .waitFor();
    // Menu links must not leave a section in the URL: a reload starts at the
    // top with only the rankings open.
    await page.locator(".menu-toggle").click();
    await page.locator('#menu a[href="#/method"]').click();
    await page.waitForFunction(
      () => document.querySelector("#section-method").open && scrollY > 0,
    );
    assert.equal(await page.evaluate(() => location.hash), "");
    await page.reload();
    await page.locator("#rows td.rank").first().waitFor();
    assert.deepEqual(
      await page.evaluate(() => [
        scrollY,
        [...document.querySelectorAll(".results-section[open]")].map(
          (e) => e.id,
        ),
      ]),
      [0, ["section-career"]],
    );
    await page.locator("#search").waitFor();
    // Next Grand Prix countdown and details dialog.
    assert.match(
      await page.locator(".countdown").innerText(),
      /^(\d+d \d{2}:\d{2}:\d{2}|LIVE)$/,
    );
    await page.locator(".next-gp").click();
    assert.match(
      await page.locator("#gp-dialog").innerText(),
      /Track length[\s\S]*Typical race lap[\s\S]*First held/,
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#gp-dialog").evaluate((d) => d.open),
      false,
    );
    // World champions filter: every row carries a trophy.
    await page.selectOption("#champions", "champions");
    await page.waitForFunction(() =>
      /of 35 drivers$/.test(document.querySelector("#count")?.textContent),
    );
    assert.equal(
      await page.locator("#rows tr").count(),
      await page.locator("#rows tr .trophy").count(),
    );
    await page.selectOption("#champions", "all");
    await page.locator("#search").fill("alonso");
    await page.waitForFunction(
      () =>
        document.querySelector("#count")?.textContent ===
        "Showing 1–1 of 1 drivers",
    );
    assert.match(await page.locator("#rows").textContent(), /Fernando Alonso/);
    assert.equal(await page.locator("#page-select option").count(), 1);
    await page.locator("#search").fill("no_such_driver");
    await page.getByText("No matching drivers.").waitFor();
    await page.locator("#search").fill("");
    await page.waitForFunction(
      () => document.querySelectorAll("#rows tr").length === 25,
    );
    assert.match(await page.locator("#rows tr").first().textContent(), /^1\./);
    await page.locator('#pages [data-page="1"]').click();
    await page.waitForFunction(
      () => document.querySelector("#rows tr td")?.textContent === "26.",
    );
    assert.equal(await page.locator("#rows tr").count(), 25);
    await page.locator('[data-sort="name"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector("#rankings [aria-sort]")?.textContent ===
        "Driver",
    );
    const names = await page.locator("#rows td.name").allTextContents();
    // SQLite orders by code point, as does Array#sort without a comparator.
    assert.deepEqual(names, [...names].sort());
    await page.locator('[data-sort="rank"]').click();
    await page.selectOption("#minimum", "200");
    await page.selectOption("#era", "active");
    await page.waitForFunction(
      () =>
        /^Showing \d+–\d+ of \d+ drivers$/.test(
          document.querySelector("#count")?.textContent,
        ) && document.querySelectorAll("#rows tr").length < 25,
    );
    for (const races of await page
      .locator("#rows td:nth-child(5)")
      .allTextContents())
      assert(Number(races) >= 200);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("#download").click(),
    ]);
    assert.equal(download.suggestedFilename(), "f1metrix-filtered-drivers.csv");
    await page.selectOption("#minimum", "0");
    await page.selectOption("#era", "all");
    await page.waitForFunction(
      () => document.querySelectorAll("#rows tr").length === 25,
    );
    await page.locator("#tab-plot").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#drivers-chart")?.getAttribute("aria-busy") ===
        "false",
    );
    assert(await page.locator("#panel-table").isHidden());
    // Hover animates colours; a broken animation config used to throw here
    // ("this._fn is not a function") and blank every chart.
    const plot = await page.locator("#drivers-chart").boundingBox();
    for (let y = plot.y + 20; y < plot.y + 300; y += 12)
      await page.mouse.move(plot.x + plot.width * 0.6, y);
    await page.waitForTimeout(500);
    assert.deepEqual(errors, []);
    await page.locator("#tab-trend").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#trend-chart")?.getAttribute("aria-busy") ===
        "false",
    );
    assert.match(
      await page.locator("#trend-summary").innerText(),
      /Trend: scores (rise|fall) by \d+\.\d+ per decade/,
    );
    await page.locator("#tab-table").click();
    await page.locator("#rankings .info").first().click();
    assert.match(
      await page.locator("#hint-box").innerText(),
      /career strength/,
    );
    await page.keyboard.press("Escape");
    assert(await page.locator("#hint-box").isHidden());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(
      () => document.documentElement.scrollWidth <= innerWidth,
      { timeout: 3000 },
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Mobile page overflows viewport",
    );
    await page.screenshot({ path: "/tmp/f1metrix-mobile.png", fullPage: true });
    // Test article rendering with a clearly synthetic, intercepted fixture, never published data.
    await page.route("**/data/publication.json", async (route) => {
      const response = await route.fetch();
      const data = await response.json();
      data.articles = [
        {
          id: "test",
          date: "2026-01-01",
          title: "Synthetic test article",
          summary: "Only a browser test fixture.",
          status: "test fixture",
          sections: [
            {
              heading: "Test evidence",
              text: "Context matters.",
              sources: ["f1db"],
            },
          ],
          drivers: [
            {
              driverId: "a",
              assessment: "Insufficient evidence.",
              sources: ["f1db"],
            },
          ],
          evaluations: [
            {
              driverId: "a",
              name: "Test Driver",
              position: 1,
              expectedPosition: 1.5,
              low: 1,
              high: 2,
            },
          ],
          evidence: { limitations: ["Synthetic fixture only."] },
          generation: { model: "test", promptVersion: "test" },
          sources: [{ id: "f1db", url: "https://github.com/f1db/f1db" }],
        },
      ];
      await route.fulfill({ json: data });
    });
    await page.goto(base + "/#/article/test");
    await page.reload();
    await page
      .getByRole("heading", { name: "Synthetic test article" })
      .waitFor();
    await page.getByRole("heading", { name: "Test Driver" }).waitFor();
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Article overflows mobile viewport",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Browser smoke passed: SQLite/WASM, search, empty state, numbered pagination, sort, filters, CSV, plot tab, mobile layout, article chart.",
    );
  } catch (error) {
    console.error(
      "Browser state:",
      await page.evaluate(() => ({
        url: location.href,
        search: document.querySelector("#search")?.value,
        count: document.querySelector("#count")?.textContent,
        rows: document.querySelector("#rows")?.textContent,
      })),
    );
    await page.screenshot({
      path: "/tmp/f1metrix-browser-failure.png",
      fullPage: true,
    });
    throw error;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
