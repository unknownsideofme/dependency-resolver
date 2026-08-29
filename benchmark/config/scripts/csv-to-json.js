/**
 * csv-to-json.js
 *
 * Reads all 11 benchmark CSVs from benchmark/data/ and converts them into a
 * single structured JSON file at benchmark/data/metrics.json.
 *
 * The output JSON is shaped for charting libraries (Chart.js, Recharts, D3, etc.):
 *   - Each benchmark has a `rows` array of plain objects
 *   - Multi-series benchmarks also get a `chart` block with `labels` + `datasets`
 *   - Key-value benchmarks (5, 6, 10) get a `summary` object of typed values
 *
 * Usage:
 *   node benchmark/config/scripts/csv-to-json.js
 */

import fs from "fs";
import path from "path";

const DATA_DIR   = path.resolve("benchmark/data");
const OUTPUT     = path.resolve("benchmark/data/metrics.json");

// ── CSV helpers ──────────────────────────────────────────────────────────────

function parseCSV(filePath) {
  const text    = fs.readFileSync(filePath, "utf-8").trim();
  const lines   = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCSVLine(lines[0]);
  const rows    = lines.slice(1).map(line => {
    const cells = splitCSVLine(line);
    const obj   = {};
    headers.forEach((h, i) => {
      obj[h] = coerce(cells[i] ?? "");
    });
    return obj;
  });

  return { headers, rows };
}

function splitCSVLine(line) {
  const result = [];
  let current  = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

/** Convert a string cell to number if possible, else keep as string */
function coerce(val) {
  if (val === "" || val === "-") return null;
  const stripped = val.replace(/[%,xms]/g, "").trim();
  const n = Number(stripped);
  return isNaN(n) ? val : n;
}

// ── Per-benchmark chart builders ─────────────────────────────────────────────

/**
 * Build a chart block:
 *   labels   – x-axis values (one column)
 *   datasets – array of { label, data[] }
 */
function toLineChart(rows, labelCol, seriesCols) {
  return {
    labels:   rows.map(r => r[labelCol]),
    datasets: seriesCols.map(col => ({
      label: col,
      data:  rows.map(r => r[col])
    }))
  };
}

function toBarChart(rows, labelCol, seriesCols) {
  return toLineChart(rows, labelCol, seriesCols);
}

/** For key-value CSVs (Metric, Value) → plain object */
function toSummary(rows) {
  const out = {};
  for (const row of rows) {
    const keys = Object.keys(row);
    if (keys.length >= 2) {
      const key = String(row[keys[0]]);
      out[key]  = row[keys[1]];
    }
  }
  return out;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const meta = {
  generatedAt: new Date().toISOString(),
  source: "benchmark/data/*.csv",
  description: "Benchmark metrics for the node-dep-resolver dependency resolver"
};

const benchmarks = {};

// ── 1. Graph Construction ────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "1_graph_construction.csv"));
  benchmarks["graphConstruction"] = {
    id: 1,
    name: "Graph Construction",
    description: "Time and memory to build the dependency graph for N packages",
    rows,
    chart: toLineChart(rows, "Packages", ["Edges", "Time (ms)", "Memory (MB)"])
  };
}

// ── 2. Constraint Processing ─────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "2_constraint_processing.csv"));
  benchmarks["constraintProcessing"] = {
    id: 2,
    name: "Constraint Processing (Naive vs. Indexed)",
    description: "Conflict detection time: O(n²) naive scan vs O(1) indexed Map",
    rows,
    chart: toLineChart(rows, "Constraint Count", ["Naive Time (ms)", "Indexed Time (ms)"])
  };
}

// ── 3. Registry / Cache ───────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "3_registry_cache.csv"));
  // This CSV has multiple sections; group by "Mode" column if present, else keep rows
  benchmarks["registryCache"] = {
    id: 3,
    name: "Registry Cache Efficiency",
    description: "Registry request count, cache hit ratio, and fetch time with/without cache",
    rows,
    chart: rows.length > 2
      ? toBarChart(rows, "Metric", ["No Cache", "Cached"])
      : null,
    summary: toSummary(rows)
  };
}

