export default function getFirstConflict() {
  for (const packageName of this.conflicts) {
    return {
      packageName,
      constraints: this.constraints.get(packageName)
    };
  }

  return null;
}
