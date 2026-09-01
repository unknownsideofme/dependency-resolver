export function buildResolveCommand(rootDependencies = {}, solution = new Map()) {
  const packages = Object.keys(rootDependencies)
    .filter((packageName) => solution.has(packageName) && solution.get(packageName)?.version)
    .map((packageName) => {
      const version = solution.get(packageName).version;
      const quotedName = packageName.includes(' ') ? `"${packageName}@${version}"` : `${packageName}@${version}`;
      return quotedName;
    });

  if (packages.length === 0) {
    return 'npm install --save';
  }

  return `npm install ${packages.join(' ')} --save`;
}
