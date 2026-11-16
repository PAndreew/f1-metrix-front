import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const yaml = readFileSync(
  new URL(
    "../.github/workflows/owner-only-issue-resolution.yml",
    import.meta.url,
  ),
  "utf8",
);
const script = yaml
  .split("          script: |\n")[1]
  .split("\n")
  .map((line) => line.replace(/^            /, ""))
  .join("\n");
const execute = new (Object.getPrototypeOf(async function () {}).constructor)(
  "context",
  "github",
  "core",
  script,
);
async function run(actor, state = "closed", closedBy = actor) {
  const updates = [];
  await execute(
    {
      actor,
      repo: { owner: "PAndreew", repo: "f1-metrix-front" },
      issue: { number: 1 },
    },
    {
      rest: {
        issues: {
          get: async () => ({
            data: { state, closed_by: { login: closedBy } },
          }),
          update: async (data) => updates.push(data),
        },
      },
    },
    { notice: () => {} },
  );
  return updates;
}
test("non-owner closure is reopened", async () =>
  assert.equal((await run("other"))[0].state, "open"));
test("owner closure remains closed", async () =>
  assert.equal((await run("PAndreew")).length, 0));
test("later owner closure is respected", async () =>
  assert.equal((await run("other", "closed", "PAndreew")).length, 0));
test("already open issue is not modified", async () =>
  assert.equal((await run("other", "open")).length, 0));
