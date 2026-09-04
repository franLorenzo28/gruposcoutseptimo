-- Fix "permission denied for table users" on group detail pages.
-- PostgREST / Realtime tries to resolve FKs pointing at auth.users(id),
-- which requires superuser privileges.  Solution: drop those FK constraints
-- and replace them with plain indexes (no referential integrity on auth.users).

begin;

-- ── 1. Drop FK constraints that reference auth.users ─────────────────────────

ALTER TABLE IF EXISTS public.groups
  DROP CONSTRAINT IF EXISTS groups_creator_id_fkey;

ALTER TABLE IF EXISTS public.group_members
  DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

ALTER TABLE IF EXISTS public.group_messages
  DROP CONSTRAINT IF EXISTS group_messages_sender_id_fkey;

-- ── 2. Recreate as plain indexes (existing idx_ indexes cover some of these;
--    add any that are missing) ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_groups_creator_id
  ON public.groups (creator_id);

-- idx_group_members_user_id and idx_group_messages_sender_id are created in
-- add_groups_system.sql but the FK drop doesn't remove them; ensure they exist
-- anyway for idempotency.
CREATE INDEX IF NOT EXISTS idx_group_members_user_id
  ON public.group_members (user_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id
  ON public.group_messages (sender_id);

-- ── 3. Add tables to supabase_realtime publication ──────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime'
      AND pr.prrelid = 'public.group_messages'::regclass
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    WHERE p.pubname = 'supabase_realtime'
      AND pr.prrelid = 'public.group_members'::regclass
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;
END
$$;

-- ── 4. GRANTs so PostgREST can access the tables ────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_messages  TO authenticated;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

commit;
