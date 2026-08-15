# Plano: Novo Gerenciador de Páginas "Block Builder"

Redesenhar o gerenciador de páginas do admin para um modelo visual de blocos (paleta à esquerda, preview ao centro, propriedades à direita), adaptado ao universo BODYOGA.

## 1. Banco de Dados e API
- **Migrations SQL**: Estender a tabela `pages` para incluir `type` ('site'|'landing'), `is_home`, `in_menu`, `menu_order` e garantir unicidade de `is_home`.
- **src/lib/pages.ts**: Atualizar tipos e funções (`SitePage`, `listPages`, `updatePage`) para suportar os novos campos.
- **src/lib/page-blocks.ts**: Expandir `BlockType` e `BLOCK_LIBRARY` com novos blocos específicos (Instagram, Cursos, Projetos, etc.).

## 2. Editor Visual (Admin)
- **src/routes/admin/website.tsx**: Nova tela de listagem com abas (Páginas, Landing Pages, Blog, Avisos) e tabela com Status, estrela de Home, e toggle de Menu.
- **src/routes/admin/site.paginas.$id.tsx**: Refatorar para o layout de 3 colunas:
  - **Toolbar**: Título, Status, Preview, Salvar.
  - **Esquerda**: Paleta de blocos com "clique para adicionar".
  - **Centro**: Preview real da página (usando `PageBlocksRenderer`) com hover controls (mover, duplicar, excluir).
  - **Direita**: Painel dinâmico de propriedades baseado no schema do bloco selecionado.

## 3. Renderização e Navegação
- **src/routes/p.$slug.tsx**: Manter como catch-all para páginas, usando `PageBlocksRenderer`.
- **src/routes/index.tsx**: Adicionar lógica para carregar a página marcada como `is_home`. Fallback para a `BodyogaLanding` atual se nenhuma estiver marcada.
- **src/lib/nav-config.ts**: Ajustar para que o menu do site possa incluir automaticamente as páginas marcadas com `in_menu`.

## 4. Conjunto de Blocos BODYOGA
- **Hero**: Banner com suporte a vídeo e overlay.
- **Produtos em Destaque**: Grid consumindo dados de `src/lib/shop.ts`.
- **Instagram**: Feed usando `HomeInstagram` (Behold).
- **Depoimentos / FAQ / Newsletter**: Reaproveitar componentes existentes.
- **Blocos Novos**: Estatísticas, Linha do Tempo, Autoria (Elisa), Cursos, Aulas.

## Detalhes Técnicos
- Utilizar `dnd-kit` para movimentação de blocos.
- Manter compatibilidade com páginas existentes via `markdownToBlocks`.
- RLS em Supabase garantindo que apenas admins editem e público leia apenas `active`.
