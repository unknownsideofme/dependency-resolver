import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

test("CLI Error Handling Test Suite", async (t) => {
  const cliPath = path.resolve("./bin/cli.js");

  await t.test("CLI outputs error for non-existent file", () => {
    try {
      execSync(`node ${cliPath} ./non-existent-package.json`, { encoding: "utf-8" });
      assert.fail("Should have failed for non-existent file");
    } catch (err) {
      assert.match(err.stderr || err.stdout, /\[ERROR\] File not found/);
    }
  });

  await t.test("CLI outputs error for corrupted JSON", () => {
    const tempFile = path.resolve("./scratch_corrupted.json");
    fs.writeFileSync(tempFile, "{ invalid json structure");

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

  await t.test("CLI outputs info message for empty dependencies", () => {
    const tempFile = path.resolve("./scratch_empty.json");
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
});
