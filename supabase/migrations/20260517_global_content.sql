-- Global content store: per-admin shared content for sections that appear
-- on every dealroom (About, Steps, Packages, Final-CTA, etc.).
-- One row per admin; JSONB shape is documented in src/lib/global-content.ts.

create table if not exists global_content (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references admin_users(id) on delete cascade unique,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists global_content_admin_id_idx on global_content(admin_id);

-- Service-role only (no RLS, matches existing pattern for the dealroom-app phase).
alter table global_content disable row level security;
