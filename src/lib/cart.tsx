import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import type { Product } from "./products";

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
    <Ctx.Provider value={{ items, open, setOpen, add, remove, updateQty, clear, count, total }}>
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