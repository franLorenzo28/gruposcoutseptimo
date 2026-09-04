-- 20260408_add_narrativas.sql
-- Crear tabla narrativas para relatos históricos

-- Enable required extension
DO $$ BEGIN
  PERFORM 1 FROM pg_extension WHERE extname = 'pgcrypto';
  IF NOT FOUND THEN
    CREATE EXTENSION pgcrypto;
  END IF;
END $$;

-- narrativas table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'narrativas'
  ) THEN
    CREATE TABLE public.narrativas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      titulo text NOT NULL CHECK (char_length(trim(titulo)) >= 5 AND char_length(titulo) <= 200),
      year_section text NOT NULL CHECK (char_length(trim(year_section)) >= 4 AND char_length(year_section) <= 20),
      bloques jsonb NOT NULL,
      autor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      fecha_publicacion timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX narrativas_year_section_idx ON public.narrativas (year_section);
    CREATE INDEX narrativas_created_at_idx ON public.narrativas (created_at DESC);
    CREATE INDEX narrativas_autor_id_idx ON public.narrativas (autor_id);
  END IF;
END $$;

-- Function to update updated_at if not exists
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
    SELECT 1 FROM pg_trigger WHERE tgname = 'narrativas_set_updated_at'
  ) THEN
    CREATE TRIGGER narrativas_set_updated_at
      BEFORE UPDATE ON public.narrativas
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- RLS Policies for narrativas
ALTER TABLE public.narrativas ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view narrativas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'narrativas' AND policyname = 'Narrativas are viewable by anyone'
  ) THEN
    CREATE POLICY "Narrativas are viewable by anyone"
    ON public.narrativas FOR SELECT
    USING (true);
  END IF;
END $$;

-- Policy: Only admins can insert narrativas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'narrativas' AND policyname = 'Only admins can create narrativas'
  ) THEN
    CREATE POLICY "Only admins can create narrativas"
    ON public.narrativas FOR INSERT
    WITH CHECK (
      auth.uid() = autor_id
    );
  END IF;
END $$;

-- Policy: Authors can update narrativas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'narrativas' AND policyname = 'Authors and admins can update narrativas'
  ) THEN
    CREATE POLICY "Authors and admins can update narrativas"
    ON public.narrativas FOR UPDATE
    USING (
      auth.uid() = autor_id
    )
    WITH CHECK (
      auth.uid() = autor_id
    );
  END IF;
END $$;

-- Policy: Authors can delete narrativas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'narrativas' AND policyname = 'Authors and admins can delete narrativas'
  ) THEN
    CREATE POLICY "Authors and admins can delete narrativas"
    ON public.narrativas FOR DELETE
    USING (
      auth.uid() = autor_id
    );
  END IF;
END $$;
