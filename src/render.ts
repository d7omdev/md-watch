import { resolve as resolvePath } from "node:path";
import hljs from "highlight.js";
import { Marked } from "marked";
import { template } from "./template";

const VIDEO_EXTS = new Set([".mp4", ".webm", ".ogg", ".ogv", ".mov", ".mkv"]);

function ext(src: string): string {
  const m = src.split("?")[0].match(/\.[^.]+$/);
  return m ? m[0].toLowerCase() : "";
}

// Set before each marked.parse() call, cleared after
let _baseDir: string | undefined;

function resolveHref(href: string): string {
  if (!_baseDir) return href;
  if (
    /^https?:\/\//.test(href) ||
    /^data:/.test(href) ||
    href.startsWith("/") ||
    href.startsWith("//")
  )
    return href;
  if (href.includes("..")) {
    const abs = resolvePath(_baseDir, decodeURIComponent(href));
    return `/_abs${encodeURI(abs)}`;
  }
  return href;
}

const marked = new Marked({
  renderer: {
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : undefined;
      if (!language) {
        return `<pre><code data-lang="${escapeAttr(lang ?? "")}">${escapeHtml(text)}</code></pre>`;
      }
      const highlighted = hljs.highlight(text, { language }).value;
      return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
    },
    link({ href, title, tokens }) {
      const resolved = resolveHref(href);
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
      const inner = this.parser.parseInline(tokens);
      const isExternal = /^https?:\/\//i.test(resolved);
      const extAttrs = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
      return `<a href="${escapeAttr(resolved)}"${extAttrs}${titleAttr}>${inner}</a>`;
    },
    image({ href, title, text }) {
      const src = resolveHref(href);
      if (VIDEO_EXTS.has(ext(src))) {
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
        return `<video src="${escapeAttr(src)}" controls playsinline${titleAttr} style="max-width:100%;border-radius:6px">${escapeHtml(text)}</video>`;
      }
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(text)}"${titleAttr} style="max-width:100%;border-radius:6px">`;
    },
  },
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function render(mdContent: string, title: string, baseDir?: string): string {
  _baseDir = baseDir;
  try {
    const body = marked.parse(mdContent) as string;
    return template(body, title);
  } finally {
    _baseDir = undefined;
  }
}
