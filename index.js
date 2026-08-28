import fs from "fs";
import { testBuildGraph , testPrintGraph } from "./test/test_graph.js";
import { testResolveDependencies } from "./test/test_resolver.js";
import { testAddConstraint, testGetConstraints, testGetConflicts } from "./test/test_constraint.js";
import { testGenerateCandidates } from "./test/test_candidates.js";
import { testgetPackageMetadata, testGetPackageVersion, testResolveVersion, testGetVersions } from "./test/test_registry.js";

async function main() {
  const packageJson = JSON.parse(
    fs.readFileSync("./test/test-config/test-package.json", "utf-8")
  );
  const dependencies = { ...(packageJson.dependencies || {}) };

  console.log("\n==================== RUNNING TESTS ====================\n");

  // 1. Test Registry Helpers
  console.log("--- 1. Testing Registry ---");
  const meta = await testgetPackageMetadata("axios");
  console.log("Metadata keys:", Object.keys(meta).slice(0, 5));
  const versionInfo = await testGetPackageVersion("axios", "1.20.0");
  console.log("Package version name:", versionInfo.name);
  const resolved = await testResolveVersion("axios", "^1.0.0");
  console.log("Resolved version:", resolved);
  const allVersions = await testGetVersions("axios");
  console.log("First 3 available versions:", allVersions.slice(0, 3));
  console.log();

  // 2. Test Constraint Helpers
  console.log("--- 2. Testing Constraints ---");
  testAddConstraint({ "axios": "^1.20.0", "express": "^4.18.2" });
  const constraints = testGetConstraints();
  console.log("Has constraint for axios:", constraints.has("axios"));
  const conflicts = testGetConflicts();
  console.log("Active conflicts count:", conflicts.size);
  console.log();

  // 3. Test Graph Building
  console.log("--- 3. Testing Graph Builder ---");
  const graph = await testBuildGraph(dependencies);
  await testPrintGraph(graph);
  console.log();

  // 4. Test Candidates
  console.log("--- 4. Testing Candidates ---");
  const dummyConflict = {
    packageName: "debug",
    constraints: [
      { requester: "express@4.18.2", range: "2.6.9" },
      { requester: "https-proxy-agent@5.0.1", range: "4" }
    ]
  };
  const candidates = await testGenerateCandidates(dummyConflict);
  console.log("Generated candidate fixes count:", candidates.length);
  if (candidates.length > 0) {
    console.log("First candidate fix:", candidates[0]);
  }
  console.log();

  // 5. Test Resolver
  console.log("--- 5. Testing Resolver ---");
  const solution = await testResolveDependencies(dependencies);
  console.log("\n========== FINAL SOLVED DEPENDENCIES ==========\n");
  for (const [name, packageData] of solution) {
    console.log(`${name}@${packageData.version}`);
  }
}

main().catch((error) => {
  console.error("\n❌ Error during test run:", error.message);
});