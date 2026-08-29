import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

test("E2E CLI Test Suite", async (t) => {
  const cliPath = path.resolve("./bin/cli.js");

  await t.test("1. CLI executes cleanly on test-package.json", () => {
    const configPath = path.resolve("./test/test-config/test-package.json");
    const output = execSync(`node ${cliPath} ${configPath}`, { encoding: "utf-8" });

    assert.match(output, /\[INFO\] Analyzing dependencies/);
    assert.match(output, /Building Dependency Graph/);
    assert.match(output, /RESOLVED DEPENDENCY SOLUTION/);
    assert.match(output, /express/);
    assert.match(output, /axios/);
  });

  await t.test("2. CLI handles missing file path cleanly", () => {
    try {
      execSync(`node ${cliPath} ./non-existent-path.json`, { encoding: "utf-8" });
      assert.fail("Should have failed for non-existent file path");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] File not found/);
    }
  });

  await t.test("3. CLI handles corrupted JSON structure", () => {
    const tempFile = path.resolve("./scratch_corrupted_e2e.json");
    fs.writeFileSync(tempFile, "{ corrupted json syntax");

    try {
      execSync(`node ${cliPath} ${tempFile}`, { encoding: "utf-8" });
      assert.fail("Should have failed for corrupted JSON");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] Failed to parse JSON/);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  await t.test("4. CLI handles empty dependencies object", () => {
    const tempFile = path.resolve("./scratch_empty_e2e.json");
    fs.writeFileSync(tempFile, JSON.stringify({ dependencies: {} }));

    try {
      const output = execSync(`node ${cliPath} ${tempFile}`, { encoding: "utf-8" });
      assert.match(output, /\[INFO\] No dependencies found/);
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });

  await t.test("5. CLI runs default execution on root package.json", () => {
    const output = execSync(`node ${cliPath}`, { encoding: "utf-8" });

    assert.match(output, /\[INFO\] Analyzing dependencies from '\.\/package\.json'/);
    assert.match(output, /RESOLVED DEPENDENCY SOLUTION/);
  });
});
