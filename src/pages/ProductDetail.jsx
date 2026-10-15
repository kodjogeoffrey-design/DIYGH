import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProduct, listProducts } from "@/api/catalog";
import { Image } from "@/components/ui/image";
import { ArrowLeft, Check, Plus, Minus, Share2, Download, Star, MessageCircle, ChevronRight, Send } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { formatPrice, buildWhatsAppLink } from "@/lib/config";
import { listReviews, addReview } from "@/lib/reviews";
import { toast } from "@/components/ui/use-toast";
import WhatsAppBuy from "@/components/WhatsAppBuy";
import ProductCard from "@/components/ProductCard";

const stockColor = {
  "In Stock": "text-accent",
  "Low Stock": "text-primary",
  Backorder: "text-destructive",
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [imageIdx, setImageIdx] = useState(0);
  const { add } = useCart();

  useEffect(() => {
    setImageIdx(0);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const found = await getProduct(id);
        if (cancelled) return;
        if (!found) {
          setProduct(null);
          setRelated([]);
          setReviews([]);
          setAvgRating(null);
          return;
        }
        const all = await listProducts();
        const posted = await listReviews(found.id);
        if (cancelled) return;
        setProduct(found);
        setReviews(posted);
        setAvgRating(
          posted.length
            ? posted.reduce((sum, r) => sum + r.rating, 0) / posted.length
            : null
        );
        setRelated(
          all.filter((x) => x.category === found.category && x.id !== found.id).slice(0, 4)
        );
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const review = await addReview(product.id, {
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment,
      });
      const next = [...reviews, review];
      setReviews(next);
      setAvgRating(next.reduce((sum, r) => sum + r.rating, 0) / next.length);
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      toast({ title: "Review posted", description: "Thanks for the feedback!" });
    } catch (err) {
      toast({
        title: "Could not post review",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {}
    } else {
      await navigator.clipboard?.writeText(url);
      toast({ title: "Link copied", description: product.name });
    }
  };

  const addToBuild = () => {
    add({ id: product.id, name: product.name, sku: product.sku, price: product.price }, qty);
    toast({ title: "Added to build", description: `${qty} × ${product.name}` });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-sm border border-border bg-card" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="font-mono-tech text-sm uppercase tracking-wider text-muted-foreground">Part not found.</p>
        <Link to="/shop" className="mt-4 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-mono-tech text-xs uppercase tracking-wider text-primary-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to catalog
        </Link>
      </div>
    );
  }

  const gallery = product ? [product.image_url, ...(product.images ?? [])] : [];
  const activeSrc = gallery[imageIdx] ?? gallery[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">Catalog</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/shop?category=${product.category}`} className="hover:text-foreground">{product.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.sku}</span>
      </nav>

      <div className="mt-5 grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div>
          <div className="relative overflow-hidden rounded-sm border border-border bg-secondary">
            <Image key={activeSrc} src={activeSrc} alt={product.name} className="aspect-square w-full object-cover" />
            <span className="absolute left-3 top-3 font-mono-tech text-[10px] uppercase tracking-wider text-foreground/80">
              {product.sku}
            </span>
            <span className="absolute right-3 top-3 flex items-center gap-1 font-mono-tech text-[10px] uppercase tracking-wider text-accent">
              <span className="led-blink h-1.5 w-1.5 rounded-full bg-current" /> {product.stock_status}
            </span>
            <span className="absolute bottom-3 left-3 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              MACRO · LAB BENCH LIGHTING
            </span>
          </div>
          {gallery.length > 1 && (
            <div className="mt-2 flex gap-2">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImageIdx(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`overflow-hidden rounded-sm border transition-colors ${
                    i === imageIdx ? "border-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  <Image src={src} alt="" className="h-16 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">{product.category}</span>
            {product.featured && (
              <span className="rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono-tech text-[10px] uppercase tracking-wider text-primary">Featured</span>
            )}
          </div>
          <h1 className="mt-2 font-heading text-3xl font-700 leading-tight">{product.name}</h1>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
              ))}
            </div>
            <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">{product.rating || 4.5} / 5</span>
          </div>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{product.short_description}</p>

          <div className="mt-5 flex items-end gap-3 border-y border-border py-4">
            <div>
              <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">Price</span>
              <p className="font-heading text-3xl font-700 leading-none">{formatPrice(product.price)}</p>
            </div>
            <span className={`mb-1 flex items-center gap-1 font-mono-tech text-[11px] uppercase tracking-wider ${stockColor[product.stock_status] || "text-accent"}`}>
              <span className="led-blink h-1.5 w-1.5 rounded-full bg-current" /> {product.stock_status}
            </span>
          </div>

          {/* Qty + add */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-sm border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:text-primary" aria-label="Decrease">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-mono-tech text-sm font-600">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:text-primary" aria-label="Increase">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={addToBuild}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-primary px-5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
            >
              <Plus className="h-4 w-4" /> Add to build
            </button>
          </div>

          <div className="mt-3 flex gap-3">
            <WhatsAppBuy product={product} className="flex-1" label="Buy now on WhatsApp" />
            <button onClick={share} className="flex h-10 items-center gap-2 rounded-sm border border-border bg-card px-4 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-7">
              <h3 className="font-mono-tech text-[11px] uppercase tracking-widest text-accent">▸ Overview</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Spec sheet */}
      {product.specs?.length > 0 && (
        <div className="mt-10 rounded-sm border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="font-heading text-lg font-600">Technical specifications</h2>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">DATA SHEET</span>
          </div>
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
            {product.specs.map((s, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border px-4 py-3 sm:[&:nth-child(even)]:border-l">
                <span className="font-mono-tech text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <span className="font-mono-tech text-sm font-600">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kit check */}
      {product.kit_contents?.length > 0 && (
        <div className="mt-6 rounded-sm border border-border bg-card p-5">
          <h2 className="font-heading text-lg font-600">Kit-check — what's in the bag</h2>
          <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">VERIFIED CONTENTS</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {product.kit_contents.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-sm border border-accent/40 bg-accent/10">
                  <Check className="h-3 w-3 text-accent" />
                </span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Documentation */}
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={buildWhatsAppLink(`Hi DIYGH, can you send me the pinout diagram and sample code for ${product.name} – ${product.sku}?`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/10 px-4 py-2.5 font-mono-tech text-[11px] uppercase tracking-wider text-accent hover:bg-accent/20"
        >
          <Download className="h-4 w-4" /> Request pinout & sample code
        </a>
        <a
          href={buildWhatsAppLink(`Hi DIYGH, I have a technical question about ${product.name} – ${product.sku}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 font-mono-tech text-[11px] uppercase tracking-wider hover:border-primary/50"
        >
          <MessageCircle className="h-4 w-4 text-primary" /> Ask a build question
        </a>
      </div>

      {/* Reviews */}
      <div className="mt-10 border-t border-border pt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-700">Customer reviews</h2>
            <p className="mt-1 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              {avgRating != null && ` · avg ${avgRating.toFixed(1)} / 5`}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <form onSubmit={submitReview} className="rounded-sm border border-border bg-card p-4">
            <h3 className="font-heading text-base font-600">Leave a review</h3>
            <div className="mt-3 grid gap-3">
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">Name</span>
                <input
                  required
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm focus:border-primary/60 focus:outline-none"
                  placeholder="Your name"
                />
              </label>
              <div>
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">Rating</span>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewRating(n)}
                      aria-label={`${n} star${n > 1 ? "s" : ""}`}
                      className="grid h-8 w-8 place-items-center"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          n <= reviewRating ? "fill-primary text-primary" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                  Comment
                </span>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm focus:border-primary/60 focus:outline-none"
                  placeholder="How did this part work in your build?"
                />
              </label>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
              >
                <Send className="h-4 w-4" /> Post review
              </button>
              <p className="font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground">
                Posted to the store · no account needed
              </p>
            </div>
          </form>

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="rounded-sm border border-dashed border-border p-8 text-center">
                <p className="font-mono-tech text-sm uppercase tracking-wider text-muted-foreground">
                  No reviews yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Be the first to share how this part performed in your project.
                </p>
              </div>
            ) : (
              [...reviews].reverse().map((r) => (
                <article key={r.id} className="rounded-sm border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading text-sm font-600">{r.name}</span>
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.comment}</p>
                  <p className="mt-2 font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground/70">
                    {r.created_date}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-heading text-xl font-700">Pairs well with</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}