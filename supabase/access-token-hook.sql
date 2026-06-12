-- ============================================================
-- MW Transport Service — Custom Access Token Hook
-- ------------------------------------------------------------
-- Schreibt `role` (und `tenant_id`) des Users in die JWT-Claims unter
-- app_metadata, sodass sie serverseitig ohne DB-Query verfügbar sind
-- (supabase.auth.getUser().app_metadata.role). Damit kommt die Next.js-
-- Middleware ohne memberships-Fallback aus.
--
-- Quelle: ein User kann mehreren Tenants/Rollen angehören — wir nehmen die
-- höchste Rolle (owner > admin > dispatcher > accounting > driver).
--
-- AKTIVIEREN (einmalig):
--   Supabase Studio → Authentication → Hooks (Beta) →
--   „Custom Access Token" → Funktion public.custom_access_token_hook wählen.
--   (oder in supabase/config.toml:
--      [auth.hook.custom_access_token]
--      enabled = true
--      uri = "pg-functions://postgres/public/custom_access_token_hook")
-- ============================================================

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims   jsonb;
  v_role   text;
  v_tenant uuid;
begin
  -- Höchstprivilegierte Rolle des Users bestimmen.
  select m.role, m.tenant_id
    into v_role, v_tenant
  from public.memberships m
  where m.user_id = (event->>'user_id')::uuid
  order by case m.role
             when 'owner'      then 0
             when 'admin'      then 1
             when 'dispatcher' then 2
             when 'accounting' then 3
             when 'driver'     then 4
             else 9
           end
  limit 1;

  claims := event->'claims';

  -- app_metadata sicher initialisieren, falls nicht vorhanden.
  if claims->'app_metadata' is null then
    claims := jsonb_set(claims, '{app_metadata}', '{}'::jsonb);
  end if;

  if v_role is not null then
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(v_role));
  end if;
  if v_tenant is not null then
    claims := jsonb_set(claims, '{app_metadata,tenant_id}', to_jsonb(v_tenant));
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- Nur der Auth-Server darf den Hook ausführen.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;

-- Der Hook liest memberships → Leserecht für den Auth-Server.
grant select on public.memberships to supabase_auth_admin;

-- Hinweis: Bestehende Sessions tragen die Claims erst nach Token-Refresh
-- bzw. Re-Login. Neue Logins haben role/tenant_id sofort im JWT.
