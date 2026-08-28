import {
  resolveVersion,
  getPackageVersion
} from "./registry.js";

import {
  addConstraint,
  getConstraints,
  getConflicts
} from "./constraint.js";

export const buildGraph = async (rootDependencies) => {

  const graph = new Map();

  async function visit(
    name,
    range,
    requestedBy
  ) {

    console.log(
      `Resolving ${name} ${range}...`
    );

    // Record constraint immediately
    addConstraint(
      name,
      range,
      requestedBy
    );

    const version =
      await resolveVersion(
        name,
        range
      );

    const key = `${name}@${version}`;

    // Already processed?
    if (graph.has(key)) {
      return;
    }

    const packageData =
      await getPackageVersion(
        name,
        version
      );

    const node = {
      name,
      version,
      dependencies:
        packageData.dependencies || {}
    };

    graph.set(key, node);

    // Visit dependencies
    for (
      const [
        dependencyName,
        dependencyRange
      ]
      of Object.entries(node.dependencies)
    ) {

      await visit(
        dependencyName,
        dependencyRange,
        `${name}@${version}`
      );
    }
  }

  // Root dependencies
  for (
    const [
      name,
      range
    ]
    of Object.entries(rootDependencies)
  ) {

    await visit(
      name,
      range,
      "ROOT"
    );
  }

  return graph;
}

export const printGraph = (graph) => {
  for (const [key, node] of graph) {
    console.log(key);
    for (const [name, range] of Object.entries(node.dependencies)) {
      console.log(`  └── ${name} ${range}`);
    }
    console.log();
  }

  const constraints = getConstraints();
  const conflicts = getConflicts();

  if (constraints.size > 0) {
    console.log("========== CONSTRAINTS & CONFLICTS ==========\n");
    for (const [depName, state] of constraints) {
      const status = state.conflict ? "❌ CONFLICT" : "✅ OK";
      console.log(`${depName} [${status}]`);
      for (const r of state.constraints) {
        console.log(`  └── requested ${r.range} by ${r.requester}`);
      }
      console.log();
    }

    if (conflicts.size > 0) {
      console.log(`⚠️ Conflicts detected in ${conflicts.size} package(s): ${Array.from(conflicts).join(", ")}\n`);
    }
  }
}