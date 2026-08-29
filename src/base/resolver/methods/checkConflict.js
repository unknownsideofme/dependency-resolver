import semver from "semver";

export default function checkConflict(name) {
  const requirements = this.constraints.get(name);

  if (!requirements) {
    return;
  }

  for (let i = 0; i < requirements.length; i++) {
    for (let j = i + 1; j < requirements.length; j++) {
      if (!semver.intersects(requirements[i].range, requirements[j].range)) {
        this.conflicts.add(name);
        return;
      }
    }
  }

  this.conflicts.delete(name);
}
