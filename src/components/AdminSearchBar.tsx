import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  Package,
  Calendar,
  User,
} from "lucide-react";
import { adminGlobalSearch } from "@/lib/admin";

export function AdminSearchBar() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["admin-global-search", query],
    queryFn: () => adminGlobalSearch(query),
    enabled: query.trim().length >= 2,
  });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const totalResults =
    (data?.students.length ?? 0) +
    (data?.courses.length ?? 0) +
    (data?.lessons.length ?? 0) +
    (data?.products.length ?? 0) +
    (data?.orders.length ?? 0) +
    (data?.appointments.length ?? 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-dark/40"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar (⌘K) — aluna, curso, produto, pedido…"
          className="w-full bg-white border border-border rounded-full pl-9 pr-9 py-2 text-sm text-primary-dark placeholder:text-primary-dark/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-dark/40 hover:text-primary-dark"
            aria-label="Limpar busca"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-border rounded-xl shadow-lg max-h-[70vh] overflow-y-auto">
          {isFetching && <p className="px-4 py-3 text-sm text-primary-dark/50">Buscando…</p>}

          {!isFetching && totalResults === 0 && (
            <p className="px-4 py-3 text-sm text-primary-dark/50">Nada encontrado pra "{query}".</p>
          )}

          {(data?.students.length ?? 0) > 0 && (
            <ResultGroup icon={<User size={14} />} title="Alunas">
              {data!.students.map((s) => (
                <div key={s.id} onClick={() => setOpen(false)} className="block px-4 py-2 hover:bg-cream/50 transition">
                  <p className="text-sm text-primary-dark">{s.full_name ?? s.email}</p>
                  {s.full_name && <p className="text-xs text-primary-dark/50">{s.email}</p>}
                </div>
              ))}
            </ResultGroup>
          )}

          {(data?.courses.length ?? 0) > 0 && (
            <ResultGroup icon={<GraduationCap size={14} />} title="Cursos">
              {data!.courses.map((c) => (
                <a
                  key={c.id}
                  href={`/cursos/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-cream/50 transition"
                >
                  <p className="text-sm text-primary-dark">{c.title}</p>
                </a>
              ))}
            </ResultGroup>
          )}

          {(data?.lessons.length ?? 0) > 0 && (
            <ResultGroup icon={<BookOpen size={14} />} title="Aulas">
              {data!.lessons.map((l) => (
                <a
                  key={l.id}
                  href={`/cursos/${l.course_slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-cream/50 transition"
                >
                  <p className="text-sm text-primary-dark">{l.title}</p>
                  <p className="text-xs text-primary-dark/50">em {l.course_title}</p>
                </a>
              ))}
            </ResultGroup>
          )}

          {(data?.products.length ?? 0) > 0 && (
            <ResultGroup icon={<ShoppingBag size={14} />} title="Produtos">
              {data!.products.map((p) => (
                <a
                  key={p.id}
                  href={`/loja/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-cream/50 transition"
                >
                  <p className="text-sm text-primary-dark">{p.name}</p>
                </a>
              ))}
            </ResultGroup>
          )}

          {(data?.orders.length ?? 0) > 0 && (
            <ResultGroup icon={<Package size={14} />} title="Pedidos">
              {data!.orders.map((o) => (
                <Link
                  key={o.id}
                  to="/admin/pedidos"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-cream/50 transition"
                >
                  <p className="text-sm text-primary-dark">
                    #{o.code} · {o.customer_name}
                  </p>
                  <p className="text-xs text-primary-dark/50">
                    {o.status} ·{" "}
                    {(o.total_cents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </Link>
              ))}
            </ResultGroup>
          )}

          {(data?.appointments.length ?? 0) > 0 && (
            <ResultGroup icon={<Calendar size={14} />} title="Reservas">
              {data!.appointments.map((a) => (
                <Link
                  key={a.id}
                  to="/admin/agendamentos"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 hover:bg-cream/50 transition"
                >
                  <p className="text-sm text-primary-dark">
                    #{a.code} · {a.customer_name}
                  </p>
                  <p className="text-xs text-primary-dark/50">
                    {a.service_title} ·{" "}
                    {new Date(a.starts_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </Link>
              ))}
            </ResultGroup>
          )}
        </div>
      )}
    </div>
  );
}

function ResultGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 text-[11px] uppercase tracking-widest text-primary-dark/50">
        {icon}
        {title}
      </div>
      <div className="pb-2">{children}</div>
    </div>
  );
}
