## Objetivo
Centralizar tudo relacionado a emails (envio, layout, textos, inscritos) em **/admin/broadcast** e deixar **/admin/configuracoes/emails** apenas com a integração Resend.

## /admin/broadcast — nova estrutura com abas

```text
[ Campanhas ] [ Templates ] [ Layout & Branding ] [ Automáticos ] [ Inscritos ]
```

**1. Campanhas** — o que já existe hoje (lista, criar, testar, enviar).

**2. Templates** — biblioteca de templates reutilizáveis com editor visual drag-and-drop (Unlayer / `react-email-editor`, o mesmo motor que o Mailchimp/Stripo usam). Permite arrastar blocos (texto, imagem, botão, colunas, divisor, HTML), preview desktop/mobile, salvar como template e usar em uma campanha. Exporta HTML pronto p/ Resend.

**3. Layout & Branding** — logo, cor da marca, assinatura, rodapé. É o que hoje vive em `/configuracoes/emails` (categoria `emails` em `app_settings`). Migra para cá com a mesma UI, sem mudar dados.

**4. Automáticos** — textos e assuntos dos emails transacionais editáveis (cupom de boas-vindas, confirmação de pedido, agendamento, etc). Cada um com editor visual do mesmo builder, salvando o HTML/assunto em `app_settings`.

**5. Inscritos** — lista da newsletter com filtros, busca, exportar CSV, desinscrever/reativar. Hoje só existe endpoint de subscribe; falta a gestão.

## /admin/configuracoes/emails — só Resend

Vira uma página enxuta de status/integração:
- Status da API key (`RESEND_API_KEY`) — presente ✓ / faltando ✗
- Domínio verificado (`bodyogaoficial.com.br`) — link p/ Resend dashboard
- Remetente padrão (`from`) — editável
- Botão "Enviar email de teste" para validar conexão
- Link "Abrir Resend ↗"

Nada mais de branding/textos aqui.

## Banco de dados
Nova tabela `email_templates`:
- `name`, `subject`, `design_json` (estado do editor Unlayer), `html` (compilado), `is_system` (bool p/ marcar templates automáticos protegidos), `updated_at`.

Broadcasts ganham FK opcional `template_id` para permitir "duplicar template → campanha".

RLS: só admin lê/escreve.

## Detalhes técnicos
- Adicionar dependência `react-email-editor` (`bun add react-email-editor`).
- Componente `<EmailBuilder value onChange onExport />` reutilizável nas 3 abas (Templates, Automáticos, criação de Campanha).
- `send-broadcast` e `send-coupon-email` continuam funcionando — passam a ler `html`/assunto de `app_settings` quando o admin editar via builder.
- `/configuracoes/emails` mantém a rota; conteúdo é substituído. O link "Emails" nas Configurações passa a rotular "Integração Resend"; um link novo "Emails" aparece em Broadcast.
- Redirecionar navegação antiga de "Emails" na sidebar de Configurações para o novo hub em `/admin/broadcast?tab=layout` para não quebrar bookmarks.

## Arquivos afetados
- `src/routes/admin/broadcast.tsx` — refatorar em abas.
- `src/routes/admin/configuracoes/emails.tsx` — reduzir a status Resend.
- `src/components/admin/EmailBuilder.tsx` — novo (wrapper Unlayer).
- `src/components/admin/broadcast/*` — TemplatesTab, LayoutTab, AutomaticosTab, InscritosTab, CampanhasTab.
- `src/lib/email-templates.ts`, `src/lib/subscribers.ts` — helpers.
- Migração SQL: `email_templates` + FK em `broadcasts`.

## Fora do escopo
- Trocar o motor de envio (continua Resend).
- Fluxos de automação por gatilho (drip campaigns).