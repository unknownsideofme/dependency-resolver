import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath } from "url";
import Registry from "../../src/base/registry/RegistryClass.js";
import Graph from "../../src/base/graph/GraphClass.js";
import Constraint from "../../src/base/constraints/ConstraintClass.js";
import Resolver from "../../src/base/resolver/ResolverClass.js";

/**
 * Benchmark 8: Real-World NPM Projects Benchmark
 *
 * For each project profile (Express, Vite, Next, Large) it:
 *   1. Reads a slice of package names from benchmark/config/large-package.json.
 *   2. Calls Registry.prototype.getPackageMetadata() for each name — hits the
 *      real npm registry and returns real dep trees.
 *   3. Feeds every dependency edge through Constraint.prototype.addConstraint()
 *      from src/base/constraints/ConstraintClass.js.
 *   4. Populates Graph.graphMap via graph.getGraphMap() using the real data.
 *   5. Instantiates Resolver and drives resolver.addConstraint() +
 *      resolver.checkConflict() so the resolver path is exercised.
 *   6. Reports real timing, real edge counts, real conflict counts.
 */

function loadPackageNames() {
  const configPath = path.resolve("benchmark/config/large-package.json");
  const json = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return (Array.isArray(json.packages) ? json.packages : []).map(p => p.name);
}

async function runProject(projectName, pkgNames, registry) {
  const constraint = new Constraint();

  // Reset Graph singleton for this project
  const graph = new Graph();
  const graphMap = graph.getGraphMap();
  graphMap.clear();

  let edgesIngested = 0;
  let fetchedCount = 0;
  const rootDepsForResolver = {};

  const start = performance.now();

  for (const name of pkgNames) {
    try {
      // ── Real Registry call ──────────────────────────────────────────────
      const meta = await registry.getPackageMetadata(name);
      const latestVer = meta["dist-tags"]?.latest
        || Object.keys(meta.versions || {})[0];
      if (!latestVer) continue;

      const vData = (meta.versions || {})[latestVer] || {};
      const requester = `${name}@${latestVer}`;
      fetchedCount++;

      // ── Populate Graph.graphMap with real data ──────────────────────────
      graphMap.set(requester, {
        name,
        version: latestVer,
        dependencies: vData.dependencies || {}
      });

      // ── Feed real dep edges into Constraint.addConstraint() ─────────────
      for (const [dep, range] of Object.entries(vData.dependencies || {})) {
        constraint.addConstraint(dep, range, requester);
        edgesIngested++;
      }
      for (const [dep, range] of Object.entries(vData.peerDependencies || {})) {
        constraint.addConstraint(dep, range, `${requester}[peer]`);
        edgesIngested++;
      }
      for (const [dep, range] of Object.entries(vData.optionalDependencies || {})) {
        constraint.addConstraint(dep, range, `${requester}[optional]`);
        edgesIngested++;
      }

      if (fetchedCount <= 10) {
        rootDepsForResolver[name] = `^${latestVer}`;
      }
    } catch (_) { }
  }

  const constraintMs = performance.now() - start;

  // ── Drive Resolver.addConstraint() + checkConflict() ──────────────────
  //    Resolver uses plain arrays per key — do NOT share the Constraint instance
  const resolver = new Resolver(rootDepsForResolver);
  const constraintMap = constraint.getConstraints();

  const resolverStart = performance.now();
  for (const [depName, entry] of constraintMap.entries()) {
    for (const req of (entry.constraints || [])) {
      resolver.addConstraint(depName, req.range, req.requester);
    }
    resolver.checkConflict(depName);
  }
  const resolverMs = performance.now() - resolverStart;

  const conflictsDetected = resolver.conflicts.size;  // real Set from Conflict singleton
  const totalMs = constraintMs + resolverMs;

  return {
    project: projectName,
    packagesFetched: fetchedCount,
    graphNodes: graphMap.size,
    edgesIngested,
    conflictsDetected,
    constraintMs: parseFloat(constraintMs.toFixed(1)),
    resolverMs: parseFloat(resolverMs.toFixed(1)),
    totalMs: parseFloat(totalMs.toFixed(1)),
    formattedTime: `${Math.round(totalMs)}ms`
  };
}

export async function runRealWorldProjectsBenchmark() {
  const allNames = loadPackageNames();
  const registry = new Registry();  // shared — benefits from Dependency cache

  // Project profiles: realistic slice sizes drawn from the 5,000-name pool
  const profiles = [
    { name: "Express app", slice: allNames.slice(0, 20) },
    { name: "Vite app", slice: allNames.slice(20, 45) },
    { name: "Next app", slice: allNames.slice(45, 80) },
    { name: "Large project", slice: allNames.slice(80, 130) }
  ];

  const results = [];
  for (const p of profiles) {
    const r = await runProject(p.name, p.slice, registry);
    results.push(r);
  }

  const summaryCard = {
    totalPackagesFetched: results.reduce((s, r) => s + r.packagesFetched, 0),
    totalEdges: results.reduce((s, r) => s + r.edgesIngested, 0),
    totalConflicts: results.reduce((s, r) => s + r.conflictsDetected, 0)
  };

  // ── Export CSV ────────────────────────────────────────────────────────────
  const csvHeader =
    "Project,Packages Fetched,Graph Nodes,Edges,Conflicts,Constraint (ms),Resolver (ms),Total (ms)\n";
  const csvRows = results.map(r =>
    `"${r.project}",${r.packagesFetched},${r.graphNodes},${r.edgesIngested},` +
    `${r.conflictsDetected},${r.constraintMs},${r.resolverMs},${r.totalMs}`
  ).join("\n");

  fs.writeFileSync(
    path.resolve(process.cwd(), "benchmark/data/8_real_world_projects.csv"),
    csvHeader + csvRows, "utf-8"
  );

  return { results, summaryCard };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  runRealWorldProjectsBenchmark().then(({ results, summaryCard }) => {
    console.log("\n=========================================");
    console.log(" 8. Real-World NPM Projects Benchmark");
    console.log("    (Registry.getPackageMetadata() → real npm dep data)");
    console.log("    (Graph.getGraphMap() → real graph population)");
    console.log("    (Constraint.addConstraint() → real conflict detection)");
    console.log("    (Resolver.checkConflict() → resolver conflict tracking)");
    console.log("    (Config: benchmark/config/large-package.json)");
    console.log("=========================================\n");

    const hdr = "Project              Pkgs  Nodes  Edges  Conflicts  Time";
    console.log(hdr);
    console.log("-".repeat(hdr.length));
    for (const r of results) {
      console.log(
        `${r.project.padEnd(20)} ${String(r.packagesFetched).padStart(5)} ` +
        `${String(r.graphNodes).padStart(6)} ${String(r.edgesIngested).padStart(6)} ` +
        `${String(r.conflictsDetected).padStart(9)} ${String(r.formattedTime).padStart(7)}`
      );
    }
    console.log("\nSummary across all projects:");
    console.log(`  Packages fetched   ${summaryCard.totalPackagesFetched}`);
    console.log(`  Total edges        ${summaryCard.totalEdges.toLocaleString()}`);
    console.log(`  Total conflicts    ${summaryCard.totalConflicts}`);
    console.log("\n[SUCCESS] Benchmark result exported to benchmark/8_real_world_projects.csv\n");
  }).catch(err => { console.error("Benchmark 8 failed:", err.message); process.exit(1); });
}
