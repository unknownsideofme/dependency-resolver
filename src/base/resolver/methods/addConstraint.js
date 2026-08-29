export default function addConstraint(name, range, requester) {
  if (!this.constraints.has(name)) {
    this.constraints.set(name, []);
  }

  this.constraints.get(name).push({
    requester,
    range
  });

  this.checkConflict(name);
}
