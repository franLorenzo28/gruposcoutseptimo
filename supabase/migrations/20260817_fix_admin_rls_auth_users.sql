-- Fix "permission denied for table users" — replace admin RLS policies
-- that query auth.users directly with the is_admin_from_profile() helper
-- (which reads public.profiles instead, avoiding the permission error).

begin;

-- ── groups ──────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can view all groups" ON public.groups;

CREATE POLICY "admin_select_groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (public.is_admin_from_profile());

-- ── group_messages ──────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can view all group_messages" ON public.group_messages;

CREATE POLICY "admin_select_group_messages"
  ON public.group_messages FOR SELECT
  TO authenticated
  USING (public.is_admin_from_profile());

-- ── threads ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can view all threads" ON public.threads;

CREATE POLICY "admin_select_threads"
  ON public.threads FOR SELECT
  TO authenticated
  USING (public.is_admin_from_profile());

-- ── thread_comments ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admin can view all thread_comments" ON public.thread_comments;

CREATE POLICY "admin_select_thread_comments"
  ON public.thread_comments FOR SELECT
  TO authenticated
  USING (public.is_admin_from_profile());

commit;
