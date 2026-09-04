-- Bucket y policies para audios del cancionero
-- Objetivo:
-- 1) Lectura publica de audios
-- 2) Escritura solo para usuarios admin (profiles.rol_adulto = 'admin')

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'cancionero-audios'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('cancionero-audios', 'cancionero-audios', true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'cancionero_audios_public_read'
  ) THEN
    CREATE POLICY cancionero_audios_public_read
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'cancionero-audios');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'cancionero_audios_admin_insert'
  ) THEN
    CREATE POLICY cancionero_audios_admin_insert
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'cancionero-audios'
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND LOWER(COALESCE(p.rol_adulto, '')) = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'cancionero_audios_admin_update'
  ) THEN
    CREATE POLICY cancionero_audios_admin_update
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'cancionero-audios'
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND LOWER(COALESCE(p.rol_adulto, '')) = 'admin'
        )
      )
      WITH CHECK (
        bucket_id = 'cancionero-audios'
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND LOWER(COALESCE(p.rol_adulto, '')) = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'cancionero_audios_admin_delete'
  ) THEN
    CREATE POLICY cancionero_audios_admin_delete
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'cancionero-audios'
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.user_id = auth.uid()
            AND LOWER(COALESCE(p.rol_adulto, '')) = 'admin'
        )
      );
  END IF;
END $$;
