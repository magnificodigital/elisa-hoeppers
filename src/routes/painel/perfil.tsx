import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Save, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { PainelLayout } from "@/components/PainelSidebar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/painel/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Elisa Hoeppers" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", search: { next: "/painel/perfil" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          phone: phone || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil salvo");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("Senha mínimo 6 caracteres.");
      if (newPassword !== confirmPassword) throw new Error("As senhas não conferem.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Senha atualizada");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const savedAddresses = Array.isArray(profile?.saved_addresses) ? profile.saved_addresses : [];

  async function setDefaultAddress(id: string) {
    const updated = savedAddresses.map((a: any) => ({ ...a, is_default: a.id === id }));
    await supabase.from("profiles").update({ saved_addresses: updated }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    toast.success("Endereço padrão atualizado");
  }

  async function removeAddress(id: string) {
    if (!confirm("Remover este endereço?")) return;
    const updated = savedAddresses.filter((a: any) => a.id !== id);
    await supabase.from("profiles").update({ saved_addresses: updated }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    toast.success("Endereço removido");
  }

  if (loading || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  const inputCls =
    "w-full border border-border rounded-md px-3 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <PainelLayout active="perfil">
      <div className="flex items-center gap-3 mb-2">
        <User className="text-primary" size={28} />
        <h1 className="font-display text-3xl text-primary-dark">Meu perfil</h1>
      </div>
      <p className="text-primary-dark/60 mb-8">Edite suas informações e mantenha tudo atualizado.</p>


          {/* DADOS PESSOAIS */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-display text-xl text-primary-dark mb-4">Dados pessoais</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">Nome completo</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">Email</label>
                <input value={user.email ?? ""} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
                <p className="text-xs text-primary-dark/50 mt-1">Pra trocar o email, contate a Elisa.</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">WhatsApp / Telefone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className={inputCls} />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">URL da foto (opcional)</label>
                <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className={inputCls} />
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt="Preview da foto"
                    className="mt-3 w-20 h-20 rounded-full object-cover border border-border"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">Bio (opcional)</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputCls} />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
              >
                <Save className="w-3.5 h-3.5" />
                {saveProfile.isPending ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>

          {/* ENDEREÇOS SALVOS */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <h2 className="font-display text-xl text-primary-dark mb-4">Endereços salvos</h2>
            {savedAddresses.length === 0 ? (
              <p className="text-sm text-primary-dark/60">
                Nenhum endereço salvo ainda. Você pode salvar durante o checkout.
              </p>
            ) : (
              <div className="space-y-3">
                {savedAddresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className="border border-border rounded-lg p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-primary-dark">{addr.label}</p>
                        {addr.is_default && (
                          <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Padrão
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-primary-dark/60 leading-relaxed">
                        {addr.street}, {addr.number}
                        {addr.complement ? `, ${addr.complement}` : ""}
                        <br />
                        {addr.district}, {addr.city}/{addr.state} · CEP {addr.cep}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!addr.is_default && (
                        <button
                          onClick={() => setDefaultAddress(addr.id)}
                          className="text-xs text-primary hover:opacity-70"
                        >
                          Tornar padrão
                        </button>
                      )}
                      <button
                        onClick={() => removeAddress(addr.id)}
                        className="text-xs text-red-700 hover:opacity-70"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SENHA */}

          <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="font-display text-xl text-primary-dark">Trocar senha</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">Nova senha</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} className={inputCls} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-primary-dark mb-1.5">Confirmar nova senha</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} className={inputCls} placeholder="••••••••" />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => changePassword.mutate()}
                disabled={changePassword.isPending || newPassword.length < 6}
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
              >
                <Lock className="w-3.5 h-3.5" />
                {changePassword.isPending ? "Trocando…" : "Trocar senha"}
              </button>
            </div>
          </div>
    </PainelLayout>
  );
}
