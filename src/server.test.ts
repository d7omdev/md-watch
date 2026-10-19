import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { render } from "./render";
import { type BoundServer, startServer } from "./server";

const tmp = mkdtempSync(join(tmpdir(), "md-watch-"));
const entry = join(tmp, "docs", "entry.md");
let bound: BoundServer;
let base: string;

beforeAll(async () => {
  mkdirSync(join(tmp, "docs"));
  writeFileSync(entry, "---\ntitle: x\n---\n# Hello\n\nregex `$&` and `$'` stay\n");
  writeFileSync(join(tmp, "secret.md"), "# secret");
  writeFileSync(join(tmp, "docs", "clip.mp4"), "0123456789");
  symlinkSync(join(tmp, "secret.md"), join(tmp, "docs", "link.md"));
  bound = await startServer({ entryFile: entry, port: 0, strictPort: true });
  base = `http://127.0.0.1:${bound.port}`;
});

afterAll(() => {
  bound.server.close();
  rmSync(tmp, { recursive: true, force: true });
});

test("render keeps $ patterns, strips front matter, titles from h1", () => {
  const html = render("---\ntitle: x\n---\n# Hi there\n\n`$&` `$'`", "fallback");
  expect(html).toContain("<code>$&amp;</code> <code>$&#39;</code>");
  expect(html).toContain("<title>Hi there</title>");
  expect(html).not.toContain("title: x");
});

test("binds to loopback and supports port 0", () => {
  const addr = bound.server.address() as AddressInfo;
  expect(addr.address).toBe("127.0.0.1");
  expect(bound.port).toBeGreaterThan(0);
});

test("malformed escapes return 400 and the server survives", async () => {
  expect((await fetch(`${base}/%`)).status).toBe(400);
  expect((await fetch(`${base}/`)).status).toBe(200);
});

test("encoded traversal out of the root is refused", async () => {
  expect((await fetch(`${base}/..%2Fsecret.md`)).status).toBe(404);
  // tmpdir is outside $HOME, so /_abs must refuse it
  expect((await fetch(`${base}/_abs${tmp}/secret.md`)).status).toBe(404);
});

test("/_hash changes when the requested file changes", async () => {
  const hash = () => fetch(`${base}/_hash?path=/entry.md`).then((r) => r.text());
  const before = await hash();
  utimesSync(entry, new Date(), new Date(Date.now() + 5000));
  expect(await hash()).not.toBe(before);
});

test("footnote pages render repeatedly", () => {
  const md = "# T\n\nHi[^1]\n\n[^1]: note\n";
  for (let i = 0; i < 3; i++) expect(render(md, "t")).toContain("data-footnote-ref");
});

test("a leading thematic break is not treated as front matter", () => {
  expect(render("---\n\nintro\n\n---\n\nrest", "t")).toContain("intro");
});

test("requests with a foreign Host header are refused", async () => {
  const { request } = await import("node:http");
  const status = await new Promise<number>((done) => {
    request(`${base}/`, { headers: { host: "evil.example" } }, (r) =>
      done(r.statusCode ?? 0),
    ).end();
  });
  expect(status).toBe(403);
});

test("symlinks pointing outside the allowed dirs are refused", async () => {
  expect((await fetch(`${base}/link.md`)).status).toBe(404);
});

test("suffix byte ranges return the tail of the file", async () => {
  const r = await fetch(`${base}/clip.mp4`, { headers: { range: "bytes=-3" } });
  expect(r.status).toBe(206);
  expect(r.headers.get("content-range")).toBe("bytes 7-9/10");
  expect(await r.text()).toBe("789");
});

test("/_bye from another origin is refused", async () => {
  const r = await fetch(`${base}/_bye`, {
    method: "POST",
    headers: { origin: "http://evil.example" },
  });
  expect(r.status).toBe(403);
});

test("math renders with KaTeX", () => {
  expect(render("Inline $e^{i\\pi}+1=0$\n\n$$\n\\int_0^1 x\\,dx\n$$\n", "t")).toContain(
    'class="katex"',
  );
});
