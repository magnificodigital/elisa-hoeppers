import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import Layout from "@/components/Layout";
import { CertificateView } from "@/components/CertificateView";
import { getCertificateByCode } from "@/lib/certificates";

export const Route = createFileRoute("/certificado/$code")({
  loader: async ({ params }) => {
    const cert = await getCertificateByCode(params.code);
    if (!cert) throw notFound();
    return { cert };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Certificado de ${loaderData.cert.student_name}`
          : "Certificado — Elisa Hoeppers",
      },
      {
        name: "description",
        content: loaderData
          ? `${loaderData.cert.student_name} concluiu o curso ${loaderData.cert.course_title} com Elisa Hoeppers.`
          : "",
      },
    ],
  }),
  component: CertificatePage,
});

function CertificatePage() {
  const { cert } = Route.useLoaderData();
  return (
    <Layout>
      <section className="py-10 bg-white min-h-[80vh]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6 print:hidden">
            <Link
              to="/"
              className="text-xs uppercase tracking-widest text-primary-dark/70 hover:opacity-70"
            >
              ← Voltar
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary-dark transition"
            >
              <Printer size={14} />
              Imprimir / Salvar PDF
            </button>
          </div>

          <CertificateView cert={cert} />

          <p className="text-center text-xs text-primary-dark/60 mt-6 print:hidden">
            Este certificado foi verificado em{" "}
            {new Date().toLocaleDateString("pt-BR")}. Para confirmar autenticidade,
            acesse elisahoeppers.com.br/certificado/{cert.code}.
          </p>
        </div>
      </section>
    </Layout>
  );
}
