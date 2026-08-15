# Plano de Implementação - Fase 0: Blocos e Roteamento Dinâmico

Este plano detalha a implementação dos blocos remanescentes no `RenderBlocks.tsx` para garantir que todas as páginas criadas no editor visual sejam renderizadas com fidelidade, além de configurar o roteamento dinâmico na raiz do site.

## Parte A - Implementação de Blocos no `RenderBlocks.tsx`

Implementar os seguintes blocos utilizando a identidade visual da BODYOGA (Verde `#3B4F30` / Creme `#F7F0E5`):

1.  **image-text**: Seção de duas colunas (Imagem e Texto/Botão) com inversão de lado.
2.  **categories**: Grade de categorias clicáveis.
3.  **gallery**: Grade de imagens com bordas arredondadas.
4.  **image**: Imagem única centralizada com legenda.
5.  **video**: Player de vídeo (YouTube/Vimeo/MP4) com controle de proporção.
6.  **faq**: Acordeão de perguntas e respostas usando o componente Radix UI existente.
7.  **testimonials**: Carrossel ou grade de depoimentos com fotos circulares.
8.  **stats**: Faixa de indicadores com números grandes.
9.  **benefits**: Grade de diferenciais com ícones da Lucide.
10. **timeline**: Linha do tempo vertical histórica.
11. **author**: Bloco de biografia com foto e assinatura.
12. **courses**: Grade de cursos integrada com a listagem real do site.
13. **newsletter**: Formulário de captura de leads.
14. **custom-projects**: Chamada para projetos personalizados.
15. **yoga-classes**: Chamada para agendamento de aulas.
16. **columns**: Layout de colunas livres (2 a 4).
17. **shortcut-banner**: Banner compacto com links rápidos.

## Parte B - Roteamento Dinâmico na Raiz

1.  **Criar `src/routes/$slug.tsx`**:
    *   Implementar roteamento catch-all de primeiro nível.
    *   Priorizar rotas estáticas (o TanStack Router faz isso automaticamente).
    *   Carregar dados da tabela `pages` via slug.
    *   Renderizar usando `BodyogaHeader`, `RenderBlocks` e `Footer`.
2.  **SEO Dinâmico**: Configurar meta tags (título, descrição, OG) baseadas nos campos de SEO da página.
3.  **Compatibilidade**: Manter `/p/$slug` funcionando para evitar links quebrados.

## Detalhes Técnicos

*   **Arquivo Principal**: `src/components/admin/RenderBlocks.tsx`.
*   **Novas Rotas**: `src/routes/$slug.tsx`.
*   **Identidade Visual**: Uso rigoroso das variáveis CSS `--bodyoga-green` e `--bodyoga-cream`.
*   **Componentes Reutilizados**: `BodyogaProductCard`, `Accordion`, `HomeInstagram`, `HomeBlog`.

## Validação

*   Verificar renderização de todos os novos tipos de blocos no preview do editor.
*   Testar navegação direta para slugs criados (ex: `/sobre-nos`).
*   Confirmar que rotas fixas (ex: `/loja`) permanecem intocadas.
*   Validar responsividade em dispositivos móveis.
