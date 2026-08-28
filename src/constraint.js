import semver from "semver";

const constraints = new Map();
const conflicts = new Set();

export const addConstraint = ( dependencyName , dependencyRange , requestedBy ) => {
  // First time seeing this dependency
  if (!constraints.has(dependencyName)) {
    constraints.set(dependencyName, {
      ranges: [
        {
          range: dependencyRange,
          requestedBy
        }
      ],

      conflict: false
    });

    return;
  }

  const state = constraints.get(dependencyName);

  // Check the new range against the existing
  // combined constraint.
  const compatible = state.ranges.every((existing) =>
    semver.intersects(
      existing.range,
      dependencyRange
    )
  );

  if (!compatible) {
    state.conflict = true;

    conflicts.add(dependencyName);
  }

  state.ranges.push({
    range: dependencyRange,
    requestedBy
  });
}

export function getConstraints() {
  return constraints;
}

export function getConflicts() {
  return conflicts;
}