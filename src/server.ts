import { createReadStream, existsSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { extname, join, resolve as resolvePath } from "node:path";

const HOME = `${homedir()}/`;

export interface ServerState {
  html: string;
  hash: string;
}

export interface BoundServer {
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

function serveFile(
  req: IncomingMessage,
  res: ServerResponse,
  filePath: string,
  mime: string,
): void {
  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  const onStreamError = () => {
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end();
  };
  const range = req.headers.range;
  if (range) {
    const m = range.match(/bytes=(\d+)-(\d*)/);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2] ?? "0", 10), size - 1) : size - 1;
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
    });
    createReadStream(filePath).on("error", onStreamError).pipe(res);
  }
}

export function startServer(
  state: ServerState,
  port: number,
  baseDir: string,
): Promise<BoundServer> {
  return new Promise((resolve: (v: BoundServer) => void, reject) => {
    const server = createServer((req, res) => {
      const pathname = new URL(req.url ?? "/", `http://localhost`).pathname;

      if (pathname === "/" || pathname === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(state.html);
        return;
      }

      if (pathname === "/_hash") {
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache, no-store",
        });
        res.end(state.hash);
        return;
      }

      // Absolute-path route for files outside baseDir (e.g. ../../Videos/...)
      if (pathname.startsWith("/_abs/")) {
        const absPath = decodeURIComponent(pathname.slice(5)); // strip '/_abs', leaving /home/...
        if (!absPath.startsWith(HOME)) {
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
        const mime = MIME[extname(absPath).toLowerCase()];
        if (!mime || !existsSync(absPath)) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        serveFile(req, res, absPath, mime);
        return;
      }

      // Static files — try baseDir first, then cwd
      const decoded = decodeURIComponent(pathname);
      const candidates = [
        resolvePath(join(baseDir, decoded)),
        resolvePath(join(process.cwd(), decoded)),
      ];
      const safePath = candidates.find((p) => existsSync(p));

      const mime = safePath ? MIME[extname(safePath).toLowerCase()] : undefined;
      if (!mime || !safePath) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      serveFile(req, res, safePath, mime);
    });

    server.listen(port, () => (resolve as (v: BoundServer) => void)({ port }));
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Error: port ${port} is already in use. Try: md <file.md> <other-port>`);
        process.exit(1);
      }
      reject(err);
    });
  });
}
