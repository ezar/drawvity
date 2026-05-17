// theme.jsx — palettes, worlds, art directions, shared CSS injection

const PALETTES = {
  pantone: {
    name: "Pantone",
    paper: "#FAF4E6",
    paperDeep: "#F1E8D2",
    ink: "#1F1A14",
    inkSoft: "#5C5240",
    primary: "#E25C3B",
    secondary: "#E8B73E",
    tertiary: "#2E5BB8",
    accent: "#5BB390",
  },
  pencils: {
    name: "Pencils",
    paper: "#F3EBD8",
    paperDeep: "#E7DBBF",
    ink: "#2A2118",
    inkSoft: "#675845",
    primary: "#C44A2E",
    secondary: "#D89B2A",
    tertiary: "#345E8E",
    accent: "#6E8C4C",
  },
  sorbet: {
    name: "Sorbet",
    paper: "#FBF7F0",
    paperDeep: "#F2E9D8",
    ink: "#3D2F25",
    inkSoft: "#7A6755",
    primary: "#F08A6B",
    secondary: "#B79CDB",
    tertiary: "#7FB39A",
    accent: "#EBC85F",
  },
};

const WORLDS = {
  lab: {
    id: "lab",
    name: "The Lab",
    subtitle: "Warm paper · graph grid",
    bg: "#FAF4E6",
    fg: "#1F1A14",
    pattern: "graph",
    accent: "#E25C3B",
    glyph: "⚗",
    levels: 10,
  },
  factory: {
    id: "factory",
    name: "The Factory",
    subtitle: "Steel mesh · safety paint",
    bg: "#D7D2C5",
    fg: "#2A2622",
    pattern: "metal",
    accent: "#E89A1F",
    glyph: "⚙",
    levels: 10,
  },
  castle: {
    id: "castle",
    name: "The Castle",
    subtitle: "Stone walls · torchlight",
    bg: "#C8B791",
    fg: "#2E2218",
    pattern: "stone",
    accent: "#B33A2C",
    glyph: "♛",
    levels: 10,
  },
  space: {
    id: "space",
    name: "Space",
    subtitle: "Vacuum · slow gravity",
    bg: "#0F1330",
    fg: "#F2EBDA",
    pattern: "stars",
    accent: "#7BD3F0",
    glyph: "✦",
    levels: 10,
  },
};

const STYLES = {
  sketchbook: {
    name: "Sketchbook",
    note: "Paper grain · hand-wobble UI · dashed edges",
    radius: 14,
    btnRadius: 999,
    wobble: 0.4,
    grain: 0.18,
    shadow: "0 2px 0 rgba(31,26,20,.18), 0 6px 12px rgba(31,26,20,.08)",
    border: "2px solid currentColor",
    borderStyle: "dashed",
  },
  riso: {
    name: "Risograph",
    note: "Flat saturated · halftone · slight misregister",
    radius: 4,
    btnRadius: 4,
    wobble: 0,
    grain: 0.35,
    shadow: "3px 3px 0 rgba(31,26,20,.85)",
    border: "2px solid currentColor",
    borderStyle: "solid",
  },
  toy: {
    name: "Modern toy",
    note: "Clean surfaces · soft physics shadow · rounded",
    radius: 22,
    btnRadius: 999,
    wobble: 0,
    grain: 0,
    shadow: "0 1px 0 rgba(255,255,255,.6) inset, 0 8px 20px rgba(31,26,20,.14), 0 2px 4px rgba(31,26,20,.08)",
    border: "1.5px solid rgba(31,26,20,.12)",
    borderStyle: "solid",
  },
};

const STROKE_STYLES = {
  pencil: { name: "Pencil", width: 3, tex: "pencil", color: "ink" },
  marker: { name: "Marker", width: 8, tex: "marker", color: "accent" },
  chalk: { name: "Chalk", width: 7, tex: "chalk", color: "paper" },
};

const BALLS = [
  { id: "classic", name: "Classic", color: "#E25C3B", weight: 1.0, bounce: 0.6, locked: false, hint: "balanced" },
  { id: "heavy",   name: "Heavy",   color: "#2A2118", weight: 2.2, bounce: 0.2, locked: false, hint: "drops fast" },
  { id: "bouncy",  name: "Bouncy",  color: "#E8B73E", weight: 0.7, bounce: 0.95, locked: false, hint: "boing!" },
  { id: "feather", name: "Feather", color: "#F4D8E4", weight: 0.3, bounce: 0.5, locked: false, hint: "floaty" },
  { id: "magnet",  name: "Magnet",  color: "#5BB390", weight: 1.0, bounce: 0.4, locked: true,  hint: "sticks" },
  { id: "comet",   name: "Comet",   color: "#7BD3F0", weight: 0.9, bounce: 0.7, locked: true,  hint: "fiery tail" },
];

const VIEWPORTS = {
  mobile:  { name: "Mobile",  w: 412, h: 820,  orient: "portrait"  },
  tablet:  { name: "Tablet",  w: 1024, h: 720, orient: "landscape" },
  desktop: { name: "Desktop", w: 1280, h: 800, orient: "landscape" },
};

const FONTS_URL = "https://fonts.googleapis.com/css2?family=Caprasimo&family=Nunito:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap";

function injectFonts() {
  if (document.getElementById("dp-fonts")) return;
  const l = document.createElement("link");
  l.id = "dp-fonts";
  l.rel = "stylesheet";
  l.href = FONTS_URL;
  document.head.appendChild(l);
}

Object.assign(window, { PALETTES, WORLDS, STYLES, STROKE_STYLES, BALLS, VIEWPORTS, injectFonts });
