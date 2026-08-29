export default async function search() {
  const conflict = this.getFirstConflict();

  if (!conflict) {
    console.log("\n✅ Valid dependency tree found.");
    return new Map(this.selected);
  }

  console.log(`\n❌ Conflict: ${conflict.packageName}`);

  const candidates = await this.candidates.generateCandidates(conflict);

  for (const candidate of candidates) {
    console.log(`Trying ${candidate.packageName}@${candidate.newVersion}`);

    const snapshot = this.createSnapshot();

    try {
      await this.selectPackage(
        candidate.packageName,
        candidate.newVersion,
        "RESOLUTION"
      );

      const result = await this.search();

      if (result) {
        return result;
      }
    } catch (error) {
      console.log(error.message);
    }

    this.restoreSnapshot(snapshot);
    console.log("↩️ Backtracking...");
  }

  return null;
}
