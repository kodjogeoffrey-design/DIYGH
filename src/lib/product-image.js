// Generates self-contained SVG "blueprint" product images as data URIs.
// The store ships with zero external image dependencies: every catalog image,
// and the broken-image fallback, is rendered from this module.

const CATEGORY_ACCENTS = {
  Boards: "#FFB800",
  Sensors: "#00E676",
  Motors: "#FF7A45",
  Components: "#4CC9F0",
  Kits: "#FFD60A",
  Tools: "#A78BFA",
};

const DEFAULT_ACCENT = "#FFB800";

export function categoryAccent(category) {
  return CATEGORY_ACCENTS[category] || DEFAULT_ACCENT;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fitFont(label) {
  if (label.length <= 18) return 34;
  if (label.length <= 26) return 28;
  if (label.length <= 36) return 22;
  return 17;
}

export function blueprintImage({ label, sublabel = "", accent = DEFAULT_ACCENT }) {
  const safeLabel = escapeXml(label);
  const safeSublabel = escapeXml(sublabel);
  const fontSize = fitFont(label);

  const pins = [];
  for (const x of [270, 330, 390, 450, 510]) {
    pins.push(`<line x1="${x}" y1="248" x2="${x}" y2="212" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`);
    pins.push(`<line x1="${x}" y1="552" x2="${x}" y2="588" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`);
  }
  for (const y of [330, 390, 450]) {
    pins.push(`<line x1="248" y1="${y}" x2="212" y2="${y}" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`);
    pins.push(`<line x1="552" y1="${y}" x2="588" y2="${y}" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`);
  }

  const traces = `
    <path d="M90 90 H170 V150" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.55"/>
    <path d="M710 90 H630 V150" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.55"/>
    <path d="M90 710 H170 V650" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.55"/>
    <path d="M710 710 H630 V650" fill="none" stroke="${accent}" stroke-width="3" stroke-opacity="0.55"/>
    <circle cx="90" cy="90" r="7" fill="${accent}" fill-opacity="0.8"/>
    <circle cx="710" cy="90" r="7" fill="${accent}" fill-opacity="0.8"/>
    <circle cx="90" cy="710" r="7" fill="${accent}" fill-opacity="0.8"/>
    <circle cx="710" cy="710" r="7" fill="${accent}" fill-opacity="0.8"/>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="${accent}" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="800" fill="#121212"/>
  <rect width="800" height="800" fill="url(#grid)"/>
  ${traces}
  <rect x="260" y="260" width="280" height="280" rx="14" fill="#1A1A1A" stroke="${accent}" stroke-width="6"/>
  ${pins.join("\n  ")}
  <rect x="330" y="330" width="140" height="140" rx="6" fill="${accent}" fill-opacity="0.14" stroke="${accent}" stroke-width="3"/>
  <circle cx="288" cy="288" r="10" fill="${accent}"/>
  <text x="400" y="672" text-anchor="middle" fill="#F5F5F5" font-family="monospace" font-size="${fontSize}" font-weight="700">${safeLabel}</text>
  <text x="400" y="712" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="20" letter-spacing="4">${safeSublabel}</text>
  <text x="400" y="120" text-anchor="middle" fill="#8A8A8A" font-family="monospace" font-size="16" letter-spacing="6">DIYGH · PART RENDER</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const placeholderImage = () =>
  blueprintImage({ label: "No image", sublabel: "NO SIGNAL", accent: DEFAULT_ACCENT });
