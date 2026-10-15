import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { listProducts, listCategories } from "@/api/catalog";
import { getSearchSuggestions } from "@/api/search";
import { Search, SlidersHorizontal, GitCompare, X, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { formatPrice } from "@/lib/config";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "rating", label: "Rating" },
  { value: "name", label: "A–Z" },
];

const COMPARE_ROWS = [
  { label: "Price", get: (p) => formatPrice(p.price) },
  { label: "Category", get: (p) => p.category },
  { label: "Rating", get: (p) => `${p.rating ?? "—"} / 5` },
  { label: "Stock", get: (p) => p.stock_status },
  { label: "SKU", get: (p) => p.sku },
  {
    label: "Key spec",
    get: (p) => (p.specs?.[0] ? `${p.specs[0].label}: ${p.specs[0].value}` : "—"),
  },
  { label: "Blurb", get: (p) => p.short_description || "—" },
];

const MAX_COMPARE = 3;

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "All";

  const [all, setAll] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState(q);
  const [sort, setSort] = useState("featured");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setSearch(q);
  }, [q]);

  // Load categories and initial product list
  useEffect(() => {
    listProducts("-created_date", 200)
      .then(setAll)
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
    setCategories(["All", ...listCategories()]);
  }, []);

  // Debounced search suggestions
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const results = await getSearchSuggestions(query, 5);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, fetchSuggestions]);

  const setCategory = (c) => {
    const next = new URLSearchParams(params);
    if (c === "All") next.delete("category");
    else next.set("category", c);
    setParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (search.trim()) next.set("q", search.trim());
    else next.delete("q");
    setParams(next);
    setShowSuggestions(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion) => {
    setSearch(suggestion.name);
    setShowSuggestions(false);
  };

  const toggleCompare = (id) => {
    setShowCompare(false);
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const clearCompare = () => {
    setCompareIds([]);
    setShowCompare(false);
  };

  const compared = useMemo(
    () => compareIds.map((id) => all.find((p) => p.id === id)).filter(Boolean),
    [compareIds, all]
  );

  const filtered = useMemo(() => {
    let list = all;
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (q) {
      const t = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(t) ||
          p.sku?.toLowerCase().includes(t) ||
          p.category?.toLowerCase().includes(t) ||
          p.short_description?.toLowerCase().includes(t)
      );
    }
    if (minPrice !== "") {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) list = list.filter((p) => p.price >= min);
    }
    if (maxPrice !== "") {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) list = list.filter((p) => p.price <= max);
    }
    if (inStockOnly) {
      list = list.filter((p) => p.stock_status === "In Stock");
    }
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "rating") sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return sorted;
  }, [all, category, q, sort, minPrice, maxPrice, inStockOnly]);

  const hasExtraFilters = minPrice !== "" || maxPrice !== "" || inStockOnly;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Catalog</p>
        <h1 className="mt-1 font-heading text-3xl font-700">
          {category === "All" ? "All components" : category}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {loading ? "Loading parts…" : `${filtered.length} ${filtered.length === 1 ? "part" : "parts"} available`}
        </p>
      </div>

      {/* Search + sort */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 relative">
          <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2 rounded-sm border border-border bg-card px-3 py-2.5 focus-within:border-primary/60">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={handleSearchChange}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by name, SKU, or category…"
              className="flex-1 bg-transparent font-mono-tech text-sm placeholder:text-muted-foreground/60 focus:outline-none"
              autoComplete="off"
            />
            {searchLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            <button type="submit" className="font-mono-tech text-[11px] uppercase tracking-wider text-primary">Go</button>
          </form>

          {/* Search suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-sm border border-border bg-card shadow-lg overflow-hidden">
              {suggestions.map((s, idx) => (
                <button
                  key={`${s.name}-${idx}`}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full px-3 py-2 text-left font-mono-tech text-sm hover:bg-primary/10 focus:bg-primary/10"
                >
                  <span className="font-heading font-600">{s.name}</span>
                  <span className="ml-2 font-mono-tech text-[10px] uppercase text-muted-foreground">
                    {s.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card px-3 py-2.5">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-transparent font-mono-tech text-xs uppercase tracking-wider text-foreground focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-card text-foreground">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono-tech text-[11px] uppercase tracking-wider transition-colors ${
              category === c || (c === "All" && category === "All")
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Price + stock filters */}
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-sm border border-border bg-card px-3 py-2.5">
        <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">Price</span>
        <label className="flex items-center gap-1.5">
          <span className="sr-only">Min price</span>
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-20 rounded-sm border border-border bg-background px-2 py-1.5 font-mono-tech text-xs focus:border-primary/60 focus:outline-none"
          />
          <span className="text-muted-foreground">–</span>
          <span className="sr-only">Max price</span>
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-20 rounded-sm border border-border bg-background px-2 py-1.5 font-mono-tech text-xs focus:border-primary/60 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          In stock only
        </label>
        {hasExtraFilters && (
          <button
            type="button"
            onClick={() => {
              setMinPrice("");
              setMaxPrice("");
              setInStockOnly(false);
            }}
            className="ml-auto flex items-center gap-1 font-mono-tech text-[11px] uppercase tracking-wider text-primary hover:underline"
          >
            <X className="h-3 w-3" /> Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-sm border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 rounded-sm border border-dashed border-border p-12 text-center">
          <p className="font-mono-tech text-sm uppercase tracking-wider text-muted-foreground">No parts match that search.</p>
          <p className="mt-2 text-sm text-muted-foreground">Try a different term, or message us on WhatsApp — we probably have it.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              compare={{
                selected: compareIds.includes(p.id),
                onToggle: () => toggleCompare(p.id),
                disabled: compareIds.length >= MAX_COMPARE && !compareIds.includes(p.id),
              }}
            />
          ))}
        </div>
      )}

      {/* Compare tray */}
      {compared.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/40 bg-background/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <span className="flex items-center gap-2 font-mono-tech text-[11px] uppercase tracking-wider text-primary">
              <GitCompare className="h-4 w-4" /> Compare {compared.length}/{MAX_COMPARE}
            </span>
            <div className="flex flex-wrap gap-2">
              {compared.map((p) => (
                <span
                  key={p.id}
                  className="flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-1 font-mono-tech text-[10px] uppercase tracking-wider"
                >
                  {p.name}
                  <button
                    type="button"
                    onClick={() => toggleCompare(p.id)}
                    aria-label={`Remove ${p.name} from compare`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                disabled={compared.length < 2}
                className="rounded-sm bg-primary px-4 py-2 font-mono-tech text-[11px] font-700 uppercase tracking-wider text-primary-foreground disabled:opacity-40 solder-pulse"
              >
                Compare
              </button>
              <button
                type="button"
                onClick={clearCompare}
                className="rounded-sm border border-border bg-card px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare modal */}
      {showCompare && compared.length >= 2 && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Product comparison"
        >
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-sm border border-border bg-card">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <h2 className="font-heading text-lg font-600">Compare parts</h2>
              <button
                type="button"
                onClick={() => setShowCompare(false)}
                aria-label="Close comparison"
                className="grid h-8 w-8 place-items-center rounded-sm border border-border hover:border-primary/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="w-28 px-3 py-2 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                      Spec
                    </th>
                    {compared.map((p) => (
                      <th key={p.id} className="px-3 py-2 font-heading text-sm font-600">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row) => (
                    <tr key={row.label} className="border-t border-border">
                      <td className="px-3 py-2 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                        {row.label}
                      </td>
                      {compared.map((p) => (
                        <td key={p.id} className="px-3 py-2 text-sm text-foreground">
                          {row.get(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
