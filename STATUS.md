# MW Transport Service — Projektstatus (Phase 2)

_Stand: 19. Juni 2026 · Branch `master` · Next.js 16.2.7 + Supabase (Multi-Tenant, RLS)_

Dieses Dokument fasst zusammen, **was das System heute kann**, **was noch auf Mock-Daten läuft**
und **was zum vollständigen Betrieb fehlt**. Es ist die Arbeitsgrundlage für die Umstellung
„Mock → echte Daten (Props/Server Actions)".

---

## 1. Architektur (steht)

| Baustein | Status | Notiz |
|---|---|---|
| Next.js App Router, Route Groups `(dashboard)` / `(driver)` | ✅ | Saubere Trennung Staff ↔ Fahrer |
| RBAC über `proxy.ts` (Next 16) | ✅ | Rolle aus JWT `app_metadata.role`, DB-Fallback |
| Supabase SSR-Client + RLS | ✅ | `server.ts`, `client.ts`, `admin.ts` (Service-Role) |
| Multi-Tenant (`tenant_id` überall) | ✅ | Isolation per RLS |
| Auth: Login / Logout / Passwort setzen | ✅ | `auth-actions`, `avatar-menu`, `set-password` |
| Einladungen: E-Mail + Einmal-Link | ✅ | `user-actions` (E-Mail), `invite-token-actions` (`/join/<token>`) |
| Custom Access Token Hook (Rolle ins JWT) | ⚠️ | SQL vorhanden — **in Supabase aktivieren + neu einloggen** |

---

## 2. Datenbank (Supabase) — Brücken gebaut

| Tabelle | Status | Notiz |
|---|---|---|
| `tenants`, `memberships` | ✅ | Rollen: owner/admin/dispatcher/accounting/driver |
| `customers` | ✅ | CRUD verdrahtet |
| `orders` | ✅ | 64 Aufträge, CRUD + Zuweisung verdrahtet |
| `drivers` | ✅ | **Backfill: 2 → 23** (alle in `orders` referenzierten Fahrer) |
| `orders → drivers` FK | ✅ | `orders_driver_fk` (validiert), keine Waisen |
| `drivers.role` | ✅ | Soll-Rolle vor Login; **F-2016 = dispatcher** |
| `driver_availabilities` | ✅ | Tabelle + RLS (`driver_availabilities.sql`) |
| `invite_tokens` | ✅ | Tabelle + RLS (`invite_tokens.sql`) |
| **`time_stamps`** | ❌ | Phase 3 — Stempeluhr persistiert noch nicht |
| **`order_documents`** | ❌ | Phase 3 — Beleg-Upload persistiert noch nicht |
| **Storage-Bucket (Belege/Logos)** | ❌ | Noch kein Bucket + Policies |

**Offene RLS-Policies:** Staff-SELECT auf `drivers`/`orders` prüfen (damit Disponenten die
echte Fahrerliste laden können); `orders_select_own_driver` + `drivers_select_self` aus
`driver_orders_rls.sql` ausführen.

---

## 3. Disponenten-Portal `(dashboard)` — Daten-Status

