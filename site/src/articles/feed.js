const xml = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
const rfc822 = (date) => new Date(date + "T12:00:00Z").toUTCString();

// RSS 2.0 feed of the articles. siteUrl is the absolute origin, e.g. https://example.com.
export function feedXml(articles, siteUrl) {
  const base = siteUrl.replace(/\/+$/, ""),
    link = (a) => `${base}/#/posts/${encodeURIComponent(a.id)}`;
  const items = articles
    .map(
      (a) => `    <item>
      <title>${xml(a.title)}</title>
      <link>${xml(link(a))}</link>
      <guid isPermaLink="true">${xml(link(a))}</guid>
      <pubDate>${rfc822(a.date)}</pubDate>
      <description>${xml(a.summary)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>F1 Metrix</title>
    <link>${xml(base)}/</link>
    <atom:link href="${xml(base)}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>Articles on Formula One driver and constructor ratings from the F1 Metrix model.</description>
    <language>en</language>${articles.length ? `\n    <lastBuildDate>${rfc822(articles[0].date)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;
}
