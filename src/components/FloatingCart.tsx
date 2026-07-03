import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export function FloatingCart() {
  const { totalItems } = useCart();
  if (totalItems === 0) return null;
  return (
    <Link
      to="/carrinho"
      className="fixed bottom-24 right-6 z-50 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition"
      aria-label="Ver carrinho"
    >
      <ShoppingBag className="w-5 h-5" />
      <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-peach text-primary-dark text-xs font-bold flex items-center justify-center">
        {totalItems}
      </span>
    </Link>
  );
}
