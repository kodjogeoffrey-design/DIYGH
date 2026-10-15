import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

const STORAGE_KEY = "diygh.orders.v1";

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

function buildOrder({ items, total, customerId, customerEmail, whatsappMessage }) {
  const id = `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    customer_id: customerId,
    customer_email: customerEmail,
    items,
    total: Number(total) || 0,
    whatsapp_message: whatsappMessage,
    status: "pending",
    created_date: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  };
}

export async function listOrders(customerId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local orders
    }
  }
  return localList(customerId);
}

export async function createOrder(orderData) {
  const order = buildOrder(orderData);

  if (isSupabaseConfigured) {
    const row = {
      id: order.id,
      customer_id: order.customer_id,
      customer_email: order.customer_email,
      items: order.items,
      total: order.total,
      whatsapp_message: order.whatsapp_message,
      status: order.status,
      created_date: order.created_date,
      created_at: order.created_at,
    };
    const { data, error } = await supabase.from("orders").insert(row).select().single();
    if (error) throw new Error(error.message || "Could not create order");
    if (data) return data;
  }

  const all = readAll();
  const list = [...(all.get(order.customer_id) ?? []), order];
  all.set(order.customer_id, list);
  writeAll(all);
  return order;
}

export async function getOrder(id, customerId) {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("customer_id", customerId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
    } catch {
      // fall through to local
    }
  }
  const list = localList(customerId);
  return list.find((o) => o.id === id) ?? null;
}