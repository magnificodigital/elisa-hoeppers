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
  weight_g: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  brand: string | null;
  ritual_id: string | null;
  ritual_ids?: string[];
};

const COLS =
  "id, slug, name, short_description, description, price_cents, compare_at_price_cents, in_stock, is_active, is_featured, gallery, category, display_order, weight_g, length_cm, width_cm, height_cm, brand, ritual_id";

async function attachRituals<T extends { id: string; ritual_id: string | null }>(
  rows: T[],
): Promise<(T & { ritual_ids: string[] })[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const { data, error } = await supabase
    .from("product_rituals")
    .select("product_id, ritual_id")
    .in("product_id", ids);
  if (error) throw error;
  const map = new Map<string, string[]>();
  for (const link of data ?? []) {
    const arr = map.get(link.product_id) ?? [];
    arr.push(link.ritual_id);
    map.set(link.product_id, arr);
  }
  return rows.map((r) => {
    const list = map.get(r.id) ?? (r.ritual_id ? [r.ritual_id] : []);
    return { ...r, ritual_ids: list };
  });
}

export async function setProductRituals(productId: string, ritualIds: string[]): Promise<void> {
  const { error: delErr } = await supabase
    .from("product_rituals")
    .delete()
    .eq("product_id", productId);
  if (delErr) throw delErr;
  if (ritualIds.length > 0) {
    const { error: insErr } = await supabase
      .from("product_rituals")
      .insert(ritualIds.map((rid) => ({ product_id: productId, ritual_id: rid })));
    if (insErr) throw insErr;
  }
}

// =================== BODYOGA RITUALS ===================
export type Ritual = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
};

const RITUAL_COLS = "id, slug, title, description, image_url, display_order, is_active";

export async function listActiveRituals(): Promise<Ritual[]> {
  const { data, error } = await supabase
    .from("bodyoga_rituals")
    .select(RITUAL_COLS)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Ritual[];
}

export async function listAllRitualsForAdmin(): Promise<Ritual[]> {
  const { data, error } = await supabase
    .from("bodyoga_rituals")
    .select(RITUAL_COLS)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Ritual[];
}

export async function getRitualForAdmin(id: string): Promise<Ritual | null> {
  const { data, error } = await supabase
    .from("bodyoga_rituals")
    .select(RITUAL_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Ritual | null;
}

export type RitualInsert = Omit<Ritual, "id">;
export type RitualUpdate = Partial<RitualInsert>;

export async function createRitual(input: RitualInsert): Promise<Ritual> {
  const { data, error } = await supabase
    .from("bodyoga_rituals")
    .insert(input)
    .select(RITUAL_COLS)
    .single();
  if (error) throw error;
  return data as Ritual;
}

export async function updateRitual(id: string, patch: RitualUpdate): Promise<void> {
  const { error } = await supabase.from("bodyoga_rituals").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteRitual(id: string): Promise<void> {
  const { error } = await supabase.from("bodyoga_rituals").delete().eq("id", id);
  if (error) throw error;
}

// =================== BODYOGA SLIDES (HERO SLIDER) ===================
export type Slide = {
  id: string;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  video_url: string | null;
  display_order: number;
  is_active: boolean;
  duration_seconds: number;
};

const SLIDE_COLS = "id, title, subtitle, cta_label, cta_href, image_url, video_url, display_order, is_active, duration_seconds";


export async function listActiveSlides(): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("bodyoga_slides")
    .select(SLIDE_COLS)
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Slide[];
}

export async function listAllSlidesForAdmin(): Promise<Slide[]> {
  const { data, error } = await supabase
    .from("bodyoga_slides")
    .select(SLIDE_COLS)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Slide[];
}

export async function getSlideForAdmin(id: string): Promise<Slide | null> {
  const { data, error } = await supabase
    .from("bodyoga_slides")
    .select(SLIDE_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Slide | null;
}

export type SlideInsert = Omit<Slide, "id">;
export type SlideUpdate = Partial<SlideInsert>;

export async function createSlide(input: SlideInsert): Promise<Slide> {
  const { data, error } = await supabase
    .from("bodyoga_slides")
    .insert(input)
    .select(SLIDE_COLS)
    .single();
  if (error) throw error;
  return data as Slide;
}

export async function updateSlide(id: string, patch: SlideUpdate): Promise<void> {
  const { error } = await supabase.from("bodyoga_slides").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteSlide(id: string): Promise<void> {
  const { error } = await supabase.from("bodyoga_slides").delete().eq("id", id);
  if (error) throw error;
}

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
  return attachRituals((data ?? []) as Product[]);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(COLS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await attachRituals([data as Product]))[0];
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
  return attachRituals((data ?? []) as Product[]);
}

export async function getProductForAdmin(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return (await attachRituals([data as Product]))[0];
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
  tracking_code: string | null;
  shipping_service_id: string | null;
  shipping_service_label: string | null;
  shipping_destination_cep: string | null;
  me_order_id: string | null;
  me_label_url: string | null;
  me_status: string | null;
  payment_method_type: string | null;
  payment_installments: number | null;
  created_at: string;
};

const ORDER_COLS =
  "id, code, user_id, customer_name, customer_email, customer_phone, customer_address, items, subtotal_cents, shipping_cents, total_cents, status, notes, tracking_code, shipping_service_id, shipping_service_label, shipping_destination_cep, me_order_id, me_label_url, me_status, payment_method_type, payment_installments, created_at";

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

// =================== USER: MY ORDERS ===================
export async function listMyOrders(): Promise<Order[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) return [];
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLS)
    .eq("user_id", sessionUser.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Order[];
}

export async function cancelMyOrder(orderId: string): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const sessionUser = sessionData?.session?.user;
  if (!sessionUser) throw new Error("Você precisa estar logada.");
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", orderId)
    .eq("user_id", sessionUser.id)
    .eq("status", "pending");
  if (error) throw error;
}

export async function updateOrderTracking(id: string, trackingCode: string | null): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ tracking_code: trackingCode })
    .eq("id", id);
  if (error) throw error;
}

// =================== SHIPPING (Melhor Envio) ===================
export type ShippingOption = {
  id: string;
  name: string; // "PAC", "SEDEX", "JadLog Package", etc
  company: string; // "Correios", "JadLog", etc
  price_cents: number;
  delivery_days: number;
  error: string | null;
};

export async function calculateShipping(input: {
  cep_destino: string;
  items: { product_id: string; qty: number }[];
}): Promise<ShippingOption[]> {
  const { data, error } = await supabase.functions.invoke("me-calculate-shipping", {
    body: input,
  });
  if (error) throw error;
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return ((data as { options?: ShippingOption[] })?.options ?? []) as ShippingOption[];
}
