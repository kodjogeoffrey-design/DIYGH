import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Megaphone,
  LogIn,
  LogOut,
  ImagePlus,
  MessageSquare,
  RefreshCw,
  Search,
  Calendar,
  X,
} from "lucide-react";
import {
  saveCatalog,
  resetCatalog,
  listCategories,
  listProducts,
} from "@/api/catalog";
import { getSettings, saveSettings, resetSettings } from "@/lib/settings";
import { listAllReviews, deleteReview } from "@/lib/reviews";
import { signIn, signOut, getSession, onAuthChange } from "@/lib/auth";
import {
  isSupabaseConfigured,
  supabase,
  SUPABASE_PRODUCTS_BUCKET,
} from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

const EMPTY_PRODUCT = {
  id: "",
  name: "",
  sku: "",
  price: 0,
  category: "Components",
  short_description: "",
  description: "",
  image_url: "",
  images: [],
  stock_status: "In Stock",
  featured: false,
  rating: 4.5,
  created_date: new Date().toISOString().slice(0, 10),
  variants: [],
  inventory_qty: 0,
  seo_title: "",
  seo_description: "",
  slug: "",
  published_at: null,
  unpublished_at: null,
};

function productToForm(p) {
  return {
    ...EMPTY_PRODUCT,
    ...p,
    price: Number(p.price) || 0,
    images: Array.isArray(p.images) ? p.images : [],
    variants: Array.isArray(p.variants) ? p.variants : [],
    inventory_qty: Number(p.inventory_qty) || 0,
    seo_title: p.seo_title || "",
    seo_description: p.seo_description || "",
    slug: p.slug || "",
    published_at: p.published_at || null,
    unpublished_at: p.unpublished_at || null,
  };
}

