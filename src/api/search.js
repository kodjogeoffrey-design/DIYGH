import { supabase, isSupabaseConfigured } from "../lib/supabase.js";
import { listProducts as listProductsCatalog } from "./catalog.js";

// Client-side search fallback (current behavior)
function clientSearch(products, query) {
  if (!query?.trim()) return products;
  const q = query.toLowerCase().trim();
  return products.filter(
    (p) =>
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.short_description?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
  );
}

// Build tsquery from user input - handles wildcards, phrases, etc.
function buildTsQuery(query) {
  if (!query?.trim()) return null;
  
  // Split into terms, handle quoted phrases
  const terms = [];
  let current = "";
  let inQuotes = false;
  
  for (const char of query.trim()) {
    if (char === '"') {
      inQuotes = !inQuotes;
      if (!inQuotes && current) {
        terms.push({ phrase: current });
        current = "";
      }
    } else if (char === " " && !inQuotes) {
      if (current) {
        terms.push({ term: current });
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current) {
    terms.push(inQuotes ? { phrase: current } : { term: current });
  }

  if (!terms.length) return null;

  // Build tsquery string
  return terms
    .map((t) => {
      if (t.phrase) {
        // Phrase search - use phraseto_tsquery equivalent
        return `"${t.phrase.replace(/"/g, "")}"`;
      }
      // Prefix search for partial matches
      return `${t.term}:*`;
    })
    .join(" & ");
}

/** Full-text search with Supabase PostgreSQL FTS fallback to client-side */
export async function searchProducts(query, options = {}) {
  const { category, priceMin, priceMax, stockStatus, sort = "-created_date", limit = 100 } = options;

  // If Supabase is configured, use server-side full-text search
  if (isSupabaseConfigured) {
    try {
      const tsQuery = buildTsQuery(query);
      
      let supabaseQuery = supabase
        .from("products")
        .select("*");

      // Apply full-text search if query provided
      if (tsQuery) {
        supabaseQuery = supabaseQuery.textSearch("search_vector", tsQuery, {
          type: "websearch", // Supports quotes, -, etc.
          config: "english",
        });
      }

      // Apply filters
      if (category && category !== "all") {
        supabaseQuery = supabaseQuery.eq("category", category);
      }
      if (priceMin !== undefined && priceMin !== null) {
        supabaseQuery = supabaseQuery.gte("price", priceMin);
      }
      if (priceMax !== undefined && priceMax !== null) {
        supabaseQuery = supabaseQuery.lte("price", priceMax);
      }
      if (stockStatus && stockStatus !== "all") {
        supabaseQuery = supabaseQuery.eq("stock_status", stockStatus);
      }

      // Apply sorting
      const [field, dir] = sort.startsWith("-") ? [sort.slice(1), "desc"] : [sort, "asc"];
      supabaseQuery = supabaseQuery.order(field, { ascending: dir === "asc" });

      // Apply limit
      if (limit > 0) {
        supabaseQuery = supabaseQuery.limit(limit);
      }

      const { data, error } = await supabaseQuery;
      if (error) throw error;

      const products = (data ?? []).map(normalizeProduct);
      return products;
    } catch (err) {
      console.warn("Server-side search failed, falling back to client-side:", err);
      // Fall through to client-side
    }
  }

  // Client-side fallback
  const allProducts = await listProductsCatalog(sort, 0);
  let filtered = clientSearch(allProducts, query);

  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category === category);
  }
  if (priceMin !== undefined && priceMin !== null) {
    filtered = filtered.filter((p) => p.price >= priceMin);
  }
  if (priceMax !== undefined && priceMax !== null) {
    filtered = filtered.filter((p) => p.price <= priceMax);
  }
  if (stockStatus && stockStatus !== "all") {
    filtered = filtered.filter((p) => p.stock_status === stockStatus);
  }

  return limit > 0 ? filtered.slice(0, limit) : filtered;
}

/** Get search suggestions based on product names/categories */
export async function getSearchSuggestions(query, limit = 5) {
  if (!query?.trim() || query.length < 2) return [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("name, category, sku")
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,category.ilike.%${query}%`)
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    } catch {
      // Fall through to client-side
    }
  }

  // Client-side fallback
  const allProducts = await listProductsCatalog("-created_date", 0);
  const q = query.toLowerCase();
  return allProducts
    .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    .slice(0, limit)
    .map((p) => ({ name: p.name, category: p.category, sku: p.sku }));
}

/** Get popular search terms (from analytics - placeholder for now) */
export async function getPopularSearches(limit = 5) {
  // In a real implementation, this would query a search_analytics table
  // For now, return static suggestions based on categories
  const categories = await listProductsCatalog("-created_date", 0).then((p) => [...new Set(p.map((x) => x.category))]);
  return categories.slice(0, limit).map((c) => ({ term: c, count: 0 }));
}

// Re-export normalizeProduct from catalog for consistency
import { blueprintImage, categoryAccent } from "../lib/product-image.js";

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