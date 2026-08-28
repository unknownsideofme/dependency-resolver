import axios from "axios";
import semver from "semver";

const REGISTRY_URL = "https://registry.npmjs.org";

const metadataCache = new Map();

async function getPackageMetadata(name) {
  if (metadataCache.has(name)) {
    return metadataCache.get(name);
  }

  const url =
    `${REGISTRY_URL}/${encodeURIComponent(name)}`;

  const response = await axios.get(url);

  metadataCache.set(name, response.data);

  return response.data;
}

export async function resolveVersion(name, range) {
  const metadata =
    await getPackageMetadata(name);

  const versions =
    Object.keys(metadata.versions);

  const validVersions =
    versions.filter(version =>
      semver.satisfies(version, range)
    );

  if (validVersions.length === 0) {
    throw new Error(
      `No version of ${name} satisfies ${range}`
    );
  }

  validVersions.sort(semver.rcompare);

  return validVersions[0];
}

export async function getPackageVersion(
  name,
  version
) {
  const metadata =
    await getPackageMetadata(name);

  const packageData =
    metadata.versions[version];

  if (!packageData) {
    throw new Error(
      `${name}@${version} does not exist`
    );
  }

  return packageData;
}

export async function getVersions(name) {
  const metadata =
    await getPackageMetadata(name);

  return Object.keys(metadata.versions);
}