| Modul | Daten | Status |
|---|---|---|
| **Aufträge** (`orders`) | Supabase | ✅ Voll: laden, anlegen, Status, Zuweisen, Bulk, Import/Export (XLSX/CSV/PDF) |
| ↳ Fahrer-Auswahl im Zuweisen-Dialog | **Mock** | ⚠️ `AssignDriver` nutzt noch `MWDATA.drivers` statt echter `drivers` |
| **Kunden** (`customers`) | Supabase | ✅ Server Actions vorhanden (`customer-actions`) — Wiring der UI verifizieren |
| **Fahrerverwaltung** (`drivers`) | Supabase | ✅ Loader gebaut — **3-Zeilen-Patch in `drivers.tsx` nötig** (Props annehmen) |
| **Übersicht / Dashboard** | **Mock** | ❌ KPIs, Charts aus `MWDATA` |
| **Schichtplanung** | **Mock** | ❌ Nur lokaler State, keine Persistenz |
| **Kalender / Verfügbarkeit (Dispo)** | **Mock** | ❌ Soll später `driver_availabilities` lesen |
| **Dokumente** | **Mock** | ❌ |
| **Einstellungen** | teils | ⚠️ Branding = Zustand-Store (lokal); Rollen/Sicherheit/Mandant statisch |
| ↳ **Nutzerverwaltung / Invite** | — | 🐞 `UsersSettings` wird importiert, aber **nicht gerendert** (kein „Nutzer"-Tab); Importpfad `user-settings` ≠ Datei `users-settings.tsx` |
| **Preisliste / Map / Parking / Information** | **Mock** | ❌ Platzhalter / statische Tabellen |
| **Fahrer-App-Vorschau** (`driver-app`) | **Mock** | ❌ Demo-Daten im Phone-Frame |

---

## 4. Fahrer-Portal `(driver)` — Daten-Status

| View | Daten | Status |
|---|---|---|
| **Dashboard** | Supabase | ✅ Pro Fahrer (eigener Name, eigene Aufträge/Verfügbarkeit), Leerzustände |
| **Aufträge** | Supabase | ✅ Lesen pro Fahrer (`orders.driver_id = display_id`) |
| ↳ Annehmen/Ablehnen, Status, Beleg-Upload | **lokal** | ⚠️ Optimistisch (nicht in DB persistiert) |
| **Verfügbarkeit** | Supabase | ✅ `driver_availabilities` (lesen/schreiben, RLS, 48h/Do/WE-Sperre) |
| **Stempeluhr** | **lokal** | ❌ Zustand-Store, keine `time_stamps`-Persistenz; Geolocation erfasst, nicht gespeichert |

---

## 5. Was zum „vollständig funktionsfähig" noch fehlt (priorisiert)

### A. Sofort (Blocker / kleine Fixes)
1. **Build-Fix `types.ts`** — `Relationships: []` + fehlende Tabellen (`drivers`, `driver_availabilities`, `invite_tokens`) ergänzt → behebt `never[]`-Typfehler. ✅ geliefert
2. **`drivers.tsx`** 3-Zeilen-Patch (Props `initialDrivers`/`initialKpi`).
3. **Settings → Nutzer-Tab** wirklich einhängen: Importpfad korrigieren (`users-settings`) **und** `<UsersSettings />` als eigenen Tab rendern.
4. **RLS-Policies** aus `driver_orders_rls.sql` ausführen; Staff-Lesepolicies prüfen.
5. **Access-Token-Hook** in Supabase aktivieren (Rolle deterministisch im JWT).

### B. Mock → echt (mittel)
6. **Zuweisen-Dialog** (`AssignDriver`) auf echte `drivers` umstellen (statt `MWDATA`).
7. **Kunden-UI** an `customer-actions` anbinden (falls noch nicht).
8. **Dashboard/Übersicht-KPIs** aus echten `orders`/`drivers` aggregieren.
9. **Schichtplanung** an `driver_availabilities` koppeln (Dispo-Schreibrechte via `has_staff_role`).
10. **Profil-Seite**: echte Session/Rolle/Aktivität statt hartcodierter Mock-Werte.

### C. Phase 3 (neue Tabellen + Storage)
11. **`time_stamps`**: Schema + RLS, Stempeluhr-Persistenz (inkl. Geo).
12. **`order_documents`** + **Storage-Bucket**: Beleg-Upload echt speichern (tenant-sicherer Pfad).
13. **Auftrags-Statuswechsel durch Fahrer** persistieren (`orders_update_own_driver`-Policy liegt auskommentiert bereit).
14. **Dokumente-Modul** (Dispo) an `order_documents` anbinden.
15. **Branding/Mandant** in `tenants` persistieren (statt nur Zustand-Store).

---

## 6. Deployment (Vercel)
- **ENV nötig:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL` (= Vercel-URL).
- **Supabase Auth → URL Configuration:** Vercel-Domain als Redirect-/Site-URL eintragen
  (sonst brechen Invite-/Set-Password-Links).
- ESLint-`peer`-Warnungen sind unkritisch (kein Build-Stopper).
