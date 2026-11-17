import { defineConfig } from "vite";
import { catalog } from "./src/articles/catalog.js";
import { feedXml } from "./src/articles/feed.js";

// The feed needs absolute links. SITE_URL wins; on Vercel the production domain is used.
const siteUrl = () =>
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:5173");

const rssFeed = () => ({
  name: "rss-feed",
  configureServer(server) {
    server.middlewares.use("/feed.xml", (req, res) => {
      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.end(feedXml(catalog, `http://${req.headers.host}`));
    });
  },
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "feed.xml",
      source: feedXml(catalog, siteUrl()),
    });
  },
});

export default defineConfig({
  // Prebundle the lazy worker dependency up front. Discovering it on the first
  // explorer visit otherwise reloads the page and loses the user's search.
  optimizeDeps: { include: ["chart.js", "sql.js"] },
  plugins: [rssFeed()],
});
