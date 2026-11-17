// Article metadata, kept free of browser code so the build can read it for the RSS feed.
// Add new articles here and register their renderer in index.js.
export const catalog = [
  {
    id: "driver-or-car",
    title:
      "Driver or car? How much of each world title was down to the champion",
    date: "2026-11-17",
    summary:
      "The model scores drivers and cars separately, so every championship since 1954 can be split into the driver’s part and the car’s part. Jim Clark and Jochen Rindt won almost on their own; Jacques Villeneuve, Phil Hill and Damon Hill were carried.",
  },
].sort((a, b) => b.date.localeCompare(a.date));
