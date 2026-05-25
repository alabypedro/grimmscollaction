import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import type { Product } from "./products";
import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  product: Product;
  qty: number;
  color?: string;
}

interface CartCtx {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (product: Product, qty?: number, color?: string) => void;
  remove: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clear: () => void;
  syncCart: () => Promise<void>;
  count: number;
  total: number;
}

const Ctx = createContext<CartCtx | null>(null);

const CART_STORAGE_KEY = "grimms_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Error loading cart from storage", e);
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  // Function to sync local cart with backend
  const syncCart = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      // 1. Get current backend items
      const { data: dbItems, error: fetchError } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', session.user.id);

      if (fetchError) throw fetchError;

      // 2. Logic to merge (Simplified: Local takes precedence for now or we just combine)
      // For a real production app, you might want more complex merging logic
      // Here we'll just push local items to DB if they don't exist
      for (const item of items) {
        const exists = dbItems?.find(db => db.product_id === item.product.id);
        if (!exists) {
          await supabase.from('cart_items').insert({
            user_id: session.user.id,
            product_id: item.product.id,
            quantity: item.qty,
            color: item.color
          });
        }
      }
    } catch (err) {
      console.error("Sync error", err);
    }
  }, [items]);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product: Product, qty = 1, color?: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { product, qty, color }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.product.price, 0);

  return (
    <Ctx.Provider value={{ items, open, setOpen, add, remove, updateQty, clear, syncCart, count, total }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });