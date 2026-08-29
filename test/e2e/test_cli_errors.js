import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "child_process";
import path from "path";

test("CLI Error Handling Test Suite", async (t) => {
  const cliPath = path.resolve("./bin/cli.js");

  await t.test("CLI outputs error for non-existent file", () => {
    try {
      execSync(`node ${cliPath} ./test/test-config/missing-package.json`, { encoding: "utf-8" });
      assert.fail("Should have failed for non-existent file");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] File not found/);
    }
  });

  await t.test("CLI outputs error for corrupted JSON", () => {
    const targetFile = path.resolve("./test/test-config/corrupted-package.json");

    try {
      execSync(`node ${cliPath} ${targetFile}`, { encoding: "utf-8" });
      assert.fail("Should have failed for corrupted JSON");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] Failed to parse JSON/);
    }
  });

  await t.test("CLI outputs info message for empty dependencies", () => {
    const targetFile = path.resolve("./test/test-config/empty-package.json");

    const output = execSync(`node ${cliPath} ${targetFile}`, { encoding: "utf-8" });
    assert.match(output, /\[INFO\] No dependencies found/);
  });
});
