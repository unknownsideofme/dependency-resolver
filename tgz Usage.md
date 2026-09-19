# node-dep-resolver - Offline Tarball Package

This directory contains the pre-packaged `.tgz` tarball archive for offline installation of `node-dep-resolver`.

---

## 📦 How to Install and Use

### 1. Install the Tarball Package
From any Node.js project directory, install the `.tgz` package into your `node_modules`:

```bash
npm install ./dist/node-dep-resolver-1.1.5.tgz
```

### 2. Run the CLI Tool
Once installed into `node_modules`, execute the CLI command directly:

```bash
npx dep-resolver ./package.json
```

### 3. Programmatic Import (Node.js / ESM)
Import directly into your JavaScript files:

```javascript
import Resolver, { Registry, Graph } from "node-dep-resolver";

const resolver = new Resolver({
  "express": "4.18.2",
  "axios": "^1.7.0"
});

const solution = await resolver.resolve();
console.log(solution);
```
