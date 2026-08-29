import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "child_process";
import path from "path";

test("E2E CLI Execution Test", async (t) => {
  await t.test("CLI executes cleanly on test-package.json", () => {
    const cliPath = path.resolve("./bin/cli.js");
    const configPath = path.resolve("./test/test-config/test-package.json");

    const output = execSync(`node ${cliPath} ${configPath}`, { encoding: "utf-8" });

    assert.match(output, /\[INFO\] Analyzing dependencies/);
    assert.match(output, /Building Dependency Graph/);
    assert.match(output, /RESOLVED DEPENDENCY SOLUTION/);
    assert.match(output, /express/);
    assert.match(output, /axios/);
  });
});
