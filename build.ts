import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ?? join(__dirname, "dist/md.js");
mkdirSync(dirname(OUT), { recursive: true });

// Inline CSS and HTML files as string exports (replaces Bun's with { type: "text" })
const textPlugin: esbuild.Plugin = {
  name: "text",
  setup(build) {
    build.onLoad({ filter: /\.(css|html)$/ }, (args) => ({
      contents: `export default ${JSON.stringify(readFileSync(args.path, "utf8"))}`,
      loader: "js",
    }));
  },
};

const result = await esbuild.build({
  entryPoints: ["./src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  minify: true,
  plugins: [textPlugin],
  logLevel: "silent",
});

if (result.errors.length) {
  for (const e of result.errors) console.error(e.text);
  process.exit(1);
}

const js = result.outputFiles[0].text;
writeFileSync(OUT, `#!/usr/bin/env node\n${js}`, { mode: 0o755 });

const kb = (Buffer.byteLength(js) / 1024).toFixed(1);
console.log(`Built: ${OUT} (${kb}k)`);
