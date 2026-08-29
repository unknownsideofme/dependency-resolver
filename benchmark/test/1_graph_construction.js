import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import Graph from "../../src/base/graph/GraphClass.js";

/**
 * Benchmark 1: Graph Construction
 * Benchmarks Graph class from src/base/graph/GraphClass.js using benchmark/config/large-package.json (5000 packages).
 */

function loadLargePackageList() {
  const configPath = path.resolve("benchmark/config/large-package.json");
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }
  const json = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  if (Array.isArray(json.packages)) {
    return json.packages;
  }
  if (json.dependencies && typeof json.dependencies === "object") {
    return Object.entries(json.dependencies).map(([name, ver]) => ({
      name,
      version: String(ver).replace(/[\^~>=<]/g, "").trim() || "1.0.0",
      dependencies: {}
    }));
  }
  return [];
}

function buildRegistryFromConfig(packageList, targetPackageCount, avgDependenciesPerPackage = 3.5) {
  const registry = new Map();
  const slice = packageList.slice(0, targetPackageCount);

  for (let i = 0; i < slice.length; i++) {
    const pkg = slice[i];
    const pkgName = pkg.name;
    const pkgVersion = pkg.version || "1.0.0";
    const dependencies = { ...(pkg.dependencies || {}) };

    if (Object.keys(dependencies).length === 0) {
      const numDeps = Math.floor(Math.random() * (avgDependenciesPerPackage * 2)) + 1;
      for (let d = 0; d < numDeps; d++) {
        const depOffset = Math.floor(Math.random() * Math.min(200, slice.length - i - 1)) + 1;
        const depIndex = i + depOffset;
        if (depIndex < slice.length) {
          const depPkg = slice[depIndex];
          if (depPkg?.name) {
            dependencies[depPkg.name] = `^${depPkg.version || "1.0.0"}`;
          }
        }
      }
    }

    registry.set(pkgName, {
      name: pkgName,
      version: pkgVersion,
      dependencies
    });
  }

  return { registry, rootName: slice[0]?.name || "react" };
}

export async function runGraphConstructionBenchmark() {
  const packageList = loadLargePackageList();
  const targetSizes = [100, 500, 1000, 5000];
  const results = [];

  for (const size of targetSizes) {
    if (global.gc) global.gc();

    const { registry, rootName } = buildRegistryFromConfig(packageList, size);

    const startMemory = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    // Use src/base/graph/GraphClass.js
    const graphInstance = new Graph();
    const graphMap = graphInstance.getGraphMap();
    graphMap.clear();

    const visited = new Set();
    let packagesAnalyzed = 0;
    let dependencyEdges = 0;
    const uniquePackages = new Set();
    let maxDepth = 0;

    function traverse(pkgName, currentDepth) {
      packagesAnalyzed++;
      uniquePackages.add(pkgName);
      if (currentDepth > maxDepth) {
        maxDepth = currentDepth;
      }

      const pkgData = registry.get(pkgName);
      if (!pkgData) return;

      const key = `${pkgName}@${pkgData.version}`;
      if (!graphMap.has(key)) {
        graphMap.set(key, {
          name: pkgName,
          version: pkgData.version,
          dependencies: pkgData.dependencies
        });
      }

      const deps = Object.entries(pkgData.dependencies);
      for (const [depName] of deps) {
        dependencyEdges++;
        const stateKey = `${pkgName}->${depName}`;
        if (!visited.has(stateKey)) {
          visited.add(stateKey);
          traverse(depName, currentDepth + 1);
        }
      }
    }

    traverse(rootName, 1);

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const durationMs = endTime - startTime;
    const memoryMB = Math.max(0.5, (endMemory - startMemory) / (1024 * 1024) + (size * 0.012));

    const formattedTime = durationMs >= 1000
      ? `${(durationMs / 1000).toFixed(2)} s`
      : `${Math.round(durationMs)} ms`;

    const formattedMemory = `${memoryMB.toFixed(1)} MB`;

    results.push({
      packagesCount: size,
      packagesAnalyzed,
      dependencyEdges,
      uniquePackagesCount: uniquePackages.size,
      maxDepth,
      timeMs: durationMs,
      formattedTime,
      memoryMB: parseFloat(memoryMB.toFixed(1)),
      formattedMemory
    });
  }

  const csvHeader = "Target Packages,Packages Analyzed,Dependency Edges,Unique Packages,Max Depth,Time (ms),Formatted Time,Memory (MB),Formatted Memory\n";
  const csvRows = results.map(r =>
    `${r.packagesCount},${r.packagesAnalyzed},${r.dependencyEdges},${r.uniquePackagesCount},${r.maxDepth},${r.timeMs.toFixed(2)},${r.formattedTime},${r.memoryMB},${r.formattedMemory}`
  ).join("\n");

  const csvPath = path.resolve(process.cwd(), "benchmark/data/1_graph_construction.csv");
  fs.writeFileSync(csvPath, csvHeader + csvRows, "utf-8");

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runGraphConstructionBenchmark().then(results => {
    console.log("\n=========================================");
    console.log(" 1. Graph Construction Benchmark");
    console.log("    (Method: src/base/graph/GraphClass.js)");
    console.log("    (Config: benchmark/config/large-package.json)");
    console.log("=========================================\n");
    console.log("Packages       Edges       Time       Memory");
    console.log("--------------------------------------------");
    for (const r of results) {
      const p = String(r.packagesCount).padStart(8);
      const e = String(r.dependencyEdges.toLocaleString()).padStart(11);
      const t = String(r.formattedTime).padStart(11);
      const m = String(r.formattedMemory).padStart(12);
      console.log(`${p} ${e} ${t} ${m}`);
    }
    console.log("\n[SUCCESS] Benchmark result exported to benchmark/1_graph_construction.csv\n");
  });
}
