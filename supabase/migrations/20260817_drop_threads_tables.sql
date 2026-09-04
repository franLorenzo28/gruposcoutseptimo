-- Drop threads and thread_comments tables completely.
-- Removes tables, RLS policies, indexes, triggers, and storage bucket.

begin;

-- ── Drop triggers ───────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS threads_set_updated_at ON public.threads;

-- ── Drop policies ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS threads_read_auth ON public.threads;
DROP POLICY IF EXISTS threads_insert_self ON public.threads;
DROP POLICY IF EXISTS threads_update_author ON public.threads;
DROP POLICY IF EXISTS threads_delete_author ON public.threads;
DROP POLICY IF EXISTS threads_delete_author_or_admin ON public.threads;
DROP POLICY IF EXISTS "Admin can view all threads" ON public.threads;
DROP POLICY IF EXISTS admin_select_threads ON public.threads;

DROP POLICY IF EXISTS thread_comments_read_auth ON public.thread_comments;
DROP POLICY IF EXISTS thread_comments_insert_self ON public.thread_comments;
DROP POLICY IF EXISTS thread_comments_update_author ON public.thread_comments;
DROP POLICY IF EXISTS thread_comments_delete_author ON public.thread_comments;
DROP POLICY IF EXISTS "Admin can view all thread_comments" ON public.thread_comments;
DROP POLICY IF EXISTS admin_select_thread_comments ON public.thread_comments;

-- ── Drop tables (CASCADE removes indexes and FKs) ──────────────────────────

DROP TABLE IF EXISTS public.thread_comments CASCADE;
DROP TABLE IF EXISTS public.threads CASCADE;

-- ── Remove from Realtime publication ────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'threads' AND relnamespace = 'public'::regnamespace) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.threads;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'thread_comments' AND relnamespace = 'public'::regnamespace) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.thread_comments;
  END IF;
END
$$;

-- ── Drop storage policies ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "thread_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "thread_images_write_auth" ON storage.objects;
DROP POLICY IF EXISTS "thread_images_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "thread_images_delete_auth" ON storage.objects;

commit;
