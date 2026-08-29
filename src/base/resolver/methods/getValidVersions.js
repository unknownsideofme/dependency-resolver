import semver from "semver";

export default async function getValidVersions(name, range) {
  const versions = await this.registry.getVersions(name);

  return versions
    .filter(version => semver.satisfies(version, range))
    .sort(semver.rcompare);
}
