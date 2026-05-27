import { supabase } from "./supabase";

export type ProductImage = { url: string; alt?: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  gallery: ProductImage[];
  category: string | null;
  display_order: number;
};

const COLS =
  "id, slug, name, short_description, description, price_cents, compare_at_price_cents, in_stock, is_active, is_featured, gallery, category, display_order";

export async function listProducts(filter?: {
  onlyInStock?: boolean;
  featured?: boolean;
}): Promise<Product[]> {
  let q = supabase
    .from("products")
    .select(COLS)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (filter?.onlyInStock) q = q.eq("in_stock", true);
  if (filter?.featured) q = q.eq("is_featured", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(COLS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export function formatPriceBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function firstImage(p: Product): string | null {
  return p.gallery?.[0]?.url ?? null;
}
