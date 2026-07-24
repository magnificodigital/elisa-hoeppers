// @ts-ignore - Deno
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// @ts-ignore
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hoepppers.lovable.app";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function isAdmin(authToken: string): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser(authToken);
  if (!user.user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.user.id)
    .maybeSingle();
  return profile?.role === "admin";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) throw new Error("Não autenticado");
    const ok = await isAdmin(token);
    if (!ok) throw new Error("Apenas admin");

    const { action, payload } = await req.json();

    if (action === "list") {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
      if (error) throw error;
      const ids = users.map((u) => u.id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, role, full_name, avatar_url")
        .in("id", ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      const enriched = users.map((u) => {
        const p = profileMap.get(u.id);
        return {
          id: u.id,
          email: u.email,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          confirmed: !!u.email_confirmed_at,
          role: p?.role ?? "student",
          full_name: p?.full_name ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });
      return new Response(JSON.stringify({ users: enriched }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_role") {
      const { user_id, role } = payload;
      if (!["student", "instructor", "admin"].includes(role)) throw new Error("Role inválida");
      const { error } = await supabase.from("profiles").update({ role }).eq("id", user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create") {
      const { email, password, full_name, role } = payload;
      if (!email || !String(email).includes("@")) throw new Error("Email inválido");
      if (!password || String(password).length < 6) throw new Error("A senha precisa ter ao menos 6 caracteres");
      if (!["student", "instructor", "admin"].includes(role || "student")) throw new Error("Papel inválido");
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name || null },
      });
      if (error) throw error;
      const newUserId = data.user?.id;
      if (newUserId) {
        await supabase.from("profiles").upsert({
          id: newUserId,
          full_name: full_name || null,
          role: role || "student",
        });
      }
      return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "invite") {
      const { email, full_name, role } = payload;
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${SITE_URL}/login`,
      });
      if (error) throw error;
      const newUserId = data.user?.id;
      if (newUserId) {
        await supabase.from("profiles").upsert({
          id: newUserId,
          full_name: full_name || null,
          role: role || "student",
        });
      }
      return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_password") {
      const { user_id, password } = payload;
      if (!user_id) throw new Error("user_id obrigatório");
      if (!password || String(password).length < 6) throw new Error("A senha precisa ter ao menos 6 caracteres");
      const { error } = await supabase.auth.admin.updateUserById(user_id, { password });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = payload;
      const { error } = await supabase.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "send_password_reset") {
      const { email } = payload;
      const { error } = await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${SITE_URL}/login` },
      });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
