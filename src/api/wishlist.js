import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const STORAGE_KEY = "diygh.wishlist.v1";

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
    memory.clear();
    for (const [k, v] of map) memory.set(k, v);
  }
}

function localList(customerId) {
  const all = readAll();
  return all.get(customerId) ?? [];
}

function buildWishlistItem({ productId, customerId }) {
  const id = `wsh_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    product_id: productId,
    customer_id: customerId,
    created_at: new Date().toISOString(),
  };
}

export async function listWishlist(customerId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("*, products(*)")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local wishlist
    }
  }
  return localList(customerId);
}

export async function addToWishlist(customerId, productId) {
  const item = buildWishlistItem({ customerId, productId });

  if (isSupabaseConfigured) {
    const row = {
      id: item.id,
      customer_id: item.customer_id,
      product_id: item.product_id,
      created_at: item.created_at,
    };
    const { data, error } = await supabase.from("wishlist").insert(row).select().single();
    if (error) throw new Error(error.message || "Could not add to wishlist");
    if (data) return data;
  }

  const all = readAll();
  const list = [...(all.get(customerId) ?? [])];
  const exists = list.find((i) => i.product_id === productId);
  if (!exists) {
    list.push(item);
    all.set(customerId, list);
    writeAll(all);
  }
  return item;
}

export async function removeFromWishlist(customerId, productId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("customer_id", customerId)
      .eq("product_id", productId);
    if (error) throw new Error(error.message || "Could not remove from wishlist");
    return;
  }

  const all = readAll();
  const list = all.get(customerId) ?? [];
  const next = list.filter((i) => i.product_id !== productId);
  if (next.length !== list.length) {
    all.set(customerId, next);
    writeAll(all);
  }
}

export async function isInWishlist(customerId, productId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id")
        .eq("customer_id", customerId)
        .eq("product_id", productId)
        .maybeSingle();
      if (error) throw error;
      if (data) return true;
    } catch {
      // fall through
    }
  }
  const list = localList(customerId);
  return list.some((i) => i.product_id === productId);
}

export async function clearWishlist(customerId) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("customer_id", customerId);
    if (error) throw new Error(error.message || "Could not clear wishlist");
    return;
  }
  const all = readAll();
  all.delete(customerId);
  writeAll(all);
}