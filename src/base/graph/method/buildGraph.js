import {
  resolveVersion,
  getPackageVersion
} from "../../../registry.js";

import {
  addConstraint
} from "../../../constraint.js";

export default async function buildGraph(rootDependencies) {
  const graph = new Map();

  async function visit(
    name,
    range,
    requestedBy
  ) {
    console.log(`Resolving ${name} ${range}...`);

    addConstraint(
      name,
      range,
      requestedBy
    );

    const version = await resolveVersion(
      name,
      range
    );

    const key = `${name}@${version}`;

    if (graph.has(key)) {
      return;
    }

    const packageData = await getPackageVersion(
      name,
      version
    );

    const node = {
      name,
      version,
      dependencies: packageData.dependencies || {}
    };

    graph.set(key, node);

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
