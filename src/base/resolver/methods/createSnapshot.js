export default function createSnapshot() {
  return {
    selected: new Map(this.selected),
    constraints: new Map(
      [...this.constraints].map(([name, values]) => [
        name,
        values.map(value => ({ ...value }))
      ])
    ),
    conflicts: new Set(this.conflicts)
  };
}
