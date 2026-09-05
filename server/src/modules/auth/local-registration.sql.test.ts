import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// A minimal pre-migration schema exercises real PostgreSQL constraints, grants,
// functions and transactions. It is not a substitute for a restored staging DB.
const fixture = `
  create role anon; create role authenticated; create role service_role bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz,
    raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz default now());
  create table public.profiles (user_id uuid primary key references auth.users(id) on delete cascade,
    email text, nombre_completo text, username text unique, account_status text,
    account_classification text, email_verified boolean default false, account_review_reason text,
    updated_at timestamptz default now());
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
const profile = { nombre: "Ada", apellido: "Lovelace", grupo_scout: "septimo", rama: "rovers" };
const adminId = "550e8400-e29b-41d4-a716-446655440000";
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(fixture);
  for (const name of ["20260905010000_create_local_auth_tables.sql", "20260905063132_complete_local_registration.sql"]) {
    await db.exec(await readFile(new URL(`../../../../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
}, 30_000);
afterAll(async () => { await db?.close(); });
beforeEach(async () => {
  await db.exec("truncate auth.users, public.app_users cascade");
  await db.query("insert into public.app_users(id, email, email_verified_at) values ($1, 'admin@example.com', now())", [adminId]);
});

async function register(email = "ada@example.com", input: object = profile) {
  const result = await db.query<{ result: { created: boolean; user_id: string; request_id: string } }>(
    "select public.create_local_registration($1, 'hashed-password', $2::jsonb, 'verification-hash') as result", [email, JSON.stringify(input)],
  );
  return result.rows[0].result;
}

describe("local registration SQL", () => {
  it("creates the account, pending profile and request without auth.users or user-controlled roles", async () => {
    const created = await register("ADA@example.com", { ...profile, role: "admin", account_status: "activo" });
    const { rows } = await db.query<{ email: string; status: string; role: string; auth_count: number }>(`
      select u.email, p.account_status as status, u.app_metadata->>'role' as role,
        (select count(*)::int from auth.users) as auth_count
      from public.app_users u join public.profiles p on p.user_id = u.id where u.id = $1`, [created.user_id]);
    expect(rows[0]).toEqual({ email: "ada@example.com", status: "pendiente_email", role: "user", auth_count: 0 });
    expect((await db.query("select * from public.registration_requests where id = $1", [created.request_id])).rows).toHaveLength(1);
  });

  it("preserves existing UUIDs, credentials and verification tokens on duplicate registration", async () => {
    const first = await register();
    expect(await register("ADA@example.com")).toEqual({ created: false });
    expect((await db.query("select id, password_hash from public.app_users where email = 'ada@example.com'")).rows)
      .toEqual([{ id: first.user_id, password_hash: "hashed-password" }]);
  });

  it("rolls back the whole registration if the request cannot be stored", async () => {
    await expect(register("broken@example.com", { apellido: "Missing name" })).rejects.toThrow();
    expect((await db.query("select id from public.app_users where email = 'broken@example.com'")).rows).toHaveLength(0);
    expect((await db.query("select user_id from public.profiles where email = 'broken@example.com'")).rows).toHaveLength(0);
  });

  it("rejects expired verification and consumes valid tokens once while preserving pending approval", async () => {
    const created = await register();
    await db.query("update public.app_users set email_verification_expires_at = now() - interval '1 second' where id = $1", [created.user_id]);
    await expect(db.query("select public.verify_local_email('verification-hash')")).rejects.toThrow("verification_token_invalid");
    await db.query("update public.app_users set email_verification_expires_at = now() + interval '1 hour' where id = $1", [created.user_id]);
    const { rows } = await db.query<{ result: object }>("select public.verify_local_email('verification-hash') as result");
    expect(rows[0].result).toMatchObject({ success: true, userId: created.user_id, nextStatus: "pendiente_aprobacion" });
    await expect(db.query("select public.verify_local_email('verification-hash')")).rejects.toThrow("verification_token_invalid");
  });

  it("requires verified email before approval and makes repeated decisions idempotent", async () => {
    const created = await register();
    const decide = () => db.query("select public.review_local_registration($1, 'approve', $2, null)", [created.request_id, adminId]);
    await expect(decide()).rejects.toThrow("email_not_verified");
    await db.query("select public.verify_local_email('verification-hash')");
    await decide();
    await decide();
    expect((await db.query("select account_status from public.profiles where user_id = $1", [created.user_id])).rows).toEqual([{ account_status: "activo" }]);
    expect((await db.query("select account_status from public.app_users where id = $1", [created.user_id])).rows).toEqual([{ account_status: "activo" }]);
    expect((await db.query("select id from public.notifications")).rows).toHaveLength(1);
    await expect(db.query("select public.review_local_registration($1, 'reject', $2, null)", [created.request_id, adminId])).rejects.toThrow("already_reviewed");
  });

  it("consumes a reset once and revokes every existing session atomically", async () => {
    const created = await register();
    await db.query("update public.app_users set password_reset_token_hash = 'reset-hash', password_reset_expires_at = now() + interval '1 hour' where id = $1", [created.user_id]);
    await db.query("insert into public.app_sessions(id, user_id, token_hash, expires_at) select gen_random_uuid(), $1, n::text, now() + interval '1 hour' from generate_series(1, 2) n", [created.user_id]);
    await db.query("select public.reset_local_password('reset-hash', 'new-hash')");
    await expect(db.query("select public.reset_local_password('reset-hash', 'attacker-hash')")).rejects.toThrow("password_reset_token_invalid");
    expect((await db.query("select id from public.app_sessions where revoked_at is null")).rows).toHaveLength(0);
    expect((await db.query("select password_hash from public.app_users where id = $1", [created.user_id])).rows).toEqual([{ password_hash: "new-hash" }]);
  });

  it("keeps Supabase signup compatible after retargeting the profile FK", async () => {
    const id = "550e8400-e29b-41d4-a716-446655440001";
    await db.query("insert into auth.users(id, email) values ($1, 'rollback@example.com')", [id]);
    expect((await db.query("select user_id from public.profiles where user_id = $1", [id])).rows).toHaveLength(1);
    expect((await db.query("select id from public.app_users where id = $1", [id])).rows).toHaveLength(1);
  });

  it("denies browser roles and allows server role without SECURITY DEFINER commands", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await expect(register()).rejects.toThrow("permission denied");
      await expect(db.query("select * from public.app_users")).rejects.toThrow("permission denied");
      await db.exec("reset role");
    }
    await db.exec("set role service_role");
    try { expect((await register()).created).toBe(true); }
    finally { await db.exec("reset role"); }
  });
});
