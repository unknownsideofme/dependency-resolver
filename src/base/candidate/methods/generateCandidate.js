import semver from "semver";

export default async function generateCandidates(conflict) {
  const candidates = [];
  const packageName = conflict.packageName;
  const registry = this.registry;

  for (const requirement of conflict.constraints) {
    const requester = requirement.requester;
    const requesterParts = requester.split("@");
    const requesterName = requesterParts[0];
    const currentVersion = requesterParts.slice(1).join("@");

    console.log(`\nLooking for alternatives for ${requester}`);

    const versions = await registry.getVersions(requesterName);

    for (const version of versions) {
      if (version === currentVersion) {
        continue;
      }

      const packageData = await registry.getPackageVersion(
        requesterName,
        version
      );

      const dependencies = packageData.dependencies || {};

      if (!dependencies[packageName]) {
        candidates.push({
          packageName: requesterName,
          oldVersion: currentVersion,
          newVersion: version,
          reason: `No longer depends on ${packageName}`
        });

        continue;
      }

      const newRange = dependencies[packageName];
      let compatible = true;

      for (const other of conflict.constraints) {
        if (other.requester === requester) {
          continue;
        }

        if (!semver.intersects(newRange, other.range)) {
          compatible = false;
          break;
        }
      }

      if (compatible) {
        candidates.push({
          packageName: requesterName,
          oldVersion: currentVersion,
          newVersion: version,
          reason:
            `${requesterName}@${version} requires ` +
            `${packageName} ${newRange}`
        });
      }
    }
  }

  candidates.sort((a, b) => {
    return semver.compare(a.newVersion, a.oldVersion);
  });

  return candidates;
}
