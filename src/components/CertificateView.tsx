import type { Certificate } from "@/lib/certificates";

export function CertificateView({ cert }: { cert: Certificate }) {
  const dateStr = new Date(cert.issued_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="certificate-paper relative bg-cream mx-auto shadow-2xl"
      style={{
        width: "100%",
        maxWidth: "1123px",
        aspectRatio: "1123 / 794",
      }}
    >
      {/* Borda decorativa externa */}
      <div className="absolute inset-6 border border-primary/40" />
      {/* Borda interna fina */}
      <div className="absolute inset-8 border border-primary/20" />

      {/* Folhas decorativas nos cantos */}
      <div className="absolute top-10 left-10 w-16 h-16 rounded-full bg-primary/10" />
      <div className="absolute bottom-10 right-10 w-16 h-16 rounded-full bg-primary/10" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-16 py-16">
        <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-primary-dark/60 mb-2">
          Certificado de Conclusão
        </p>

        <p className="font-display text-2xl md:text-3xl text-primary mb-10 italic">
          elisa hoeppers
        </p>

        <p className="text-sm md:text-base text-primary-dark/70 mb-4">Certificamos que</p>

        <h1 className="font-display text-3xl md:text-5xl text-primary-dark mb-6">
          {cert.student_name}
        </h1>

        <p className="text-sm md:text-base text-primary-dark/70 mb-3">
          concluiu com êxito o curso
        </p>

        <h2 className="font-display text-2xl md:text-3xl text-primary-dark mb-8">
          {cert.course_title}
        </h2>

        <p className="text-sm md:text-base text-primary-dark/70 mb-12">em {dateStr}</p>

        <div className="grid grid-cols-2 gap-12 w-full max-w-2xl mt-auto">
          <div className="text-center border-t border-primary-dark/30 pt-3">
            <p className="font-display text-lg text-primary-dark">
              {cert.instructor_name}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-primary-dark/60 mt-1">
              Instrutora
            </p>
          </div>
          <div className="text-center border-t border-primary-dark/30 pt-3">
            <p className="text-[10px] uppercase tracking-widest text-primary-dark/60">
              Código
            </p>
            <p className="font-mono text-base text-primary-dark tracking-wider">
              {cert.code}
            </p>
            <p className="text-[9px] text-primary-dark/50 mt-1">
              verifique em elisahoeppers.com.br/certificado/{cert.code}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
