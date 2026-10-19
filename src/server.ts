import {
  createReadStream,
  type Dirent,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { type AddressInfo, isIP } from "node:net";
import { homedir } from "node:os";
import { basename, dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { render } from "./render";

const HOME = homedir();
const MD_RE = /\.(md|markdown)$/i;
const MAX_PORT_TRIES = 10;
// Hidden tabs can have their timers throttled to once a minute, so this must stay well above 60s
const IDLE_EXIT_MS = 3 * 60_000;

export interface ServerOptions {
  entryFile: string;
  port: number;
  host?: string;
  strictPort?: boolean;
  exitOnClose?: boolean;
}

export interface BoundServer {
  server: Server;
  port: number;
}

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".ogv": "video/ogg",
  ".mov": "video/quicktime",
  ".mkv": "video/x-matroska",
};

function isInside(path: string, dir: string): boolean {
  const rel = relative(dir, path);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function encodePath(path: string): string {
  return path.split(sep).map(encodeURIComponent).join("/");
}

function realOrSelf(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

function toHref(file: string, rootDir: string): string {
  return isInside(file, rootDir)
    ? `/${encodePath(relative(rootDir, file))}`
    : `/_abs${encodePath(file)}`;
}

// ponytail: depth-limited scan, re-run on every navigation; cache it if huge trees get slow
function listMarkdown(dir: string, depth = 2, prefix = ""): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
    .sort(
      (a, b) => Number(a.isDirectory()) - Number(b.isDirectory()) || a.name.localeCompare(b.name),
    )
    .flatMap((e) => {
      const name = prefix + e.name;
      if (e.isDirectory()) {
        return depth > 0 ? listMarkdown(join(dir, e.name), depth - 1, `${name}/`) : [];
      }
      return MD_RE.test(e.name) ? [name] : [];
    });
}

function renderPage(file: string): string {
  const html = render(
    readFileSync(file, "utf-8"),
    basename(file).replace(MD_RE, ""),
    dirname(file),
  );
  const time = new Date().toLocaleTimeString("en-GB", { hour12: false });
  console.log(`[${time}] Rendered ${basename(file)}`);
  return html;
}

// Blocks DNS rebinding: a hostile site pointing its own domain at 127.0.0.1 sends its domain as Host.
// IP literals and localhost can't be rebound, so LAN access by IP with --host 0.0.0.0 still works.
function isAllowedHost(header: string | undefined, boundHost: string): boolean {
  if (!header) return false;
  const name = header
    .replace(/:\d+$/, "")
    .replace(/^\[(.*)\]$/, "$1")
    .toLowerCase();
  return (
    name === "localhost" || name.endsWith(".localhost") || name === boundHost || isIP(name) !== 0
  );
}

function send(res: ServerResponse, status: number, body = ""): void {
  res.writeHead(status, { "Content-Type": "text/plain" }).end(body);
}

function serveFile(
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  mime: string,
): void {
  const size = statSync(filePath).size;
  const onStreamError = () => {
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end();
  };
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    const suffix = !m?.[1] && m?.[2] ? parseInt(m[2], 10) : undefined;
    const start =
      suffix !== undefined ? Math.max(size - suffix, 0) : m?.[1] ? parseInt(m[1], 10) : 0;
    const end = suffix === undefined && m?.[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    if (start > end || start >= size) {
      res.writeHead(416, { "Content-Range": `bytes */${size}` });
      res.end();
      return;
    }
    res.writeHead(206, {
      "Content-Type": mime,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": String(end - start + 1),
    });
    createReadStream(filePath, { start, end }).on("error", onStreamError).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Type": mime,
      "Accept-Ranges": "bytes",
      "Content-Length": String(size),
      "Cache-Control": "public, max-age=5",
      "X-Content-Type-Options": "nosniff",
    });
    createReadStream(filePath).on("error", onStreamError).pipe(res);
  }
}

