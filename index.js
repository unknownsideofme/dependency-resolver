import fs from "fs";
import semver from "semver";
import Registry from "./src/base/registry/RegistryClass.js";
import Graph from "./src/base/graph/GraphClass.js";
import Resolver from "./src/base/resolver/ResolverClass.js";

function formatSolutionLine(name, packageData, requestedRange) {
  if (requestedRange) {
    const minVerObj = semver.minVersion(requestedRange);
    const minVer = minVerObj ? minVerObj.version : requestedRange;

    if (semver.valid(packageData.version) && semver.valid(minVer)) {
      if (semver.gt(packageData.version, minVer)) {
        return `  [UPGRADE] ${name}: ${minVer} -> ${packageData.version} (satisfies requested range '${requestedRange}')`;
      } else if (semver.lt(packageData.version, minVer)) {
        return `  [DOWNGRADE] ${name}: ${minVer} -> ${packageData.version} (satisfies requested range '${requestedRange}')`;
      }
    }
    return `  [OK] ${name}: ${packageData.version} (satisfies requested range '${requestedRange}')`;
  }

  if (packageData.oldVersion && semver.valid(packageData.version) && semver.valid(packageData.oldVersion)) {
    if (semver.gt(packageData.version, packageData.oldVersion)) {
      return `  [UPGRADE] ${name}: ${packageData.oldVersion} -> ${packageData.version} (to resolve conflict)`;
    } else if (semver.lt(packageData.version, packageData.oldVersion)) {
      return `  [DOWNGRADE] ${name}: ${packageData.oldVersion} -> ${packageData.version} (to resolve conflict)`;
    }
  }

  return `  [OK] ${name}: ${packageData.version} (requested by ${packageData.requestedBy || 'ROOT'})`;
}

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
    const requestedRange = dependencies[name];
    console.log(formatSolutionLine(name, packageData, requestedRange));
  }
}

main().catch((error) => {
  console.error("\n❌ Error during execution:", error.message);
});