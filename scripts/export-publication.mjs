import { DatabaseSync } from "node:sqlite";
import { validateQualifying } from "./validate-qualifying.mjs";
import { validateSimulations } from "./validate-simulations.mjs";
import { validateSequentialPreview } from "./validate-sequential-preview.mjs";
import { validatePerformance } from "./validate-performance.mjs";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validateFit(model) {
  const d = model?.metadata?.diagnostics;
  if (
    model?.metadata?.validationStatus === "research_preview" &&
    (!d ||
      d.passed !== true ||
      d.smoke !== false ||
      !Number.isFinite(d.minEssTail) ||
      d.minEssTail < 400 ||
      !Number.isFinite(d.minBfmi) ||
      d.minBfmi < 0.3 ||
      !Number.isFinite(d.maxTreeDepth) ||
      d.maxTreeDepth >= 10 ||
      model.metadata.reliabilityDiagnostics?.passed !== true ||
      !model.metadata.validationNotice)
  )
    throw new Error(
      "Research preview requires full diagnostics and an explicit disclosure",
    );
  if (
    !d ||
    ![d.maxRhat, d.minEssBulk, d.divergences].every(
      (v) => typeof v === "number" && Number.isFinite(v),
    ) ||
    d.maxRhat <= 0 ||
    d.maxRhat > 1.01 ||
    d.minEssBulk < 400 ||
    d.divergences !== 0
  ) {
    throw new Error(
      "Publication model has not passed the MCMC diagnostic gate",
    );
  }
}

export function exportPublication(root) {
  const path = join(root, "publication", "model.json");
  const validated = existsSync(path);
  const model = JSON.parse(
    readFileSync(
      validated ? path : join(root, "data", "bootstrap.json"),
      "utf8",
    ),
  );
  if (validated) {
    validateFit(model);
    validatePerformance(model);
    const ids = new Set();
    for (const d of model.drivers) {
      if (
        !d.id ||
        ids.has(d.id) ||
        !d.name ||
        ![
          d.skill,
          d.low,
          d.high,
          d.races,
          d.firstYear,
          d.lastYear,
          d.rank,
        ].every(Number.isFinite) ||
        d.low > d.skill ||
        d.skill > d.high ||
        d.races < 1 ||
        d.firstYear > d.lastYear
      )
        throw new Error("Invalid or duplicate driver summary");
      ids.add(d.id);
    }
  }
  const dir = join(root, "site", "public", "data");
  mkdirSync(dir, { recursive: true });
  const articlesDir = join(root, "publication", "articles");
  const articles = existsSync(articlesDir)
    ? readdirSync(articlesDir)
        .filter((n) => n.endsWith(".json"))
        .map((n) => JSON.parse(readFileSync(join(articlesDir, n), "utf8")))
    : [];
  articles.sort((a, b) => b.date.localeCompare(a.date));
  const qualifyingPath = join(root, "publication", "qualifying.json");
  const qualifying = existsSync(qualifyingPath)
    ? JSON.parse(readFileSync(qualifyingPath, "utf8"))
    : null;
  if (qualifying) validateQualifying(qualifying);
  const sequentialPath = join(root, "publication", "sequential-preview.json");
  const simulationsPath = existsSync(sequentialPath)
    ? sequentialPath
    : join(root, "publication", "simulations.json");
  const simulations = existsSync(simulationsPath)
    ? JSON.parse(readFileSync(simulationsPath, "utf8"))
    : null;
  if (simulations) {
    if (simulations.kind === "sequential-preview-eligible-finisher")
      validateSequentialPreview(simulations);
    else validateSimulations(simulations);
  }
  const data = {
    simulations,
    qualifying,
    model,
    articles,
    samplerPassed: validated,
    validated:
      validated && model.metadata.validationStatus !== "research_preview",
    notice: validated
      ? (model.metadata.validationNotice ?? "")
      : "Historical preview only · legacy fit · not converged. These are not current, validated rankings.",
  };
  writeFileSync(join(dir, "publication.json"), JSON.stringify(data));
  const sqlite = join(dir, "rankings.sqlite");
  rmSync(sqlite, { force: true });
  const db = new DatabaseSync(sqlite);
  try {
    db.exec(
      "CREATE TABLE drivers(id TEXT PRIMARY KEY,name TEXT,nationality TEXT,races INTEGER,first_year INTEGER,last_year INTEGER,skill REAL,low REAL,high REAL,rank INTEGER); CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT);",
    );
    db.exec("BEGIN");
    const insert = db.prepare(
      "INSERT INTO drivers VALUES(?,?,?,?,?,?,?,?,?,?)",
    );
    for (const d of model.drivers)
      insert.run(
        d.id,
        d.name,
        d.nationality ?? "",
        d.races,
        d.firstYear,
        d.lastYear,
        d.skill,
        d.low,
        d.high,
        d.rank,
      );
    db.prepare("INSERT INTO metadata VALUES(?,?)").run(
      "model",
      model.metadata.model,
    );
    db.prepare("INSERT INTO metadata VALUES(?,?)").run(
      "validated",
      String(data.validated),
    );
    db.exec("COMMIT");
  } finally {
    db.close();
  }
  const wasm = join(root, "node_modules", "sql.js", "dist", "sql-wasm.wasm");
  if (existsSync(wasm))
    copyFileSync(wasm, join(root, "site", "public", "sql-wasm.wasm"));
  console.log(
    `Exported ${model.drivers.length} drivers, ${articles.length} articles; samplerPassed=${data.samplerPassed}; validated=${data.validated}`,
  );
  return data;
}

const here = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === here)
  exportPublication(dirname(dirname(here)));
