# Plano: Painel de Admin SaaS Dedicado

Implementar uma interface administrativa moderna e dedicada (SaaS style) para a BODYOGA, removendo a moldura da loja (header/footer público) das rotas `/admin/*`.

## Alterações

### 1. Componentes e Estrutura
- Criar `src/components/admin/AdminLayout.tsx`:
  - Sidebar fixa à esquerda em verde escuro (`#3B4F30`).
  - Navegação agrupada (Operação, Catálogo, Conteúdo, Agenda, Sistema).
  - Topbar com título da página, atalho "Ver site" e botão "Sair".
  - Área de conteúdo com fundo creme/cinza claro e padding generoso.
  - Sidebar responsiva (drawer no mobile).
- Criar `src/routes/admin/_layout.tsx` (Layout Route):
  - Centralizar o `StaffGuard` (ou `AdminGuard`) e o `AdminLayout`.
  - Envolver todas as sub-rotas `/admin/*` automaticamente.

### 2. Refatoração de Rotas (Lote)
- Atualizar as ~47 rotas dentro de `src/routes/admin/`:
  - Remover wrappers `<Layout>`, `<StaffGuard>` e `<AdminGuard>` de cada arquivo.
  - Ajustar o retorno para apenas o conteúdo principal da página.
  - Limpar imports não utilizados.
- Ajustar o editor de página (`site.paginas.$id.tsx`) para se integrar corretamente ao novo layout (full-bleed se necessário).

### 3. Limpeza e Design
- Remover lógica de detecção de admin do `src/components/Layout.tsx` público.
- Padronizar o estilo visual SaaS: cards brancos, bordas suaves (`rounded-2xl`), tipografia `Gotu` nos títulos.

## Detalhes Técnicos
- Utilizar `useRouterState` para destacar o item ativo na sidebar.
- Implementar o drawer mobile usando `vaul` (já presente no projeto).
- Manter o `StaffGuard` para garantir segurança em todas as rotas admin de forma centralizada.
- A navegação continuará usando as rotas do TanStack Router já existentes.
