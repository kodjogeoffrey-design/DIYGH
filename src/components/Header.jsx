import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, User, LogOut, Settings, Heart, Package } from "lucide-react";
import { useCart } from "@/lib/cartStore";
import { getSettings } from "@/lib/settings";
import { assetUrl } from "@/lib/asset";
import { useAuth } from "@/lib/auth-context";
import AuthModal from "./AuthModal";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Shop", path: "/shop" },
  { label: "Kits", path: "/shop?category=Kits" },
  { label: "Tutorials", path: "/tutorials" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { count } = useCart();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();
  const announcement = getSettings().announcement.trim();

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate("/");
  };

  const userInitial = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.trim().charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Copper trace line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent trace-line" />

      {/* Info announcement — the one moving banner, at the very top */}
      {announcement && (
        <div className="overflow-hidden border-b border-primary/30 bg-primary/10">
          <div className="ticker-track flex w-max gap-10 whitespace-nowrap py-1.5 font-mono-tech text-[10px] font-500 uppercase tracking-wider text-primary">
            {Array.from({ length: 4 }).map((_, k) => (
              <span key={k}>{announcement}</span>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-sm border border-primary/40">
              <img src={assetUrl("/images/robohub-logo.jpg")} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="font-heading text-lg font-700 leading-none tracking-tight">
              DIY<span className="text-primary">GH</span>
              <span className="ml-1 align-top font-mono-tech text-[9px] font-500 text-muted-foreground">STORE</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((l) => (
              <NavLink
                key={l.path}
                to={l.path}
                className={({ isActive }) =>
                  `font-mono-tech text-xs font-500 uppercase tracking-wider transition-colors hover:text-primary ${
                    isActive && !l.path.includes("?") ? "text-primary" : "text-foreground/80"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-sm border border-border transition-colors hover:border-primary/60 solder-pulse"
              aria-label="Cart"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 font-mono-tech text-[10px] font-700 text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>

            {/* Auth / User menu */}
            {loading ? (
              <div className="h-10 w-10 md:hidden" />
            ) : isAuthenticated ? (
              <div className="relative">
                <button
                  className="flex h-10 items-center gap-2 rounded-sm border border-border px-3 pr-8 transition-colors hover:border-primary/50"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary font-mono-tech text-sm font-600">
                    {userInitial}
                  </span>
                  <span className="hidden font-mono-tech text-xs uppercase tracking-wider md:inline">{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</span>
                  <X className="h-3.5 w-3.5" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-sm border border-border bg-card shadow-lg py-1">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="font-mono-tech text-xs font-600">{user?.user_metadata?.full_name || "Customer"}</p>
                      <p className="font-mono-tech text-[10px] text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <Link
                      to="/account"
                      className="flex items-center gap-2 px-3 py-2 font-mono-tech text-xs uppercase tracking-wider hover:bg-accent"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-3.5 w-3.5" /> Account
                    </Link>
                    <Link
                      to="/account/orders"
                      className="flex items-center gap-2 px-3 py-2 font-mono-tech text-xs uppercase tracking-wider hover:bg-accent"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package className="h-3.5 w-3.5" /> Orders
                    </Link>
                    <Link
                      to="/account/wishlist"
                      className="flex items-center gap-2 px-3 py-2 font-mono-tech text-xs uppercase tracking-wider hover:bg-accent"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Heart className="h-3.5 w-3.5" /> Wishlist
                    </Link>
                    <Link
                      to="/console"
                      className="flex items-center gap-2 px-3 py-2 font-mono-tech text-xs uppercase tracking-wider hover:bg-accent text-primary"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-3.5 w-3.5" /> Admin Console
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 font-mono-tech text-xs uppercase tracking-wider text-destructive hover:bg-accent"
                    >
                      <LogOut className="h-3.5 w-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Desktop sign in button */}
                <button
                  className="hidden md:flex h-10 items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-xs font-700 uppercase tracking-wider transition-colors hover:border-primary/50"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <User className="h-3.5 w-3.5" /> Sign in
                </button>
                {/* Mobile sign in button */}
                <button
                  className="flex h-10 items-center gap-2 rounded-sm border border-border bg-background px-3 py-2 font-mono-tech text-xs font-700 uppercase tracking-wider transition-colors hover:border-primary/50 md:hidden"
                  onClick={() => setAuthModalOpen(true)}
                >
                  <User className="h-3.5 w-3.5" /> Sign in
                </button>
              </>
            )}

            <button
              className="grid h-10 w-10 place-items-center rounded-sm border border-border md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-border bg-card md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={l.path}
                onClick={() => setOpen(false)}
                className="border-b border-border/60 py-3 font-mono-tech text-sm uppercase tracking-wider last:border-0"
              >
                {l.label}
              </Link>
            ))}
            {!loading && !isAuthenticated && (
              <button
                className="mt-2 flex items-center justify-center gap-2 rounded-sm border border-border bg-background px-4 py-2 font-mono-tech text-xs font-700 uppercase tracking-wider hover:border-primary/50"
                onClick={() => { setOpen(false); setAuthModalOpen(true); }}
              >
                <User className="h-3.5 w-3.5" /> Sign in
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
