"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = { variantId: string; name: string; color: string; size: string; price: number; image: string | null; quantity: number };

type CartValue = {
  lines: CartLine[];
  count: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ut-cart");
      if (saved) setLines(JSON.parse(saved) as CartLine[]);
    } catch { /* a damaged cart starts empty */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem("ut-cart", JSON.stringify(lines)); }, [lines, ready]);
  const value = useMemo<CartValue>(() => ({
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    add(line, quantity = 1) {
      setLines((current) => {
        const existing = current.find((item) => item.variantId === line.variantId);
        if (existing) return current.map((item) => item.variantId === line.variantId ? { ...item, quantity: Math.min(10, item.quantity + quantity) } : item);
        return [...current, { ...line, quantity }];
      });
    },
    setQuantity(variantId, quantity) {
      setLines((current) => quantity < 1 ? current.filter((item) => item.variantId !== variantId) : current.map((item) => item.variantId === variantId ? { ...item, quantity: Math.min(10, quantity) } : item));
    },
    remove(variantId) { setLines((current) => current.filter((item) => item.variantId !== variantId)); },
    clear() { setLines([]); },
  }), [lines]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("Cart is unavailable");
  return value;
}
