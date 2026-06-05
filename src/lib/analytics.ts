import { supabase } from "./supabase";

export type DashboardStats = {
  enrollments_month: number;
  enrollments_total: number;
  orders_month: number;
  orders_pending: number;
  revenue_month_cents: number;
  revenue_total_cents: number;
  appointments_month: number;
  appointments_pending: number;
  students_month: number;
  students_total: number;
  newsletter_month: number;
  newsletter_active: number;
  top_courses: Array<{ title: string; slug: string; cnt: number }>;
  top_products: Array<{ name: string; slug: string; cnt: number }>;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return data as unknown as DashboardStats;
}

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

type EventName =
  | "course_enrolled"
  | "order_created"
  | "appointment_created"
  | "newsletter_subscribed"
  | "lesson_completed"
  | "course_completed";

export function track(
  event: EventName,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch (e) {
    console.warn("analytics: track failed", e);
  }
}
