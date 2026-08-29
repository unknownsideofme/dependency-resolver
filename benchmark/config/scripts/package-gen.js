/**
 * package-gen.js
 *
 * Uses BFS from a set of well-known seed packages to discover 5,000 real npm
 * packages and their real dependency trees.
 *
 * Approach:
 *   1. Start from ~30 well-known seed package names.
 *   2. For each, call GET https://registry.npmjs.org/<name>/latest to get the
 *      latest version document (includes real dependencies).
 *   3. Enqueue every discovered dependency name for future fetching.
 *   4. Repeat until 5,000 packages collected.
 *
 * Concurrency: 8 parallel requests, 100ms between batches.
 * Writes to benchmark/config/large-package.json.
 */

import axios from "axios";
import fs from "fs";
import path from "path";

const TARGET      = 5000;
const CONCURRENCY = 8;
const DELAY_MS    = 100;
const REGISTRY    = "https://registry.npmjs.org";
const OUTPUT_PATH = path.resolve(process.cwd(), "benchmark/config/large-package.json");

// Well-known seeds — broad coverage across npm ecosystem branches
const SEEDS = [
  // Frontend frameworks & meta-frameworks
  "react", "react-dom", "vue", "svelte", "solid-js", "preact", "inferno",
  "next", "nuxt", "gatsby", "remix", "@sveltejs/kit", "astro",
  "angular", "@angular/core", "@angular/common", "@angular/router",

  // State management
  "redux", "react-redux", "@reduxjs/toolkit", "zustand", "mobx", "recoil",
  "jotai", "valtio", "xstate", "immer", "pinia",

  // Routing
  "react-router", "react-router-dom", "vue-router", "wouter", "history",

  // HTTP / networking
  "axios", "got", "node-fetch", "superagent", "ky", "cross-fetch",
  "isomorphic-fetch", "undici", "needle", "request",

  // Build tools / bundlers
  "webpack", "vite", "rollup", "esbuild", "parcel", "turbopack",
  "@babel/core", "@babel/preset-env", "@babel/preset-react",
  "@babel/preset-typescript", "babel-loader", "ts-loader",
  "webpack-dev-server", "webpack-cli", "webpack-merge",
  "css-loader", "style-loader", "sass-loader", "less-loader",
  "file-loader", "url-loader", "html-webpack-plugin",
  "mini-css-extract-plugin", "copy-webpack-plugin",
  "terser-webpack-plugin", "optimize-css-assets-webpack-plugin",

  // TypeScript & tooling
  "typescript", "ts-node", "tsx", "tsc-alias",
  "@types/node", "@types/react", "@types/react-dom",
  "@types/lodash", "@types/jest", "@types/mocha",

  // Linting & formatting
  "eslint", "prettier", "@typescript-eslint/parser",
  "@typescript-eslint/eslint-plugin", "eslint-plugin-react",
  "eslint-plugin-import", "eslint-config-prettier",
  "eslint-plugin-jsx-a11y", "eslint-plugin-react-hooks",
  "stylelint", "stylelint-config-standard",

  // Testing
  "jest", "vitest", "mocha", "chai", "sinon", "jasmine", "ava", "tap",
  "@testing-library/react", "@testing-library/dom", "@testing-library/jest-dom",
  "puppeteer", "playwright", "cypress", "selenium-webdriver",
  "supertest", "nock", "msw", "faker", "@faker-js/faker",
  "jest-environment-jsdom", "ts-jest", "babel-jest",

  // Server frameworks
  "express", "fastify", "koa", "hapi", "@hapi/hapi",
  "@nestjs/core", "@nestjs/common", "@nestjs/platform-express",
  "restify", "polka", "micro", "feathers",

  // Databases & ORMs
  "mongodb", "mongoose", "pg", "pg-pool", "mysql2", "mysql",
  "sequelize", "prisma", "@prisma/client", "typeorm", "knex",
  "redis", "ioredis", "sqlite3", "better-sqlite3", "nedb",
  "lowdb", "level", "keyv",

  // Auth & security
  "jsonwebtoken", "bcrypt", "bcryptjs", "passport", "passport-local",
  "passport-jwt", "express-session", "cookie-parser", "cors",
  "helmet", "rate-limiter-flexible", "csrf", "express-validator",

  // Utilities
  "lodash", "ramda", "underscore", "lazy.js",
  "date-fns", "moment", "dayjs", "luxon",
  "uuid", "nanoid", "shortid", "cuid",
  "dotenv", "dotenv-expand", "cross-env", "env-cmd",
  "chalk", "colors", "kleur", "picocolors", "ansi-colors",
  "ora", "inquirer", "prompts", "enquirer", "cliffy",
  "commander", "yargs", "minimist", "meow", "caporal",
  "debug", "winston", "pino", "bunyan", "log4js",
  "fs-extra", "glob", "fast-glob", "rimraf", "mkdirp",
  "chokidar", "nodemon", "concurrently", "npm-run-all",

  // Async / functional
  "rxjs", "bluebird", "async", "p-map", "p-limit", "p-queue",
  "p-retry", "bottleneck", "throat",

  // Validation / schema
  "zod", "yup", "joi", "class-validator", "ajv", "ajv-keywords",
  "fastest-validator", "superstruct",

  // Realtime / websockets
  "socket.io", "socket.io-client", "ws", "uws", "sockjs",
  "@nestjs/websockets",

  // GraphQL
  "graphql", "apollo-server", "apollo-client", "@apollo/client",
  "apollo-server-express", "graphql-tag", "graphql-tools",
  "type-graphql", "nexus", "pothos",

  // UI component libraries
  "@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled",
  "antd", "@ant-design/icons", "bootstrap", "reactstrap",
  "tailwindcss", "autoprefixer", "postcss",
  "styled-components", "styled-system", "@stitches/react",
  "chakra-ui", "@chakra-ui/react", "mantine", "@mantine/core",
  "radix-ui", "@radix-ui/react-dialog", "shadcn-ui",

  // Animation
  "framer-motion", "react-spring", "react-motion", "gsap", "animejs",
  "lottie-web", "react-lottie",

  // Forms
  "react-hook-form", "formik", "final-form", "react-final-form",

  // Drag & drop
  "react-dnd", "react-beautiful-dnd", "dnd-kit", "@dnd-kit/core",

  // Tables / data grid
  "react-table", "@tanstack/react-table", "ag-grid-react", "ag-grid-community",

  // Charts / visualization
  "recharts", "chart.js", "react-chartjs-2", "d3", "victory",
  "plotly.js", "highcharts", "apexcharts",

  // Maps
  "leaflet", "react-leaflet", "mapbox-gl", "@deck.gl/core",

  // Rich text / markdown
  "slate", "draft-js", "quill", "tiptap", "@tiptap/react",
  "react-quill", "marked", "remark", "rehype", "unified",
  "gray-matter", "front-matter",

  // Image / media
  "sharp", "jimp", "canvas", "fabric",
  "react-player", "video.js",

  // Cloud / infrastructure
  "aws-sdk", "@aws-sdk/client-s3", "@aws-sdk/client-dynamodb",
  "firebase", "firebase-admin", "@google-cloud/storage",
  "@azure/storage-blob",

  // Serverless
  "serverless", "@serverless/toolkit", "netlify-lambda",

  // Next.js ecosystem
  "next-auth", "next-seo", "next-images", "next-pwa",

  // Monorepo / workspace tools
  "lerna", "nx", "turborepo", "@changesets/cli",

  // Package utilities
  "semver", "validate-npm-package-name", "npm-registry-fetch",

  // Node.js utilities
  "os", "path", "fs", "stream", "events", "child_process",
  "execa", "cross-spawn", "which", "shebang-command",
  "yaml", "js-yaml", "toml", "dotenv",

  // Crypto / security
  "crypto-js", "node-forge", "openpgp", "tweetnacl",

  // Testing utilities
  "jest-each", "jest-circus", "jest-mock", "expect", "assert",
  "should", "power-assert",

  // API mocking
  "json-server", "mirage", "express-mock-middleware",

  // CLI utilities
  "boxen", "table", "cli-table3", "listr", "listr2",

  // File format
  "xlsx", "csv-parse", "csv-stringify", "papaparse",
  "pdfkit", "puppeteer-pdf",

  // Email
  "nodemailer", "sendgrid", "@sendgrid/mail",

  // Queue / jobs
  "bull", "bullmq", "bee-queue", "agenda", "node-cron",

  // i18n
  "i18next", "react-i18next", "vue-i18n", "lingui",

  // Error tracking
  "@sentry/node", "@sentry/react", "@sentry/browser",

  // Performance / profiling
  "clinic", "autocannon", "benchmark",

  // Misc popular
  "lodash-es", "core-js", "regenerator-runtime", "tslib",
  "classnames", "clsx", "prop-types", "invariant",
  "hoist-non-react-statics", "react-is", "scheduler",
  "loose-envify", "object-assign",
  "mime", "mime-types", "content-type",
  "qs", "query-string", "url-parse",
  "form-data", "multiparty", "busboy",
  "tar", "archiver", "adm-zip", "jszip",
  "cheerio", "jsdom", "parse5",
  "xml2js", "fast-xml-parser", "node-html-parser",
  "socket.io-redis", "connect-redis", "express-rate-limit"
];

