# Plan: Admin Route Consolidation and Blog Refactor

Finalizing the organization of the admin panel to ensure all routes are consistent, working, and follow the user's requirements.

## Proposed Changes

### 1. Route Organization
- Ensure `/admin/website` is the central hub for site management (Menu, Cores, WhatsApp, SEO, Slides).
- Ensure `/admin/blog` is the dedicated section for blog content.
- Standardize on dot-notation filenames (`admin.blog.index.tsx` etc.) to avoid directory/file conflicts in TanStack Router.

### 2. Blog Management
- **List View**: `/admin/blog` will show all posts with status and "Edit" buttons.
- **Editor View**: `/admin/blog/$id` will provide a full Markdown editor with title, slug, excerpt, and cover image management.
- **Direct Access**: Clicking "Blog" in the admin menu or dashboard will go straight to the list view.

### 3. Cleanup
- Remove any leftover `/admin/posts` or redundant directory structures that might cause routing ambiguity.
- Verify all "Back" buttons in the admin panel point to the correct parent views.

## Technical Details
- Using `src/routes/admin/blog.tsx` as a layout/parent route (with `<Outlet />`).
- Using `src/routes/admin/blog.index.tsx` for the list.
- Using `src/routes/admin/blog.$id.tsx` for the editor.
- Using `src/routes/admin/website.index.tsx` for the site settings hub.
- All admin views will inherit the `AdminLayout` and `AdminGuard` from the root `/admin` route.
