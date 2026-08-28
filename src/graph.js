import {
  resolveVersion,
  getPackageVersion
} from "./registry.js";

export const buildGraph = async (rootDependencies) => {

  const graph = new Map();

  const visit = async (name, range) => {

    console.log(
      `Resolving ${name} ${range}...`
    );

    // Find a real version satisfying the range
    const version =
      await resolveVersion(name, range);

    const key = `${name}@${version}`;

    // Already visited?
    if (graph.has(key)) {
      return;
    }

    // Get metadata for this exact version
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

    // Recursively visit dependencies
    for (
      const [dependencyName, dependencyRange]
      of Object.entries(node.dependencies)
    ) {

      await visit(
        dependencyName,
        dependencyRange
      );
    }
  }

  // Start from application's dependencies
  for (
    const [name, range]
    of Object.entries(rootDependencies)
  ) {

    await visit(name, range);
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
}