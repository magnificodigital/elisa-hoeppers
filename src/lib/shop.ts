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

// =================== ADMIN: PRODUCTS ===================
export async function listAllProductsForAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(COLS)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function getProductForAdmin(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Product | null;
}

export type ProductUpdate = Partial<Omit<Product, "id">>;

export async function updateProduct(id: string, patch: ProductUpdate): Promise<void> {
  const { error } = await supabase.from("products").update(patch).eq("id", id);
  if (error) throw error;
}

export type ProductInsert = Omit<Product, "id">;

export async function createProduct(input: ProductInsert): Promise<Product> {
  const { data, error } = await supabase.from("products").insert(input).select().single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

// =================== ADMIN: ORDERS ===================
export type OrderItem = {
  product_id: string;
  slug: string;
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
};

export type Order = {
  id: string;
  code: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: Record<string, string | null> | null;
  items: OrderItem[];
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  status: "pending" | "confirmed" | "shipped" | "cancelled" | "completed";
  notes: string | null;
  created_at: string;
};

const ORDER_COLS =
  "id, code, user_id, customer_name, customer_email, customer_phone, customer_address, items, subtotal_cents, shipping_cents, total_cents, status, notes, created_at";

export async function listAllOrdersForAdmin(filter?: { status?: Order["status"] }): Promise<Order[]> {
  let q = supabase
    .from("orders")
    .select(ORDER_COLS)
    .order("created_at", { ascending: false });
  if (filter?.status) q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function updateOrderStatus(id: string, status: Order["status"]): Promise<void> {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateOrderShipping(id: string, shippingCents: number, subtotalCents: number): Promise<void> {
  const { error } = await supabase.from("orders").update({
    shipping_cents: shippingCents,
    total_cents: subtotalCents + shippingCents,
  }).eq("id", id);
  if (error) throw error;
}
