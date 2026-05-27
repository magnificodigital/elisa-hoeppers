import { supabase } from "./supabase";
import type { Course } from "./supabase";
import type { Product } from "./shop";

export type WishlistEntry = {
  id: string;
  user_id: string;
  item_type: "course" | "product";
  course_id: string | null;
  product_id: string | null;
  added_at: string;
};

export type WishlistEntryWithDetails = WishlistEntry & {
  course: Course | null;
  product: Product | null;
};

async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ?? null;
}

export async function isInWishlist(
  itemType: "course" | "product",
  itemId: string,
): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  const col = itemType === "course" ? "course_id" : "product_id";
  const { data } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq(col, itemId)
    .maybeSingle();
  return !!data;
}

export async function addToWishlist(
  itemType: "course" | "product",
  itemId: string,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Você precisa estar logada para favoritar.");
  const payload: Record<string, unknown> = {
    user_id: user.id,
    item_type: itemType,
  };
  if (itemType === "course") payload.course_id = itemId;
  else payload.product_id = itemId;
  const { error } = await supabase.from("wishlist_items").insert(payload);
  if (error && error.code !== "23505") throw error;
}

export async function removeFromWishlist(
  itemType: "course" | "product",
  itemId: string,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const col = itemType === "course" ? "course_id" : "product_id";
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("item_type", itemType)
    .eq(col, itemId);
  if (error) throw error;
}

export async function listMyWishlist(): Promise<WishlistEntryWithDetails[]> {
  const user = await getSessionUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      `
      id, user_id, item_type, course_id, product_id, added_at,
      course:courses ( id, slug, title, subtitle, description, cover_image, overlay_label, level, duration_total_min, price_cents, is_published, display_order ),
      product:products ( id, slug, name, short_description, description, price_cents, compare_at_price_cents, in_stock, is_active, is_featured, gallery, category, display_order )
    `,
    )
    .order("added_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as WishlistEntryWithDetails[];
}
