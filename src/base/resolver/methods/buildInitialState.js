export default async function buildInitialState() {
  for (const [name, range] of Object.entries(this.rootDependencies)) {
    const versions = await this.getValidVersions(name, range);

    if (versions.length === 0) {
      throw new Error(`No version of ${name} satisfies ${range}`);
    }

    await this.selectPackage(name, versions[0], "ROOT");
  }
}
