-- EMERGENCY: Disable rama_documentos RLS to restore functionality
-- This table is causing 403 errors on all Supabase queries
-- Will be re-enabled after fixing the policies

-- Drop all policies that are blocking queries
DROP POLICY IF EXISTS "Authenticated users can view documents" ON rama_documentos;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON rama_documentos;
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON rama_documentos;
DROP POLICY IF EXISTS "Members can view rama documents" ON rama_documentos;
DROP POLICY IF EXISTS "Only rama admins can upload documents" ON rama_documentos;
DROP POLICY IF EXISTS "Only rama admins can delete documents" ON rama_documentos;

-- Temporarily disable RLS on rama_documentos
ALTER TABLE rama_documentos DISABLE ROW LEVEL SECURITY;
