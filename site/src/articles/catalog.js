// Article metadata, kept free of browser code so the build can read it for the RSS feed.
// Add new articles here and register their renderer in index.js.
export const catalog = [
  {
    id: "sao-paulo-2026",
    title: "São Paulo Grand Prix 2026: How Norris won a race that went wet, dry, then wet again",
    date: "2026-11-20",
    summary:
      "Lando Norris lost two places at the start but won by 14.602 seconds. Max Verstappen went from 21st to second. Lap timing shows where the race turned, and the model explains why the winner was the bigger surprise.",
  },
  {
    id: "driver-or-car",
    title:
      "Driver or car? How much of each world title was down to the champion",
    date: "2026-11-17",
    summary:
      "The model scores drivers and cars separately, so every championship since 1954 can be split into the driver’s part and the car’s part. Jim Clark and Jochen Rindt won almost on their own; Jacques Villeneuve, Phil Hill and Damon Hill were carried.",
  },
].sort((a, b) => b.date.localeCompare(a.date));
