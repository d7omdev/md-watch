import { createHash } from "node:crypto";
import { existsSync, readFileSync, watch } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { render } from "./render";
import { type ServerState, startServer } from "./server";

const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log("Usage: md <file.md> [port]");
  process.exit(args.length === 0 ? 1 : 0);
}

// biome-ignore lint/style/noNonNullAssertion: args[0] is validated above
const filePath = resolve(process.cwd(), args[0]!);
const port = parseInt(args[1] || "8123", 10);
const title = basename(filePath, ".md");

if (!existsSync(filePath)) {
  console.error(`Error: ${filePath} does not exist`);
  process.exit(1);
}

if (Number.isNaN(port) || port < 1 || port > 65535) {
  console.error(`Error: invalid port "${args[1]}"`);
  process.exit(1);
}

const baseDir = dirname(filePath);

function buildPage(): { html: string; hash: string } {
  const md = readFileSync(filePath, "utf-8");
  const html = render(md, title, baseDir);
  const hash = createHash("sha1").update(md).digest("base64url").slice(0, 8);
  return { html, hash };
}

(async () => {
  const state: ServerState = buildPage();
  const server = await startServer(state, port, dirname(filePath));
  console.log(`Serving http://localhost:${server.port}  (Ctrl+C to stop)`);

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));

  let debounce: ReturnType<typeof setTimeout> | null = null;
  watch(filePath, () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      try {
        const updated = buildPage();
        state.html = updated.html;
        state.hash = updated.hash;
        const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
        console.log(`[${time}] Rendered ${basename(filePath)}`);
      } catch (e: unknown) {
        console.error(`[watch] Error: ${(e as Error).message}`);
      }
    }, 100);
  });
})();
