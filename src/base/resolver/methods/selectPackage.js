export default async function selectPackage(name, version, requestedBy) {
  this.selected.set(name, {
    name,
    version,
    requestedBy
  });

  const packageData = await this.registry.getPackageVersion(name, version);

  const dependencies = packageData.dependencies || {};

  for (const [dependencyName, dependencyRange] of Object.entries(dependencies)) {
    this.addConstraint(
      dependencyName,
      dependencyRange,
      `${name}@${version}`
    );
  }
}
