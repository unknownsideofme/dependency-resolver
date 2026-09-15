import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import path from "path";

test("E2E CLI Test Suite", async (t) => {
  const cliPath = path.resolve("./bin/cli.js");

  await t.test("1. CLI executes cleanly on test-package.json", () => {
    const configPath = path.resolve("./test/test-config/test-package.json");
    const output = execFileSync("node", [cliPath, configPath], { encoding: "utf-8" });

    assert.match(output, /\[INFO\] Analyzing dependencies/);
    assert.match(output, /Building Dependency Graph/);
    assert.match(output, /RESOLVED DEPENDENCY SOLUTION/);
    assert.match(output, /express/);
    assert.match(output, /axios/);
    assert.match(output, /To resolve the conflicting dependencies in your project, copy and run:/);
    assert.match(output, /npm install .* --save/);
  });

  await t.test("2. CLI handles missing file path cleanly", () => {
    try {
      execFileSync("node", [cliPath, "./test/test-config/missing-file.json"], { encoding: "utf-8" });
      assert.fail("Should have failed for non-existent file path");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] File not found/);
    }
  });

  await t.test("3. CLI handles corrupted JSON structure", () => {
    const targetFile = path.resolve("./test/test-config/corrupted-package.json");

    try {
      execFileSync("node", [cliPath, targetFile], { encoding: "utf-8" });
      assert.fail("Should have failed for corrupted JSON");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] Failed to parse JSON/);
    }
  });

  await t.test("4. CLI handles empty dependencies object", () => {
    const targetFile = path.resolve("./test/test-config/empty-package.json");

    const output = execFileSync("node", [cliPath, targetFile], { encoding: "utf-8" });
    assert.match(output, /\[INFO\] No dependencies found/);
  });

  await t.test("5. CLI runs default execution on root package.json", () => {
    const output = execFileSync("node", [cliPath], { encoding: "utf-8" });

    assert.match(output, /\[INFO\] Analyzing dependencies from '\.\/package\.json'/);
    assert.match(output, /RESOLVED DEPENDENCY SOLUTION/);
  });
});
