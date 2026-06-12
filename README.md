# MWTransport — Next.js 14 App Router

Refactor of the static React prototype (`/app/*.jsx` injected into a single
HTML file) into a real **Next.js 14 App Router** project with file-system
routing and a shared sidebar layout.

> Built per `AGENT_GUIDE.md`: TypeScript, Tailwind v4, Zustand for
> tenant config, lucide-react icons, German UI strings, white-label via
> `--color-primary`. Supabase/auth wiring is stubbed (scaffolding for later phases).

## Run

```bash
cd mwtransport
npm install
npm run dev      # http://localhost:3000  → redirects to /overview
npm run typecheck
```

## Routing map

The old `switch (route)` in `app.jsx` is gone. Every nav item is now a real
URL segment under `src/app/(dashboard)/`:

| Sidebar label   | Route            | Page file                                   | Legacy module           |
|-----------------|------------------|---------------------------------------------|-------------------------|
| Übersicht       | `/overview`      | `(dashboard)/overview/page.tsx`             | `dashboard.jsx`         |
| Aufträge        | `/orders`        | `(dashboard)/orders/page.tsx`               | `orders.jsx`            |
| Karte           | `/map`           | `(dashboard)/map/page.tsx`                  | `misc.jsx → MapView`    |
| Fahrer-App      | `/driver-app`    | `(dashboard)/driver-app/page.tsx`           | `driverapp.jsx`         |
| Kunden          | `/clients`       | `(dashboard)/clients/page.tsx`              | `customers.jsx`         |
| Fahrer          | `/drivers`       | `(dashboard)/drivers/page.tsx`              | `drivers.jsx`           |
| ↳ Preisliste    | `/drivers/pricing` | `(dashboard)/drivers/pricing/page.tsx`    | `settings.jsx → Pricing`|
| Stellplätze     | `/parking`       | `(dashboard)/parking/page.tsx`              | `misc.jsx → Parking`    |
| Kalender        | `/calendar`      | `(dashboard)/calendar/page.tsx`             | `misc.jsx → CalendarView`|
| Schichtplanung  | `/shiftplanner`  | `(dashboard)/shiftplanner/page.tsx`         | `shifts.jsx`            |
| Dokumente       | `/documents`     | `(dashboard)/documents/page.tsx`            | `documents2.jsx`        |
| Information      | `/information`   | `(dashboard)/information/page.tsx`          | `misc.jsx → Information`|
| Einstellungen   | `/settings`      | `(dashboard)/settings/page.tsx`             | `settings.jsx`          |
| _User block_    | `/profile`       | `(dashboard)/profile/page.tsx`              | _new_                   |

`/` redirects to `/overview`.

## Structure

```
src/
├─ app/
│  ├─ layout.tsx                 Root: fonts (Hanken Grotesk + IBM Plex Mono), ThemeProvider
│  ├─ page.tsx                   redirect("/overview")
│  ├─ globals.css                Design system (ported from theme.css) + Tailwind v4
│  └─ (dashboard)/               Route group — shares the shell, no URL segment
│     ├─ layout.tsx              ← common sidebar layout (Sidebar + Topbar + ToastProvider + <main>)
│     ├─ overview/page.tsx       → <Dashboard />        (dashboard.jsx)
│     ├─ orders/page.tsx         → <Orders />           (orders.jsx)
│     ├─ … (one folder per route, each rendering its real module)
│     └─ profile/page.tsx
├─ components/
│  ├─ layout/sidebar.tsx         Link + usePathname active state; user block → /profile
│  ├─ layout/topbar.tsx          Title from route, density + dark toggles
│  ├─ layout/page-header.tsx
│  ├─ providers/theme-provider.tsx
│  ├─ icon.tsx                   Icon set (ported from icons.jsx)
│  ├─ ui.tsx                     Shared UI kit — Avatar, Plate, Modal, Menu, Donut,
│  │                            Sparkline, Toast, Field … (ported from ui.jsx)
│  └─ modules/                   The real feature modules (ported from app/*.jsx)
│     ├─ dashboard.tsx  orders.tsx  customers.tsx  drivers.tsx
│     ├─ documents.tsx  driverapp.tsx  settings.tsx (Settings + Pricing)
│     ├─ misc.tsx       (MapView · Parking · CalendarView · Information)
│     └─ shiftplanner.tsx (Dienstplan · Urlaubsplaner · Personal · Statistik)
└─ lib/
   ├─ nav.ts                     Single source of truth: labels → routes → icons
   ├─ data.ts                    Typed demo data (ported from data.js + data-shifts.js)
   ├─ use-app-nav.ts             Bridges modules' onNav(key,params) → router.push + query
   └─ store/
      ├─ use-tenant-store.ts     Zustand: brand / dark / density / label (persisted)
      └─ use-ui-store.ts         Zustand: sidebar collapsed / mobileOpen
```

## Module porting — done

Every legacy `app/*.jsx` module is now a typed client component under
`src/components/modules/`, and every route renders its real module — **no more
placeholders**. The ports are behaviour-preserving (1:1):

- `window.MWDATA` → `import { MWDATA } from "@/lib/data"`
- the old single-page `onNav(key, params)` → `useAppNav()` (maps to `router.push`
  with a query string); modules that deep-linked via an `initial` prop now read
  `useModuleInitial()` from the URL (wrapped in `<Suspense>` on those pages).
- `Settings` white-label controls bind directly to the Zustand tenant store.
- `localStorage` reads moved out of render into `useEffect` (client components
  server-render in Next, so render must stay SSR-safe).

`../MW Transport — App Router.html` remains as a runnable behavioural reference
of the same modules.

## How active state works

No component tracks "the current page". The Sidebar reads `usePathname()` and an
item is active when the path equals its `href` **or** is nested under it — so
`/drivers/pricing` keeps **Fahrer** highlighted. This is the App-Router-native
replacement for the old `route === it.k` checks.

## White-labeling (AGENT_GUIDE Rule 2)

The brand colour is never hardcoded. `ThemeProvider` writes `--brand-h/s/l` onto
`<html>` at runtime; every component styles from `var(--color-primary)` &
friends. In production, replace the Zustand read with the tenant config fetched
in `app/layout.tsx` (Supabase, RLS-scoped) and inject `--brand-*` server-side to
avoid a flash.

## TypeScript strictness

During the port `strict` is relaxed in `tsconfig.json` so the faithfully-ported
modules compile without re-typing every callback. `next dev` runs regardless; the
data layer and props are typed for editor DX. Re-enable `strict` incrementally
per module as a follow-up.

## Next steps (stubbed)

- `proxy.ts` — Supabase Auth + TOTP 2FA gate in front of `(dashboard)`.
- `lib/supabase/{client,server}.ts` — typed clients; all queries scoped by `tenant_id` via RLS.
- Server Actions + Zod schemas for the CRUD forms.
- `getNavBadges()` in `(dashboard)/layout.tsx` → real tenant-scoped count.
