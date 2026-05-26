import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Award } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { listMyCertificates } from "@/lib/certificates";

export const Route = createFileRoute("/painel/certificados")({
  head: () => ({ meta: [{ title: "Meus certificados — Elisa Hoeppers" }] }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user)
      navigate({ to: "/login", search: { next: "/painel/certificados" } });
  }, [loading, user, navigate]);

  const { data: certs, isLoading } = useQuery({
    queryKey: ["my-certificates", user?.id],
    queryFn: listMyCertificates,
    enabled: !!user,
  });

  if (loading || !user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-primary-dark">Carregando…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 bg-cream min-h-[70vh]">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            to="/painel"
            className="text-xs uppercase tracking-widest text-primary-dark/70 hover:opacity-70"
          >
            ← Voltar ao painel
          </Link>

          <div className="flex items-center gap-3 mt-4 mb-2">
            <Award className="text-primary" size={28} />
            <h1 className="font-display text-3xl md:text-4xl text-primary-dark">
              Meus certificados
            </h1>
          </div>
          <p className="text-primary-dark/70 mb-8">
            Certificados conquistados ao concluir cursos.
          </p>

          {isLoading && <p className="text-primary-dark/70">Carregando…</p>}

          {!isLoading && (certs?.length ?? 0) === 0 && (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-primary-dark mb-4">
                Você ainda não conquistou nenhum certificado. Conclua um curso pra
                ganhar o seu.
              </p>
              <Link
                to="/cursos"
                className="inline-block bg-primary text-white px-8 py-3 rounded-full uppercase tracking-[0.2em] text-[11px] font-semibold hover:bg-primary-dark transition"
              >
                Explorar aulas
              </Link>
            </div>
          )}

          <div className="space-y-3">
            {(certs ?? []).map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 bg-white rounded-lg p-5"
              >
                <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center shrink-0">
                  <Award className="text-primary" size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-primary-dark">
                    {c.course_title}
                  </p>
                  <p className="text-xs text-primary-dark/60 mt-0.5">
                    Emitido em{" "}
                    {new Date(c.issued_at).toLocaleDateString("pt-BR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · Código: <span className="font-mono">{c.code}</span>
                  </p>
                </div>
                <Link
                  to="/certificado/$code"
                  params={{ code: c.code }}
                  className="inline-block bg-primary text-white px-5 py-2 rounded-full text-[11px] uppercase tracking-widest hover:bg-primary-dark transition shrink-0"
                >
                  Ver certificado
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
