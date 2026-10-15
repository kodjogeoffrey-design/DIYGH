import { STORE_TAGLINE } from "./config.js";
import { supabase, isSupabaseConfigured } from "./supabase.js";

// Editable store settings (tagline + announcement). `getSettings()` stays
// synchronous (components read it during render) and serves a localStorage /
// in-memory cache; `loadSettings()` refreshes that cache from the Supabase
// `settings` table at boot, and `saveSettings()` writes back (admin only).

const STORAGE_KEY = "diygh.settings.v1";
const LEGACY_TAGLINE = "Build Something. Learn Everything.";
const SETTINGS_ROW_ID = 1;

export const DEFAULT_SETTINGS = Object.freeze({
  tagline: STORE_TAGLINE,
  announcement: "Free delivery in Accra over GH₵ 200 · WhatsApp orders 7am–9pm",
});

/** @type {Record<string, any> | null} */
let memoryCache = null;

function canUseStorage() {
  try {
    return typeof localStorage !== "undefined" && localStorage !== null;
  } catch {
    return false;
  }
}

function readStored() {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(settings) {
  memoryCache = settings;
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    memoryCache = settings;
  }
}

export function getSettings() {
  const stored = readStored() ?? memoryCache;
  const settings = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  if (settings.tagline === LEGACY_TAGLINE) {
    settings.tagline = DEFAULT_SETTINGS.tagline;
    if (stored) writeStored(settings);
  }
  return settings;
}

/** Pull the live settings from Supabase into the local cache. */
export async function loadSettings() {
  if (!isSupabaseConfigured) return getSettings();
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("tagline, announcement")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();
    if (error || !data) return getSettings();
    const next = {
      ...getSettings(),
      tagline: data.tagline || DEFAULT_SETTINGS.tagline,
      announcement: data.announcement || DEFAULT_SETTINGS.announcement,
    };
    writeStored(next);
    return next;
  } catch {
    return getSettings();
  }
}

/** Save a settings patch locally and (when configured) to Supabase. */
export async function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  writeStored(next);
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("settings").upsert({
      id: SETTINGS_ROW_ID,
      tagline: next.tagline,
      announcement: next.announcement,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message || "Could not save settings");
  }
  return next;
}

/** Restore the defaults locally and in Supabase. */
export async function resetSettings() {
  memoryCache = null;
  try {
    if (canUseStorage()) localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  const defaults = { ...DEFAULT_SETTINGS };
  if (isSupabaseConfigured) {
    const { error } = await supabase.from("settings").upsert({
      id: SETTINGS_ROW_ID,
      tagline: defaults.tagline,
      announcement: defaults.announcement,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message || "Could not reset settings");
  }
  writeStored(defaults);
  return defaults;
}
