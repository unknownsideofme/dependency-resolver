import fs from "fs";
import Registry from "./src/base/registry/RegistryClass.js";
import Graph from "./src/base/graph/GraphClass.js";
import Resolver from "./src/base/resolver/ResolverClass.js";

async function main() {
  const packageJson = JSON.parse(
    fs.readFileSync("./test/test-config/test-package.json", "utf-8")
  );
  const dependencies = { ...(packageJson.dependencies || {}) };

  console.log("\n==================== DEPENDENCY RESOLVER DEMO ====================\n");

  // 1. Using Registry Class
  console.log("--- 1. Registry Class Demo ---");
  const registry = new Registry();
  const resolvedVersion = await registry.resolveVersion("axios", "^1.0.0");
  console.log(`Resolved '^1.0.0' for axios -> ${resolvedVersion}`);
  
  const allVersions = await registry.getVersions("axios");
  console.log(`Total versions for axios: ${allVersions.length}`);
  console.log();

  // 2. Using Graph Class
  console.log("--- 2. Building Dependency Graph ---");
  const graphObj = new Graph();
  const graph = await graphObj.buildGraph(dependencies);

  console.log("\n========== DEPENDENCY GRAPH ==========\n");
  graphObj.printGraph(graph);
  console.log();

  // 3. Using Resolver Class
  console.log("--- 3. Resolving Conflicts ---");
  const resolver = new Resolver(dependencies);
  const solution = await resolver.resolve();

  console.log("\n========== FINAL SOLVED DEPENDENCIES ==========\n");
  for (const [name, packageData] of solution) {
    console.log(`${name}@${packageData.version}`);
  }
}

main().catch((error) => {
  console.error("\n❌ Error during execution:", error.message);
});