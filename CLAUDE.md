# md-watch

Fast local Markdown preview server with live reload.

## Development

```sh
bun install           # install dependencies
bun run dev          # run with hot reload (node --watch)
bun run build        # build dist/md.js
bun run check        # lint & format with Biome
bun run lint         # lint only
bun run format       # format only
```

## Scripts

- `dev` - Run with `--watch` for hot reload
- `build` - Build with esbuild
- `lint` - Run Biome linter
- `format` - Format files
- `check` - Run all Biome checks with fixes

## Architecture

- `src/index.ts` - CLI entry, file watcher, server bootstrap
- `src/server.ts` - HTTP server, static file serving
- `src/render.ts` - Markdown → HTML via `marked`, code highlighting via `highlight.js`
- `src/template.ts` - HTML template with theme support
- `src/themes.ts` - Theme definitions
- `src/template.html` - Base HTML template
- `build.ts` - esbuild script

## Build

Uses esbuild to bundle into a single executable `dist/md.js` with shebang.
