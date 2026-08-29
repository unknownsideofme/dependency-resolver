import test from "node:test";
import assert from "node:assert/strict";
import Resolver from "../../src/base/resolver/ResolverClass.js";

test("Backtracking & Snapshot Test Suite", async (t) => {
  await t.test("Resolver snapshot creation and restoration", () => {
    const resolver = new Resolver({ express: "4.18.2" });

    resolver.selected.set("express", { name: "express", version: "4.18.2", requestedBy: "ROOT" });
    resolver.addConstraint("send", "0.18.0", "express@4.18.2");

    // Take snapshot
    const snapshot = resolver.createSnapshot();

    assert.equal(snapshot.selected.size, 1);
    assert.ok(snapshot.selected.has("express"));
    assert.equal(snapshot.constraints.size, 1);

    // Modify current state
    resolver.selected.set("axios", { name: "axios", version: "1.7.0", requestedBy: "ROOT" });
    resolver.addConstraint("axios", "^1.7.0", "ROOT");

    assert.equal(resolver.selected.size, 2);

    // Restore snapshot
    resolver.restoreSnapshot(snapshot);

    assert.equal(resolver.selected.size, 1);
    assert.ok(!resolver.selected.has("axios"));
  });
});
