import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { platform } from "node:process";
import pkg from "../package.json" with { type: "json" };
import { startServer } from "./server";

const VERSION = pkg.version;

const rawArgs = process.argv.slice(2);

if (rawArgs.includes("--version") || rawArgs.includes("-V")) {
  console.log(`md-watch v${VERSION}`);
  process.exit(0);
}

if (rawArgs.length === 0 || rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`\
md-watch v${VERSION} — local Markdown preview with live reload

Usage:
  md <file.md> [options]

Options:
  -p, --port <n>     Port to listen on (default: 8123, or the next free one;
                     0 picks any free port)
      --host <addr>  Address to bind (default: 127.0.0.1; 0.0.0.0 shares on your network)
  -o, --open         Open in default browser after starting
      --exit-on-close
                     Stop the server when the browser tab is closed
  -V, --version      Print version
  -h, --help         Show this help

Examples:
  md README.md
  md docs/index.md --port 3000 --open
  md notes.md -p 0 -o --exit-on-close`);
  process.exit(rawArgs.length === 0 ? 1 : 0);
}

let fileArg: string | undefined;
let port = 8123;
let strictPort = false;
let host = "127.0.0.1";
let shouldOpen = false;
let exitOnClose = false;

function parsePort(raw: string | undefined): number {
  const n = Number(raw);
  if (raw === undefined || raw === "" || !Number.isInteger(n) || n < 0 || n > 65535) {
    console.error(`Error: invalid port "${raw ?? ""}". Example: md README.md --port 3000`);
    process.exit(1);
  }
  return n;
}

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i] as string;
  if (arg === "--port" || arg === "-p") {
    port = parsePort(rawArgs[++i]);
    strictPort = true;
  } else if (arg === "--host") {
    host = rawArgs[++i] ?? host;
  } else if (arg === "--open" || arg === "-o") {
    shouldOpen = true;
  } else if (arg === "--exit-on-close") {
    exitOnClose = true;
  } else if (!arg.startsWith("-")) {
    if (fileArg === undefined) {
      fileArg = arg;
    } else {
      // backward compat: second positional arg is port
      port = parsePort(arg);
      strictPort = true;
    }
  }
}

if (!fileArg) {
  console.error("Error: no file specified. Run `md --help` for usage.");
  process.exit(1);
}

const entryFile = resolve(process.cwd(), fileArg);

if (!existsSync(entryFile)) {
  console.error(`Error: ${entryFile} does not exist`);
  process.exit(1);
}

const bound = await startServer({ entryFile, port, host, strictPort, exitOnClose }).catch(
  (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Error: port ${port} is already in use. Try --port 0 for any free port.`);
    } else {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  },
);

const url = `http://localhost:${bound.port}`;
console.log(`Serving ${url}  (Ctrl+C to stop)`);

if (shouldOpen) {
  const cmd =
    platform === "win32"
      ? `start "" "${url}"`
      : platform === "darwin"
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd);
}

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
