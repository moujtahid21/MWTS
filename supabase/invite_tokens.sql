-- ============================================================
-- MW Transport Service — Einmal-Einladungstoken (Link-Invite)
-- supabase/invite_tokens.sql
-- ------------------------------------------------------------
-- Ergänzt den E-Mail-Invite (Settings) um einen teilbaren Einmal-Link:
-- ein Admin erzeugt einen Token, ein neues Mitglied löst ihn unter
-- /join/<token> ein (Konto + Passwort) und wird dem Tenant zugeordnet.
-- ============================================================

-- Admin/Owner-Check im Tenant (für RLS der Token-Tabelle).
create or replace function public.has_admin_role(p_tenant uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
      and m.tenant_id = p_tenant
      and m.role in ('owner', 'admin')
  );
$$;

create table if not exists public.invite_tokens (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  token       text not null unique,
  role        text not null default 'driver'
              check (role in ('admin', 'dispatcher', 'driver')),
  email       text,                      -- optional vorbelegt
  created_by  uuid references auth.users(id) on delete set null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  used_by     uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists invite_tokens_tenant_idx on public.invite_tokens (tenant_id);
create index if not exists invite_tokens_token_idx  on public.invite_tokens (token);

alter table public.invite_tokens enable row level security;

-- Nur Admins des Tenants sehen / erzeugen / widerrufen Tokens.
-- (Das Einlösen läuft serverseitig über den Service-Role-Client und
--  umgeht RLS — der Redeemer ist noch kein Mitglied.)
create policy "invite_tokens_select" on public.invite_tokens
  for select using (
    tenant_id in (select public.current_tenant_ids()) and public.has_admin_role(tenant_id)
  );
create policy "invite_tokens_insert" on public.invite_tokens
  for insert with check (
    tenant_id in (select public.current_tenant_ids()) and public.has_admin_role(tenant_id)
  );
create policy "invite_tokens_delete" on public.invite_tokens
  for delete using (
    tenant_id in (select public.current_tenant_ids()) and public.has_admin_role(tenant_id)
  );
