-- ============================================================
-- MW Transport Service — Phase 3: driver_availabilities
-- Multi-tenant + RLS. Fahrer pflegen ihre eigenen Zeilen, Disponenten/
-- Verwaltung lesen & schreiben alle Zeilen ihres Tenants.
-- ============================================================

-- ---------- Helper: hat der aktuelle User eine Staff-Rolle im Tenant? ----------
create or replace function public.has_staff_role(p_tenant uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = p_tenant
      and m.role in ('owner', 'admin', 'dispatcher', 'accounting')
  );
$$;

-- ---------- Tabelle ----------
create table if not exists public.driver_availabilities (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  -- Der angemeldete Fahrer (Auth-Identität) — Basis der Fahrer-RLS.
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- Denormalisierte Business-ID (entspricht orders.driver_id); optional.
  driver_id   text,
  date        date not null,
  status      text not null default 'abwesend'
              check (status in ('anwesend', 'abwesend', 'verplant')),
  start_time  text,            -- "HH:mm"
  end_time    text,
  is_full_day boolean not null default false,
  shift_code  text,            -- F/T/S/N wenn verplant
  order_ref   bigint,          -- orders.order_no wenn verplant
  updated_at  timestamptz not null default now(),
  -- Eine Zeile pro Fahrer & Tag.
  unique (tenant_id, user_id, date)
);
create index if not exists driver_avail_tenant_idx on public.driver_availabilities (tenant_id);
create index if not exists driver_avail_user_idx   on public.driver_availabilities (user_id, date);

-- ---------- Row Level Security ----------
alter table public.driver_availabilities enable row level security;

-- SELECT: eigene Zeilen ODER (als Staff) alle Zeilen des Tenants.
create policy "avail_select" on public.driver_availabilities
  for select using (
    tenant_id in (select public.current_tenant_ids())
    and (user_id = auth.uid() or public.has_staff_role(tenant_id))
  );

-- INSERT: Fahrer nur eigene Zeilen; Staff beliebige im Tenant.
create policy "avail_insert" on public.driver_availabilities
  for insert with check (
    tenant_id in (select public.current_tenant_ids())
    and (user_id = auth.uid() or public.has_staff_role(tenant_id))
  );

-- UPDATE: dito. Verplante Tage (status = 'verplant') darf ein Fahrer NICHT
-- überschreiben — nur Staff. Fahrer dürfen nur ihre nicht-verplanten Zeilen ändern.
create policy "avail_update" on public.driver_availabilities
  for update using (
    tenant_id in (select public.current_tenant_ids())
    and (
      public.has_staff_role(tenant_id)
      or (user_id = auth.uid() and status <> 'verplant')
    )
  ) with check (
    tenant_id in (select public.current_tenant_ids())
    and (user_id = auth.uid() or public.has_staff_role(tenant_id))
  );

-- DELETE: eigene nicht-verplante Zeilen oder Staff.
create policy "avail_delete" on public.driver_availabilities
  for delete using (
    tenant_id in (select public.current_tenant_ids())
    and (
      public.has_staff_role(tenant_id)
      or (user_id = auth.uid() and status <> 'verplant')
    )
  );

-- updated_at automatisch pflegen.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists trg_driver_avail_touch on public.driver_availabilities;
create trigger trg_driver_avail_touch
  before update on public.driver_availabilities
  for each row execute function public.touch_updated_at();
