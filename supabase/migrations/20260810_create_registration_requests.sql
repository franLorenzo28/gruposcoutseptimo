-- Create registration_requests table for admin-approved registrations
-- This table stores registration requests BEFORE users are created in auth.users

CREATE TABLE IF NOT EXISTS registration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  tipo_relacion TEXT NOT NULL DEFAULT 'scout',
  rama TEXT,
  nombre_scout_relacionado TEXT,
  provider TEXT DEFAULT 'email',
  provider_id TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  
  admin_notes TEXT,
  
  metadata JSONB DEFAULT '{}'
);

-- RLS - allow inserts and selects
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Allow anon to create requests
CREATE POLICY "Anyone can insert registration_requests"
ON registration_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anon to read requests (for checking status)
CREATE POLICY "Anyone can read registration_requests"
ON registration_requests FOR SELECT
TO anon, authenticated
USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_registration_requests_status 
ON registration_requests(status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_registration_requests_email 
ON registration_requests(email);