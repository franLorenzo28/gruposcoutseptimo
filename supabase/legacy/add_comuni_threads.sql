-- add_comuni_threads.sql
-- Idempotent creation of threads, thread_comments tables, and storage bucket/policies for thread images

-- Enable required extension
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION pgcrypto;
  END IF;
END $$;

-- threads table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'threads'
  ) THEN
    CREATE TABLE public.threads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 5000),
      image_url text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX threads_created_at_idx ON public.threads (created_at DESC);
    CREATE INDEX threads_author_id_idx ON public.threads (author_id);
  END IF;
END $$;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger to update updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'threads_set_updated_at'
  ) THEN
    CREATE TRIGGER threads_set_updated_at
      BEFORE UPDATE ON public.threads
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- thread_comments table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'thread_comments'
  ) THEN
    CREATE TABLE public.thread_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
      author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content text NOT NULL CHECK (char_length(trim(content)) > 0 AND char_length(content) <= 2000),
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX thread_comments_thread_id_idx ON public.thread_comments (thread_id);
    CREATE INDEX thread_comments_created_at_idx ON public.thread_comments (created_at);
  END IF;
END $$;

-- RLS
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for threads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads') THEN
    -- No-op; we'll (re)create with IF NOT EXISTS guards below
    NULL;
  END IF;
END $$;

-- READ threads: any authenticated user
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'threads_read_auth'
  ) THEN
    CREATE POLICY threads_read_auth ON public.threads
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- INSERT threads: only self author
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'threads_insert_self'
  ) THEN
    CREATE POLICY threads_insert_self ON public.threads
      FOR INSERT TO authenticated
      WITH CHECK (author_id = auth.uid());
  END IF;
END $$;

-- UPDATE threads: only author
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'threads_update_author'
  ) THEN
    CREATE POLICY threads_update_author ON public.threads
      FOR UPDATE TO authenticated
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
END $$;

-- DELETE threads: only author
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'threads' AND policyname = 'threads_delete_author'
  ) THEN
    CREATE POLICY threads_delete_author ON public.threads
      FOR DELETE TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

-- Policies for thread_comments
-- READ comments: any authenticated user (limited by thread visibility; all threads are readable by auth users)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'thread_comments' AND policyname = 'thread_comments_read_auth'
  ) THEN
    CREATE POLICY thread_comments_read_auth ON public.thread_comments
      FOR SELECT TO authenticated
      USING (true);
  END IF;
END $$;

-- INSERT comments: only self author
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'thread_comments' AND policyname = 'thread_comments_insert_self'
  ) THEN
    CREATE POLICY thread_comments_insert_self ON public.thread_comments
      FOR INSERT TO authenticated
      WITH CHECK (author_id = auth.uid());
  END IF;
END $$;

-- DELETE/UPDATE comments: only comment author
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'thread_comments' AND policyname = 'thread_comments_update_author'
  ) THEN
    CREATE POLICY thread_comments_update_author ON public.thread_comments
      FOR UPDATE TO authenticated
      USING (author_id = auth.uid())
      WITH CHECK (author_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'thread_comments' AND policyname = 'thread_comments_delete_author'
  ) THEN
    CREATE POLICY thread_comments_delete_author ON public.thread_comments
      FOR DELETE TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

-- STORAGE: bucket for thread images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'thread-images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('thread-images', 'thread-images', true);
  END IF;
END $$;

-- Storage policies for thread-images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'thread_images_public_read'
  ) THEN
    CREATE POLICY thread_images_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'thread-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'thread_images_write_auth'
  ) THEN
    CREATE POLICY thread_images_write_auth ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'thread-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'thread_images_update_auth'
  ) THEN
    CREATE POLICY thread_images_update_auth ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'thread-images')
      WITH CHECK (bucket_id = 'thread-images');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'thread_images_delete_auth'
  ) THEN
    CREATE POLICY thread_images_delete_auth ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'thread-images');
  END IF;
END $$;
