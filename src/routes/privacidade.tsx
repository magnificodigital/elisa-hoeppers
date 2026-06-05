import { createFileRoute, Link } from "@tanstack/react-router";
import Layout from "@/components/Layout";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Elisa Hoeppers" },
      { name: "description", content: "Como tratamos seus dados pessoais." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-light text-primary mb-3">
            Política de Privacidade
          </h1>
          <p className="text-sm text-text-muted">Última atualização: 28 de maio de 2026</p>
        </header>

        <p className="text-text leading-relaxed mb-10">
          Este site é operado por Elisa Hoeppers Casas, profissional autônoma de yoga e
          aromaterapia, com endereço comercial na Rua Itapolis 818, Pacaembu, São Paulo/SP. Para
          qualquer dúvida sobre privacidade, entre em contato por{" "}
          <a href="mailto:elisa.hoeppers@gmail.com" className="text-primary underline">
            elisa.hoeppers@gmail.com
          </a>{" "}
          ou WhatsApp +55 11 99406-1178.
        </p>

        <Section title="1. Dados que coletamos">
          <p>Coletamos apenas o necessário pra prestar nossos serviços e responder você:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cadastro de aluna: nome e e-mail.</li>
            <li>Agendamento de aula: nome, e-mail, telefone, mensagem opcional.</li>
            <li>Compra na loja: nome, e-mail, telefone e, opcionalmente, endereço de entrega.</li>
            <li>
              Pagamento online: processado diretamente pelo Mercado Pago. Não armazenamos dados de
              cartão.
            </li>
            <li>Newsletter: e-mail e nome opcional.</li>
            <li>Cookies de sessão: pra manter você logada.</li>
            <li>Cookies analíticos: só ativos após seu consentimento, pra entender uso geral do site.</li>
          </ul>
        </Section>

        <Section title="2. Como usamos seus dados">
          <ul className="list-disc pl-6 space-y-1">
            <li>Prestar os serviços contratados (aulas, cursos, produtos).</li>
            <li>Enviar confirmação de reservas e pedidos por e-mail e WhatsApp.</li>
            <li>Enviar a newsletter (somente se você se inscrever).</li>
            <li>Cumprir obrigações legais (fiscais, contábeis).</li>
            <li>Melhorar o site com dados agregados de uso.</li>
          </ul>
        </Section>

        <Section title="3. Com quem compartilhamos">
          <ul className="list-disc pl-6 space-y-1">
            <li>Supabase — banco de dados onde ficam suas informações.</li>
            <li>Mercado Pago — processa pagamentos online.</li>
            <li>Resend — envia nossos e-mails transacionais.</li>
            <li>YouTube — quando você assiste vídeos das aulas.</li>
            <li>Cloudflare — infraestrutura de hospedagem.</li>
          </ul>
          <p>Não vendemos nem compartilhamos seus dados pra marketing de terceiros.</p>
        </Section>

        <Section title="4. Cookies">
          <p>Usamos cookies pra:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Manter você logada (essencial).</li>
            <li>Lembrar itens no carrinho (essencial).</li>
            <li>Salvar suas preferências de consentimento.</li>
            <li>Analisar uso geral do site (opcional — só com seu aceite).</li>
          </ul>
        </Section>

        <Section title="5. Seus direitos (LGPD)">
          <p>Você pode, a qualquer momento:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acessar, corrigir ou apagar seus dados;</li>
            <li>Solicitar portabilidade;</li>
            <li>Revogar consentimento (newsletter, cookies analíticos);</li>
            <li>Reclamar à ANPD.</li>
          </ul>
          <p>
            Pra exercer qualquer um, escreva pra{" "}
            <a href="mailto:elisa.hoeppers@gmail.com" className="text-primary underline">
              elisa.hoeppers@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="6. Retenção de dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa ou enquanto for necessário pra
            cumprir obrigações legais. Você pode pedir a exclusão a qualquer momento.
          </p>
        </Section>

        <Section title="7. Alterações">
          <p>
            Esta política pode ser atualizada. Mudanças relevantes serão comunicadas por e-mail ou
            na sua próxima visita.
          </p>
        </Section>

        <p className="mt-12 text-sm">
          Ver também:{" "}
          <Link to="/termos" className="text-primary underline">
            Termos de Uso →
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
