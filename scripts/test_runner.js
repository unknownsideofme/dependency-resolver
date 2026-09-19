import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);

let testFiles = [];

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
  testFiles = [targetFile];
} else if (isUnit) {
  testFiles = fs.readdirSync("test/unit_tests")
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join("test/unit_tests", file));
} else if (isE2E) {
  testFiles = fs.readdirSync("test/e2e")
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join("test/e2e", file));
} else {
  // Default: Run all Unit Tests + E2E Tests
  testFiles = [
    ...fs.readdirSync("test/unit_tests")
      .filter((file) => file.endsWith(".js"))
      .map((file) => path.join("test/unit_tests", file)),
    ...fs.readdirSync("test/e2e")
      .filter((file) => file.endsWith(".js"))
      .map((file) => path.join("test/e2e", file))
  ];
}

const child = spawn("node", ["--test", ...testFiles], { stdio: "inherit" });
child.on("exit", (code) => {
  process.exit(code || 0);
});


/// This is a test comment to create a new pr ////