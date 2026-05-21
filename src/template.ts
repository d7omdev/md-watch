import hljsAtomOneDark from "highlight.js/styles/atom-one-dark.min.css" with { type: "text" };

import hljsAtomOneLight from "highlight.js/styles/atom-one-light.min.css" with { type: "text" };
import hljsDracula from "highlight.js/styles/base16/dracula.min.css" with { type: "text" };
import hljsGruvboxDark from "highlight.js/styles/base16/gruvbox-dark-medium.min.css" with {
  type: "text",
};
import hljsGruvboxLight from "highlight.js/styles/base16/gruvbox-light-medium.min.css" with {
  type: "text",
};
import hljsSolarizedDark from "highlight.js/styles/base16/solarized-dark.min.css" with {
  type: "text",
};
import hljsSolarizedLight from "highlight.js/styles/base16/solarized-light.min.css" with {
  type: "text",
};
import hljsGithub from "highlight.js/styles/github.min.css" with { type: "text" };
import hljsGithubDark from "highlight.js/styles/github-dark.min.css" with { type: "text" };
import hljsMonokai from "highlight.js/styles/monokai.min.css" with { type: "text" };
import hljsNord from "highlight.js/styles/nord.min.css" with { type: "text" };
import hljsRosePine from "highlight.js/styles/rose-pine.min.css" with { type: "text" };
import hljsRosePineDawn from "highlight.js/styles/rose-pine-dawn.min.css" with { type: "text" };
import hljsRosePineMoon from "highlight.js/styles/rose-pine-moon.min.css" with { type: "text" };
import hljsTokyoNightDark from "highlight.js/styles/tokyo-night-dark.min.css" with { type: "text" };
import hljsTokyoNightLight from "highlight.js/styles/tokyo-night-light.min.css" with {
  type: "text",
};
import templateHtml from "./template.html" with { type: "text" };
import { type Theme, themes } from "./themes";

const hljsCssMap: Record<string, string> = {
  "atom-one-light": hljsAtomOneLight,
  "atom-one-dark": hljsAtomOneDark,
  "tokyo-night-dark": hljsTokyoNightDark,
  "tokyo-night-light": hljsTokyoNightLight,
  nord: hljsNord,
  "rose-pine": hljsRosePine,
  "rose-pine-moon": hljsRosePineMoon,
  "rose-pine-dawn": hljsRosePineDawn,
  "github-dark": hljsGithubDark,
  github: hljsGithub,
  monokai: hljsMonokai,
  "base16/gruvbox-dark-medium": hljsGruvboxDark,
  "base16/gruvbox-light-medium": hljsGruvboxLight,
  "base16/dracula": hljsDracula,
  "base16/solarized-dark": hljsSolarizedDark,
  "base16/solarized-light": hljsSolarizedLight,
};

function buildThemeCss(): string {
  return themes
    .map((t) => {
      const v = t.vars;
      return `[data-theme="${t.id}"]{--bg:${v.bg};--fg:${v.fg};--muted:${v.muted};--border:${v.border};--accent:${v.accent};--code-bg:${v.codeBg};--link:${v.link};--toolbar-bg:${v.toolbarBg};--toc-bg:${v.tocBg};--toc-hover:${v.tocHover};--slider-track:${v.sliderTrack};--slider-thumb:${v.sliderThumb}}`;
    })
    .join("\n");
}

function buildHljsStyleTags(): string {
  const seen = new Set<string>();
  return themes
    .flatMap((t) => {
      if (seen.has(t.hljs)) return [];
      seen.add(t.hljs);
      const css = hljsCssMap[t.hljs] ?? "";
      return [`<style data-hljs="${t.hljs}" media="not all">${css}</style>`];
    })
    .join("\n");
}

function buildThemeItems(): string {
  const groups: Record<string, Theme[]> = {};
  for (const t of themes) {
    const key = t.id.replace(/-(?:dark|light|mocha|macchiato|frappe|latte|moon|dawn)$/, "");
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }
  const entries = Object.values(groups);
  return entries
    .map((group, i) => {
      const first = group[0];
      if (!first) return "";
      const sep = i < entries.length - 1 ? '<div class="dd-sep"></div>' : "";
      if (group.length === 1) {
        return `<div class="dd-item" data-id="${first.id}">${first.name}</div>${sep}`;
      }
      const label = first.name.includes("Rosé")
        ? "Rosé Pine"
        : (first.name.split(" ")[0] ?? first.name);
      const items = group
        .map((t) => `<div class="dd-item" data-id="${t.id}">${t.name}</div>`)
        .join("");
      return `<div class="dd-group"><div class="dd-group-label">${label}</div>${items}</div>${sep}`;
    })
    .join("");
}

function buildThemesJson(): string {
  return JSON.stringify(Object.fromEntries(themes.map((t) => [t.id, t.hljs])));
}

function buildThemeDarkJson(): string {
  return JSON.stringify(Object.fromEntries(themes.map((t) => [t.id, t.isDark])));
}

const DEFAULT_THEME = "gruvbox-dark";

// Pre-build all static parts once at module load
const _themeCss = buildThemeCss();
const _hljsTags = buildHljsStyleTags();
const _themeItems = buildThemeItems();
const _themesJson = buildThemesJson();
const _themeDarkJson = buildThemeDarkJson();

export function template(body: string, title: string): string {
  return templateHtml
    .replace("{{TITLE}}", escapeHtml(title))
    .replace("{{HLJS_TAGS}}", _hljsTags)
    .replace("{{THEME_CSS}}", _themeCss)
    .replace("{{THEME_ITEMS}}", _themeItems)
    .replace("{{THEMES_JSON}}", _themesJson)
    .replace("{{THEME_DARK_JSON}}", _themeDarkJson)
    .replace("{{DEFAULT_THEME}}", DEFAULT_THEME)
    .replace("{{BODY}}", body);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
