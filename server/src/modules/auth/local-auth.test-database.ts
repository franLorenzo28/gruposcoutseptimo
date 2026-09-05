import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// A minimal pre-migration schema exercises PostgreSQL constraints, grants,
// functions and transactions. It is not a substitute for a restored staging DB.
const fixture = `
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz,
    raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz default now());
  create table public.profiles (id uuid default gen_random_uuid(),
    user_id uuid primary key references auth.users(id) on delete cascade,
    email text, nombre_completo text, username text unique, avatar_url text, telefono text,
    descripcion_personal text, profesion_ocupacion text, fecha_nacimiento date, edad integer,
    patrulla text, seisena text, adelanto text, equipo_pioneros text, comunidad_rovers text,
    promesa boolean, ppp_url text, is_public boolean default true,
    privacy_preferences jsonb default '{}'::jsonb, notification_preferences jsonb default '{}'::jsonb,
    rol_adulto text, rama_que_educa text, account_status text, account_classification text,
    email_verified boolean default false, account_review_reason text,
    created_at timestamptz default now(), updated_at timestamptz default now());
  create table public.registration_requests (id uuid primary key default gen_random_uuid(),
    auth_user_id uuid unique references auth.users(id) on delete cascade, email text unique not null,
    nombre text not null, apellido text not null, grupo_scout text, rama text,
    nombre_scout_relacionado text, tipo_relacion text, provider text, provider_id text,
    status text, requested_at timestamptz, metadata jsonb, reviewed_at timestamptz,
    reviewed_by uuid references auth.users(id), admin_notes text);
  create table public.notifications (id uuid primary key default gen_random_uuid(),
    recipient_id uuid references auth.users(id) on delete cascade,
    actor_id uuid references auth.users(id) on delete set null,
    type text, entity_type text, entity_id text, data jsonb, created_at timestamptz);
  create table public.eventos (id uuid primary key default gen_random_uuid(), titulo text not null,
    descripcion text, fecha_inicio text not null, fecha_fin text,
    created_at timestamptz default now(), updated_at timestamptz default now());
  create table public.narrativas (id uuid primary key default gen_random_uuid(), titulo text not null,
    year_section text not null, bloques jsonb not null,
    autor_id uuid not null references auth.users(id) on delete cascade,
    fecha_publicacion timestamptz default now(), created_at timestamptz default now(),
    updated_at timestamptz default now());
  alter table profiles enable row level security;
  alter table registration_requests enable row level security;
  alter table notifications enable row level security;
  grant usage on schema public to service_role, anon, authenticated;
  grant all on all tables in schema public to service_role;
  create function public.fixture_profile_trigger() returns trigger language plpgsql as $$
    begin insert into public.profiles(user_id, email) values (new.id, new.email); return new; end;
  $$;
  create trigger on_auth_user_created after insert on auth.users
    for each row execute function public.fixture_profile_trigger();
`;

export const testAdminId = "550e8400-e29b-41d4-a716-446655440000";

export async function createLocalAuthTestDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(fixture);
  for (const name of [
    "20260905010000_create_local_auth_tables.sql",
    "20260905063132_complete_local_registration.sql",
    "20260905170600_add_local_google_oauth.sql",
    "20260905173500_add_local_auth_audit.sql",
    "20260905180000_retarget_remaining_identity_fks.sql",
  ]) {
    await db.exec(await readFile(new URL(`../../../../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  return db;
}

export async function resetLocalAuthTestDatabase(db: PGlite): Promise<void> {
  await db.exec("truncate auth.users, public.app_users cascade");
  await db.query("insert into public.app_users(id, email, email_verified_at) values ($1, 'admin@example.com', now())", [testAdminId]);
}
