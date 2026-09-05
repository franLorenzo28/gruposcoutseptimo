-- Append-only security audit for backend-owned authentication flows.
begin;

create table public.app_auth_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_type text not null check (length(event_type) between 3 and 80),
  success boolean not null,
  subject_user_id uuid references public.app_users(id) on delete set null,
  identifier_hash text check (identifier_hash is null or identifier_hash ~ '^[a-f0-9]{64}$'),
  request_id text,
  ip_address inet,
  user_agent text,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object')
);

create index app_auth_audit_events_occurred_idx
  on public.app_auth_audit_events(occurred_at desc);
create index app_auth_audit_events_subject_idx
  on public.app_auth_audit_events(subject_user_id, occurred_at desc)
  where subject_user_id is not null;

alter table public.app_auth_audit_events enable row level security;
revoke all on table public.app_auth_audit_events from public, anon, authenticated;
grant select, insert on table public.app_auth_audit_events to service_role;

comment on table public.app_auth_audit_events is
  'Server-only authentication audit. Secrets and raw email addresses must never be stored here.';

commit;
