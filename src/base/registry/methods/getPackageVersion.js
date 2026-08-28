export default async function getPackageVersion(name, version) {
  const metadata = await this.getPackageMetadata(name);

  const packageData = metadata.versions[version];

  if (!packageData) {
    throw new Error(
      `${name}@${version} does not exist`
    );
  }

  return packageData;
}
