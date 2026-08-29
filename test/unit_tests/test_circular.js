import test from "node:test";
import assert from "node:assert/strict";
import Graph from "../../src/base/graph/GraphClass.js";

test("Circular Dependency Test Suite", async (t) => {
  await t.test("Graph handles circular dependencies safely", async () => {
    const graphObj = new Graph();
    const mockGraph = new Map();

    // Setup circular references: pkg-a -> pkg-b -> pkg-a
    mockGraph.set("pkg-a@1.0.0", {
      name: "pkg-a",
      version: "1.0.0",
      dependencies: { "pkg-b": "^1.0.0" }
    });

    mockGraph.set("pkg-b@1.0.0", {
      name: "pkg-b",
      version: "1.0.0",
      dependencies: { "pkg-a": "^1.0.0" }
    });

    assert.doesNotThrow(() => {
      graphObj.printGraph(mockGraph);
    });
  });
});