const STOCK_OPTIONS = ["In Stock", "Low Stock", "Backorder", "Out of Stock"];
const SORT_OPTIONS = [
  { value: "-created_date", label: "Newest first" },
  { value: "created_date", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
  { value: "-price", label: "Price high–low" },
  { value: "price", label: "Price low–high" },
  { value: "-rating", label: "Rating high–low" },
];

export default function Admin() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [settings, setSettings] = useState(getSettings());
  const [importText, setImportText] = useState("");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modReviews, setModReviews] = useState([]);
  const [galleryDraft, setGalleryDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sortBy, setSortBy] = useState("-created_date");
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getSession()
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    const unsubscribe = onAuthChange((s) => setSession(s));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    listProducts("-created_date", 0)
      .then((list) => {
        if (!cancelled) setProducts(list.map(productToForm));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    listAllReviews()
      .then((list) => {
        if (!cancelled) setModReviews(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session]);

  const categories = useMemo(() => {
    const fromData = listCategories();
    if (form.category && !fromData.includes(form.category)) {
      return [...fromData, form.category];
    }
    return fromData;
  }, [products, form.category]);

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    if (showOnlyFeatured) {
      result = result.filter((p) => p.featured);
    }

    if (showOnlyLowStock) {
      result = result.filter((p) => p.stock_status === "Low Stock" || p.stock_status === "Out of Stock");
    }

    // Sort
    const [field, dir] = sortBy.startsWith("-") ? [sortBy.slice(1), -1] : [sortBy, 1];
    result = [...result].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      if (av === null || av === undefined) return dir;
      if (bv === null || bv === undefined) return -dir;
      return av < bv ? -dir : dir;
    });

    return result;
  }, [products, searchQuery, sortBy, showOnlyFeatured, showOnlyLowStock]);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Clear error when user types
    if (formErrors[key]) {
      setFormErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.id?.trim()) errors.id = "ID is required";
    if (!form.name?.trim()) errors.name = "Name is required";
    if (!form.price || Number(form.price) < 0) errors.price = "Valid price is required";
    if (form.rating && (Number(form.rating) < 1 || Number(form.rating) > 5)) errors.rating = "Rating must be 1–5";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const startNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_PRODUCT,
      id: `custom-${Date.now().toString(36)}`,
      created_date: new Date().toISOString().slice(0, 10),
    });
    setFormErrors({});
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm(productToForm(p));
    setFormErrors({});
  };

  const clearForm = () => {
    setEditingId(null);
    setForm(EMPTY_PRODUCT);
    setFormErrors({});
  };

  const duplicateProduct = (p) => {
    const newProduct = {
      ...productToForm(p),
      id: `custom-${Date.now().toString(36)}`,
      name: `${p.name} (copy)`,
      sku: "",
      created_date: new Date().toISOString().slice(0, 10),
      variants: [],
      inventory_qty: 0,
      seo_title: "",
      seo_description: "",
      slug: "",
      published_at: null,
      unpublished_at: null,
    };
    setEditingId(newProduct.id);
    setForm(newProduct);
    setFormErrors({});
  };

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const bulkDelete = async () => {
    if (!selectedIds.size) return;
    const next = products.filter((p) => !selectedIds.has(p.id));
    if (!next.length) {
      toast({ title: "Cannot remove all products" });
      return;
    }
    const saved = await persist(next);
    if (saved) {
      setSelectedIds(new Set());
      if (editingId && selectedIds.has(editingId)) clearForm();
    }
  };

  const bulkToggleFeatured = async (featured) => {
    if (!selectedIds.size) return;
    const next = products.map((p) => (selectedIds.has(p.id) ? { ...p, featured } : p));
    const saved = await persist(next);
    if (saved) setSelectedIds(new Set());
  };

  const persist = async (next) => {
    try {
      await saveCatalog(next);
      setProducts(next.map(productToForm));
      toast({
        title: "Catalog saved",
        description: isSupabaseConfigured ? "Saved to database." : "Stored in this browser.",
      });
      return true;
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setSigningIn(true);
    try {
      await signIn(email, password);
      setPassword("");
      toast({ title: "Signed in", description: "Catalog edits now save to Supabase." });
    } catch (err) {
      toast({
        title: "Sign-in failed",
        description: err instanceof Error ? err.message : "Check your credentials",
        variant: "destructive",
      });
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out" });
    } catch (err) {
      toast({
        title: "Sign-out failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isSupabaseConfigured || !session) {
      toast({
        title: "Sign in first",
        description: "Images upload to Supabase Storage once you are signed in.",
        variant: "destructive",
      });
      return;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeId = (form.id || "product").replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    const path = `${safeId}-${Date.now()}.${ext}`;
    setBusy(true);
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_PRODUCTS_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw new Error(error.message || "Upload failed");
      const { data } = supabase.storage.from(SUPABASE_PRODUCTS_BUCKET).getPublicUrl(path);
      setField("image_url", data.publicUrl);
      toast({ title: "Image uploaded", description: "Saved to Supabase Storage." });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try another file",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const galleryList = () => (Array.isArray(form.images) ? form.images : []);

  const addGalleryUrl = (raw) => {
    const value = String(raw ?? "").trim();
    if (!value) return;
    if (galleryList().includes(value)) {
      toast({ title: "Already in the gallery" });
      return;
    }
    setField("images", [...galleryList(), value]);
  };

  const removeGalleryImage = (index) => {
    setField("images", galleryList().filter((_, i) => i !== index));
  };

  const uploadGalleryImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isSupabaseConfigured || !session) {
      toast({
        title: "Sign in first",
        description: "Photos upload to Supabase Storage once you are signed in.",
        variant: "destructive",
      });
      return;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const safeId = (form.id || "product").replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
    const path = `gallery/${safeId}-${Date.now()}.${ext}`;
    setBusy(true);
    try {
      const { error } = await supabase.storage
        .from(SUPABASE_PRODUCTS_BUCKET)
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw new Error(error.message || "Upload failed");
      const { data } = supabase.storage.from(SUPABASE_PRODUCTS_BUCKET).getPublicUrl(path);
      setField("images", [...galleryList(), data.publicUrl]);
      toast({ title: "Photo added to gallery" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Try another file",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const removeReview = async (id) => {
    try {
      await deleteReview(id);
      setModReviews((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Review deleted" });
    } catch (err) {
      toast({
        title: "Could not delete review",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSavingProduct(true);
    try {
      const cleaned = {
        ...form,
        price: Number(form.price) || 0,
        rating: Number(form.rating) || 4.5,
        image_url: form.image_url || undefined,
        images: galleryList(),
        featured: Boolean(form.featured),
      };
      const exists = products.some((p) => p.id === cleaned.id);
      const next = exists
        ? products.map((p) => (p.id === cleaned.id ? cleaned : p))
        : [cleaned, ...products];
      const saved = await persist(next);
      if (!saved) return;
      if (exists) setEditingId(cleaned.id);
      else clearForm();
    } finally {
      setSavingProduct(false);
    }
  };

  const removeProduct = async (id) => {
    const next = products.filter((p) => p.id !== id);
    if (!next.length) {
      toast({ title: "Cannot remove last product" });
      return;
    }
    const saved = await persist(next);
    if (!saved) return;
    if (editingId === id) clearForm();
  };

  const exportJson = async () => {
    const list = await listProducts("-created_date", 0);
    const data = JSON.stringify(list, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diygh-catalog.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export started", description: "diygh-catalog.json" });
  };

  const importJson = async (text) => {
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed) || !parsed.length) {
        throw new Error("Expected a non-empty array of products");
      }
      const saved = await persist(parsed);
      if (!saved) return;
      setImportText("");
      clearForm();
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Invalid JSON",
        variant: "destructive",
      });
    }
  };

  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      await importJson(String(reader.result ?? ""));
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const resetAll = async () => {
    try {
      const seed = await resetCatalog();
      setProducts(seed.map(productToForm));
      clearForm();
      toast({
        title: "Catalog reset to seed data",
        description: isSupabaseConfigured ? "Supabase catalog restored." : undefined,
      });
    } catch (err) {
      toast({
        title: "Reset failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const saveSettingsForm = async (e) => {
    e.preventDefault();
    try {
      const next = await saveSettings({
        tagline: settings.tagline,
        announcement: settings.announcement,
      });
      setSettings(next);
      toast({ title: "Store settings saved" });
    } catch (err) {
      toast({
        title: "Could not save settings",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const resetSettingsForm = async () => {
    try {
      setSettings(await resetSettings());
      toast({ title: "Defaults restored" });
    } catch (err) {
      toast({
        title: "Could not reset settings",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const inputCls =
    "w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm focus:border-primary/60 focus:outline-none";

  if (authLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="font-mono-tech text-sm uppercase tracking-wider text-muted-foreground">
          Checking session…
        </p>
      </div>
    );
  }

  if (isSupabaseConfigured && !session) {
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <div className="border-b border-border pb-6">
          <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Console</p>
          <h1 className="mt-1 font-heading text-3xl font-700">Admin sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The catalog, reviews, and settings live in Supabase. Sign in with the
            store admin account to edit them.
          </p>
        </div>
        <form
          onSubmit={handleSignIn}
          className="mt-6 grid gap-4 rounded-sm border border-border bg-card p-4"
        >
          <label className="block">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              className={`mt-1 ${inputCls}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              className={`mt-1 ${inputCls}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={signingIn}
            className="flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" /> {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-6">
        <div>
          <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Console</p>
          <h1 className="mt-1 font-heading text-3xl font-700">Store admin</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {isSupabaseConfigured
              ? "Edits save to Supabase and go live for every visitor as soon as you save."
              : "Supabase is not configured — edits stay in this browser. Fill in .env.local to connect the store backend."}
          </p>
        </div>
        {isSupabaseConfigured && (
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        )}
      </div>

      {/* Settings */}
      <section className="mt-6 rounded-sm border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-600">
            <Megaphone className="h-4 w-4 text-primary" /> Tagline & announcement
          </h2>
          <button
            type="button"
            onClick={resetSettingsForm}
            className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Defaults
          </button>
        </div>
        <form onSubmit={saveSettingsForm} className="grid gap-4 p-4 md:grid-cols-2">
          <label className="block">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              Hero tagline
            </span>
            <input
              className={`mt-1 ${inputCls}`}
              value={settings.tagline}
              onChange={(e) => setSettings((s) => ({ ...s, tagline: e.target.value }))}
              placeholder="The Hardware behind the innovation"
            />
          </label>
          <label className="block">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              Announcement (header ticker)
            </span>
            <input
              className={`mt-1 ${inputCls}`}
              value={settings.announcement}
              onChange={(e) => setSettings((s) => ({ ...s, announcement: e.target.value }))}
              placeholder="Free delivery in Tarkwa over GH₵ 200"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
            >
              <Save className="h-4 w-4" /> Save settings
            </button>
          </div>
        </form>
      </section>

      {/* Catalog tools */}
      <section className="mt-6 rounded-sm border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-heading text-lg font-600">
            Catalog <span className="font-mono-tech text-xs text-muted-foreground">({products.length})</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startNew}
              className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
            >
              <Plus className="h-3.5 w-3.5" /> New product
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50">
              <Upload className="h-3.5 w-3.5" /> Import
              <input type="file" accept="application/json,.json" className="hidden" onChange={onImportFile} />
            </label>
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1.5 rounded-sm border border-destructive/40 bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset seed
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-1 min-w-[250px] items-center gap-2 rounded-sm border border-border bg-background px-3 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, ID, SKU, category..."
                className="flex-1 bg-transparent font-mono-tech text-sm placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
              <input
                type="checkbox"
                checked={showOnlyFeatured}
                onChange={(e) => setShowOnlyFeatured(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Featured only
            </label>
            <label className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
              <input
                type="checkbox"
                checked={showOnlyLowStock}
                onChange={(e) => setShowOnlyLowStock(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Low stock
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider focus:border-primary/60 focus:outline-none"
            >
              <option value="-created_date">Newest first</option>
              <option value="created_date">Oldest first</option>
              <option value="name">Name A–Z</option>
              <option value="-name">Name Z–A</option>
              <option value="-price">Price high–low</option>
              <option value="price">Price low–high</option>
              <option value="-rating">Rating high–low</option>
            </select>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6 p-4 lg:grid-cols-2">
          {/* Form */}
          <form onSubmit={saveProduct} className="rounded-sm border border-border bg-background p-4">
            <h3 className="font-heading text-base font-600">
              {editingId ? `Edit ${editingId}` : "New product"}
            </h3>
            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">ID</span>
                <input
                  className={`mt-1 ${inputCls}`}
                  value={form.id}
                  onChange={(e) => setField("id", e.target.value)}
                  disabled={Boolean(editingId)}
                  required
                />
              </label>
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">Name</span>
                <input
                  className={`mt-1 ${inputCls}`}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">SKU</span>
                  <input
                    className={`mt-1 ${inputCls}`}
                    value={form.sku}
                    onChange={(e) => setField("sku", e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                    Price (GH₵)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={`mt-1 ${inputCls}`}
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                    Category
                  </span>
                  <select
                    className={`mt-1 ${inputCls}`}
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                    Stock
                  </span>
                  <select
                    className={`mt-1 ${inputCls}`}
                    value={form.stock_status}
                    onChange={(e) => setField("stock_status", e.target.value)}
                  >
                    <option>In Stock</option>
                    <option>Low Stock</option>
                    <option>Backorder</option>
                  </select>
                </label>
              </div>
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Image
                </span>
                <div className="mt-1 flex items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50">
                    <ImagePlus className="h-3.5 w-3.5" /> Upload photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadImage}
                      disabled={busy}
                    />
                  </label>
                  {form.image_url && (
                    <img
                      src={form.image_url}
                      alt=""
                      className="h-9 w-9 rounded-sm border border-border object-cover"
                    />
                  )}
                </div>
                <input
                  className={`mt-2 ${inputCls}`}
                  value={form.image_url ?? ""}
                  onChange={(e) => setField("image_url", e.target.value)}
                  placeholder="/images/products/… or a Supabase Storage URL"
                />
              </div>

              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Gallery photos
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {galleryList().map((src, i) => (
                    <div key={`${src}-${i}`} className="relative">
                      <img
                        src={src}
                        alt=""
                        className="h-14 w-14 rounded-sm border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i)}
                        aria-label="Remove photo"
                        className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full border border-border bg-background text-[10px] leading-none text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="flex h-14 cursor-pointer items-center gap-1.5 rounded-sm border border-dashed border-border px-3 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground hover:border-primary/50 hover:text-foreground">
                    <ImagePlus className="h-3.5 w-3.5" /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadGalleryImage}
                      disabled={busy}
                    />
                  </label>
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    className={inputCls}
                    value={galleryDraft}
                    onChange={(e) => setGalleryDraft(e.target.value)}
                    placeholder="/images/products/… or Storage URL"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      addGalleryUrl(galleryDraft);
                      setGalleryDraft("");
                    }}
                    className="rounded-sm border border-border bg-background px-3 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
                  >
                    Add
                  </button>
                </div>
                <p className="mt-1.5 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Shown as thumbnails under the product photo
                </p>
              </div>
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Short description
                </span>
                <textarea
                  className={`mt-1 ${inputCls}`}
                  rows={2}
                  value={form.short_description}
                  onChange={(e) => setField("short_description", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Description
                </span>
                <textarea
                  className={`mt-1 ${inputCls}`}
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setField("featured", e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
                  Rating
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    className="w-20 rounded-sm border border-border bg-background px-2 py-1 font-mono-tech text-sm focus:border-primary/60 focus:outline-none"
                    value={form.rating}
                    onChange={(e) => setField("rating", e.target.value)}
                  />
                </label>
              </div>

              {/* Variants */}
              <fieldset className="border border-border rounded-sm p-3">
                <legend className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground px-2">
                  Variants (size, color, etc.)
                </legend>
                <div className="mt-2 space-y-2">
                  {form.variants.map((variant, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Name (e.g., Red, Large)"
                        className={inputCls}
                        value={variant.name || ""}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...next[idx], name: e.target.value };
                          setField("variants", next);
                        }}
                      />
                      <input
                        type="text"
                        placeholder="SKU"
                        className={`w-32 ${inputCls}`}
                        value={variant.sku || ""}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...next[idx], sku: e.target.value };
                          setField("variants", next);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        className={`w-20 ${inputCls}`}
                        value={variant.inventory_qty || 0}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...next[idx], inventory_qty: Number(e.target.value) || 0 };
                          setField("variants", next);
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Price adj."
                        className={`w-24 ${inputCls}`}
                        step="0.01"
                        value={variant.price_adjustment || 0}
                        onChange={(e) => {
                          const next = [...form.variants];
                          next[idx] = { ...next[idx], price_adjustment: Number(e.target.value) || 0 };
                          setField("variants", next);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.variants.filter((_, i) => i !== idx);
                          setField("variants", next);
                        }}
                        className="p-1 text-muted-foreground hover:text-destructive"
                        aria-label="Remove variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setField("variants", [...form.variants, { name: "", sku: "", inventory_qty: 0, price_adjustment: 0 }])}
                    className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80"
                  >
                    <Plus className="h-4 w-4" /> Add variant
                  </button>
                </div>
              </fieldset>

              {/* Inventory Quantity */}
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Total Inventory Qty
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={`mt-1 ${inputCls}`}
                  value={form.inventory_qty}
                  onChange={(e) => setField("inventory_qty", e.target.value)}
                />
                <p className="mt-1 font-mono-tech text-[10px] text-muted-foreground">
                  Total stock quantity. Leave at 0 for unlimited / made-to-order.
                </p>
              </label>

              {/* SEO Fields */}
              <fieldset className="border border-border rounded-sm p-3">
                <legend className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5" /> SEO
                </legend>
                <div className="mt-2 grid gap-3">
                  <label className="block">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      Meta Title
                    </span>
                    <input
                      className={`mt-1 ${inputCls}`}
                      value={form.seo_title}
                      onChange={(e) => setField("seo_title", e.target.value)}
                      placeholder="Defaults to product name"
                      maxLength={60}
                    />
                    <p className="mt-1 font-mono-tech text-[10px] text-muted-foreground">
                      Max 60 chars. Shown in search results.
                    </p>
                  </label>
                  <label className="block">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      Meta Description
                    </span>
                    <textarea
                      className={`mt-1 ${inputCls}`}
                      rows={2}
                      value={form.seo_description}
                      onChange={(e) => setField("seo_description", e.target.value)}
                      placeholder="Defaults to short description"
                      maxLength={160}
                    />
                    <p className="mt-1 font-mono-tech text-[10px] text-muted-foreground">
                      Max 160 chars. Shown in search results.
                    </p>
                  </label>
                  <label className="block">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      URL Slug
                    </span>
                    <input
                      className={`mt-1 ${inputCls}`}
                      value={form.slug}
                      onChange={(e) => setField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="auto-generated from name"
                    />
                    <p className="mt-1 font-mono-tech text-[10px] text-muted-foreground">
                      Lowercase, hyphens only. Auto-generated if empty.
                    </p>
                  </label>
                </div>
              </fieldset>

              {/* Publishing Schedule */}
              <fieldset className="border border-border rounded-sm p-3">
                <legend className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground px-2 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Publishing Schedule
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      Publish Date
                    </span>
                    <input
                      type="datetime-local"
                      className={`mt-1 ${inputCls}`}
                      value={form.published_at ? form.published_at.slice(0, 16) : ""}
                      onChange={(e) => setField("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                    <p className="mt-1 font-mono-tech text-[10px] text-muted-foreground">
                      Product visible after this date.
                    </p>
                  </label>
                  <label className="block">
                    <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      Unpublish Date
                    </span>
                    <input
                      type="datetime-local"
                      className={`mt-1 ${inputCls}`}
                      value={form.unpublished_at ? form.unpublished_at.slice(0, 16) : ""}
                      onChange={(e) => setField("unpublished_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
                    />
                    <p className="mt-1 font-mono-tech text-[10px] text-muted-foreground">
                      Product hidden after this date.
                    </p>
                  </label>
                </div>
              </fieldset>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
                >
                  <Save className="h-4 w-4" /> {editingId ? "Update product" : "Add product"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={clearForm}
                    className="rounded-sm border border-border px-4 py-2.5 font-mono-tech text-xs uppercase tracking-wider hover:border-primary/50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* List */}
          <div className="max-h-[720px] overflow-auto rounded-sm border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-secondary/80 backdrop-blur">
                <tr className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="text-left hover:text-primary"
                      >
                        <span className="block font-heading text-sm font-600">{p.name}</span>
                        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.sku || p.id}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2 font-mono-tech text-xs">{p.price}</td>
                    <td className="px-3 py-2 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.stock_status}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id)}
                        aria-label={`Delete ${p.name}`}
                        className="grid h-8 w-8 place-items-center rounded-sm border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <label className="block">
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              Paste catalog JSON
            </span>
            <textarea
              className="mt-1 h-28 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-xs focus:border-primary/60 focus:outline-none"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"id":"…","name":"…"}]'
            />
          </label>
          <button
            type="button"
            onClick={() => importJson(importText)}
            className="mt-2 flex items-center gap-2 rounded-sm border border-border bg-background px-4 py-2 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
          >
            <Upload className="h-3.5 w-3.5" /> Import pasted JSON
          </button>
        </div>
      </section>

      {/* Reviews moderation */}
      <section className="mt-6 rounded-sm border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 font-heading text-lg font-600">
            <MessageSquare className="h-4 w-4 text-primary" /> Customer reviews
            <span className="font-mono-tech text-xs text-muted-foreground">
              ({modReviews.length})
            </span>
          </h2>
          <button
            type="button"
            onClick={() =>
              listAllReviews()
                .then(setModReviews)
                .catch(() => {})
            }
            className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
        {modReviews.length === 0 ? (
          <p className="p-4 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
            No reviews yet
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {modReviews.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                    {r.products?.name || r.product_id} · {r.created_date} · {r.rating}/5
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="font-600">{r.name}</span>{" "}
                    <span className="text-muted-foreground">— {r.comment}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeReview(r.id)}
                  aria-label={`Delete review by ${r.name}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
