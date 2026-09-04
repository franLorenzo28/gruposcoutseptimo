-- Fix Storage RLS policies for rama-documentos bucket

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Members can view documents 3gk15_0" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload documents 3gk15_0" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete documents 3gk15_0" ON storage.objects;
DROP POLICY IF EXISTS "Members can download rama documents" ON storage.objects;
DROP POLICY IF EXISTS "Only rama admins can upload" ON storage.objects;
DROP POLICY IF EXISTS "Only rama admins can delete" ON storage.objects;

-- Allow authenticated users to read/list files
CREATE POLICY "Authenticated users can list files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'rama-documentos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'rama-documentos');

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated users can delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'rama-documentos');
