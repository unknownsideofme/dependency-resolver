import semver from "semver";

export default async function resolveVersion(name, range) {
  const metadata = await this.getPackageMetadata(name);
  const versions = Object.keys(metadata.versions);
  const validVersions = versions.filter(version => semver.satisfies(version, range));

  if (validVersions.length === 0) {
    throw new Error(
      `No version of ${name} satisfies ${range}`
    );
  }

  validVersions.sort(semver.rcompare);

  return validVersions[0];
}