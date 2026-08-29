import semver from "semver";

export function addConstraint(
  dependencyName,
  dependencyRange,
  requestedBy
) {
  if(dependencyName === null || dependencyName == ""){
    throw new Error("Dependency name cannot be null or empty");
  }
  if( dependencyRange === null || dependencyRange == ""){
    throw new Error("Dependency range cannot be null or empty");
  }
  if( requestedBy === null || requestedBy == ""){
    throw new Error("Requested by cannot be null or empty");
  }
  let constraints = this.getConstraints() ; 
  let conflicts = this.getConflicts() ;
  if (!constraints.has(dependencyName)) {

    constraints.set(
      dependencyName,
      {
        constraints: [],
        conflict: false
      }
    );
  }

  const state = constraints.get(dependencyName);

  // Avoid duplicate constraints
  const alreadyExists = state.constraints.some(
      item =>
        item.requester === requestedBy &&
        item.range === dependencyRange
    );

  if (alreadyExists) {
    return;
  }

  // Check against existing constraints
  for (
    const existing
    of state.constraints
  ) {

    const compatible =
      semver.intersects(
        existing.range,
        dependencyRange
      );

    if (!compatible) {

      state.conflict = true;

      conflicts.add(
        dependencyName
      );
    }
  }

  state.constraints.push({
    requester: requestedBy,
    range: dependencyRange
  });
}