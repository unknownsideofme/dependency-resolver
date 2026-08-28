import axios from "axios";
import semver from "semver";

const REGISTRY_URL = "https://registry.npmjs.org";

export async function getPackageMetadata(name) {
  const url = `${REGISTRY_URL}/${encodeURIComponent(name)}`;

  const response = await axios.get(url);

  return response.data;
}

export async function resolveVersion(name, range) {
  const metadata = await getPackageMetadata(name);

  const versions = Object.keys(metadata.versions);

  const validVersions = versions.filter((version) =>
    semver.satisfies(version, range)
  );

  if (validVersions.length === 0) {
    throw new Error(
      `No version of ${name} satisfies ${range}`
    );
  }

  // Newest valid version first
  validVersions.sort(semver.rcompare);

  return validVersions[0];
}

export async function getPackageVersion(name, version) {
  const metadata = await getPackageMetadata(name);

  const packageData = metadata.versions[version];

  if (!packageData) {
    throw new Error(
      `${name}@${version} does not exist`
    );
  }

  return packageData;
}