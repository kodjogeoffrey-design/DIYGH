import React, { createContext, useContext, useEffect, useReducer, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getCart, saveCart, clearCart, mergeCarts } from "@/api/cart";
import { getProduct } from "@/api/catalog";
import { validateCoupon } from "@/api/coupons";

const CartContext = createContext(null);

const STORAGE_KEY = "diygh_cart_v1";

function loadInitial() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * @param {any[]} state
 * @param {{ type: string, item?: any, qty?: number, id?: string, couponCode?: string, applyCoupon?: boolean, items?: any[] }} action
 * @returns {any[]}
 */
function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((i) => i.id === action.item?.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.item?.id ? { ...i, qty: i.qty + (action.qty || 1) } : i
        );
      }
      return [...state, { ...action.item, qty: action.qty || 1 }];
    }
    case "REMOVE":
      return state.filter((i) => i.id !== action.id);
    case "SET_QTY":
      return state
        .map((i) => (i.id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i))
        .filter((i) => i.qty > 0);
    case "CLEAR":
      return [];
    case "SET_COUPON":
      return state; // Coupon is stored separately in context
    case "RESTORE": {
      return action.items || [];
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [items, dispatch] = useReducer(reducer, undefined, loadInitial);
  const [couponCode, setCouponCodeState] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [stockWarnings, setStockWarnings] = useState({});

  // Load cart from server when user signs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setSyncing(true);
      /** @type {Promise<{ items: any[], couponCode: string | null }>} */ (getCart(user.id))
        .then((result) => {
          const serverItems = result.items || [];
          const serverCouponCode = result.couponCode;
          // Merge local and server carts
          mergeCarts(items, serverItems).then((merged) => {
            dispatch({ type: "RESTORE", items: merged });
            if (serverCouponCode) {
              setCouponCodeState(serverCouponCode);
              validateCoupon(serverCouponCode, merged.reduce((s, i) => s + i.price * i.qty, 0))
                .then((res) => {
                  if (res.valid) setCoupon(res);
                })
                .catch(() => {});
            }
          });
        })
        .catch(() => {})
        .finally(() => setSyncing(false));
    }
  }, [isAuthenticated, user?.id, items]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Sync to server when items change (debounced) - skip on admin routes
  useEffect(() => {
    if (!isAuthenticated || !user?.id || syncing) return;
    // Don't sync cart on admin/console pages
    if (typeof window !== "undefined" && (window.location.pathname.startsWith("/console") || window.location.pathname.startsWith("/admin"))) {
      return;
    }
    const timer = setTimeout(() => {
      setSyncing(true);
      saveCart(user.id, items, couponCode)
        .then(() => {})
        .catch(() => {})
        .finally(() => setSyncing(false));
    }, 5000); // 5 second debounce
    return () => clearTimeout(timer);
  }, [items, couponCode, isAuthenticated, user?.id, syncing]);

  // Also sync on page unload/hide for immediate persistence
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    const handleBeforeUnload = () => {
      saveCart(user.id, items, couponCode).catch(() => {});
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCart(user.id, items, couponCode).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [items, couponCode, isAuthenticated, user?.id]);

  // Validate stock for cart items
  useEffect(() => {
    const checkStock = async () => {
      const warnings = {};
      for (const item of items) {
        try {
          const product = await getProduct(item.id);
          if (product && product.inventory_qty > 0 && item.qty > product.inventory_qty) {
            warnings[item.id] = `Only ${product.inventory_qty} in stock`;
          }
        } catch {
          // Ignore stock check errors
        }
      }
      setStockWarnings(warnings);
    };
    if (items.length > 0) checkStock();
  }, [items]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal - discount);

  const add = useCallback((item, qty = 1) => {
    // Check stock before adding
    getProduct(item.id).then((product) => {
      if (product && product.inventory_qty > 0) {
        const currentQty = items.find((i) => i.id === item.id)?.qty || 0;
        if (currentQty + qty > product.inventory_qty) {
          // Still add but warn - user will see warning
        }
      }
      dispatch({ type: "ADD", item, qty });
    }).catch(() => {
      dispatch({ type: "ADD", item, qty });
    });
  }, [items]);

  const remove = useCallback((id) => dispatch({ type: "REMOVE", id }), []);
  const setQty = useCallback((id, qty) => dispatch({ type: "SET_QTY", id, qty }), []);
  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
    setCouponCodeState("");
    setCoupon(null);
    if (isAuthenticated && user?.id) {
      clearCart(user.id).catch(() => {});
    }
  }, [isAuthenticated, user?.id]);

  const applyCoupon = useCallback(async (code) => {
    const upperCode = String(code ?? "").trim().toUpperCase();
    if (!upperCode) {
      setCouponCodeState("");
      setCoupon(null);
      return { valid: true };
    }
    setValidatingCoupon(true);
    try {
      const result = await validateCoupon(upperCode, subtotal);
      if (result.valid) {
        setCouponCodeState(upperCode);
        setCoupon(result);
        return { valid: true };
      } else {
        setCouponCodeState(upperCode);
        setCoupon(null);
        return { valid: false, error: result.error };
      }
    } catch (err) {
      return { valid: false, error: err instanceof Error ? err.message : "Invalid coupon" };
    } finally {
      setValidatingCoupon(false);
    }
  }, [subtotal]);

  const removeCoupon = useCallback(() => {
    setCouponCodeState("");
    setCoupon(null);
  }, []);

  const value = {
    items,
    count,
    subtotal,
    discount,
    total,
    couponCode,
    coupon,
    validatingCoupon,
    syncing,
    stockWarnings,
    add,
    remove,
    setQty,
    clear,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}