const collected   = new Map();  // name -> full package entry
const queue       = new Set(SEEDS);
const failedNames = new Set();

async function fetchPackage(name) {
  const url = `${REGISTRY}/${encodeURIComponent(name)}/latest`;
  try {
    const res = await axios.get(url, { timeout: 12000 });
    const d   = res.data;
    if (!d?.name || !d?.version) return null;
    return {
      name:                 d.name,
      version:              d.version,
      dependencies:         d.dependencies         || {},
      devDependencies:      d.devDependencies       || {},
      peerDependencies:     d.peerDependencies      || {},
      optionalDependencies: d.optionalDependencies  || {}
    };
  } catch (_) {
    return null;
  }
}

function enqueueDeps(pkg) {
  // Follow all dep types to maximise discovery breadth
  const allDeps = [
    ...Object.keys(pkg.dependencies         || {}),
    ...Object.keys(pkg.devDependencies      || {}),
    ...Object.keys(pkg.peerDependencies     || {}),
    ...Object.keys(pkg.optionalDependencies || {})
  ];
  for (const dep of allDeps) {
    if (!collected.has(dep) && !failedNames.has(dep)) queue.add(dep);
  }
}

console.log(`Starting BFS from ${SEEDS.length} seed packages...`);
let batchNum = 0;

