import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Plus, Star, GitCompare } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { formatPrice } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";
import WhatsAppBuy from "@/components/WhatsAppBuy";

const stockColor = {
  "In Stock": "text-accent",
  "Low Stock": "text-primary",
  Backorder: "text-destructive",
};

/**
 * @param {{
 *   product: any,
 *   compare?: { selected: boolean, onToggle: () => void, disabled?: boolean },
 * }} props
 */
export default function ProductCard({ product, compare }) {
  const { add } = useCart();
  const keySpec = product.specs?.[0];
  const rating = product.rating ?? 4.5;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-colors hover:border-primary/50">
      {/* Technical overlay */}
      <span className="pointer-events-none absolute left-2 top-2 z-10 font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground/80">
        {product.sku}
      </span>
      <span className={`pointer-events-none absolute right-2 top-2 z-10 flex items-center gap-1 font-mono-tech text-[9px] uppercase tracking-wider ${stockColor[product.stock_status] || "text-accent"}`}>
        <span className="led-blink h-1.5 w-1.5 rounded-full bg-current" />
        {product.stock_status}
      </span>

      <Link to={`/product/${product.id}`} className="relative block aspect-square overflow-hidden border-b border-border bg-secondary">
        <Image
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="pointer-events-none absolute bottom-2 left-2 font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground/70">
          {product.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link to={`/product/${product.id}`} className="font-heading text-sm font-600 leading-snug hover:text-primary">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {product.short_description}
        </p>

        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
            />
          ))}
          <span className="ml-1 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
            {rating}
          </span>
        </div>

        {keySpec && (
          <div className="mt-2.5 flex items-center gap-1.5 border-y border-border/60 py-1.5">
            <span className="font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground">{keySpec.label}</span>
            <span className="font-mono-tech text-[11px] font-600 text-foreground">{keySpec.value}</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <span className="font-mono-tech text-[9px] uppercase tracking-wider text-muted-foreground">Price</span>
            <p className="font-heading text-base font-700 leading-none">{formatPrice(product.price)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {compare && (
              <button
                type="button"
                onClick={compare.onToggle}
                disabled={compare.disabled && !compare.selected}
                aria-pressed={compare.selected}
                aria-label={`Compare ${product.name}`}
                title={compare.disabled && !compare.selected ? "Compare list is full (max 3)" : "Add to compare"}
                className={`grid h-9 w-9 place-items-center rounded-sm border transition-colors disabled:opacity-40 ${
                  compare.selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <GitCompare className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => {
                add({ id: product.id, name: product.name, sku: product.sku, price: product.price });
                toast({ title: "Added to build", description: product.name });
              }}
              className="grid h-9 w-9 place-items-center rounded-sm bg-primary text-primary-foreground transition-transform active:scale-90 solder-pulse"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="mt-2.5">
          <WhatsAppBuy product={product} className="w-full" />
        </div>
      </div>
    </div>
  );
}
