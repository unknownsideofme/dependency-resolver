import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import semver from "semver";
import { fileURLToPath } from "url";
import Constraint from "../../src/base/constraints/ConstraintClass.js";

/**
 * Benchmark 2: Constraint Processing (Naive vs. Indexed)
 * Compares O(N) flat array scan vs src/base/constraints/ConstraintClass.js (Map indexed lookup):
 * 100, 500, 1K (1000), 5K (5000), 10K (10000), 50K (50000).
 */

class NaiveConstraintStore {
  constructor() {
    this.constraintsList = [];
    this.conflicts = new Set();
  }

  addConstraint(dependencyName, dependencyRange, requestedBy) {
    // Check duplicate
    for (let i = 0; i < this.constraintsList.length; i++) {
      const item = this.constraintsList[i];
      if (item.name === dependencyName && item.requester === requestedBy && item.range === dependencyRange) {
        return;
      }
    }

    // Check conflict by scanning ALL stored constraints in flat list
    for (let i = 0; i < this.constraintsList.length; i++) {
      const existing = this.constraintsList[i];
      if (existing.name === dependencyName) {
        const compatible = semver.intersects(existing.range, dependencyRange);
        if (!compatible) {
          this.conflicts.add(dependencyName);
        }
      }
    }

    this.constraintsList.push({
      name: dependencyName,
      range: dependencyRange,
      requester: requestedBy
    });
  }
}

function getPackagesFromConfig() {
  const configPath = path.resolve("benchmark/config/large-package.json");
  if (fs.existsSync(configPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    if (Array.isArray(pkgJson.packages)) {
      return pkgJson.packages.map(p => p.name);
    }
    return Object.keys(pkgJson.dependencies || {});
  }
  return Array.from({ length: 5000 }, (_, i) => `pkg-${i}`);
}

export async function runConstraintProcessingBenchmark() {
  const constraintCounts = [100, 500, 1000, 5000, 10000, 50000];
  const results = [];

  const packages = getPackagesFromConfig();
  const packagePoolSize = packages.length;
  const ranges = ["^1.0.0", "^1.2.0", "~1.1.0", ">=1.0.0 <2.0.0", "^2.0.0"];

  for (const count of constraintCounts) {
    // Benchmark Naive
    const naiveStore = new NaiveConstraintStore();
    const naiveStart = performance.now();
    for (let i = 0; i < count; i++) {
      const pkg = packages[i % packagePoolSize];
      const range = ranges[i % ranges.length];
      const requester = `requester-${i % 50}`;
      naiveStore.addConstraint(pkg, range, requester);
    }
    const naiveEnd = performance.now();
    const naiveTimeMs = naiveEnd - naiveStart;

    // Benchmark Indexed using src/base/constraints/ConstraintClass.js
    const indexedConstraint = new Constraint();
    const indexedStart = performance.now();
    for (let i = 0; i < count; i++) {
      const pkg = packages[i % packagePoolSize];
      const range = ranges[i % ranges.length];
      const requester = `requester-${i % 50}`;
      indexedConstraint.addConstraint(pkg, range, requester);
    }
    const indexedEnd = performance.now();
    const indexedTimeMs = indexedEnd - indexedStart;

    const speedup = indexedTimeMs > 0 ? (naiveTimeMs / indexedTimeMs) : 1.0;

    let label = `${count}`;
    if (count >= 1000) {
      label = `${count / 1000}K`;
    }

    results.push({
      count,
      label,
      naiveTimeMs,
      indexedTimeMs,
      speedup: parseFloat(speedup.toFixed(2))
    });
  }

  // Save CSV
  const csvHeader = "Constraint Count,Label,Naive Time (ms),Indexed Time (ms),Speedup\n";
  const csvRows = results.map(r =>
    `${r.count},${r.label},${r.naiveTimeMs.toFixed(2)},${r.indexedTimeMs.toFixed(2)},${r.speedup}x`
  ).join("\n");

  const csvPath = path.resolve(process.cwd(), "benchmark/data/2_constraint_processing.csv");
  fs.writeFileSync(csvPath, csvHeader + csvRows, "utf-8");

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runConstraintProcessingBenchmark().then(results => {
    console.log("\n=========================================");
    console.log(" 2. Constraint Processing Benchmark");
    console.log("    (Method: src/base/constraints/ConstraintClass.js)");
    console.log("    (Config: benchmark/config/large-package.json)");
    console.log("=========================================\n");
    console.log("Constraint count            Naive      Indexed");
    console.log("------------------------------------------------");
    for (const row of results) {
      console.log(`${row.label.padEnd(24)} ${row.naiveTimeMs.toFixed(2).padStart(6)} ms ${row.indexedTimeMs.toFixed(2).padStart(10)} ms`);
    }
    const lastRow = results[results.length - 1];
    console.log(`\n  >> ${lastRow.speedup}x faster conflict detection at ${lastRow.label} constraints`);
    console.log("\n[SUCCESS] Benchmark result exported to benchmark/2_constraint_processing.csv\n");
  });
}
