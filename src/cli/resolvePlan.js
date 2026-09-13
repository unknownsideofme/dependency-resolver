import fs from "fs";
import path from "path";
import semver from "semver";

function currentVersion(packageName, requestedRange, projectRoot) {
  const installedPackagePath = path.join(projectRoot, "node_modules", packageName, "package.json");

  if (fs.existsSync(installedPackagePath)) {
    try {
      const installedPackage = JSON.parse(fs.readFileSync(installedPackagePath, "utf-8"));
      if (installedPackage.version) {
        return installedPackage.version;
      }
    } catch {
      // Fall back to the requested range when the installed package metadata is unavailable.
    }
  }

  return semver.minVersion(requestedRange)?.version || requestedRange;
}

function buildInstallCommand(entries) {
  if (entries.length === 0) {
    return "";
  }

  return `npm install ${entries.map(({ pkgName, tarVer }) => `${pkgName}@${tarVer}`).join(" ")} --save`;
}

export function buildResolvePlan(dependencies, solution, projectRoot = process.cwd()) {
  const plan = {
    upgradables: [],
    downgradables: []
  };

  for (const [pkgName, packageData] of solution) {
    const requestedRange = dependencies[pkgName];
    const curVer = currentVersion(pkgName, requestedRange, projectRoot);
    const tarVer = packageData.version;

    if (!semver.valid(curVer) || !semver.valid(tarVer) || semver.eq(curVer, tarVer)) {
      continue;
    }

    const entry = { pkgName, curVer, tarVer };
    if (semver.gt(tarVer, curVer)) {
      plan.upgradables.push(entry);
    } else {
      plan.downgradables.push(entry);
    }
  }

  plan.commands = {
    upgrade: buildInstallCommand(plan.upgradables),
    downgrade: buildInstallCommand(plan.downgradables),
    all: buildInstallCommand([...plan.upgradables, ...plan.downgradables])
  };

  return plan;
}

export function writeResolvePlan(plan, projectRoot = process.cwd()) {
  const planPath = path.join(projectRoot, ".dependency-resolver.json");
  fs.writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf-8");
  return planPath;
}

export function readResolvePlan(projectRoot = process.cwd()) {
  const planPath = path.join(projectRoot, ".dependency-resolver.json");
  if (!fs.existsSync(planPath)) {
    throw new Error(`Resolution plan not found at '${planPath}'. Run the resolver first to create it.`);
  }

  return {
    plan: JSON.parse(fs.readFileSync(planPath, "utf-8")),
    planPath
  };
}
