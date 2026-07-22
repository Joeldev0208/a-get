# AGET - Agent Instructions

<!-- BEGIN:nextjs-agent-rules -->
⚠️ **Next.js 16** — This is NOT the Next.js you know. APIs, conventions, and file structure may differ from your training data. Read the guide in `node_modules/next/dist/docs/` before writing code.
<!-- END:nextjs-agent-rules -->

## Dev Commands

```bash
npm run dev          # next dev --webpack (default)
npm run dev:turbo    # next dev --turbopack (faster)
npm run build        # production build
npm run lint         # eslint (flat config, eslint-config-next)
npm run test         # vitest (watch mode)
npm run test:run     # vitest single run
```

No vitest config file exists; uses vitest defaults. No existing tests yet.

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript 5 + Tailwind CSS 4 + Supabase (PostgreSQL + Auth via `@supabase/ssr`)

**Pattern:** All page components are Client Components (`"use client"`). Services in `lib/services/` use the browser Supabase client. No server-side rendering in page components.

**Entry flow:** `app/layout.tsx` (AuthProvider) → `app/(dashboard)/layout.tsx` (Dashboard with Sidebar) → module pages. Auth is via Supabase; middleware/proxy (`proxy.ts`) protects dashboard routes.

## Critical Conventions

### Supabase Clients

- **Browser (Client Components):** `import { supabase } from "@/lib/supabase"` — uses `createBrowserClient`. All services must use this.
- **Server (Middleware only):** `createServerClient` in `lib/supabase/middleware.ts`. Do NOT use server client in services called from Client Components.

### Multiempresa

Every DB row has `empresa_id`. Use `obtenerPerfilActual()` to get the current user's profile (includes `empresa_id`). Pass this to all queries.

### Auth & Profile Auto-creation

`obtenerPerfilActual()` (in `lib/services/empresa.ts`) automatically creates a default empresa + profile for first-time users. No additional onboarding logic needed.

### perfiles_usuario

Has columns: `id`, `user_id`, `empresa_id`, `rol`, `activo`, `nombre`. **NO `email` column** — do not try to insert/select email.

## File Organization

```
app/(dashboard)/[module]/[submodule]/page.tsx   → Page components
components/[module]/                            → Module-specific components
components/ui/                                  → Reusable UI (Modal, FormField, SubmitButton, ConfirmDialog, Loading, ErrorBox, EmptyState, PageHeader)
lib/types/[module].ts                           → TypeScript types
lib/services/[module].ts                        → Supabase service functions
lib/supabase.ts                                 → Browser client singleton
lib/services/supabase-service.ts                → ServiceError class + helpers
```

## UI Component Patterns

Every page must handle: loading (`<Loading />`), error (`<ErrorBox error={e} onRetry={fn} />`), empty (`<EmptyState />`), and data states.

Use existing UI components from `components/ui/` — do not recreate Modal, FormField, SubmitButton, or ConfirmDialog.

Error handling: use `ServiceError` from `lib/services/supabase-service.ts`.

## Styling

Tailwind CSS 4 utility classes. No CSS Modules for new code (only `layout.module.css` exists for sidebar). Icons from `lucide-react`.

## Database Schema

Full schema in `supabase-schema.sql`. Key tables: `empresas`, `perfiles_usuario`, `productos`, `clientes`, `facturas`, `detalles_factura`, `pagos`, `empleados`, `departamentos`, `asistencia`, `sesiones`, `proyectos`, `tareas`, `comentarios`.

Enums: `rol_usuario`, `estado_factura`, `metodo_pago`, `estado_asistencia`, `estado_sesion`, `estado_proyecto`, `prioridad`, `columna_kanban`.

## Notes

- `.env.local` contains Supabase credentials (browser-only `NEXT_PUBLIC_*` vars).
- The `facturacion/` directory under `app/(dashboard)/` is a legacy duplicate — active routes are under `ventas/`.
- `CLAUDE.md` simply references this file.
- Dev server default port: 3000.