export function startServer(opts: ServerOptions): Promise<BoundServer> {
  const host = opts.host ?? "127.0.0.1";
  const rootDir = dirname(opts.entryFile);
  const allowedDirs = [HOME, rootDir, process.cwd()].map(realOrSelf);
  let byeTimer: NodeJS.Timeout | undefined;
  let lastRequest = Date.now();

  // Checks the symlink-resolved target too, so a link inside an allowed dir can't point outside.
  function existsInside(path: string): boolean {
    let real: string;
    try {
      real = realpathSync(path);
    } catch {
      return false;
    }
    return allowedDirs.some((dir) => isInside(real, dir));
  }

  // Maps a URL path to a file on disk, or null if it doesn't exist or is outside the allowed dirs.
  function resolveFile(urlPath: string): string | null {
    if (urlPath === "/" || urlPath === "/index.html") return opts.entryFile;
    const decoded = decodeURIComponent(urlPath);
    if (decoded.startsWith("/_abs/")) {
      const abs = resolve(decoded.slice("/_abs".length));
      return existsInside(abs) ? abs : null;
    }
    for (const dir of [rootDir, process.cwd()]) {
      const p = resolve(dir, decoded.slice(1));
      if (isInside(p, dir) && existsInside(p)) return p;
    }
    return null;
  }

  if (opts.exitOnClose) {
    // Fallback for when the tab never sends /_bye (browser crash, killed process)
    setInterval(() => {
      if (Date.now() - lastRequest > IDLE_EXIT_MS) process.exit(0);
    }, 30_000).unref();
  }

  function handle(req: IncomingMessage, res: ServerResponse): void {
    if (!isAllowedHost(req.headers.host, host)) {
      send(res, 403, "Forbidden host");
      return;
    }
    clearTimeout(byeTimer);
    lastRequest = Date.now();
    const url = new URL(`http://localhost${req.url ?? "/"}`);
    const { pathname } = url;

    // Sent by the page on pagehide. A reload or a second tab makes a request within the
    // grace period, which clears the timer above.
    if (pathname === "/_bye") {
      // Other local sites can POST here too; only our own page may stop the server
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) {
        send(res, 403, "Forbidden origin");
        return;
      }
      res.writeHead(204).end();
      if (opts.exitOnClose) byeTimer = setTimeout(() => process.exit(0), 3000);
      return;
    }

    if (pathname === "/_hash") {
      const file = resolveFile(url.searchParams.get("path") ?? "/");
      if (!file) {
        send(res, 404, "Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      res.end(String(statSync(file).mtimeMs));
      return;
    }

    if (pathname === "/_files") {
      const file = resolveFile(url.searchParams.get("path") ?? "/") ?? opts.entryFile;
      const dir = dirname(file);
      const files = listMarkdown(dir).map((name) => ({
        name,
        href: toHref(join(dir, name), rootDir),
      }));
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(JSON.stringify({ files, current: toHref(file, rootDir), dir: basename(dir) }));
      return;
    }

    const file = resolveFile(pathname);
    if (!file) {
      send(res, 404, "Not found");
      return;
    }

    if (MD_RE.test(file)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderPage(file));
      return;
    }

    const mime = MIME[extname(file).toLowerCase()];
    if (!mime) {
      send(res, 404, "Not found");
      return;
    }
    serveFile(req, res, file, mime);
  }

  const server = createServer((req, res) => {
    try {
      handle(req, res);
    } catch (e) {
      const status = e instanceof URIError ? 400 : 500;
      if (status === 500) console.error(`[server] ${(e as Error).message}`);
      if (!res.headersSent) res.writeHead(status);
      res.end();
    }
  });

  return new Promise((resolvePromise, reject) => {
    let port = opts.port;
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE" && !opts.strictPort && port < opts.port + MAX_PORT_TRIES) {
        server.listen(++port, host);
        return;
      }
      reject(err);
    });
    server.once("listening", () => {
      resolvePromise({ server, port: (server.address() as AddressInfo).port });
    });
    server.listen(port, host);
  });
}
