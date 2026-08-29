#!/usr/bin/env node

import fs from "fs";
import path from "path";
import Graph from "../src/base/graph/GraphClass.js";
import Resolver from "../src/base/resolver/ResolverClass.js";

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
    if (requestedRange) {
      console.log(`  [OK] ${name}: ${packageData.version} (satisfies requested range '${requestedRange}')`);
    } else {
      console.log(`  [OK] ${name}: ${packageData.version} (requested by ${packageData.requestedBy})`);
    }
  }
  console.log();
}

runCli().catch((err) => {
  console.error("[ERROR] Fatal Error:", err.message);
  process.exit(1);
});
