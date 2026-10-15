import { createClient } from "@supabase/supabase-js";

// Single Supabase client for the whole app. The project is public-safe: the
// anon key is shipped to the browser and Row Level Security decides what each
// visitor may do (read everything, insert reviews, writes require sign-in).
// Without env vars the app falls back to the seed catalog + localStorage.

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const SUPABASE_PRODUCTS_BUCKET = "product-images";
