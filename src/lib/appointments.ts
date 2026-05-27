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
  return row as BookingResult;
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

function getAvailabilityForDate(d: Date): { startHour: number; endHour: number } | null {
  const day = d.getDay();
  if (day === 0) return null;
  if (day === 6) return { startHour: 8, endHour: 12 };
  return { startHour: 8, endHour: 18 };
}

export function generateSlotsForDate(date: Date, durationMin: number, taken: TakenSlot[]): Slot[] {
  const avail = getAvailabilityForDate(date);
  if (!avail) return [];
  const slots: Slot[] = [];
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  const takenRanges = taken.map((t) => ({ start: new Date(t.starts_at), end: new Date(t.ends_at) }));

  for (let h = avail.startHour; h < avail.endHour; h++) {
    for (let m = 0; m < 60; m += 30) {
      const startsAt = new Date(base);
      startsAt.setHours(h, m, 0, 0);
      const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);

      if (startsAt < new Date()) continue;
      if (endsAt.getHours() > avail.endHour || (endsAt.getHours() === avail.endHour && endsAt.getMinutes() > 0)) continue;

      const collision = takenRanges.some((r) => startsAt < r.end && endsAt > r.start);
      slots.push({ startsAt, endsAt, available: !collision });
    }
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
