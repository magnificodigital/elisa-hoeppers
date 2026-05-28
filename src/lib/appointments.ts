import { supabase } from "./supabase";

export type Service = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_min: number;
  price_cents: number;
  is_online: boolean;
  is_group: boolean;
  is_active: boolean;
  display_order: number;
  cover_image: string | null;
};

export type Appointment = {
  id: string;
  code: string;
  service_id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  starts_at: string;
  ends_at: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  created_at: string;
};

export type TakenSlot = { starts_at: string; ends_at: string; service_id: string };

export type BookingResult = {
  appointment_id: string;
  code: string;
  starts_at: string;
  ends_at: string;
};

export async function listServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Service[];
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return data as Service | null;
}

export async function listTakenSlots(): Promise<TakenSlot[]> {
  const { data, error } = await supabase
    .from("taken_slots")
    .select("*");
  if (error) throw error;
  return (data ?? []) as TakenSlot[];
}

export async function bookAppointment(input: {
  service_id: string;
  starts_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  notes?: string;
}): Promise<BookingResult> {
  const { data, error } = await supabase.rpc("book_appointment", {
    p_service_id: input.service_id,
    p_starts_at: input.starts_at,
    p_customer_name: input.customer_name,
    p_customer_email: input.customer_email,
    p_customer_phone: input.customer_phone ?? null,
    p_notes: input.notes ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Falha ao criar reserva.");
  const result = row as BookingResult;
  supabase.functions
    .invoke("send-notification", { body: { type: "booking", record_id: result.appointment_id } })
    .catch((e) => console.error("email failed:", e));
  return result;
}

export async function getAppointmentByCode(code: string): Promise<Appointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) throw error;
  return data as Appointment | null;
}

// =================== SLOT LOGIC (client-side) ===================
export type Slot = { startsAt: Date; endsAt: Date; available: boolean };

const TIMEZONE = "America/Sao_Paulo";

function parseHM(s: string | null): { h: number; m: number } | null {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return { h, m };
}

export function generateSlotsForDate(
  date: Date,
  durationMin: number,
  taken: TakenSlot[],
  rules?: AvailabilityRule[] | null,
  blocks?: AvailabilityBlock[] | null,
): Slot[] {
  const defaultRule = (day: number): { start: { h: number; m: number }; end: { h: number; m: number } } | null => {
    if (day === 0) return null;
    if (day === 6) return { start: { h: 8, m: 0 }, end: { h: 12, m: 0 } };
    return { start: { h: 8, m: 0 }, end: { h: 18, m: 0 } };
  };

  const day = date.getDay();
  let window: { start: { h: number; m: number }; end: { h: number; m: number } } | null = null;

  if (rules && rules.length > 0) {
    const r = rules.find((x) => x.day_of_week === day);
    if (r && r.is_active) {
      const s = parseHM(r.start_time);
      const e = parseHM(r.end_time);
      if (s && e) window = { start: s, end: e };
    }
  } else {
    window = defaultRule(day);
  }

  if (!window) return [];

  const slots: Slot[] = [];
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  const takenRanges = taken.map((t) => ({ start: new Date(t.starts_at), end: new Date(t.ends_at) }));
  const blockRanges = (blocks ?? []).map((b) => ({ start: new Date(b.starts_at), end: new Date(b.ends_at) }));

  let h = window.start.h;
  let m = window.start.m;
  while (true) {
    const startsAt = new Date(base);
    startsAt.setHours(h, m, 0, 0);
    const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

    const endLimit = new Date(base);
    endLimit.setHours(window.end.h, window.end.m, 0, 0);
    if (endsAt > endLimit) break;

    if (startsAt >= new Date()) {
      const collisionTaken = takenRanges.some((r) => startsAt < r.end && endsAt > r.start);
      const inBlock = blockRanges.some((r) => startsAt < r.end && endsAt > r.start);
      slots.push({ startsAt, endsAt, available: !collisionTaken && !inBlock });
    }

    m += 30;
    if (m >= 60) { h += 1; m = 0; }
  }

  return slots;
}

export function formatCurrencyBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE });
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: TIMEZONE });
}

// =================== ADMIN ===================
export type AppointmentWithService = Appointment & {
  service: { slug: string; title: string; duration_min: number; price_cents: number; is_online: boolean; is_group: boolean };
};

export async function listAppointmentsForAdmin(filter?: { status?: Appointment["status"] }): Promise<AppointmentWithService[]> {
  let q = supabase
    .from("appointments")
    .select(`
      id, code, service_id, user_id, customer_name, customer_email, customer_phone,
      starts_at, ends_at, status, notes, created_at,
      service:services ( slug, title, duration_min, price_cents, is_online, is_group )
    `)
    .order("starts_at", { ascending: true });
  if (filter?.status) q = q.eq("status", filter.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as AppointmentWithService[];
}

export async function updateAppointmentStatus(id: string, status: Appointment["status"]): Promise<void> {
  const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
  if (error) throw error;
}

// =================== AVAILABILITY ===================
export type AvailabilityRule = {
  day_of_week: number;
  is_active: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type AvailabilityBlock = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
};

export async function listAvailabilityRules(): Promise<AvailabilityRule[]> {
  const { data, error } = await supabase
    .from("availability_rules")
    .select("*")
    .order("day_of_week", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AvailabilityRule[];
}

export async function updateAvailabilityRule(dayOfWeek: number, patch: Partial<AvailabilityRule>): Promise<void> {
  const { error } = await supabase.from("availability_rules").update(patch).eq("day_of_week", dayOfWeek);
  if (error) throw error;
}

export async function listAvailabilityBlocks(): Promise<AvailabilityBlock[]> {
  const { data, error } = await supabase
    .from("availability_blocks")
    .select("*")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AvailabilityBlock[];
}

export async function createAvailabilityBlock(input: { starts_at: string; ends_at: string; reason?: string }): Promise<void> {
  const { error } = await supabase.from("availability_blocks").insert(input);
  if (error) throw error;
}

export async function deleteAvailabilityBlock(id: string): Promise<void> {
  const { error } = await supabase.from("availability_blocks").delete().eq("id", id);
  if (error) throw error;
}
