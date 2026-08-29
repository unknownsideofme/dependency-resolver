import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

let command = "";

const isUnit = args.some((arg) => arg === "--unit" || arg === "--units");
const isE2E = args.some((arg) => arg === "--e2e");
const fileArg = args.find((arg) => !arg.startsWith("--"));

if (fileArg) {
  let targetFile = fileArg;
  if (!fs.existsSync(targetFile)) {
    if (fs.existsSync(path.join("test/unit_tests", fileArg))) {
      targetFile = path.join("test/unit_tests", fileArg);
    } else if (fs.existsSync(path.join("test/unit_tests", `${fileArg}.js`))) {
      targetFile = path.join("test/unit_tests", `${fileArg}.js`);
    } else if (fs.existsSync(path.join("test/e2e", fileArg))) {
      targetFile = path.join("test/e2e", fileArg);
    } else if (fs.existsSync(path.join("test/e2e", `${fileArg}.js`))) {
      targetFile = path.join("test/e2e", `${fileArg}.js`);
    }
  }
  command = `node --test ${targetFile}`;
} else if (isUnit) {
  command = `node --test test/unit_tests/*.js`;
} else if (isE2E) {
  command = `node --test test/e2e/*.js`;
} else {
  // Default: Run all Unit Tests + E2E Tests
  command = `node --test test/unit_tests/*.js test/e2e/*.js`;
}

const child = spawn(command, { shell: true, stdio: "inherit" });
child.on("exit", (code) => {
  process.exit(code || 0);
});
