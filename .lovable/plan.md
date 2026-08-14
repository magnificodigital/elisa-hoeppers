# Plano — Projetos Personalizados Editáveis e em Lightbox

Implementar a edição da seção de Projetos Personalizados na Home através do painel administrativo e transformar o formulário de solicitação em um lightbox (modal/drawer) acessível diretamente da Home.

## Alterações

### 1. Banco de Dados (Supabase)
- Adicionar configurações padrão na tabela `app_settings` sob a categoria `home`:
  - `home_custom_projects_title`: "Sua marca tem um cheiro."
  - `home_custom_projects_subtitle`: "Vamos criá-lo juntos."
  - `home_custom_projects_cta`: "Solicitar projeto"

### 2. Painel Administrativo
- Atualizar `src/routes/admin/site.home.tsx`:
  - Adicionar os novos campos (`home_custom_projects_title`, `home_custom_projects_subtitle`, `home_custom_projects_cta`) à lista de campos editáveis.

### 3. Componente de Formulário
- Criar `src/components/projetos/CustomProjectForm.tsx`:
  - Extrair a lógica do formulário de `src/routes/projetos-personalizados.tsx` para este componente reutilizável.
  - Manter o suporte a notificações via Resend e salvamento no banco.

### 4. Integração na Home
- Atualizar `src/components/bodyoga/BodyogaLanding.tsx`:
  - Carregar as novas configurações via `fetchIntro` ou similar.
  - Substituir o link direto para `/projetos-personalizados` por um botão que abre um `Dialog` (Desktop) ou `Drawer` (Mobile).
  - Renderizar o `CustomProjectForm` dentro do lightbox.

### 5. Rota de Projetos Personalizados
- Atualizar `src/routes/projetos-personalizados.tsx`:
  - Refatorar para utilizar o novo `CustomProjectForm`, mantendo a funcionalidade de página direta (SEO/Link direto).

## Detalhes Técnicos
- Utilizar `shadcn/ui` (`Dialog` e `Drawer`) para garantir uma experiência responsiva e elegante.
- Manter o fallback para os textos caso as configurações não existam no banco.
- Garantir que o fechamento do modal funcione corretamente após o sucesso do envio.
