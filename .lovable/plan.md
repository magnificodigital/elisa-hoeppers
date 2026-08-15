# Plano de Refatoração do Site Bodyoga (Visual Block Builder)

O objetivo é finalizar a transição para um sistema de edição visual baseado em blocos, garantindo que as configurações globais (SEO, WhatsApp, Cores) e o novo editor de páginas estejam plenamente integrados e funcionais.

## Alterações Propostas

### 1. Infraestrutura e API
- **Banco de Dados**: Criar tabela `public.app_settings` (se ainda não existir completamente) com suporte a categorias (seo, whatsapp, aparencia) e RPC `get_public_setting` para leitura segura pelo cliente.
- **Configurações**: Garantir que `src/lib/settings.ts` utilize o RPC para evitar erros de permissão em loaders e SSR.

### 2. Gestão do Site (Admin)
- **Hub Administrativo**: Refatorar `src/routes/admin/website.tsx` para centralizar:
    - **Páginas**: Listagem e criação rápida.
    - **Slides**: Edição do carrossel da home.
    - **Cores**: Gestão dinâmica de temas.
    - **Menu**: Configuração da navegação global.
    - **SEO**: Metadados globais e scripts de analytics.
    - **WhatsApp**: Configuração do botão flutuante.
- **Editor de Páginas**: Aprimorar o builder lateral em `src/components/admin/PageBuilderUX.tsx` para incluir edição de SEO por página.

### 3. Renderização e Frontend
- **Root Route**: Injetar scripts de Plausible/GTM e metadados SEO vindos das `app_settings` dinamicamente no `src/routes/__root.tsx`.
- **Botão WhatsApp**: Ajustar `src/components/WhatsAppButton.tsx` para respeitar as configurações de posição, mensagem e visibilidade geridas no admin.
- **Renderização de Blocos**: Atualizar `src/components/admin/RenderBlocks.tsx` com o componente `BodyogaProductCard` local e suporte a novos blocos (Produtos, Instagram, Hero, CTA).
- **Fallback da Home**: Garantir que `src/routes/index.tsx` carregue prioritariamente a página marcada como `is_home` via Block Builder.

### 4. Correções Visuais e UX
- Corrigir tipagens e importações pendentes identificadas (ex: `useCart`).
- Garantir que a paleta de cores aplicada via Admin reflita em todo o site através de variáveis CSS.

## Detalhes Técnicos
- Uso de `createServerFn` para operações privilegiadas.
- Migrações SQL com `GRANT` explícitos para garantir acesso da API Supabase.
- Implementação de Zod para validação de esquemas de blocos JSONB.
