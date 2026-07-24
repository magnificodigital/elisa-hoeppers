import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, Users, UserPlus, Trash2, Key, KeyRound, UserCog, ShieldCheck, Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout";
import { AdminGuard } from "@/components/AdminGuard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  listUsers,
  updateUserRole,
  inviteUser,
  createUser,
  deleteUser,
  sendPasswordResetForUser,
  setUserPassword,
  type UserRow,
} from "@/lib/users";

const ROLE_INFO: Record<UserRow["role"], { label: string; desc: string }> = {
  student: {
    label: "Aluna",
    desc: "Acesso à área da cliente: cursos matriculados, pedidos, lista de desejos e perfil.",
  },
  instructor: {
    label: "Instrutora",
    desc: "Tudo da aluna + gerenciar cursos, aulas, quizzes e ver matrículas dos alunos.",
  },
  admin: {
    label: "Admin",
    desc: "Controle total: produtos, pedidos, agendamentos, usuários, configurações e envio de emails.",
  },
};

export const Route = createFileRoute("/admin/configuracoes/usuarios")({
  head: () => ({ meta: [{ title: "Admin — Usuários" }] }),
  component: () => (
    <AdminGuard>
      <Page />
    </AdminGuard>
  ),
});

function Page() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<"invite" | "create" | null>(null);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listUsers,
  });

  const filtered = (users ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email ?? "").toLowerCase().includes(q) || (u.full_name ?? "").toLowerCase().includes(q);
  });

  return (
    <Layout>
      <section className="py-12 md:py-16 bg-cream min-h-[70vh]">
        <div className="max-w-3xl mx-auto px-4">
          <Link to="/admin/configuracoes" className="inline-flex items-center gap-1 text-sm text-primary-dark/70 hover:text-primary transition mb-6">
            <ChevronLeft size={16} /> Voltar
          </Link>

          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center">
                <Users size={20} className="text-primary" />
              </div>
              <h1 className="font-display text-3xl text-primary-dark">Usuários</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPanel(panel === "create" ? null : "create")}
                className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
              >
                <UserCog size={14} /> Criar usuário
              </button>
              <button
                type="button"
                onClick={() => setPanel(panel === "invite" ? null : "invite")}
                className="inline-flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary/5 transition"
              >
                <UserPlus size={14} /> Convidar
              </button>
            </div>
          </div>
          <p className="text-sm text-primary-dark/60 mb-6">Crie, convide, delegue permissões e remova usuárias do sistema.</p>

          <RoleLegend />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email…"
            className="w-full border border-border rounded-full px-5 py-2.5 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          />

          {panel === "create" && (
            <CreateForm
              onClose={() => setPanel(null)}
              onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
            />
          )}
          {panel === "invite" && (
            <InviteForm
              onClose={() => setPanel(null)}
              onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
            />
          )}

          {isLoading && <p className="text-[var(--text-muted)]">Carregando…</p>}
          {error && <p className="text-sm text-red-700">{(error as Error).message}</p>}

          {!isLoading && filtered.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <p className="text-primary-dark/60">Nenhum usuário encontrado.</p>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((u) => <UserRowCard key={u.id} user={u} />)}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function UserRowCard({ user: u }: { user: UserRow }) {
  const qc = useQueryClient();
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const update = useMutation({
    mutationFn: (role: UserRow["role"]) => updateUserRole(u.id, role),
    onSuccess: () => {
      toast.success("Papel atualizado");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteUser(u.id),
    onSuccess: () => {
      toast.success("Usuário excluído");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reset = useMutation({
    mutationFn: () => sendPasswordResetForUser(u.email),
    onSuccess: () => toast.success("Email de troca de senha enviado"),
    onError: (e: Error) => toast.error(e.message),
  });

  const initials = (u.full_name?.trim() || u.email).slice(0, 2).toUpperCase();
  const roleCls =
    u.role === "admin"
      ? "bg-primary text-cream"
      : u.role === "instructor"
        ? "bg-peach/40 text-primary-dark"
        : "bg-cream text-primary-dark";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center shrink-0 overflow-hidden">
        {u.avatar_url ? (
          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-primary-dark">{initials}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-primary-dark truncate">{u.full_name ?? u.email}</p>
        <p className="text-xs text-primary-dark/60 truncate">{u.email}</p>
        {!u.confirmed && <p className="text-[11px] text-amber-700 mt-0.5">⚠ Email não confirmado</p>}
        {u.last_sign_in_at && (
          <p className="text-[11px] text-primary-dark/40 mt-0.5">
            Último login: {new Date(u.last_sign_in_at).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      <select
        value={u.role}
        onChange={(e) => update.mutate(e.target.value as UserRow["role"])}
        disabled={update.isPending}
        className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${roleCls} border-0 cursor-pointer disabled:opacity-50`}
      >
        <option value="student">Aluna</option>
        <option value="instructor">Instrutora</option>
        <option value="admin">Admin</option>
      </select>

      <button
        type="button"
        onClick={() => setResetOpen(true)}
        disabled={reset.isPending}
        className="text-primary-dark/40 hover:text-primary p-1.5 disabled:opacity-50"
        aria-label="Enviar reset de senha"
        title="Enviar reset de senha"
      >
        <Key size={16} />
      </button>

      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        disabled={remove.isPending}
        className="text-red-600/60 hover:text-red-700 p-1.5 disabled:opacity-50"
        aria-label="Excluir usuário"
        title="Excluir"
      >
        <Trash2 size={16} />
      </button>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Enviar troca de senha?"
        description={`Enviar email de troca de senha para ${u.email}?`}
        confirmLabel="Enviar"
        onConfirm={() => reset.mutate()}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir usuário?"
        description={`Excluir ${u.email}? Esta ação é definitiva e remove pedidos/matrículas.`}
        confirmLabel="Sim, excluir"
        variant="destructive"
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

function InviteForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRow["role"]>("student");

  const invite = useMutation({
    mutationFn: () => inviteUser(email, fullName, role),
    onSuccess: () => {
      setEmail(""); setFullName(""); setRole("student");
      onSuccess();
      onClose();
    },
  });

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
      <h2 className="font-display text-xl text-primary-dark mb-4">Convidar usuário</h2>
      <div className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="email@exemplo.com"
          className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome completo (opcional)"
          className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRow["role"])}
          className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="student">Aluna</option>
          <option value="instructor">Instrutora</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-primary-dark/60">
          O usuário recebe email com link pra definir senha e fazer login.
        </p>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => invite.mutate()}
          disabled={invite.isPending || !email}
          className="bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
        >
          {invite.isPending ? "Enviando…" : "Enviar convite"}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-primary-dark/60 hover:text-primary transition">
          Cancelar
        </button>
      </div>
      {invite.error && <p className="text-xs text-red-700 mt-3">{(invite.error as Error).message}</p>}
    </div>
  );
}

function RoleLegend() {
  return (
    <div className="bg-white/70 border border-border rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={16} className="text-primary" />
        <h2 className="text-xs uppercase tracking-widest text-primary-dark font-medium">Papéis e o que cada um libera</h2>
      </div>
      <ul className="space-y-1.5">
        {(Object.keys(ROLE_INFO) as UserRow["role"][]).map((r) => (
          <li key={r} className="text-xs text-primary-dark/70">
            <span className="font-semibold text-primary-dark">{ROLE_INFO[r].label}:</span> {ROLE_INFO[r].desc}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState<UserRow["role"]>("student");

  const create = useMutation({
    mutationFn: () => createUser(email, password, fullName, role),
    onSuccess: () => {
      toast.success("Usuário criado — já pode fazer login com essas credenciais");
      setEmail(""); setFullName(""); setPassword(""); setRole("student");
      onSuccess();
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function genPassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let p = "";
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setPassword(p);
    setShowPass(true);
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm mb-4">
      <h2 className="font-display text-xl text-primary-dark mb-1">Criar usuário</h2>
      <p className="text-xs text-primary-dark/60 mb-4">
        Cria a conta na hora com email confirmado. Passe as credenciais para a pessoa — ela já consegue entrar.
      </p>
      <div className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="email@exemplo.com"
          className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nome completo (opcional)"
          className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPass ? "text" : "password"}
              placeholder="Senha (mín. 6 caracteres)"
              className="w-full border border-border rounded-md px-3 py-2 pr-10 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary-dark"
              aria-label={showPass ? "Esconder senha" : "Mostrar senha"}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            type="button"
            onClick={genPassword}
            className="border border-border rounded-md px-3 py-2 text-xs text-primary-dark hover:bg-cream transition whitespace-nowrap"
          >
            Gerar
          </button>
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRow["role"])}
          className="w-full border border-border rounded-md px-3 py-2 bg-white text-primary-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="student">Aluna</option>
          <option value="instructor">Instrutora</option>
          <option value="admin">Admin</option>
        </select>
        <p className="text-xs text-primary-dark/60">{ROLE_INFO[role].desc}</p>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() => create.mutate()}
          disabled={create.isPending || !email || password.length < 6}
          className="bg-primary text-white px-5 py-2 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition disabled:opacity-60"
        >
          {create.isPending ? "Criando…" : "Criar usuário"}
        </button>
        <button type="button" onClick={onClose} className="text-sm text-primary-dark/60 hover:text-primary transition">
          Cancelar
        </button>
      </div>
      {create.error && <p className="text-xs text-red-700 mt-3">{(create.error as Error).message}</p>}
    </div>
  );
}
