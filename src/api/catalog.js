import { products as seedProducts } from "../data/products.js";
import { blueprintImage, categoryAccent } from "../lib/product-image.js";
import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

// Catalog API used by the pages. Reads from the Supabase `products` table when
// configured; falls back to the seed catalog + localStorage overlay otherwise
// (tests, offline dev, or a Supabase outage).

const STORAGE_KEY = "diygh.products.v1";

const comparators = {
  "-created_date": (a, b) => b.created_date.localeCompare(a.created_date),
  created_date: (a, b) => a.created_date.localeCompare(b.created_date),
  price: (a, b) => a.price - b.price,
  "-price": (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
  rating: (a, b) => (b.rating || 0) - (a.rating || 0),
  "-rating": (a, b) => (a.rating || 0) - (b.rating || 0),
};

function withFallbackImage(product) {
  if (product.image_url) return product;
  return {
    ...product,
    image_url: blueprintImage({
      label: product.name,
      sublabel: product.sku,
      accent: categoryAccent(product.category),
    }),
  };
}

function normalizeProduct(raw) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    price: Number(raw.price) || 0,
    rating: Number(raw.rating) || 4.5,
    featured: Boolean(raw.featured),
    specs: Array.isArray(raw.specs) ? raw.specs : [],
    kit_contents: Array.isArray(raw.kit_contents) ? raw.kit_contents : [],
    images: Array.isArray(raw.images) ? raw.images : [],
    image_url: raw.image_url || undefined,
    stock_status: raw.stock_status || "In Stock",
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    inventory_qty: Number(raw.inventory_qty) || 0,
    seo_title: raw.seo_title || "",
    seo_description: raw.seo_description || "",
    slug: raw.slug || "",
    published_at: raw.published_at || null,
    unpublished_at: raw.unpublished_at || null,
  };
}

function toRow(product) {
  const created =
    product.created_date || new Date().toISOString().slice(0, 10);
  return {
    id: product.id,
    name: product.name,
    sku: product.sku ?? "",
    price: Number(product.price) || 0,
    category: product.category || "Components",
    short_description: product.short_description ?? "",
    description: product.description ?? "",
    specs: Array.isArray(product.specs) ? product.specs : [],
    kit_contents: Array.isArray(product.kit_contents) ? product.kit_contents : [],
    images: Array.isArray(product.images) ? product.images : [],
    image_url: product.image_url || null,
    stock_status: product.stock_status || "In Stock",
    featured: Boolean(product.featured),
    rating: Number(product.rating) || 4.5,
    created_date: created,
    updated_at: new Date().toISOString(),
    variants: Array.isArray(product.variants) ? product.variants : [],
    inventory_qty: Number(product.inventory_qty) || 0,
    seo_title: product.seo_title || "",
    seo_description: product.seo_description || "",
    slug: product.slug || "",
    published_at: product.published_at || null,
    unpublished_at: product.unpublished_at || null,
  };
}

function readOverlay() {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.map(withFallbackImage);
  } catch {
    return null;
  }
}

function localProducts() {
  return readOverlay() ?? seedProducts.map(withFallbackImage);
}

/** Last successfully loaded list, used by the sync helpers. */
let cache = null;

async function currentProducts() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      const list = (data ?? []).map(normalizeProduct).map(withFallbackImage);
      if (list.length > 0) {
        cache = list;
        return list;
      }
    } catch {
      // fall through to local data
    }
  }
  const local = localProducts();
  cache = local;
  return local;
}

function cachedProducts() {
  if (cache) return cache;
  const local = localProducts();
  cache = local;
  return local;
}

export async function listProducts(sort = "-created_date", limit = 100) {
  const all = await currentProducts();
  const sorted = [...all].sort(comparators[sort] || comparators["-created_date"]);
  return typeof limit === "number" && limit > 0 ? sorted.slice(0, limit) : sorted;
}

export async function getProduct(id) {
  const all = await currentProducts();
  return all.find((product) => product.id === id) ?? null;
}

export function listCategories() {
  return [...new Set(cachedProducts().map((product) => product.category))];
}

/** Snapshot of the live catalog for admin export. */
export function exportCatalog() {
  return cachedProducts();
}

/**
 * Persist a full product list. With Supabase configured this upserts every row
 * and removes products that are no longer in the list (requires sign-in);
 * otherwise it writes the localStorage overlay.
 */
export async function saveCatalog(list) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("Catalog must be a non-empty array");
  }

  if (isSupabaseConfigured) {
    const rows = list.map(toRow);
    const { error } = await supabase.from("products").upsert(rows, {
      onConflict: "id",
    });
    if (error) throw new Error(error.message || "Could not save the catalog");

    const { data: existing, error: readError } = await supabase
      .from("products")
      .select("id");
    if (readError) throw new Error(readError.message || "Could not read the catalog");
    const keep = new Set(list.map((product) => product.id));
    const stale = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id));
    if (stale.length > 0) {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .in("id", stale);
      if (deleteError) throw new Error(deleteError.message || "Could not remove products");
    }
    return currentProducts();
  }

  try {
    if (typeof localStorage === "undefined") {
      throw new Error("localStorage unavailable");
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    throw err;
  }
  cache = null;
  return currentProducts();
}

/** Restore the seed catalog (replaces the live list when Supabase is set up). */
export async function resetCatalog() {
  if (isSupabaseConfigured) {
    const rows = seedProducts.map(toRow);
    const { error } = await supabase.from("products").upsert(rows, {
      onConflict: "id",
    });
    if (error) throw new Error(error.message || "Could not reset the catalog");
    const { data: existing } = await supabase.from("products").select("id");
    const keep = new Set(seedProducts.map((product) => product.id));
    const stale = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id));
    if (stale.length > 0) {
      await supabase.from("products").delete().in("id", stale);
    }
    return currentProducts();
  }

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  cache = null;
  return seedProducts.map(withFallbackImage);
}

export function catalogStorageKey() {
  return STORAGE_KEY;
}
