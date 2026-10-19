# Getting Started

You got here without a full page reload. The files sidebar on the right now lists this folder.

[← Back to the showcase](../showcase.md)

## Install

```sh
npm install -g @d7om/md-watch
```

## Flags

| Flag                | What it does                                              |
| ------------------- | --------------------------------------------------------- |
| `-p, --port <n>`    | Use a fixed port. `0` picks any free port                 |
| `--host <addr>`     | Bind address. Default `127.0.0.1`                         |
| `-o, --open`        | Open the browser once the server starts                   |
| `--exit-on-close`   | Stop the server when the tab closes                       |

> [!TIP]
> Without `--port`, md-watch starts at 8123 and moves to the next free port if that one is taken.
