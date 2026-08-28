import fs from "fs";
import { testBuildGraph , testPrintGraph } from "./test/test_graph.js";
async function main() {
    const s = Date.now();
  const packageJson =
    JSON.parse(
      fs.readFileSync(
        "./package.json",
        "utf-8"
      )
    );

  const dependencies = {
    ...(packageJson.dependencies || {})
  };

  console.log(
    "\nBuilding dependency graph...\n"
  );

  const graph =
  await testBuildGraph(dependencies);

  console.log(
    "\n========== DEPENDENCY GRAPH ==========\n"
  );
  await testPrintGraph(graph);
}

main().catch((error) => {
  console.error("\n❌ Error:", error.message);
});