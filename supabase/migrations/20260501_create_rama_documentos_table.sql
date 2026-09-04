-- Create rama_documentos table in Supabase PostgreSQL
-- This mirrors the SQLite table used by the Express backend

CREATE TABLE IF NOT EXISTS public.rama_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rama VARCHAR NOT NULL,
  nombre VARCHAR NOT NULL,
  original_filename VARCHAR NOT NULL,
  mime_type VARCHAR NOT NULL,
  tamaño BIGINT NOT NULL,
  storage_path VARCHAR NOT NULL,
  subido_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rama CHECK (rama IN ('lobatos', 'tropa', 'pioneros', 'rover'))
);

-- Enable RLS
ALTER TABLE public.rama_documentos ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view documents (mentoring feature)
CREATE POLICY "public_can_read_rama_documentos"
  ON public.rama_documentos FOR SELECT
  TO public
  USING (true);

-- Policy: Only educators/admins can insert
CREATE POLICY "educators_can_insert_rama_documentos"
  ON public.rama_documentos FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Check if user is educator or admin
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND (p.rol_adulto::TEXT = '1' OR p.rama_que_educa IS NOT NULL)
    )
  );

-- Policy: Only document uploader or admins can delete
CREATE POLICY "educators_can_delete_rama_documentos"
  ON public.rama_documentos FOR DELETE
  TO authenticated
  USING (
    subido_por = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.rol_adulto::TEXT = '1'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_rama_documentos_rama ON public.rama_documentos(rama);
CREATE INDEX IF NOT EXISTS idx_rama_documentos_created_at ON public.rama_documentos(created_at DESC);
