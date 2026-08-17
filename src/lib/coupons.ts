import { supabase } from "@/lib/supabase";

export type CouponResult = {
  code: string;
  discount_percent: number;
  expires_at: string | null;
  email: string;
  full_name: string | null;
};

export async function createSignupCoupon(input: {
  email: string;
  full_name?: string | null;
  source?: string;
}): Promise<CouponResult> {
  const { data, error } = await (supabase as any).rpc("create_signup_coupon", {
    p_email: input.email,
    p_name: input.full_name ?? null,
    p_source: input.source ?? "banner",
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Falha ao gerar cupom");
  return row as CouponResult;
}

export async function sendCouponEmail(payload: {
  code: string;
  email: string;
  full_name?: string | null;
  discount_percent: number;
  expires_at?: string | null;
  validity_days?: number;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("send-coupon-email", { body: payload });
  if (error) throw error;
}

export type CouponValidation = {
  code: string;
  discount_percent: number;
  valid: boolean;
  reason: string;
};

export async function validateCoupon(code: string): Promise<CouponValidation> {
  const { data, error } = await (supabase as any).rpc("validate_coupon", { p_code: code });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as CouponValidation;
}

// ================= ADMIN: gestão de cupons =================

export type AdminCoupon = {
  id: string;
  code: string;
  discount_percent: number;
  expires_at: string | null;
  max_uses: number | null; // null = ilimitado; 1 = uso único
  uses_count: number;
  active: boolean;
  description: string | null;
  email: string | null;
  created_at: string;
};

export type CouponInput = {
  code: string;
  discount_percent: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
  description?: string | null;
};

export async function listCoupons(): Promise<AdminCoupon[]> {
  const { data, error } = await (supabase as any)
    .from("coupons")
    .select("id, code, discount_percent, expires_at, max_uses, uses_count, active, description, email, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AdminCoupon[];
}

export async function createCoupon(input: CouponInput): Promise<void> {
  const { error } = await (supabase as any).from("coupons").insert({
    code: input.code.trim().toUpperCase(),
    discount_percent: input.discount_percent,
    max_uses: input.max_uses,
    expires_at: input.expires_at,
    active: input.active,
    description: input.description ?? null,
    email: null,
    source: "admin",
  });
  if (error) throw error;
}

export async function updateCoupon(id: string, patch: Partial<CouponInput>): Promise<void> {
  const { error } = await (supabase as any).from("coupons").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await (supabase as any).from("coupons").delete().eq("id", id);
  if (error) throw error;
}
