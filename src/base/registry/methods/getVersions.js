export default async function getVersions(name) {
  const metadata = await this.getPackageMetadata(name);

  return Object.keys(metadata.versions);
}
