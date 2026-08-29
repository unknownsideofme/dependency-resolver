export default function restoreSnapshot(snapshot) {
  this.selected = new Map(snapshot.selected);
  this.constraints = new Map(
    [...snapshot.constraints].map(([name, values]) => [
      name,
      values.map(value => ({ ...value }))
    ])
  );
  this.conflicts = new Set(snapshot.conflicts);
}