while (collected.size < TARGET && queue.size > 0) {
  const batch = [...queue].slice(0, CONCURRENCY);
  batch.forEach(n => queue.delete(n));
  batchNum++;

  const results = await Promise.all(batch.map(n => fetchPackage(n)));

  for (let i = 0; i < batch.length; i++) {
    const name   = batch[i];
    const result = results[i];
    if (result) {
      collected.set(name, result);
      enqueueDeps(result);
    } else {
      failedNames.add(name);
    }
  }

  if (batchNum % 25 === 0 || collected.size >= TARGET) {
    console.log(
      `  batch ${batchNum} | collected: ${collected.size} | queue: ${queue.size} | failed: ${failedNames.size}`
    );
    // Checkpoint write every 25 batches
    const snapshot = {
      generatedAt:  new Date().toISOString(),
      packageCount: collected.size,
      packages:     [...collected.values()]
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2), "utf-8");
  }

  if (queue.size > 0 && collected.size < TARGET) {
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
}

const finalList = [...collected.values()].slice(0, TARGET);
const output = {
  generatedAt:  new Date().toISOString(),
  packageCount: finalList.length,
  packages:     finalList
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");

const withDeps = finalList.filter(p => Object.keys(p.dependencies).length > 0).length;
console.log(`\nDone. ${finalList.length} packages written to ${OUTPUT_PATH}`);
console.log(`  Packages with real dependencies: ${withDeps} / ${finalList.length}`);