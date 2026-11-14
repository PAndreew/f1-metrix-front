import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  validateFit,
  exportPublication,
} from "../scripts/export-publication.mjs";

const model = () => ({
  metadata: {
    model: "test",
    diagnostics: { maxRhat: 1.005, minEssBulk: 500, divergences: 0 },
  },
  drivers: [
    {
      id: "test",
      name: "Test Driver",
      nationality: "GB",
      races: 10,
      firstYear: 2020,
      lastYear: 2021,
      skill: 0.1,
      low: -0.2,
      high: 0.3,
      rank: 1,
    },
  ],
});
test("validated fits require finite, complete diagnostics", () => {
  validateFit(model());
  for (const d of [
    {},
    { maxRhat: 1.1, minEssBulk: 500, divergences: 0 },
    { maxRhat: 1, minEssBulk: 200, divergences: 0 },
    { maxRhat: 1, minEssBulk: 500, divergences: 1 },
    { maxRhat: NaN, minEssBulk: 500, divergences: 0 },
  ]) {
    const m = model();
    m.metadata.diagnostics = d;
    assert.throws(() => validateFit(m));
  }
});
test("fallback is visibly unvalidated and creates the browser database", () => {
  const root = mkdtempSync(join(tmpdir(), "f1metrix-export-"));
  try {
    mkdirSync(join(root, "data"));
    writeFileSync(
      join(root, "data", "bootstrap.json"),
      JSON.stringify(model()),
    );
    const result = exportPublication(root);
    assert.equal(result.validated, false);
    assert.match(result.notice, /not converged/);
    const db = new DatabaseSync(
      join(root, "site", "public", "data", "rankings.sqlite"),
      { readOnly: true },
    );
    assert.equal(
      db.prepare("SELECT name FROM drivers").get().name,
      "Test Driver",
    );
    db.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("research preview discloses incomplete validation despite passing sampler gates", () => {
  const root = mkdtempSync(join(tmpdir(), "f1metrix-research-"));
  try {
    mkdirSync(join(root, "publication"));
    const m = model();
    Object.assign(m.metadata, {
      validationStatus: "research_preview",
      validationNotice: "Research preview: held-out scoring incomplete",
      reliabilityDiagnostics: { passed: true },
    });
    Object.assign(m.metadata.diagnostics, {
      passed: true,
      smoke: false,
      minEssTail: 500,
      minBfmi: 0.6,
      maxTreeDepth: 7,
    });
    writeFileSync(join(root, "publication", "model.json"), JSON.stringify(m));
    const result = exportPublication(root);
    assert.equal(result.samplerPassed, true);
    assert.equal(result.validated, false);
    assert.match(result.notice, /held-out scoring incomplete/);
    assert.deepEqual(result.articles, []);
    const db = new DatabaseSync(
      join(root, "site", "public", "data", "rankings.sqlite"),
      { readOnly: true },
    );
    assert.equal(
      db.prepare("SELECT value FROM metadata WHERE key='validated'").get()
        .value,
      "false",
    );
    db.close();
    m.metadata.diagnostics.minBfmi = 0.1;
    assert.throws(() => validateFit(m));
    m.metadata.diagnostics.minBfmi = 0.6;
    m.drivers.push({ ...m.drivers[0] });
    writeFileSync(join(root, "publication", "model.json"), JSON.stringify(m));
    assert.throws(() => exportPublication(root), /duplicate/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("bad publication fails rather than falling back silently", () => {
  const root = mkdtempSync(join(tmpdir(), "f1metrix-bad-"));
  try {
    mkdirSync(join(root, "publication"));
    const m = model();
    m.metadata.diagnostics = {};
    writeFileSync(join(root, "publication", "model.json"), JSON.stringify(m));
    assert.throws(() => exportPublication(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
