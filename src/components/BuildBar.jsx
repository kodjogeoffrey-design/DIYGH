import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { formatPrice } from "@/lib/config";

export default function BuildBar() {
  const { count, total } = useCart();
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/40 bg-background/95 backdrop-blur md:hidden">
      <div className="flex h-[60px] items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-sm border border-primary/40 bg-primary/10">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </span>
          <div className="leading-tight">
            <p className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              {count} {count === 1 ? "item" : "items"} in build
            </p>
            <p className="font-heading text-base font-700">{formatPrice(total)}</p>
          </div>
        </div>
        <Link
          to="/cart"
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
        >
          Complete Build <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}