-- Row Level Security: lock down all admin tables to authenticated callers.
-- API routes that need to serve unauthenticated traffic (public dealroom,
-- tracking pings, cron) keep using createServiceRoleClient() which bypasses
-- RLS by design. Everything else respects these policies.
--
-- IMPORTANT: run this AFTER you have created at least one Supabase Auth user
-- (Supabase Dashboard → Authentication → Users → Add user). If you enable
-- RLS before having an auth user, you lock yourself out of the dashboard.

-- ============================================================
-- Helper: drop existing wildcard policies if a previous migration created them
-- ============================================================
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and policyname in ('authenticated_full_access', 'public_insert_tracking')
  loop
    execute format('drop policy %I on %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  end loop;
end $$;

-- ============================================================
-- Tables that authenticated users can read + write fully.
-- This is a single-tenant app — every admin sees all data.
-- ============================================================
do $$
declare
  t text;
  tables text[] := array[
    'admin_users',
    'team_members',
    'customers',
    'dealrooms',
    'dealroom_documents',
    'references',
    'templates',
    'email_logs',
    'email_flows',
    'email_flow_logs',
    'global_content'
  ];
begin
  foreach t in array tables
  loop
    -- Only enable RLS if the table exists
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I enable row level security', t);
      execute format(
        'create policy authenticated_full_access on public.%I
         for all
         to authenticated
         using (true)
         with check (true)',
        t
      );
    end if;
  end loop;
end $$;

-- ============================================================
-- tracking_events: special-case. Public dealroom posts via service role,
-- so we do NOT need a public insert policy. Authenticated callers can read
-- for the admin Analytics + Activity pages.
-- ============================================================
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'tracking_events') then
    alter table public.tracking_events enable row level security;
    -- Allow authenticated dashboard pages to read events
    create policy authenticated_full_access on public.tracking_events
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

-- ============================================================
-- Service role bypasses RLS automatically (Supabase default).
-- No additional policy needed for createServiceRoleClient() calls.
-- ============================================================
