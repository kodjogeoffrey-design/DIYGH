import { supabase, isSupabaseConfigured } from "./supabase.js";

// Customer reviews. With Supabase configured, reviews live in the `reviews`
// table: anyone can read and post, nobody can edit, only the signed-in admin
// can delete. Without Supabase they stay in localStorage (tests / offline).

const STORAGE_KEY = "diygh.reviews.v1";

/** @type {Map<string, any[]>} */
const memory = new Map();

function canUseStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

function readAll() {
  if (!canUseStorage()) return memory;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return memory;
    const map = new Map();
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) map.set(key, value);
    }
    return map;
  } catch {
    return memory;
  }
}

function writeAll(map) {
  if (!canUseStorage()) {
    if (map === memory) return;
    memory.clear();
    for (const [k, v] of map) memory.set(k, v);
    return;
  }
  try {
    const obj = Object.fromEntries(map);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // fall back to memory for this session
    memory.clear();
    for (const [k, v] of map) memory.set(k, v);
  }
}

function localList(productId) {
  const all = readAll();
  return all.get(productId) ?? [];
}

function buildReview({ name, rating, comment }) {
  const trimmedName = String(name ?? "").trim();
  const trimmedComment = String(comment ?? "").trim();
  const stars = Math.min(5, Math.max(1, Math.round(Number(rating) || 5)));
  if (!trimmedName || !trimmedComment) {
    throw new Error("Review needs a name and a comment");
  }
  return {
    id: `rev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: trimmedName,
    rating: stars,
    comment: trimmedComment,
    created_date: new Date().toISOString().slice(0, 10),
  };
}

/** @returns {Promise<any[]>} */
export async function listReviews(productId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_date", { ascending: true })
        .order("id", { ascending: true });
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local reviews
    }
  }
  return localList(productId);
}

/** Post a review. Anyone can do this — no account needed. */
export async function addReview(productId, { name, rating, comment }) {
  const review = buildReview({ name, rating, comment });

  if (isSupabaseConfigured) {
    const row = {
      id: review.id,
      product_id: productId,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      created_date: review.created_date,
    };
    const { data, error } = await supabase.from("reviews").insert(row).select().single();
    if (error) throw new Error(error.message || "Could not post the review");
    if (data) return data;
  }

  const all = readAll();
  const list = [...(all.get(productId) ?? []), review];
  all.set(productId, list);
  writeAll(all);
  return review;
}

/** Average rating for a product, or null when there are no reviews. */
export async function averageLocalRating(productId) {
  const list = await listReviews(productId);
  if (!list.length) return null;
  return list.reduce((sum, r) => sum + r.rating, 0) / list.length;
}

/** Every review, newest first (admin moderation). Includes the product name when known. */
export async function listAllReviews() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, products(name, sku)")
        .order("created_date", { ascending: false })
        .order("id", { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local reviews
    }
  }
  const all = readAll();
  const flat = [];
  for (const [productId, list] of all) {
    for (const review of list) flat.push({ ...review, product_id: productId });
  }
  return flat.sort((a, b) => String(b.created_date).localeCompare(String(a.created_date)));
}

/** Delete one review. Anonymous visitors can't do this — RLS requires a signed-in admin. */
export async function deleteReview(id) {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) throw new Error(error.message || "Could not delete the review");
    return;
  }
  const all = readAll();
  let changed = false;
  for (const [productId, list] of all) {
    const next = list.filter((review) => review.id !== id);
    if (next.length !== list.length) {
      all.set(productId, next);
      changed = true;
    }
  }
  if (changed) writeAll(all);
}

/** Remove every review (admin only once Supabase is configured). */
export async function clearReviews() {
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("reviews").delete().neq("id", "");
    if (error) throw new Error(error.message || "Could not clear reviews");
    return;
  }
  const all = readAll();
  const keys = [...all.keys()];
  if (all === memory) {
    memory.clear();
    return;
  }
  for (const key of keys) all.delete(key);
  writeAll(all);
}
