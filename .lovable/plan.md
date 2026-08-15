# Plan - Visual Block Builder and Site Management Unification

Redesign the page management experience to be highly visual and intuitive for Elisa, using a 3-column "Block Builder" model and unifying all site-related configurations under a single tabbed interface at `/admin/website`.

## User Improvements
- **Visual Builder**: Edit pages by clicking blocks, seeing changes live, and adjusting properties in a side panel.
- **Unified Hub**: Manage Pages, Slides, Colors, Menus, Notices, SEO, and WhatsApp in one place.
- **Improved SEO**: Global SEO settings (fallbacks) and per-page control.
- **WhatsApp Control**: Easy toggle and message configuration for the site-wide button.

## Technical Tasks

### 1. Database and Backend
- [x] Create `app_settings` table for global SEO and WhatsApp configs.
- [x] Seed initial default settings.
- [ ] Update `src/lib/settings.ts` to support fetching/updating JSON settings.
- [ ] Add `seo_title`, `seo_description`, `og_image` to the page editor.

### 2. Admin UI Unification (`/admin/website`)
- [ ] Refactor `src/routes/admin/website.tsx` to include the following tabs:
    - **Páginas do site**: The new visual table and "Nova Página" button.
    - **Slides**: Integrate `src/routes/admin/bodyoga-slides/index.tsx`.
    - **Cores**: Integrate `src/routes/admin/site.cores.tsx`.
    - **Menus**: Integrate `src/routes/admin/site.menu.tsx`.
    - **Avisos**: Integrate notices management.
    - **SEO**: New UI to manage global SEO settings.
    - **Botão do WhatsApp**: Integrate `src/routes/admin/site.whatsapp.tsx`.

### 3. Visual Page Editor
- [ ] Enhance `src/components/admin/PageBuilderUX.tsx`:
    - Improve block selection UI in the left palette.
    - Ensure live preview accurately reflects all 24+ block types.
    - Refine the property panel with dynamic inputs based on block schema.
- [ ] Update block registry with all requested BODYOGA blocks (Timeline, Statistics, Author, etc.).

### 4. Public Site Integration
- [ ] Update `src/routes/__root.tsx` to inject SEO meta tags and Google Analytics/GTM scripts from `app_settings`.
- [ ] Update `src/components/WhatsAppButton.tsx` to consume dynamic settings from `app_settings`.
- [ ] Ensure catch-all route `/p/$slug` and Home (`/`) correctly resolve dynamic pages with SEO.

## Technical Details
- **Architecture**: Tabbed administration interface using Radix/Shadcn Tabs.
- **State Management**: React Query for data fetching and invalidation.
- **Builder Logic**: `dnd-kit` for reordering blocks (already partially implemented).
- **SEO**: TanStack Router `head` functions combined with dynamic data.
