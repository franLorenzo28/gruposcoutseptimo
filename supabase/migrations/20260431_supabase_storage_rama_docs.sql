-- Create rama-documentos bucket with RLS policies for production
INSERT INTO storage.buckets (id, name, public, created_at, updated_at, owner, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'rama-documentos',
  'rama-documentos',
  false,
  now(),
  now(),
  NULL,
  false,
  52428800,  -- 50MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv', 'image/jpeg', 'image/png', 'image/webp', 'application/zip']
) ON CONFLICT (id) DO NOTHING;