// ── 4. Backtracking ───────────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "4_backtracking.csv"));
  benchmarks["backtracking"] = {
    id: 4,
    name: "Backtracking",
    description: "Conflicts, candidates explored, and backtracks per resolution scenario",
    rows,
    chart: toBarChart(rows, "Scenario", ["Conflicts", "Candidates", "Backtracks"])
  };
}

// ── 5. Candidate Pruning ─────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "5_candidate_pruning.csv"));
  benchmarks["candidatePruning"] = {
    id: 5,
    name: "Candidate Pruning",
    description: "Real-world constraint ingestion and search space reduction via generateCandidates()",
    rows,
    summary: toSummary(rows)
  };
}

// ── 6. Resolution Quality ─────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "6_resolution_quality.csv"));
  benchmarks["resolutionQuality"] = {
    id: 6,
    name: "Resolution Quality",
    description: "Conflict classification, solution ranking, and upgrade impact analysis",
    rows,
    summary: toSummary(rows)
  };
}

// ── 7. Capability Matrix ───────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "7_capability_matrix.csv"));
  benchmarks["capabilityMatrix"] = {
    id: 7,
    name: "Capability Comparison (vs npm)",
    description: "Feature-by-feature comparison between npm and this resolver",
    rows
    // No chart — boolean/string values are better shown as a table
  };
}

// ── 8. Real-World Projects ────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "8_real_world_projects.csv"));
  benchmarks["realWorldProjects"] = {
    id: 8,
    name: "Real-World NPM Projects",
    description: "Graph construction, constraint ingestion, and conflict detection across project profiles",
    rows,
    chart: toBarChart(rows, "Project", ["Edges", "Conflicts", "Total (ms)"])
  };
}

// ── 9. Accuracy / Correctness ─────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "9_accuracy_correctness.csv"));
  benchmarks["accuracyCorrectness"] = {
    id: 9,
    name: "Accuracy / Correctness Corpus",
    description: "Pass/fail results across 160 correctness test cases",
    rows,
    chart: toBarChart(rows, "Test Suite", ["Total", "Passed", "Failed"])
  };
}

// ── 10. Fuzz Testing ──────────────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "10_fuzz_testing.csv"));
  benchmarks["fuzzTesting"] = {
    id: 10,
    name: "Fuzz Testing Engine",
    description: "10,000 randomly generated graphs — invalid solutions accepted, conflicts discovered",
    rows,
    summary: toSummary(rows)
  };
}

// ── 11. Resolution Complexity ─────────────────────────────────────────────────
{
  const { rows } = parseCSV(path.join(DATA_DIR, "11_resolution_complexity.csv"));
  benchmarks["resolutionComplexity"] = {
    id: 11,
    name: "Resolution Complexity Profiling",
    description: "Candidates, backtracks, and wall time across Simple → Adversarial scenarios",
    rows,
    chart: toLineChart(rows, "Scenario", ["Conflicts", "Candidates", "Backtracks", "Pruned", "Time (ms)"])
  };
}

// ── Write output ───────────────────────────────────────────────────────────────
const output = { meta, benchmarks };
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf-8");

console.log(`\nmetrics.json written → ${OUTPUT}`);
console.log(`  Benchmarks: ${Object.keys(benchmarks).length}`);
console.log(`  Size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB\n`);

// Print a quick table of what's inside
for (const [key, b] of Object.entries(benchmarks)) {
  const rowCount = b.rows?.length ?? 0;
  const hasChart = b.chart ? "✓ chart" : "      ";
  const hasSummary = b.summary ? "✓ summary" : "";
  console.log(`  ${String(b.id).padStart(2)}. ${b.name.padEnd(40)} ${rowCount} rows  ${hasChart}  ${hasSummary}`);
}
console.log("");
