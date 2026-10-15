// Resolve public/ asset paths against Vite's BASE_URL so the build works
// from any sub-path (e.g. GitHub Pages project sites) with `base: "./"`.

export function assetUrl(path) {
  if (!path) return "";
  const raw = String(path);
  if (/^(data:|https?:|blob:|\/\/)/i.test(raw)) return raw;
  let base = "/";
  try {
    /** @type {any} */
    const meta = import.meta;
    const env = meta && meta.env;
    if (env && typeof env.BASE_URL === "string" && env.BASE_URL) base = env.BASE_URL;
  } catch {
    // non-Vite environment (node tests) — keep root-relative default
  }
  const clean = raw.replace(/^\/+/, "");
  if (!clean) return base;
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
}
