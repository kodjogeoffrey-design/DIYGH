import { supabase, isSupabaseConfigured } from "./supabase.js";

// Admin authentication. Only the store owner signs in; visitors never need an
// account. All write policies in Supabase check auth.role() = 'authenticated'.

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured");
  }
  return supabase;
}

/** Sign in an admin user. Returns the user, throws on bad credentials. */
export async function signIn(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email ?? "").trim(),
    password: String(password ?? ""),
  });
  if (error) throw new Error(error.message || "Could not sign in");
  return data.user;
}

/** Sign the admin out. */
export async function signOut() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || "Could not sign out");
}

/** Current session (or null). Resolves null when Supabase is not configured. */
export async function getSession() {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session ?? null;
}

/** True when an admin is signed in. */
export async function isAuthenticated() {
  const session = await getSession();
  return Boolean(session);
}

/** Subscribe to auth changes; returns an unsubscribe function. */
export function onAuthChange(callback) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data?.subscription?.unsubscribe?.();
}

/* ==========================================================================
   Customer authentication (public shopper accounts)
   ========================================================================== */

/** Sign up a new customer. Returns the user (may need email confirmation). */
export async function signUp(email, password, metadata = {}) {
  const client = requireClient();
  const { data, error } = await client.auth.signUp({
    email: String(email ?? "").trim(),
    password: String(password ?? ""),
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/#/account`,
    },
  });
  if (error) throw new Error(error.message || "Could not create account");
  return data.user;
}

/** Sign in a customer. Returns the user, throws on bad credentials. */
export async function customerSignIn(email, password) {
  const client = requireClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: String(email ?? "").trim(),
    password: String(password ?? ""),
  });
  if (error) throw new Error(error.message || "Could not sign in");
  return data.user;
}

/** Sign out the current customer. */
export async function customerSignOut() {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message || "Could not sign out");
}

/** Get current customer user (or null). */
export async function getCustomer() {
  if (!isSupabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/** Check if a customer is signed in. */
export async function isCustomerAuthenticated() {
  const user = await getCustomer();
  return Boolean(user);
}

/** Send password reset email. */
export async function resetPassword(email) {
  const client = requireClient();
  const { error } = await client.auth.resetPasswordForEmail(String(email ?? "").trim(), {
    redirectTo: `${window.location.origin}/#/reset-password`,
  });
  if (error) throw new Error(error.message || "Could not send reset email");
}

/** Update customer password (after reset). */
export async function updatePassword(newPassword) {
  const client = requireClient();
  const { error } = await client.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message || "Could not update password");
}

/** Update customer metadata (e.g., full_name). */
export async function updateUser(updates) {
  const client = requireClient();
  const { error } = await client.auth.updateUser(updates);
  if (error) throw new Error(error.message || "Could not update profile");
}

/** Subscribe to customer auth changes; returns an unsubscribe function. */
export function onCustomerAuthChange(callback) {
  if (!isSupabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data?.subscription?.unsubscribe?.();
}
