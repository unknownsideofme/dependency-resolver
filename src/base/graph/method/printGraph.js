import {
  getConstraints,
  getConflicts
} from "../../../rudimentary/constraint.js";

export default function printGraph(graph) {
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
