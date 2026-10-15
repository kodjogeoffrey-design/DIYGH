import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const STORAGE_KEY = "diygh.coupons.v1";

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
    return parsed;
  } catch {
    return memory;
  }
}

function writeAll(coupons) {
  if (!canUseStorage()) {
    memory.clear();
    for (const [k, v] of Object.entries(coupons)) memory.set(k, v);
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  } catch {
    memory.clear();
    for (const [k, v] of Object.entries(coupons)) memory.set(k, v);
  }
}

function buildCoupon({ code, type, value, minOrder, maxUses, expiresAt, description }) {
  const now = new Date().toISOString();
  return {
    id: `coup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    code: String(code ?? "").trim().toUpperCase(),
    type: type || "percentage", // "percentage" | "fixed" | "free_shipping"
    value: Number(value) || 0,
    min_order: Number(minOrder) || 0,
    max_uses: maxUses ? Number(maxUses) : null,
    used_count: 0,
    expires_at: expiresAt || null,
    description: description || "",
    active: true,
    created_at: now,
    updated_at: now,
  };
}

export async function listCoupons() {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local
    }
  }
  const all = readAll();
  return Object.values(all);
}

export async function getCoupon(code) {
  const upperCode = String(code ?? "").trim().toUpperCase();
  
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", upperCode)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local
    }
  }
  const all = readAll();
  return all[upperCode] ?? null;
}

export async function validateCoupon(code, orderTotal) {
  const coupon = await getCoupon(code);
  if (!coupon) return { valid: false, error: "Invalid coupon code" };
  if (!coupon.active) return { valid: false, error: "Coupon is inactive" };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "Coupon has expired" };
  }
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return { valid: false, error: "Coupon usage limit reached" };
  }
  if (orderTotal < coupon.min_order) {
    return { valid: false, error: `Minimum order of ${coupon.min_order} required` };
  }
  return { valid: true, coupon };
}

export async function applyCoupon(code, orderTotal) {
  const result = await validateCoupon(code, orderTotal);
  if (!result.valid) throw new Error(result.error);
  
  const { coupon } = result;
  let discount = 0;
  
  if (coupon.type === "percentage") {
    discount = Math.round(orderTotal * (coupon.value / 100));
  } else if (coupon.type === "fixed") {
    discount = Math.min(coupon.value, orderTotal);
  } else if (coupon.type === "free_shipping") {
    // Handled separately in shipping calculation
    discount = 0;
  }
  
  return {
    ...coupon,
    discount,
    finalTotal: Math.max(0, orderTotal - discount),
  };
}

export async function createCoupon(couponData) {
  const coupon = buildCoupon(couponData);
  
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.from("coupons").insert(coupon).select().single();
    if (error) throw new Error(error.message || "Could not create coupon");
    if (data) return data;
  }
  
  const all = readAll();
  all[coupon.code] = coupon;
  writeAll(all);
  return coupon;
}

export async function updateCoupon(code, updates) {
  const upperCode = String(code ?? "").trim().toUpperCase();
  
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from("coupons")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("code", upperCode)
      .select()
      .single();
    if (error) throw new Error(error.message || "Could not update coupon");
    if (data) return data;
  }
  
  const all = readAll();
  if (all[upperCode]) {
    all[upperCode] = { ...all[upperCode], ...updates, updated_at: new Date().toISOString() };
    writeAll(all);
    return all[upperCode];
  }
  throw new Error("Coupon not found");
}

export async function deleteCoupon(code) {
  const upperCode = String(code ?? "").trim().toUpperCase();
  
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("coupons").delete().eq("code", upperCode);
    if (error) throw new Error(error.message || "Could not delete coupon");
    return;
  }
  
  const all = readAll();
  delete all[upperCode];
  writeAll(all);
}

export async function incrementCouponUsage(code) {
  const upperCode = String(code ?? "").trim().toUpperCase();
  
  if (isSupabaseConfigured) {
    const { error } = await supabase.rpc("increment_coupon_usage", { coupon_code: upperCode });
    if (error) throw new Error(error.message || "Could not increment usage");
    return;
  }
  
  const all = readAll();
  if (all[upperCode]) {
    all[upperCode].used_count = (all[upperCode].used_count || 0) + 1;
    writeAll(all);
  }
}