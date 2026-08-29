# node-dep-resolver

> A lightweight, transparent JavaScript dependency graph builder and semver conflict resolution engine with backtracking search.

[![npm version](https://img.shields.io/npm/v/node-dep-resolver.svg)](https://www.npmjs.com/package/node-dep-resolver)
[![license](https://img.shields.io/npm/l/node-dep-resolver.svg)](https://github.com/unknownsideofme/dependency-resolver/blob/main/LICENSE)

`node-dep-resolver` analyzes package dependencies, constructs visual dependency trees, highlights version conflicts across transitive packages, and uses a backtracking algorithm to find compatible resolution trees.

---

## Features

- **Dependency Graph Visualization**: Recursively traces root and transitive dependencies, rendering clear ASCII tree structures.
- **Semver Conflict Detection**: Identifies overlapping or incompatible version constraints requested across different packages.
- **Backtracking Resolution Engine**: Evaluates alternative candidate package versions to automatically resolve conflicts.
- **CLI & Programmatic Library**: Use instantly via `npx node-dep-resolver` or import into Node.js ES Module projects.

---

## Installation & CLI Usage

You can run the CLI directly on any `package.json` file:

```bash
npx node-dep-resolver ./package.json
```

Or install it globally:

```bash
npm install -g node-dep-resolver
dep-resolver ./package.json
```

### CLI Output Preview

```text
[INFO] Analyzing dependencies from './package.json'...

--- Building Dependency Graph ---
express@4.18.2
  └── accept-hosts ^1.3.8
  └── send 0.18.0

ms [CONFLICT]
  └── requested 2.1.3 by send@0.18.0
  └── requested 2.0.0 by debug@2.6.9

[WARNING] Conflicts detected in 2 package(s): ms, debug

--- Resolving Conflicts ---
Starting resolution...

[SUCCESS] Valid dependency tree found.

========== RESOLVED DEPENDENCY SOLUTION ==========

  [OK] express: 4.18.2 (satisfies requested range '4.18.2')
  [OK] express-rate-limit: 7.5.0 (satisfies requested range '7.5.0')
  [UPGRADE] axios: 1.7.0 -> 1.20.0 (satisfies requested range '^1.7.0')
```

---

## Programmatic Usage (Node.js / ESM)

Install as a dependency in your Node.js project:

```bash
npm install node-dep-resolver
```

### Resolving Dependencies Programmatically

```javascript
import Resolver, { Registry, Graph } from "node-dep-resolver";

const rootDependencies = {
  "express": "4.18.2",
  "express-rate-limit": "7.5.0",
  "axios": "^1.7.0"
};

// 1. Resolve conflicts
const resolver = new Resolver(rootDependencies);
const solution = await resolver.resolve();

for (const [packageName, data] of solution) {
  console.log(`${packageName}@${data.version}`);
}

// 2. Fetch registry metadata
const registry = new Registry();
const resolvedVersion = await registry.resolveVersion("axios", "^1.0.0");
console.log(`Resolved axios version: ${resolvedVersion}`);
```

---

## Architecture

Built with a modular, Object-Oriented design:

- **`Registry`**: Manages NPM registry HTTP requests and caches package version metadata.
- **`Constraint`**: Tracks requested Semver ranges per dependency and detects overlaps.
- **`Conflict`**: Maintains state sets of active dependency conflicts.
- **`Candidates`**: Generates candidate alternative versions for conflicting transitive dependencies.
- **`Graph`**: Constructs and formats dependency hierarchy trees.
- **`Resolver`**: Orchestrates state snapshots and backtracking resolution search.

---

## License

MIT (c) [debanjan](https://github.com/unknownsideofme/dependency-resolver)
