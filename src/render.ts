import { resolve as resolvePath } from "node:path";
import hljs from "highlight.js";
import { Marked } from "marked";
import markedAlert from "marked-alert";
import markedFootnote from "marked-footnote";
import markedKatex from "marked-katex-extension";
import { langIcon } from "./lang-icons";
import { template } from "./template";

// Requires a `key:` line right after the opening fence so a leading `---` rule isn't eaten
const FRONT_MATTER = /^---\r?\n(?=[\w-]+:[ \t\r\n])[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
const VIDEO_EXTS = new Set([".mp4", ".webm", ".ogg", ".ogv", ".mov", ".mkv"]);

function ext(src: string): string {
  const m = src.split("?")[0].match(/\.[^.]+$/);
  return m ? m[0].toLowerCase() : "";
}

// Set before each marked.parse() call, cleared after
let _baseDir: string | undefined;
let _title: string | undefined;

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
    let decoded = href;
    try {
      decoded = decodeURIComponent(href);
    } catch {}
    return `/_abs${encodeURI(resolvePath(_baseDir, decoded))}`;
  }
  return href;
}

const LANG_IDS = new Map(hljs.listLanguages().map((id) => [hljs.getLanguage(id), id]));

// hljs names some grammars as lists ("HTML, XML"); the fence's own word reads better there
function langLabel(alias: string | undefined, name: string | undefined): string {
  if (!alias) return "Plain text";
  if (!name) return alias;
  if (!name.includes(",")) return name;
  return alias.length <= 4 ? alias.toUpperCase() : alias[0]?.toUpperCase() + alias.slice(1);
}

const marked = new Marked({
  renderer: {
    code({ text, lang: info }) {
      const lang = info?.match(/^\S+/)?.[0];
      if (lang === "mermaid") {
        const b64 = Buffer.from(text, "utf8").toString("base64");
        return `<pre class="mermaid" data-source="${b64}">${escapeHtml(text)}</pre>`;
      }
      const known = lang ? hljs.getLanguage(lang) : undefined;
      const code =
        known && lang
          ? `<code class="hljs language-${escapeAttr(lang)}">${hljs.highlight(text, { language: lang }).value}</code>`
          : `<code>${escapeHtml(text)}</code>`;
      const icon = langIcon(lang, known && LANG_IDS.get(known));
      const label = escapeHtml(langLabel(lang, known?.name));
      return `<div class="pre-wrap"><div class="code-head"><span class="code-lang">${icon}${label}</span></div><pre>${code}</pre></div>`;
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
}).use(markedAlert(), markedFootnote(), markedKatex({ throwOnError: false }), {
  // Captured during parse: a separate marked.lexer() call corrupts marked-footnote's state
  walkTokens(token) {
    if (_title === undefined && token.type === "heading" && token.depth === 1) _title = token.text;
  },
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function render(mdContent: string, fallbackTitle: string, baseDir?: string): string {
  const md = mdContent.replace(FRONT_MATTER, "");
  _baseDir = baseDir;
  _title = undefined;
  try {
    const body = marked.parse(md) as string;
    return template(body, _title ?? fallbackTitle);
  } finally {
    _baseDir = undefined;
  }
}
