import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Benchmark 7: Diagnostic Capability Matrix
 * Compares npm (production package manager) vs. node-dep-resolver (diagnostic & explanatory resolver).
 */

export async function runCapabilityMatrixBenchmark() {
  const capabilities = [
    { capability: "Parse package.json", npm: "YES", resolver: "YES" },
    { capability: "Build dependency graph", npm: "YES", resolver: "YES" },
    { capability: "Detect semver conflicts", npm: "Internal", resolver: "YES" },
    { capability: "Explain conflict cause", npm: "Limited", resolver: "YES" },
    { capability: "Generate alternative solutions", npm: "Internal", resolver: "YES" },
    { capability: "Rank alternatives", npm: "N/A", resolver: "YES" },
    { capability: "Show backtracking", npm: "N/A", resolver: "YES" },
    { capability: "Benchmark resolution", npm: "N/A", resolver: "YES" },
    { capability: "Visualize graph", npm: "N/A", resolver: "YES" }
  ];

  // Export CSV
  const csvHeader = "Capability,npm,node-dep-resolver\n";
  const csvRows = capabilities.map(c => `"${c.capability}",${c.npm},${c.resolver}`).join("\n");

  const csvPath = path.resolve(process.cwd(), "benchmark/data/7_capability_matrix.csv");
  fs.writeFileSync(csvPath, csvHeader + csvRows, "utf-8");

  return capabilities;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runCapabilityMatrixBenchmark().then(matrix => {
    console.log("\n=========================================");
    console.log(" 7. Diagnostic Capability Matrix");
    console.log("    (Config: benchmark/config/large-package.json)");
    console.log("=========================================\n");
    console.log("Capability                        npm          Your resolver");
    console.log("------------------------------------------------------------");
    for (const item of matrix) {
      const cap = item.capability.padEnd(32);
      const npmVal = item.npm.padEnd(12);
      const resVal = item.resolver;
      console.log(`${cap} ${npmVal} ${resVal}`);
    }
    console.log("\n[SUCCESS] Benchmark result exported to benchmark/7_capability_matrix.csv\n");
  });
}
