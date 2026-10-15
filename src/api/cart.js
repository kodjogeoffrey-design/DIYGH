import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const STORAGE_KEY = "diygh.cart.v1";

const memory = new Map();

function canUseStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

function readLocal(customerId) {
  if (!canUseStorage()) return memory.get(customerId) ?? [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${customerId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(customerId, items) {
  if (!canUseStorage()) {
    memory.set(customerId, items);
    return;
  }
  try {
    localStorage.setItem(`${STORAGE_KEY}_${customerId}`, JSON.stringify(items));
  } catch {
    memory.set(customerId, items);
  }
}

function buildCartRow({ customerId, items, couponCode, updatedAt = new Date().toISOString() }) {
  return {
    customer_id: customerId,
    items: items || [],
    coupon_code: couponCode || null,
    updated_at: updatedAt,
  };
}

export async function getCart(customerId) {
  if (!customerId) return [];
  
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("carts")
        .select("items, coupon_code")
        .eq("customer_id", customerId)
        .maybeSingle();
      if (error) throw error;
      if (data) return { items: data.items || [], couponCode: data.coupon_code };
    } catch {
      // fall through to local
    }
  }
  return { items: readLocal(customerId), couponCode: null };
}

export async function saveCart(customerId, items, couponCode = null) {
  if (!customerId) return;
  
  const row = buildCartRow({ customerId, items, couponCode });
  
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("carts").upsert(row, { onConflict: "customer_id" });
    if (error) throw new Error(error.message || "Could not save cart");
  }
  
  writeLocal(customerId, items);
}

export async function clearCart(customerId) {
  if (!customerId) return;
  
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("carts").delete().eq("customer_id", customerId);
    if (error) throw new Error(error.message || "Could not clear cart");
  }
  
  writeLocal(customerId, []);
}

export async function mergeCarts(localItems, serverItems) {
  // Merge strategy: server items take precedence, but keep local items not on server
  const serverMap = new Map(serverItems.map((i) => [i.id, i]));
  const merged = [...serverItems];
  
  for (const localItem of localItems) {
    if (!serverMap.has(localItem.id)) {
      merged.push(localItem);
    }
  }
  
  return merged;
}