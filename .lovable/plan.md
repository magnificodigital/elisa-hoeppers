# Plano de Implementação — Fluxo de Projetos Personalizados

Implementação de um sistema para solicitações de projetos sob medida (fragrâncias e brindes corporativos), com formulário público, notificações por email e gerenciamento administrativo.

## 1. Banco de Dados e Segurança (Supabase)

- Criar tabela `public.custom_project_requests` para armazenar as solicitações.
- Configurar Row Level Security (RLS):
    - Permissão de `INSERT` para qualquer visitante (`anon`).
    - Permissão de gerenciamento total (`SELECT`, `UPDATE`, `DELETE`) restrita a administradores.
- Adicionar política de acesso baseada no papel do usuário (`public.has_role(auth.uid(), 'admin')`).

## 2. Frontend Público

- **Página de Projetos Personalizados**: Criar `src/routes/projetos-personalizados.tsx`.
    - Hero section com apresentação visual (verde/creme).
    - Formulário completo com validações (Zod) e máscaras (WhatsApp, CNPJ).
    - Integração com Supabase para salvamento e disparo de notificação.
    - Tela de sucesso com feedback amigável.
- **Navegação**:
    - Adicionar item "Sob Medida" no `BodyogaHeader.tsx`.
- **Home**:
    - Adicionar uma seção CTA (Call to Action) em `BodyogaLanding.tsx` entre o banner e os produtos.

## 3. Notificações (Edge Function)

- Atualizar `supabase/functions/send-notification/index.ts`:
    - Adicionar o tipo `project_request`.
    - Configurar template de email HTML para Elisa com os dados do solicitante e link direto para o admin.

## 4. Área Administrativa

- **Página de Solicitações**: Criar `src/routes/admin/solicitacoes.tsx`.
    - Interface de lista/cards com filtros por status.
    - Visualização expandida de detalhes.
    - Sistema de notas internas e alteração de status.
    - Botão de atalho para contato via WhatsApp.
- **Menu Admin**:
    - Inserir "Solicitações" no `AdminNav.tsx` com badge de contagem para novas mensagens.

## Detalhes Técnicos

- **Tabela**: `id`, `name`, `email`, `whatsapp`, `company`, `cnpj`, `project_type`, `quantity_estimate`, `deadline`, `brief`, `budget_range`, `status`, `admin_notes`, `created_at`.
- **Status**: `nova` (default), `em_andamento`, `respondida`, `fechada`.
- **Estilização**: Uso rigoroso das cores `--bodyoga-green` (#3B4F30) e `--bodyoga-cream` (#F7F0E5).
