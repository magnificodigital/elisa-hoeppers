## Objetivo
Três frentes de edição no admin: (1) a seção "BODYOGA é a fusão entre yoga…" da home, (2) as cores do site, (3) conteúdo de todas as páginas + criação de páginas novas.

## 1. Seção da home editável

Novo item em **Admin → Site → Home**, com os campos exatos que hoje estão fixos no código:

- Título (aceita quebras de linha e trecho em itálico)
- Parágrafo 1
- Parágrafo 2
- Texto do botão + link do botão
- Imagem (uploader, mesmo componente já usado nos slides)

Salvo em `app_settings` na categoria `home`. A landing passa a ler esses valores, com o texto atual como padrão caso esteja vazio.

## 2. Cores do site

Nova página **Admin → Site → Cores**. Todas as cores do site já são variáveis CSS, então basta sobrescrevê-las:

| Campo | Uso |
|---|---|
| Verde principal | textos, botões, header |
| Verde escuro | hover e títulos |
| Creme (fundo) | fundo geral do site |
| Areia | bordas e divisórias |
| Pêssego | destaques e selos |

Cada campo tem seletor de cor + código hex, prévia ao vivo e botão "Restaurar padrão". Salvo em `app_settings` categoria `aparencia`; aplicado no `__root` injetando as variáveis, então vale para o site inteiro (inclusive checkout, painel e admin).

## 3. Páginas editáveis + novas páginas

Nova tabela `pages`:
- `slug`, `title`, `content_md` (conteúdo), `hero_image`, `seo_title`, `seo_description`, `is_published`, `show_in_menu`, `display_order`

Nova área **Admin → Site → Páginas**:
- Lista de páginas com status publicada/rascunho
- Botão "Nova página" (define endereço, ex.: `/p/faq`)
- Editor de conteúdo com formatação (títulos, negrito, listas, imagens, links) — mesmo editor visual já usado nos emails, adaptado para página
- Campos de SEO por página
- Opção de aparecer no menu do site

As páginas fixas existentes (Sobre, Perfumista, Termos, Privacidade) são importadas para essa tabela na migração, mantendo o texto atual, e passam a ser servidas pelo conteúdo do banco — ou seja, ficam editáveis sem quebrar as URLs atuais.

Páginas novas ficam em `/p/{endereço}` e podem ser adicionadas ao menu.

### Fora do escopo
- Editor visual de arrastar-e-soltar para a home inteira (blocos de produtos, slider, blog seguem geridos nas telas próprias).
- Versionamento/histórico de edições.

## Detalhes técnicos
- Migração: tabela `pages` (RLS: leitura pública só de publicadas, escrita só admin) + chaves em `app_settings` (`home_*`, `theme_*`).
- `src/routes/admin/site.home.tsx`, `site.cores.tsx`, `site.paginas.tsx` + `site.paginas.$id.tsx`.
- `src/routes/p.$slug.tsx` para páginas dinâmicas, com `head()` de SEO vindo do banco.
- `src/lib/pages.ts` e `src/lib/theme.ts`.
- `BodyogaLanding.tsx` passa a consumir os settings da categoria `home`.
- `__root.tsx` injeta as variáveis de cor via `<style>` no head para evitar flash.
