import semver from "semver";

const constraints = new Map();

const conflicts = new Set();

export function addConstraint(
  dependencyName,
  dependencyRange,
  requestedBy
) {

  if (!constraints.has(dependencyName)) {

    constraints.set(
      dependencyName,
      {
        constraints: [],
        conflict: false
      }
    );
  }

  const state =
    constraints.get(dependencyName);

  // Avoid duplicate constraints
  const alreadyExists =
    state.constraints.some(
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

export function getConstraints() {
  return constraints;
}

export function getConflicts() {
  return conflicts;
}