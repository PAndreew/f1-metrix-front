import test from "node:test";
import assert from "node:assert/strict";
import { feedXml } from "../site/src/articles/feed.js";
import { catalog } from "../site/src/articles/catalog.js";

test("feed lists every article with absolute links and escaped text", () => {
  const xml = feedXml(
    [
      {
        id: "a-b",
        title: "Cars & drivers <1>",
        date: "2026-11-17",
        summary: 'It\'s "fine"',
      },
    ],
    "https://example.com/",
  );
  assert.match(xml, /^<\?xml version="1.0"/);
  assert.match(xml, /<link>https:\/\/example\.com\/#\/posts\/a-b<\/link>/);
  assert.match(xml, /<title>Cars &amp; drivers &lt;1&gt;<\/title>/);
  assert.match(xml, /<description>It&apos;s &quot;fine&quot;<\/description>/);
  assert.match(xml, /<pubDate>Tue, 17 Nov 2026 12:00:00 GMT<\/pubDate>/);
  assert.match(xml, /href="https:\/\/example\.com\/feed\.xml" rel="self"/);
});

test("catalog entries are complete and newest first", () => {
  assert.ok(catalog.length > 0);
  for (const a of catalog) {
    assert.match(a.id, /^[a-z0-9-]+$/);
    assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(a.title && a.summary);
  }
  const dates = catalog.map((a) => a.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});
