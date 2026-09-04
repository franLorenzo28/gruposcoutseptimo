-- Simplify rama_documentos RLS policies to allow authenticated operations

-- Drop restrictive policies
DROP POLICY IF EXISTS "Members can view rama documents" ON rama_documentos;
DROP POLICY IF EXISTS "Only rama admins can upload documents" ON rama_documentos;
DROP POLICY IF EXISTS "Only rama admins can delete documents" ON rama_documentos;

-- Create simple permissive policies for authenticated users
CREATE POLICY "Authenticated users can view documents"
  ON rama_documentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON rama_documentos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON rama_documentos
  FOR DELETE
  TO authenticated
  USING (true);
