import { useEffect, useState, useCallback } from "react";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  image: string | null;
  unit_price_cents: number;
  qty: number;
};

const STORAGE_KEY = "elisa.cart.v1";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("elisa-cart-change"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(loadCart());
    const handler = () => setItems(loadCart());
    window.addEventListener("elisa-cart-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("elisa-cart-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty"> & { qty?: number }) => {
      const current = loadCart();
      const idx = current.findIndex((i) => i.product_id === item.product_id);
      const addQty = item.qty ?? 1;
      if (idx >= 0) {
        current[idx].qty += addQty;
      } else {
        const { qty: _q, ...rest } = item;
        current.push({ ...rest, qty: addQty });
      }
      saveCart(current);
    },
    [],
  );

  const updateQty = useCallback((product_id: string, qty: number) => {
    const current = loadCart();
    const idx = current.findIndex((i) => i.product_id === product_id);
    if (idx < 0) return;
    if (qty <= 0) current.splice(idx, 1);
    else current[idx].qty = qty;
    saveCart(current);
  }, []);

  const removeItem = useCallback((product_id: string) => {
    saveCart(loadCart().filter((i) => i.product_id !== product_id));
  }, []);

  const clear = useCallback(() => saveCart([]), []);

  const subtotalCents = items.reduce((acc, i) => acc + i.unit_price_cents * i.qty, 0);
  const totalItems = items.reduce((acc, i) => acc + i.qty, 0);

  return { items, addItem, updateQty, removeItem, clear, subtotalCents, totalItems };
}
