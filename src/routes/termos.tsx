import { createFileRoute, Link } from "@tanstack/react-router";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Elisa Hoeppers" },
      { name: "description", content: "Termos e condições que regem o uso do site, agendamento de aulas, cursos online e compras na loja da Elisa Hoeppers." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-primary mb-3">Termos de Uso</h1>
          <p className="text-sm text-text-muted">Última atualização: 28 de maio de 2026</p>
        </header>

        <p className="text-text leading-relaxed mb-10">
          Ao usar este site, você concorda com estes Termos e com a nossa Política de Privacidade.
          Se não concorda, por favor não use o site.
        </p>

        <Section title="1. Sobre o serviço">
          <p>
            O site é operado por Elisa Hoeppers Casas, profissional autônoma. Oferecemos aulas de
            yoga, cursos online, produtos de aromaterapia e materiais relacionados.
          </p>
        </Section>

        <Section title="2. Conta e acesso">
          <ul className="list-disc pl-6 space-y-1">
            <li>Você deve ter 18+ anos ou ter consentimento dos responsáveis.</li>
            <li>Suas credenciais são pessoais e intransferíveis.</li>
            <li>Você é responsável por todas as atividades feitas com sua conta.</li>
          </ul>
        </Section>

        <Section title="3. Agendamento de aulas">
          <ul className="list-disc pl-6 space-y-1">
            <li>Reservas ficam pendentes até confirmação pela Elisa via WhatsApp.</li>
            <li>O pagamento pode ser combinado por WhatsApp/PIX ou feito online via Mercado Pago.</li>
            <li>
              Cancelamentos com pelo menos 24h de antecedência são reembolsáveis. Cancelamentos
              depois disso ficam a critério da Elisa.
            </li>
            <li>Faltas sem aviso prévio não são reembolsadas.</li>
          </ul>
        </Section>

        <Section title="4. Cursos online">
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Após matrícula, você tem acesso vitalício ao conteúdo enquanto o curso estiver
              disponível.
            </li>
            <li>
              O conteúdo é pessoal e intransferível. Compartilhar credenciais ou conteúdo gera
              cancelamento da matrícula sem reembolso.
            </li>
            <li>
              Vídeos hospedados no YouTube como "não listados". Não baixe, redistribua nem use
              comercialmente.
            </li>
          </ul>
        </Section>

        <Section title="5. Loja e produtos">
          <ul className="list-disc pl-6 space-y-1">
            <li>Preços e estoque podem mudar a qualquer momento.</li>
            <li>Frete e prazo são combinados por WhatsApp após confirmação do pedido.</li>
            <li>
              Trocas e devoluções: até 7 dias corridos após o recebimento (CDC art. 49), com o
              produto sem uso e na embalagem original.
            </li>
          </ul>
        </Section>

        <Section title="6. Pagamentos">
          <p>
            Os pagamentos online são processados pelo Mercado Pago. Não armazenamos dados de cartão.
            Pagamentos por PIX ou outros meios podem ser combinados por WhatsApp.
          </p>
        </Section>

        <Section title="7. Propriedade intelectual">
          <p>
            Todo o conteúdo (textos, vídeos, áudios, marcas, design) é de propriedade da Elisa
            Hoeppers Casas, exceto quando indicado. É proibida a reprodução, redistribuição ou uso
            comercial sem autorização escrita.
          </p>
        </Section>

        <Section title="8. Conteúdo do usuário">
          <p>
            Ao usar a área de Perguntas &amp; Respostas ou Avaliações, você concorda em manter um
            tom respeitoso. Mensagens ofensivas, spam ou conteúdo ilegal podem ser removidas a
            qualquer momento.
          </p>
        </Section>

        <Section title="9. Isenção de responsabilidade">
          <p>
            As aulas de yoga e o uso de óleos essenciais são complementares ao tratamento médico,
            não o substituem. Consulte profissional de saúde para condições específicas. Não nos
            responsabilizamos por uso indevido das instruções.
          </p>
        </Section>

        <Section title="10. Alterações">
          <p>
            Estes Termos podem mudar. Mudanças relevantes serão comunicadas no site. O uso
            continuado significa aceite das mudanças.
          </p>
        </Section>

        <Section title="11. Lei aplicável">
          <p>
            Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro de São Paulo/SP pra
            resolução de qualquer disputa, com renúncia a qualquer outro.
          </p>
        </Section>

        <p className="mt-12 text-sm">
          Ver também:{" "}
          <Link to="/privacidade" className="text-primary underline">
            Política de Privacidade →
          </Link>
        </p>
      </div>
    </Layout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-medium text-primary mb-3">{title}</h2>
      <div className="text-text leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
