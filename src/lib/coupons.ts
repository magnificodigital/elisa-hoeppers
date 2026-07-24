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
