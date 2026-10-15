import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, MessageCircle, GraduationCap, ArrowRight, ShoppingBag, Tag, AlertTriangle, X } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { formatPrice, buildWhatsAppLink, cartCheckoutMessage } from "@/lib/config";
import { toast } from "@/components/ui/use-toast";

export default function Cart() {
  const { 
    items, 
    count, 
    subtotal, 
    discount, 
    total, 
    couponCode, 
    coupon, 
    applyCoupon, 
    removeCoupon, 
    validatingCoupon, 
    stockWarnings,
    syncing,
    setQty, 
    remove, 
    clear 
  } = useCart();
  const [bulk, setBulk] = useState(false);
  const [bulkQty, setBulkQty] = useState(20);
  const [couponInput, setCouponInput] = useState("");

  const bulkMultiplier = bulk ? Math.max(1, bulkQty) : 1;
  const displaySubtotal = subtotal * bulkMultiplier;
  const displayDiscount = discount * bulkMultiplier;
  const displayTotal = total * bulkMultiplier;
  
  const checkoutMsg = bulk
    ? `Hi DIYGH, I'd like to place a CLASSROOM BULK ORDER (${bulkQty} students):\n\n${items
        .map((it, i) => `${i + 1}. ${it.name} – ${it.sku} x${it.qty * bulkQty} = ${formatPrice(it.price * it.qty * bulkQty)}`)
        .join("\n")}\n\nSubtotal: ${formatPrice(displaySubtotal)}\nDiscount: -${formatPrice(displayDiscount)}\nTotal: ${formatPrice(displayTotal)}\n\nCan you confirm stock and a bulk price?`
    : cartCheckoutMessage(items, total);

  if (count === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-sm border border-border bg-card">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-700">Your build is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add some components and they'll show up here.</p>
        <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-3 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground">
          Browse catalog <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-end justify-between border-b border-border pb-5">
        <div>
          <p className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Mission log</p>
          <h1 className="mt-1 font-heading text-3xl font-700">Your build</h1>
        </div>
        <button onClick={clear} className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Clear
        </button>
      </div>

      {/* Classroom toggle */}
      <div className="mt-5 flex items-center justify-between gap-3 rounded-sm border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-sm border border-primary/30 bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </span>
          <div>
            <p className="font-heading text-sm font-600">Classroom bulk order</p>
            <p className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Multiply every line for a class</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {bulk && (
            <div className="flex items-center gap-1.5">
              <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Students</span>
              <input
                type="number"
                min={1}
                value={bulkQty}
                onChange={(e) => setBulkQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 rounded-sm border border-border bg-background px-2 py-1.5 text-center font-mono-tech text-sm focus:border-primary/60 focus:outline-none"
              />
            </div>
          )}
          <button
            onClick={() => setBulk((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${bulk ? "bg-primary" : "bg-muted"}`}
            aria-label="Toggle classroom bulk order"
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${bulk ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
      </div>

      {/* Coupon */}
      <div className="mt-5 rounded-sm border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Coupon code</span>
        </div>
        {coupon ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-sm bg-green/10 text-green px-3 py-1.5 font-mono-tech text-xs uppercase tracking-wider">
              <Tag className="h-3 w-3" /> {coupon.code}
              {coupon.type === "percentage" && <span>–{coupon.value}%</span>}
              {coupon.type === "fixed" && <span>–{formatPrice(coupon.value)}</span>}
            </span>
            <button
              onClick={removeCoupon}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove coupon"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm uppercase focus:border-primary/60 focus:outline-none"
              disabled={validatingCoupon}
            />
            <button
              onClick={async () => {
                const result = await applyCoupon(couponInput);
                if (result.valid) {
                  setCouponInput("");
                  toast({ title: "Coupon applied", description: `Discount applied: ${formatPrice(discount)}` });
                } else {
                  toast({ title: "Invalid coupon", description: result.error, variant: "destructive" });
                }
              }}
              disabled={validatingCoupon || !couponInput.trim()}
              className="rounded-sm bg-primary px-4 py-2 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground disabled:opacity-60 solder-pulse"
            >
              {validatingCoupon ? "Applying..." : "Apply"}
            </button>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mt-5 divide-y divide-border rounded-sm border border-border bg-card">
        {items.map((it) => {
          const warning = stockWarnings[it.id];
          return (
            <div key={it.id} className={`flex items-center gap-3 p-4 ${warning ? "bg-destructive/5" : ""}`}>
              {warning && (
                <div className="flex-shrink-0 w-10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-600 truncate">{it.name}</p>
                <p className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">{it.sku}</p>
                {warning && (
                  <p className="mt-1 font-mono-tech text-[10px] text-destructive">{warning}</p>
                )}
              </div>
              <div className="flex items-center rounded-sm border border-border">
                <button onClick={() => setQty(it.id, it.qty - 1)} className="grid h-9 w-9 place-items-center hover:text-primary" aria-label="Decrease">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-9 text-center font-mono-tech text-sm font-600">{it.qty}</span>
                <button onClick={() => setQty(it.id, it.qty + 1)} className="grid h-9 w-9 place-items-center hover:text-primary" aria-label="Increase">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="w-24 text-right">
                <p className="font-mono-tech text-sm font-600">{formatPrice(it.price * it.qty)}</p>
                {bulk && <p className="font-mono-tech text-[10px] text-accent">x{bulkQty} = {formatPrice(it.price * it.qty * bulkQty)}</p>}
              </div>
              <button onClick={() => remove(it.id)} className="grid h-9 w-9 place-items-center text-muted-foreground hover:text-destructive" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-5 rounded-sm border border-border bg-secondary/40 p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">{count} {count === 1 ? "item" : "items"}{bulk ? ` · ${bulkQty} students` : ""}</span>
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Subtotal</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">Subtotal</span>
          <span className="font-mono-tech text-sm">{formatPrice(displaySubtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-green">Discount ({coupon?.code})</span>
            <span className="font-mono-tech text-sm text-green">–{formatPrice(displayDiscount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between">
          <span className="font-mono-tech text-[11px] uppercase tracking-wider text-accent">▸ Order total</span>
          <span className="font-heading text-3xl font-700">{formatPrice(displayTotal)}</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Checkout happens on WhatsApp. Tap below to send your full order — we confirm stock,
          share the total, and you pay via mobile money. No account needed.
        </p>
        <a
          href={buildWhatsAppLink(checkoutMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex h-12 items-center justify-center gap-2 rounded-sm bg-primary px-5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
        >
          <MessageCircle className="h-4 w-4" /> Complete build on WhatsApp
        </a>
        <Link to="/shop" className="mt-3 flex items-center justify-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add more parts
        </Link>
      </div>
    </div>
  );
}