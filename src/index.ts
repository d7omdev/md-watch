import { exec } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, watch } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { platform } from "node:process";
import { render } from "./render";
import { type ServerState, startServer } from "./server";

const VERSION = "1.0.7";

interface CacheEntry {
  html: string;
  hash: string;
  mtime: number;
}

const renderCache = new Map<string, CacheEntry>();

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
  -p, --port <n>   Port to listen on  (default: 8123)
  -o, --open       Open in default browser after starting
  -V, --version    Print version
  -h, --help       Show this help

Examples:
  md README.md
  md docs/index.md --port 3000 --open
  md notes.md -p 4567 -o`);
  process.exit(rawArgs.length === 0 ? 1 : 0);
}

// Parse flags + positional args
let fileArg: string | undefined;
let port = 8123;
let shouldOpen = false;

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i]!;
  if (arg === "--port" || arg === "-p") {
    port = parseInt(rawArgs[++i] ?? "", 10);
  } else if (arg === "--open" || arg === "-o") {
    shouldOpen = true;
  } else if (!arg.startsWith("-")) {
    if (fileArg === undefined) {
      fileArg = arg;
    } else {
      // backward compat: second positional arg is port
      port = parseInt(arg, 10);
    }
  }
}

if (!fileArg) {
  console.error("Error: no file specified. Run `md --help` for usage.");
  process.exit(1);
}

const filePath = resolve(process.cwd(), fileArg);

if (!existsSync(filePath)) {
  console.error(`Error: ${filePath} does not exist`);
  process.exit(1);
}

if (Number.isNaN(port) || port < 1 || port > 65535) {
  console.error(`Error: invalid port "${port}"`);
  process.exit(1);
}

const baseDir = dirname(filePath);

function buildPage(mdPath: string): { html: string; hash: string } {
  const cached = renderCache.get(mdPath);
  if (cached) return cached;

  const md = readFileSync(mdPath, "utf-8");
  const stat = statSync(mdPath);
  const mdTitle = basename(mdPath, ".md");
  const mdBaseDir = dirname(mdPath);
  const html = render(md, mdTitle, mdBaseDir);
  const hash = createHash("sha1").update(md).digest("base64url").slice(0, 8);
  const entry = { html, hash, mtime: stat.mtimeMs };
  renderCache.set(mdPath, entry);
  return { html, hash };
}

const state: ServerState = {
  ...buildPage(filePath),
  baseDir,
  currentFile: filePath,
  updateFile(mdPath: string) {
    const updated = buildPage(mdPath);
    this.html = updated.html;
    this.hash = updated.hash;
    this.currentFile = mdPath;
    const newBaseDir = dirname(mdPath);
    this.baseDir = newBaseDir;
    return { baseDir: newBaseDir };
  },
};

const server = await startServer(state, port);
const url = `http://localhost:${server.port}`;
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

let debounce: ReturnType<typeof setTimeout> | null = null;
watch(state.currentFile, () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    try {
      renderCache.delete(state.currentFile);
      const updated = buildPage(state.currentFile);
      state.html = updated.html;
      state.hash = updated.hash;
      const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
      console.log(`[${time}] Rendered ${basename(state.currentFile)}`);
    } catch (e: unknown) {
      console.error(`[watch] Error: ${(e as Error).message}`);
    }
  }, 100);
});
