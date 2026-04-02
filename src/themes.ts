export interface Theme {
  id: string;
  name: string;
  isDark: boolean;
  // hljs style file name (without .min.css)
  hljs: string;
  // Whether hljs style is in base16/ subdirectory
  hljsBase16?: boolean;
  vars: {
    bg: string;
    fg: string;
    muted: string;
    border: string;
    accent: string;
    codeBg: string;
    link: string;
    toolbarBg: string;
    tocBg: string;
    tocHover: string;
    sliderTrack: string;
    sliderThumb: string;
  };
}

export const themes: Theme[] = [
  // ── Catppuccin ──
  {
    id: "catppuccin-mocha",
    name: "Catppuccin Mocha",
    isDark: true,
    hljs: "tokyo-night-dark",
    vars: {
      bg: "#1e1e2e",
      fg: "#cdd6f4",
      muted: "#a6adc8",
      border: "#313244",
      accent: "#f5c2e7",
      codeBg: "#181825",
      link: "#89b4fa",
      toolbarBg: "rgba(30,30,46,0.88)",
      tocBg: "#181825",
      tocHover: "#313244",
      sliderTrack: "#45475a",
      sliderThumb: "#cba6f7",
    },
  },
  {
    id: "catppuccin-macchiato",
    name: "Catppuccin Macchiato",
    isDark: true,
    hljs: "tokyo-night-dark",
    vars: {
      bg: "#24273a",
      fg: "#cad3f5",
      muted: "#a5adcb",
      border: "#363a4f",
      accent: "#f5bde6",
      codeBg: "#1e2030",
      link: "#8aadf4",
      toolbarBg: "rgba(36,39,58,0.88)",
      tocBg: "#1e2030",
      tocHover: "#363a4f",
      sliderTrack: "#494d64",
      sliderThumb: "#c6a0f6",
    },
  },
  {
    id: "catppuccin-frappe",
    name: "Catppuccin Frappé",
    isDark: true,
    hljs: "tokyo-night-dark",
    vars: {
      bg: "#303446",
      fg: "#c6d0f5",
      muted: "#a5adce",
      border: "#414559",
      accent: "#f4b8e4",
      codeBg: "#292c3c",
      link: "#8caaee",
      toolbarBg: "rgba(48,52,70,0.88)",
      tocBg: "#292c3c",
      tocHover: "#414559",
      sliderTrack: "#51576d",
      sliderThumb: "#ca9ee6",
    },
  },
  {
    id: "catppuccin-latte",
    name: "Catppuccin Latte",
    isDark: false,
    hljs: "atom-one-light",
    vars: {
      bg: "#eff1f5",
      fg: "#4c4f69",
      muted: "#8c8fa1",
      border: "#ccd0da",
      accent: "#ea76cb",
      codeBg: "#e6e9ef",
      link: "#1e66f5",
      toolbarBg: "rgba(239,241,245,0.88)",
      tocBg: "#e6e9ef",
      tocHover: "#ccd0da",
      sliderTrack: "#bcc0cc",
      sliderThumb: "#8839ef",
    },
  },

  // ── Gruvbox ──
  {
    id: "gruvbox-dark",
    name: "Gruvbox Dark",
    isDark: true,
    hljs: "base16/gruvbox-dark-medium",
    hljsBase16: true,
    vars: {
      bg: "#282828",
      fg: "#ebdbb2",
      muted: "#a89984",
      border: "#3c3836",
      accent: "#fe8019",
      codeBg: "#1d2021",
      link: "#83a598",
      toolbarBg: "rgba(40,40,40,0.88)",
      tocBg: "#1d2021",
      tocHover: "#3c3836",
      sliderTrack: "#504945",
      sliderThumb: "#fabd2f",
    },
  },
  {
    id: "gruvbox-light",
    name: "Gruvbox Light",
    isDark: false,
    hljs: "base16/gruvbox-light-medium",
    hljsBase16: true,
    vars: {
      bg: "#fbf1c7",
      fg: "#3c3836",
      muted: "#7c6f64",
      border: "#d5c4a1",
      accent: "#af3a03",
      codeBg: "#f2e5bc",
      link: "#076678",
      toolbarBg: "rgba(251,241,199,0.88)",
      tocBg: "#f2e5bc",
      tocHover: "#d5c4a1",
      sliderTrack: "#bdae93",
      sliderThumb: "#b57614",
    },
  },

  // ── Dracula ──
  {
    id: "dracula",
    name: "Dracula",
    isDark: true,
    hljs: "base16/dracula",
    hljsBase16: true,
    vars: {
      bg: "#282a36",
      fg: "#f8f8f2",
      muted: "#6272a4",
      border: "#44475a",
      accent: "#ff79c6",
      codeBg: "#21222c",
      link: "#8be9fd",
      toolbarBg: "rgba(40,42,54,0.88)",
      tocBg: "#21222c",
      tocHover: "#44475a",
      sliderTrack: "#44475a",
      sliderThumb: "#bd93f9",
    },
  },

  // ── Nord ──
  {
    id: "nord",
    name: "Nord",
    isDark: true,
    hljs: "nord",
    vars: {
      bg: "#2e3440",
      fg: "#d8dee9",
      muted: "#81a1c1",
      border: "#3b4252",
      accent: "#88c0d0",
      codeBg: "#292e39",
      link: "#81a1c1",
      toolbarBg: "rgba(46,52,64,0.88)",
      tocBg: "#292e39",
      tocHover: "#3b4252",
      sliderTrack: "#434c5e",
      sliderThumb: "#88c0d0",
    },
  },

  // ── Solarized ──
  {
    id: "solarized-dark",
    name: "Solarized Dark",
    isDark: true,
    hljs: "base16/solarized-dark",
    hljsBase16: true,
    vars: {
      bg: "#002b36",
      fg: "#839496",
      muted: "#657b83",
      border: "#073642",
      accent: "#b58900",
      codeBg: "#00212b",
      link: "#268bd2",
      toolbarBg: "rgba(0,43,54,0.88)",
      tocBg: "#00212b",
      tocHover: "#073642",
      sliderTrack: "#073642",
      sliderThumb: "#2aa198",
    },
  },
  {
    id: "solarized-light",
    name: "Solarized Light",
    isDark: false,
    hljs: "base16/solarized-light",
    hljsBase16: true,
    vars: {
      bg: "#fdf6e3",
      fg: "#657b83",
      muted: "#93a1a1",
      border: "#eee8d5",
      accent: "#b58900",
      codeBg: "#eee8d5",
      link: "#268bd2",
      toolbarBg: "rgba(253,246,227,0.88)",
      tocBg: "#eee8d5",
      tocHover: "#e0dac3",
      sliderTrack: "#d3cbb7",
      sliderThumb: "#2aa198",
    },
  },

  // ── Tokyo Night ──
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    isDark: true,
    hljs: "tokyo-night-dark",
    vars: {
      bg: "#1a1b26",
      fg: "#a9b1d6",
      muted: "#565f89",
      border: "#292e42",
      accent: "#7aa2f7",
      codeBg: "#16161e",
      link: "#7dcfff",
      toolbarBg: "rgba(26,27,38,0.88)",
      tocBg: "#16161e",
      tocHover: "#292e42",
      sliderTrack: "#3b4261",
      sliderThumb: "#bb9af7",
    },
  },
  {
    id: "tokyo-night-light",
    name: "Tokyo Night Light",
    isDark: false,
    hljs: "tokyo-night-light",
    vars: {
      bg: "#d5d6db",
      fg: "#343b58",
      muted: "#9699a3",
      border: "#c0c1c7",
      accent: "#2e7de9",
      codeBg: "#cbccd1",
      link: "#166775",
      toolbarBg: "rgba(213,214,219,0.88)",
      tocBg: "#cbccd1",
      tocHover: "#c0c1c7",
      sliderTrack: "#b0b1b7",
      sliderThumb: "#9854f1",
    },
  },

  // ── One Dark ──
  {
    id: "one-dark",
    name: "One Dark",
    isDark: true,
    hljs: "atom-one-dark",
    vars: {
      bg: "#282c34",
      fg: "#abb2bf",
      muted: "#5c6370",
      border: "#3e4452",
      accent: "#e06c75",
      codeBg: "#21252b",
      link: "#61afef",
      toolbarBg: "rgba(40,44,52,0.88)",
      tocBg: "#21252b",
      tocHover: "#3e4452",
      sliderTrack: "#4b5263",
      sliderThumb: "#c678dd",
    },
  },

  // ── Rosé Pine ──
  {
    id: "rose-pine",
    name: "Rosé Pine",
    isDark: true,
    hljs: "rose-pine",
    vars: {
      bg: "#191724",
      fg: "#e0def4",
      muted: "#6e6a86",
      border: "#26233a",
      accent: "#ebbcba",
      codeBg: "#1f1d2e",
      link: "#9ccfd8",
      toolbarBg: "rgba(25,23,36,0.88)",
      tocBg: "#1f1d2e",
      tocHover: "#26233a",
      sliderTrack: "#393552",
      sliderThumb: "#c4a7e7",
    },
  },
  {
    id: "rose-pine-moon",
    name: "Rosé Pine Moon",
    isDark: true,
    hljs: "rose-pine-moon",
    vars: {
      bg: "#232136",
      fg: "#e0def4",
      muted: "#6e6a86",
      border: "#2a273f",
      accent: "#ea9a97",
      codeBg: "#2a273f",
      link: "#9ccfd8",
      toolbarBg: "rgba(35,33,54,0.88)",
      tocBg: "#2a273f",
      tocHover: "#393552",
      sliderTrack: "#44415a",
      sliderThumb: "#c4a7e7",
    },
  },
  {
    id: "rose-pine-dawn",
    name: "Rosé Pine Dawn",
    isDark: false,
    hljs: "rose-pine-dawn",
    vars: {
      bg: "#faf4ed",
      fg: "#575279",
      muted: "#9893a5",
      border: "#dfdad9",
      accent: "#d7827e",
      codeBg: "#f2e9e1",
      link: "#56949f",
      toolbarBg: "rgba(250,244,237,0.88)",
      tocBg: "#f2e9e1",
      tocHover: "#dfdad9",
      sliderTrack: "#cecacd",
      sliderThumb: "#907aa9",
    },
  },

  // ── GitHub ──
  {
    id: "github-dark",
    name: "GitHub Dark",
    isDark: true,
    hljs: "github-dark",
    vars: {
      bg: "#0d1117",
      fg: "#e6edf3",
      muted: "#8b949e",
      border: "#30363d",
      accent: "#f78166",
      codeBg: "#161b22",
      link: "#58a6ff",
      toolbarBg: "rgba(13,17,23,0.88)",
      tocBg: "#161b22",
      tocHover: "#30363d",
      sliderTrack: "#30363d",
      sliderThumb: "#58a6ff",
    },
  },
  {
    id: "github-light",
    name: "GitHub Light",
    isDark: false,
    hljs: "github",
    vars: {
      bg: "#ffffff",
      fg: "#1f2328",
      muted: "#656d76",
      border: "#d0d7de",
      accent: "#cf222e",
      codeBg: "#f6f8fa",
      link: "#0969da",
      toolbarBg: "rgba(255,255,255,0.88)",
      tocBg: "#f6f8fa",
      tocHover: "#d0d7de",
      sliderTrack: "#ced4da",
      sliderThumb: "#0969da",
    },
  },

  // ── Monokai ──
  {
    id: "monokai",
    name: "Monokai",
    isDark: true,
    hljs: "monokai",
    vars: {
      bg: "#272822",
      fg: "#f8f8f2",
      muted: "#75715e",
      border: "#3e3d32",
      accent: "#f92672",
      codeBg: "#1e1f1c",
      link: "#66d9ef",
      toolbarBg: "rgba(39,40,34,0.88)",
      tocBg: "#1e1f1c",
      tocHover: "#3e3d32",
      sliderTrack: "#49483e",
      sliderThumb: "#a6e22e",
    },
  },
];

// Collect unique hljs style names needed
export function getUniqueHljsStyles(): { name: string; base16: boolean }[] {
  const seen = new Set<string>();
  const result: { name: string; base16: boolean }[] = [];
  for (const t of themes) {
    if (!seen.has(t.hljs)) {
      seen.add(t.hljs);
      result.push({ name: t.hljs, base16: !!t.hljsBase16 });
    }
  }
  return result;
}
