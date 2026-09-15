#!/usr/bin/env node

import fs from "fs";
import path from "path";
import semver from "semver";
import Graph from "../src/base/graph/GraphClass.js";
import Resolver from "../src/base/resolver/ResolverClass.js";
import { buildResolveCommand } from "../src/cli/resolveCommand.js";

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

async function runCli() {
  const targetPath = process.argv[2] || "./package.json";
  const absolutePath = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`[ERROR] File not found at '${absolutePath}'`);
    process.exit(1);
  }

  console.log(`\n[INFO] Analyzing dependencies from '${targetPath}'...\n`);

  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
  } catch (err) {
    console.error(`[ERROR] Failed to parse JSON in '${targetPath}'`);
    process.exit(1);
  }

  const dependencies = {
    ...(packageJson.dependencies || {})
  };

  if (Object.keys(dependencies).length === 0) {
    console.log("[INFO] No dependencies found in package.json.");
    process.exit(0);
  }

  console.log("--- Building Dependency Graph ---");
  const graphObj = new Graph();
  const graph = await graphObj.buildGraph(dependencies);
  graphObj.printGraph(graph);

  console.log("\n--- Resolving Conflicts ---");
  const resolver = new Resolver(dependencies);
  const solution = await resolver.resolve();

  console.log("\n========== RESOLVED DEPENDENCY SOLUTION ==========\n");
  for (const [name, packageData] of solution) {
    const requestedRange = dependencies[name];
    console.log(formatSolutionLine(name, packageData, requestedRange));
  }
  const copyableCommand = buildResolveCommand(dependencies, solution);
  console.log();
  console.log("[INFO] To resolve the conflicting dependencies in your project, copy and run:");
  console.log(`  ${copyableCommand}`);
  console.log();
}

runCli().catch((err) => {
  console.error("[ERROR] Fatal Error:", err.message);
  process.exit(1);
});
