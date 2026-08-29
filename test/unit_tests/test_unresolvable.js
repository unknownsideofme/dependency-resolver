import test from "node:test";
import assert from "node:assert/strict";
import Resolver from "../../src/base/resolver/ResolverClass.js";

test("Unresolvable Conflict Test Suite", async (t) => {
  await t.test("Resolver throws error on unresolvable conflict", async () => {
    // Create a resolver instance with mock incompatible constraints
    const resolver = new Resolver({});
    
    // Add mutually exclusive constraints for 'ms'
    resolver.addConstraint("ms", "1.0.0", "pkg-a@1.0.0");
    resolver.addConstraint("ms", "2.0.0", "pkg-b@1.0.0");

    assert.equal(resolver.conflicts.size, 1);
    assert.ok(resolver.conflicts.has("ms"));

    await assert.rejects(
      async () => {
        await resolver.search();
      },
      (err) => {
        return err instanceof Error;
      }
    );
  });
});
