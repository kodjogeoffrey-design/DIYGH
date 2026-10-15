import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Package, Heart, LogOut, Loader2, Save, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listOrders } from "@/api/orders";
import { listWishlist, removeFromWishlist } from "@/api/wishlist";
import { toast } from "@/components/ui/use-toast";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

const inputCls =
  "w-full rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-sm focus:border-primary/60 focus:outline-none";

const labelCls =
  "block font-mono-tech text-[10px] uppercase tracking-wider text-muted-foreground";

const btnPrimaryCls =
  "flex items-center justify-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse disabled:opacity-60";

function ProfileTab({ user }) {
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const { user: authUser } = useAuth();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { updateUser } = await import("@/lib/auth");
      await updateUser({ data: { full_name: name } });
      toast({ title: "Profile updated", description: "Your name has been saved." });
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="grid gap-6 max-w-md">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary font-heading text-2xl font-700">
          {authUser?.user_metadata?.full_name
            ? authUser.user_metadata.full_name.trim().charAt(0).toUpperCase()
            : authUser?.email?.charAt(0).toUpperCase() ?? "U"}
        </span>
        <div>
          <h3 className="font-heading text-lg font-600">
            {authUser?.user_metadata?.full_name || "Customer"}
          </h3>
          <p className="font-mono-tech text-xs text-muted-foreground">{authUser?.email}</p>
        </div>
      </div>

      <label className={labelCls}>
        Full name
        <input
          type="text"
          autoComplete="name"
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />
      </label>

      <label className={labelCls}>
        Email
        <input
          type="email"
          autoComplete="username"
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled
        />
      </label>

      <p className="font-mono-tech text-[10px] text-muted-foreground">
        Email changes require verification. Contact support to update your email address.
      </p>

      <button type="submit" disabled={saving} className={btnPrimaryCls}>
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> Save changes
          </>
        )}
      </button>
    </form>
  );
}

function OrdersTab({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      listOrders(user.id)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 font-mono-tech text-sm text-muted-foreground">Loading orders…</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-heading text-lg font-600">No orders yet</h3>
        <p className="mt-2 font-mono-tech text-[11px] text-muted-foreground">
          Your order history will appear here after you make a purchase.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-sm border border-border bg-card p-4 grid gap-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-heading text-base font-600">Order {order.id.slice(0, 12)}</p>
              <p className="font-mono-tech text-[10px] text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="font-heading text-lg font-700 tabular-nums">
                {typeof order.total === "number" ? `GH₵${order.total.toFixed(2)}` : order.total}
              </p>
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full font-mono-tech text-[9px] uppercase ${
                  order.status === "pending"
                    ? "bg-warning/10 text-warning"
                    : order.status === "completed"
                    ? "bg-green/10 text-green"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {order.items?.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded border border-border/50 px-2 py-1"
              >
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                )}
                <span className="font-mono-tech text-[10px] truncate max-w-[120px]">
                  {item.name}
                </span>
                <span className="font-mono-tech text-[10px] text-muted-foreground">
                  ×{item.qty}
                </span>
              </div>
            ))}
            {order.items && order.items.length > 4 && (
              <span className="flex items-center px-2 py-1 font-mono-tech text-[10px] text-muted-foreground">
                +{order.items.length - 4} more
              </span>
            )}
          </div>

          {order.whatsapp_message && (
            <a
              href={order.whatsapp_message}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-sm border border-primary/40 bg-primary/5 px-3 py-2 font-mono-tech text-xs uppercase tracking-wider text-primary hover:bg-primary/10"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View WhatsApp conversation
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function WishlistTab({ user }) {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(new Set());

  useEffect(() => {
    if (user?.id) {
      listWishlist(user.id)
        .then(setWishlist)
        .catch(() => setWishlist([]))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleRemove = async (productId) => {
    if (!user?.id) return;
    setRemoving((prev) => new Set(prev).add(productId));
    try {
      await removeFromWishlist(user.id, productId);
      setWishlist((prev) => prev.filter((item) => item.product_id !== productId));
      toast({ title: "Removed", description: "Product removed from wishlist." });
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Could not remove",
        variant: "destructive",
      });
    } finally {
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 font-mono-tech text-sm text-muted-foreground">Loading wishlist…</p>
      </div>
    );
  }

  if (!wishlist.length) {
    return (
      <div className="text-center py-12">
        <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 font-heading text-lg font-600">Wishlist is empty</h3>
        <p className="mt-2 font-mono-tech text-[11px] text-muted-foreground">
          Save products you love to find them easily later.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 font-mono-tech text-xs font-700 uppercase tracking-wider text-primary-foreground solder-pulse"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wishlist.map((item) => {
        const product = item.products;
        const isRemoving = removing.has(item.product_id);
        return product ? (
          <div
            key={item.product_id}
            className="relative rounded-sm border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
          >
            <button
              onClick={() => handleRemove(item.product_id)}
              disabled={isRemoving}
              className="absolute top-2 right-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive hover:bg-background backdrop-blur-sm disabled:opacity-50"
              aria-label="Remove from wishlist"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <Link to={`/product/${product.id}`} className="block">
              {product.image_url && (
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              )}
              <div className="p-4 grid gap-2">
                <h3 className="font-heading text-sm font-600 line-clamp-1">{product.name}</h3>
                <p className="font-heading text-lg font-700 tabular-nums">
                  GH₵{typeof product.price === "number" ? product.price.toFixed(2) : product.price}
                </p>
                <span className="font-mono-tech text-[10px] uppercase text-muted-foreground">
                  {product.category}
                </span>
              </div>
            </Link>
          </div>
        ) : null;
      })}
    </div>
  );
}

export default function Account() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 font-mono-tech text-sm text-muted-foreground">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-700">My Account</h1>
        <p className="mt-1 font-mono-tech text-sm text-muted-foreground">
          Manage your profile, view orders, and track your wishlist.
        </p>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        {/* Tab navigation */}
        <div className="border-b border-border overflow-x-auto">
          <nav className="flex gap-1 px-2" aria-label="Account sections">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-sm px-3 py-2.5 font-mono-tech text-xs uppercase tracking-wider transition-colors ${
                  activeTab === tab.id
                    ? "bg-background text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "profile" && <ProfileTab user={user} />}
          {activeTab === "orders" && <OrdersTab user={user} />}
          {activeTab === "wishlist" && <WishlistTab user={user} />}
        </div>
      </div>

      <div className="mt-6 rounded-sm border border-border bg-card p-4">
        <h3 className="font-heading text-base font-600">Danger zone</h3>
        <p className="mt-1 font-mono-tech text-[11px] text-muted-foreground">
          Once you sign out, you'll need to sign in again to access your account.
        </p>
        <button
          onClick={logout}
          className="mt-4 flex items-center gap-2 rounded-sm border border-destructive/40 bg-background px-3 py-2 font-mono-tech text-[11px] uppercase tracking-wider text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </div>
  );
}