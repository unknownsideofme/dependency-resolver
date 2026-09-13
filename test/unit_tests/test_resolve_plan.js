import test from "node:test";
import assert from "node:assert/strict";
import { buildResolvePlan } from "../../src/cli/resolvePlan.js";

test("buildResolvePlan groups version changes and creates commands", () => {
  const plan = buildResolvePlan({
    upgradeable: "^1.0.0",
    downgradable: "^3.0.0"
  }, new Map([
    ["upgradeable", { version: "2.0.0" }],
    ["downgradable", { version: "2.0.0" }]
  ]));

  assert.deepEqual(plan.upgradables, [{ pkgName: "upgradeable", curVer: "1.0.0", tarVer: "2.0.0" }]);
  assert.deepEqual(plan.downgradables, [{ pkgName: "downgradable", curVer: "3.0.0", tarVer: "2.0.0" }]);
  assert.equal(plan.commands.all, "npm install upgradeable@2.0.0 downgradable@2.0.0 --save");
});
