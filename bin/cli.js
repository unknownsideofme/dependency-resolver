#!/usr/bin/env node

import fs from "fs";
import path from "path";
import semver from "semver";
import Graph from "../src/base/graph/GraphClass.js";
import Resolver from "../src/base/resolver/ResolverClass.js";
import { buildResolvePlan, readResolvePlan, writeResolvePlan } from "../src/cli/resolvePlan.js";

function parseArguments() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((arg) => arg.startsWith("--")));
  const targetPath = args.find((arg) => !arg.startsWith("--")) || "./package.json";
  return { flags, targetPath };
}

async function runCli() {
  const { flags, targetPath } = parseArguments();

  if (flags.has("--upgrade") || flags.has("--downgrade") || flags.has("--resolve")) {
    const targetRoot = targetPath === "./package.json"
      ? process.cwd()
      : path.dirname(path.resolve(process.cwd(), targetPath));
    const { plan } = readResolvePlan(targetRoot);
    const command = flags.has("--resolve")
      ? plan.commands.all
      : flags.has("--upgrade")
        ? plan.commands.upgrade
        : plan.commands.downgrade;

    if (!command) {
      console.log("[INFO] No packages found for the selected operation.");
      return;
    }

    console.log(command);
    if (flags.has("--resolve")) {
      const { execSync } = await import("child_process");
      execSync(command, { cwd: targetRoot, stdio: "inherit" });
    }
    return;
  }
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

  const plan = buildResolvePlan(dependencies, solution, path.dirname(absolutePath));
  const planPath = writeResolvePlan(plan, path.dirname(absolutePath));
  console.log(`[INFO] Resolution plan written to '${planPath}'`);
  console.log("[INFO] Available flags:");
  console.log("  --upgrade");
  console.log("  --downgrade");
  console.log("  --resolve");
  if (plan.commands.all) {
    console.log("[INFO] Generated npm command:");
    console.log(`  ${plan.commands.all}`);
  } else {
    console.log("[INFO] No package changes are required.");
  }
}

runCli().catch((err) => {
  console.error("[ERROR] Fatal Error:", err.message);
  process.exit(1);
});
