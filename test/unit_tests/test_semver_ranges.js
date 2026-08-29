import test from "node:test";
import assert from "node:assert/strict";
import semver from "semver";

test("Semver Ranges Matching Test Suite", async (t) => {
  await t.test("Validates tilde (~), caret (^), exact, and wildcard (*) ranges", () => {
    assert.ok(semver.satisfies("1.2.3", "~1.2.0"));
    assert.ok(!semver.satisfies("1.3.0", "~1.2.0"));

    assert.ok(semver.satisfies("1.9.5", "^1.2.0"));
    assert.ok(!semver.satisfies("2.0.0", "^1.2.0"));

    assert.ok(semver.satisfies("2.1.0", "*"));
    assert.ok(semver.satisfies("1.5.0", ">=1.0.0 <2.0.0"));
  });

  await t.test("Validates range intersection logic", () => {
    assert.ok(semver.intersects("^1.0.0", "~1.2.0"));
    assert.ok(!semver.intersects("2.0.0", "1.0.0"));
  });
});
