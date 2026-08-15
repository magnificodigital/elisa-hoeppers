# Plan — Avisos em Lightbox (Popups) com Captação de Leads

Implementação de funcionalidade de popups/avisos no site com formulário opcional de captação de leads, incluindo painel administrativo para gestão e notificações por email.

## User Review Required

> [!IMPORTANT]
> A migração de banco de dados cria duas novas tabelas: `site_notices` e `site_notice_leads`.

- Confirmar se o tempo de delay padrão (3s) e a frequência padrão (uma vez por sessão) atendem ao uso inicial.
- Os leads serão notificados via função `send-notification` (já existente no projeto).

## Proposed Changes

### Database & Security
- **Migration**: Criar tabelas `site_notices` (avisos) e `site_notice_leads` (leads capturados).
- **RLS**: 
  - Visitantes: apenas SELECT em avisos ativos/agendados e INSERT em leads.
  - Admin: acesso total (gerenciamento).

### Admin Panel (`/admin/website/avisos`)
- **Nav**: Adicionar "Avisos" ao grupo "CONTEÚDO" em `admin-nav.ts`.
- **Listagem**: Tabela com avisos, status, contagem de leads e ações (editar, duplicar, leads).
- **Editor**: Form completo com upload de imagem, campos de conteúdo, regras de exibição (páginas, delay, frequência, agendamento) e configuração do formulário de captura.
- **Leads**: Visualização dos dados capturados por aviso com exportação para CSV e link direto para WhatsApp.

### Frontend (`SiteNoticePopup.tsx`)
- **Global Component**: Montar no root do site (fora do admin/checkout).
- **Logic**:
  - Busca avisos via Supabase (filtrados pela RLS).
  - Controle de frequência via `localStorage`/`sessionStorage`.
  - Timer de abertura baseado no `delay_seconds`.
  - Renderização elegante em Dialog (shadcn) com suporte a imagem, texto e formulário.
  - Envio de lead + notificação via Edge Function.

### Notifications
- Extender a lógica de `send-notification` para o tipo `notice_lead`.

## Technical Details

- **Tables**:
  - `site_notices`: `id, title, content, image_url, cta_label, cta_href, active, pages, delay_seconds, frequency, start_at, end_at, capture_lead, form_title, fields_name, fields_email, fields_phone, success_message`.
  - `site_notice_leads`: `id, notice_id, notice_title, name, email, phone, page`.
- **Hooks/Lib**:
  - `useSiteNotices`: para buscar e gerenciar estado do popup no frontend.
  - Supabase Edge Function `send-notification` será chamada para alertar sobre novos leads.
